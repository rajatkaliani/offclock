import {readFile, stat, readdir} from 'node:fs/promises';
import {resolve, dirname, relative, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
const entry = resolve(output, 'index.html');
const html = await readFile(entry, 'utf8');
const references = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1])
  .filter(value => !/^(?:https?:|data:|mailto:)/.test(value) && value !== './' && value !== '/');
const files = new Set([entry, resolve(output, 'game-core.mjs')]);
for (const file of await readdir(output)) if (file.endsWith('.mjs')) files.add(resolve(output,file));
for (const reference of references) {
  const target = resolve(dirname(entry), reference.split(/[?#]/)[0]);
  const path = relative(output, target);
  if (path.startsWith('..') || isAbsolute(path)) throw new Error(`Asset escapes output directory: ${reference}`);
  files.add(target);
}
for (const file of files) {
  const info = await stat(file);
  if (!info.isFile() || info.size === 0) throw new Error(`Missing or empty output file: ${relative(root,file)}`);
  if (file.endsWith('.mjs')) {
    const result = spawnSync(process.execPath, ['--check', file], {encoding:'utf8'});
    if (result.status !== 0) throw new Error(result.stderr || `Syntax error in ${file}`);
  }
}
const config = JSON.parse(await readFile(resolve(root,'vercel.json'),'utf8'));
if (config.outputDirectory !== 'dist' || config.framework !== null) throw new Error('Vercel must serve the static dist output.');
console.log(`Build ready: ${files.size} local entry points and assets verified in dist/.`);
