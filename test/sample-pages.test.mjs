import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { loadHidden } from '../scripts/apidocs/lib/config.mjs';
import { buildModel } from '../scripts/apidocs/lib/model.mjs';
import { layoutAnchors, renderType } from '../scripts/apidocs/lib/render.mjs';
import { readmeBody, readmeLinks, renderSamplePages, sampleSource, samplesByCategory } from '../scripts/apidocs/lib/sample-pages.mjs';
import { joinSamples, sampleLinks } from '../scripts/apidocs/lib/samples.mjs';

const links = sampleLinks({ repo: 'https://github.com/o/r', commit: 'c0ffee' });

test('a README keeps its code, escapes < in prose, and loses its title line', () => {
  const body = readmeBody([
    '# Title',
    '',
    'Pass <path> and read `Compare(<A>,',
    '<B>, 0)` back.',
    '> A quote.',
    '',
    '```csharp',
    'if (a < b) return;',
    '```',
    'See <https://example.com/x>.',
  ].join('\n'));
  assert.ok(!body.includes('# Title'));
  assert.ok(body.includes("Pass &lt;path> and"), body);
  // A code span over two lines is code on both lines: nothing escaped in it.
  assert.ok(body.includes('`Compare(<A>,\n<B>, 0)`'), body);
  assert.ok(body.includes('\n> A quote.'));
  assert.ok(body.includes('if (a < b) return;'));
  assert.ok(body.includes('[https://example.com/x](https://example.com/x)'));
});

test('relative README links go to the sample pages or to GitHub at the pinned commit', () => {
  const samples = [{ id: 'A', path: 'samples/pcb/A' }, { id: 'B', path: 'samples/pcb/B' }];
  const link = readmeLinks(samples[0], samples, links);
  const body = readmeBody([
    '# A',
    '[B](../B/README.md#notes), [B folder](../B/), [code](A.Impl/Commands/C.cs), ![shot](img/shot.png)',
    '[site](https://example.com), [here](#run-it), `[not a link](x.md)`',
  ].join('\n'), { link });
  assert.ok(body.includes('[B](./B.md#notes)'), body);
  assert.ok(body.includes('[B folder](./B.md)'));
  assert.ok(body.includes('[code](https://github.com/o/r/blob/c0ffee/samples/pcb/A/A.Impl/Commands/C.cs)'));
  assert.ok(body.includes('![shot](https://github.com/o/r/raw/c0ffee/samples/pcb/A/img/shot.png)'));
  assert.ok(body.includes('[site](https://example.com)') && body.includes('[here](#run-it)') && body.includes('`[not a link](x.md)`'));
});

