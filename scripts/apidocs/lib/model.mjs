// Builds the documented API model from the assembly metadata (metadata/*.json, written by tools/AssemblyMetadata).
//
// The SDK interfaces are COM dispatch interfaces. Their raw methods return `object` for interface-typed results
// (`Internal_GetState_SchDesignator`) and `int` for enum-typed values; static `*Helper` extension classes add the typed
// versions (`GetState_SchDesignator(): ISch_Designator`). The model shows each method once, in its typed form, and
// groups accessor pairs (`GetState_X` / `SetState_X`) into one logical property.
import { readFileSync } from 'node:fs';

// Accessor prefixes, strongest first. `strong` prefixes always name an accessor, so a getter alone is a read-only
// property; `Get` / `Set` alone are also ordinary verbs (`GetCurrentSchDocument`), so they only form a property as
// a matching pair.
export const ACCESSOR_PATTERNS = [
  { get: /^GetState_(\w+)$/, set: /^SetState_(\w+)$/, strong: true },
  { get: /^GetProperty_(\w+)$/, set: /^SetProperty_(\w+)$/, strong: true },
  { get: /^Get_(\w+)$/, set: /^Set_(\w+)$/, strong: true },
  { get: /^Get([A-Z]\w*)$/, set: /^Set([A-Z]\w*)$/, strong: false },
];

const PRIMITIVES = new Set(['void', 'bool', 'char', 'sbyte', 'byte', 'short', 'ushort', 'int', 'uint', 'long', 'ulong',
  'float', 'double', 'string', 'object', 'IntPtr', 'UIntPtr']);

// Named types inside a signature type: `SCH.ISch_Pin[]` → [SCH.ISch_Pin], `List<SCH.Coord>` → [List, SCH.Coord].
export function namedTypes(type) {
  return String(type).split(/[<>,\[\]\s*]+/).filter((name) => name && !PRIMITIVES.has(name));
}

const sameParameters = (a, b) => a.length === b.length
  && a.every((p, i) => p.type === b[i].type && (p.direction ?? null) === (b[i].direction ?? null));

const signatureOf = (method, { extension = null, dropThis = false } = {}) => ({
  name: method.name,
  ...(method.genericParameters?.length ? { genericParameters: method.genericParameters } : {}),
  returnType: method.returnType,
  parameters: (dropThis ? method.parameters.slice(1) : method.parameters).map((p) => ({ ...p })),
  ...(extension ? { extension } : {}),
});

// Raw interface methods merged with the typed extension methods of the interface's helper class(es).
export function effectiveMethods(rawMethods, helperMethods) {
  const typed = new Map();
  for (const { method, helper } of helperMethods) {
    if (!typed.has(method.name)) typed.set(method.name, { method, helper });
  }
  const out = new Map();
  for (const raw of rawMethods) {
    if (raw.isSpecialName) continue;
    const name = raw.name;
    const internal = name.startsWith('Internal_') ? name.slice('Internal_'.length) : null;
    if (internal && typed.has(internal)) {
      const { method, helper } = typed.get(internal);
      out.set(internal, signatureOf(method, { extension: helper, dropThis: true }));
    } else if (typed.has(name)) {
      const { method, helper } = typed.get(name);
      const replacement = signatureOf(method, { extension: helper, dropThis: true });
      const same = replacement.returnType === raw.returnType && sameParameters(replacement.parameters, raw.parameters);
      // Both overloads are callable: the typed extension method first, the untyped interface method as an alternate.
      out.set(name, same ? signatureOf(raw) : { ...replacement, alternate: signatureOf(raw) });
    } else if (!out.has(name)) {
      out.set(name, signatureOf(raw));
    }
  }
  for (const [name, { method, helper }] of typed) {
    if (!out.has(name)) out.set(name, signatureOf(method, { extension: helper, dropThis: true }));
  }
  return [...out.values()];
}

const byRef = (parameters) => parameters.some((p) => p.direction);

