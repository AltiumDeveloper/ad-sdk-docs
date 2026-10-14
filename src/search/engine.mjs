// Schema-aware search engine shared by the browser (src/theme/SearchBar), the index build
// (scripts/apidocs/search-index.mjs) and the ranking eval (scripts/apidocs/search-eval.mjs).
//
// Records come from the schema, not from rendered HTML: one per operation, type, field, input field, enum value,
// guide section and bounded-context overview. MiniSearch finds candidates (BM25 over boosted fields); `search` then
// re-ranks them with explicit API-reference rules — an exact name beats a prefix beats a word match, operations and
// types beat members, deprecated items sink — so a type named like the query never drowns among the fields that share
// a word with it.
import MiniSearch from 'minisearch';

// Record kinds, in the order of the UI tabs. `group` drives the tabs; `weight` is the kind's prior.
export const KINDS = {
  interface: { label: 'Interface', group: 'types', weight: 1.4 },
  enum: { label: 'Enum', group: 'types', weight: 1.1 },
  class: { label: 'Class', group: 'types', weight: 1.0 },
  struct: { label: 'Struct', group: 'types', weight: 1.0 },
  property: { label: 'Property', group: 'members', weight: 0.5 },
  method: { label: 'Method', group: 'members', weight: 0.45 },
  enumValue: { label: 'Enum value', group: 'members', weight: 0.35 },
  overview: { label: 'Namespace', group: 'guides', weight: 1.6 },
  guide: { label: 'Guide', group: 'guides', weight: 1.2 },
};

export const GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'types', label: 'Types' },
  { id: 'members', label: 'Members' },
  { id: 'guides', label: 'Guides' },
];

export const FLAG_EXPERIMENTAL = 1;
export const FLAG_DEPRECATED = 2;

const MEMBER_KINDS = new Set(['property', 'method', 'enumValue']);
export const isMember = (kind) => MEMBER_KINDS.has(kind);

// Splits an identifier into its words: `desProjectById` → des project by id, `BOMItem_v2` → bom item v 2,
// `design.project.byId` → design project by id.
export function identifierWords(identifier) {
  return identifier
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const WORD = /[A-Za-z0-9_][\w.]*[A-Za-z0-9_]|[A-Za-z0-9]/g;

// English plural → singular for name words (`comments` → comment, `entries` → entry, `addresses` → address), leaving
// words that only look plural alone (`status`, `class`, `analysis`, `bus`).
export function singular(word) {
  if (word.length <= 3 || /(?:ss|us|is|ics)$/.test(word)) return word;
  if (/ies$/.test(word) && word.length > 4) return `${word.slice(0, -3)}y`;
  if (/(?:ches|shes|sses|xes|zes)$/.test(word)) return word.slice(0, -2);
  if (/s$/.test(word)) return word.slice(0, -1);
  return word;
}

// Every word becomes its lower-cased self (identifiers stay whole, `desProjectById` → `desprojectbyid`) plus its parts
// and their singulars, so a query matches either the whole name or any word in it, in either number. Used for both
// indexing and querying.
// Names also get their suffixes at word boundaries (`desComponentType` → `componenttype`): type and operation names
// start with a context prefix (`Des`, `bom`, `sup`, …) that readers rarely type, so without them a prefix query
// ("componentTy") would only ever complete field names, which have no prefix.
export function tokenize(text, fieldName) {
  const tokens = [];
  for (const word of String(text ?? '').match(WORD) ?? []) {
    const whole = word.toLowerCase();
    tokens.push(whole);
    const parts = identifierWords(word);
    if (parts.length > 1 || parts[0] !== whole) tokens.push(...parts);
    for (const part of parts) {
      const one = singular(part);
      if (one !== part) tokens.push(one);
    }
    if (fieldName === 'name') for (let k = 1; k < parts.length - 1; k += 1) tokens.push(parts.slice(k).join(''));
  }
  return tokens;
}

const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'does', 'for', 'from', 'how',
  'i', 'in', 'is', 'it', 'my', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'what', 'which', 'with']);

