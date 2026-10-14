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
