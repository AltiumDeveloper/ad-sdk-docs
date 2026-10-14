#!/usr/bin/env node
// Looks up the .NET API before you write about it: the effective members of a type (typed helper methods included,
// accessor pairs shown as properties with their accessor names), enum values, class fields and properties.
//
//   npm run api -- "SCH.ISch_Pin"                 every member
//   npm run api -- "SCH.ISch_Pin:Designator"      members whose name matches a regular expression
//   npm run api -- "PCB.TObjectId:Via" "DXP.Utils:Show"
// Inherited members are included, with the declaring type. Reads metadata/*.json only.
import { loadHidden, loadNamespaces } from './lib/config.mjs';
import { buildModel, inheritedMembers } from './lib/model.mjs';

const namespaces = loadNamespaces();
const model = buildModel({
  metadataPaths: [...new Set(namespaces.flatMap((n) => n.metadata))],
  namespaces: namespaces.map((n) => n.id),
  hidden: loadHidden(),
});
const specs = process.argv.slice(2);
if (!specs.length) {
  console.error('usage: npm run api -- "NS.Type[:regex]" ...');
  process.exit(2);
}
const params = (s) => s.parameters.map((p) => `${p.direction ? `${p.direction} ` : ''}${p.type} ${p.name}`).join(', ');
for (const spec of specs) {
  const [id, filter = '.'] = spec.split(':');
  const type = model.types.get(id) ?? [...model.types.values()].find((t) => t.name === id || t.id.replace(/`\d+$/, '') === id);
  if (!type) {
    console.log(`${id}: not found (unknown, or hidden in config/hidden-types.yaml)`);
    continue;
  }
  const re = new RegExp(filter, 'i');
  const out = [];
  const owners = [type, ...(type.kind === 'interface' ? inheritedMembers(model, type).map((g) => model.types.get(g.base)).filter(Boolean) : [])];
  for (const owner of owners) {
    for (const m of owner.members ?? []) {
      if (!re.test(m.name) && !re.test(m.getter?.name ?? '') && !re.test(m.setter?.name ?? '')) continue;
      const from = owner === type ? '' : `   (from ${owner.name})`;
      if (m.kind === 'property' && m.native) out.push(`property ${m.type} ${m.name} { ${m.canRead ? 'get; ' : ''}${m.canWrite ? 'set; ' : ''}}${m.isStatic ? ' static' : ''}${from}`);
      else if (m.kind === 'property') {
        const index = m.indexParameters.length ? `[${params({ parameters: m.indexParameters })}]` : '';
        out.push(`property ${m.type} ${m.name}${index}  ${[m.getter?.name, m.setter?.name].filter(Boolean).join(' / ')}${m.getter?.extension || m.setter?.extension ? '  (extension)' : ''}${from}`);
      } else {
        for (const s of m.overloads ?? [m.signature, m.signature.alternate].filter(Boolean)) {
          out.push(`method   ${s.isStatic ? 'static ' : ''}${s.returnType} ${s.name}(${params(s)})${s.extension ? '  (extension)' : ''}${from}`);
        }
      }
    }
  }
  if (type.kind === 'enum') out.push(...type.values.filter((v) => re.test(v.name)).map((v) => `value    ${v.name} = ${v.value}`));
  for (const f of type.fields ?? []) if (re.test(f.name)) out.push(`field    ${f.isStatic ? 'static ' : ''}${f.type} ${f.name}${f.value !== null ? ` = ${JSON.stringify(f.value)}` : ''}`);
  console.log(`${type.id} (${type.kind}, ${type.assembly})${type.bases?.length ? ` : ${type.bases.join(', ')}` : ''}\n  ${out.join('\n  ') || '(no matching members)'}`);
}
