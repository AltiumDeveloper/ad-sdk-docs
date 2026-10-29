import assert from 'node:assert/strict';
import { test } from 'node:test';
import { llmsFull } from '../scripts/apidocs/lib/llms-full.mjs';

const track = {
  title: 'IPCB_Track', url: 'https://altiumdeveloper.github.io/ad-sdk-docs/reference/pcb/IPCB_Track',
  namespace: 'PCB', kind: 'interface', markdown: '# IPCB_Track interface\n\nA track.\n',
};
const via = {
  title: 'IPCB_Via', url: 'https://altiumdeveloper.github.io/ad-sdk-docs/reference/pcb/IPCB_Via',
  namespace: 'PCB', kind: 'interface', markdown: '# IPCB_Via interface',
};

test('each page is its Markdown under front matter, in the format of the Altium 365 API reference', () => {
  assert.equal(llmsFull([track]), [
    '---',
    'title: "IPCB_Track"',
    'url: "https://altiumdeveloper.github.io/ad-sdk-docs/reference/pcb/IPCB_Track"',
    'namespace: "PCB"',
    'kind: "interface"',
    '---',
    '',
    '# IPCB_Track interface',
    '',
    'A track.',
    '',
  ].join('\n'));
});

test('pages follow one another in the given order, each starting on its own front matter', () => {
  const full = llmsFull([track, via]);
  assert.equal(full.match(/^---\ntitle: /gm).length, 2);
  assert.ok(full.indexOf('IPCB_Track interface') < full.indexOf('IPCB_Via interface'));
  assert.match(full, /A track\.\n---\ntitle: "IPCB_Via"/);
});

test('front matter values are quoted strings, so a quote or colon in a title cannot break the block', () => {
  const full = llmsFull([{ ...track, title: 'Say "hi": now' }]);
  assert.match(full, /^title: "Say \\"hi\\": now"$/m);
});
