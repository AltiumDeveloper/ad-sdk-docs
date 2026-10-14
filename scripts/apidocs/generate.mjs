#!/usr/bin/env node
// Generates the reference: docs/reference/** (Markdown pages), .generated/sidebar.json (the Reference sidebar) and
// .generated/manifest.json (pages and model summary for search-index.mjs and llms.mjs). Inputs: metadata/*.json,
// content/<NS>/*.yaml, metadata/examples-index.json, config/*.yaml.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';
import { loadCategories, loadNamespaces } from './lib/config.mjs';
import { buildModel } from './lib/model.mjs';
import {
  firstSentence, layoutAnchors, renderNamespace, renderReferenceIndex, renderType, typeRoute,
} from './lib/render.mjs';

const OUT = 'docs/reference';
const GENERATED = '.generated';
const site = parse(readFileSync('config/site.yaml', 'utf8'));
const namespaces = loadNamespaces();
const categoriesByNs = Object.fromEntries(namespaces.map((ns) => [ns.id, loadCategories(ns.id)]));
const metadataPaths = [...new Set(namespaces.flatMap((ns) => ns.metadata))];

const model = buildModel({
  metadataPaths,
  namespaces: namespaces.map((ns) => ns.id),
  categories: [],
});
// Categories are per namespace; assign after the build.
for (const t of model.types.values()) {
  const cats = categoriesByNs[t.namespace] ?? [];
  const c = cats.find((x) => (!x.kinds || x.kinds.includes(t.kind)) && x.match.some((re) => re.test(t.name)));
  t.category = c?.id ?? (t.kind === 'enum' ? 'enums' : ['struct', 'class'].includes(t.kind) ? 'structs' : 'other');
}

// Editorial content, validated against the model so a renamed member never silently loses its text.
const content = new Map();
const problems = [];
for (const ns of namespaces) {
  const dir = join('content', ns.id);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.yaml'))) {
    const id = `${ns.id}.${name.replace(/\.yaml$/, '')}`;
    const doc = parse(readFileSync(join(dir, name), 'utf8')) ?? {};
    const type = model.types.get(id);
    if (!type) { problems.push(`content/${ns.id}/${name}: no type ${id}`); continue; }
    for (const slug of Object.keys(doc.members ?? {})) {
      if (!type.members?.some((m) => m.slug === slug)) problems.push(`content/${ns.id}/${name}: no member ${slug}`);
    }
    for (const value of Object.keys(doc.values ?? {})) {
      if (!type.values?.some((v) => v.name === value)) problems.push(`content/${ns.id}/${name}: no enum value ${value}`);
    }
    content.set(id, doc);
  }
}
if (problems.length) {
  console.error(`apidocs: ${problems.length} content entries do not match the API:\n  ${problems.slice(0, 50).join('\n  ')}`);
  process.exit(1);
}

const examples = existsSync('metadata/examples-index.json')
  ? JSON.parse(readFileSync('metadata/examples-index.json', 'utf8'))
  : { types: {}, members: {}, commit: null };

const ctx = {
  content: (id) => content.get(id) ?? {},
  editUrl: (type) => `${site.repo}/edit/${site.branch}/content/${type.namespace}/${type.name}.yaml`,
  examples,
  examplesRepo: site.examples.repo,
};

// Member anchors of every page, so links between pages can target member sections.
layoutAnchors(model, ctx);

rmSync(OUT, { recursive: true, force: true });
const write = ({ file, text }) => {
  const path = join(OUT, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};

const pages = [];
write(renderReferenceIndex(namespaces, model));
const sidebar = [];
for (const ns of namespaces) {
  const categories = categoriesByNs[ns.id];
  write(renderNamespace(model, ns, categories, ctx));
  const nsTypes = [...model.types.values()].filter((t) => t.namespace === ns.id).sort((a, b) => a.name.localeCompare(b.name));
  const items = [];
  for (const c of categories) {
    const inCat = nsTypes.filter((t) => t.category === c.id);
    if (!inCat.length) continue;
    // `bc-<area>` gives the category its icon (src/css/custom.css, "Sidebar icons").
    items.push({
      type: 'category',
      label: c.title,
      collapsed: true,
      className: `bc-${c.id}`,
      items: inCat.map((t) => ({ type: 'doc', id: docId(typeRoute(t)), label: t.name })),
    });
  }
  sidebar.push({
    type: 'category',
    label: `${ns.title} (${ns.id})`,
    collapsed: false,
    className: `bc-${ns.slug}`,
    link: { type: 'doc', id: `reference/${ns.slug}/index` },
    items,
  });

  for (const t of nsTypes) {
    write(renderType(model, t, ctx));
    const doc = ctx.content(t.id);
    pages.push({ kind: t.kind, ns: ns.id, name: t.name, route: typeRoute(t), summary: firstSentence(doc.summary, 600) });
    if (t.kind === 'enum') {
      for (const v of t.values) {
        pages.push({ kind: 'enumValue', ns: ns.id, name: v.name, parent: t.name, route: typeRoute(t), summary: doc.values?.[v.name] ?? '', value: v.value });
      }
    }
    for (const m of t.members ?? []) {
      const md = doc.members?.[m.slug] ?? {};
      pages.push({
        kind: m.kind,
        ns: ns.id,
        name: m.name,
        parent: t.name,
        route: `${typeRoute(t)}#${t.anchors.get(m.slug)}`,
        summary: firstSentence(md.summary, 300),
        aliases: m.kind === 'property' ? [m.getter?.name, m.setter?.name].filter(Boolean) : [],
        signature: m.kind === 'property' ? m.type : m.signature.returnType,
      });
    }
  }
}

mkdirSync(GENERATED, { recursive: true });
writeFileSync(join(GENERATED, 'sidebar.json'), JSON.stringify(sidebar));
writeFileSync(join(GENERATED, 'manifest.json'), JSON.stringify({
  assemblies: model.assemblies,
  namespaces: namespaces.map(({ id, title, slug, description }) => ({ id, title, slug, description })),
  pages,
}));
const byKind = {};
for (const p of pages) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1;
const described = pages.filter((p) => p.kind !== 'enumValue' && p.summary).length;
const pageCount = pages.filter((p) => !p.parent).length;
console.log(`apidocs: ${pageCount} type pages, ${pages.filter((p) => p.parent && p.kind !== 'enumValue').length} members (${described} entries described) -> ${OUT}`);
console.log(`  ${Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(', ')}`);

function docId(route) {
  return route.replace(/^\//, '');
}
