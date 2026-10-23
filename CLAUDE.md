# d3smbmxdr

## Site Index Page (`/links`)

When you add, remove, or rename any page or route on this site, you **must** update the site index at `public/index-page.html` (served at `/links`).

- **Standalone Pages** section comes first, with the **newest page at the top**.
- Then Apps, then APIs.
- Each entry needs: title, badge type, path, and a 1-2 sentence description.
- All links use `target="_blank"`.
- The **Related Sites** section cross-links `adamrappaport.vercel.app/links` (the personal site's own index, which links back here) and Cisco Live. Keep both directions when either site changes.
- `/contributions` is deliberately not listed (a personal value summary) until the owner decides.

## Deployment

- Push to `main` — Vercel auto-deploys. Do not start a Next dev server or run the repo's test scripts by default.
- Git remote uses SSH: `git@github.com:Mentis123/d3smbmxdr.git`
- Syntax-check first: extract any inline `<script type="module">` to a scratch file and run `node --check` on it; confirm `next.config.js` loads with `node -e "require('./next.config.js')"`.

## Headless browser validation (static pages)

Use this when a page renders in the browser (WebGL, canvas, JS-driven UI) and a parse check is not enough. It was used to validate `/datacenter`, which passed a parse check and still threw at runtime.

- **Serve `public/` statically**, not via Next: `cd public && python3 -m http.server 8765 &`. Pages load vendored modules from `/map-assets/...` through an importmap, and a static server resolves those paths the same way Vercel does.
- **Playwright is global** on the sandbox, not in the repo. Import it from `$(npm root -g)/playwright/index.mjs` (a bare `import 'playwright'` from a scratch dir will not resolve).
- **Use the preinstalled Chromium:** `chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] })`. Do not run `playwright install`.
- **Put the probe script in the scratchpad**, not the repo, and write screenshots there too.
- **Collect errors from the start:** attach `page.on('pageerror')` and `page.on('console')` before `goto`. Uncaught errors in a `requestAnimationFrame` loop do not reach the page's status UI, so a "still loading" overlay is the only visible symptom.
- **Wait a few seconds after load**, then check that the canvas repaints: screenshot the element twice a second apart and compare bytes.
- **Exercise the controls**, not just the first paint: click each pin and card, toggle modes, press pause, and check the `aria-pressed` and label text change.
- **Check both desktop (1440×900) and phone (390×844) widths**, and assert `document.documentElement.scrollWidth - clientWidth === 0`.
- **Expect SwiftShader warnings** (`Automatic fallback to software WebGL`, `GPU stall due to ReadPixels`). They come from the sandbox, not the page. Treat only `pageerror` and app-level `console.error` as failures.
- **Stop the server by PID** when done (`ps -eo pid,args | grep "[h]ttp.server 8765"`). Don't `pkill -f` on the same pattern, since it can match your own shell.

## Shared 3D structures (consumer rules)

The energy, mining and datacenter worlds are **owned by `Mentis123/adamrappaport`**. This repo only serves synced copies:

- `public/map-assets/*` and `public/lab-worlds/{energy,mining,retail,datacenter,nextdc}.html` are copies. **Never edit them here.** Change the canonical repo and re-sync.
- `public/lab-worlds/version.json` pins the canonical commit and every file hash. A sync is only valid when `--check` passes.
- Canonical map and rules: `adamrappaport/docs/SHARED-WORLDS.md` (modules, world/view/hotspot/wrapper contracts, how to add a world, the headless checklist).
- Routes: `/datacenter` rewrites to `/lab-worlds/datacenter.html`, the shared viewer with `body[data-world="datacenter"]`. `/ai-lab` links to the energy, mining and retail copies.
- Re-sync from a checkout of the canonical repo: `node scripts/sync-lab-worlds.mjs /home/user/d3smbmxdr`, then the same command with `--check`. Commit the synced output here with the route or page change.

Learned 19 Oct 2026: the old `/datacenter` page had its own controls and boxes and looked basic. Don't add a page that builds its own toolbar, viewer or scene. Add a world to the shared viewer instead.

Learned 19 Oct 2026 (second pass): the datacenter drew a raised access floor under the AI racks, the opposite of the infographic's structure point. AI racks weigh 2,000–5,000+ lb and many raised floors cannot carry that. The world uses a saw-cut slab on grade. Read `adamrappaport/docs/DATACENTER-DESIGN.md` before changing the scene or its captions.

Learned 19 Oct 2026 (third pass): the datacenter is now the infographic's four cards as four platforms (too hungry, too hot, too heavy, AI ready), with the facts written into the scene as placards and tags because the viewer hides its caption on phones. Long captions now wrap within their half of the bottom bar (fixed once in `viewer.css`).

After any shared-module change, compare paused, fixed-time frames of `/lab-worlds/energy.html` and `mining.html` before and after (`__tabletop.setState({view:'hero',timeSeconds:12,paused:true,quality:'low'})`, then a page screenshot clipped to `#scene`). Byte-identical frames mean no regression. This caught a one-line CSS change that shifted the energy and mining caption.

## World host pages (a 3D world plus a side panel)

`/ai-lab/*`, `/nextdc` and `/datacenter` embed a synced world in an iframe (`/lab-worlds/<name>.html?embed=1&controls=compact`) with a Next route beside it for the words. The world carries pins and light; the panel carries the explanation. Messages, hooks and the data-module pattern are in `adamrappaport/docs/SHARED-WORLDS.md`.

- **One host component for every world: `app/_worlds/WorldExplorer.tsx`.** A route is three lines: `<WorldExplorer world="<name>" brand={...}/>`. It reads `/map-assets/<name>-data.js` and renders whatever that module provides:
  - stories (step captions; the step's `focus` card is shown under the caption);
  - cards (`lead`, `facts`, `checklist`, `takeaway`, `inWorld`, or `what`/`why`/`demo`/`next` with `vendor`);
  - optionally `STATUSES`, `INTRO` (with a quote), `OUTCOMES` and `TAGLINE`.

  Add a field to the data module and the component, not a new page. Learned 19 Oct 2026: the datacenter pro pass reused the NEXTDC panel by lifting it into this component.
- `/datacenter` is an app route now, not a rewrite to `/lab-worlds/datacenter.html`; the bare wrapper still works on its own.

- **One source for the words.** `/nextdc` imports `/map-assets/nextdc-data.js` at runtime with `import(/* webpackIgnore: true */ url)` and a variable URL, so the panel and the world read the same synced file.
- **`app/globals.css` styles every `header` and `footer`** (white background, padding). Scoped page CSS must reset them, as `lab.css` and `nextdc.css` do. Learned when `/nextdc` shipped a white header bar in its first build.
- **Validating a Next route** (the static-server recipe above cannot render one): `npm ci`, then `npx tsc --noEmit`, `npx next build`, and `npx next start -p 3107` (a production server, not the dev server). Probe it headless, and reach into the iframe with `page.frames()` to click pins and read `__tabletop`. Delete `tsconfig.tsbuildinfo` afterwards; it is a build artefact.
- **Stopping servers safely:** `ss` is not installed. Scan `/proc/*/cmdline` with the pattern split across quotes (`pat="next-""server"`), so the match cannot hit your own shell's command text. Two shells were killed this way before.
- The site icon is `app/icon.svg` (app routes) and `public/favicon.svg`, and `/favicon.ico` rewrites to it, so static pages get it too. A 404 in the console now means a real missing asset.
- `WorldExplorer` has a Full screen button: native fullscreen where the browser allows it, a fixed viewport fallback otherwise (iPhone Safari). It keeps the same iframe, so the world never reloads.
- Views may carry `portraitZoom` (applied by the shared viewer on tall, narrow frames). The datacenter and NEXTDC views use it so phones see the world closer; desktop framing is unchanged.

- **AI Lab recipe exhibits** (`app/ai-lab/LabExplorer.tsx`, `lib/ai-lab/lab-recipes.ts`): titles, captions, say-this notes, where-it-runs, limits, provenance and the featured three per world all come from the synced `/map-assets/lab/recipes/index.js` (`RECIPES`, `FEATURED`, `LEGACY_IDS`), imported at runtime like `nextdc-data.js`. Add or change an exhibit in adamrappaport and re-sync; do not copy its words into this repo. The retired four (`LEGACY_IDS`) keep the old three-phase UI from `lib/ai-lab/exhibits.ts`. On phones the caption sits above and the chapter bar below the canvas (overlays only in full screen) so the renderer frames the subject in the whole canvas: learned 23 Oct 2026, when overlaid controls hid the lower half of the AI-view box at 390 px. The renderer draws its own caption placard unless told otherwise, so `LabExplorer` sends `exhibit:command {action:'captions', value:false}` on `exhibit:ready` for recipe exhibits; drop that and the caption appears twice.
- **Adding an AI Lab world** (learned 23 Oct 2026, retail): add it to `LabIndustry`, `LABS` (poster under `/map-assets/`, synced from adamrappaport) and `LAB_WORLDS` in `lib/ai-lab/content.ts`; the hub tiles, counts, `[industry]` params and explorer headings all follow from those. The renderer side needs the world in `lab-locations.js` or `createLabLayer` returns no markers. Variation captions use `chapterCaption()` in `lib/ai-lab/lab-recipes.ts`, the same rule as the renderer (`variation.captions[chapterId]` overrides `variation.caption` from the AI view on).
- **AI Lab narration** (23 Oct 2026, owner decision: sound ON by default): a recipe may carry `narration:{base, lines:{scene,change,aiView,review}, variation:{<chapterId>: file|null}}`; clips live in adamrappaport `public/map-assets/lab/audio/<id>/` and sync over. `useNarration` in `lib/ai-lab/lab-recipes.ts` plays the chapter's clip when the renderer reports that chapter (restarts on a new chapter, variation switch or replay), pauses with the timeline, and offers Sound on/off (remembered in localStorage `ailab.narration.muted`) or "Tap for sound" if the browser refuses. The click that opens an exhibit is the gesture that permits playback. To add an exhibit's voice: split the owner's ElevenLabs file at its pauses (`ffmpeg -af silencedetect=noise=-38dB:d=0.35`), cut with loudnorm to mono 96k, add the `narration` field, re-sync. Thermal patrol was first. Lines are cut with ~0.1 s lead-in and must end before their chapter does; `narration.delay:{change:1.6}` starts a line that many seconds into its chapter so it lands on the on-screen event (learned 23 Oct 2026: every Change line otherwise named the event 1.5-3 s before it happened). Chapter jumps and Replay call `rewind()` so the same chapter's line restarts.
- **Killing the Next server:** match only the split pattern (`"next-""server"`). Matching `next start -p 3107` also hits the shell that launched it and kills your own command (23 Oct 2026).

Learned 19 Oct 2026 (`/nextdc`): checking the kit first meant the world, pins, controls and host pattern were all reuse. The new code was the scene, its data module, four generic viewer hooks and the panel.

## Build before you design

Order for any new page, world or infographic here: (1) source the facts and mark the owner's points as theirs, (2) check what the shared kit can build and its limits, probing the current page headless, (3) write the design, (4) build, validate and look at the screenshot. Read `adamrappaport/docs/DATACENTER-DESIGN.md` section 1 for the datacenter, and `adamrappaport/docs/SHARED-WORLDS.md` for the kit.

## Build from what already exists (reuse, repurpose, regenerate)

Before writing any new 3D scene, diagram, texture or page chrome, look at what the site already has and decide deliberately which of three paths to take. Write the decision down in the PR or commit message.

- **Reuse** as-is when a module already does the job: `public/map-assets/` (world shell, substation, tanks, flow and water shaders, pipeline, builder utilities) and `public/lab-worlds/` for the energy and mining worlds.
- **Repurpose** when the module is close but its coordinates or labels belong to another scene: keep the geometry recipe and change the placement, datum or wording. Example: `buildElectrical` placed at `LAYOUT.yard` on the datacenter pad.
- **Regenerate** only when nothing usable exists, and do it procedurally (canvas textures, batched boxes) so no new binary asset is needed. Say which part was regenerated and why.

Do not hand-build a stand-in for something a sibling world already renders well. The `/datacenter` page first shipped as basic boxes while the energy and mining worlds had a real substation, pipes, basin water and a shell that were never used. Check the sibling modules first, then the textures in `public/map-assets/textures/` and `public/decision-room-art/`, then generate.

## Keep these instructions current

When you learn something that would have saved time or prevented a mistake on this site, add it here in the same change: a build step, a gotcha, a validation method, or a rule that turned out to be wrong. Keep each addition short and specific, and say what it was learned from.

## Key Paths

- Static HTML pages go in `public/`
- Next.js routes in `app/`
- Rewrites defined in `next.config.js`

## Coastwater presenter

`/decision-room/coastwater/control?room=...` is the private facilitator console, linked prominently from full admin and opened after room creation. It monitors saved drafts, locks and at most two curated locked comments. `/decision-room/coastwater/present?room=...&display=1&displayToken=...` is the read-only audience display. Presentation position is room-persisted in the existing event log; optional appetite notes remain browser-local and sync between tabs. Keep header/footer visible at 720p, scrolling only the central stage.

Learned from the 21 Oct Adam/Dan demo: new `coastwater@2` rooms use 15 screens (welcome, instructions, six decision/discussion pairs, close), visible option costs and no compulsory reveal/boundary screens. Keep revision-1 content and its five-phase presenter for existing rooms. Audience timers default off and are toggled in private controls; hidden timing never auto-closes voting. Content changes must add a pinned revision so old votes and reports retain their meaning.
