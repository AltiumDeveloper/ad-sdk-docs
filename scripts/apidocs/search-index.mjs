#!/usr/bin/env node
// Writes static/search-index.json for src/theme/SearchBar (ranking: src/search/engine.mjs). Runs after generate.mjs:
// reads .generated/manifest.json, the guides and config/search.yaml.
//
// Record shape (short keys keep the index small): i id (= array index), n name, k kind (engine KINDS), p parent type
// (members), c namespace index (into `contexts`), u url (without baseUrl), d description, s signature (type),
// t page title (guides), a aliases (accessor method names of a property).
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parse } from 'yaml';

const require = createRequire(import.meta.url);
const GithubSlugger = require('github-slugger');

const DESCRIPTION_LIMIT = 600;
const MEMBER_DESCRIPTION_LIMIT = 300;
const GUIDE_TEXT_LIMIT = 1500;

const clip = (text, limit) => {
  const plain = String(text ?? '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]+/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > limit ? `${plain.slice(0, limit - 1).trimEnd()}…` : plain;
};

export function readFrontMatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  return match ? parse(match[1]) ?? {} : {};
}

// Guide sections: the page itself plus one record per `##` heading, with the anchor Docusaurus generates.
export function guideRecords(docsDir = 'docs') {
  const files = [];
  const home = join(docsDir, 'index.mdx');
  if (existsSync(home)) files.push({ path: home, route: '/' });
  const guides = join(docsDir, 'guides');
  if (existsSync(guides)) {
    for (const name of readdirSync(guides).filter((n) => /\.mdx?$/.test(n)).sort()) {
      files.push({ path: join(guides, name), route: `/guides/${name.replace(/\.mdx?$/, '')}` });
    }
  }
  const records = [];
  for (const { path, route } of files) {
    const text = readFileSync(path, 'utf8');
    const front = readFrontMatter(text);
    const body = text.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/```[\s\S]*?```/g, ' ');
    const sections = body.split(/^## /m);
    const title = front.title ?? route;
    records.push({ n: title, k: 'guide', u: route, t: title, d: clip(front.description ?? sections[0].replace(/^# .*$/m, ''), GUIDE_TEXT_LIMIT) });
    const slugger = new GithubSlugger();
    for (const section of sections.slice(1)) {
      const [heading, ...rest] = section.split('\n');
      records.push({ n: heading.trim(), k: 'guide', u: `${route}#${slugger.slug(heading.trim())}`, t: title, d: clip(rest.join(' '), GUIDE_TEXT_LIMIT) });
    }
  }
  return records;
}

export function runSearchIndex({ manifestPath = '.generated/manifest.json', docsDir = 'docs', out = 'static/search-index.json', configPath = 'config/search.yaml' } = {}) {
  if (!existsSync(manifestPath)) throw new Error(`search-index: ${manifestPath} not found; run node scripts/apidocs/generate.mjs first`);
  const config = existsSync(configPath) ? parse(readFileSync(configPath, 'utf8')) ?? {} : {};
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const contexts = manifest.namespaces.map((ns) => ({ id: ns.id, title: ns.label, slug: ns.slug, weight: config.contextWeights?.[ns.slug] }));
  const nsIndex = new Map(manifest.namespaces.map((ns, i) => [ns.id, i]));
  const records = [];
  const push = (record) => records.push({ i: records.length, ...Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length))) });

  for (const ns of manifest.namespaces) {
    push({ n: ns.id, k: 'overview', c: nsIndex.get(ns.id), u: `/reference/${ns.slug}`, t: ns.label, d: clip(ns.description, DESCRIPTION_LIMIT) });
  }
  for (const page of manifest.pages) {
    const member = ['property', 'method', 'enumValue'].includes(page.kind);
    push({
      n: page.name,
      k: page.kind,
      p: page.parent,
      c: nsIndex.get(page.ns),
      u: page.route,
      d: clip(page.summary, member ? MEMBER_DESCRIPTION_LIMIT : DESCRIPTION_LIMIT),
      s: page.signature ? page.signature.replace(/\b(?:[A-Za-z_]\w*\.)+([A-Za-z_]\w*)/g, '$1') : page.kind === 'enumValue' && page.value !== null ? `= ${page.value}` : undefined,
      a: page.aliases,
    });
  }
  for (const guide of guideRecords(docsDir)) push(guide);

  const payload = { version: 1, contexts, prefixes: config.prefixes ?? [], synonyms: config.synonyms ?? [], records };
  const json = JSON.stringify(payload);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, json);
  return { records: records.length, bytes: statSync(out).size, gzipBytes: gzipSync(json).length, payload };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const { records, bytes, gzipBytes, payload } = runSearchIndex();
  const byKind = {};
  for (const record of payload.records) byKind[record.k] = (byKind[record.k] ?? 0) + 1;
  console.log(`search-index: ${records} records, ${(bytes / 1024).toFixed(0)} KiB (${(gzipBytes / 1024).toFixed(0)} KiB gzip)`);
  console.log(`  ${Object.entries(byKind).map(([kind, count]) => `${kind} ${count}`).join(', ')}`);
}
