// Development only. Records every clue with Chatterbox, then transcribes each recording and
// re-records any that skip, repeat or invent words. Visitors only ever receive the MP3s.
// Setup: see "Voice pipeline" in DIRECTION.md (local venv at /private/tmp/offclock-chatterbox).
import {mkdir, readFile, writeFile, stat, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawn, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createInterface} from 'node:readline';
import {GUESTS} from '../dist/guests.mjs';
import {VOICE_SETTINGS, voiceSignature} from '../dist/voice-settings.mjs';
import {compareScript} from './script-match.mjs';

const PYTHON = '/private/tmp/offclock-chatterbox/bin/python';
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const MAX_ATTEMPTS = 4;
const root = fileURLToPath(new URL('../', import.meta.url));
const output = `${root}dist/assets/audio/${VOICE_SETTINGS.revision}/`;
const work = '/private/tmp/offclock-voices/';
const manifestPath = `${output}manifest.json`;
const only = process.argv.slice(2);

await mkdir(output, {recursive:true});
await mkdir(work, {recursive:true});
const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{}'));
const saveManifest = () => writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
const exists = path => stat(path).then(info => info.size > 1000, () => false);

function runWorker(script, spec, onLine) {
  return new Promise(async (resolve, reject) => {
    const specPath = `${work}${script}.json`;
    await writeFile(specPath, JSON.stringify(spec));
    const child = spawn(PYTHON, ['-I', `${root}scripts/${script}`, specPath], {env:{...process.env, HF_HUB_DISABLE_XET:'1'}, stdio:['ignore', 'pipe', 'pipe']});
    let errors = '';
    child.stderr.on('data', chunk => { errors = (errors + chunk).slice(-4000); });
    createInterface({input:child.stdout}).on('line', line => { if (line.startsWith('{')) onLine(JSON.parse(line)); });
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${script} exited ${code}\n${errors}`)));
  });
}
function master(name) {
  const result = spawnSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', `${work}${name}.wav`, '-af', 'loudnorm=I=-18:TP=-1.5:LRA=9', '-ar', '24000', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', VOICE_SETTINGS.bitrate, `${output}${name}.mp3`], {encoding:'utf8'});
  if (result.status !== 0) throw new Error(result.stderr);
}

let pending = [];
for (const guest of GUESTS) for (const [index, clip] of guest.clips.entries()) {
  const name = `${guest.id}-${index + 1}`;
  if (only.length && !only.some(prefix => name.startsWith(prefix))) continue;
  const digest = createHash('sha256').update(voiceSignature(guest, clip.text)).digest('hex');
  const recorded = manifest[name]?.digest === digest && await exists(`${output}${name}.mp3`);
  // A recording rejected by an older, stricter check can pass on its saved transcript without re-recording.
  if (recorded && !manifest[name].verified && compareScript(clip.text, manifest[name].heard ?? '').ok) {
    manifest[name] = {...manifest[name], verified:true, missing:undefined, extra:undefined};
    console.log(`  verified ${name} from its saved transcript`);
  }
  if (recorded && manifest[name].verified) continue;
  pending.push({name, text:clip.text, digest, voice:guest.voice, reference:`${root}art/voice-references/${guest.id}.wav`, attempts:0});
}
await saveManifest();
console.log(`${pending.length} recordings to make with ${VOICE_SETTINGS.model}.`);

while (pending.length) {
  for (const job of pending) { job.attempts++; job.seed = 1000 * job.attempts + job.name.length; job.wav = `${work}${job.name}.wav`; }
  const byName = Object.fromEntries(pending.map(job => [job.name, job]));
  await runWorker('chatterbox_worker.py', {settings:VOICE_SETTINGS, jobs:pending}, line => {
    if (line.event === 'loaded') console.log(`Model loaded in ${line.seconds}s.`);
    if (line.event === 'clip') { byName[line.name].duration = line.duration; console.log(`  recorded ${line.name} (${line.duration}s audio, ${line.seconds}s)`); }
  });
  const retry = [];
  await runWorker('transcribe_worker.py', pending.map(({name, wav}) => ({name, wav})), ({name, text}) => {
    const job = byName[name];
    const check = compareScript(job.text, text);
    const best = job.best;
    if (!best || check.missing.length + check.extra.length < best.check.missing.length + best.check.extra.length) {
      job.best = {check, heard:text, seed:job.seed, duration:job.duration};
      master(name);
    }
    if (check.ok) console.log(`  verified ${name}`);
    else console.log(`  ${name} attempt ${job.attempts}: missing [${check.missing}] extra [${check.extra}]`);
    if (!check.ok && job.attempts < MAX_ATTEMPTS) retry.push(job);
    const {best:kept} = job;
    manifest[name] = {digest:job.digest, voice:job.voice, model:VOICE_SETTINGS.model, revision:VOICE_SETTINGS.revision, seed:kept.seed, duration:kept.duration, verified:kept.check.ok, heard:kept.heard, ...(kept.check.ok ? {} : {missing:kept.check.missing, extra:kept.check.extra})};
  });
  await saveManifest();
  pending = retry;
}
await rm(work, {recursive:true, force:true});
const failed = Object.entries(manifest).filter(([, entry]) => !entry.verified).map(([name]) => name);
console.log(failed.length ? `Unverified after ${MAX_ATTEMPTS} attempts: ${failed.join(', ')}` : 'Every recording matches its script.');
if (failed.length) process.exitCode = 1;
