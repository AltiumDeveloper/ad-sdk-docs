// Cross-references from prose: finds API names in descriptions and guides and turns them into links.
//
// What is recognised:
// - type names: `ISch_MapDefiner`, `TRotationBy90`, qualified `SCH.ISch_Pin` or `EDP.Utils`;
// - members: `ISch_Component.Orientation`, `ISch_Component.GetState_Orientation`, `EDP.Utils.GetBomManagerFactory()`,
//   and, on a type's own page, its own and inherited accessor and method names (`GetState_Orientation`,
//   `SchIterator_Create`); a member inherited from a base interface links to the base interface's section.
// In plain text only names that look like code are linked (see `looksLikeCode`), so ordinary words that happen to be
// type names ("Parameter", "Utils") stay text; inside `code spans` every known name is linked. Short names defined in
// several namespaces resolve to the current page's namespace, or are left alone when still ambiguous.

import { orderBases } from './model.mjs';

// Code-like: an interface or enum style prefix (`IFoo`, `TFoo`), an underscore, or a compound PascalCase word
// (`GlobalVars`, `SCHConstant`). Plain dictionary-like words (`Parameter`, `Utils`, `Coord`) are not.
export const looksLikeCode = (name) => /^[IT][A-Z]/.test(name) || name.includes('_') || /[a-z0-9][A-Z]|[A-Z]{2,}[a-z]/.test(name);

export function buildXrefIndex(model, { route }) {
  const byShort = new Map();
  const byId = new Map();
  for (const t of model.types.values()) {
    // Base interfaces, nearest first: a member a type inherits resolves to the base that declares it.
    const entry = { id: t.id, ns: t.namespace, name: t.name, route: route(t), members: new Map(), bases: orderBases(model, t) };
    for (const m of t.members ?? []) {
      const anchor = t.anchors?.get(m.slug);
      if (!anchor) continue;
      for (const n of [m.name, m.getter?.name, m.setter?.name].filter(Boolean)) if (!entry.members.has(n)) entry.members.set(n, anchor);
    }
    byId.set(t.id, entry);
    // Generic types are mentioned without their parameters: `BaseClientService`.
    for (const short of new Set([t.name, t.name.replace(/<.*$/, '')])) {
      if (!byShort.has(short)) byShort.set(short, []);
      byShort.get(short).push(entry);
    }
  }
  return { byShort, byId };
}

// Serialisable form for the remark plugin and the link check.
export function serializeXrefIndex(index) {
  return {
    types: [...index.byId.values()].map((e) => ({ id: e.id, ns: e.ns, name: e.name, route: e.route, members: Object.fromEntries(e.members), bases: e.bases ?? [] })),
  };
}

export function loadXrefIndex(data) {
  const byShort = new Map();
  const byId = new Map();
  for (const t of data.types) {
    const entry = { ...t, members: new Map(Object.entries(t.members)), bases: t.bases ?? [] };
    byId.set(t.id, entry);
    for (const short of new Set([t.name, t.name.replace(/<.*$/, '')])) {
      if (!byShort.has(short)) byShort.set(short, []);
      byShort.get(short).push(entry);
    }
  }
  return { byShort, byId };
}

// The type a name refers to from a page in namespace `ns` (null when unknown or ambiguous).
export function resolveType(index, name, ns) {
  if (index.byId.has(name)) return index.byId.get(name);
  const candidates = index.byShort.get(name) ?? [];
  if (candidates.length === 1) return candidates[0];
  const local = candidates.filter((c) => c.ns === ns);
  return local.length === 1 ? local[0] : null;
}

// A member of a type, declared by the type itself or inherited from a base interface → { type, anchor }, where
// `type` is the declaring type (its page has the member's section).
export function resolveMember(index, entry, name) {
  if (entry.members.has(name)) return { type: entry, anchor: entry.members.get(name) };
  for (const id of entry.bases ?? []) {
    const base = index.byId.get(id);
    if (base?.members.has(name)) return { type: base, anchor: base.members.get(name) };
  }
  return null;
}

