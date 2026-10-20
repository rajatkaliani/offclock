# Offclock

A playable profession guessing game with six fictional characters, six different professions, and 48 prerecorded clues. One interface with light and dark modes.

## Run and deploy

Use Node.js 22 or newer. Run `npm run dev`, then open the printed localhost URL. `npm run check` verifies scoring, profession aliases, per-character restoration, and every portrait and audio asset. No dependency installation is required for the site. `dist/` is the static Vercel output.

Live development site: https://offclock-dun.vercel.app

Collection: https://offclock-dun.vercel.app/?view=guests

## Stories and progress

`dist/guests.mjs` holds Maya, Jonah, Inez, Theo, Nadia, and Kenji. Each has eight unique clues, a reveal, a portrait, and a different Kokoro voice. Direct links use `?guest=jonah`. All six are available now through Meet the guests. This is a curated reference collection, not an unattended daily publishing pipeline.

Each guest has separate saved progress. Statistics include all six guests. Practice preserves the original score. Maya's original storage key is retained. Theme preference also persists. Results can be shared without exposing the answer.

## Scoring

`roundToNearest10(clueBalance × 0.7 ** wrongGuesses)`

Clue balances: 10000, 9750, 9250, 8500, 7500, 6250, 4750, 3000. Three guesses. Minimum correct solve: 1,470 points. Unsolved rounds receive the closest submitted profession's credit: 1,000 for the same job family, 500 for the same field, 0 otherwise.

## Voice generation

Audio is generated locally with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), using Apache-2.0 weights and the official `kokoro-js` package. No ElevenLabs or OpenAI API key is needed. Visitors download ordinary MP3 files; the model does not run in their browser. Text captions remain available if audio cannot play. The About dialog discloses fictional characters and AI narration.

The generator uses a separate development-only install, outside this site:

```sh
npm install --prefix /private/tmp/offclock-kokoro kokoro-js@1.2.1
node scripts/generate-voices.mjs
```

The generator requires FFmpeg at `/opt/homebrew/bin/ffmpeg`. It downloads the public q8 model on the first run. `dist/assets/audio/manifest.json` records the voice, duration, and script fingerprint. Unchanged clips are reused; `npm run build` rejects missing or stale recordings. Normal hosting bandwidth limits still apply.

## Artwork

Portraits are in `dist/assets/{maya,jonah,inez,theo,nadia,kenji}.png`. They were generated with the built-in image generation tool with transparent backgrounds. Maya's original prompt is in `art-direction.md`; the other five prompts are in `guest-art-prompts.json`.

## Production handoff

The prototype's answers and scoring run in the browser. Add server validation before introducing competitive scores. Final daily scheduling, content review, branding and a public domain remain launch work. See `DEPLOYMENT.md`.
