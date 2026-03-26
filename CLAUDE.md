# d3smbmxdr

## Site Index Page (`/links`)

When you add, remove, or rename any page or route on this site, you **must** update the site index at `public/index-page.html` (served at `/links`).

- **Standalone Pages** section comes first, with the **newest page at the top**.
- Then Apps, then APIs.
- Each entry needs: title, badge type, path, and a 1-2 sentence description.
- All links use `target="_blank"`.

## Deployment

- Push to `main` — Vercel auto-deploys. Do not run local dev servers or tests.
- Git remote uses SSH: `git@github.com:Mentis123/d3smbmxdr.git`

## Key Paths

- Static HTML pages go in `public/`
- Next.js routes in `app/`
- Rewrites defined in `next.config.js`
