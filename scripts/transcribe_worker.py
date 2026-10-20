# Development only, run by scripts/generate-voices.mjs to confirm every recording says its full script.
# Reads [{name, wav}] and prints one JSON line per transcript.
import json, sys
from faster_whisper import WhisperModel

model = WhisperModel('small.en', device='cpu', compute_type='int8')
for job in json.load(open(sys.argv[1])):
    segments, _ = model.transcribe(job['wav'], beam_size=5, language='en', condition_on_previous_text=False)
    print(json.dumps({'name': job['name'], 'text': ' '.join(segment.text.strip() for segment in segments)}), flush=True)
