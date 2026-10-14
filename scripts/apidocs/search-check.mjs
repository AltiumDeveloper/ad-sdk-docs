#!/usr/bin/env node
// After `npm run build`: every search record must point at a built page, and its `#anchor` at a heading id on that
// page. The generator computes member anchors itself (github-slugger, like Docusaurus), so this catches any drift.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BUILD = process.argv[2] ?? 'build';
const index = JSON.parse(readFileSync(join(BUILD, 'search-index.json'), 'utf8'));
const idsByPage = new Map();
const idsOf = (route) => {
  if (!idsByPage.has(route)) {
    const file = join(BUILD, route.replace(/\/$/, ''), 'index.html');
    const alt = join(BUILD, `${route.replace(/\/$/, '')}.html`);
    const path = existsSync(file) ? file : existsSync(alt) ? alt : route === '/' ? join(BUILD, 'index.html') : null;
    idsByPage.set(route, path ? new Set([...readFileSync(path, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])) : null);
  }
  return idsByPage.get(route);
};
const problems = [];
for (const record of index.records) {
  const [route, anchor] = record.u.split('#');
  const ids = idsOf(route);
  if (!ids) problems.push(`${record.k} ${record.p ? `${record.p}.` : ''}${record.n}: no page ${route}`);
  else if (anchor && !ids.has(anchor)) problems.push(`${record.k} ${record.p ? `${record.p}.` : ''}${record.n}: no #${anchor} on ${route}`);
}
if (problems.length) {
  console.error(`search-check: ${problems.length} broken record(s):\n  ${problems.slice(0, 40).join('\n  ')}`);
  process.exit(1);
}
console.log(`search-check: ${index.records.length} records, all pages and anchors exist`);
