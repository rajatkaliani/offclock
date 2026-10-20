import {readFile, stat, readdir} from 'node:fs/promises';
import {resolve, dirname, relative, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {GUESTS} from '../dist/guests.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
const entry = resolve(output, 'index.html');
const html = await readFile(entry, 'utf8');
const references = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1])
  .filter(value => !/^(?:https?:|data:|mailto:)/.test(value) && value !== './' && value !== '/');
const files = new Set([entry, resolve(output, 'game-core.mjs')]);
const manifest = JSON.parse(await readFile(resolve(output,'assets/audio/manifest.json'),'utf8'));
for (const guest of GUESTS) {
  files.add(resolve(output,guest.portrait));
  for (const [index,clip] of guest.clips.entries()) {
    files.add(resolve(output,clip.audio));
    const recording = manifest[`${guest.id}-${index+1}`];
    const digest = createHash('sha256').update(`${guest.voice}:${clip.text}`).digest('hex');
    if (recording?.digest !== digest || recording.voice !== guest.voice || !(recording.duration > 1)) throw new Error(`Missing or outdated recording: ${clip.audio}`);
  }
}
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
