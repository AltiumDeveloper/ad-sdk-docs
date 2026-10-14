// Site configuration: which namespaces are documented (config/namespaces.yaml) and their sidebar categories
// (config/categories.yaml).
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export function loadNamespaces(path = 'config/namespaces.yaml') {
  const { namespaces } = parse(readFileSync(path, 'utf8'));
  return namespaces.map((ns) => ({ ...ns, slug: ns.slug ?? ns.id.toLowerCase() }));
}

export function loadCategories(namespace, path = 'config/categories.yaml') {
  const config = parse(readFileSync(path, 'utf8')) ?? {};
  return (config[namespace] ?? []).map((c) => ({ ...c, match: (c.match ?? []).map((m) => new RegExp(m)) }));
}
