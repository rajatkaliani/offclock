# Development only, run by scripts/generate-voices.mjs inside the local Chatterbox venv.
# Reads {settings, jobs:[{name, text, reference, seed, wav}]} and prints one JSON line per finished clip.
import json, sys, time
import torch, torchaudio as ta
from chatterbox.tts import ChatterboxTTS

spec = json.load(open(sys.argv[1]))
settings = spec['settings']
start = time.time()
model = ChatterboxTTS.from_pretrained(device='cpu')
print(json.dumps({'event': 'loaded', 'seconds': round(time.time() - start)}), flush=True)

prepared = None
for job in spec['jobs']:
    start = time.time()
    if prepared != job['reference']:
        model.prepare_conditionals(job['reference'], exaggeration=settings['exaggeration'])
        prepared = job['reference']
    torch.manual_seed(job['seed'])
    wav = model.generate(job['text'], exaggeration=settings['exaggeration'], cfg_weight=settings['cfgWeight'])
    ta.save(job['wav'], wav, model.sr)
    print(json.dumps({'event': 'clip', 'name': job['name'], 'duration': round(wav.shape[-1] / model.sr, 2), 'seconds': round(time.time() - start)}), flush=True)
