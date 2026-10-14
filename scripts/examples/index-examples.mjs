#!/usr/bin/env node
// Indexes where the C# SDK examples use API types and members: metadata/examples-index.json, read by the generator
// to add "Examples" sections. Usage: node scripts/examples/index-examples.mjs [--dir <ad-sdk-examples checkout>]
//
// Resolution is lexical, not a compiler: a variable's type comes from its declaration (`ISch_Document doc`), a cast or
// `as`, the SDK entry points (`GlobalVars.SchServer`) or the return type of a member called on an already-typed
// variable (`var doc = schServer.GetCurrentSchDocument()`). Only calls that resolve to a real member are recorded.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from 'yaml';
import { buildModel, inheritedMembers, namedTypes } from '../apidocs/lib/model.mjs';

const args = process.argv.slice(2);
const dir = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : 'internal/sources/ad-sdk-examples';
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'metadata/examples-index.json';
if (!existsSync(dir)) {
  console.error(`examples:index: ${dir} not found (clone ${parse(readFileSync('config/site.yaml', 'utf8')).examples.repo} there or pass --dir)`);
  process.exit(1);
}

const NAMESPACES = ['SCH', 'PCB', 'EDP', 'DXP', 'ComponentLib', 'Embedded'];
const model = buildModel({ metadataPaths: ['metadata/Altium.SDK.Interfaces.json'], namespaces: NAMESPACES });
const byShort = new Map();
for (const t of model.types.values()) if (!byShort.has(t.name)) byShort.set(t.name, t);
const ENTRY_POINTS = { SchServer: 'SCH.ISch_ServerInterface', PCBServer: 'PCB.IPCB_ServerInterface', Client: 'DXP.IClient' };

// Member (own or inherited) of a type called by a method name: a method, or a property accessor.
const memberCache = new Map();
function findMember(typeId, name) {
  const key = `${typeId}#${name}`;
  if (memberCache.has(key)) return memberCache.get(key);
  const type = model.types.get(typeId);
  let hit = null;
  if (type?.members) {
    const owners = [type, ...inheritedMembers(model, type).map((g) => model.types.get(g.base)).filter(Boolean)];
    for (const owner of owners) {
      const m = owner.members.find((x) => (x.kind === 'method' && x.name === name) || x.getter?.name === name || x.setter?.name === name);
      if (m) { hit = { owner, member: m, returns: m.kind === 'method' ? m.signature.returnType : (m.getter?.name === name ? m.type : 'void') }; break; }
    }
  }
  memberCache.set(key, hit);
  return hit;
}

const stripCode = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/\/\/[^\n]*/g, '')
  .replace(/@"(?:[^"]|"")*"|"(?:\\.|[^"\\\n])*"/g, '""');

function walk(path, files = []) {
  for (const name of readdirSync(path)) {
    if (name === '.git' || name === 'bin' || name === 'obj') continue;
    const full = join(path, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (name.endsWith('.cs') && !/\.Designer\.cs$|AssemblyInfo\.cs$|Reference\.cs$/.test(name)) files.push(full);
  }
  return files;
}

const typeOf = (name) => byShort.get(name.replace(/^\w+\./, ''))?.id ?? null;
const members = {};
const types = {};
const examples = {};
const add = (bucket, key, ref, limit) => {
  bucket[key] ??= [];
  if (bucket[key].length < limit && !bucket[key].some((r) => r.example === ref.example && r.file === ref.file)) bucket[key].push(ref);
};

for (const file of walk(dir)) {
  const path = relative(dir, file).split(sep).join('/');
  const example = path.split('/')[0];
  const code = stripCode(readFileSync(file, 'utf8'));
  const lines = code.split('\n');
  const vars = new Map();
  const lineOf = (index) => code.slice(0, index).split('\n').length;
  examples[example] ??= { files: 0 };
  examples[example].files += 1;

  for (const m of code.matchAll(/\b(?:[A-Za-z_]\w*\.)?(I[A-Z]\w*)\s+([a-zA-Z_]\w*)\s*(?=[=;,)])/g)) {
    const id = typeOf(m[1]);
    if (id) vars.set(m[2], id);
  }
  for (const m of code.matchAll(/\b([a-zA-Z_]\w*)\s*=\s*\(\s*(?:[A-Za-z_]\w*\.)?(I[A-Z]\w*)\s*\)/g)) {
    const id = typeOf(m[2]);
    if (id) vars.set(m[1], id);
  }
  for (const m of code.matchAll(/\b([a-zA-Z_]\w*)\s*=\s*[^;]*?\bas\s+(?:[A-Za-z_]\w*\.)?(I[A-Z]\w*)/g)) {
    const id = typeOf(m[2]);
    if (id) vars.set(m[1], id);
  }
  for (const m of code.matchAll(/\b([a-zA-Z_]\w*)\s*=\s*(?:[A-Za-z_]\w*\.)?GlobalVars\.(SchServer|PCBServer|Client)\b(?!\s*\.)/g)) {
    vars.set(m[1], ENTRY_POINTS[m[2]]);
  }
  // `var x = known.Member(...)`: the type of the result, repeated so chains of assignments resolve.
  for (let pass = 0; pass < 3; pass += 1) {
    for (const m of code.matchAll(/\bvar\s+([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*)\s*\.\s*(\w+)\s*\(/g)) {
      const owner = vars.get(m[2]);
      const hit = owner && findMember(owner, m[3]);
      const [named] = hit ? namedTypes(hit.returns) : [];
      if (named && model.types.has(named) && !vars.has(m[1])) vars.set(m[1], named);
    }
  }

  const record = (typeId, name, index) => {
    const hit = findMember(typeId, name);
    if (!hit) return null;
    add(members, `${hit.owner.id}.${hit.member.slug}`, { example, file: path, line: lineOf(index) }, 12);
    return hit;
  };
  for (const m of code.matchAll(/\b([a-zA-Z_]\w*)\s*\.\s*(\w+)\s*\(/g)) {
    const typeId = vars.get(m[1]);
    if (typeId) record(typeId, m[2], m.index);
  }
  for (const m of code.matchAll(/\bGlobalVars\.(SchServer|PCBServer|Client)\s*\.\s*(\w+)\s*\(/g)) {
    record(ENTRY_POINTS[m[1]], m[2], m.index);
  }
  for (const m of code.matchAll(/\b(I[A-Z]\w*|T[A-Z]\w*)\b/g)) {
    const t = byShort.get(m[1]);
    if (t) add(types, t.id, { example, file: path, line: lineOf(m.index) }, 12);
  }
  void lines;
}

let commit = null;
try {
  commit = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  commit = null;
}
const sortKeys = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
const index = { commit, examples: sortKeys(examples), types: sortKeys(types), members: sortKeys(members) };
writeFileSync(out, `${JSON.stringify(index, null, 1)}\n`);
console.log(`examples:index: ${Object.keys(examples).length} examples, ${Object.keys(types).length} types, ${Object.keys(members).length} members -> ${out}`);
