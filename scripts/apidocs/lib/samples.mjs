// The SDK samples on reference pages: which samples use each type and member.
//
// Input: the samples index (index.json of the release pinned in config/site.yaml, fetched into .cache/samples/ by
// `npm run samples:fetch`). Its `apis` map SDK ids, as the samples' compiled code names them, to the samples that use
// them. The docs own their page ids, so the join is made here (`resolveApi`):
//
//   type                            DXP.IClient                         the type page
//   method or property              DXP.IClient.GetCurrentProject       the member section
//   property, by an accessor        DXP.IClient.GetCurrentView          the property (CurrentView), by its accessors
//                                   PCB.IPCB_Board.BoardOutline         (GetState_BoardOutline), a lone one included
//   overload suffix                 PCB.IPCB_Polygon.SetState_XSizeYSize_1  the member, overloads together
//   enum value, field or constant   DXP.TDocumentsBarGrouping.dbgNone   the type page
//   member the reference omits      a protected override                the type page
//   type the reference omits        hidden or not in the assemblies     nothing; reported
//
// A type page lists the samples that use the type or any of its members; a member section, those that use the member.
// Order (`rankSamples`): samples where the API is primary (named in the sample's "What it shows") first, then
// samples that use fewer distinct APIs (a small sample about the API before a large one that touches it), then by id.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const SAMPLES_CACHE = '.cache/samples';
// How many samples a type page or member section names; the rest are counted.
export const SAMPLES_SHOWN = 5;

export function samplesPin(site) {
  const { repo, release } = site.samples ?? {};
  return repo && release ? { repo: repo.replace(/\/$/, ''), release } : null;
}

// The fetched index, or null when there is none (the reference is then built without Samples sections). A cache of
// another release than the pin is an error: its links would point at the wrong commit.
export function loadSamplesIndex(site, dir = SAMPLES_CACHE) {
  const pin = samplesPin(site);
  const path = join(dir, 'index.json');
  if (!pin || !existsSync(path)) return null;
  const marker = join(dir, 'release.txt');
  const cached = existsSync(marker) ? readFileSync(marker, 'utf8').trim() : null;
  if (cached !== pin.release) {
    throw new Error(`${dir} holds ${cached ?? 'an unknown release'}, but config/site.yaml pins ${pin.release}: run npm run samples:fetch`);
  }
  const index = JSON.parse(readFileSync(path, 'utf8'));
  if (index.schemaVersion !== 2) throw new Error(`${path}: schemaVersion ${index.schemaVersion}, this build reads 2`);
  // The sample folders (READMEs, sources) at the same release, for the sample pages.
  const repoDir = join(dir, 'repo');
  if (!existsSync(join(repoDir, 'samples'))) throw new Error(`${repoDir}/samples is missing: run npm run samples:fetch -- --force`);
  return { ...index, repo: index.source?.repo ?? pin.repo, commit: index.source?.commit ?? pin.release, release: pin.release, repoDir };
}

// Where an index id belongs in the reference: { type, member } (member: a model member, or null for the type page),
// or null when the reference has no page for it.
export function resolveApi(model, id) {
  const direct = model.types.get(id);
  if (direct) return { type: direct, member: null, how: 'type' };
  // Owner: the longest prefix that is a documented type (nested types have dotted ids).
  const parts = id.split('.');
  for (let i = parts.length - 1; i > 0; i--) {
    const type = model.types.get(parts.slice(0, i).join('.'));
    if (!type) continue;
    if (i !== parts.length - 1) return null;
    const name = parts[i];
    const member = findMember(type, name) ?? findMember(type, name.replace(/_\d+$/, ''));
    if (member) return { type, member, how: member.name === name ? 'member' : 'accessor' };
    if (type.values?.some((v) => v.name === name)) return { type, member: null, how: 'enumValue' };
    if (type.fields?.some((f) => f.name === name)) return { type, member: null, how: 'field' };
    return { type, member: null, how: 'typeOnly' };
  }
  return null;
}

// The index names a property by its accessor-free name (`BoardOutline` for `GetState_BoardOutline`), or, for a
// Get/Set pair, by the accessor it calls (`GetCurrentView`). A method stays a method (`GetState_ZTopBottom(out, out)`).
const ACCESSOR_PREFIXES = ['GetState_', 'SetState_', 'GetProperty_', 'SetProperty_', 'Get_', 'Set_'];