// A dotted or bare name → { type, anchor } (anchor null for a type), from a page showing `current` (an index entry).
export function resolveName(index, name, { ns, current } = {}) {
  const clean = name.replace(/\(\)$/, '');
  const whole = resolveType(index, clean, ns);
  if (whole) return { type: whole, anchor: null };
  const dot = clean.lastIndexOf('.');
  if (dot > 0) {
    const owner = resolveType(index, clean.slice(0, dot), ns);
    return owner ? resolveMember(index, owner, clean.slice(dot + 1)) : null;
  }
  // A bare member name of the current type (own or inherited), only when it is unmistakably code
  // (`GetState_Orientation`).
  if (current && looksLikeCode(clean)) return resolveMember(index, current, clean);
  return null;
}

// Identifier-like tokens: dotted names, optionally followed by `()`.
const NAME = /[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*(?:\(\))?/g;

// Links API names in a Markdown text fragment. `href(type, anchor)` builds the link target. Existing links, URLs
// and code spans that are not exactly one name are left alone; the current type is written as code, not linked.
export function linkify(markdown, index, { ns, current = null, currentAnchor = null, href }) {
  const text = String(markdown ?? '');
  // Protected regions: links `[..](..)`, autolinks, URLs, HTML entities.
  const protectedRe = /\[[^\]]*\]\([^)]*\)|<https?:[^>]*>|https?:\/\/\S+|&[a-z]+;/g;
  let out = '';
  let last = 0;
  const process = (chunk) => chunk
    // Code spans: link when the whole span is one known name.
    .split(/(`[^`]+`)/)
    .map((part) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        const inner = part.slice(1, -1).trim();
        const hit = resolveName(index, inner, { ns, current });
        return hit && !isSelf(hit, current, currentAnchor) ? `[${part}](${href(hit.type, hit.anchor)})` : part;
      }
      return part.replace(NAME, (token) => {
        const name = token.replace(/\(\)$/, '');
        const leaf = name.slice(name.lastIndexOf('.') + 1);
        if (!looksLikeCode(name.includes('.') ? name.replace(/\./g, '') : leaf)) return token;
        const hit = resolveName(index, name, { ns, current });
        if (!hit) return token;
        // The page's own type, or the member whose section this is: code style like every other API name, but no
        // link to itself.
        if (isSelf(hit, current, currentAnchor)) return `\`${token}\``;
        return `[\`${token}\`](${href(hit.type, hit.anchor)})`;
      });
    })
    .join('');
  for (const m of text.matchAll(protectedRe)) {
    out += process(text.slice(last, m.index)) + m[0];
    last = m.index + m[0].length;
  }
  return out + process(text.slice(last));
}

const isSelf = (hit, current, currentAnchor = null) => Boolean(current) && hit.type.id === current.id
  && (!hit.anchor || (currentAnchor !== null && hit.anchor === currentAnchor));

// Mentions of API names that are not links, in a Markdown document (fenced code ignored): used by check-xrefs.
// `current`: names of the page's own type and members are exempt (the generator writes them as code in their own
// section and links them elsewhere; see linkify).
export function unlinkedMentions(markdown, index, { ns, current = null, codeSpansLinked = false }) {
  const own = (hit) => Boolean(current) && hit.type.id === current.id;
  const body = String(markdown).replace(/^---\n[\s\S]*?\n---\n/, '').replace(/```[\s\S]*?```/g, '');
  const found = [];
  for (const raw of body.split('\n')) {
    if (/^#{1,6} /.test(raw)) continue; // headings are titles, not references
    if (/^\*\*[^*]+:\*\*/.test(raw)) continue; // generated facts (**Type:**, **Namespace:**): linked by the signature linker
    // Tables: only the description (last) column is prose; name and type columns are structural.
    const line = raw.startsWith('|') ? raw.split(/(?<!\\)\|/).slice(-2, -1).join('') : raw;
    const stripped = line.replace(/\[[^\]]*\]\([^)]*\)/g, ' ').replace(/https?:\/\/\S+/g, ' ');
    for (const part of stripped.split(/(`[^`]+`)/)) {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        if (codeSpansLinked) continue;
        const inner = part.slice(1, -1).trim();
        const hit = resolveName(index, inner, { ns, current });
        if (hit && !own(hit)) found.push(inner);
        continue;
      }
      for (const token of part.match(NAME) ?? []) {
        const name = token.replace(/\(\)$/, '');
        const leaf = name.slice(name.lastIndexOf('.') + 1);
        if (!looksLikeCode(name.includes('.') ? name.replace(/\./g, '') : leaf)) continue;
        const hit = resolveName(index, name, { ns, current });
        if (hit && !own(hit)) found.push(name);
      }
    }
  }
  return found;
}
