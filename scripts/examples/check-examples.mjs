#!/usr/bin/env node
// Compiles the C# examples in examples/<NS>/<Type>[.<Member>].cs against the SDK assemblies (tools/ExampleCheck), so
// a published example never uses an API that does not exist. Needs the .NET SDK and the assemblies:
//   SDK_DIR=<folder with Altium.SDK.Interfaces.dll and Altium.SDK.dll> npm run check:examples
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

const sdkDir = resolve(process.env.SDK_DIR ?? 'internal/assemblies');
if (!existsSync(join(sdkDir, 'Altium.SDK.Interfaces.dll'))) {
  console.error(`check-examples: SDK assemblies not found in ${sdkDir} (set SDK_DIR)`);
  process.exit(2);
}
// `--files a.cs,b.cs`: compile only these files, in a private temporary project (safe to run several at once).
const filesArg = process.argv.includes('--files') ? process.argv[process.argv.indexOf('--files') + 1] : null;
let projectDir = 'tools/ExampleCheck';
if (filesArg) {
  projectDir = mkdtempSync(join(tmpdir(), 'example-check-'));
  const csproj = readFileSync('tools/ExampleCheck/ExampleCheck.csproj', 'utf8')
    .replace('<Compile Include="../../examples/**/*.cs" />', filesArg.split(',').map((f) => `<Compile Include="${resolve(f)}" />`).join('\n    '));
  writeFileSync(join(projectDir, 'ExampleCheck.csproj'), csproj);
}
let output = '';
let failed = false;
try {
  output = execFileSync('dotnet', ['build', projectDir, '-c', 'Release', '-nologo', '-v', 'q', `-p:SdkDir=${sdkDir}`], { encoding: 'utf8' });
} catch (error) {
  failed = true;
  output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
}
const errors = [...new Set(output.split('\n').filter((l) => /error CS\d+/.test(l)).map((l) => l.trim().replace(/\s*\[[^\]]*\]$/, '')))];
for (const line of errors) console.error(line.replace(process.cwd() + '/', '').replace(/^.*?(examples\/)/, '$1'));
if (failed || errors.length) {
  console.error(`check-examples: ${errors.length} compile error(s)`);
  process.exit(1);
}
console.log(`check-examples: all examples compile against ${relative(process.cwd(), sdkDir) || sdkDir}`);
