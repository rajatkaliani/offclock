# Vercel development project

Offclock uses the approved first-edition interface and scoring as the development reference. It is a static application; there is no framework migration or dependency installation needed to preserve the design.

## Local development

Use Node.js 22 or newer.

```sh
npm run dev
```

Open the printed local URL. Source is in `dist/`, with gameplay in `app.mjs`, scoring and profession data in `game-core.mjs`, and the visual design in `style.css`.

```sh
npm run check
```

Checks JavaScript syntax, agreed scoring and profession behavior, and local asset references. `npm run build` verifies the ready-to-deploy `dist/` directory.

## Vercel

`vercel.json` explicitly selects a static project with `dist` as the output directory and `npm run build` as its build command. Deploy the project root, not the parent Sandbox directory. The development site is marked `noindex` while it is a prototype.

Use the connected Vercel integration to create or select the development project and deploy this folder. With an authenticated Vercel CLI, `vercel` creates a Preview Deployment and stores the project link in ignored `.vercel/`. Subsequent deployments must reuse that project link. Do not attach the eventual public game's custom domain until the launch is ready.

## Before the actual game launch

- Replace demo browser narration with reviewed ElevenLabs audio clips, preserving text captions.
- Add the daily guest content collection, release dates, and archive.
- Add server-side answers and score verification if shared competitive scores are introduced. The reference prototype currently contains its answer in browser source.
- Confirm the final brand and domain, then remove the development `X-Robots-Tag` header.

The first edition remains a complete playable reference while these production features are developed.
