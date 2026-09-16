# Fix GitHub Pages hosting

The site is deployed to GitHub Pages under a repository subfolder (`/hettarkhala`), but the build isn't told about that subfolder. Only the two HTML files get patched afterwards with a find-and-replace, so every other file the site loads still points at the wrong address. That is why pages break and refreshing gives a 404.

## What will change

1. **Tell the build about the subfolder properly** — the site is built once, knowing it lives at `/hettarkhala/`, so every link, script, style and image inside it is correct. No more after-the-fact text patching in the deploy steps.
2. **Keep local preview working** — the subfolder only applies to the published build; in Lovable the site still opens at the root.
3. **Fix refresh and deep links** — a fallback page is published so opening or refreshing any note URL directly loads the site instead of GitHub's 404.
4. **Add the marker file GitHub Pages needs** so it stops ignoring files and folders that start with an underscore (the site's own asset shell uses those).
5. **Simplify the deploy workflow** to: install, build, copy the shell to `index.html` and `404.html`, add the marker file, upload.

## Technical details

- `vite.config.ts`: set `base` to `/hettarkhala/` for production builds only (root for dev/preview) so Vite emits correct asset and chunk URLs, including lazily loaded route chunks.
- `src/router.tsx`: derive `basepath` from `import.meta.env.BASE_URL` instead of the hardcoded `/hettarkhala`, keeping dev at `/` and production under the repo path.
- `.github/workflows/deploy.yml`: remove all `sed` path rewriting; after `npm run build`, copy `.output/public/_shell.html` to `index.html` and `404.html`, `touch .output/public/.nojekyll`, then upload `.output/public`.
- Confirm `public/robots.txt` / favicon references resolve under the base path.
- SPA mode stays enabled; the app remains fully static (markdown is bundled at build time), so no server runtime is required.

## Notes

- Repository name is assumed to be `hettarkhala`. If the repo has a different name, the base path must match it exactly, otherwise assets 404 again.
- In GitHub repo settings, Pages source must be set to "GitHub Actions".
