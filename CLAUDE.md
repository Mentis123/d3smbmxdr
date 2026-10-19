# d3smbmxdr

## Site Index Page (`/links`)

When you add, remove, or rename any page or route on this site, you **must** update the site index at `public/index-page.html` (served at `/links`).

- **Standalone Pages** section comes first, with the **newest page at the top**.
- Then Apps, then APIs.
- Each entry needs: title, badge type, path, and a 1-2 sentence description.
- All links use `target="_blank"`.

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

## Keep these instructions current

When you learn something that would have saved time or prevented a mistake on this site, add it here in the same change: a build step, a gotcha, a validation method, or a rule that turned out to be wrong. Keep each addition short and specific, and say what it was learned from.

## Key Paths

- Static HTML pages go in `public/`
- Next.js routes in `app/`
- Rewrites defined in `next.config.js`
