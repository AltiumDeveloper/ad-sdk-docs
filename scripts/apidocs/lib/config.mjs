// Site configuration: which namespaces are documented (config/namespaces.yaml) and their sidebar categories
// (config/categories.yaml).
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { defaultCategory, namespaceSlug } from './model.mjs';

export function loadNamespaces(path = 'config/namespaces.yaml') {
  const { namespaces } = parse(readFileSync(path, 'utf8'));
  // `label`: "Schematic (SCH)", or just "PCB" when the title is the namespace name.
  return namespaces.map((ns) => ({ ...ns, slug: ns.slug ?? namespaceSlug(ns.id), label: ns.title === ns.id ? ns.id : `${ns.title} (${ns.id})` }));
}

// Areas every namespace can fall back to (types no configured category matches). A namespace without configured
// interface areas shows its interfaces under one "Interfaces" area.
const DEFAULTS = [
  { id: 'enums', title: 'Enumerations', kinds: ['enum'] },
  { id: 'structs', title: 'Structures and classes', kinds: ['struct', 'class'] },
  { id: 'delegates', title: 'Delegates', kinds: ['delegate'] },
];

export function loadCategories(namespace, path = 'config/categories.yaml') {
  const config = parse(readFileSync(path, 'utf8')) ?? {};
  const configured = (config[namespace] ?? []).map((c) => ({ ...c, match: (c.match ?? []).map((m) => new RegExp(m)) }));
  const ids = new Set(configured.map((c) => c.id));
  const hasAreas = configured.some((c) => !c.kinds || c.kinds.includes('interface'));
  const fallbacks = [...DEFAULTS, { id: 'other', title: hasAreas ? 'Other interfaces' : 'Interfaces' }]
    .filter((c) => !ids.has(c.id))
    .map((c) => ({ ...c, match: [] }));
  return [...configured, ...fallbacks];
}

// The category of a type: the first configured category matching its name, else the fallback for its kind.
export function categoryOf(type, categories) {
  const c = categories.find((x) => (!x.kinds || x.kinds.includes(type.kind)) && x.match.some((re) => re.test(type.name)));
  return c?.id ?? defaultCategory(type.kind);
}
