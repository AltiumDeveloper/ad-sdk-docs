#!/usr/bin/env node
// Fails when an API name is mentioned without a link:
// - generated reference pages (docs/reference/**): every recognised name in descriptions must have been linked by
//   the generator (lib/xref.mjs);
// - hand-written pages (docs/index.mdx, docs/guides/**): code spans are linked by plugins/remark-xref.mjs, so
//   plain-text mentions are the problem: write them as `code` (or as an explicit link).
// Run after `npm run apidocs`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { loadXrefIndex, unlinkedMentions } from './lib/xref.mjs';

const index = loadXrefIndex(JSON.parse(readFileSync('.generated/xref.json', 'utf8')));
const routes = new Map([...index.byId.values()].map((e) => [e.route, e]));

function files(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files(full, out);
    else if (/\.mdx?$/.test(name)) out.push(full);
  }
  return out;
}

const problems = [];
const check = (file, options) => {
  const mentions = unlinkedMentions(readFileSync(file, 'utf8'), index, options);
  if (mentions.length) problems.push(`${file}: ${[...new Set(mentions)].slice(0, 12).join(', ')}${new Set(mentions).size > 12 ? ', …' : ''}`);
};
for (const file of files('docs/reference')) {
  const route = `/${relative('docs', file).split(sep).join('/').replace(/\.md$/, '')}`;
  const current = routes.get(route) ?? null;
  check(file, { ns: current?.ns, current });
}
for (const file of [join('docs', 'index.mdx'), ...(existsSync('docs/guides') ? files('docs/guides') : [])]) {
  check(file, { codeSpansLinked: true });
}
if (problems.length) {
  console.error(`check-xrefs: ${problems.length} page(s) mention API names without a link:\n  ${problems.slice(0, 40).join('\n  ')}`);
  process.exit(1);
}
console.log('check-xrefs: every API name mentioned in prose is linked');
