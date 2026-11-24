'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const jsRoot = path.join(root, 'js');
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
  }
}

walk(jsRoot);
files.sort();

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--check'], {
    input: fs.readFileSync(file, 'utf8'),
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write('\n[syntax] ' + path.relative(root, file) + '\n' + (result.stderr || result.stdout));
  }
}

const serverResult = spawnSync(process.execPath, ['--check', path.join(root, 'server.js')], {
  encoding: 'utf8',
});
if (serverResult.status !== 0) {
  failed = true;
  process.stderr.write('\n[syntax] server.js\n' + (serverResult.stderr || serverResult.stdout));
}

if (failed) process.exit(1);
console.log('[syntax] checked ' + files.length + ' browser modules and server.js');
