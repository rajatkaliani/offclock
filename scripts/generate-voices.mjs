// Development only: npm install --prefix /private/tmp/offclock-kokoro kokoro-js
// Generate once locally; visitors receive ordinary audio files, never a model download.
import {createRequire} from 'node:module';
import {mkdir, readFile, writeFile, stat, unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {GUESTS} from '../dist/guests.mjs';
import {VOICE_SETTINGS,voiceSignature} from '../dist/voice-settings.mjs';
const require = createRequire('/private/tmp/offclock-kokoro/package.json');
const {KokoroTTS} = await import(require.resolve('kokoro-js'));
const root = fileURLToPath(new URL(`../dist/assets/audio/${VOICE_SETTINGS.revision}/`, import.meta.url));
await mkdir(root,{recursive:true});
const manifestPath = `${root}manifest.json`;
let manifest;
try { manifest = JSON.parse(await readFile(manifestPath,'utf8')); } catch { manifest = {}; }
console.log(`Loading Kokoro ${VOICE_SETTINGS.precision} on CPU. Initial run downloads the public model.`);
const tts = await KokoroTTS.from_pretrained(VOICE_SETTINGS.model, {dtype:VOICE_SETTINGS.precision,device:'cpu'});
for (const guest of GUESTS) for (const [index,clip] of guest.clips.entries()) {
  const name = `${guest.id}-${index+1}`;
  const digest = createHash('sha256').update(voiceSignature(guest,clip.text)).digest('hex');
  if (manifest[name]?.digest === digest && await stat(`${root}${name}.mp3`).then(s=>s.size>1000).catch(()=>false)) continue;
  const start = Date.now();
  const audio = await tts.generate(clip.text,{voice:guest.voice,speed:guest.pace});
  await audio.save(`${root}${name}.wav`);
  const conversion = spawnSync('/opt/homebrew/bin/ffmpeg',['-y','-hide_banner','-loglevel','error','-i',`${root}${name}.wav`,'-af','loudnorm=I=-18:TP=-1.5:LRA=9','-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a',VOICE_SETTINGS.bitrate,`${root}${name}.mp3`],{encoding:'utf8'});
  if(conversion.status !== 0) throw new Error(conversion.stderr);
  await unlink(`${root}${name}.wav`);
  manifest[name] = {digest,voice:guest.voice,model:VOICE_SETTINGS.model,precision:VOICE_SETTINGS.precision,speed:guest.pace,revision:VOICE_SETTINGS.revision,duration:Number((audio.audio.length/audio.sampling_rate).toFixed(2))};
  await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  console.log(`${name}: ${manifest[name].duration}s recorded in ${((Date.now()-start)/1000).toFixed(1)}s`);
}
console.log('All 48 recordings ready.');