// Splits methods into logical properties (accessor pairs) and the remaining methods.
export function groupProperties(methods) {
  const used = new Set();
  const properties = new Map();
  for (const pattern of ACCESSOR_PATTERNS) {
    const getters = new Map();
    const setters = new Map();
    for (const m of methods) {
      if (used.has(m.name)) continue;
      const g = pattern.get.exec(m.name);
      if (g && m.returnType !== 'void' && !byRef(m.parameters)) getters.set(g[1], m);
      const s = pattern.set.exec(m.name);
      if (s && m.parameters.length >= 1 && !byRef(m.parameters)) setters.set(s[1], m);
    }
    for (const name of new Set([...getters.keys(), ...setters.keys()])) {
      if (properties.has(name)) continue;
      const getter = getters.get(name);
      const setter = setters.get(name);
      if (!pattern.strong) {
        if (!getter || !setter) continue;
        const index = setter.parameters.slice(0, -1);
        const value = setter.parameters.at(-1);
        if (value.type !== getter.returnType || !sameParameters(index, getter.parameters)) continue;
      }
      const indexParameters = (getter ? getter.parameters : setter.parameters.slice(0, -1)).map((p) => ({ ...p }));
      properties.set(name, {
        kind: 'property',
        name,
        type: getter ? getter.returnType : setter.parameters.at(-1).type,
        indexParameters,
        getter: getter ?? null,
        setter: setter ?? null,
      });
      if (getter) used.add(getter.name);
      if (setter) used.add(setter.name);
    }
  }
  const rest = methods.filter((m) => !used.has(m.name)).map((m) => ({ kind: 'method', name: m.name, signature: m }));
  return { properties: [...properties.values()], methods: rest };
}

// Member page slugs: unique per type, case-insensitively (pages become files, and macOS / Windows file systems are
// case-insensitive). A property keeps its plain name; a method with the same name gets `-method`.
export function assignSlugs(members) {
  const taken = new Set();
  const ordered = [...members].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'property' ? -1 : 1));
  for (const member of ordered) {
    // Docusaurus ignores files starting with `_`: `_Finalize` → `Finalize-method`.
    const base = member.name.replace(/^_+/, '');
    let slug = base === member.name ? base : `${base}-${member.kind}`;
    if (taken.has(slug.toLowerCase())) slug = `${base}-${member.kind}`;
    let n = 2;
    while (taken.has(slug.toLowerCase())) slug = `${base}-${member.kind}-${n++}`;
    taken.add(slug.toLowerCase());
    member.slug = slug;
  }
  return members;
}

