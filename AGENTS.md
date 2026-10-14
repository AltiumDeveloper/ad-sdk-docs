# AGENTS.md

Instructions for anyone (coding agents and people) changing this repository. [README.md](README.md) explains how the
pipeline works; this file says what you must and must not do, and how to check your work.
[CONTRIBUTING.md](CONTRIBUTING.md) has the step-by-step recipes (descriptions, examples, guides, open questions,
structure, SDK updates), the evidence rules and the review checklist; its "For AI agents" section applies to you.

## What this repository is

The source of a static Docusaurus site: the .NET API reference of the Altium Designer SDK, generated from the SDK
assemblies `Altium.SDK.Interfaces.dll` (the API) and `Altium.SDK.dll` (hosting classes, entry points, constants,
utilities), with hand-written guides, editable descriptions and compile-checked C# examples. Its style, search and
LLM surface follow the Altium 365 API reference (https://github.com/AltiumDeveloper/platform-api-docs).

**The .NET API is the authoritative SDK API.** The reference documents it on its own terms.

## Sources of truth

| What | Where | Edited by |
| --- | --- | --- |
| API surface (types, members, signatures, enum values, constants) | `metadata/Altium.SDK.Interfaces.json`, `metadata/Altium.SDK.json` | `npm run metadata` only (from the assemblies) |
| Descriptions | `content/<NS>/<Type>.yaml` | hand (this is the editorial source) |
| C# examples | `examples/<NS>/<Type>[.<Member>].cs` | hand |
| Where the public SDK examples use the API | `metadata/examples-index.json` | `npm run examples:index` only |
| Guides and home page | `docs/guides/*.mdx`, `docs/index.mdx` | hand |
| Namespaces, sidebar areas, hidden types, site, search knobs | `config/*.yaml` | hand |
| Questions the material cannot answer | `OPEN-ISSUES.md` | hand |

Generated, never edited by hand (git-ignored): `docs/reference/**`, `.generated/**`, `static/search-index.json`,
`build/**`. `internal/` (git-ignored) holds maintainers' working material; it is not part of the public repository.
If you have it, read `internal/HANDOFF.md` first: history, decisions, status and backlog.

## Repository map

| Path | Contents |
| --- | --- |
| `tools/AssemblyMetadata/` | .NET tool: reads assembly metadata (never loads or runs the assembly) into `metadata/*.json` |
| `tools/ExampleCheck/` | .NET project that compiles `examples/**` against the SDK assemblies |
| `scripts/apidocs/lib/model.mjs` | the API model: helper merge, accessor grouping, inheritance, used-by, generics, hidden types |
| `scripts/apidocs/lib/render.mjs` | Markdown rendering of type and namespace pages, member sections, anchors |
| `scripts/apidocs/lib/xref.mjs` | cross-references from prose (linker and the unlinked-mention finder) |
| `scripts/apidocs/lib/examples.mjs` | loading and parsing `examples/**` |
| `scripts/apidocs/lib/config.mjs` | namespaces, categories (sidebar areas), hidden types |
| `scripts/apidocs/generate.mjs` | writes `docs/reference/**`, `.generated/{sidebar,manifest,xref}.json` |
| `scripts/apidocs/search-index.mjs`, `search-check.mjs` | search index; check that every record's page and anchor exist |
| `scripts/apidocs/check-content.mjs`, `check-xrefs.mjs` | wording/syntax check of hand-written sources; unlinked API names |
| `scripts/apidocs/llms.mjs` | `llms.txt`, per-namespace `llms.txt` and `api.cs.txt`, Markdown twins of every page |
| `scripts/examples/index-examples.mjs`, `check-examples.mjs` | examples usage index; example compile check |
| `plugins/remark-xref.mjs` | links API names in code spans of the guides |
| `plugins/search-index.cjs` | publishes the search index under a content-hashed name in production builds |
| `src/search/engine.mjs`, `src/theme/SearchBar/` | browser search (MiniSearch) and its UI |
| `src/theme/` (other) | breadcrumbs with "View as Markdown", Markdown alternate link, camelCase-friendly sidebar labels |
| `src/css/custom.css` | theme; "Sidebar icons" section: `.bc-<id>` rules for namespaces and areas |
| `test/*.test.mjs` | unit tests (`node --test`) |
| `.github/workflows/gh-pages.yaml` | CI: test, generate, build, search check, LLM surface, deploy to GitHub Pages |

## Commands

Requires Node 22. The .NET SDK (8 or later) and the SDK assemblies are needed only for `npm run metadata` and
`npm run check:examples`.

```bash
npm ci                     # install
npm test                   # unit tests + check:content
npm run apidocs            # generate reference + search index + check:xrefs
npm run api -- "NS.Type:regex"  # look up what exists (members, accessors, overloads, enum values, constants)
npm run coverage           # most valuable documentation gaps; --ns <NS>, --type <Type>
npm run build              # Docusaurus build (~2 min, ~240 MB)
npm run search:check       # after build: every search record's page and #anchor exist
npm run llms               # after build: LLM files and Markdown twins in build/
npm run serve              # serve build/ (search uses the hashed index name; works only on a production build)
npm start                  # dev server (Markdown twins and llms.txt do not exist in dev)
SDK_DIR=<dir> npm run metadata        # re-extract metadata from new assemblies
SDK_DIR=<dir> npm run check:examples  # compile all examples; --files a.cs,b.cs compiles only those, in a temp project
npm run examples:index -- --dir <ad-sdk-examples checkout>
```

CI runs `npm test`, `npm run apidocs` (which includes `check:xrefs`), `npm run build`, `npm run search:check` and
`npm run llms`. **`check:examples` does not run in CI** (the assemblies are not in the repository): run it locally
whenever you add or change an example.

## Rules

### Content (descriptions, guides, examples, config)

1. **Write about the .NET API only.** Do not name other language bindings of the SDK, earlier documentation or its
   language, and do not link to earlier documentation pages. `npm run check:content` rejects some of these words and
   declaration syntax of other languages in `content/**`.
2. **Do not invent.** Every statement must come from the assemblies (via `metadata/*.json`), an existing description,
   or a verified source. If a fact cannot be verified, leave it out of the page and add a row to `OPEN-ISSUES.md`
   (topic, question, affected page). Do not write "X is not documented" or similar caveats into published text.
3. **Gaps stay visible.** A type or member without a description is published with the generated marker
   *No description yet.* Never fill it with guessed text.
4. **Code is C#.** Code in descriptions, guides and examples is C# that uses the .NET API. No code of other languages,
   no `C:\` paths.
5. **Verify API claims.** Every type, member, signature, enum value or constant named in a guide or example must exist
   in `metadata/*.json` (search the JSON, or read the generated page).

### Descriptions (`content/<NS>/<Type>.yaml`)

- Keys: `summary`, `remarks`, `members.<Name>.{summary,remarks,seeAlso}`, `values.<EnumValue>`; see README.md. A member
  key is the member's section name: the property name (for an accessor pair) or the method name.
- `npm run apidocs` fails when a key does not match the API (renamed type or member): fix the key, do not delete text.
- Do not describe accessor methods in prose ("This property is supported by GetState_X and SetState_X"): the
  property section already shows them.
- Write API names as plain text or `code`; the generator links them (see Cross-references).

### Examples (`examples/<NS>/<Type>[.<Member>].cs`)

- File name = the type (type example) or `<Type>.<Member>` (member example); `apidocs` fails if they do not exist.
- Structure: first comment line = title (imperative, e.g. "Count the pads on the current board"); `using` lines;
  `static partial class Examples` with one method `static void Example_<Type>[_<Member>]()`; the published code
  between `// <example>` and `// </example>`. Copy an existing file.
- Must compile: `SDK_DIR=<dir> npm run check:examples` (or `--files <your files>`).
- Values that a real extension would supply are explicit placeholders (`"<server name>"`) or commented
  `// Sample values: …`; never present made-up names or numbers as if they were required.
- Common .NET patterns (all verified): entry points `SCH.GlobalVars.SchServer`, `PCB.GlobalVars.PCBServer`,
  `DXP.GlobalVars.Client`; workspace `DXP.GlobalVars.Client.GetDXPWorkspace() as IWorkspace`; process control
  `DXP.GlobalVars.Client.GetProcessControl()`; object sets `new SCH.TObjectSet { TObjectId.ePort }`; iterator destroy
  takes `ref`; schematic change notifications `robotManager.SendMessage(obj, SCHConstant.BroadCast,
  SCHConstant.SCHMBeginModify, SCHConstant.NoEventData)`; units `EDP.Utils.MilsToCoord`; messages
  `DXP.Utils.ShowInfo(text, caption)`; reports `File.WriteAllLines(Path.Combine(Path.GetTempPath(), …))` then
  `client.OpenDocument("Text", path)` and `client.ShowDocument(doc)`.
- Examples compile but have not been run in Altium Designer (OPEN-ISSUES.md #10). Do not claim run-time behaviour
  beyond what the code shows.

### Cross-references

- Every API name in prose is code-styled. It is a **link**, except: the page's own type, and a member inside its own
  section (including a property's accessor names) — those are code **without** a link.
- In descriptions just write the name; the generator links it. In guides write it as a code span (`` `ISch_Iterator` ``,
  qualified when the short name exists in several namespaces, e.g. `` `SCH.TObjectId` ``); `plugins/remark-xref.mjs`
  links it. `npm run check:xrefs` fails on unlinked mentions.

### Configuration

- New namespace: `config/namespaces.yaml` (optionally `parent:` to nest a small namespace in the sidebar),
  `config/categories.yaml` (areas: regexes, first match wins), and `.bc-<slug>` / `.bc-<area>` rules in
  `src/css/custom.css` with `--ns-name` on the namespace rule. `npm test` checks the icons.
- Types published on purpose or not: `config/hidden-types.yaml` (each group with a reason). Typed `*Helper` classes
  are folded into their interfaces automatically; do not list them.
- Sidebar style (agreed): colour icons for top-level namespaces only; areas and nested namespaces get monochrome
  icons; namespace title with the technical name on a second, subdued line.

## Before you commit

1. `npm test`
2. `npm run apidocs` (includes `check:xrefs`)
3. `npm run build`, then `npm run search:check` and `npm run llms`
4. If examples changed: `SDK_DIR=<dir> npm run check:examples`
5. Look at the changed pages (`npm run serve`), in light and dark mode for visual changes.

Commit messages in this repository use a type prefix: `feat:`, `content:`, `docs:`, `style:`.

## Pitfalls (each one has bitten this project)

- **Docusaurus ignores files starting with `_`**: the generator renames them (`_Finalize` → `Finalize-method`,
  `_D3DVECTOR` → `D3DVECTOR-struct`). Keep that rule when changing file naming.
- **File names must be unique case-insensitively** (macOS/Windows): member slugs and type files are de-duplicated that
  way.
- **Reference pages are CommonMark** (`markdown.format: 'detect'`, `.md`): no JSX or raw HTML; escape `<` and `>` in
  text (generic names such as `BaseClientService<T>`). Guides are MDX (`.mdx`) but must not use JSX either: their
  source is also published as Markdown.
- **Everything expanded in the sidebar is rendered into every page.** Keep the sidebar to types (members are sections)
  and namespace categories collapsed, or the site grows by hundreds of MB.
- **Do not add `"type"` to package.json**: `"type": "commonjs"` breaks the webpack build.
- **The search index has a hashed name only in production builds**; the dev server serves the plain
  `static/search-index.json` (`plugins/search-index.cjs`).
- **Do not run two builds at once** (both write `build/`): it fails with `ENOTEMPTY`.
- **Anchors are computed, not read back**: `render.mjs` computes heading ids with github-slugger exactly as Docusaurus
  does. If you change headings, run `npm run search:check` after the build.
