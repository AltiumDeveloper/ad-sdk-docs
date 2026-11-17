// The samples section of the site, generated from the samples index and the sample folders (lib/samples.mjs):
//
//   docs/samples/index.md               /samples                  every sample, one table per category
//   docs/samples/category/<cat>.md      /samples/category/<cat>   the samples of one category, with their summaries
//   docs/samples/<Id>.md                /samples/<Id>             one sample: its README, the SDK APIs it uses, its files
//   docs/samples/apis/index.md          /samples/apis             the namespaces, each with its samples by API
//   docs/samples/apis/<ns>.md           /samples/apis/<ns>        every type and member of a namespace that a sample uses,
//                                                                 with all its samples (the target of "N more" on API pages)
//
// The sidebar lists the categories and the samples by API, not the samples themselves (152 entries); a sample page
// still shows the sidebar (`displayed_sidebar`). The categories are the repository's folders under samples/.
//
// The README is published as written, with two changes: `<` is escaped outside code (the pages are CommonMark, where it
// would start raw HTML), and relative links, which point into the samples repository, are made absolute: to the
// sample's page for another sample's README or folder, else to the file on GitHub at the pinned commit. Its API names in
// code spans become reference links through plugins/remark-xref.mjs; nothing here rewrites them.
import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { escapeText, linkText, Page, typeFile } from './render.mjs';
import { sampleFiles } from './samples.mjs';

// The categories (folders under samples/), in the order and with the titles of the samples repository's README.
export const CATEGORY_TITLES = {
  schematic: 'Schematic', pcb: 'PCB', library: 'Library management', '3d-step': '3D and STEP models',
  output: 'Design output', project: 'Project management', 'framework-ui': 'Extension framework and UI',
  integration: 'External integration', licensing: 'Licensing',
};
export const categoryTitle = (category) => CATEGORY_TITLES[category] ?? category;
// The categories of `samples`, in CATEGORY_TITLES order (unknown ones last, by name), each with its samples by title.
export function samplesByCategory(samples) {
  const order = Object.keys(CATEGORY_TITLES);
  const rank = (c) => (order.indexOf(c) + 1 || order.length + 1);
  return [...new Set(samples.map((s) => s.category))]
    .sort((a, b) => (rank(a) - rank(b)) || a.localeCompare(b, 'en'))
    .map((category) => [category, samples.filter((s) => s.category === category).sort((a, b) => a.title.localeCompare(b.title, 'en'))]);
}
const SIDEBAR = 'docs';

// The source part of a sample's Markdown twin (llms.mjs): every .cs file and the installation files, each under its
// path in a fence longer than any backtick run in it. `folderUrl`: the folder on GitHub.
const SOURCE_FILE = /\.(cs|ins|rcs|out)$/;
const FENCE_LANGUAGE = { cs: 'csharp', ins: 'ini', rcs: 'text', out: 'text' };
export function sampleSource(dir, folderUrl) {
  const files = sampleFiles(dir, (name) => SOURCE_FILE.test(name));
  const parts = ['## Source', '', `The sample's own source code (${folderUrl}). It builds inside the samples repository, with the extension framework every sample shares (framework/) and the build settings in Directory.Build.props.`, ''];
  for (const f of files) {
    const text = readFileSync(join(dir, f), 'utf8').replace(/\r/g, '').trimEnd();
    const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
    const fence = '`'.repeat(Math.max(3, longest + 1));
    parts.push(`### ${f}`, '', `${fence}${FENCE_LANGUAGE[f.split('.').pop()]}`, text, fence, '');
  }
  return { markdown: parts.join('\n'), files: files.length };
}

// Sample pages at docs/samples/<Id>.md, API lists at docs/samples/apis/<ns>.md; links from reference pages.
export const samplePageFile = (id) => `${id}.md`;
export const apiPageFile = (nsSlug) => `apis/${nsSlug}.md`;
export const categoryPageFile = (category) => `category/${category}.md`;
// From a page `fromDepth` folders below docs/samples/ to a reference page.
export const toReference = (fromDepth, type, anchor) => `${'../'.repeat(fromDepth + 1)}reference/${typeFile(type)}${anchor ? `#${anchor}` : ''}`;

function frontMatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    lines.push(`${key}: ${typeof value === 'string' && value !== 'null' ? JSON.stringify(value) : value}`);
  }
  return [...lines, '---', ''].join('\n');
}

// Markdown text outside fenced blocks. Code spans may run over several lines, so the text is split into code and
// prose as a whole, never line by line. Only `<` is escaped: `>` starts nothing mid-line and marks quotes at the start.
const ABSOLUTE = /^([a-z][a-z0-9+.-]*:|#|\/)/i;
function readmeText(text, link) {
  return text.split(/(`[^`]+`)/).map((part, i) => {
    if (i % 2) return part;
    let out = part.replace(/<(https?:\/\/[^>\s]+)>/g, '[$1]($1)');
    if (link) {
      out = out.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g,
        (all, bang, label, target, title) => (ABSOLUTE.test(target) ? all : `${bang}[${label}](${link(target, Boolean(bang))}${title})`));
    }
    return out.replace(/</g, '&lt;');
  }).join('');
}

// README text for a sample page: the title line dropped (the page has its own), fenced blocks as they are, the rest
// through readmeText. `link(target, isImage)` makes a relative link absolute.
export function readmeBody(markdown, { link = null } = {}) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const start = lines.findIndex((l) => /^# /.test(l));
  const out = [];
  let prose = [];
  let fence = null;
  const flush = () => {
    if (prose.length) out.push(readmeText(prose.join('\n'), link));
    prose = [];
  };
  for (const line of lines.slice(start + 1)) {
    const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      out.push(line);
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = null;
    } else if (marker) {
      flush();
      fence = marker;
      out.push(line);
    } else {
      prose.push(line);
    }
  }
  flush();
  return out.join('\n').trim();
}

// Relative links of a sample's README (`s.path` in the repository): another sample's README or folder → its page,
// anything else → GitHub at the pinned commit (images: the raw file).
export function readmeLinks(sample, samples, links) {
  const pages = new Map(samples.flatMap((o) => [[o.path, o.id], [`${o.path}/README.md`, o.id]]));
  return (target, image) => {
    const [path, hash] = target.split('#');
    const repoPath = posix.normalize(posix.join(sample.path, decodeURI(path))).replace(/\/$/, '');
    const anchor = hash ? `#${hash}` : '';
    if (!image && pages.has(repoPath)) return `./${samplePageFile(pages.get(repoPath))}${anchor}`;
    return `${(image ? links.raw : links.blob)(repoPath)}${anchor}`;
  };
}

// The SDK APIs one sample uses, resolved to the reference (`resolved`: joinSamples) and grouped by type:
// [{ type, primary, members }].
function apisOf(resolved, sample) {
  const byType = new Map();
  for (const api of sample.apis) {
    const target = resolved.get(api.id);
    if (!target) continue;
    const entry = byType.get(target.type.id) ?? { type: target.type, members: new Map(), primary: false };
    byType.set(target.type.id, entry);
    if (api.primary) entry.primary = true;
    if (target.member) entry.members.set(target.member.slug, { member: target.member, primary: entry.members.get(target.member.slug)?.primary || Boolean(api.primary) });
  }
  return [...byType.values()].sort((a, b) => a.type.id.localeCompare(b.type.id, 'en'));
}

// `ctx.samples` (generate.mjs): { index, byType, byMember, samples, resolved, links, repoDir }.
export function renderSamplePages(model, namespaces, ctx) {
  const { index, links } = ctx.samples;
  const pages = [];
  const readmeOf = (s) => join(ctx.samples.repoDir, s.path, 'README.md');

  // --- one page per sample ---
  for (const s of index.samples) {
    const page = new Page();
    page.push(frontMatter({
      title: s.title,
      description: s.summary,
      displayed_sidebar: SIDEBAR,
      custom_edit_url: `${index.repo}/edit/main/${s.path}/README.md`,
      toc_max_heading_level: 2,
      pagination_next: 'null',
      pagination_prev: 'null',
    }));
    page.heading(1, s.title);
    const facets = [
      `**Category:** [${categoryTitle(s.category)}](./${categoryPageFile(s.category)})`,
      `**Task:** ${s.task.join(', ')}`,
      `**Surface:** ${s.surface.join(', ')}`,
    ];
    page.push(facets.join(' · '), '');
    page.push(`**Sample:** \`${s.id}\` · [Source on GitHub](${links.tree(s.path)}) · The commands run from a clone of the [samples repository](${index.repo}#getting-started), set up as its README describes.`, '');
    if (existsSync(readmeOf(s))) {
      const body = readmeBody(readFileSync(readmeOf(s), 'utf8'), { link: readmeLinks(s, index.samples, links) });
      // Headings in the README count for the page's anchors (the sections below come after them).
      for (const m of body.matchAll(/^(#{2,6}) (.+)$/gm)) page.slugger.slug(m[2]);
      page.push(body, '');
    }

    const apis = apisOf(ctx.samples.resolved, s);
    if (apis.length) {
      page.heading(2, 'SDK APIs used');
      page.push('Every SDK type and member the sample\'s code uses. In bold: the ones the sample is about.', '');
      for (const ns of namespaces) {
        const inNs = apis.filter((a) => a.type.namespace === ns.id);
        if (!inNs.length) continue;
        page.push(`**${ns.label}**`, '');
        for (const a of inNs) {
          const bold = (text, on) => (on ? `**${text}**` : text);
          const typeLink = bold(`[\`${a.type.name}\`](${toReference(0, a.type)})`, a.primary && !a.members.size);
          const members = [...a.members.values()].sort((x, y) => x.member.name.localeCompare(y.member.name, 'en'))
            .map(({ member, primary }) => bold(`[\`${member.name}\`](${toReference(0, a.type, a.type.anchors?.get(member.slug))})`, primary));
          page.push(`- ${typeLink}${members.length ? `: ${members.join(', ')}` : ''}`);
        }
        page.push('');
      }
    }

    const dir = join(ctx.samples.repoDir, s.path);
    if (existsSync(dir)) {
      page.heading(2, 'Files');
      for (const f of sampleFiles(dir)) page.push(`- [\`${f}\`](${links.blob(`${s.path}/${f}`)})`);
      page.push('');
    }
    pages.push({ file: samplePageFile(s.id), text: page.text() });
  }

  // --- API lists, one page per namespace; anchors recorded for the "N more" links of reference pages ---
  const apiAnchors = new Map();
  const nsWithApis = [];
  for (const ns of namespaces) {
    const types = [...ctx.samples.byType.keys()].map((id) => model.types.get(id)).filter((t) => t?.namespace === ns.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));
    if (!types.length) continue;
    nsWithApis.push({ ns, types: types.length });
    const page = new Page();
    const title = `Samples by API: ${ns.label}`;
    page.push(frontMatter({
      title,
      description: `Every ${ns.id} type and member used by the SDK samples, with the samples that use it.`,
      displayed_sidebar: SIDEBAR,
      toc_max_heading_level: 2,
      pagination_next: 'null',
      pagination_prev: 'null',
    }));
    page.heading(1, title);
    page.push(`Every type and member of the ${ns.id} namespace that a sample's code uses, with all the samples that use it, best first: those where the API is central, then smaller samples. A type lists the samples that use it or any of its members.`, '');
    const item = (entry) => {
      const sample = ctx.samples.samples.get(entry.sample);
      return `- [${linkText(sample.title)}](../${samplePageFile(sample.id)})`;
    };
    for (const type of types) {
      const anchor = page.heading(2, type.name);
      apiAnchors.set(type.id, { file: apiPageFile(ns.slug), anchor });
      page.push(`[\`${type.name}\` reference](${toReference(1, type)})`, '');
      page.push(...ctx.samples.byType.get(type.id).map(item), '');
      const members = (type.members ?? []).filter((m) => ctx.samples.byMember.has(`${type.id}.${m.slug}`))
        .sort((a, b) => a.name.localeCompare(b.name, 'en'));
      for (const m of members) {
        const key = `${type.id}.${m.slug}`;
        const memberAnchor = page.heading(3, `${type.name}.${m.name}`);
        apiAnchors.set(key, { file: apiPageFile(ns.slug), anchor: memberAnchor });
        page.push(`[Reference](${toReference(1, type, type.anchors?.get(m.slug))})`, '');
        page.push(...ctx.samples.byMember.get(key).map(item), '');
      }
    }
    pages.push({ file: apiPageFile(ns.slug), text: page.text() });
  }

  // --- the samples, by category: the index page (all of them) and a page per category ---
  const categories = samplesByCategory(index.samples);
  const table = (list, toPage) => [
    '| Sample | What it does | Task | Surface |', '| --- | --- | --- | --- |',
    ...list.map((s) => `| [${linkText(s.title)}](${toPage(s)}) | ${escapeText(s.summary).replace(/\|/g, '\\|')} | ${s.task.join(', ')} | ${s.surface.join(', ')} |`),
    '',
  ];

  for (const [category, list] of categories) {
    const cat = new Page();
    cat.push(frontMatter({
      title: `${categoryTitle(category)} samples`,
      sidebar_label: categoryTitle(category),
      description: `The SDK samples in ${categoryTitle(category)}: ${list.length} complete extensions in C#, one task each.`,
      toc_max_heading_level: 2,
      pagination_next: 'null',
      pagination_prev: 'null',
    }));
    cat.heading(1, `${categoryTitle(category)} samples`);
    cat.push(`${list.length} ${list.length === 1 ? 'sample' : 'samples'}. [All samples](../index.md)`, '');
    cat.push(...table(list, (s) => `../${samplePageFile(s.id)}`));
    pages.push({ file: categoryPageFile(category), text: cat.text() });
  }

  const page = new Page();
  page.push(frontMatter({
    title: 'Samples',
    description: 'Complete Altium Designer extensions in C#, one task each, by category.',
    toc_max_heading_level: 2,
    pagination_next: 'null',
    pagination_prev: 'null',
  }));
  page.heading(1, 'Samples');
  page.push(`${index.samples.length} complete Altium Designer extensions in C#, one task each, from the [SDK samples repository](${index.repo}). Each page has the sample's README, the SDK APIs its code uses and its files; reference pages list the samples that use each type and member, and [Samples by API](./apis/index.md) lists them all. To run a sample, clone the repository and follow its [Getting started](${index.repo}#getting-started).`, '');
  page.push(categories.map(([c, list]) => `[${categoryTitle(c)}](./${categoryPageFile(c)}) (${list.length})`).join(' · '), '');
  for (const [category, list] of categories) {
    page.heading(2, categoryTitle(category));
    page.push(...table(list, (s) => `./${samplePageFile(s.id)}`));
  }
  pages.push({ file: 'index.md', text: page.text() });

  // --- samples by API: the namespaces ---
  const apis = new Page();
  apis.push(frontMatter({
    title: 'Samples by API',
    description: 'Every SDK type and member the samples use, by namespace, with the samples that use it.',
    pagination_next: 'null',
    pagination_prev: 'null',
  }));
  apis.heading(1, 'Samples by API');
  apis.push('Every SDK type and member a sample\'s code uses, with all the samples that use it, by namespace:', '');
  for (const { ns, types } of nsWithApis) apis.push(`- [${ns.label}](./${ns.slug}.md): ${types} types`);
  apis.push('');
  pages.push({ file: 'apis/index.md', text: apis.text() });

  // --- sidebar: the categories and the samples by API; the Samples category itself links to the index ---
  const sidebar = [
    ...categories.map(([category]) => ({ type: 'doc', id: `samples/category/${category}`, label: categoryTitle(category) })),
    { type: 'doc', id: 'samples/apis/index', label: 'Samples by API' },
  ];
  return { pages, sidebar, apiAnchors };
}
