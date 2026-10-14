import assert from 'node:assert/strict';
import { test } from 'node:test';
import { linkify, loadXrefIndex, looksLikeCode, unlinkedMentions } from '../scripts/apidocs/lib/xref.mjs';

const index = loadXrefIndex({
  types: [
    { id: 'SCH.ISch_BasicContainer', ns: 'SCH', name: 'ISch_BasicContainer', route: '/reference/sch/ISch_BasicContainer', members: { SchIterator_Create: 'schiterator_create' } },
    { id: 'SCH.ISch_MapDefiner', ns: 'SCH', name: 'ISch_MapDefiner', route: '/reference/sch/ISch_MapDefiner', members: {} },
    { id: 'SCH.ISch_Component', ns: 'SCH', name: 'ISch_Component', route: '/reference/sch/ISch_Component', members: { Orientation: 'orientation', GetState_Orientation: 'orientation' } },
    { id: 'SCH.TObjectId', ns: 'SCH', name: 'TObjectId', route: '/reference/sch/TObjectId', members: {} },
    { id: 'PCB.TObjectId', ns: 'PCB', name: 'TObjectId', route: '/reference/pcb/TObjectId', members: {} },
    { id: 'EDP.Utils', ns: 'EDP', name: 'Utils', route: '/reference/edp/Utils', members: { GetBomManagerFactory: 'getbommanagerfactory' } },
  ],
});
const href = (e, a) => `${e.route}${a ? `#${a}` : ''}`;
const current = index.byId.get('SCH.ISch_BasicContainer');

test('type names in prose become links; the page type itself is code without a link', () => {
  const out = linkify('ISch_BasicContainer is the ancestor interface object for ISch_MapDefiner interfaces.', index, { ns: 'SCH', current, href });
  assert.equal(out, '`ISch_BasicContainer` is the ancestor interface object for [`ISch_MapDefiner`](/reference/sch/ISch_MapDefiner) interfaces.');
  assert.equal(linkify('See `ISch_BasicContainer`.', index, { ns: 'SCH', current, href }), 'See `ISch_BasicContainer`.');
});

test('members: dotted names, accessor names, the current type\'s own member names', () => {
  assert.match(linkify('Use ISch_Component.GetState_Orientation.', index, { ns: 'SCH', href }), /\(\/reference\/sch\/ISch_Component#orientation\)/);
  assert.match(linkify('Call SchIterator_Create first.', index, { ns: 'SCH', current, href }), /#schiterator_create\)/);
  assert.match(linkify('`EDP.Utils.GetBomManagerFactory()`', index, { ns: 'SCH', href }), /^\[`EDP\.Utils\.GetBomManagerFactory\(\)`\]\(\/reference\/edp\/Utils#getbommanagerfactory\)$/);
});

test('in a member section, the member itself is code without a link; other members are links', () => {
  const text = 'The SchIterator_Destroy method destroys the iterator created with the SchIterator_Create method.';
  const local = { ...current, members: new Map([...current.members, ['SchIterator_Destroy', 'schiterator_destroy']]) };
  const idx = { ...index, byId: new Map([...index.byId, [local.id, local]]) };
  assert.equal(linkify(text, idx, { ns: 'SCH', current: local, currentAnchor: 'schiterator_destroy', href }),
    'The `SchIterator_Destroy` method destroys the iterator created with the [`SchIterator_Create`](/reference/sch/ISch_BasicContainer#schiterator_create) method.');
});

test('ambiguous short names resolve to the page namespace, or stay text', () => {
  assert.match(linkify('A TObjectId value.', index, { ns: 'PCB', href }), /\/reference\/pcb\/TObjectId/);
  assert.equal(linkify('A TObjectId value.', index, { ns: 'EDP', href }), 'A TObjectId value.');
});

test('plain words that are type names stay text unless written as code or qualified', () => {
  assert.equal(looksLikeCode('Utils'), false);
  assert.equal(linkify('Utils for everyone.', index, { ns: 'EDP', href }), 'Utils for everyone.');
  assert.match(linkify('See `Utils`.', index, { ns: 'EDP', href }), /\[`Utils`\]\(\/reference\/edp\/Utils\)/);
  assert.match(linkify('See EDP.Utils.', index, { ns: 'SCH', href }), /\[`EDP\.Utils`\]/);
});

test('existing links and URLs are left alone', () => {
  const text = 'See [the map](https://x.test/ISch_MapDefiner) and https://x.test/ISch_MapDefiner.';
  assert.equal(linkify(text, index, { ns: 'SCH', href }), text);
});

test('the check reports plain-text mentions in guides, not code spans the plugin links', () => {
  const guide = 'Create an ISch_MapDefiner, then call `ISch_Component.Orientation`.\n\n```csharp\nISch_MapDefiner x;\n```';
  assert.deepEqual(unlinkedMentions(guide, index, { codeSpansLinked: true }), ['ISch_MapDefiner']);
});