test("a sample's twin source has every .cs and installation file, fenced longer than its backticks", () => {
  const dir = mkdtempSync(join(tmpdir(), 'sample-'));
  try {
    mkdirSync(join(dir, 'A', 'Installation'), { recursive: true });
    mkdirSync(join(dir, 'A.Impl', 'bin'), { recursive: true });
    writeFileSync(join(dir, 'A', 'Installation', 'A.ins'), 'Name=A\r\n');
    writeFileSync(join(dir, 'A.Impl', 'C.cs'), '// ```code``` in a comment\nclass C {}\n');
    writeFileSync(join(dir, 'A.Impl', 'bin', 'X.cs'), 'build output');
    writeFileSync(join(dir, 'README.md'), '# A');
    const { markdown, files } = sampleSource(dir, 'https://github.com/o/r/tree/c0ffee/samples/pcb/A');
    assert.equal(files, 2);
    assert.match(markdown, /### A\/Installation\/A\.ins\n\n```ini\nName=A\n```/);
    assert.match(markdown, /### A\.Impl\/C\.cs\n\n````csharp\n\/\/ ```code``` in a comment\nclass C \{\}\n````/);
    assert.ok(!markdown.includes('build output') && !markdown.includes('README'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('categories come in the repository order, unknown ones last', () => {
  const order = samplesByCategory([{ category: 'zzz', title: 'Z' }, { category: 'pcb', title: 'P2' }, { category: 'schematic', title: 'S' }, { category: 'pcb', title: 'P1' }]);
  assert.deepEqual(order.map(([c, list]) => [c, list.map((s) => s.title)]), [['schematic', ['S']], ['pcb', ['P1', 'P2']], ['zzz', ['Z']]]);
});

// --- generated pages, against the real model ---
const model = buildModel({ metadataPaths: ['metadata/Altium.SDK.Interfaces.json', 'metadata/Altium.SDK.json'], namespaces: ['PCB'], hidden: loadHidden() });
const namespaces = [{ id: 'PCB', slug: 'pcb', label: 'PCB' }];
const sample = (id, title, apis) => ({
  id, title, summary: `Summary of ${id}.`, category: 'pcb', domain: 'pcb', task: ['inspect'], surface: ['command'],
  path: `samples/pcb/${id}`, phrasings: [], commands: [], apis: apis.map(([apiId, kind, primary]) => ({ id: apiId, kind, ...(primary ? { primary } : {}) })),
});
const use = (s, primary, line) => ({ sample: s, ...(primary ? { primary } : {}), file: `samples/pcb/${s}/${s}.Impl/C.cs`, line, uses: 1 });
const ids = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
const index = {
  repo: 'https://github.com/o/r', commit: 'c0ffee', vocabulary: {},
  samples: ids.map((id, i) => sample(id, `Sample ${id}`, [['PCB.IPCB_Board', 'type'], ['PCB.IPCB_Board.BoardOutline', 'property', i === 6]])),
  apis: {
    'PCB.IPCB_Board': { kind: 'type', samples: ids.map((id, i) => use(id, false, 10 + i)) },
    'PCB.IPCB_Board.BoardOutline': { kind: 'property', samples: ids.map((id, i) => use(id, i === 6, 20 + i)) },
  },
};
const ctx = { content: () => ({}), editUrl: () => '', codeExample: (key) => (key === 'PCB.IPCB_Board' ? { title: 'Read the board', code: 'var b = 1;' } : null), namespaces };
const repoDir = mkdtempSync(join(tmpdir(), 'samples-repo-'));
ctx.samples = { ...joinSamples(model, index), index, links, repoDir };
layoutAnchors(model, ctx);
const rendered = renderSamplePages(model, namespaces, ctx);
ctx.samples.apiAnchors = rendered.apiAnchors;
rmSync(repoDir, { recursive: true, force: true });
const pageOf = (file) => rendered.pages.find((p) => p.file === file)?.text ?? '';

test('a type page has its Samples after the example and before the members, with "N more" linked', () => {
  const { text } = renderType(model, model.types.get('PCB.IPCB_Board'), ctx);
  const headings = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.ok(headings.indexOf('Example') < headings.indexOf('Samples') && headings.indexOf('Samples') < headings.indexOf('Properties'), headings.join(', '));
  const section = text.slice(text.indexOf('## Samples'), text.indexOf('## Properties'));
  // S7 is primary through its member, so it comes first; five are shown.
  assert.match(section, /^- \[Sample S7\]\(\.\.\/\.\.\/samples\/S7\.md\): Summary of S7\. \(\[source\]\(https:\/\/github\.com\/o\/r\/blob\/c0ffee\/samples\/pcb\/S7\/S7\.Impl\/C\.cs#L16\)\)$/m);
  assert.equal((section.match(/^- \[/gm) ?? []).length, 5);
  assert.match(section, /\[2 more samples use this type\]\(\.\.\/\.\.\/samples\/apis\/pcb\.md#ipcb_board\)\./);
  // The member section lists its samples as bullets, then the rest, linked to the member's entry.
  const member = text.slice(text.indexOf('### BoardOutline'));
  assert.match(member, /\*\*Samples:\*\*\n\n- \[Sample S7\]\(\.\.\/\.\.\/samples\/S7\.md\)\n/);
  assert.match(member, /\[2 more samples use this property\]\(\.\.\/\.\.\/samples\/apis\/pcb\.md#ipcb_boardboardoutline\)\./);
});

test('the samples pages link to each other and to the reference with the right depth', () => {
  const s1 = pageOf('S1.md');
  assert.match(s1, /\*\*Category:\*\* \[PCB\]\(\.\/category\/pcb\.md\)/);
  assert.match(s1, /- \[`IPCB_Board`\]\(\.\.\/reference\/pcb\/IPCB_Board\.md\): \[`BoardOutline`\]\(\.\.\/reference\/pcb\/IPCB_Board\.md#boardoutline\)/);
  assert.match(pageOf('category/pcb.md'), /\| \[Sample S1\]\(\.\.\/S1\.md\) \| Summary of S1\. \|/);
  const apis = pageOf('apis/pcb.md');
  assert.match(apis, /^## IPCB_Board$/m);
  assert.match(apis, /\[`IPCB_Board` reference\]\(\.\.\/\.\.\/reference\/pcb\/IPCB_Board\.md\)/);
  assert.match(apis, /^### IPCB_Board\.BoardOutline\n\n\[Reference\]\(\.\.\/\.\.\/reference\/pcb\/IPCB_Board\.md#boardoutline\)\n\n- \[Sample S7\]\(\.\.\/S7\.md\)/m);
  assert.deepEqual(rendered.apiAnchors.get('PCB.IPCB_Board'), { file: 'apis/pcb.md', anchor: 'ipcb_board' });
  assert.match(pageOf('index.md'), /\[PCB\]\(\.\/category\/pcb\.md\) \(7\)/);
  assert.deepEqual(rendered.sidebar.map((i) => i.id), ['samples/category/pcb', 'samples/apis/index']);
});
