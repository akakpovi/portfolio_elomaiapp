import { test, expect, type Page } from '@playwright/test';

/**
 * M11 — multilingual blog routing in a real browser.
 *
 * Runs against any origin that serves the pre-rendered blog, so the same spec
 * covers a local fixture and production:
 *
 *   BLOG_BASE=https://elomaiapp.com npx playwright test e2e/blog-multilingual.spec.ts
 *
 * The spec is skipped when BLOG_BASE is not set, so the default portfolio suite
 * (which targets the Vite preview on :5180) is unaffected.
 */
const BLOG_BASE = (process.env.BLOG_BASE || '').replace(/\/$/, '');
const LANGS = ['en', 'de', 'fr'] as const;

type FeedArticle = {
  lang: string;
  slug: string;
  title: string;
  url: string;
  translations: { lang: string; slug: string }[];
  translationStates: Record<string, string>;
};

test.skip(!BLOG_BASE, 'BLOG_BASE not set — production/fixture blog not addressed');

async function feed(page: Page): Promise<FeedArticle[]> {
  const response = await page.request.get(`${BLOG_BASE}/content/blog-index.json`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.articles as FeedArticle[];
}

async function hub(page: Page, lang: string) {
  // English lives at /blog/ and is also reachable at /blog/en/.
  const paths = lang === 'en' ? ['/blog/', '/blog/en/'] : [`/blog/${lang}/`];
  for (const path of paths) {
    const response = await page.goto(`${BLOG_BASE}${path}`);
    expect(response?.status(), `${path} status`).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  }
}

test.describe('language hubs', () => {
  for (const lang of LANGS) {
    test(`${lang.toUpperCase()} hub lists only ${lang.toUpperCase()} articles`, async ({ page }) => {
      const articles = await feed(page);
      await hub(page, lang);

      const cards = page.locator('.post-card');
      const count = await cards.count();
      const expected = articles.filter((a) => a.lang === lang).length;

      if (expected === 0) {
        await expect(page.locator('.empty-state')).toBeVisible();
        expect(count).toBe(0);
        // An empty hub must never borrow another language's article.
        for (const other of articles) {
          await expect(page.locator(`a[href="${other.url}"]`)).toHaveCount(0);
        }
        return;
      }

      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i += 1) {
        await expect(cards.nth(i)).toHaveAttribute('data-lang', lang);
      }

      // Every card link stays inside this language prefix.
      const hrefs = await page.locator('.post-card h3 a').evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLAnchorElement).getAttribute('href') || ''),
      );
      for (const href of hrefs) {
        expect(href.startsWith(lang === 'en' ? '/blog/en/' : `/blog/${lang}/`)).toBeTruthy();
      }
    });
  }

  test('language tabs preserve the selected hub', async ({ page }) => {
    await page.goto(`${BLOG_BASE}/blog/de/`);
    const tabs = page.locator('.lang-tabs a');
    await expect(tabs).toHaveCount(3);
    await expect(page.locator('.lang-tabs a[aria-current="true"]')).toHaveText('DE');

    await page.locator('.lang-tabs a', { hasText: 'FR' }).click();
    await expect(page).toHaveURL(/\/blog\/fr\/$/);
    await expect(page.locator('.lang-tabs a[aria-current="true"]')).toHaveText('FR');
  });

  test('search and pagination stay inside the language', async ({ page }) => {
    const articles = await feed(page);
    const german = articles.filter((a) => a.lang === 'de');
    test.skip(german.length < 2, 'needs at least two German articles');

    await page.goto(`${BLOG_BASE}/blog/de/`);
    const search = page.locator('#blog-search');
    await search.fill(german[0].title.slice(0, 12).toLowerCase());

    const visible = page.locator('.post-card:visible');
    const count = await visible.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(visible.nth(i)).toHaveAttribute('data-lang', 'de');
    }
  });
});

test.describe('article language switching', () => {
  test('switching to a published translation opens that article', async ({ page }) => {
    const articles = await feed(page);
    const source = articles.find((a) => a.translations.length > 0);
    test.skip(!source, 'no translated article in the feed');

    const target = source!.translations[0];
    await page.goto(`${BLOG_BASE}${source!.url}`);
    await expect(page.locator('.lang-panel')).toBeVisible();

    // The panel offers the translation as a real link, and the header switcher
    // points at the same URL.
    const panelLink = page.locator(`.lang-panel li[data-state="available"][lang="${target.lang}"] a`).first();
    await expect(panelLink).toHaveAttribute('href', `/blog/${target.lang}/${target.slug}/`);
    await expect(page.locator(`.lang-switch a[lang="${target.lang}"]`)).toHaveAttribute(
      'href',
      `/blog/${target.lang}/${target.slug}/`,
    );

    await panelLink.click();
    await expect(page).toHaveURL(new RegExp(`/blog/${target.lang}/${target.slug}/$`));
    await expect(page.locator('.article-meta .lang-badge')).toHaveText(target.lang.toUpperCase());
    await expect(page.locator('.lang-panel li[data-state="current"]')).toHaveAttribute('lang', target.lang);
  });

  test('a missing translation is stated, never faked', async ({ page }) => {
    const articles = await feed(page);
    // Prefer an article with no siblings at all: every other language is then
    // genuinely missing (not merely in preparation).
    const source =
      articles.find((a) => Object.keys(a.translationStates || {}).length === 0) ||
      articles.find((a) => Object.values(a.translationStates || {}).includes('missing'));
    test.skip(!source, 'no article with a missing translation');

    await page.goto(`${BLOG_BASE}${source!.url}`);
    const missing = page.locator('.lang-panel li[data-state="missing"]');
    test.skip((await missing.count()) === 0, 'this article has no missing translation state');

    const entry = missing.first();
    await expect(entry.locator('.lang-state')).toBeVisible();
    await expect(entry.locator('a.lang-hub-link')).toHaveAttribute('href', /\/blog\/(de|fr)\/$/);
    // No article link is offered for the missing language.
    await expect(entry.locator('a:not(.lang-hub-link)')).toHaveCount(0);
    expect(await page.locator('.lang-switch a[data-state="missing"]').count()).toBeGreaterThanOrEqual(1);
  });

  test('canonical and hreflang only point at live pages', async ({ page }) => {
    const articles = await feed(page);
    const source = articles[0];
    test.skip(!source, 'empty blog');

    await page.goto(`${BLOG_BASE}${source.url}`);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`https://elomaiapp.com${source.url}`);

    const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((nodes) =>
      nodes.map((node) => ({
        hreflang: node.getAttribute('hreflang') || '',
        href: node.getAttribute('href') || '',
      })),
    );
    expect(alternates.length).toBeGreaterThan(0);
    for (const alternate of alternates) {
      // Canonical hrefs are absolute production URLs; resolve them against the
      // origin under test so a local fixture is checked too.
      const url = alternate.href.replace('https://elomaiapp.com', BLOG_BASE);
      const response = await page.request.get(url, { maxRedirects: 0 });
      expect(response.status(), `${alternate.hreflang} → ${alternate.href}`).toBe(200);
    }

    const xDefault = alternates.find((a) => a.hreflang === 'x-default');
    expect(xDefault, 'x-default alternate').toBeTruthy();
    expect(xDefault!.href.endsWith(source.url) || xDefault!.href.includes('/blog/en/')).toBeTruthy();
  });
});
