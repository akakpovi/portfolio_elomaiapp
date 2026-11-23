/**
 * Open Graph / Twitter card metadata tests.
 *
 * The defect these tests exist for: pageShell() hard-coded og:image:width=1200
 * and og:image:height=630 for every page, while the actual image was the
 * article's 1600×900 cover. Social crawlers were told a ratio the file does not
 * have, and og:image:type was missing entirely.
 *
 * The rule now: dimensions are emitted only when they were supplied with the
 * image, and they describe that image. A caller that does not know them gets no
 * dimensions rather than invented ones.
 *
 *   node test/og-meta-test.mjs
 *
 * Exits 1 on failure.
 */
import assert from 'node:assert/strict';

import { pageShell, resolveOgImage, PUBLIC_BASE } from '../lib/templates.mjs';

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, detail: String(error.message).split('\n')[0] });
  }
}

function shell(overrides = {}) {
  return pageShell({
    lang: 'en',
    title: 'Test article title',
    description: 'Test description',
    canonical: `${PUBLIC_BASE}/blog/en/test-article/`,
    alternates: [{ hreflang: 'en', href: `${PUBLIC_BASE}/blog/en/test-article/` }],
    ogImage: { url: '/media/abc.webp', width: 1600, height: 900 },
    ogType: 'article',
    jsonLd: [],
    bodyClass: 'page-article',
    content: '<article></article>',
    siteId: '1',
    ...overrides,
  });
}

const count = (html, needle) => html.split(needle).length - 1;
const metaContent = (html, attr, key) => {
  const match = html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`));
  return match ? match[1] : null;
};

/* ------------------------------------------------------- 1. fallback card */

check('missing image resolves to the static card', () => {
  const og = resolveOgImage(undefined, 'Alt text');
  assert.equal(og.url, `${PUBLIC_BASE}/og-image.png`);
  assert.equal(og.width, 1200);
  assert.equal(og.height, 630);
  assert.equal(og.type, 'image/png');
  assert.equal(og.alt, 'Alt text');
});

check('a page with no image still emits a complete card', () => {
  const html = shell({ ogImage: null });
  assert.equal(metaContent(html, 'property', 'og:image'), `${PUBLIC_BASE}/og-image.png`);
  assert.equal(metaContent(html, 'property', 'og:image:width'), '1200');
  assert.equal(metaContent(html, 'property', 'og:image:height'), '630');
  assert.equal(metaContent(html, 'property', 'og:image:type'), 'image/png');
});

/* ------------------------------------------------ 2. dimensions are data */

check('supplied dimensions are emitted verbatim', () => {
  const html = shell({ ogImage: { url: '/media/card.jpg', width: 1200, height: 630, type: 'image/jpeg' } });
  assert.equal(metaContent(html, 'property', 'og:image:width'), '1200');
  assert.equal(metaContent(html, 'property', 'og:image:height'), '630');
  assert.equal(metaContent(html, 'property', 'og:image:type'), 'image/jpeg');
});

check('a 1600×900 cover is not advertised as 1200×630', () => {
  const html = shell({ ogImage: { url: '/media/cover.webp', width: 1600, height: 900 } });
  assert.equal(metaContent(html, 'property', 'og:image:width'), '1600');
  assert.equal(metaContent(html, 'property', 'og:image:height'), '900');
  assert.equal(metaContent(html, 'property', 'og:image:type'), 'image/webp');
});

check('unknown dimensions produce no dimension tags at all', () => {
  const html = shell({ ogImage: { url: 'https://cdn.example.com/x.png' } });
  assert.equal(metaContent(html, 'property', 'og:image'), 'https://cdn.example.com/x.png');
  assert.equal(metaContent(html, 'property', 'og:image:width'), null);
  assert.equal(metaContent(html, 'property', 'og:image:height'), null);
  assert.equal(metaContent(html, 'property', 'og:image:type'), 'image/png');
});

check('a string path carries no invented dimensions', () => {
  const og = resolveOgImage('/media/cover.webp');
  assert.equal(og.url, `${PUBLIC_BASE}/media/cover.webp`);
  assert.equal(og.width, 0);
  assert.equal(og.height, 0);
});

check('nonsense dimensions are dropped, not echoed', () => {
  const og = resolveOgImage({ url: '/media/x.webp', width: -5, height: 'abc' });
  assert.equal(og.width, 0);
  assert.equal(og.height, 0);
});

/* ------------------------------------------------------------- 3. typing */

check('mime type falls back to the file extension', () => {
  assert.equal(resolveOgImage({ url: '/media/a.jpg' }).type, 'image/jpeg');
  assert.equal(resolveOgImage({ url: '/media/a.jpeg' }).type, 'image/jpeg');
  assert.equal(resolveOgImage({ url: '/media/a.avif' }).type, 'image/avif');
});

check('an unsupported explicit mime type is ignored', () => {
  const og = resolveOgImage({ url: '/media/a.webp', type: 'text/html' });
  assert.equal(og.type, 'image/webp');
});

check('types survive a query string on the URL', () => {
  assert.equal(resolveOgImage({ url: '/media/a.png?v=2' }).type, 'image/png');
});

/* ------------------------------------------------------ 4. URL integrity */

check('relative paths become absolute production URLs', () => {
  assert.equal(resolveOgImage({ url: '/media/a.webp' }).url, `${PUBLIC_BASE}/media/a.webp`);
  assert.equal(resolveOgImage({ url: 'media/a.webp' }).url, `${PUBLIC_BASE}/media/a.webp`);
});

check('protocol-relative URLs are upgraded, not left dangling', () => {
  assert.equal(resolveOgImage({ url: '//cdn.example.com/a.png' }).url, 'https://cdn.example.com/a.png');
});

check('absolute URLs are preserved untouched', () => {
  const url = 'https://elomaiapp.com/media/a.webp';
  assert.equal(resolveOgImage({ url }).url, url);
});

/* --------------------------------------------------------- 5. no doubles */

check('exactly one og:image and one twitter:image', () => {
  const html = shell();
  assert.equal(count(html, 'property="og:image"'), 1);
  assert.equal(count(html, 'name="twitter:image"'), 1);
  assert.equal(count(html, 'property="og:image:width"'), 1);
});

check('twitter:image always equals og:image', () => {
  const html = shell({ ogImage: { url: '/media/card.jpg', width: 1200, height: 630 } });
  assert.equal(metaContent(html, 'name', 'twitter:image'), metaContent(html, 'property', 'og:image'));
  assert.equal(metaContent(html, 'name', 'twitter:card'), 'summary_large_image');
});

check('og:image:alt is always present', () => {
  const html = shell({ ogImage: { url: '/media/card.jpg', width: 1200, height: 630, alt: 'A card' } });
  assert.equal(metaContent(html, 'property', 'og:image:alt'), 'A card');
  assert.equal(metaContent(html, 'name', 'twitter:image:alt'), 'A card');
});

check('image URLs are escaped into the attribute', () => {
  const html = shell({ ogImage: { url: '/media/a.webp?x="><script>alert(1)</script>' } });
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&quot;'));
});

/* ---------------------------------------------------- 6. canonical intact */

check('canonical and hreflang are unaffected by the image change', () => {
  const html = shell();
  assert.ok(html.includes('<link rel="canonical" href="https://elomaiapp.com/blog/en/test-article/"'));
  assert.ok(html.includes('hreflang="en" href="https://elomaiapp.com/blog/en/test-article/"'));
});

/* ------------------------------------------------------------ reporting */

for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.ok ? '' : ` — ${result.detail}`}`);
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exit(1);
