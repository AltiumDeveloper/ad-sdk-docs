#!/usr/bin/env node
// LLM surface, written into build/ after `npm run build`:
//   build/llms.txt                       site index: guides, namespaces
//   build/reference/<ns>/llms.txt        namespace index: every type with its summary, by area
//   build/reference/<ns>/api.cs.txt      the namespace as compact C# declarations with /// summaries
//   <route>.md next to every page        Markdown twin (see src/theme/markdownRoute.ts)
// Reads only public inputs: the generated pages, the guides, .generated/manifest.json and config/*.yaml.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { parse } from 'yaml';
import { categoryOf, loadCategories, loadHidden, loadNamespaces } from './lib/config.mjs';
import { buildModel } from './lib/model.mjs';
import { methodSignature, typeParameterList, whereClauses } from './lib/render.mjs';

const BUILD = process.argv[2] ?? 'build';
const site = parse(readFileSync('config/site.yaml', 'utf8'));
const absolute = (route) => `${site.url}${site.baseUrl.replace(/\/$/, '')}${route}`;
if (!existsSync(BUILD)) {
  console.error(`llms: ${BUILD}/ not found; run npm run build first`);
  process.exit(1);
}

const stripFrontMatter = (text) => text.replace(/^---\n[\s\S]*?\n---\n/, '');
const frontMatter = (text) => {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  return m ? parse(m[1]) ?? {} : {};
};

// Relative `.md`/`.mdx` links → absolute `.md` URLs of the twins; `pathname:///x` → absolute URL.
function absoluteLinks(markdown, fileRoute) {
  return markdown
    .replace(/\]\((?:pathname:\/\/)?(\/[^)\s]*)\)/g, (_, path) => `](${absolute(path)})`)
    .replace(/\]\((\.{1,2}\/[^)\s#]+?)\.mdx?(#[^)\s]*)?\)/g, (_, path, hash = '') => {
      const route = posix.normalize(posix.join(posix.dirname(fileRoute), path)).replace(/\/index$/, '');
      return `](${absolute(`${route === '/' ? '/index' : route}.md`)}${hash})`;
    });
}

let twins = 0;
const writeTwin = (route, markdown) => {
  const path = join(BUILD, `${route === '/' ? '/index' : route}.md`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, markdown);
  twins += 1;
};

// Guides and home page (MDX without JSX, so the source is the Markdown).
const guides = [];
for (const [file, route] of [['docs/index.mdx', '/'], ...readdirSync('docs/guides').filter((n) => /\.mdx?$/.test(n)).sort()
  .map((n) => [`docs/guides/${n}`, `/guides/${n.replace(/\.mdx?$/, '')}`])]) {
  const text = readFileSync(file, 'utf8');
  const fm = frontMatter(text);
  writeTwin(route, absoluteLinks(stripFrontMatter(text), route === '/' ? '/index' : route));
  if (route !== '/') guides.push({ route, title: fm.title, description: fm.description, position: fm.sidebar_position ?? 99 });
}
guides.sort((a, b) => a.position - b.position);

// Reference pages.
function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (name.endsWith('.md')) files.push(full);
  }
  return files;
}
for (const file of walk('docs/reference')) {
  const rel = relative('docs', file).split(sep).join('/').replace(/\.md$/, '');
  const route = `/${rel.replace(/\/index$/, '')}`;
  writeTwin(route, absoluteLinks(stripFrontMatter(readFileSync(file, 'utf8')), `/${rel}`));
}

// Indexes and declaration files.
const manifest = JSON.parse(readFileSync('.generated/manifest.json', 'utf8'));
const namespaces = loadNamespaces();
const model = buildModel({ metadataPaths: [...new Set(namespaces.flatMap((n) => n.metadata))], namespaces: namespaces.map((n) => n.id), hidden: loadHidden() });
const summaries = new Map(manifest.pages.filter((p) => !p.parent).map((p) => [`${p.ns}.${p.name}`, p.summary]));
const memberSummaries = new Map(manifest.pages.filter((p) => p.parent).map((p) => [`${p.ns}.${p.parent}.${p.name}`, p.summary]));

const llms = [
  `# ${site.title}`,
  '',
  `> ${site.tagline}. Extensions are C# class libraries referencing Altium.SDK.Interfaces.dll (the API) and Altium.SDK.dll (hosting classes and entry points such as SCH.GlobalVars.SchServer).`,
  '',
  'Every page has a Markdown version at its URL plus `.md`. Each namespace has an index (`llms.txt`) and its whole API as compact C# declarations (`api.cs.txt`).',
  '',
  '## Guides',
  '',
  ...guides.map((g) => `- [${g.title}](${absolute(`${g.route}.md`)}): ${g.description ?? ''}`),
  '',
  '## Namespaces',
  '',
  ...manifest.namespaces.map((ns) => `- [${ns.label}](${absolute(`/reference/${ns.slug}/llms.txt`)}): ${ns.description} Declarations: ${absolute(`/reference/${ns.slug}/api.cs.txt`)}`),
  '',
  '## Optional',
  '',
  `- [SDK examples](${site.examples.repo}): complete example extensions.`,
  '',
];
writeFileSync(join(BUILD, 'llms.txt'), llms.join('\n'));

