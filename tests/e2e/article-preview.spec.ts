import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * M09.1 — preview validation for the transformed article 6.
 *
 * Runs against the local preview server that mirrors the nginx routing and
 * serves files produced by the real content receiver. Nothing here touches
 * production; the only request to elomaiapp.com is a read-only check that the
 * article is *not* published there.
 *
 *   BASE_URL=http://127.0.0.1:8098 bunx playwright test tests/e2e/article-preview.spec.ts \
 *     --config=tests/playwright.config.ts
 */

const PRODUCTION = 'https://elomaiapp.com';

const ARTICLES = [
  {
    lang: 'en',
    path: '/blog/en/spf-dkim-dmarc-monitoring/',
    h1: 'SPF, DKIM and DMARC: email authentication you can monitor',
    seoTitle: 'SPF, DKIM and DMARC, monitored — EL0M AI ENGINEER',
    // M09.1.4: the dedicated WordPress og_title, not the SEO title.
    ogTitle: 'SPF, DKIM and DMARC: email authentication you can monitor',
  },
  {
    lang: 'de',
    path: '/blog/de/spf-dkim-dmarc-ueberwachen/',
    h1: 'SPF, DKIM und DMARC: E-Mail-Authentifizierung überwachen',
    seoTitle: 'SPF, DKIM und DMARC überwachen — EL0M AI ENGINEER',
    ogTitle: 'SPF, DKIM und DMARC: E-Mail-Authentifizierung überwachen',
  },
  {
    lang: 'fr',
    path: '/blog/fr/spf-dkim-dmarc-surveiller/',
    h1: "SPF, DKIM et DMARC : surveiller l'authentification e-mail",
    seoTitle: 'SPF, DKIM et DMARC : les surveiller — EL0M AI ENGINEER',
    ogTitle: "SPF, DKIM et DMARC : surveiller l'authentification e-mail",
  },
];

const PRIMARY = ARTICLES[0];
// tests/e2e -> portfolio/docs/screenshots/m09-1-3, independent of the cwd.
// M09.1.3 re-captures the evidence after the editorial pass; the M09.1.1 set is kept.
const SCREENSHOT_DIR = path.resolve(__dirname, '../../docs/screenshots/m09-1-3');

// These must match the projects in playwright.config.ts.
const VIEWPORTS = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'laptop-1366x768', width: 1366, height: 768 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'mobile-390x844', width: 390, height: 844 },
];

function collectErrors(page: Page) {
  const consoleErrors: string[] = [];
  const notFound: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('response', (res) => {
    if (res.status() === 404) notFound.push(res.url());
  });
  return { consoleErrors, notFound };
}