function findMember(type, name) {
  const members = type.members ?? [];
  const accessor = (a) => a && (a.name === name || a.name === `Internal_${name}` || ACCESSOR_PREFIXES.some((p) => a.name === p + name));
  return members.find((m) => m.name === name)
    ?? members.find((m) => accessor(m.getter) || accessor(m.setter))
    ?? members.find((m) => m.signature?.alternate?.name === name);
}

// Joins the index to the model. Returns
//   byType:   type id → ranked [{ sample, primary, file, line }] (the type and all its members)
//   byMember: `<type id>.<member slug>` → ranked list
//   samples:  sample id → { id, title, summary, path, apiCount }
//   resolved: index id → resolveApi's result (null when the reference has no page for it)
//   report:   { unresolved: [{ id, kind, samples }], typeOnly: [...], counts }
export function joinSamples(model, index) {
  const samples = new Map(index.samples.map((s) => [s.id, { id: s.id, title: s.title, summary: s.summary, path: s.path, apiCount: s.apis.length }]));
  const byType = new Map();
  const byMember = new Map();
  const resolved = new Map();
  const unresolved = [];
  const typeOnly = [];
  const counts = {};
  // One entry per sample: primary if any of its uses is. The source link goes to the first use: of the type itself
  // when the sample uses it directly (a type page), else of any of the ids merged here (overloads, accessors, members).
  const add = (map, key, entry) => {
    if (!map.has(key)) map.set(key, new Map());
    const list = map.get(key);
    const seen = list.get(entry.sample);
    if (!seen) { list.set(entry.sample, { ...entry }); return; }
    seen.primary ||= entry.primary;
    if ((entry.direct && !seen.direct) || (entry.direct === seen.direct && compareUse(entry, seen) < 0)) {
      Object.assign(seen, { file: entry.file, line: entry.line, direct: entry.direct });
    }
  };
  for (const [id, api] of Object.entries(index.apis)) {
    const target = resolveApi(model, id);
    resolved.set(id, target);
    const how = target?.how ?? 'unresolved';
    counts[how] = (counts[how] ?? 0) + 1;
    const used = api.samples.map((s) => s.sample);
    if (!target) { unresolved.push({ id, kind: api.kind, samples: used }); continue; }
    if (how === 'typeOnly') typeOnly.push({ id, kind: api.kind, samples: used });
    for (const s of api.samples) {
      if (!samples.has(s.sample)) continue;
      const entry = { sample: s.sample, primary: Boolean(s.primary), file: s.file, line: s.line, direct: !target.member };
      add(byType, target.type.id, entry);
      if (target.member) add(byMember, `${target.type.id}.${target.member.slug}`, { ...entry, direct: true });
    }
  }
  const ranked = (map) => new Map([...map].map(([key, list]) => [key, rankSamples([...list.values()], samples)]));
  return { byType: ranked(byType), byMember: ranked(byMember), samples, resolved, report: { counts, unresolved, typeOnly } };
}

// Earlier use first: by file, then line.
const compareUse = (a, b) => a.file.localeCompare(b.file, 'en') || a.line - b.line;

export function rankSamples(entries, samples) {
  const size = (e) => samples.get(e.sample)?.apiCount ?? Infinity;
  return entries
    .map(({ sample, primary, file, line }) => ({ sample, primary, file, line }))
    .sort((a, b) => (b.primary - a.primary) || (size(a) - size(b)) || a.sample.localeCompare(b.sample, 'en'));
}

// GitHub links at the commit the index was built from, for repository paths (`samples/pcb/BoardOutlineRect/...`): a
// folder, a file, a raw file (images), and a use of an API (the "source" link on reference pages).
export function sampleLinks(index) {
  const encode = (p) => p.split('/').map(encodeURIComponent).join('/');
  const at = (kind) => (p) => `${index.repo}/${kind}/${index.commit}/${encode(p)}`;
  const blob = at('blob');
  return { tree: at('tree'), blob, raw: at('raw'), source: (entry) => `${blob(entry.file)}#L${entry.line}` };
}

// A sample folder's files, sorted, without build output; `filter` picks by file name.
export function sampleFiles(dir, filter = () => true, prefix = '') {
  const out = [];
  for (const name of readdirSync(dir).sort((a, b) => a.localeCompare(b, 'en'))) {
    if (name === 'bin' || name === 'obj') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sampleFiles(full, filter, `${prefix}${name}/`));
    else if (filter(name)) out.push(`${prefix}${name}`);
  }
  return out;
}