export const isStopWord = (word) => STOP_WORDS.has(word);

// Stop words are dropped from prose only: in names, `by` (`desProjectById`) and `of` are meaningful. Queries drop
// them only when they are phrases ("how to page a connection"), not names.
const processTerm = (term, fieldName) => (fieldName === 'text' && STOP_WORDS.has(term) ? null : term);

const FIELDS = ['name', 'parent', 'title', 'text'];
// The parent type only qualifies a member ("DesProject name"): weighted high, every field of DesComponent would
// match "component" twice and outrank DesComponent itself.
const BOOST = { name: 6, parent: 0.3, title: 4, text: 1 };

export function createIndex(records) {
  const index = new MiniSearch({
    idField: 'i',
    fields: FIELDS,
    storeFields: [],
    tokenize,
    processTerm,
    extractField: (record, field) => {
      switch (field) {
        case 'i': return record.i;
        case 'name': return record.a ? `${record.n} ${record.a.join(' ')}` : record.n;
        case 'parent': return record.p ?? '';
        case 'title': return record.t ?? '';
        case 'text': return record.d ?? '';
        default: return undefined;
      }
    },
  });
  index.addAll(records);
  return index;
}

const normalise = (text) => String(text ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// How strongly the record's name answers the query as a whole. Members get smaller bonuses: hundreds of types have an
// `id` or a `name`, and none of those should outrank the type called that.
function nameBonus(record, query, prefixes, allowTypos) {
  const q = normalise(query);
  if (!q) return 1;
  const member = isMember(record.k);
  const name = normalise(record.n);
  const qualified = record.p ? normalise(`${record.p}${record.n}`) : null;
  // `DesTask.status`: written as a member, so it beats the enum `DesTaskStatus` with the same letters.
  const dotted = query.includes('.');
  // Unambiguous, so decisive: the type's own name repeats every query word and outscores the member several times over.
  if (dotted && qualified === q) return 100;
  // Typed exactly, case included: `GloScrScript` the type before `gloScrScript` the query.
  if (record.n === query.trim()) return member ? 3.3 : 13;
  // Accessor names of a property (`GetState_Orientation`) answer the query as exactly as its own name.
  if (record.a?.some((alias) => alias === query.trim() || normalise(alias) === q)) return member ? 3.2 : 12;
  if (dotted && record.p && record.a?.some((alias) => normalise(`${record.p}${alias}`) === q)) return 100;
  if (name === q) return member ? 3 : dotted && !record.n.includes('.') ? 6 : 12;
  if (qualified === q) return 12;
  const core = coreWords(record, prefixes);
  if (!member && core.join('') === q) return 6; // "component" → DesComponent, "project by id" → desProjectById
  // The same, in the other number: "comments" → DesComment, "project" → desProjects (below DesProject's 6).
  const qSingular = identifierWords(query).map(singular).join('');
  if (core.map(singular).join('') === qSingular) return member ? 2 : 4.5;
  const leaf = record.n.includes('.') ? normalise(record.n.split('.').at(-1)) : null;
  if (leaf === q) return 4; // `byId` → every `*.byId`
  // Typed-ahead name: the closer the prefix is to the whole name, the better (`DesComp` → DesComponent before
  // DesComponentParameter).
  if (q.length >= 3 && name.startsWith(q)) return member ? 1.4 : 1.5 + 4.5 * (q.length / name.length);
  if (qualified && q.length >= 3 && qualified.startsWith(q)) return 3;
  // A mistyped name (`desProjcetById`, `workspce`): one edit away, or two for long names. Only when nothing matches the
  // query exactly, or `releaseId` (a field) would lose to `desReleaseById` (two edits away).
  if (allowTypos && q.length >= 5 && !/\s/.test(query.trim())) {
    const allowed = q.length >= 9 ? 2 : 1;
    if (withinEdits(q, name, allowed) || withinEdits(q, core.join(''), allowed)) return member ? 1.5 : 4;
  }
  return 1;
}

// Damerau-Levenshtein distance (adjacent transpositions count as one edit) ≤ max, with an early exit.
export function withinEdits(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prevPrev = null;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (prevPrev && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, prevPrev[j - 2] + 1);
      row.push(value);
      if (value < best) best = value;
    }
    if (best > max) return false;
    prevPrev = prev;
    prev = row;
  }
  return prev[b.length] <= max;
}

