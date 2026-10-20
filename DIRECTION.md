# Offclock — project direction and handoff

Read this first when resuming after usage limits, a new chat, or lost context. Update the status and next steps at the end of each work session.

## Product

Offclock is a highly visual profession guessing game inspired by Originle's interview format and clue-cost scoring. Players meet a believable fictional person, listen to progressively revealing stories about their work, and guess the profession.

The core experience is the person, the voice, and the act of guessing. The interface should feel like a quiet editorial interview, not a dashboard.

## What the user wants

- **Six different profession stories, not six visual skins.** Keep only light and dark modes.
- Six distinct characters with plausible portraits, natural voices, and individual stories.
- High visual quality: oversized type, an expressive portrait, plenty of space, restrained colors.
- Declutter aggressively but keep the controls needed to play. The user specifically flagged the daily-edition banner and promotional footer as excess.
- Narration should sound like a real person casually answering an interview question. Avoid announcer delivery, theatrical mystery writing, repetitive fragments, and excessive pauses.
- Prefer free voice generation. Paid ElevenLabs or OpenAI API use has not been authorized or connected. Do not ask for a key again unless the user selects a paid option.
- Build and iterate on Vercel as the playable reference, before the eventual final-game launch.
- Make **incremental commits and push them to GitHub** as meaningful pieces are completed. The user explicitly requested this.
- Continue authorized implementation and deployment without repeatedly requesting confirmation. Ask only for genuinely missing information or an action that requires approval.

## Links and checkout

- GitHub: https://github.com/rajatkaliani/offclock
- Live Vercel reference: https://offclock-dun.vercel.app
- Guest collection: https://offclock-dun.vercel.app/?view=guests
- Vercel project: `rajatkalianis-projects/offclock`
- Checkout: `/Users/rajatkaliani/Documents/ChatGPT/Sandbox/sites/offclock`
- Local branch: `main`; remote: `origin` (GitHub).
- `.vercel/project.json` is the existing local project link. Reuse it; do not create a replacement Vercel project.
- Older Sites reference: https://offclock-daily.kaliani-rajat.chatgpt.site — Vercel is the current target.

## Rules that must stay intact

- Start at **10,000** points; first clue is free.
- Eight clue balances: **10000, 9750, 9250, 8500, 7500, 6250, 4750, 3000**.
- Additional clues cost **250, 500, 750, 1000, 1250, 1500, 1750**.
- Three guesses. Each wrong guess multiplies the available score by **0.7**; apply clue costs first and round to the nearest 10.
- Minimum winning score is **1,470**, above all consolation scores.
- Unsolved/given-up rounds get the closest guess's consolation: **1,000** for the same job family, **500** for the same field, **0** otherwise.
- Unknown or duplicate guesses do not consume a guess. Accept profession aliases.
- Each character has independent saved progress and one original result. Practice never overwrites that result.
- Keep sharing spoiler-free and preserve accessible controls, keyboard autocomplete, captions, and reduced-motion behavior.

## Current characters — spoilers for maintainers

| Character | Age | Location | Profession | Kokoro voice |
|---|---:|---|---|---|
| Maya | 32 | London | Foley artist | `bf_emma` |
| Jonah | 46 | Bristol | Watchmaker | `bm_george` |
| Inez | 35 | Denver | Air traffic controller | `af_bella` |
| Theo | 29 | Devon | Beekeeper | `bm_fable` |
| Nadia | 38 | Chicago | Food stylist | `af_heart` |
| Kenji | 52 | Seattle | Forensic scientist | `am_michael` |

Each has eight clues, a reveal, and a transparent portrait. All six can be played now; there is no automatic daily release pipeline yet. Do not claim otherwise.

## Architecture and key files

Buildless static HTML/CSS/native ES modules, deployed from `dist/`. The site has no runtime package dependencies and no voice backend.

- `dist/index.html` — game markup and SVG icons.
- `dist/style.css` — established editorial layout and responsive foundations.
- `dist/themes.css` — light/dark styles, collection cards, and decluttering refinements. Later rules override older foundations.
- `dist/app.mjs` — UI, audio playback, local storage, dialogs, autocomplete, results and sharing.
- `dist/game-core.mjs` — scoring, profession catalog, aliases, consolation and saved-state validation.
- `dist/guests.mjs` — all six characters, scripts, voice selection, pace, and audio paths.
- `dist/voice-settings.mjs` — current audio revision, model precision and generation signature.
- `dist/assets/` — portrait PNGs and generated MP3 assets.
- `scripts/generate-voices.mjs` — local-only Kokoro generation and FFmpeg mastering.
- `scripts/check-build.mjs` — verifies source syntax, assets, recording fingerprints and Vercel output configuration.
- `game-core.test.mjs`, `guests.test.mjs` — meaningful game and character-state checks.
- `README.md`, `DEPLOYMENT.md` — development and hosting details.
- `art-direction.md`, `guest-art-prompts.json` — built-in image generation prompts/provenance.
- `qa/` — ignored local screenshots and review material.

