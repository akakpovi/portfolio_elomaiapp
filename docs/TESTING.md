# Testing

## Static checks

```bash
cd portfolio
npm run typecheck    # tsc --noEmit over src/
npm run build        # Vite production build
```

`npm run typecheck` uses the TypeScript compiler shipped in `node_modules`; `tsconfig.json` targets
the app sources with `noEmit`.

## Playwright end-to-end suite

The suite lives in `tests/` with its own `package.json`, so the application's pnpm lockfile stays
untouched (the Docker build depends on it with `--frozen-lockfile`).

```bash
cd portfolio/tests
npm install                    # @playwright/test only
npx playwright install chromium   # if the local browser build is missing

# against the local dev server (npm run dev, port 5180)
npx playwright test

# against the built output (npm run preview, port 4180)
BASE_URL=http://127.0.0.1:4180 npx playwright test

# against production
BASE_URL=https://elomaiapp.com npx playwright test
```

Viewports: desktop 1440×900, laptop 1366×768, tablet 768×1024, mobile 390×844.
Reports: `tests/report/html` (open with `npx playwright show-report report`) and
`tests/report/results.json`.

> On this workstation (Ubuntu 26.04) Playwright 1.56 cannot install its bundled Chromium, so the
> config uses `channel: 'chrome'` with the locally installed Google Chrome.

## What is covered

| Area | Checks |
| --- | --- |
| Page health | single `h1`, hero headline, no console/page errors, SEO meta, canonical, OG image, JSON-LD |
| Static files | `/robots.txt` and `/sitemap.xml` respond with expected content |
| Navigation | every nav entry scrolls its section into view; mobile menu open/close |
| Languages | EN / FR / DE switch the headline and update `<html lang>` |
| Projects | ten cards, every detail dialog opens and closes, deep links (`#project-…`), Escape closes |
| External links | Freelancer CTAs (present in nav, hero, services, about, contact, footer), only verified live/repo links, no `#` or empty hrefs |
| Contact | required-field validation, invalid email rejection, successful submit reaches the ready state |
| Sections | all sections present, six service cards, About states the real degree and language level, footer links |

## Screenshots

Production screenshots captured after deployment are stored in `docs/screenshots/`.