test.describe('article 6 — English preview', () => {
  test('preview page opens with the correct title and a single h1', async ({ page }) => {
    const response = await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(PRIMARY.h1);
    // The preview is served from loopback; only a local server can return it.
    expect(new URL(page.url()).hostname).toBe('127.0.0.1');
  });

  test('article content renders completely', async ({ page }) => {
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    const body = page.locator('.article-body');

    await expect(body.locator('h2')).toHaveCount(12);
    await expect(body.locator('h3')).toHaveCount(3);
    // Two DMARC record examples, one dig transcript and two Python listings.
    await expect(body.locator('pre code')).toHaveCount(5);
    await expect(body.locator('pre code.language-python')).toHaveCount(2);
    await expect(body.locator('table')).toHaveCount(1);
    // v, p, sp, np, adkim/aspf, rua, ruf and t (added in the M09.1.3 pass).
    await expect(body.locator('table tbody tr')).toHaveCount(8);
    await expect(body).toContainText('v=DMARC1; p=none');
    await expect(body).toContainText('dns.resolver');
    // No unresolved shortcode or template placeholder survived.
    await expect(body).not.toContainText('{{');
    await expect(body).not.toContainText('undefined');
    await expect(body).not.toContainText('elomai-media:');
  });

  test('featured image and every inline image load', async ({ page }) => {
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    const cover = page.locator('figure.article-cover img');
    await expect(cover).toHaveCount(1);
    await expect(cover).toBeVisible();
    // Responsive images report a density-corrected naturalWidth, so assert that
    // the chosen resource finished loading and the server actually returned it.
    const loaded = await cover.evaluate((img: HTMLImageElement) => ({
      complete: img.complete,
      width: img.naturalWidth,
      src: img.currentSrc,
    }));
    expect(loaded.complete).toBe(true);
    expect(loaded.width).toBeGreaterThan(100);
    const coverResponse = await page.request.get(loaded.src);
    expect(coverResponse.status()).toBe(200);
    expect(coverResponse.headers()['content-type']).toContain('image/');

    const broken = await page.locator('img').evaluateAll((imgs) =>
      imgs
        .filter((img) => (img as HTMLImageElement).naturalWidth === 0)
        .map((img) => (img as HTMLImageElement).getAttribute('src') || 'inline'),
    );
    expect(broken, `broken images: ${broken.join(', ')}`).toEqual([]);
  });

  test('table of contents is present and its anchors resolve', async ({ page }) => {
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    const toc = page.locator('aside.toc');
    await expect(toc).toBeVisible();
    const links = toc.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toMatch(/^#[a-z0-9-]+$/);
      const id = (href || '').slice(1);
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test('no broken internal links', async ({ page, request }) => {
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) =>
      Array.from(new Set(links.map((a) => (a as HTMLAnchorElement).getAttribute('href') || ''))).filter(Boolean),
    );
    expect(hrefs.length).toBeGreaterThan(0);

    const base = new URL(page.url()).origin;
    for (const href of hrefs) {
      const res = await request.get(`${base}${href}`, { failOnStatusCode: false });
      expect(res.status(), `${href} should resolve`).toBeLessThan(400);
    }
  });

  test('external references resolve', async ({ page, request }) => {
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    const hrefs = await page.locator('.article-body a[href^="https://"]').evaluateAll((links) =>
      Array.from(new Set(links.map((a) => (a as HTMLAnchorElement).href))),
    );
    expect(hrefs.length).toBeGreaterThanOrEqual(5);

    for (const href of hrefs) {
      const res = await request.get(href, { failOnStatusCode: false, timeout: 20_000 });
      expect(res.status(), `${href} should resolve`).toBeLessThan(400);
    }
  });

  test('code blocks render as monospace and stay inside the column', async ({ page }) => {
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    const code = page.locator('.article-body pre code').first();
    const font = await code.evaluate((el) => getComputedStyle(el).fontFamily.toLowerCase());
    expect(font).toMatch(/mono|consolas|menlo|courier/);

    const overflow = await code.evaluate((el) => {
      const pre = el.parentElement as HTMLElement;
      return { scrollWidth: pre.scrollWidth, clientWidth: pre.clientWidth };
    });
    // A code block may scroll internally, but it must not widen the page.
    const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewport = page.viewportSize()?.width ?? 0;
    expect(docWidth).toBeLessThanOrEqual(viewport + 1);
    expect(overflow.clientWidth).toBeGreaterThan(0);
  });

  test('language switcher reaches the German and French drafts', async ({ page }) => {
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    const bar = page.locator('.translation-bar');
    await expect(bar).toBeVisible();
    await expect(bar.locator('a')).toHaveCount(2);

    await bar.locator('a[hreflang="de"]').click();
    await page.waitForURL(/\/blog\/de\/spf-dkim-dmarc-ueberwachen\/$/);
    await expect(page.locator('h1')).toHaveText(ARTICLES[1].h1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');

    await page.locator('.translation-bar a[hreflang="fr"]').click();
    await page.waitForURL(/\/blog\/fr\/spf-dkim-dmarc-surveiller\/$/);
    await expect(page.locator('h1')).toHaveText(ARTICLES[2].h1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  });

  test('no console errors and no 404 responses', async ({ page }) => {
    const { consoleErrors, notFound } = collectErrors(page);
    await page.goto(PRIMARY.path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    expect(notFound, `404 responses: ${notFound.join(', ')}`).toEqual([]);
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
  });

  test('SEO metadata matches the review package', async ({ page }) => {
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(PRIMARY.seoTitle);

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description?.length ?? 0).toBeGreaterThanOrEqual(130);
    expect(description?.length ?? 0).toBeLessThanOrEqual(155);

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
    // M09.1.4: og:title comes from the dedicated WordPress og_title field; the
    // document title above stays the SEO title.
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', PRIMARY.ogTitle);
    expect(PRIMARY.ogTitle).not.toBe(PRIMARY.seoTitle);
    // The social card is a dedicated 1200×630 JPEG, not the 16:9 cover.
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/elomaiapp\.com\/media\/[a-f0-9]{64}\.(?:jpg|jpeg)$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');

    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(ld || '{}');
    expect(data['@type']).toBe('BlogPosting');
    expect(data.inLanguage).toBe('en');
    expect(data.headline).toBe(PRIMARY.h1);
    expect(new Date(data.datePublished).getUTCFullYear()).toBeGreaterThan(2020);
    expect(data.image).toMatch(/^https:\/\/elomaiapp\.com\/media\//);

    const breadcrumb = JSON.parse((await page.locator('script[type="application/ld+json"]').nth(1).textContent()) || '{}');
    expect(breadcrumb['@type']).toBe('BreadcrumbList');
  });

  test('the Open Graph card is a real 1200×630 file that matches its metadata', async ({ page }) => {
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    const origin = new URL(page.url()).origin;

    const ogUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogUrl).toBeTruthy();
    const ogPath = new URL(ogUrl as string).pathname;

    // The tag must describe the file that is actually served.
    const res = await page.request.get(`${origin}${ogPath}`);
    expect(res.status(), `${ogPath} must exist`).toBe(200);
    const contentType = (res.headers()['content-type'] || '').split(';')[0];
    await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', contentType);

    const dims = await page.evaluate(async (src) => {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`could not decode ${src}`));
        img.src = src;
      });
      return { width: img.naturalWidth, height: img.naturalHeight };
    }, `${origin}${ogPath}`);

    // 1200×630 is the card ratio; the decoded file must agree with the tags.
    expect(dims).toEqual({ width: 1200, height: 630 });
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', String(dims.width));
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', String(dims.height));

    const alt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');
    expect((alt ?? '').length).toBeGreaterThan(20);

    // Exactly one of each tag, and Twitter mirrors Open Graph.
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', ogUrl as string);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  });

  test('the responsive cover is still separate from the social card', async ({ page }) => {
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    const cover = page.locator('figure.article-cover img');
    await expect(cover).toHaveCount(1);

    // The article keeps its high-resolution 16:9 WebP with a srcset …
    const info = await cover.evaluate((img: HTMLImageElement) => ({
      currentSrc: img.currentSrc,
      srcset: img.getAttribute('srcset') || '',
      width: img.getAttribute('width'),
      height: img.getAttribute('height'),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    }));
    expect(info.currentSrc).toMatch(/\.webp$/);
    expect(info.srcset).toContain('1600w');
    expect(info.srcset).toContain('800w');
    expect(info.width).toBe('1600');
    expect(info.height).toBe('900');
    // … and a density-aware intrinsic size instead of a stretched bitmap.
    expect(info.naturalWidth).toBeGreaterThan(100);
    expect(info.naturalWidth / info.naturalHeight).toBeCloseTo(16 / 9, 1);

    const ogUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(new URL(ogUrl as string).pathname).not.toBe(new URL(info.currentSrc).pathname);
  });

  test('EN, DE and FR describe their social card identically and correctly', async ({ page }) => {
    for (const article of ARTICLES) {
      await page.goto(article.path, { waitUntil: 'domcontentloaded' });
      const origin = new URL(page.url()).origin;
      const ogUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
      const ogPath = new URL(ogUrl as string).pathname;

      await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
      await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
      await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/jpeg');

      const res = await page.request.get(`${origin}${ogPath}`);
      expect(res.status(), `${article.lang} card must resolve`).toBe(200);

      // The language-specific alt text is the localised one, not a copy of EN.
      const alt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');
      expect((alt ?? '').length).toBeGreaterThan(20);
      expect(new URL(page.url()).pathname).toBe(article.path);
    }
  });

  test('canonical points at the production URL while the page is served locally', async ({ page }) => {
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${PRODUCTION}${PRIMARY.path}`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
      'href',
      `${PRODUCTION}${ARTICLES[1].path}`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href',
      `${PRODUCTION}${PRIMARY.path}`,
    );
  });

  test('the article is not published in production', async ({ request }) => {
    for (const article of ARTICLES) {
      const res = await request.get(`${PRODUCTION}${article.path}`, {
        failOnStatusCode: false,
        timeout: 25_000,
      });
      expect(res.status(), `${article.path} must not exist in production`).toBe(404);
    }
    // And the legacy post 6 URL is still the old, never-synchronised article.
    const legacy = await request.get(`${PRODUCTION}/blog/en/what-is-dmarc/`, { failOnStatusCode: false });
    expect(legacy.status()).toBe(404);
  });

  test('German and French drafts render with their own metadata', async ({ page }) => {
    for (const article of ARTICLES.slice(1)) {
      await page.goto(article.path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toHaveText(article.h1);
      await expect(page).toHaveTitle(article.seoTitle);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', article.ogTitle);
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length ?? 0).toBeGreaterThanOrEqual(130);
      expect(description?.length ?? 0).toBeLessThanOrEqual(155);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        'href',
        `${PRODUCTION}${PRIMARY.path}`,
      );
      await expect(page.locator('figure.article-cover img')).toHaveCount(1);
      await expect(page.locator('.article-body pre code')).toHaveCount(5);
    }
  });

  test('captures screenshots at the four required viewports', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440x900', 'captured once, from the desktop project');
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(PRIMARY.path, { waitUntil: 'networkidle' });

      const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(docWidth, `horizontal overflow at ${viewport.name}`).toBeLessThanOrEqual(viewport.width + 1);

      const target = path.join(SCREENSHOT_DIR, `article6-en-${viewport.name}.png`);
      await page.screenshot({ path: target, fullPage: true });
      expect(fs.statSync(target).size).toBeGreaterThan(10_000);
    }

    // DE and FR: desktop and mobile, the two viewports that differ most.
    for (const article of ARTICLES.slice(1)) {
      for (const viewport of [VIEWPORTS[0], VIEWPORTS[3]]) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(article.path, { waitUntil: 'networkidle' });
        const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(docWidth, `horizontal overflow at ${article.lang} ${viewport.name}`).toBeLessThanOrEqual(viewport.width + 1);
        const target = path.join(SCREENSHOT_DIR, `article6-${article.lang}-${viewport.name}.png`);
        await page.screenshot({ path: target, fullPage: true });
        expect(fs.statSync(target).size).toBeGreaterThan(10_000);
      }
    }

    // The social card itself, saved for review.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(PRIMARY.path, { waitUntil: 'domcontentloaded' });
    const ogUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
    const ogRes = await page.request.get(`${new URL(page.url()).origin}${new URL(ogUrl as string).pathname}`);
    const ogFile = path.join(SCREENSHOT_DIR, 'og-card-1200x630.jpg');
    fs.writeFileSync(ogFile, await ogRes.body());
    expect(fs.statSync(ogFile).size).toBeGreaterThan(5_000);

    // The fallback card used when an article has no image at all.
    const fallback = await page.request.get(`${new URL(page.url()).origin}/og-image.png`);
    expect(fallback.status()).toBe(200);
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'og-fallback-1200x630.png'), await fallback.body());
  });
});