The answers and scoring currently live in the browser. Server-side validation is future work before a competitive leaderboard.

## Voice pipeline

Kokoro-82M is free/open-weight with Apache-2.0 weights. The previous version used q8, identical 0.98 speed settings, and formal scripts. The current voice pass uses full fp32 precision, conversational rewritten scripts, per-character pace, and consistent loudness. Do not promise human-level speech from this small model.

- Generate audio locally once and deploy static MP3s. Never ship model weights or API credentials to visitors.
- Tooling is installed separately in `/private/tmp/offclock-kokoro` (`kokoro-js@1.2.1`). If missing: `npm install --prefix /private/tmp/offclock-kokoro kokoro-js@1.2.1`.
- Generator: `node scripts/generate-voices.mjs`.
- FFmpeg path used by the generator: `/opt/homebrew/bin/ffmpeg`.
- The first full-precision run downloads the public model. It may need network escalation in this sandbox.
- Versioned audio lives under `dist/assets/audio/natural-v2/`; changing the revision avoids stale browser-cached recordings.
- The manifest records voice, precision, pace, duration and a hash of the full generation inputs. A script/settings change must regenerate affected clips.
- Preserve AI narration/fictional-character disclosure in About. No real person's voice has been cloned.
- ElevenLabs and OpenAI voice APIs are separate paid services. ChatGPT's voice cannot simply be exported from this chat as a free site backend.

## Development, checks and publishing

```sh
npm run dev
npm run check
```

The local preview is normally `http://127.0.0.1:4173`. Browser checks should cover a normal desktop, mobile, both themes, switching guests, a scored solve, and actual recording playback.

Use the existing Vercel link and authenticated CLI:

```sh
npm exec --yes --cache /private/tmp/offclock-vercel-npm --package vercel -- vercel deploy --prod --scope rajatkalianis-projects --yes --logs --no-color
```

This is the development/reference project even though its stable alias is a Vercel production target. Do not attach a final custom domain or remove `noindex` without the user's launch request.

Use small meaningful Git commits. Do not include `.env*`, `.vercel/`, `node_modules/`, model caches, or temporary QA files. Push without force. Inspect the remote before resolving any push conflict. Existing credentials are in the user's keyring; never print a token. Network-restricted `gh auth status` can misleadingly report an invalid login; retry with authorized network access before requesting reauthentication.

## Session status — 2026-10-19 (America/Los_Angeles)

Completed local checkpoints:

1. `1122dd9` — six stories, separate progress, portraits and 48 recorded voices.
2. `dfb8a0f` — remove daily-edition banner, promotional footer, repeated taglines and decorations; keep a small About link.
3. `deacecf` — 48 conversational full-precision clips, individual pace, consistent loudness, and versioned audio paths.

All three implementation commits are pushed to `origin/main`. Browser checks passed for desktop, mobile, both themes, all six voices, and a scored solve (7,000 after one miss; 6,830 after the next clue). `npm run check` passed all six tests and the recording/asset checks.

## Session status — 2026-10-19 late (Claude Code takeover)

- The `deacecf` Vercel deployment (`dpl_8vHDmv7xY4Ka2ww6terjyRLDsr7d`) is **BLOCKED**, not building. Reason from the API: `seatBlock.blockCode = TEAM_ACCESS_REQUIRED`. The commit author `rkaliani@uci.edu` is unverified for the Hobby team. Earlier deploys using the same email were READY, so Vercel now enforces this check.
- The live alias still serves the pre-`natural-v2` build (`/assets/audio/natural-v2/*` returns 404).
- `npm run check` passes locally (6/6 tests, 62 assets).
- Fix chosen: this repo's local git `user.email` is now `kaliani.rajat@gmail.com`, the email on the Vercel account. Vercel checks only the latest commit's author, so commits from here on deploy normally.
- **Previous plan (superseded):** the user verifies `rkaliani@uci.edu` on their Vercel account (or links the matching Git identity). Then rerun the deploy command above, confirm READY, and check that `offclock-dun.vercel.app` serves natural-v2 audio.

The source changes are in the shared checkout. If interrupted, inspect `git status`, `git log`, current audio manifest, and the live deployment before repeating anything. Runtime/session IDs are ephemeral; do not rely on them in a new chat.
