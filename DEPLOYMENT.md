# Vercel development project

Offclock uses the approved interface with light and dark modes and scoring as the development reference. It is a static application; there is no framework migration or dependency installation needed to preserve the design.

## Current Vercel deployment

- Development project: `rajatkalianis-projects/offclock`
- Site: https://offclock-dun.vercel.app
- Meet all six guests: https://offclock-dun.vercel.app/?view=guests
- Dashboard: https://vercel.com/rajatkalianis-projects/offclock
- Current six-story deployment: `dpl_2cKPC845Dr7627xFuF3Uu7zaK3er` (READY)
- Verified live collection and MP3 playback after publishing.
- The local folder is linked to this existing project in ignored `.vercel/project.json`. Reuse this link for subsequent deployments.

Vercel made the new project's initial deployment its production deployment. This remains the development/reference project; no final-game custom domain has been attached.

## Local development

Use Node.js 22 or newer.

```sh
npm run dev
```

Open the printed local URL. Source is in `dist/`, with gameplay in `app.mjs`, scoring and profession data in `game-core.mjs`, story content in `guests.mjs`, and visual styles in `style.css` and `themes.css`.

```sh
npm run check
```

Checks JavaScript syntax, agreed scoring and profession behavior, and local asset references. `npm run build` verifies the ready-to-deploy `dist/` directory.

## Vercel

`vercel.json` explicitly selects a static project with `dist` as the output directory and `npm run build` as its build command. Deploy the project root, not the parent Sandbox directory. The development site is marked `noindex` while it is a prototype.

Use the connected Vercel integration to create or select the development project and deploy this folder. With an authenticated Vercel CLI, `vercel` creates a Preview Deployment and stores the project link in ignored `.vercel/`. Subsequent deployments must reuse that project link. Do not attach the eventual public game's custom domain until the launch is ready.

## Before the actual game launch

- Review the 48 included Chatterbox recordings (each Whisper-verified against its script) and story scripts. Audio is already generated locally and served as static MP3 files.
- Schedule daily releases beyond the six-character reference collection. All six stories are currently available in the guest picker.
- Add server-side answers and score verification if shared competitive scores are introduced. The reference prototype currently contains its answer in browser source.
- Confirm the final brand and domain, then remove the development `X-Robots-Tag` header.

The six stories remain a complete playable reference while these production features are developed.
