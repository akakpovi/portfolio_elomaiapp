# Portfolio upgrade — deployment report

**Date:** 2026-11-21
**Production URL:** https://elomaiapp.com/
**Image:** `elomai-portfolio:m24.1-20261121`
**Verdict:** PASS_WITH_LIMITATIONS (see the end of this document)

## 1. State before the work

| Item | Value |
| --- | --- |
| Repository | `github.com/akakpovi/portfolio_elomaiapp`, branch `main`, clean tree, HEAD `aed3320` |
| Stack | Vite 6.3.5 + React 18 + TypeScript + Tailwind v4, single page, no router |
| Container | `portfolio` (compose project `infra`, `/root/infra/docker-compose.yml`) |
| Image | `elomai-portfolio:latest` (`3f3b8e819372`, built 2026-07-26) |
| Chain | Cloudflare → Nginx Proxy Manager (proxy host #1: `elomaiapp.com` → `portfolio:80`) → container |
| Exposure | no published host ports, network `infra_proxy` only |

Defects found in the previous version:

1. `github.com/akakpovi/Afro-Haar-App` and `github.com/akakpovi/rag_multimodal` returned **404** but were
   published as project links.
2. Projects were labelled `Production` / `Beta` / `Stable` without any deployed instance or repository.
3. The contact form only ran `setTimeout` and displayed a success message; nothing was ever sent.
4. The "Why Local AI" call to action rendered a `Send Message` label without any effect.
5. Blog entries carried invented publication dates and `Read article` buttons with no target.
6. `hello@ai-engineer.dev` had **no MX record** (the domain serves a "Coming Soon" page), so it could not
   receive mail; GitHub/LinkedIn contact cards pointed at `#` with invented handles.
7. Navigation pointed `About` at the cloud-vs-local comparison; there was no About section.
8. No SEO metadata beyond a title, no canonical URL, no sitemap, no robots.txt, no favicon.
9. The hero architecture panel staggered its nodes with `setTimeout`, so several nodes could stay invisible.

## 2. What changed

New sections: **Services** (5 cards), **About** (degree, roles, languages), **Freelancer**,
and a rewritten **Projects** grid with a detail dialog per project.

Navigation is now: Home · AI Solutions · Services · Projects · Technologies · About · Blog · Contact ·
Freelancer (external). Scroll-spy highlights the active section; the language selector keeps FR/EN/DE
with English as default.

New files:

```
src/app/data/site.ts          shared links and contact data
src/app/data/projects.ts      ten project entries with trilingual detail content
src/app/components/Services.tsx
src/app/components/About.tsx
src/app/components/Freelancer.tsx
public/robots.txt, public/sitemap.xml, public/favicon.svg, public/og-image.png
tsconfig.json
tests/playwright.config.ts, tests/e2e/portfolio.spec.ts, tests/screenshots.mjs
docs/DEPLOYMENT.md, docs/TESTING.md, docs/BACKUP.md, docs/REPORT.md, docs/screenshots/
```

Rewritten: `Hero`, `Header`, `Projects`, `Blog`, `Contact`, `Footer`, `TechStack`, `i18n`, `App`,
`index.html`, `nginx/default.conf`, `NeuralCanvas` (throttled to 30 fps, reduced particle count,
respects `prefers-reduced-motion`).

## 3. Project portfolio (status and verified links)

| Project | Status | Live | Source |
| --- | --- | --- | --- |
| AKA IA / Open Chat | Production | https://appchat.elomaiapp.com/ (200) | private |
| Afro-Haar-App | Production | https://app.elomaiapp.com/ (200, branded "Maison Ebène") | private (old link 404) |
| Presence | In Development | — | github.com/akakpovi/SaaS_Web_Application_digitale_presenz |
| EcoVision | Research | — | none public |
| Thermal Object Detection (YOLO) | Research, in progress | — | none |
| Infrastructure as Code | Academic | — | gitlab.rlp.net/iac-schulung-projekt/infrastructure-as-code-schulung |
| Local AI Operator | Prototype | — | none |
| Private AI Enterprise Platform | In Development | — | none |
| AI Cybersecurity Assistant | Prototype | — | none |
| MetaClean | Open Source | — | github.com/akakpovi/Meta_Clean |

No experimental results, client names or production claims are published. Thermal detection states
explicitly that no benchmark numbers exist yet.

## 4. Contact

`hello@ai-engineer.dev` was replaced by **ekakpovi656@gmail.com** (the address in the CV, the mail
configured for the other applications on the same server). The domain has no MX record, so the old
address could not receive mail.

The form now validates name, email, subject and message (inline errors, `aria-invalid`, `role="alert"`),
ignores a hidden honeypot field and opens the visitor's mail client with a prefilled subject and body.
The success state explains what happened and offers the address for copying.

## 5. Checks

| Check | Result |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`) | 0 errors |
| `npm run build` | 1618 modules, `dist` ≈ 322 kB JS / 96 kB CSS |
| `docker build` | success, image 63.5 MB |
| Container smoke (nginx headers, SPA fallback, assets) | 200, security headers present |
| Playwright — local build (4180) | **110 passed, 2 skipped, 0 failed** (606 s) |
| Playwright — production (https://elomaiapp.com) | **110 passed, 2 skipped, 0 failed** (742 s) |

The two skips are the "mobile menu" test, which only applies to the mobile viewport.

Viewports: 1440×900, 1366×768, 768×1024, 390×844 — in English, French and German.

## 6. Deployment

* Backup: `elomai-portfolio:latest` tagged as `elomai-portfolio:rollback-20260726`,
  `docker save` archive at `/root/backups/elomai-portfolio-latest-20261121T171400Z.tar.gz`,
  compose backup at `/root/backups/docker-compose.yml.20261121T171300Z.bak`.
* Image shipped with `docker save | gzip | ssh ai-vps 'gunzip | docker load'`.
* Compose service now points at `elomai-portfolio:m24.1-20261121`; only that service was recreated
  (`docker compose up -d --no-deps portfolio`). NPM, the network and every other container were untouched.
* Rollback: `sed -i "s|image: elomai-portfolio:.*|image: elomai-portfolio:rollback-20260726|"` in
  `/root/infra/docker-compose.yml`, then `docker compose up -d --no-deps portfolio`.

## 7. Remaining limitations

1. **No server-side mail delivery.** The container serves static files only; the contact form opens the
   visitor's mail client. Real background delivery needs an SMTP relay or a form endpoint and its
   credentials — not configured here, and no credentials were invented.
2. **No real project screenshots published.** The two deployed applications were opened during the audit,
   but the public AKA IA instance currently shows a broader assistant surface rather than the multi-model
   chat screen, so no application screenshot is presented as the product UI. Project cards use designed
   covers instead of fabricated screenshots.
3. **English level is "Basic"**, taken from the CV ("Grundkenntnisse"). No level was upgraded.
4. **Blog articles are not published.** The section lists five topics "in preparation" instead of
   carrying invented dates and dead links.
5. **Playwright runs with `channel: 'chrome'`** because Playwright 1.56 does not ship a Chromium build for
   Ubuntu 26.04; the local Chrome is used instead.
6. `github.com/akakpovi/Afro-Haar-App` and `github.com/akakpovi/rag_multimodal` remain private/absent; the
   site links to nothing that does not resolve.
7. The VPS root filesystem is at ~98% usage (1.3 GB free); future image updates should free space first.

## 8. Screenshots

`docs/screenshots/` — captured from production after deployment:

```
01-hero-en-desktop.png      07-contact-en.png
02-services-en.png          08-hero-fr-desktop.png
03-projects-grid-en.png     09-hero-de-desktop.png
04-project-detail-aka-ia.png 10-mobile-hero-en.png
05-freelancer-en.png        11-mobile-projects-en.png
06-about-en.png             12-mobile-menu-en.png
```
