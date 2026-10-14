#!/usr/bin/env node
// Documentation coverage, to pick what to write next: per type, whether it has a summary, how many of its members are
// described, whether it has a C# example, and how often the SDK examples use it. Types used most by the examples come
// first: they are what extension developers read. Run after `npm run apidocs`.
//
//   npm run coverage                      summary per namespace + the 25 most valuable undocumented types
//   npm run coverage -- --ns SCH --top 50 one namespace, more rows
//   npm run coverage -- --type ISch_Pin   the undocumented members of one type
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback = null) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback);
const onlyNs = opt('ns');
const top = Number(opt('top', 25));
const onlyType = opt('type');

if (!existsSync('.generated/manifest.json')) {
  console.error('coverage: run `npm run apidocs` first');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync('.generated/manifest.json', 'utf8'));
const usage = existsSync('metadata/examples-index.json') ? JSON.parse(readFileSync('metadata/examples-index.json', 'utf8')) : { types: {}, members: {} };
const withExample = new Set();
if (existsSync('examples')) {
  for (const ns of readdirSync('examples')) {
    for (const file of readdirSync(join('examples', ns))) withExample.add(`${ns}.${file.replace(/\.cs$/, '').split('.')[0]}`);
  }
}

const types = new Map();
for (const p of manifest.pages) {
  if (p.kind === 'enumValue') continue;
  const name = p.parent ?? p.name;
  const id = `${p.ns}.${name}`;
  const t = types.get(id) ?? { id, ns: p.ns, name, kind: '', route: '', summary: false, members: 0, described: 0, undescribed: [], uses: 0 };
  if (!p.parent) {
    Object.assign(t, { kind: p.kind, route: p.route, summary: Boolean(p.summary) });
    t.uses += usage.types[id]?.length ?? 0;
  } else {
    t.members += 1;
    if (p.summary) t.described += 1;
    else t.undescribed.push(p.name);
  }
  types.set(id, t);
}
for (const [key, refs] of Object.entries(usage.members)) {
  const id = key.slice(0, key.lastIndexOf('.'));
  if (types.has(id)) types.get(id).uses += refs.length;
}

if (onlyType) {
  const t = [...types.values()].find((x) => x.name === onlyType || x.id === onlyType);
  if (!t) {
    console.error(`coverage: no type ${onlyType}`);
    process.exit(1);
  }
  console.log(`${t.id} (${t.kind}): summary ${t.summary ? 'yes' : 'no'}, ${t.described}/${t.members} members described, example ${withExample.has(t.id) ? 'yes' : 'no'}`);
  console.log(`Page: ${t.route}   Descriptions: content/${t.ns}/${t.name.replace(/<.*$/, '')}.yaml`);
  if (t.undescribed.length) console.log(`Members without a description (${t.undescribed.length}):\n  ${t.undescribed.join(', ')}`);
  process.exit(0);
}

const list = [...types.values()].filter((t) => !onlyNs || t.ns === onlyNs);
const byNs = new Map();
for (const t of list) {
  const s = byNs.get(t.ns) ?? { types: 0, summaries: 0, members: 0, described: 0, examples: 0 };
  s.types += 1;
  s.summaries += t.summary ? 1 : 0;
  s.members += t.members;
  s.described += t.described;
  s.examples += withExample.has(t.id) ? 1 : 0;
  byNs.set(t.ns, s);
}
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '-');
console.log('| Namespace | Types with a summary | Members described | Types with an example |');
console.log('| --- | --- | --- | --- |');
for (const [ns, s] of byNs) console.log(`| ${ns} | ${s.summaries}/${s.types} (${pct(s.summaries, s.types)}) | ${s.described}/${s.members} (${pct(s.described, s.members)}) | ${s.examples} |`);

const gaps = list.filter((t) => !t.summary || t.described < t.members)
  .sort((a, b) => b.uses - a.uses || (b.members - b.described) - (a.members - a.described));
console.log(`\nMost valuable gaps (by use in the SDK examples, then undocumented members), top ${top}:\n`);
console.log('| Type | Summary | Members described | Example | Uses in SDK examples |');
console.log('| --- | --- | --- | --- | --- |');
for (const t of gaps.slice(0, top)) {
  console.log(`| ${t.id} | ${t.summary ? 'yes' : '**no**'} | ${t.described}/${t.members} | ${withExample.has(t.id) ? 'yes' : 'no'} | ${t.uses} |`);
}
