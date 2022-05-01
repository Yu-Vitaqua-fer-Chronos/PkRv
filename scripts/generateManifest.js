#!/usr/bin/env node

const fs = require('fs');
const scriptFile = './target/plugin.tmp.js';
const manifestFile = './manifest.json';
const outFile = './target/plugin.json';

const manifest = JSON.parse(fs.readFileSync(manifestFile));
const script = fs.readFileSync(scriptFile);

manifest['entrypoint'] = script.toString();

fs.writeFileSync(outFile, JSON.stringify(manifest) + '\n');

console.log(`Manifest written to ${outFile}!`);
