## What changed

<!-- One topic per pull request: a type's descriptions, an example, a guide section, a structural change. -->

## Sources

<!-- For every new or changed fact: where it comes from (see CONTRIBUTING.md, "Evidence"). For example:
     "ISch_Pin.Designator: confirmed by <name> (SDK team)", "tested in Altium Designer <version>",
     "signature only (npm run api)". Statements without a source will not be merged. -->

## Checks

- [ ] `npm test`
- [ ] `npm run apidocs` (includes `check:xrefs`)
- [ ] `npm run build` and `npm run search:check` (for structural or rendering changes)
- [ ] Examples changed: `SDK_DIR=… npm run check:examples` passed (paste the last line):
- [ ] Examples changed: run in Altium Designer (version: …) / not run
- [ ] Looked at the changed pages (`npm run serve`; light and dark for visual changes)