// Share of the name's words that the query accounts for: for "project by id", `desProjectById` (3 of 4) is a better
// answer than `supSoftwareProjectEvalKitCompatibleSoftwareProjectIdsByEvalKitId` (4 of 12), which BM25 alone prefers
// because it repeats the words.
const coreWordsCache = new WeakMap();

// The words of a name without its leading context prefix: `DesComponent` → component, `platform.token.byId` →
// token by id, `GloScrScript` → script. `prefixes` are word sequences, longest first (loadIndex); a name is never
// stripped to nothing (`Bom` stays bom).
function coreWords(record, prefixes) {
  let words = coreWordsCache.get(record);
  if (!words) {
    words = identifierWords(record.n);
    const prefix = prefixes.find((seq) => words.length > seq.length && seq.every((word, i) => words[i] === word));
    if (prefix) words = words.slice(prefix.length);
    coreWordsCache.set(record, words);
  }
  return words;
}

function nameFit(record, queryParts, prefixes) {
  const nameWords = coreWords(record, prefixes);
  if (!nameWords.length) return 1;
  const fit = nameWords.filter((word) => queryParts.some((part) => word.startsWith(part))).length / nameWords.length;
  return 0.35 + 0.65 * fit;
}

// Phrasings that never appear in names (config/search.yaml `synonyms`, compiled by loadIndex): `[pattern, words]`.
export const compileSynonyms = (synonyms = []) => synonyms.map(({ match, add }) => [new RegExp(match, 'i'), String(add)]);

// → the identifier words the query stands for ("bill of materials" → ['bom']); empty when none applies.
export function synonymsOf(query, synonyms = []) {
  const lower = query.toLowerCase();
  return synonyms.filter(([pattern, word]) => pattern.test(lower) && !lower.includes(word)).map(([, word]) => word);
}

// Share of the query's words that the record actually contains (in any field). BM25 already rewards it, but a single
// rare word in a long description can still beat a name that contains two of three words; squaring keeps partial
// matches below complete ones.
function coverage(record, words) {
  if (words.length < 2) return 1;
  const haystack = `${normalise(record.n)} ${normalise(record.p)} ${(record.t ?? '').toLowerCase()} ${(record.d ?? '').toLowerCase()}`;
  const hits = words.filter((word) => haystack.includes(word)).length;
  return (hits / words.length) ** 2;
}

/**
 * @param {MiniSearch} index from createIndex
 * @param {object[]} records the same records, indexed by their `i`
 * @param {string} query
 * @param {{group?: string, context?: number|null, includeDeprecated?: boolean, currentContext?: number|null,
 *   contextWeights?: number[], prefixes?: Set<string>, synonyms?: [RegExp, string][], limit?: number}} options
 *   (`contextWeights`, `prefixes` and `synonyms` as returned by loadIndex)
 */
