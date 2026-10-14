#!/usr/bin/env node
// Checks the hand-written sources before they are published: content/**/*.yaml must parse, and neither the content
// nor the guides may mention other SDK language bindings or legacy documentation (the .NET API is the reference).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const BANNED = /\b(delphi(script)?|object pascal|borland)\b/i;
const roots = ['content', 'docs/guides', 'docs/index.mdx', 'config', 'README.md'];

function files(path, out = []) {
  if (statSync(path).isDirectory()) for (const name of readdirSync(path)) files(join(path, name), out);
  else out.push(path);
  return out;
}

const problems = [];
for (const root of roots) {
  for (const file of files(root)) {
    const text = readFileSync(file, 'utf8');
    text.split('\n').forEach((line, i) => {
      if (BANNED.test(line)) problems.push(`${file}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
    if (file.endsWith('.yaml')) {
      try {
        parse(text);
      } catch (error) {
        problems.push(`${file}: ${error.message.split('\n')[0]}`);
      }
    }
  }
}
if (problems.length) {
  console.error(`check-content: ${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('check-content: ok');
