import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadHidden } from '../scripts/apidocs/lib/config.mjs';
import { buildModel } from '../scripts/apidocs/lib/model.mjs';
import { joinSamples, loadSamplesIndex, rankSamples, resolveApi, sampleLinks, samplesPin } from '../scripts/apidocs/lib/samples.mjs';

const model = buildModel({
  metadataPaths: ['metadata/Altium.SDK.Interfaces.json', 'metadata/Altium.SDK.json'],
  namespaces: ['DXP', 'PCB', 'SCH'],
  hidden: loadHidden(),
});
const where = (id) => {
  const r = resolveApi(model, id);
  return r && { type: r.type.id, member: r.member?.name ?? null, how: r.how };
};

test('index ids resolve to the type page or the member section', () => {
  // type
  assert.deepEqual(where('DXP.IClient'), { type: 'DXP.IClient', member: null, how: 'type' });
  // method or property of the same name
  assert.deepEqual(where('DXP.IClient.BroadcastNotification'), { type: 'DXP.IClient', member: 'BroadcastNotification', how: 'member' });
  // an accessor pair, as the index names it: the property
  assert.deepEqual(where('DXP.IClient.GetCurrentView'), { type: 'DXP.IClient', member: 'CurrentView', how: 'accessor' });
  // a property with a getter only: read-only, by its accessor-free name
  assert.deepEqual(where('PCB.IPCB_Board.BoardOutline'), { type: 'PCB.IPCB_Board', member: 'BoardOutline', how: 'member' });
  // a GetState_ method that is not property-shaped (out parameters) stays a method
  assert.deepEqual(where('PCB.IPCB_Board.GetState_ZTopBottom'), { type: 'PCB.IPCB_Board', member: 'GetState_ZTopBottom', how: 'member' });
  assert.deepEqual(where('PCB.IPCB_Board.ZTopBottom'), { type: 'PCB.IPCB_Board', member: null, how: 'typeOnly' });
  // enum value and constant: the type page
  assert.deepEqual(where('DXP.TDocumentsBarGrouping.dbgNone'), { type: 'DXP.TDocumentsBarGrouping', member: null, how: 'enumValue' });
  assert.deepEqual(where('DXP.NotificationCode.DocumentNotificationCode.DocumentActivating'),
    { type: 'DXP.NotificationCode.DocumentNotificationCode', member: null, how: 'field' });
  // a member the reference does not list (a protected override): the type page
  assert.deepEqual(where('DXP.BaseNotification.GetNotificationCodeImpl'), { type: 'DXP.BaseNotification', member: null, how: 'typeOnly' });
  // a type the reference has no page for
  assert.equal(where('DXP.ServiceNames'), null);
  assert.equal(where('DXP.ServiceNames.ValidateStateTransitionNotificationServiceName'), null);
});

test('samples are ranked: primary first, then fewer distinct APIs, then by id', () => {
  const samples = new Map([['Big', { apiCount: 40 }], ['Small', { apiCount: 3 }], ['Tiny', { apiCount: 2 }], ['Also', { apiCount: 3 }]]);
  const ranked = rankSamples([
    { sample: 'Tiny', primary: false }, { sample: 'Big', primary: true }, { sample: 'Small', primary: false }, { sample: 'Also', primary: false },
  ], samples).map((e) => e.sample);
  assert.deepEqual(ranked, ['Big', 'Tiny', 'Also', 'Small']);
});

const sample = (id, apis) => ({ id, title: `Title of ${id}`, summary: `Summary of ${id}.`, path: `samples/pcb/${id}`, apis: apis.map((a) => ({ id: a })) });
const use = (s, primary = false, line = 10) => ({ sample: s, ...(primary ? { primary } : {}), file: `samples/pcb/${s}/${s}.Impl/C.cs`, line, uses: 1 });
const index = {
  schemaVersion: 2,
  source: { repo: 'https://github.com/o/r', commit: 'a'.repeat(40) },
  samples: [sample('A', ['PCB.IPCB_Board', 'PCB.IPCB_Board.BoardOutline']), sample('B', ['PCB.IPCB_Board', 'PCB.IPCB_Board.GetState_ZTopBottom', 'X', 'Y'])],
  apis: {
    'PCB.IPCB_Board': { kind: 'type', samples: [use('A', false, 5), use('B', false, 7)] },
    'PCB.IPCB_Board.BoardOutline': { kind: 'property', samples: [use('A', false, 9)] },
    'PCB.IPCB_Board.GetState_ZTopBottom': { kind: 'method', samples: [use('B', true, 3)] },
    'DXP.ServiceNames': { kind: 'type', samples: [use('B')] },
  },
};

test('a type page lists the samples that use the type or its members; a member section, those that use the member', () => {
  const joined = joinSamples(model, index);
  // B is primary through its member, so it comes first; the source link stays at the use of the type itself.
  assert.deepEqual(joined.byType.get('PCB.IPCB_Board').map((e) => [e.sample, e.primary, e.line]), [['B', true, 7], ['A', false, 5]]);
  const outline = model.types.get('PCB.IPCB_Board').members.find((m) => m.name === 'BoardOutline');
  assert.deepEqual(joined.byMember.get(`PCB.IPCB_Board.${outline.slug}`).map((e) => e.sample), ['A']);
  assert.deepEqual(joined.report.unresolved, [{ id: 'DXP.ServiceNames', kind: 'type', samples: ['B'] }]);
});

test('links point at the commit the index was built from', () => {
  const links = sampleLinks({ repo: 'https://github.com/o/r', commit: 'c0ffee' });
  assert.equal(links.sample({ path: 'samples/pcb/A' }), 'https://github.com/o/r/tree/c0ffee/samples/pcb/A');
  assert.equal(links.source({ file: 'samples/pcb/A/A Impl/C.cs', line: 12 }), 'https://github.com/o/r/blob/c0ffee/samples/pcb/A/A%20Impl/C.cs#L12');
});

test('the index is read only when it is the pinned release', () => {
  const site = { samples: { repo: 'https://github.com/o/r/', release: 'index-1' } };
  assert.deepEqual(samplesPin(site), { repo: 'https://github.com/o/r', release: 'index-1' });
  assert.equal(samplesPin({}), null);
  const dir = mkdtempSync(join(tmpdir(), 'samples-'));
  try {
    assert.equal(loadSamplesIndex(site, dir), null);
    writeFileSync(join(dir, 'index.json'), JSON.stringify(index));
    assert.throws(() => loadSamplesIndex(site, dir), /npm run samples:fetch/);
    writeFileSync(join(dir, 'release.txt'), 'index-1\n');
    assert.throws(() => loadSamplesIndex(site, dir), /samples is missing/);
    mkdirSync(join(dir, 'repo', 'samples'), { recursive: true });
    const loaded = loadSamplesIndex(site, dir);
    assert.equal(loaded.commit, 'a'.repeat(40));
    assert.equal(loaded.release, 'index-1');
    writeFileSync(join(dir, 'index.json'), JSON.stringify({ ...index, schemaVersion: 1 }));
    assert.throws(() => loadSamplesIndex(site, dir), /schemaVersion 1/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