export function search(index, records, query, options = {}) {
  const {
    group = 'all', context = null, includeDeprecated = true, currentContext = null, contextWeights = [], prefixes = [],
    synonyms: synonymTable = [], limit = 50,
  } = options;
  const trimmed = query.trim();
  if (!trimmed) return [];
  let words = trimmed.toLowerCase().split(/\s+/).map(normalise).filter(Boolean);
  const phrase = words.length > 2;
  if (phrase) words = words.filter((word) => !STOP_WORDS.has(word));
  if (!words.length) return [];
  const synonyms = synonymsOf(trimmed, synonymTable);
  const text = [phrase ? words.join(' ') : trimmed, ...synonyms].join(' ');
  const synonymWords = synonyms.flatMap((synonym) => synonym.split(' '));
  const queryParts = [...new Set(tokenize(text).flatMap((token) => identifierWords(token)))];
  const filter = (hit) => {
    const record = records[hit.id];
    if (group !== 'all' && KINDS[record.k]?.group !== group) return false;
    if (context !== null && record.c !== context) return false;
    if (!includeDeprecated && record.f & FLAG_DEPRECATED) return false;
    return true;
  };
  const hits = index.search(text, {
    boost: BOOST,
    prefix: (term) => term.length >= 2,
    fuzzy: (term) => (term.length >= 5 ? 0.2 : false),
    combineWith: 'OR',
    filter,
  });
  const candidates = hits.slice(0, 600);
  const q = normalise(trimmed);
  const allowTypos = !candidates.some(({ id }) => normalise(records[id].n) === q || coreWords(records[id], prefixes).join('') === q);
  // `@deprecated` names a directive, not the guide about deprecation.
  const directiveQuery = trimmed.startsWith('@');
  const scored = candidates.map((hit) => {
    const record = records[hit.id];
    let score = hit.score;
    score *= KINDS[record.k]?.weight ?? 1;
    if (directiveQuery && record.k === 'directive') score *= 3;
    // A synonym stands for a name as much as the query does ("reference design" → `ref design` → SupRefDesign).
    const bonus = Math.max(nameBonus(record, trimmed, prefixes, allowTypos), ...synonyms.map((synonym) => nameBonus(record, synonym, prefixes, false)));
    score *= bonus;
    if (bonus === 1) score *= nameFit(record, queryParts, prefixes);
    // A record matched through a synonym answers the phrase as well as one containing its words.
    score *= synonymWords.length ? Math.max(coverage(record, words), coverage(record, synonymWords)) : coverage(record, words);
    score *= contextWeights[record.c] ?? 1;
    // Experimental is not demoted: whole namespaces (`design.*`) are experimental and they are the newest API.
    if (record.f & FLAG_DEPRECATED) score *= 0.25;
    if (currentContext !== null && record.c === currentContext) score *= 1.25;
    return { record, score, terms: hit.terms };
  });
  scored.sort((a, b) => b.score - a.score || a.record.n.length - b.record.n.length);
  // The long tail of a broad OR query (one fuzzy word out of three in a description) is noise, and it inflates the
  // result counts: keep what scores within MIN_RELATIVE_SCORE of the best.
  const floor = (scored[0]?.score ?? 0) * MIN_RELATIVE_SCORE;
  return scored.filter((result) => result.score >= floor).slice(0, limit);
}

const MIN_RELATIVE_SCORE = 0.02;

// Members sharing a name (`id` on 400 types) collapse into their best-scored record; the others are kept in `others`
// (in rank order) for the UI to expand, and counted in `more`.
export function collapseMembers(results, { keepAll = false } = {}) {
  if (keepAll) return results.map((result) => ({ ...result, more: 0, others: [] }));
  const seen = new Map();
  const out = [];
  for (const result of results) {
    if (!isMember(result.record.k)) {
      out.push({ ...result, more: 0, others: [] });
      continue;
    }
    const key = `${result.record.k}:${result.record.n}`;
    const first = seen.get(key);
    if (first) {
      first.more += 1;
      first.others.push(result.record);
    } else {
      const entry = { ...result, more: 0, others: [] };
      seen.set(key, entry);
      out.push(entry);
    }
  }
  return out;
}

export function loadIndex(payload) {
  const records = payload.records;
  const contextWeights = payload.contexts.map((context) => context.weight ?? 1);
  const prefixes = (payload.prefixes ?? []).map((prefix) => identifierWords(prefix)).sort((a, b) => b.length - a.length);
  const synonyms = compileSynonyms(payload.synonyms);
  return { records, contexts: payload.contexts, contextWeights, prefixes, synonyms, index: createIndex(records) };
}

// Options for `search` that come from the index itself.
export const indexOptions = ({ contextWeights, prefixes, synonyms }) => ({ contextWeights, prefixes, synonyms });
