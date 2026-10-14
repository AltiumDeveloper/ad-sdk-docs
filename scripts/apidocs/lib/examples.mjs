// C# examples: examples/<NS>/<Type>.cs (a type example) and examples/<NS>/<Type>.<Member>.cs (a member example).
// Each file compiles on its own (npm run check:examples); the published part is its `using` lines and the code
// between `// <example>` and `// </example>`, its title the first comment line.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function parseExample(source) {
  const lines = source.replace(/\r/g, '').split('\n');
  const title = (lines.find((l) => /^\s*\/\/\s*\S/.test(l)) ?? '').replace(/^\s*\/\/\s*/, '').trim();
  const usings = lines.filter((l) => /^\s*using\s+[\w.]+\s*;\s*$/.test(l)).map((l) => l.trim())
    .filter((u) => !/^using System(\.|;)/.test(u) || /^using System\.(IO|Collections\.Generic|Linq);/.test(u));
  const start = lines.findIndex((l) => /\/\/\s*<example>/.test(l));
  const end = lines.findIndex((l) => /\/\/\s*<\/example>/.test(l));
  if (start < 0 || end <= start) throw new Error('missing // <example> … // </example> markers');
  const body = lines.slice(start + 1, end);
  const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return { title, code: [...usings, '', ...body.map((l) => l.slice(indent))].join('\n').trim() };
}

// Map of `NS.Type` / `NS.Type.Member` → { title, code, file }, validated against the model.
export function loadExamples(model, dir = 'examples') {
  const examples = new Map();
  const problems = [];
  if (!existsSync(dir)) return { examples, problems };
  for (const ns of readdirSync(dir)) {
    for (const file of readdirSync(join(dir, ns)).filter((f) => f.endsWith('.cs'))) {
      const path = join(dir, ns, file);
      const [typeName, memberName] = file.replace(/\.cs$/, '').split('.');
      const type = model.types.get(`${ns}.${typeName}`);
      if (!type) { problems.push(`${path}: no type ${ns}.${typeName}`); continue; }
      const member = memberName && type.members?.find((m) => m.slug === memberName || m.name === memberName);
      if (memberName && !member) { problems.push(`${path}: ${type.id} has no member ${memberName}`); continue; }
      try {
        examples.set(member ? `${type.id}.${member.slug}` : type.id, { ...parseExample(readFileSync(path, 'utf8')), file: path });
      } catch (error) {
        problems.push(`${path}: ${error.message}`);
      }
    }
  }
  return { examples, problems };
}
