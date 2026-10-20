# Offclock

A playable, static visual prototype of a daily profession guessing game. Open `dist/` with a static HTTP server. No dependency installation or build is required.

## Features

- One complete first-edition guest with eight progressively revealing clues.
- 10,000-point starting balance, escalating clue costs, three guesses, and 30% wrong-guess multipliers.
- A fixed profession taxonomy for related-job consolation credit, capped at 1,000 points.
- Profession autocomplete, accepted aliases, duplicate prevention, keyboard navigation, accessible dialogs, reduced motion support, responsive layouts, saved progress and statistics, practice replay, and spoiler-free result sharing.
- A custom AI portrait and browser narration for the prototype. The portrait does not animate or lip-sync.

## Content and voice status

Maya is fictional. This build contains one complete sample edition, not an unattended daily content pipeline. The archive accurately shows the first edition only. Narration uses the browser's available English speech voice; text remains usable when narration is unavailable. ElevenLabs is not connected, and there is no API credential in the client. Production ElevenLabs clips should be generated and reviewed outside the browser, then deployed as static audio assets.

## Score

`roundToNearest10(clueBalance × 0.7 ** wrongGuesses)`

Clue balances: 10000, 9750, 9250, 8500, 7500, 6250, 4750, 3000. The minimum correct solve is 1,470 points. An unsolved round uses the closest submitted profession: 1,000 for the same job family, 500 for the same broad field, 0 otherwise. Practice preserves the original result.

Run the core checks with `node --test game-core.test.mjs`.

## Art asset

`dist/assets/maya.png` was generated using the built-in image generation tool. Full prompt: `art-direction.md`.
