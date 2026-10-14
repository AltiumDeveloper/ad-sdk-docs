// Remark plugin for the hand-written pages (docs/index.mdx, docs/guides/**): an inline code span that is exactly an
// API name (`ISch_Iterator`, `SCH.GlobalVars.SchServer`, `EDP.Utils.GetBomManagerFactory()`) becomes a link to its
// reference page or member section. Uses .generated/xref.json (written by `npm run apidocs`); short names that are
// ambiguous across namespaces (`TObjectId`) are not linked, so write them qualified (`SCH.TObjectId`).
// Plain-text mentions are not linked; `npm run check:xrefs` reports them.
import { existsSync, readFileSync } from 'node:fs';
import { loadXrefIndex, resolveName } from '../scripts/apidocs/lib/xref.mjs';

const INDEX = '.generated/xref.json';

export default function remarkXref() {
  const index = existsSync(INDEX) ? loadXrefIndex(JSON.parse(readFileSync(INDEX, 'utf8'))) : null;
  return (tree, file) => {
    if (!index || !/[\\/]docs[\\/](guides[\\/]|index\.mdx$)/.test(file.path ?? '')) return;
    const visit = (node, insideLink) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'inlineCode' && !insideLink) {
          const hit = resolveName(index, child.value.trim(), {});
          if (hit) return { type: 'link', url: hit.anchor ? `${hit.type.route}#${hit.anchor}` : hit.type.route, children: [child] };
        }
        visit(child, insideLink || child.type === 'link');
        return child;
      });
    };
    visit(tree, false);
  };
}
