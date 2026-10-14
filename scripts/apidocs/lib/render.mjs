// Markdown rendering of the API model. Pages are CommonMark (`.md`, Docusaurus `markdown.format: 'detect'`), so they
// double as the Markdown twins served to LLMs: no JSX, no raw HTML, links between pages are relative `.md` paths.
//
// One page per type. Members are `###` sections of their type's page (listed in the page's table of contents); a
// property section covers both accessor methods. Anchors are the ids Docusaurus gives the headings (github-slugger
// over the heading text, in page order), computed here so tables, cross-links and search can point at them.
import { createRequire } from 'node:module';
import { inheritedMembers, namedTypes, orderBases } from './model.mjs';
import { linkify } from './xref.mjs';

const require = createRequire(import.meta.url);
const GithubSlugger = require('github-slugger');

const KIND_TITLE = { interface: 'interface', enum: 'enumeration', struct: 'structure', class: 'class', delegate: 'delegate' };

// --- paths -----------------------------------------------------------------------------------------------------
// docs/reference/<ns-slug>/<Type>.md (nested types: `Outer-Inner.md`)
export const typeFile = (type) => `${type.nsSlug}/${type.file}.md`;
export const typeRoute = (type) => `/reference/${typeFile(type).replace(/\.md$/, '')}`;

function relativePath(from, to) {
  if (from === to) return '';
  const a = from.split('/').slice(0, -1);
  const b = to.split('/');
  let i = 0;
  while (i < a.length && i < b.length - 1 && a[i] === b[i]) i += 1;
  const up = a.length - i;
  return `${up ? '../'.repeat(up) : './'}${b.slice(i).join('/')}`;
}

