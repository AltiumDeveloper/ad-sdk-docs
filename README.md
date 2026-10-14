# Altium Designer SDK API reference

Source for https://altiumdeveloper.github.io/ad-sdk-docs/: the .NET API reference for building Altium
Designer extensions, generated from the SDK assemblies and cross-linked with the
[SDK examples](https://github.com/AltiumDeveloper/ad-sdk-examples).

It covers the SDK namespaces of both assemblies (`config/namespaces.yaml`): `SCH`, `PCB`, `EDP`, `DXP`,
`ComponentLib` and `Embedded`, with `DXP.EDMS` and `Altium.Dxp.Interfaces` nested under System. Types and
namespaces left out on purpose (interface implementation classes, plumbing) are listed with reasons in
`config/hidden-types.yaml`.

## How it works

```
SDK assemblies ──(npm run metadata)──▶ metadata/Altium.SDK.Interfaces.json, metadata/Altium.SDK.json ─┐
content/<NS>/*.yaml (descriptions) ──────────────────────────────────────────────────────────────────┤
examples/<NS>/*.cs (C# examples) ────────────────────────────────────────────────────────────────────┼─(npm run apidocs)─▶ docs/reference/**
ad-sdk-examples ──(npm run examples:index)──▶ metadata/examples-index.json ──────────────────────────┘   static/search-index.json
                                                                       ─(npm run build)─▶ build/ ─(npm run llms)─▶ build/ + LLM files
```

1. `npm run metadata` reads the public API of `Altium.SDK.Interfaces.dll` and `Altium.SDK.dll` (metadata only; the
   assemblies are never loaded) with `tools/AssemblyMetadata` and writes `metadata/<assembly>.json`. It needs the
   .NET SDK and the assemblies (`SDK_DIR=<folder>`). The JSON is committed, so the site builds without either.
2. `npm run examples:index` scans a checkout of the SDK examples (`--dir`) and records where each type and member is
   used: `metadata/examples-index.json` (committed).
3. `npm run apidocs` builds the API model (`scripts/apidocs/lib/model.mjs`), renders one page per type into
   `docs/reference/` (git-ignored; members are sections of their type's page, listed in its table of contents),
   writes the Reference sidebar to `.generated/sidebar.json` and the search index to `static/search-index.json`.
   `npm run search:check` (after the build) verifies that every search record's page and `#anchor` exist.
4. `npm run build` builds the Docusaurus site; `npm run llms` then adds the LLM surface to `build/`.

### The model

The SDK interfaces are COM dispatch interfaces. Their raw methods return `object` for interface results
(`Internal_GetState_SchDesignator`) and `int` for enumeration values; generated `*Helper` classes add typed extension
methods (`GetState_SchDesignator(): ISch_Designator`). The model:

- shows each method once, in its typed form; when the interface also declares an untyped overload, the member
  section lists both;
- groups accessor pairs into one **property** section: `GetState_X`/`SetState_X` (also `GetProperty_`, `Get_`, and plain
  `Get`/`Set` pairs whose types match). A lone `GetState_X` is a read-only property; a plain `GetX` alone stays a method;
- resolves inheritance (direct bases, inherited members) and records, for every type, the members that return or
  accept it ("Returned by" / "Accepted by").

`npm test` covers these rules.

## Descriptions

Descriptions live in `content/<NS>/<Type>.yaml`, one file per type; every page's **Edit this page** link opens it:

```yaml
summary: One or two sentences; the first one is used in tables and search.
remarks: |
  Longer explanation, in Markdown.
members:
  Orientation:            # the member's name: the property name, or the method name
    summary: ...
    remarks: ...
    seeAlso: [SCH.TRotationBy90, SCH.ISch_Component.OrientationWithoutRotating]
values:                   # enumerations only
  eRotate90: Rotated by 90 degrees.
```

`npm run apidocs` fails when a content key no longer matches the API (a renamed type or member), so text is never
silently dropped. Types and members without a description are still published, marked *No description yet.*

`npm run check:content` (also run by CI) validates the YAML and the guides.

## Examples

C# examples live in `examples/<NS>/<Type>.cs` (an example for the type) and `examples/<NS>/<Type>.<Member>.cs` (for a
member). Each file is a complete C# file that compiles on its own:

```csharp
// Count the pads on the current board          ← title (first comment line)
using PCB;                                       ← shown with the example

static partial class Examples
{
    static void Example_IPCB_BoardIterator()   ← Example_<Type>[_<Member>]
    {
        // <example>                             ← published code starts
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        ...
        // </example>                            ← and ends
    }
}
```

`npm run apidocs` fails when a file names a type or member that does not exist. `npm run check:examples` compiles
every example against the SDK assemblies (`SDK_DIR=<folder with Altium.SDK.Interfaces.dll and Altium.SDK.dll>`; the
assemblies are not in the repository, so run it locally before committing an example).

## Cross-references

API names in prose are linked automatically, so descriptions and guides are written as plain text:

- **Descriptions** (`content/**`): the generator (`scripts/apidocs/lib/xref.mjs`) links type names (`ISch_MapDefiner`),
  qualified names (`EDP.Utils`), members (`ISch_Component.Orientation`, accessor names such as
  `GetState_Orientation`) and, on a type's page, its own member names. In plain text only code-like names are linked
  (an `I`/`T` prefix, an underscore or a compound name); ordinary words such as "Parameter" are linked only when
  written as `code` or qualified. Short names defined in several namespaces resolve to the page's namespace.
- **The page's own type, and a member in its own section** (including a property's accessor names), are written as
  code without a link.
