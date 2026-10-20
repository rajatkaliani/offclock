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
- `dist/assets/` — WebP portraits (~160 KB each) and generated MP3 assets.
- `art/portraits/` — lossless PNG portrait masters (not deployed). Regenerate WebP with the `cwebp` command in `README.md`.
- `scripts/generate-voices.mjs` — local-only Kokoro generation and FFmpeg mastering.
- `scripts/check-build.mjs` — verifies source syntax, assets, recording fingerprints and Vercel output configuration.
- `game-core.test.mjs`, `guests.test.mjs` — meaningful game and character-state checks.
- `README.md`, `DEPLOYMENT.md` — development and hosting details.
- `art-direction.md`, `guest-art-prompts.json` — built-in image generation prompts/provenance.
- `qa/` — ignored local screenshots and review material.

The answers and scoring currently live in the browser. Server-side validation is future work before a competitive leaderboard.

## Voice pipeline

Narration is recorded with **Chatterbox** (Resemble AI, MIT weights). It replaced Kokoro-82M on 2026-10-20 after the user judged the Kokoro voices "still very bad" and preferred Chatterbox in a side-by-side test. It is clearly better, but still not a human performance.

- Generate audio locally once and deploy static MP3s. Never ship model weights or API credentials to visitors.
- Setup and commands are in `README.md` → Voice generation. The Python venv lives at `/private/tmp/offclock-chatterbox` and needs to be recreated after a reboot clears `/private/tmp`.
- Voices are matched to `art/voice-references/{id}.wav`. These are synthetic Kokoro clips (clues 7+8 joined), so no real person's voice is cloned. `guest.voice` still names the original Kokoro voice used for the reference.
- Run on CPU. MPS stalls on this 8 GB M3. The first clip is slow while the 3.2 GB of weights page in; after that it takes about 1–1½ minutes per clip.
- **Every clip is Whisper-verified** against its script. `check-build` fails on any clip without `verified: true`. Read a clip's `heard` field in the manifest to see what Whisper transcribed.
- Audio URLs carry `?v=<hash of the line>`, so changing a script never leaves a day-cached old recording playing under the new caption.
- Settings (exaggeration 0.55, cfg 0.45) are in `dist/voice-settings.mjs`, and changing them re-records everything. Bump `revision` to switch directories.
- Hugging Face downloads may stall on the Xet backend. The generator sets `HF_HUB_DISABLE_XET=1`.
- Preserve the AI narration and fictional-character disclosure in About.
- ElevenLabs and OpenAI voice APIs are separate paid services, not authorised so far.

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

- Deploys were blocked (`TEAM_ACCESS_REQUIRED`) because commits were authored as `rkaliani@uci.edu`. Fixed by setting this repo's local `user.email` to `kaliani.rajat@gmail.com`. **Commits are authored only by the user, with no Claude co-author trailer.**
- Production now serves the current `main`. Live files match local; natural-v2 audio and WebP portraits load on `offclock-dun.vercel.app`.
- Flow and edge-case pass, all browser-checked on desktop, 375px and 320px, in both themes:
  - System dark mode is respected, with no light flash on first paint. Invalid `?theme=` values are ignored, and unknown `?guest=` values are redirected to the canonical URL.
  - Failed recordings reset the player instead of sticking on Pause. Durations can no longer show `0:60`. Plurals are fixed ("1 guess left").
  - An inline **Give up** link appears once a round is underway. The result screen links straight to the next unplayed guest, and practice can be repeated.
  - Suggestions show which alias matched ("Chef · cook"). When a typed guess has a single match, Enter fills it in without spending a guess.
  - Share text adds a per-guess ❌/✅ row and still names no profession.
  - Keyboard focus is kept when the clue track re-renders. Resumed rounds show the right feedback. Finished rounds missing a result are recorded.
  - On phones, How to play is a "?" badge and the guests link shortens to "Guests".
- Cleanup: `app.mjs` is split into sections, with unused icons and legacy views removed. 56 dead CSS rules are gone. Tested helpers (`formatDuration`, `plural`, `shareSummary`, `nextGuest`) bring the suite to 9 tests. `check-build` enforces a 400 KB portrait budget.
- Known history note: commit `bfe43f4` (CSS cleanup) also contains the PNG moves, so that single commit alone has missing portraits. The tip is correct.

Ideas not yet done: server-side answer validation before any leaderboard, a daily release schedule, and more professions or aliases as playtesting shows misses.