const oneLine = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();
const short = (type) => String(type).replace(/\b(?:[A-Za-z_]\w*\.)+([A-Za-z_]\w*)/g, '$1').replace(/\bNullable<([^<>]+)>/g, '$1?');
for (const ns of namespaces) {
  const types = [...model.types.values()].filter((t) => t.namespace === ns.id).sort((a, b) => a.name.localeCompare(b.name));
  const categories = loadCategories(ns.id);
  const catOf = (t) => categoryOf(t, categories);
  const index = [`# ${ns.label} namespace`, '', `> ${ns.description}`, '', `All declarations: ${absolute(`/reference/${ns.slug}/api.cs.txt`)}`, ''];
  for (const c of categories) {
    const inCat = types.filter((t) => catOf(t) === c.id);
    if (!inCat.length) continue;
    index.push(`## ${c.title}`, '');
    for (const t of inCat) {
      const route = `/reference/${ns.slug}/${t.file}`;
      index.push(`- [${t.name}](${absolute(`${route}.md`)})${summaries.get(t.id) ? `: ${oneLine(summaries.get(t.id))}` : ''}`);
    }
    index.push('');
  }
  const dir = join(BUILD, 'reference', ns.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'llms.txt'), index.join('\n'));

  const cs = [`// ${site.title}: namespace ${ns.id} (${ns.title}). Generated from ${model.assemblies.map((a) => `${a.name} ${a.version}`).join(', ')}.`,
    '// Properties are accessor method pairs (GetState_X / SetState_X); members marked [helper] are extension methods of the',
    `// type's *Helper class (using ${ns.id};). Reference: ${absolute(`/reference/${ns.slug}`)}`, '', `namespace ${ns.id}`, '{'];
  const doc = (text, indent) => (text ? [`${indent}/// ${oneLine(text)}`] : []);
  for (const t of types) {
    cs.push(...doc(summaries.get(t.id), '    '));
    if (t.kind === 'interface') {
      cs.push(`    public interface ${t.name}${t.bases.length ? ` : ${t.bases.map(short).join(', ')}` : ''}`, '    {');
      for (const m of t.members) {
        cs.push(...doc(memberSummaries.get(`${t.id}.${m.name}`), '        '));
        if (m.kind === 'property') {
          const index = m.indexParameters.length ? `[${m.indexParameters.map((p) => `${short(p.type)} ${p.name}`).join(', ')}]` : '';
          const acc = [m.getter && `get => ${m.getter.name}`, m.setter && `set => ${m.setter.name}`].filter(Boolean).join('; ');
          const helper = (m.getter?.extension || m.setter?.extension) ? ' [helper]' : '';
          cs.push(`        ${short(m.type)} ${m.name}${index} { ${acc}; }${helper}`);
        } else {
          cs.push(`        ${methodSignature(m.signature)}${m.signature.extension ? ' // [helper]' : ''}`);
          if (m.signature.alternate) cs.push(`        ${methodSignature(m.signature.alternate)}`);
        }
      }
      cs.push('    }', '');
    } else if (t.kind === 'enum') {
      cs.push(`    public enum ${t.name} { ${t.values.map((v) => `${v.name} = ${v.value}`).join(', ')} }`, '');
    } else if (t.kind === 'delegate') {
      if (t.signature) cs.push(`    public delegate ${methodSignature(t.signature, { name: t.name })}`, '');
    } else {
      const parts = [
        ...t.fields.map((f) => `${f.isStatic ? 'static ' : ''}${short(f.type)} ${f.name}${f.value !== null && f.value !== undefined ? ` = ${JSON.stringify(f.value)}` : ''};`),
        ...t.properties.map((p) => `${p.isStatic ? 'static ' : ''}${short(p.type)} ${p.name} { ${p.canRead ? 'get; ' : ''}${p.canWrite ? 'set; ' : ''}}`),
        ...t.methods.map((m) => `${m.isStatic ? 'static ' : ''}${methodSignature(m)}`),
      ];
      const bases = [t.baseType, ...(t.interfaces ?? [])].filter(Boolean).map(short);
      const g = t.genericParameters ?? [];
      const head = `${t.name.replace(/<.*$/, '').replace(/\./g, '_')}${typeParameterList(g, { variance: true })}`;
      cs.push(`    public ${t.kind} ${head}${bases.length ? ` : ${bases.join(', ')}` : ''}${whereClauses(g)} { ${parts.join(' ')} }`, '');
    }
  }
  cs.push('}', '');
  writeFileSync(join(dir, 'api.cs.txt'), cs.join('\n'));
  const size = statSync(join(dir, 'api.cs.txt')).size;
  console.log(`llms: ${ns.id} api.cs.txt ${(size / 1024).toFixed(0)} KiB (~${Math.round(size / 4 / 1000)}k tokens)`);
}
console.log(`llms: llms.txt, ${namespaces.length} namespace indexes, ${twins} Markdown twins -> ${BUILD}/`);
