// Golden queries for the samples in search (src/search/engine.mjs): a task phrased in words finds the sample that
// does it; an API name finds the reference first; a sample's id or command name finds the sample. Reads the built
// index (static/search-index.json, `npm run apidocs` after `npm run samples:fetch`); skipped without it, and CI runs
// it again after generating (`npm run search:golden`).
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { collapseMembers, indexOptions, isIdentifierQuery, loadIndex, search } from '../src/search/engine.mjs';

const INDEX = 'static/search-index.json';
const payload = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, 'utf8')) : null;
const hasSamples = Boolean(payload?.records.some((r) => r.k === 'sample'));
const loaded = hasSamples ? loadIndex(payload) : null;
const top = (query, n = 5) => collapseMembers(search(loaded.index, loaded.records, query, indexOptions(loaded))).slice(0, n).map((r) => r.record);
const sampleRoutes = (query, n) => top(query, n).filter((r) => r.k === 'sample').map((r) => r.u);

test('an API name is a query for the reference, a phrase is not', () => {
  for (const q of ['IPCB_Board', 'GetState_BoardOutline', 'ISch_Pin.Name', 'IClient']) assert.ok(isIdentifierQuery(q), q);
  for (const q of ['board', 'count pads', 'BOM report', 'panel']) assert.ok(!isIdentifierQuery(q), q);
});

const TASKS = [
  ['count pads on a board', 'BoardPadCount'],
  ['rename footprints', 'PcbLibRenameFootprintToFileName'],
  ['add a parameter to a wire', 'WireAddParameter'],
  ['jump to a pin', 'SchJumpToPin'],
  ['context menu', 'SchComponentContextMenu'],
  ['zoom to board', 'ZoomToBoardExtents'],
  ['run a DRC', 'DrcSettings'],
  ['hide a layer', 'HidePcbLayer'],
  ['vault item search', 'VaultItemSearchByHrid'],
  ['export footprints to STEP', 'ExportPcbLibComponentToStep'],
];

test('a task in words finds the sample that does it', { skip: !hasSamples && `no samples in ${INDEX}` }, () => {
  for (const [query, id] of TASKS) {
    const routes = sampleRoutes(query, 5);
    assert.ok(routes.includes(`/samples/${id}`), `${query}: expected ${id} in the top 5, got ${routes.join(', ') || 'no samples'}`);
  }
});

test('a sample id or command name finds the sample first', { skip: !hasSamples && `no samples in ${INDEX}` }, () => {
  for (const [query, id] of [['PlacePadInteractive', 'PlacePadInteractive'], ['BoardOutlineRect', 'BoardOutlineRect'], ['ReadBoardOutline', 'BoardOutlineRect']]) {
    assert.equal(top(query, 1)[0]?.u, `/samples/${id}`, query);
  }
});

test('an API name finds the reference before any sample', { skip: !hasSamples && `no samples in ${INDEX}` }, () => {
  for (const [query, first] of [['IPCB_Board', 'IPCB_Board'], ['ISch_Pin', 'ISch_Pin'], ['IClient', 'IClient'], ['GetState_BoardOutline', 'BoardOutline']]) {
    const results = top(query, 5);
    assert.equal(results[0]?.n, first, query);
    assert.ok(!results.slice(0, 3).some((r) => r.k === 'sample'), `${query}: a sample in the top 3`);
  }
});
