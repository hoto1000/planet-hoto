# Planet Hoto

Static site, served by GitHub Pages from the `docs/` folder. No build step.

- `docs/index.html` — home page (seven languages, crisis strip, finder, guides, grounding tool, contact).
- `docs/avoid-scientology.html` — the "Avoiding Scientology" page, linked from the home menu and the Guides grid.

- `docs/customize.css`, `docs/customize.js` — the "Customize" panel (theme, text size, font, line spacing, motion, sound, layout density, reset). Choices are kept in `localStorage` under `ph-customize` only: no cookies, no accounts, no network calls. `customize.js` is loaded in `<head>` without `defer` on purpose, so saved choices are on `<html>` before first paint.

## Tests

```bash
npm test
```

Node's built-in test runner, no dependencies. It covers storage, reset, the page order (skip link, then the 988/911 bar), and WCAG AA contrast for every theme. `tests/e2e/customize.e2e.js` is an optional browser check that needs Playwright and a running preview (see the header of that file).

## Preview locally

```bash
node serve.js docs 8766
```

Then open http://localhost:8766/ in a browser.

## Deploy

Push to `main`. GitHub Pages is set to serve from `main` / `docs`, so the site updates on its own a minute or so after each push.

To use a custom domain (for example planethoto.org), add it under Settings → Pages in the GitHub repo and point the domain's DNS at GitHub Pages.
