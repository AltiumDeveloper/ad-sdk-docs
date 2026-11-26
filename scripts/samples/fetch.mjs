#!/usr/bin/env node
// Fetches the samples pinned in config/site.yaml (`samples.release`) into .cache/samples/ (git-ignored):
//   index.json   the samples index of that release (schema: the release's index.schema.json)
//   repo/        a shallow, sparse checkout of the samples repository at the same tag (samples/**)
// Both are public, so no token is needed. The generator reads them when they are there and match the pin; without
// them the reference is built with no Samples sections. Usage: node scripts/samples/fetch.mjs [--force]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { SAMPLES_CACHE, samplesPin } from '../apidocs/lib/samples.mjs';

const pin = samplesPin(parse(readFileSync('config/site.yaml', 'utf8')));
if (!pin) {
  console.error('samples:fetch: config/site.yaml has no samples: {repo, release}');
  process.exit(1);
}
const marker = join(SAMPLES_CACHE, 'release.txt');
if (!process.argv.includes('--force') && existsSync(marker) && readFileSync(marker, 'utf8').trim() === pin.release
  && existsSync(join(SAMPLES_CACHE, 'index.json')) && existsSync(join(SAMPLES_CACHE, 'repo', 'samples'))) {
  console.log(`samples:fetch: ${pin.release} is already in ${SAMPLES_CACHE}`);
  process.exit(0);
}

rmSync(SAMPLES_CACHE, { recursive: true, force: true });
mkdirSync(SAMPLES_CACHE, { recursive: true });

const url = `${pin.repo}/releases/download/${pin.release}/index.json`;
const response = await fetch(url);
if (!response.ok) {
  console.error(`samples:fetch: ${url}: HTTP ${response.status}`);
  process.exit(1);
}
const text = await response.text();
const index = JSON.parse(text);
writeFileSync(join(SAMPLES_CACHE, 'index.json'), text);

const repo = join(SAMPLES_CACHE, 'repo');
const git = (...args) => execFileSync('git', args, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' }).trim();
git('-c', 'advice.detachedHead=false', 'clone', '--quiet', '--depth', '1', '--branch', pin.release, '--filter=blob:none', '--sparse', `${pin.repo}.git`, repo);
git('-C', repo, 'sparse-checkout', 'set', 'samples');
const head = git('-C', repo, 'rev-parse', 'HEAD');
if (index.source?.commit && index.source.commit !== head) {
  console.error(`samples:fetch: ${pin.release} index.json was built from ${index.source.commit}, but the tag is ${head}`);
  process.exit(1);
}
writeFileSync(marker, `${pin.release}\n`);
console.log(`samples:fetch: ${pin.release} (${head.slice(0, 7)}): ${index.samples.length} samples, ${Object.keys(index.apis).length} APIs -> ${SAMPLES_CACHE}`);
