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

// Types not published (config/hidden-types.yaml).
export function loadHidden(path = 'config/hidden-types.yaml') {
  return new Set(parse(readFileSync(path, 'utf8'))?.hidden ?? []);
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

// "Edit this page" of a type page: its description file content/<NS>/<file>.yaml. Most types have no file yet; for
// those the link opens GitHub's new-file form with the file name and a starter template filled in (an edit link to a
// missing file is a 404).
export function editUrl(site, type, exists) {
  const dir = `content/${type.namespace}`;
  const file = `${type.file}.yaml`;
  if (exists) return `${site.repo}/edit/${site.branch}/${dir}/${file}`;
  const template = `# Description of ${type.id}: see CONTRIBUTING.md, "Describe a type or member".\nsummary: \n`;
  return `${site.repo}/new/${site.branch}/${dir}?filename=${encodeURIComponent(file)}&value=${encodeURIComponent(template)}`;
}

// The category of a type: the first configured category matching its name, else the fallback for its kind.
export function categoryOf(type, categories) {
  const c = categories.find((x) => (!x.kinds || x.kinds.includes(type.kind)) && x.match.some((re) => re.test(type.name)));
  return c?.id ?? defaultCategory(type.kind);
}