// --- text --------------------------------------------------------------------------------------------------------
export const escapeText = (text) => String(text ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cell = (text) => escapeText(text).replace(/\|/g, '\\|').replace(/\s*\n+\s*/g, ' ');
// Heading text: a leading `_` (`_Finalize`) would start emphasis.
const headingText = (text) => escapeText(String(text).replace(/^_/, '\\_'));

// First sentence of a description, for tables and front-matter descriptions.
export function firstSentence(text, limit = 200) {
  const plain = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  const match = /^(.+?[.!?])(\s|$)/.exec(plain);
  const sentence = match ? match[1] : plain;
  return sentence.length > limit ? `${sentence.slice(0, limit - 1).trimEnd()}…` : sentence;
}

const paragraphs = (text) => escapeText(text).trim();

// Description text with API names linked (xref.mjs). Before the cross-reference index exists (the anchor layout
// pass), the text is only escaped.
// `anchor`: the member whose section (or table row) the text belongs to; it is written as code, not linked.
function prose(ctx, link, type, text, { anchor = null } = {}) {
  const escaped = escapeText(text).trim();
  if (!ctx.xref || !escaped) return escaped;
  return linkify(escaped, ctx.xref, {
    ns: type.namespace, current: ctx.xref.byId.get(type.id), currentAnchor: anchor, href: (e, a) => link.xrefHref(e, a),
  });
}
const proseCell = (ctx, link, type, text, options) => prose(ctx, link, type, text, options).replace(/\|/g, '\\|').replace(/\s*\n+\s*/g, ' ');

// --- type names --------------------------------------------------------------------------------------------------
// C# type text: namespaces dropped, `Nullable<int>` written `int?`.
const shortType = (type) => String(type)
  .replace(/\b(?:[A-Za-z_]\w*\.)+([A-Za-z_]\w*)/g, (_, last) => last)
  .replace(/\bNullable<([^<>]+)>/g, '$1?');

// `<in T, out TResult>` and ` where T : class, new()` for a list of generic parameters.
export const typeParameterList = (params = [], { variance = false } = {}) => (params.length
  ? `<${params.map((g) => `${variance && g.variance ? `${g.variance} ` : ''}${g.name}`).join(', ')}>`
  : '');
export const whereClauses = (params = []) => params.filter((g) => g.constraints?.length)
  .map((g) => ` where ${g.name} : ${g.constraints.map(shortType).join(', ')}`).join('');

// C# signature text for code blocks: types without namespaces.
export function methodSignature(signature, { name = signature.name } = {}) {
  const params = signature.parameters.map((p) => `${p.direction ? `${p.direction} ` : ''}${shortType(p.type)} ${p.name}`);
  const generics = signature.genericParameters ?? [];
  return `${shortType(signature.returnType)} ${name}${typeParameterList(generics)}(${params.join(', ')})${whereClauses(generics)};`;
}

export class Linker {
  constructor(model, fromFile) {
    this.model = model;
    this.fromFile = fromFile;
  }

  typeHref(id) {
    // A constructed generic (`SetHelper<TObjectId>`) links to its definition (`SetHelper`1`).
    const t = this.model.types.get(id) ?? [1, 2, 3, 4].map((n) => this.model.types.get(`${id}\`${n}`)).find(Boolean);
    if (!t) return null;
    return relativePath(this.fromFile, typeFile(t)) || '#';
  }

  memberHref(typeId, slug) {
    const t = this.model.types.get(typeId);
    const anchor = t?.anchors?.get(slug);
    if (!anchor) return null;
    return `${relativePath(this.fromFile, typeFile(t))}#${anchor}`;
  }

  // Target of a cross-reference index entry (xref.mjs), optionally a member anchor.
  xrefHref(entry, anchor) {
    const t = this.model.types.get(entry.id);
    const path = relativePath(this.fromFile, typeFile(t));
    return anchor ? `${path}#${anchor}` : path || '#';
  }

  // `SCH.ISch_Pin[]` → [ISch_Pin](./ISch_Pin.md)[]; types outside the documented namespaces stay qualified code.
  type(typeName) {
    const text = String(typeName);
    const named = namedTypes(text);
    if (!named.length) return `\`${shortType(text)}\``;
    let out = '';
    let rest = text;
    for (const name of named) {
      const at = rest.indexOf(name);
      out += codeIfAny(rest.slice(0, at));
      const href = this.typeHref(name);
      const display = href ? name.slice(name.lastIndexOf('.') + 1) : name.startsWith('System.') ? name.slice(name.lastIndexOf('.') + 1) : name;
      out += href ? `[${display}](${href})` : `\`${display}\``;
      rest = rest.slice(at + name.length);
    }
    return out + codeIfAny(rest);
  }

  ref(id) {
    if (this.model.types.has(id)) {
      const t = this.model.types.get(id);
      return `[${t.name}](${this.typeHref(id)})`;
    }
    const dot = id.lastIndexOf('.');
    const typeId = id.slice(0, dot);
    const slug = id.slice(dot + 1);
    const t = this.model.types.get(typeId);
    const m = t?.members?.find((x) => x.slug === slug);
    const href = m && this.memberHref(typeId, slug);
    return href ? `[${t.name}.${m.name}](${href})` : null;
  }
}
const codeIfAny = (text) => (text.trim() ? `\`${text.trim()}\`` : '');

// --- front matter --------------------------------------------------------------------------------------------------
function frontMatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    const text = Array.isArray(value) ? JSON.stringify(value) : typeof value === 'string' && value !== 'null' ? JSON.stringify(value) : value;
    lines.push(`${key}: ${text}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

const gap = '*No description yet.*';

function exampleLinks(refs, ctx) {
  if (!refs?.length) return [];
  const base = `${ctx.examplesRepo}/blob/${ctx.examples.commit ?? 'main'}`;
  return refs.map((r) => `[${r.example}](${base}/${r.file.split('/').map(encodeURIComponent).join('/')}#L${r.line})`);
}

function seeAlsoLinks(link, refs) {
  return (refs ?? []).map((id) => link.ref(id)).filter(Boolean);
}

// --- page writer: tracks heading anchors the way Docusaurus assigns them -----------------------------------------
class Page {
  constructor() {
    this.lines = [];
    this.slugger = new GithubSlugger();
  }

  push(...lines) {
    this.lines.push(...lines);
  }

  heading(level, text) {
    this.lines.push(`${'#'.repeat(level)} ${headingText(text)}`, '');
    return this.slugger.slug(text);
  }

  text() {
    return this.lines.join('\n');
  }
}

// --- type pages ----------------------------------------------------------------------------------------------------
// Two passes: `layoutAnchors` renders every page once to learn its member anchors (headings never depend on links),
// then `renderType` renders the final pages with all cross-page member links resolvable.
export function layoutAnchors(model, ctx) {
  for (const type of model.types.values()) type.anchors = new Map();
  for (const type of model.types.values()) renderType(model, type, ctx);
}

export function renderType(model, type, ctx) {
  const file = typeFile(type);
  const link = new Linker(model, file);
  const content = ctx.content(type.id);
  const title = `${type.name} ${KIND_TITLE[type.kind]}`;
  const page = new Page();
  page.push(frontMatter({
    title,
    sidebar_label: type.name,
    description: firstSentence(content.summary) || `${type.name} ${KIND_TITLE[type.kind]} in the ${type.namespace} namespace.`,
    custom_edit_url: ctx.editUrl(type),
    toc_max_heading_level: 3,
    pagination_next: 'null',
    pagination_prev: 'null',
  }));
  page.heading(1, title);
  page.push(content.summary ? prose(ctx, link, type, content.summary) : gap, '');
  page.push('```csharp', declaration(type), '```', '');
  page.push(`**Namespace:** ${type.namespace} · **Assembly:** ${type.assembly}`, '');

  if (type.kind === 'interface') {
    if (orderBases(model, type).length) page.push(`**Inherits:** ${inheritanceChain(model, type, link)}`, '');
    if (type.derived.length) page.push(`**Derived:** ${type.derived.map((d) => link.type(d)).join(', ')}`, '');
  }
  if (content.remarks) {
    page.heading(2, 'Remarks');
    page.push(prose(ctx, link, type, content.remarks), '');
  }
  const typeExample = ctx.codeExample?.(type.id);
  if (typeExample) {
    page.heading(2, 'Example');
    page.push(...exampleBlock(ctx, link, type, typeExample));
  }

  if (type.kind === 'interface') renderMembers(page, model, type, link, ctx);
  if (type.kind === 'enum') {
    page.heading(2, 'Values');
    page.push('| Name | Value | Description |', '| --- | --- | --- |');
    for (const v of type.values) page.push(`| \`${v.name}\` | ${v.value ?? ''} | ${proseCell(ctx, link, type, content.values?.[v.name] ?? '')} |`);
    page.push('');
  }
  if (type.genericParameters?.length) {
    page.heading(2, 'Type parameters');
    page.push('| Parameter | Constraints |', '| --- | --- |');
    for (const gp of type.genericParameters) {
      const constraints = (gp.constraints ?? []).map((c) => (/^(class|struct|new\(\))$/.test(c) ? `\`${c}\`` : link.type(c)));
      page.push(`| \`${gp.variance ? `${gp.variance} ` : ''}${gp.name}\` | ${constraints.join(', ') || 'none'} |`);
    }
    page.push('');
  }
  if ((type.kind === 'struct' || type.kind === 'class') && type.interfaces.length) {
    page.push(`**Implements:** ${type.interfaces.map((i) => link.type(i)).join(', ')}`, '');
  }
  if (type.kind === 'delegate' && type.signature) {
    if (type.signature.parameters.length) {
      page.heading(2, 'Parameters');
      page.push('| Parameter | Type | Passing |', '| --- | --- | --- |');
      for (const p of type.signature.parameters) page.push(`| \`${p.name}\` | ${link.type(p.type)} | ${p.direction ?? 'value'} |`);
      page.push('');
    }
    page.push(`**Returns:** ${type.signature.returnType === 'void' ? 'nothing (`void`)' : link.type(type.signature.returnType)}`, '');
  }
  if (type.kind === 'struct' || type.kind === 'class') {
    renderClassMembers(page, type, link);
    if (type.members.length) renderMembers(page, model, type, link, ctx);
  }
  renderUsedBy(page, model, type, link);
  const seeAlso = seeAlsoLinks(link, content.seeAlso);
  if (seeAlso.length) {
    page.heading(2, 'See also');
    page.push(...seeAlso.map((s) => `- ${s}`), '');
  }
  const examples = exampleLinks(ctx.examples.types[type.id], ctx);
  if (examples.length) {
    page.heading(2, 'Examples');
    page.push(`Used in the SDK examples: ${examples.join(', ')}.`, '');
  }
  return { file, text: page.text() };
}

function renderClassMembers(page, type, link) {
  if (type.constructors.length) {
    page.heading(2, 'Constructors');
    page.push('```csharp', ...type.constructors.map((c) => methodSignature({ ...c, returnType: 'public' }, { name: type.name.replace(/<.*$/, '') })), '```', '');
  }
  if (type.fields.length) {
    page.heading(2, 'Fields');
    page.push('| Name | Type | Value |', '| --- | --- | --- |');
    for (const f of type.fields) page.push(`| \`${f.name}\`${f.isStatic && f.value === null ? ' (static)' : ''} | ${link.type(f.type)} | ${f.value === null ? '' : cell(JSON.stringify(f.value))} |`);
    page.push('');
  }
}

function declaration(type) {
  // The name without its parameter list; the list is written with variance, the constraints as where clauses.
  const g = type.genericParameters ?? [];
  const head = `${type.name.replace(/<.*$/, '')}${typeParameterList(g, { variance: true })}`;
  if (type.kind === 'delegate') {
    return type.signature ? `public delegate ${methodSignature({ ...type.signature, genericParameters: [] }, { name: head }).replace(/;$/, '')}${whereClauses(g)};` : `public delegate ${head}`;
  }
  const bases = type.kind === 'interface' ? type.bases : [type.baseType, ...(type.interfaces ?? [])].filter(Boolean);
  const keyword = { class: 'class', interface: 'interface', enum: 'enum', struct: 'struct' }[type.kind];
  return `public ${keyword} ${head}${bases.length ? ` : ${bases.map(shortType).join(', ')}` : ''}${whereClauses(g)}`;
}

// Single inheritance (the usual case): root → … → parent. Several bases: all of them, nearest first.
function inheritanceChain(model, type, link) {
  const chain = [];
  let current = type;
  while (current?.bases?.length === 1) {
    chain.unshift(current.bases[0]);
    current = model.types.get(current.bases[0]);
  }
  if (type.bases.length > 1 || (current && current !== type && current.bases?.length > 1)) {
    return orderBases(model, type).map((b) => link.type(b)).join(', ');
  }
  return chain.map((b) => link.type(b)).join(' → ');
}

const accessText = (member) => {
  const readable = member.native ? member.canRead : Boolean(member.getter);
  const writable = member.native ? member.canWrite : Boolean(member.setter);
  return `${member.isStatic ? 'static ' : ''}${readable && writable ? 'get; set' : readable ? 'get' : 'set'}`;
};
const extensionOf = (s) => (s?.extension ? shortType(s.extension) : null);
// The helper class that provides an extension method: a link when the class has a page (`DXP.Utils`).
const helperRef = (link, s) => (link.typeHref(s.extension) ? link.type(s.extension) : `\`${extensionOf(s)}\``);

function renderMembers(page, model, type, link, ctx) {
  const content = ctx.content(type.id);
  const properties = type.members.filter((m) => m.kind === 'property');
  const methods = type.members.filter((m) => m.kind === 'method');
  const summary = (m) => firstSentence(content.members?.[m.slug]?.summary);
  const anchorLink = (m) => (type.anchors.has(m.slug) ? `[${m.name}](#${type.anchors.get(m.slug)})` : m.name);

  if (properties.length) {
    page.heading(2, 'Properties');
    page.push('| Property | Type | Access | Description |', '| --- | --- | --- | --- |');
    for (const p of properties) page.push(`| ${anchorLink(p)} | ${link.type(p.type)} | ${accessText(p)} | ${proseCell(ctx, link, type, summary(p), { anchor: type.anchors.get(p.slug) ?? null })} |`);
    page.push('');
    for (const p of properties) type.anchors.set(p.slug, renderProperty(page, type, p, link, ctx));
  }
  if (methods.length) {
    page.heading(2, 'Methods');
    page.push('| Method | Returns | Description |', '| --- | --- | --- |');
    for (const m of methods) page.push(`| ${anchorLink(m)} | ${link.type(m.signature.returnType)} | ${proseCell(ctx, link, type, summary(m), { anchor: type.anchors.get(m.slug) ?? null })} |`);
    page.push('');
    for (const m of methods) type.anchors.set(m.slug, renderMethod(page, type, m, link, ctx));
  }
  if (!properties.length && !methods.length && type.kind === 'interface') page.push('This interface declares no members of its own.', '');

  const inherited = inheritedMembers(model, type);
  if (inherited.some((g) => g.members.length || g.external)) {
    page.heading(2, 'Inherited members');
    for (const g of inherited) {
      if (g.external) {
        page.push(`- From ${link.type(g.base)}`);
        continue;
      }
      const items = g.members.map((m) => {
        const href = link.memberHref(g.base, m.slug);
        return href ? `[${m.name}](${href})` : m.name;
      });
      page.push(`- From ${link.type(g.base)}: ${items.join(', ')}`);
    }
    page.push('');
  }
}

// Details shared by property and method sections: remarks, see also, examples.
// A C# example (lib/examples.mjs): its title as a lead-in, then the code.
function exampleBlock(ctx, link, type, example, { anchor = null, label = null } = {}) {
  const lead = [label, example.title ? prose(ctx, link, type, `${example.title.replace(/\.?$/, '.')}`, { anchor }) : null].filter(Boolean).join(' ');
  return [...(lead ? [lead, ''] : []), '```csharp', example.code, '```', ''];
}

function memberTail(page, type, member, link, ctx, anchor) {
  const content = ctx.content(type.id).members?.[member.slug] ?? {};
  if (content.remarks) page.push(prose(ctx, link, type, content.remarks, { anchor }), '');
  const example = ctx.codeExample?.(`${type.id}.${member.slug}`);
  if (example) page.push(...exampleBlock(ctx, link, type, example, { anchor, label: '**Example:**' }));
  const seeAlso = seeAlsoLinks(link, content.seeAlso);
  if (seeAlso.length) page.push(`**See also:** ${seeAlso.join(', ')}`, '');
  const examples = exampleLinks(ctx.examples.members[`${type.id}.${member.slug}`], ctx);
  if (examples.length) page.push(`**Examples:** ${examples.join(', ')}`, '');
}

function renderProperty(page, type, member, link, ctx) {
  const anchor = page.heading(3, member.name);
  const content = ctx.content(type.id).members?.[member.slug] ?? {};
  page.push(content.summary ? prose(ctx, link, type, content.summary, { anchor }) : gap, '');
  const readable = member.native ? member.canRead : Boolean(member.getter);
  const writable = member.native ? member.canWrite : Boolean(member.setter);
  const code = member.native
    ? [`${member.isStatic ? 'static ' : ''}${shortType(member.type)} ${member.name} { ${readable ? 'get; ' : ''}${writable ? 'set; ' : ''}}`]
    : [member.getter, member.setter].filter(Boolean).map((s) => methodSignature(s));
  page.push('```csharp', ...code, '```', '');
  const access = readable && writable ? 'read/write' : readable ? 'read-only' : 'write-only';
  const facts = [`**Type:** ${link.type(member.type)}`, `**Access:** ${access}`];
  if (member.indexParameters.length) {
    facts.push(`**Index:** ${member.indexParameters.map((p) => `\`${p.name}\` (${link.type(p.type)})`).join(', ')}`);
  }
  page.push(facts.join(' · '), '');
  const helperSig = member.getter?.extension ? member.getter : member.setter?.extension ? member.setter : null;
  if (helperSig) page.push(`The accessors are extension methods of ${helperRef(link, helperSig)} (\`using ${type.namespace};\`).`, '');
  memberTail(page, type, member, link, ctx, anchor);
  return anchor;
}

function renderMethod(page, type, member, link, ctx) {
  const anchor = page.heading(3, member.name);
  const content = ctx.content(type.id).members?.[member.slug] ?? {};
  const s = member.signature;
  page.push(content.summary ? prose(ctx, link, type, content.summary, { anchor }) : gap, '');
  const overloads = member.overloads ?? [s, s.alternate].filter(Boolean);
  const line = (x) => `${x.isStatic ? 'static ' : ''}${methodSignature(x)}`;
  page.push('```csharp', ...overloads.map(line), '```', '');
  const parameterTable = (x) => {
    if (!x.parameters.length) return;
    page.push('| Parameter | Type | Passing |', '| --- | --- | --- |');
    for (const p of x.parameters) page.push(`| \`${p.name}\` | ${link.type(p.type)} | ${p.direction ?? 'value'} |`);
    page.push('');
  };
  const returns = (x) => (x.returnType === 'void' ? 'nothing (`void`)' : link.type(x.returnType));
  if (member.overloads && member.overloads.length > 1) {
    // Several overloads (class methods): parameters and result per overload.
    member.overloads.forEach((x, i) => {
      page.push(`**Overload ${i + 1}:** \`${line(x).replace(/;$/, '')}\``, '');
      parameterTable(x);
      page.push(`Returns ${returns(x)}.`, '');
    });
  } else {
    parameterTable(s);
    page.push(`**Returns:** ${returns(s)}`, '');
  }
  if (s.extension && s.alternate) {
    page.push(`The first overload is an extension method of ${helperRef(link, s)} (\`using ${type.namespace};\`) with typed parameters; the second is declared by the interface.`, '');
  } else if (s.extension) {
    page.push(`Extension method of ${helperRef(link, s)} (\`using ${type.namespace};\`).`, '');
  }
  memberTail(page, type, member, link, ctx, anchor);
  return anchor;
}

const USED_BY_LIMIT = 40;
function renderUsedBy(page, model, type, link) {
  const list = (role) => {
    const seen = new Set();
    return type.usedBy.filter((r) => r.role === role && r.member && !seen.has(`${r.type}.${r.member}`) && seen.add(`${r.type}.${r.member}`));
  };
  for (const [role, title] of [['returns', 'Returned by'], ['accepts', 'Accepted by']]) {
    const refs = list(role);
    if (!refs.length) continue;
    page.heading(2, title);
    const shown = refs.slice(0, USED_BY_LIMIT).map((r) => {
      const href = link.memberHref(r.type, r.member);
      const label = `${model.types.get(r.type).name}.${r.name}`;
      return href ? `[${label}](${href})` : label;
    });
    page.push(shown.join(', ') + (refs.length > USED_BY_LIMIT ? `, and ${refs.length - USED_BY_LIMIT} more.` : ''), '');
  }
}

// --- namespace and reference index pages -------------------------------------------------------------------------
export function renderNamespace(model, ns, categories, ctx) {
  const file = `${ns.slug}/index.md`;
  const link = new Linker(model, file);
  const types = [...model.types.values()].filter((t) => t.namespace === ns.id);
  const out = [frontMatter({
    title: ns.title,
    sidebar_label: ns.title,
    description: ns.description,
    pagination_next: 'null',
    pagination_prev: 'null',
  })];
  out.push(`# ${escapeText(ns.title)}`, '', `**Namespace:** \`${ns.id}\``, '', escapeText(ns.description), '');
  const nested = ctx.namespaces.filter((n) => n.parent === ns.id);
  if (nested.length) {
    out.push('Related namespaces:', '', ...nested.map((n) => `- [${escapeText(n.title)}](../${n.slug}/index.md) (\`${n.id}\`): ${escapeText(n.description)}`), '');
  }
  const counts = { interface: 0, enum: 0, struct: 0, class: 0, delegate: 0 };
  for (const t of types) counts[t.kind] += 1;
  const parts = [[counts.interface, 'interfaces'], [counts.enum, 'enumerations'], [counts.struct + counts.class, 'structures and classes'], [counts.delegate, 'delegates']]
    .filter(([n]) => n).map(([n, w]) => `${n} ${w}`);
  out.push(`${parts.join(', ')}.`, '');
  for (const c of categories) {
    const inCat = types.filter((t) => t.category === c.id).sort((a, b) => a.name.localeCompare(b.name));
    if (!inCat.length) continue;
    out.push(`## ${c.title}`, '', '| Type | Description |', '| --- | --- |');
    // The row's own type is linked in its summary too (the namespace page is nobody's "self").
    for (const t of inCat) out.push(`| ${link.ref(t.id)} | ${proseCell(ctx, link, { namespace: ns.id, id: null }, firstSentence(ctx.content(t.id).summary, 160))} |`);
    out.push('');
  }
  return { file, text: out.join('\n') };
}

export function renderReferenceIndex(namespaces, model) {
  const out = [frontMatter({
    title: 'API reference',
    description: 'Namespaces of the Altium Designer SDK .NET API.',
    pagination_next: 'null',
    pagination_prev: 'null',
  })];
  out.push('# API reference', '', 'The reference is generated from the SDK assemblies. Each namespace page lists its types by area.', '');
  out.push('| Namespace | Types | Description |', '| --- | --- | --- |');
  for (const ns of namespaces) {
    const n = [...model.types.values()].filter((t) => t.namespace === ns.id).length;
    out.push(`| [${escapeText(ns.title)}](./${ns.slug}/index.md) \`${ns.id}\` | ${n} | ${cell(ns.description)} |`);
  }
  out.push('');
  return { file: 'index.md', text: out.join('\n') };
}
