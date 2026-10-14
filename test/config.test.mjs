import assert from 'node:assert/strict';
import { test } from 'node:test';
import { editUrl } from '../scripts/apidocs/lib/config.mjs';

const site = { repo: 'https://github.com/AltiumDeveloper/ad-sdk-docs', branch: 'main' };
const type = { id: 'DXP.IClipboardDocument', namespace: 'DXP', file: 'IClipboardDocument' };

test('the edit link of a type with a description file edits that file', () => {
  assert.equal(editUrl(site, type, true), 'https://github.com/AltiumDeveloper/ad-sdk-docs/edit/main/content/DXP/IClipboardDocument.yaml');
});

test('the edit link of a type without a description file opens the new-file form with the name and a template', () => {
  const url = new URL(editUrl(site, type, false));
  assert.equal(url.origin + url.pathname, 'https://github.com/AltiumDeveloper/ad-sdk-docs/new/main/content/DXP');
  assert.equal(url.searchParams.get('filename'), 'IClipboardDocument.yaml');
  assert.match(url.searchParams.get('value'), /^# Description of DXP\.IClipboardDocument: .*\nsummary: \n$/);
});
