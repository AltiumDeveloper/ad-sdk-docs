import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const sidebars = require('../sidebars.js');

const docIds = (items) =>
  items.flatMap((item) => (typeof item === 'string' ? [item] : item.type === 'category' ? docIds(item.items) : []));

test('every guide in docs/guides is in the Guides sidebar exactly once, and nothing else is', () => {
  const guides = sidebars.docs.find((item) => item.label === 'Guides');
  const listed = docIds(guides.items);
  const files = readdirSync('docs/guides').filter((name) => /\.mdx?$/.test(name)).map((name) => `guides/${name.replace(/\.mdx?$/, '')}`);

  assert.deepEqual(listed.filter((id, i) => listed.indexOf(id) !== i), [], 'listed twice');
  assert.deepEqual(files.filter((id) => !listed.includes(id)), [], 'guides missing from sidebars.js');
  assert.deepEqual(listed.filter((id) => !files.includes(id)), [], 'sidebar entries without a guide');
});
