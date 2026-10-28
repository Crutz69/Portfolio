# Linus Virebrand: portfolio site

The user's public CV portfolio. The user writes in Swedish; reply in Swedish. The site is bilingual: English (default) and Swedish, with an EN | SV switch on every page.

## Where it lives

- Source: this folder. Content is the JSON block `site-data` in `index.html`; `app.js` renders it; `site.css` is shared by all pages.
- Pages: `index.html` (home), `sundmark.html` (Sundmark World Builder case study), `media.html` (demos with videos).
- Swedish:
  - Home: the JSON keeps English in the plain fields and Swedish in an `sv` object beside them (top level, each project, each experience item). An empty Swedish field falls back to English. `app.js` holds the interface words in `UI`.
  - The language comes from `?lang=sv|en`, then the visitor's last pick (`localStorage` key `portfolio-lang`), then the browser language.
  - `sundmark.sv.html` and `media.sv.html` are Swedish copies of the English pages. When you change an English page, change its Swedish copy too.
  - On the Swedish home page, links to `sundmark.html` and `media.html` go to the `.sv.html` copies (`SV_PAGES` in `app.js`).
- Motion: `fx.js` is shared by all pages. It draws the live 3D terrain in the title area, adds depth to the title, tilts the project pictures and makes content rise into view. With `prefers-reduced-motion` the terrain is drawn once and nothing moves. If `fx.js` is missing, the pages fall back to the still 2D contours.
- 3D models: the `models` block in the JSON drives a `<model-viewer>` section (pinned to @google/model-viewer 3.5.0 on jsdelivr, loaded only near the section).
  - Files live in `models/*.glb`, with 480×360 WebP thumbnails at `img/model-*.webp`. They are Tripo AI models from Chaos Crown (`Documents\Unreal Projects\RTSTemplate`) and the APC from MySurvivalGame.
  - They were converted in Blender: decimated to at most 55 000 triangles, textures at 1024 px, centred, longest side 2 m. Keep each GLB under about 4 MB.
  - "Tripo" in the user's messages means Tripo AI. Describe each model by what was actually done to it.
- Static build for normal hosting: `python build_static.py` writes `dist/` (complete HTML documents, img/, media/*.mp4).
  - Target: Vercel, imported from a GitHub repo of this folder. `vercel.json` runs `python3 build_static.py` and serves `dist/`; `.gitignore` keeps `dist/` and `source/` out. Custom domain `portfolio.amastack.com`. The DNS for amastack.com is on Cloudflare (CNAME, DNS only).
  - The user pushes and deploys themselves. Pushing or deploying needs the user's own login and a go-ahead each time.
- claude.ai copy: https://claude.ai/artifact/NDaB2uHkRd2P6UXdHtM3rf. It is private until the user shares it.
  - Capabilities: artifact, assets, user. The owner gets an in-page "Edit site" editor; "Save & publish" republishes `index.html` as the same shell with new JSON.
  - To update, publish `index.html` with that `url`, `root` = this folder, and `files` for any changed support files (also the `.sv.html` pages).
  - If the user may have saved edits in the page, read the live artifact first and merge.
- `source/`: original PNGs and WebM recordings. They are not published.
- `build_media.py`: the script ChatGPT used for the walkthrough videos.
- `build_trailer.py`: the Sundmark trailer, about 50 s at 1600×672.
  - It is cut from the stills in `img/`, with camera moves, title cards and captions in English and Swedish.
  - Output: `media/trailer-en.mp4`, `media/trailer-sv.mp4` and a text-free `img/trailer-poster.jpg`.
  - It is labelled "Sequence of stills". Replace it with real footage once that is recorded in MySurvivalGame.

## Rules

- Do not publish the phone number or the birth date.
- The email `linusvirebrand@gmail.com` is on the site at the user's request. Suggest a separate address against spam.
- Credit honestly. The user designs and directs; code is written with AI assistants. Never overclaim.
  - Every sentence must be something the user can defend in an interview.
  - DevMind, DateMe and VoxelCommander come from the user's own profile document; Claude has not verified them.
- Label footage honestly: "Recorded gameplay" versus "Sequence of stills" (Swedish: "Inspelat gameplay" versus "Sekvens av stillbilder").
- Swedish text says exactly what the English says, no more.
- Images: web JPG, at most 1600 px wide, about 50–300 KB. Covers are 16:9.
- Art in the Unreal shots comes from licensed packs. Keep the credit line in the footers.
- Others edit this folder too: ChatGPT and the user. Check what changed before building on it (`git status`, `git diff`; the folder is a git repo on `main`).
  - JSON must stay valid.
  - `cover.src` must match `img/[a-z0-9_-.]+.(jpg|png|webp)`.
  - Links must be `https://`.

## Open work (assessment 2026-10-28, highest value first)

1. **Code to inspect.** Add "Code" links to public repos: VoxelCommander and DevMind, and possibly a cleaned MapGen repo without purchased assets. Ask the user which repos may be public.
2. **Show the user's own skill.** Write short case studies for VoxelCommander and DevMind: the hardest problem, the decision taken, what was learned. They need input from the user.
3. **Real visuals.**
   - Screenshots for DevMind, DateMe and VoxelCommander (the user provides them).
   - Real Unreal footage instead of the still slideshows: a walk through the test facility and a fly-over of Kvarnvik. This has to be recorded from the MySurvivalGame project, in a session working there.
4. **CV.** The user does not want a target role or "what I am looking for" on the site; show skills and how they work instead (the "approach" section). The CV in `Desktop\Linus CV` contains the phone number and home address, so it cannot be linked as it is.
5. **Fewer cards per game.** Merge the three MySurvivalGame cards (Sundmark, Test Facility, Kvarnvik Landmarks) into one strong card.
6. **Missing details.** Years for DevMind, DateMe and VoxelCommander; a link for VoxelCommander.
7. **Deploy** on Vercel from GitHub and connect `portfolio.amastack.com`.

Source material about the game (MySurvivalGame, Sundmark MapGen, test facility) is in `C:\Dev\MySurvivalGame`; see `DEMO_MAP_PLAN.md` there. Do not edit that repo from this project.
