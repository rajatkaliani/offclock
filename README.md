# Offclock

A playable profession guessing game with six fictional characters, six different professions, and 48 prerecorded clues. One interface with light and dark modes.

For project direction, user preferences, and resuming after usage limits, read [DIRECTION.md](DIRECTION.md).

## Run and deploy

Use Node.js 22 or newer. Run `npm run dev`, then open the printed localhost URL. `npm run check` verifies scoring, profession aliases, per-character restoration, and every portrait and audio asset. No dependency installation is required for the site. `dist/` is the static Vercel output.

Live development site: https://offclock-dun.vercel.app

Collection: https://offclock-dun.vercel.app/?view=guests

## Stories and progress

`dist/guests.mjs` holds Maya, Jonah, Inez, Theo, Nadia, and Kenji. Each has eight unique clues, a reveal, a portrait, and a different reference voice (derived from a distinct Kokoro voice). Direct links use `?guest=jonah`. All six are available now through Meet the guests. This is a curated reference collection, not an unattended daily publishing pipeline.

Each guest has separate saved progress. Statistics include all six guests. Practice preserves the original score. Maya's original storage key is retained. Theme preference also persists. Results can be shared without exposing the answer.

## Scoring

`roundToNearest10(clueBalance × 0.7 ** wrongGuesses)`

Clue balances: 10000, 9750, 9250, 8500, 7500, 6250, 4750, 3000. Three guesses. Minimum correct solve: 1,470 points. Unsolved rounds receive the closest submitted profession's credit: 1,000 for the same job family, 500 for the same field, 0 otherwise.

## Voice generation

Audio is generated locally with [Chatterbox](https://huggingface.co/ResembleAI/chatterbox) (MIT-licensed weights, by Resemble AI). No ElevenLabs or OpenAI API key is needed. Visitors download ordinary MP3 files; the model never runs in their browser. Text captions remain available if audio cannot play. The About dialog discloses fictional characters and AI narration.

Each character's voice comes from a short reference clip in `art/voice-references/`. These references are earlier Kokoro-82M synthetic recordings, not a real person. After recording, every clip is transcribed with Whisper (`small.en`) and compared word-for-word with its script (`scripts/script-match.mjs`). Clips that skip, repeat or invent words are re-recorded with a new seed, up to four attempts.

The generator uses a separate development-only Python environment, outside this site:

```sh
uv venv --python /opt/homebrew/bin/python3.11 /private/tmp/offclock-chatterbox
VIRTUAL_ENV=/private/tmp/offclock-chatterbox uv pip install chatterbox-tts faster-whisper "setuptools<81"
node scripts/generate-voices.mjs            # every stale clip
node scripts/generate-voices.mjs kenji-3    # or only clips whose names start with these prefixes
```

The generator requires FFmpeg at `/opt/homebrew/bin/ffmpeg` and downloads the public models on the first run. It runs on CPU: Apple's MPS backend stalls with Chatterbox on 8 GB Macs. Expect about 1–2 minutes per clip. `dist/assets/audio/chatterbox-v1/manifest.json` records the reference voice, seed, duration, script fingerprint and what Whisper heard. Unchanged, verified clips are reused, and `npm run build` rejects missing, stale or unverified recordings. Chatterbox embeds Resemble's inaudible Perth watermark in its output.

## Artwork

Lossless PNG masters are in `art/portraits/`. The game serves WebP copies from `dist/assets/{id}.webp` (regenerate with `cwebp -q 86 -alpha_q 100 -m 6 -sharp_yuv art/portraits/<id>.png -o dist/assets/<id>.webp`). They were generated with the built-in image generation tool with transparent backgrounds. Maya's original prompt is in `art-direction.md`; the other five prompts are in `guest-art-prompts.json`.

## Production handoff

The prototype's answers and scoring run in the browser. Add server validation before introducing competitive scores. Final daily scheduling, content review, branding and a public domain remain launch work. See `DEPLOYMENT.md`.