const shortName = (fullName) => fullName.slice(fullName.lastIndexOf('.') + 1);
// A type's name within its namespace: `ISch_Component`, or `NotificationCode.DocumentNotificationCode` for nested types.
// Generic types: the arity marker becomes the type parameter list, BaseClientService`1 → BaseClientService<T>.
const nameInNamespace = (t) => {
  const name = t.namespace && t.name.startsWith(`${t.namespace}.`) ? t.name.slice(t.namespace.length + 1) : t.name;
  const params = (t.genericParameters ?? []).map((g) => g.name);
  return name.replace(/`\d+/, params.length ? `<${params.join(', ')}>` : '');
};
// URL segment of a namespace: `SCH` → `sch`, `DXP.EDMS` → `dxp-edms`.
export const namespaceSlug = (namespace) => namespace.toLowerCase().replace(/\./g, '-');

// Public classes that only carry COM plumbing (interface GUIDs, service names, pointer helpers): not documented.
const INFRASTRUCTURE_CLASSES = /^(InterfaceGuids|ServiceNames|UIntPtrHelper|DispConsts)$/;

export function buildModel({ metadataPaths, namespaces, categories = [], hidden = new Set() }) {
  const all = new Map();
  const assemblies = [];
  for (const path of metadataPaths) {
    const meta = JSON.parse(readFileSync(path, 'utf8'));
    assemblies.push({ name: meta.name, version: meta.version, fileVersion: meta.fileVersion ?? null });
    for (const t of meta.types) all.set(t.name, { ...t, assembly: meta.name });
  }

  // Extension methods by the interface they extend (their first parameter).
  const helpers = new Map();
  for (const t of all.values()) {
    if (!t.isExtensionClass) continue;
    for (const m of t.methods) {
      if (!m.isExtension || !m.parameters.length) continue;
      const target = m.parameters[0].type;
      if (!helpers.has(target)) helpers.set(target, []);
      helpers.get(target).push({ method: m, helper: t.name });
    }
  }

  // Typed helper classes (`ISch_ComponentHelper`: only extension methods) are folded into their interfaces; static
  // classes that also have a few extension methods (`EDP.Utils`) are documented as classes.
  const isTypedHelper = (t) => t.isExtensionClass && /Helper$/.test(t.name)
    && t.methods.every((m) => m.isExtension || m.isSpecialName || m.name === '.ctor');
  const inScope = (t) => namespaces.includes(t.namespace)
    && !hidden.has(t.name)
    && !isTypedHelper(t)
    && (['interface', 'enum', 'struct', 'delegate'].includes(t.kind) || (t.kind === 'class' && !INFRASTRUCTURE_CLASSES.test(shortName(t.name))));
  const types = new Map();
  for (const t of all.values()) {
    if (!inScope(t)) continue;
    const record = {
      id: t.name,
      namespace: t.namespace,
      name: nameInNamespace(t),
      // File name: nested `Outer.Inner` → `Outer-Inner`; Docusaurus ignores files starting with `_` (`_D3DVECTOR`).
      file: nameInNamespace(t).replace(/<([^>]*)>/g, (_, ps) => `-${ps.replace(/,\s*/g, '-')}`).replace(/\./g, '-').replace(/^_+(.*)$/, `$1-${t.kind}`),
      nsSlug: namespaceSlug(t.namespace),
      kind: t.kind,
      assembly: t.assembly,
      genericParameters: t.genericParameters ?? [],
      category: categoryOf(t, categories),
    };
    if (t.kind === 'interface') {
      const methods = effectiveMethods(t.methods, helpers.get(t.name) ?? []);
      const { properties, methods: rest } = groupProperties(methods);
      record.members = assignSlugs([...properties, ...rest]).sort((a, b) => a.name.localeCompare(b.name, 'en'));
      record.allBases = t.interfaces.slice();
    } else if (t.kind === 'enum') {
      record.values = (t.fields ?? []).filter((f) => f.isStatic).map((f) => ({ name: f.name, value: f.value }));
    } else if (t.kind === 'struct' || t.kind === 'class') {
      record.baseType = t.baseType && !/^System\.(Object|ValueType)$/.test(t.baseType) ? t.baseType : null;
      record.fields = (t.fields ?? []).map((f) => ({ name: f.name, type: f.type, value: f.value ?? null, isStatic: Boolean(f.isStatic) }));
      record.constructors = t.methods.filter((m) => m.name === '.ctor').map((m) => signatureOf(m));
      record.methods = t.methods.filter((m) => !m.isSpecialName && m.name !== '.ctor').map((m) => ({ ...signatureOf(m), isStatic: Boolean(m.isStatic) }));
      // Static properties (`GlobalVars.SchServer`): their accessor methods are static.
      const staticAccessors = new Set(t.methods.filter((m) => m.isSpecialName && m.isStatic).map((m) => m.name));
      record.properties = (t.properties ?? []).map((p) => ({ ...p, isStatic: staticAccessors.has(`get_${p.name}`) || staticAccessors.has(`set_${p.name}`) }));
      record.interfaces = (t.interfaces ?? []).slice();
      // Members in the same shape as interface members, so class pages get the same sections, anchors and search
      // records: .NET properties (`native`), and methods grouped by name (one section lists all overloads).
      const byName = new Map();
      for (const m of record.methods) {
        if (!byName.has(m.name)) byName.set(m.name, []);
        byName.get(m.name).push(m);
      }
      record.members = assignSlugs([
        ...record.properties.map((p) => ({ kind: 'property', native: true, name: p.name, type: p.type, isStatic: p.isStatic, canRead: p.canRead, canWrite: p.canWrite, indexParameters: [] })),
        ...[...byName].map(([name, overloads]) => ({ kind: 'method', name, signature: overloads[0], overloads })),
      ]).sort((a, b) => a.name.localeCompare(b.name, 'en'));
    } else if (t.kind === 'delegate') {
      const invoke = t.methods.find((m) => m.name === 'Invoke');
      record.signature = invoke ? signatureOf(invoke) : null;
    }
    types.set(t.name, record);
  }

  // Inheritance: metadata lists every base interface (the closure); the direct bases are those no other base implies.
  for (const t of types.values()) {
    if (t.kind !== 'interface') continue;
    const closure = (id) => all.get(id)?.interfaces ?? [];
    t.bases = t.allBases.filter((b) => !t.allBases.some((o) => o !== b && closure(o).includes(b)));
    t.derived = [];
  }
  for (const t of types.values()) {
    for (const b of t.bases ?? []) types.get(b)?.derived.push(t.id);
  }

  // Where each type appears in other types' signatures: returned by / accepted by.
  for (const t of types.values()) t.usedBy = [];
  const note = (typeName, ref) => {
    for (const name of namedTypes(typeName)) {
      const target = types.get(name);
      if (target && target.id !== ref.type) target.usedBy.push(ref);
    }
  };
  for (const t of types.values()) {
    for (const m of t.members ?? []) {
      const ref = { type: t.id, member: m.slug, name: m.name, kind: m.kind };
      if (m.kind === 'property') {
        note(m.type, { ...ref, role: 'returns' });
        for (const p of m.indexParameters) note(p.type, { ...ref, role: 'accepts' });
      } else {
        note(m.signature.returnType, { ...ref, role: 'returns' });
        for (const p of m.signature.parameters) note(p.type, { ...ref, role: p.direction === 'out' ? 'returns' : 'accepts' });
      }
    }
    for (const f of t.fields ?? []) note(f.type, { type: t.id, member: null, name: f.name, kind: 'field', role: 'returns' });
  }

  return { assemblies, namespaces, types, all };
}

function categoryOf(t, categories) {
  const name = shortName(t.name);
  for (const c of categories) {
    if (c.kinds && !c.kinds.includes(t.kind)) continue;
    if (c.match.some((re) => re.test(name))) return c.id;
  }
  return defaultCategory(t.kind);
}

export const defaultCategory = (kind) => (kind === 'enum' ? 'enums' : kind === 'delegate' ? 'delegates' : ['struct', 'class'].includes(kind) ? 'structs' : 'other');

// Members a type inherits, grouped by the base interface that declares them (nearest first), skipping names the
// type itself (or a nearer base) redeclares.
export function inheritedMembers(model, type) {
  const seen = new Set((type.members ?? []).map((m) => m.name));
  const groups = [];
  const order = orderBases(model, type);
  for (const baseId of order) {
    const base = model.types.get(baseId);
    if (!base) {
      groups.push({ base: baseId, external: true, members: [] });
      continue;
    }
    const members = base.members.filter((m) => !seen.has(m.name));
    for (const m of members) seen.add(m.name);
    if (members.length) groups.push({ base: baseId, members });
  }
  return groups;
}

// Base interfaces breadth-first from the type, so the nearest declaration of a member wins.
export function orderBases(model, type) {
  const out = [];
  const queue = [...(type.bases ?? [])];
  while (queue.length) {
    const id = queue.shift();
    if (out.includes(id)) continue;
    out.push(id);
    queue.push(...(model.types.get(id)?.bases ?? model.all.get(id)?.interfaces ?? []));
  }
  for (const id of type.allBases ?? []) if (!out.includes(id)) out.push(id);
  return out;
}
