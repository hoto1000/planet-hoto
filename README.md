# Planet Hoto

Static site, served by GitHub Pages from the `docs/` folder. No build step.

- `docs/index.html` — home page (seven languages, crisis strip, finder, guides, grounding tool, contact).
- `docs/avoid-scientology.html` — the "Avoiding Scientology" page, linked from the home menu and the Guides grid.

## Preview locally

```bash
node serve.js docs 8766
```

Then open http://localhost:8766/ in a browser.

## Deploy

Push to `main`. GitHub Pages is set to serve from `main` / `docs`, so the site updates on its own a minute or so after each push.

To use a custom domain (for example planethoto.org), add it under Settings → Pages in the GitHub repo and point the domain's DNS at GitHub Pages.