- **Guides** (`docs/guides/**`, `docs/index.mdx`): `plugins/remark-xref.mjs` links every code span that is exactly an
  API name, so write `` `ISch_Iterator` `` or `` `SCH.TObjectId` `` (qualify names that exist in several namespaces).
- `npm run check:xrefs` (part of `npm run apidocs`, so CI) fails when a page mentions an API name without a link.

## Open issues

Questions the reference cannot answer from the assemblies (formats, supported setups, intended usage) are tracked
in [OPEN-ISSUES.md](OPEN-ISSUES.md), not in the published pages.

## Guides

Hand-written pages live in `docs/guides/*.mdx` (sidebar order from `sidebar_position`; the front-matter
`description` is reused in `llms.txt`). Keep them free of JSX: their source is also published as Markdown.

## Search

Search runs in the browser (`src/theme/SearchBar`, ⌘K / Ctrl+K or `/`), over `static/search-index.json` indexed with
MiniSearch; ranking is in `src/search/engine.mjs`, tuned with `config/search.yaml`. Property records also carry
their accessor names, so `GetState_Orientation` finds the `Orientation` property.

## LLM surface

`npm run llms` (after `npm run build`) writes:

- `build/llms.txt`: site index (guides, namespaces);
- `build/reference/<ns>/llms.txt`: every type of a namespace with its summary, by area;
- `build/reference/<ns>/api.cs.txt`: the whole namespace as compact C# declarations with `///` summaries;
- a `.md` twin of every page (`/reference/sch/ISch_Component` → `/reference/sch/ISch_Component.md`), advertised by
  `<link rel="alternate" type="text/markdown">` and the **View as Markdown** link.

## Adding a namespace

1. Add it to `config/namespaces.yaml`.
2. Add its sidebar areas to `config/categories.yaml`.
3. Add `.bc-<id>` icons for the namespace slug and every new area id to `src/css/custom.css` ("Sidebar icons"):
   `--bc-bg` (colour), `--bc-img` (a 24×24 line-icon SVG as a data URL) and, on the namespace rule, `--ns-name` (the
   namespace name shown under its title). `npm test` checks that every namespace and area has one.
4. Run `npm run apidocs` and review the "other" area for types the categories miss.

## Contributing

Descriptions, examples, guides and answers to open questions are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md)
for step-by-step recipes, what counts as evidence, the checks and the review checklist. `npm run coverage` lists the most
valuable gaps; `npm run api -- "SCH.ISch_Pin"` shows what exists before you write about it.

## Working on this repository

Read [AGENTS.md](AGENTS.md): conventions, required checks and the rules for content and examples.

## Local development

Requires Node 22.

```bash
npm ci
npm run apidocs
npm start
```

## Licence

[MIT](LICENSE).
