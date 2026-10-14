// Markdown rendering of the API model. Pages are CommonMark (`.md`, Docusaurus `markdown.format: 'detect'`), so they
// double as the Markdown twins served to LLMs: no JSX, no raw HTML, links between pages are relative `.md` paths.
import { inheritedMembers, namedTypes, orderBases } from './model.mjs';

const KIND_TITLE = { interface: 'interface', enum: 'enumeration', struct: 'structure', class: 'class' };

// --- paths -----------------------------------------------------------------------------------------------------
// docs/reference/<ns>/<Type>.md and docs/reference/<ns>/<Type>/<member>.md
export const typeFile = (type) => `${type.namespace.toLowerCase()}/${type.name}.md`;
export const memberFile = (type, member) => `${type.namespace.toLowerCase()}/${type.name}/${member.slug}.md`;
export const typeRoute = (type) => `/reference/${typeFile(type).replace(/\.md$/, '')}`;
export const memberRoute = (type, member) => `/reference/${memberFile(type, member).replace(/\.md$/, '')}`;

function relativePath(from, to) {
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

// First sentence of a description, for tables and front-matter descriptions.
export function firstSentence(text, limit = 200) {
  const plain = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  const match = /^(.+?[.!?])(\s|$)/.exec(plain);
  const sentence = match ? match[1] : plain;
  return sentence.length > limit ? `${sentence.slice(0, limit - 1).trimEnd()}…` : sentence;
}

const paragraphs = (text) => escapeText(text).trim();

// --- type names --------------------------------------------------------------------------------------------------
const shortType = (type) => String(type).replace(/\b(?:[A-Za-z_]\w*\.)+([A-Za-z_]\w*)/g, (_, last) => last);

// C# signature text for code blocks: types without namespaces.
export function methodSignature(signature, { name = signature.name } = {}) {
  const params = signature.parameters.map((p) => `${p.direction ? `${p.direction} ` : ''}${shortType(p.type)} ${p.name}`);
  return `${shortType(signature.returnType)} ${name}(${params.join(', ')});`;
}

export class Linker {
  constructor(model, fromFile) {
    this.model = model;
    this.fromFile = fromFile;
  }

  typeHref(id) {
    const t = this.model.types.get(id);
    return t ? relativePath(this.fromFile, typeFile(t)) : null;
  }

  memberHref(typeId, slug) {
    const t = this.model.types.get(typeId);
    const m = t?.members?.find((x) => x.slug === slug);
    return m ? relativePath(this.fromFile, memberFile(t, m)) : null;
  }

  // `SCH.ISch_Pin[]` → [ISch_Pin](../ISch_Pin.md)[]; types outside the documented namespaces stay qualified code.
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
      const display = name.startsWith('System.') || href ? name.slice(name.lastIndexOf('.') + 1) : name;
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
    return m ? `[${t.name}.${m.name}](${this.memberHref(typeId, slug)})` : null;
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

function examplesSection(refs, examplesRepo, commit) {
  if (!refs?.length) return [];
  const base = `${examplesRepo}/blob/${commit ?? 'main'}`;
  const lines = ['## Examples', '', 'Used in the SDK examples:', ''];
  for (const r of refs) {
    const url = `${base}/${r.file.split('/').map(encodeURIComponent).join('/')}#L${r.line}`;
    lines.push(`- [${r.example}](${url}): \`${r.file.split('/').slice(1).join('/')}\``);
  }
  lines.push('');
  return lines;
}

function seeAlsoSection(link, refs) {
  const items = (refs ?? []).map((id) => link.ref(id)).filter(Boolean);
  return items.length ? ['## See also', '', ...items.map((i) => `- ${i}`), ''] : [];
}

// --- type pages ----------------------------------------------------------------------------------------------------
export function renderType(model, type, ctx) {
  const file = typeFile(type);
  const link = new Linker(model, file);
  const content = ctx.content(type.id);
  const title = `${type.name} ${KIND_TITLE[type.kind]}`;
  const out = [frontMatter({
    title,
    sidebar_label: type.name,
    description: firstSentence(content.summary) || `${type.name} ${KIND_TITLE[type.kind]} in the ${type.namespace} namespace.`,
    custom_edit_url: ctx.editUrl(type),
    pagination_next: 'null',
    pagination_prev: 'null',
  })];
  out.push(`# ${title}`, '');
  out.push(content.summary ? paragraphs(content.summary) : gap, '');
  out.push('```csharp', declaration(type), '```', '');
  out.push(`**Namespace:** ${type.namespace} · **Assembly:** ${type.assembly}`, '');

  if (type.kind === 'interface') {
    const bases = orderBases(model, type);
    if (bases.length) out.push(`**Inherits:** ${inheritanceChain(model, type, link)}`, '');
    if (type.derived.length) out.push(`**Derived:** ${type.derived.map((d) => link.type(d)).join(', ')}`, '');
  }
  if (content.remarks) out.push('## Remarks', '', paragraphs(content.remarks), '');

  if (type.kind === 'interface') renderMembers(out, model, type, link, ctx);
  if (type.kind === 'enum') {
    out.push('## Values', '', '| Name | Value | Description |', '| --- | --- | --- |');
    for (const v of type.values) out.push(`| \`${v.name}\` | ${v.value ?? ''} | ${cell(content.values?.[v.name] ?? '')} |`);
    out.push('');
  }
  if (type.kind === 'struct' || type.kind === 'class') renderClassMembers(out, type, link);
  renderUsedBy(out, model, type, link);
  out.push(...seeAlsoSection(link, content.seeAlso));
  out.push(...examplesSection(ctx.examples.types[type.id], ctx.examplesRepo, ctx.examples.commit));
  return { file, text: out.join('\n') };
}

function renderClassMembers(out, type, link) {
  if (type.constructors.length) {
    out.push('## Constructors', '', '```csharp', ...type.constructors.map((c) => methodSignature({ ...c, returnType: 'public' }, { name: type.name })), '```', '');
  }
  if (type.fields.length) {
    out.push('## Fields', '', '| Name | Type | Value |', '| --- | --- | --- |');
    for (const f of type.fields) out.push(`| \`${f.name}\` | ${link.type(f.type)} | ${f.value ?? ''} |`);
    out.push('');
  }
  if (type.properties.length) {
    out.push('## Properties', '', '| Name | Type | Access |', '| --- | --- | --- |');
    for (const p of type.properties) out.push(`| \`${p.name}\` | ${link.type(p.type)} | ${p.canRead && p.canWrite ? 'get; set' : p.canRead ? 'get' : 'set'} |`);
    out.push('');
  }
  if (type.methods.length) {
    out.push('## Methods', '', '```csharp', ...type.methods.map((m) => `${m.isStatic ? 'static ' : ''}${methodSignature(m)}`), '```', '');
  }
}

function declaration(type) {
  if (type.kind === 'class') {
    return `public class ${type.name}${type.baseType ? ` : ${shortType(type.baseType)}` : ''}`;
  }
  if (type.kind === 'interface') {
    const bases = type.bases.map(shortType);
    return `public interface ${type.name}${bases.length ? ` : ${bases.join(', ')}` : ''}`;
  }
  if (type.kind === 'enum') return `public enum ${type.name}`;
  return `public struct ${type.name}`;
}

// Single inheritance (the usual case): root → … → parent. Several bases: the direct ones, then the rest.
function inheritanceChain(model, type, link) {
  const chain = [];
  let current = type;
  while (current?.bases?.length === 1) {
    chain.unshift(current.bases[0]);
    current = model.types.get(current.bases[0]);
  }
  if (current && current !== type && current.bases?.length > 1) return orderBases(model, type).map((b) => link.type(b)).join(', ');
  if (type.bases.length > 1) return orderBases(model, type).map((b) => link.type(b)).join(', ');
  return chain.map((b) => link.type(b)).join(' → ');
}

function memberSummary(ctx, type, member) {
  return firstSentence(ctx.content(type.id).members?.[member.slug]?.summary);
}

function accessText(member) {
  return member.getter && member.setter ? 'get; set' : member.getter ? 'get' : 'set';
}

function renderMembers(out, model, type, link, ctx) {
  const properties = type.members.filter((m) => m.kind === 'property');
  const methods = type.members.filter((m) => m.kind === 'method');
  if (properties.length) {
    out.push('## Properties', '', '| Property | Type | Access | Description |', '| --- | --- | --- | --- |');
    for (const p of properties) {
      out.push(`| [${p.name}](${link.memberHref(type.id, p.slug)}) | ${link.type(p.type)} | ${accessText(p)} | ${cell(memberSummary(ctx, type, p))} |`);
    }
    out.push('');
  }
  if (methods.length) {
    out.push('## Methods', '', '| Method | Returns | Description |', '| --- | --- | --- |');
    for (const m of methods) {
      out.push(`| [${m.name}](${link.memberHref(type.id, m.slug)}) | ${link.type(m.signature.returnType)} | ${cell(memberSummary(ctx, type, m))} |`);
    }
    out.push('');
  }
  if (!properties.length && !methods.length) out.push('This interface declares no members of its own.', '');
  const inherited = inheritedMembers(model, type);
  if (inherited.some((g) => g.members.length || g.external)) {
    out.push('## Inherited members', '');
    for (const g of inherited) {
      if (g.external) {
        out.push(`- From ${link.type(g.base)}`);
        continue;
      }
      const items = g.members.map((m) => `[${m.name}](${link.memberHref(g.base, m.slug)})`);
      out.push(`- From ${link.type(g.base)}: ${items.join(', ')}`);
    }
    out.push('');
  }
}

const USED_BY_LIMIT = 40;
function renderUsedBy(out, model, type, link) {
  const list = (role) => {
    const seen = new Set();
    return type.usedBy.filter((r) => r.role === role && r.member && !seen.has(`${r.type}.${r.member}`) && seen.add(`${r.type}.${r.member}`));
  };
  for (const [role, heading] of [['returns', 'Returned by'], ['accepts', 'Accepted by']]) {
    const refs = list(role);
    if (!refs.length) continue;
    out.push(`## ${heading}`, '');
    const shown = refs.slice(0, USED_BY_LIMIT)
      .map((r) => `[${model.types.get(r.type).name}.${r.name}](${link.memberHref(r.type, r.member)})`);
    out.push(shown.join(', ') + (refs.length > USED_BY_LIMIT ? `, and ${refs.length - USED_BY_LIMIT} more.` : ''), '');
  }
}

// --- member pages --------------------------------------------------------------------------------------------------
export function renderMember(model, type, member, ctx) {
  const file = memberFile(type, member);
  const link = new Linker(model, file);
  const content = ctx.content(type.id).members?.[member.slug] ?? {};
  const kindWord = member.kind === 'property' ? 'property' : 'method';
  const title = `${type.name}.${member.name} ${kindWord}`;
  const out = [frontMatter({
    title,
    sidebar_label: member.name,
    displayed_sidebar: 'docs',
    crumbs: ctx.crumbs(type),
    description: firstSentence(content.summary) || `${member.name} ${kindWord} of the ${type.name} interface.`,
    custom_edit_url: ctx.editUrl(type),
    pagination_next: 'null',
    pagination_prev: 'null',
  })];
  // The H1 is the member alone (long `Type.Member` names wrap badly); the owner is in the breadcrumbs and below.
  out.push(`# ${member.name} ${kindWord}`, '');
  out.push(content.summary ? paragraphs(content.summary) : gap, '');

  const accessors = member.kind === 'property'
    ? [member.getter, member.setter].filter(Boolean)
    : [member.signature, member.signature.alternate].filter(Boolean);
  out.push('```csharp', ...accessors.map((s) => methodSignature(s)), '```', '');
  out.push(`**Declared in:** [${type.name}](${relativePath(file, typeFile(type))}) · **Namespace:** ${type.namespace}`, '');

  if (member.kind === 'property') {
    out.push(`**Type:** ${link.type(member.type)} · **Access:** ${member.getter && member.setter ? 'read/write' : member.getter ? 'read-only' : 'write-only'}`, '');
    out.push('## Accessors', '', '| Accessor | Method |', '| --- | --- |');
    if (member.getter) out.push(`| Get | \`${member.getter.name}\`${extensionNote(member.getter)} |`);
    if (member.setter) out.push(`| Set | \`${member.setter.name}\`${extensionNote(member.setter)} |`);
    out.push('');
    if (member.indexParameters.length) {
      out.push('## Index parameters', '', ...parameterTable(member.indexParameters, link), '');
    }
  } else {
    const s = member.signature;
    if (s.parameters.length) out.push('## Parameters', '', ...parameterTable(s.parameters, link), '');
    out.push('## Returns', '', s.returnType === 'void' ? 'Nothing (`void`).' : link.type(s.returnType), '');
    if (s.extension && s.alternate) {
      out.push(`The first overload is an extension method of \`${shortType(s.extension)}\` (available with \`using ${type.namespace};\`) with typed parameters; the second is declared by the interface itself.`, '');
    } else if (s.extension) {
      out.push(`This method is an extension method of \`${shortType(s.extension)}\`; it is available with \`using ${type.namespace};\`.`, '');
    }
  }
  if (content.remarks) out.push('## Remarks', '', paragraphs(content.remarks), '');
  out.push(...seeAlsoSection(link, content.seeAlso));
  out.push(...examplesSection(ctx.examples.members[`${type.id}.${member.slug}`], ctx.examplesRepo, ctx.examples.commit));
  return { file, text: out.join('\n') };
}

const extensionNote = (s) => (s.extension ? ` (extension method of \`${shortType(s.extension)}\`)` : '');

function parameterTable(parameters, link) {
  const rows = ['| Name | Type | Passing |', '| --- | --- | --- |'];
  for (const p of parameters) rows.push(`| \`${p.name}\` | ${link.type(p.type)} | ${p.direction ?? 'value'} |`);
  return rows;
}

// --- namespace and reference index pages -------------------------------------------------------------------------
export function renderNamespace(model, ns, categories, ctx) {
  const file = `${ns.slug}/index.md`;
  const link = new Linker(model, file);
  const types = [...model.types.values()].filter((t) => t.namespace === ns.id);
  const out = [frontMatter({
    title: `${ns.id} namespace`,
    sidebar_label: `${ns.title} (${ns.id})`,
    description: ns.description,
    pagination_next: 'null',
    pagination_prev: 'null',
  })];
  out.push(`# ${ns.id} namespace`, '', escapeText(ns.description), '');
  const counts = { interface: 0, enum: 0, struct: 0 };
  for (const t of types) counts[t.kind] += 1;
  out.push(`${counts.interface} interfaces, ${counts.enum} enumerations and ${counts.struct} structures.`, '');
  for (const c of categories) {
    const inCat = types.filter((t) => t.category === c.id).sort((a, b) => a.name.localeCompare(b.name));
    if (!inCat.length) continue;
    out.push(`## ${c.title}`, '', '| Type | Description |', '| --- | --- |');
    for (const t of inCat) out.push(`| ${link.ref(t.id)} | ${cell(firstSentence(ctx.content(t.id).summary, 160))} |`);
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
    out.push(`| [${ns.title} (${ns.id})](./${ns.slug}/index.md) | ${n} | ${cell(ns.description)} |`);
  }
  out.push('');
  return { file: 'index.md', text: out.join('\n') };
}
