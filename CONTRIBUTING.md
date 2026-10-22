# Contributing to Planet Hoto

Thanks for helping. The site is read by people having a hard time, so the bar is: **accurate, calm, short, and kind.**

## Ways to help

- **Translations.** All seven languages live in `docs/index.html`, keyed by `data-i18n` attributes. Keep the same meaning and tone as the English text; plain words beat literal ones.
- **Crisis lines and local services.** Add or correct a number for your country. Please link an official source in your pull request.
- **Guides.** Shorter and clearer is almost always better. Practical scripts ("here's what to say") are the most useful thing on the site.
- **Accessibility.** Screen-reader labels, contrast, focus order, reduced motion.
- **Bugs.** Broken links, layout problems on a specific phone or browser.

## Ground rules for content

- Don't diagnose, and don't promise outcomes.
- Prefer official or well-established sources, and cite them in the PR.
- Never remove or bury the crisis strip.
- Don't add trackers, analytics, or anything that collects data from visitors.

## Making a change

1. Fork the repo and create a branch.
2. Edit files in `docs/`. There is no build step.
3. Preview with `node serve.js docs 8766` and open http://localhost:8766/.
4. Check the page in at least one other language and on a narrow (phone-width) window.
5. Open a pull request that says what you changed and why.

Small pull requests are easiest to review. If you're planning something big, open an issue first so we can talk it through.
