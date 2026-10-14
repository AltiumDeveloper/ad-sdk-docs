import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { loadCategories, loadNamespaces } from '../scripts/apidocs/lib/config.mjs';

test('every namespace and sidebar area has an icon (.bc-<id> in custom.css)', () => {
  const css = readFileSync('src/css/custom.css', 'utf8');
  const missing = [];
  for (const ns of loadNamespaces()) {
    for (const id of [ns.slug, ...loadCategories(ns.id).map((c) => c.id)]) if (!css.includes(`.bc-${id} {`)) missing.push(`${ns.id}: ${id}`);
  }
  assert.deepEqual(missing, []);
});

test('every namespace shows its technical name in the sidebar (--ns-name)', () => {
  const css = readFileSync('src/css/custom.css', 'utf8');
  const missing = loadNamespaces()
    .filter((ns) => !new RegExp(`\\.bc-${ns.slug} \\{[^}]*--ns-name: "${ns.id.replace(/\./g, '\\.')}"`).test(css))
    .map((ns) => ns.id);
  assert.deepEqual(missing, []);
});
