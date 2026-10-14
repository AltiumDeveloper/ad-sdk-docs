# Contributing

This reference is generated from the SDK assemblies, so every type and member is already listed. What it needs from
contributors is **knowledge**: descriptions, C# examples, guides and answers to open questions. This guide explains
how to add each of them, what counts as evidence, and how your change is checked.

It is written for people and for AI agents; [AGENTS.md](AGENTS.md) has the repository conventions in short form,
and agents should also follow [For AI agents](#for-ai-agents) below.

## Contents

- [Ways to contribute](#ways-to-contribute)
- [Set up](#set-up)
- [Find something to work on](#find-something-to-work-on)
- [Evidence: how do you know?](#evidence-how-do-you-know)
- [Recipes](#recipes)
- [Writing descriptions](#writing-descriptions)
- [Checks](#checks)
- [Pull requests](#pull-requests)
- [For AI agents](#for-ai-agents)

## Ways to contribute

| You want to | Change | Recipe |
| --- | --- | --- |
| Describe a type, member or enum value | `content/<NS>/<Type>.yaml` | [Describe a type or member](#describe-a-type-or-member) |
| Fix a wrong or unclear description | `content/<NS>/<Type>.yaml` | [Describe a type or member](#describe-a-type-or-member) |
| Show how an API is used | `examples/<NS>/<Type>[.<Member>].cs` | [Add a C# example](#add-a-c-example) |
| Improve a guide or write a new one | `docs/guides/*.mdx` | [Change a guide](#change-a-guide) |
| Answer an open question | the affected page + `OPEN-ISSUES.md` | [Resolve an open question](#resolve-an-open-question) |
| Report a problem or ask a question | a GitHub issue | [Report a problem](#report-a-problem-or-ask-a-question) |
| Regroup the sidebar, publish or hide types | `config/*.yaml` | [Change the structure](#change-the-structure) |
| Update to a new SDK version | `metadata/*.json` | [Update to a new SDK version](#update-to-a-new-sdk-version) |
| Improve the generator or the site | `scripts/`, `src/`, `plugins/` | [Change the generator](#change-the-generator) |

Never edit generated files: `docs/reference/**`, `.generated/**`, `static/search-index.json`, `build/**`. They are
recreated by `npm run apidocs` and `npm run build`.

## Set up

Requires Node 22. For examples you also need the .NET SDK (8 or later) and the SDK assemblies
(`Altium.SDK.Interfaces.dll`, `Altium.SDK.dll`), which are not in this repository.

```bash
npm ci
npm run apidocs     # generate the reference (needed by most commands below)
npm start           # live preview at http://localhost:3000/ad-sdk-api-reference/
```

Two helpers you will use all the time:

```bash
npm run api -- "SCH.ISch_Pin"              # what exists: members, accessors, overloads, enum values, constants
npm run api -- "SCH.ISch_Pin:Designator"   # filtered by a regular expression
npm run coverage                           # what is missing, most valuable first
npm run coverage -- --type ISch_Pin        # the undocumented members of one type
```

## Find something to work on

1. **`npm run coverage`**: the most valuable gaps, ordered by how much the SDK examples use each type (what extension
   developers actually read). Start at the top.
2. **Pages that say *No description yet.*** on a type or member you know.
3. **[OPEN-ISSUES.md](OPEN-ISSUES.md)**: questions the reference cannot answer yet. If you know an answer, see
   [Resolve an open question](#resolve-an-open-question).
4. **Types with no example**: `npm run coverage` shows which of the most used types have none.

Small, focused changes are easiest to review: one type, one guide section, or one example per pull request.

## Evidence: how do you know?

The reference must only state facts. Before you write, know where the fact comes from, and say so in your pull
request.

| Source | Use it for | Notes |
| --- | --- | --- |
| The assemblies (`npm run api`, the generated pages) | what exists: names, signatures, types, enum values, constants, inheritance | Authoritative for the API surface. Never describe something that is not there. |
| Knowledge of the SDK's implementation (Altium SDK developers) | behaviour, intent, constraints | Say who confirmed it. |
| Running code in Altium Designer | behaviour you observed | Give the Altium Designer version and what you ran. |
| The [SDK examples](https://github.com/AltiumDeveloper/ad-sdk-examples) | how an API is used in practice | Supporting evidence: the examples have not all been verified. |
| Existing descriptions | context | They came from earlier documentation and can be outdated or wrong. If you find a contradiction, fix it with better evidence or open an issue; do not guess. |

Not acceptable as evidence: inferring behaviour from a name, documentation of other products, or generated text
(including AI output) that you have not verified against one of the sources above.

**If you cannot verify something, do not write it.** Leave the gap (pages show *No description yet.*) and, if the
question matters, add it to `OPEN-ISSUES.md` (see [Report a problem](#report-a-problem-or-ask-a-question)).
Never put caveats such as "this is not documented" or "probably" into a page.

## Recipes

### Describe a type or member

1. **Open the file.** Every reference page has an **Edit this page** link to its file `content/<NS>/<Type>.yaml`. If
   the file does not exist yet, create it with the name the edit link shows (the type name; nested types
   `Outer-Inner.yaml`, generic types `Name-T.yaml`).
2. **Find the key.** A member's key is its section name on the page: the property name for a `GetState_X`/`SetState_X`
   pair (`Orientation`), otherwise the method name (`SchIterator_Create`). Two special cases, matching the page
   anchors: a method with the same name as a property is `<Name>-method`, and a name starting with `_` is
   `<Name>-method` without the underscore (`_Finalize` → `Finalize-method`).
3. **Write** (see [Writing descriptions](#writing-descriptions)):

   ```yaml
   summary: One sentence; it is also used in tables and search results.
   remarks: |
     Optional details, in Markdown: constraints, units, what null or empty values mean, related members.
   members:
     Orientation:
       summary: ...
       remarks: ...
       seeAlso: [SCH.TRotationBy90, SCH.ISch_Component.OrientationWithoutRotating]
   values:                 # enumerations only, one entry per value
     eRotate90: ...
   ```

   `seeAlso` entries are type ids (`SCH.TRotationBy90`) or `<type id>.<member key>`.
4. **Check:** `npm test && npm run apidocs`, then look at the page in `npm start`.

`npm run apidocs` fails if a key does not match a type or member: you mistyped it, or the API was renamed. Fix the key;
never delete the text to make the error go away.

### Add a C# example

1. **Choose the place.** `examples/<NS>/<Type>.cs` for an example of the type (shown on the type page), or
   `examples/<NS>/<Type>.<Member>.cs` for a member (shown in the member's section). The type and member must exist.
2. **Copy an existing example** (for instance `examples/PCB/IPCB_BoardIterator.cs`) and keep its structure:

   ```csharp
   // Count the pads on the current board          <- title: a short imperative sentence
   using PCB;                                       <- the using lines are published with the code

   static partial class Examples
   {
       static void Example_IPCB_BoardIterator()     <- Example_<Type>[_<Member>], unique
       {
           // <example>                             <- the published code starts here
           ...
           // </example>                            <- and ends here
       }
   }
   ```

3. **Write real C# against the .NET API.** Check every member with `npm run api`. Patterns that are known to compile:
   - entry points `SCH.GlobalVars.SchServer`, `PCB.GlobalVars.PCBServer`, `DXP.GlobalVars.Client`;
   - the workspace `DXP.GlobalVars.Client.GetDXPWorkspace() as IWorkspace`;
   - object sets `new SCH.TObjectSet { TObjectId.ePort }`; destroying an iterator takes `ref`;
   - change notifications `robotManager.SendMessage(obj, SCHConstant.BroadCast, SCHConstant.SCHMBeginModify,
     SCHConstant.NoEventData)`;
   - messages `DXP.Utils.ShowInfo(text, caption)`; units `EDP.Utils.MilsToCoord(…)`;
   - reports written with `File.WriteAllLines(Path.Combine(Path.GetTempPath(), …))`, then
     `client.OpenDocument("Text", path)` and `client.ShowDocument(doc)`.
4. **Keep it honest.** Show one task, without extra features. Values an extension would supply are explicit
   placeholders (`"<server name>"`) or marked `// Sample values: …`. No hard-coded `C:\` paths.
5. **Compile it:** `SDK_DIR=<folder with the assemblies> npm run check:examples -- --files examples/PCB/IPCB_Pad.cs`
   (or without `--files` for all examples). CI cannot run this check, so it is required before you open the pull
   request; paste its last line into the pull request.
6. **Say whether you ran it** in Altium Designer, and with which version. Examples that only compile are welcome, but
   reviewers need to know.

### Change a guide

- Guides are `docs/guides/*.mdx`: `title`, `sidebar_position` and `description` in the front matter (the description is
  also used in `llms.txt`). Do not use JSX or HTML: the source is also published as Markdown.
- Write API names as code spans, qualified when the short name exists in several namespaces (`` `SCH.TObjectId` ``):
  they are linked automatically. A bare member name (`` `GraphicallyInvalidate` ``) cannot be linked; write
  `` `ISch_GraphicalObject.GraphicallyInvalidate` ``.
- Verify every call in a code block with `npm run api`. Guide code is not compiled: for longer code, add an example in
  `examples/` (which is compiled) and keep the guide snippet short.
- A new guide needs a link from the home page (`docs/index.mdx`, "Get started") when it is a starting point.

### Resolve an open question

1. Update the affected page: the description, the guide or the example, with the answer and its source in the pull
   request description.
2. Remove the row from `OPEN-ISSUES.md` (numbers are not reused; leave a gap).
3. If the answer changes what examples do, recompile them (`npm run check:examples`).

### Report a problem or ask a question

- **A page is wrong, unclear or broken:** open an issue with the "Documentation problem" template (page URL, what is
  wrong, evidence if you have it).
- **A question about the SDK the material cannot answer** (formats, supported setups, intended use): open an issue
  with the "SDK question" template. Maintainers add accepted questions to `OPEN-ISSUES.md` as a row:
  `| <next number> | <topic> | <question, with the facts already known> | <affected page link> |`.

### Change the structure

- **Sidebar areas** of a namespace: `config/categories.yaml` (regular expressions on type names, first match wins).
  After a change, run `npm run apidocs` and check that no type fell into "Other interfaces" by accident.
- **Hide or publish a type:** `config/hidden-types.yaml`, in a group with a comment giving the reason. Hiding is for
  types extensions do not use (implementation classes, plumbing).
- **A new namespace:** `config/namespaces.yaml` (`parent:` nests a small namespace under another), its areas in
  `config/categories.yaml`, and icons in `src/css/custom.css` ("Sidebar icons": `--bc-bg`, `--bc-img`, and `--ns-name`
  on the namespace rule). `npm test` checks that every namespace and area has an icon.
- Visual rules agreed for the sidebar: colour icons only for top-level namespaces, monochrome for areas and nested
  namespaces, the readable title with the technical namespace name on a second line.

### Update to a new SDK version

1. `SDK_DIR=<folder with the new assemblies> npm run metadata`, then review `git diff --stat metadata/`.
2. `npm run apidocs`: if it fails on content keys or example files, the API changed. Move the text to the new name
   (renamed member) or remove the key (member removed), and record what changed in the pull request.
3. `SDK_DIR=… npm run check:examples` and fix examples that no longer compile.
4. Update the examples index if the SDK examples changed: `npm run examples:index -- --dir <ad-sdk-examples checkout>`.

### Change the generator

Generator code is in `scripts/apidocs/lib/` (see the repository map in AGENTS.md). Add or update a test in `test/`
for every rule you change, run all checks, and compare a few pages before and after (`npm run build && npm run serve`),
in light and dark mode for visual changes.

## Writing descriptions

These are recommendations; consistency with the surrounding text matters more than any single rule.

- **Summary:** one sentence that says what the type is or what the member does or holds. It appears in member tables
  and search results, so keep it short (tables cut it at about 200 characters) and self-contained.
- **Remarks:** what a developer needs beyond the summary: valid values and units where known, what `null` or empty
  results mean, side effects and required notifications, related members.
- **Do not repeat what the page already shows:** the signature, parameter types, or the accessor methods of a property
  ("This property is supported by the GetState_X and SetState_X methods").
- **Name API elements as they are**: `ISch_Component`, `ISch_Component.Orientation`, `SCH.TObjectId`. They are linked
  automatically; on the type's own page they stay unlinked code.
- **Only C#** in code spans and blocks. **No speculation**, no plans, no comparisons with other bindings or earlier
  documentation.
- Describe user-interface behaviour only when it explains the API (for example a property that mirrors a dialog
  setting).

## Checks

| Check | Command | Runs in CI | Catches |
| --- | --- | --- | --- |
| Unit tests | `npm test` | yes | generator rules (model, generics, cross-references, examples, icons) |
| Content check | `npm test` / `npm run check:content` | yes | YAML errors; forbidden wording; code of other languages in descriptions |
| Generation | `npm run apidocs` | yes | content keys and example files that do not match the API |
| Cross-references | `npm run check:xrefs` (in `apidocs`) | yes | API names mentioned without a link |
| Build | `npm run build` | yes | broken links between pages |
| Search links | `npm run search:check` (after build) | yes | search results pointing at missing pages or anchors |
| LLM surface | `npm run llms` (after build) | yes | |
| Examples compile | `SDK_DIR=… npm run check:examples` | **no** (assemblies not in the repository) | examples using APIs that do not exist or are used wrongly |

## Pull requests

- One topic per pull request. Use a type prefix in commit messages: `content:` (descriptions), `feat:` (examples, guides,
  site features), `docs:` (repository documentation), `style:` (visual changes).
- Fill in the pull request template: what changed, **the source of every new fact**, and the checks you ran.
- **Reviewers check:** every new statement has a stated source; nothing restates the signature or accessors; examples
  compile (the author pasted the result) and do one thing; API names are plain or code, not hand-written links; the
  changed pages look right (`npm run serve`, light and dark).

## For AI agents

Agents are welcome to help, under the same rules as people. In addition:

1. **Read [AGENTS.md](AGENTS.md) first**; it lists the rules, the checks and the pitfalls.
2. **Verify, do not recall.** Before you name any type, member, enum value or constant, look it up with
   `npm run api -- "<NS>.<Type>:<regex>"`. Your training data may describe an older SDK whose names differ; the
   assemblies win.
3. **Do not invent facts.** If the sources in [Evidence](#evidence-how-do-you-know) do not support a statement, leave
   the gap and report the question (in your summary, or as an `OPEN-ISSUES.md` row if you maintain the repository).
   Do not fill *No description yet.* with plausible text.
4. **Work in small batches** (one type, one guide section, or a handful of examples), run the checks after each batch,
   and report what you changed, the evidence for each fact, and the checks' output.
5. **Do not rewrite existing descriptions wholesale.** Change a sentence only to fix it, and say why.
6. **Examples:** compile every example you write (`npm run check:examples -- --files …`); when you port or adapt code,
   keep its behaviour and list your deviations; never add features to make an example look complete.
7. **Several agents in parallel:** give each one separate files, and compile with `--files` (each run uses its own
   temporary project); never run two `npm run build` at once (they share `build/`).
8. **Look at the result.** For any change to rendering or structure, build and view the affected pages before you
   report the work as done.
