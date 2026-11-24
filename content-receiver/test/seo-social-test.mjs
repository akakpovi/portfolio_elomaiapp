/**
 * M09 final — social metadata and language-navigation tests.
 *
 * Three defects these tests exist for:
 *
 *  1. `twitter:title` was emitted from the SEO title while `og:title` used the
 *     dedicated social title. A page whose social copy differs from its search
 *     copy therefore sent one title to Facebook, LinkedIn and Slack and another
 *     to X. Both tags now share one precedence:
 *     dedicated og_title → SEO title → site name.
 *
 *  2. Listing pages advertised `hreflang` alternates and a language tab for
 *     every supported language, including languages with no published article.
 *     Those links resolved to 404s (`/blog/de/`, `/blog/fr/`) and the header
 *     switcher offered the same dead targets. They now follow the languages that
 *     actually have published content.
 *
 *  3. Category labels were rendered verbatim from WordPress, which is English
 *     for every article of the M09 series, even on German and French pages.
 *     Labels are now localised per page language while the category slug — and
 *     therefore the route — stays shared.
 *
 *   node test/seo-social-test.mjs
 *
 * Exits 1 on failure.
 */
import assert from 'node:assert/strict';

import {
  pageShell,
  setAvailableLangs,
  getAvailableLangs,
  setAssetVersion,
  getAssetVersion,
  categoryLabel,
  PUBLIC_BASE,
  SITE_NAME,
} from '../lib/templates.mjs';
import { listingPage, card } from '../lib/pages.mjs';

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, detail: String(error.message).split('\n')[0] });
  }
}

const SEO = 'SPF, DKIM and DMARC, monitored — EL0M AI ENGINEER';
const SOCIAL = 'SPF, DKIM and DMARC: email authentication you can monitor';

function shell(overrides = {}) {
  return pageShell({
    lang: 'en',
    title: SEO,
    description: 'DMARC fails when SPF and DKIM pass without aligning.',
    canonical: `${PUBLIC_BASE}/blog/en/spf-dkim-dmarc-monitoring/`,
    alternates: [{ hreflang: 'en', href: `${PUBLIC_BASE}/blog/en/spf-dkim-dmarc-monitoring/` }],
    ogImage: { url: '/media/card.jpg', width: 1200, height: 630, type: 'image/jpeg', alt: 'A card' },
    ogType: 'article',
    jsonLd: [],
    bodyClass: 'page-article',
    content: '<article></article>',
    siteId: '1',
    ...overrides,
  });
}

const CATEGORIES = [
  { slug: 'cybersecurity-monitoring', name: 'Cybersecurity & Monitoring', count: 1 },
  { slug: 'grundlagen', name: 'Grundlagen', count: 1 },
];

function article(overrides = {}) {
  return {
    uuid: '2a9a15ad-5a0e-4667-9a27-1c56919503f7',
    slug: 'spf-dkim-dmarc-monitoring',
    lang: 'en',
    title: 'SPF, DKIM and DMARC: email authentication you can monitor',
    excerpt: 'DMARC fails when SPF and DKIM pass without aligning.',
    status: 'publish',
    publishedAt: '2026-11-23T13:38:49.000Z',
    modifiedAt: '2026-11-23T13:38:49.000Z',
    readingMinutes: 9,
    featured: { src: '/media/card.webp', alt: 'A card', width: 1200, height: 630 },
    categories: [{ slug: 'cybersecurity-monitoring', name: 'Cybersecurity & Monitoring' }],
    ...overrides,
  };
}

function listing(lang, articles, extra = {}) {
  return listingPage({ lang, articles, categories: CATEGORIES, siteId: '1', ...extra });
}

const count = (html, needle) => html.split(needle).length - 1;

const metaContent = (html, attr, key) => {
  const match = html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`));
  return match ? match[1] : null;
};

function decode(value) {
  return String(value)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/* ------------------------------------------- twitter:title shares og:title */

check('twitter:title uses the dedicated social title', () => {
  const html = shell({ ogTitle: SOCIAL });
  assert.equal(decode(metaContent(html, 'name', 'twitter:title')), SOCIAL);
  assert.equal(metaContent(html, 'name', 'twitter:title'), metaContent(html, 'property', 'og:title'));
});

check('twitter:title falls back to the SEO title', () => {
  const html = shell();
  assert.equal(decode(metaContent(html, 'name', 'twitter:title')), SEO);
});

check('twitter:title falls back to the site name for unusable values', () => {
  const html = shell({ title: '', ogTitle: '   ' });
  assert.equal(metaContent(html, 'name', 'twitter:title'), SITE_NAME);
});

check('a non-string og_title is ignored', () => {
  const html = shell({ ogTitle: 42 });
  assert.equal(decode(metaContent(html, 'name', 'twitter:title')), SEO);
});

check('control characters and newlines are collapsed in both titles', () => {
  const html = shell({ ogTitle: 'Line one\n\tline\u0007  two' });
  const value = decode(metaContent(html, 'name', 'twitter:title'));
  assert.equal(value, 'Line one line two');
  assert.ok(!/[\u0000-\u001f\u007f]/.test(value));
});

check('exactly one og:title and one twitter:title are emitted', () => {
  const html = shell({ ogTitle: SOCIAL });
  assert.equal(count(html, 'property="og:title"'), 1);
  assert.equal(count(html, 'name="twitter:title"'), 1);
});

check('social titles are escaped, never injected', () => {
  const hostile = 'AT&T <script>alert("x")</script> "quoted"';
  const html = shell({ ogTitle: hostile, title: hostile });
  assert.ok(!html.includes('<script>alert'));
  assert.ok(!html.includes('AT&T <'));
  assert.equal(decode(metaContent(html, 'name', 'twitter:title')), hostile);
  assert.equal(decode(metaContent(html, 'property', 'og:title')), hostile);
  assert.ok(html.includes('AT&amp;T'));
});

check('Unicode survives unchanged', () => {
  const latin = 'SPF, DKIM et DMARC : surveiller — « authentification » · Größenwahn';
  const html = shell({ ogTitle: latin, lang: 'fr' });
  assert.equal(metaContent(html, 'name', 'twitter:title'), latin);
  assert.equal(metaContent(html, 'property', 'og:title'), latin);
});

check('the document title stays the SEO title', () => {
  const html = shell({ ogTitle: SOCIAL });
  assert.ok(html.includes(`<title>${SEO}</title>`));
  assert.ok(!html.includes(`<title>${SOCIAL}</title>`));
});

check('twitter description and image mirror their Open Graph twins', () => {
  const html = shell({ ogTitle: SOCIAL });
  assert.equal(metaContent(html, 'name', 'twitter:description'), metaContent(html, 'property', 'og:description'));
  assert.equal(metaContent(html, 'name', 'twitter:image'), metaContent(html, 'property', 'og:image'));
  assert.equal(metaContent(html, 'name', 'twitter:image:alt'), metaContent(html, 'property', 'og:image:alt'));
});

/* --------------------------------------------- language navigation integrity */

check('an English-only blog advertises no German or French hub', () => {
  setAvailableLangs(['en']);
  const html = listing('en', [article()]);
  assert.ok(!html.includes(`${PUBLIC_BASE}/blog/de/`));
  assert.ok(!html.includes(`${PUBLIC_BASE}/blog/fr/`));
  // The header switcher also carries hreflang, so alternates are counted by tag.
  assert.equal(count(html, 'rel="alternate" hreflang="de"'), 0);
  assert.equal(count(html, 'rel="alternate" hreflang="fr"'), 0);
  assert.equal(count(html, 'rel="alternate" hreflang="en"'), 1);
});

check('x-default always points at the English hub', () => {
  setAvailableLangs(['en']);
  const html = listing('en', [article()]);
  assert.equal(count(html, 'hreflang="x-default"'), 1);
  assert.ok(html.includes(`hreflang="x-default" href="${PUBLIC_BASE}/blog/"`));
});

// M11: all three language hubs are rendered (an empty one is noindexed), so
// the tabs and the header switcher may offer all three. What must stay
// restricted to genuinely published languages is the hreflang alternate graph,
// which is asserted separately above.
check('language tabs offer every reachable language hub', () => {
  setAvailableLangs(['en']);
  const html = listing('en', [article()]);
  const tabs = html.slice(html.indexOf('<div class="lang-tabs"'), html.indexOf('</div>', html.indexOf('<div class="lang-tabs"')));
  assert.ok(tabs.includes('>EN</a>'));
  assert.ok(tabs.includes('>DE</a>'));
  assert.ok(tabs.includes('>FR</a>'));
});

check('the header switcher offers the same hubs', () => {
  setAvailableLangs(['en']);
  const html = listing('en', [article()]);
  const switcher = html.slice(html.indexOf('<div class="lang-switch"'), html.indexOf('</div>', html.indexOf('<div class="lang-switch"')));
  assert.ok(switcher.includes('>EN</a>'));
  assert.ok(switcher.includes('>DE</a>'));
  assert.ok(switcher.includes('>FR</a>'));
});

check('a second published language adds exactly one alternate', () => {
  setAvailableLangs(['en', 'de']);
  const de = article({ lang: 'de', slug: 'spf-dkim-dmarc-ueberwachen' });
  const html = listing('de', [de]);
  assert.equal(count(html, 'rel="alternate" hreflang="de"'), 1);
  assert.equal(count(html, 'rel="alternate" hreflang="en"'), 1);
  assert.equal(count(html, 'rel="alternate" hreflang="fr"'), 0);
  assert.deepEqual(getAvailableLangs(), ['en', 'de']);
  setAvailableLangs(['en']);
});

check('the canonical URL and og:url agree on a listing', () => {
  setAvailableLangs(['en']);
  const html = listing('en', [article()]);
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)[1];
  assert.equal(canonical, `${PUBLIC_BASE}/blog/`);
  assert.equal(metaContent(html, 'property', 'og:url'), canonical);
});

check('exactly one social title block on a listing', () => {
  setAvailableLangs(['en']);
  const html = listing('en', [article()]);
  assert.equal(count(html, 'property="og:title"'), 1);
  assert.equal(count(html, 'name="twitter:title"'), 1);
});

/* ------------------------------------------------------- category labels */

check('a German listing localises the label but keeps the shared slug', () => {
  setAvailableLangs(['en', 'de']);
  const de = article({ lang: 'de', slug: 'spf-dkim-dmarc-ueberwachen' });
  const html = listing('de', [de]);
  assert.ok(html.includes('Cybersicherheit &amp; Monitoring'));
  assert.ok(html.includes('/blog/de/category/cybersecurity-monitoring/'));
  setAvailableLangs(['en']);
});

check('an English listing keeps the WordPress label', () => {
  setAvailableLangs(['en']);
  const html = listing('en', [article()]);
  assert.ok(html.includes('Cybersecurity &amp; Monitoring'));
});

check('a French listing localises the label', () => {
  setAvailableLangs(['en', 'fr']);
  const fr = article({ lang: 'fr', slug: 'spf-dkim-dmarc-surveiller' });
  const html = listing('fr', [fr]);
  assert.ok(html.includes('Cybersécurité et supervision'));
  setAvailableLangs(['en']);
});

check('an unknown category term falls back to the WordPress name', () => {
  setAvailableLangs(['en', 'de']);
  const de = article({
    lang: 'de',
    slug: 'spf-dkim-dmarc-ueberwachen',
    categories: [{ slug: 'grundlagen', name: 'Grundlagen' }],
  });
  const html = listing('de', [de]);
  assert.ok(html.includes('Grundlagen'));
  setAvailableLangs(['en']);
});

check('the card kicker follows the article language, not the page language', () => {
  const de = article({
    lang: 'de',
    slug: 'spf-dkim-dmarc-ueberwachen',
    categories: [{ slug: 'security-automation', name: 'Security Automation' }],
  });
  const html = card(de, 'en');
  assert.ok(html.includes('Sicherheitsautomatisierung'));
  assert.ok(html.includes('/blog/de/category/security-automation/'));
});

check('categoryLabel keeps a usable fallback and never throws', () => {
  assert.equal(categoryLabel('devops-cloud-infrastructure', 'DevOps & Cloud Infrastructure', 'fr'), 'DevOps et infrastructure cloud');
  assert.equal(categoryLabel('nope', 'Custom term', 'de'), 'Custom term');
  assert.equal(categoryLabel('nope', '', 'de'), 'nope');
  assert.equal(categoryLabel(undefined, undefined, 'en'), '');
});

/* ------------------------------------------------------- asset versioning */

check('blog assets carry a content version, so a CDN cannot serve a stale one', () => {
  setAssetVersion('abc123def456');
  const html = shell();
  assert.ok(html.includes('href="/blog/assets/blog.css?v=abc123def456"'));
  assert.ok(html.includes('src="/blog/assets/blog.js?v=abc123def456"'));
  assert.equal(getAssetVersion(), 'abc123def456');
});

check('the version is sanitised to a hash-shaped token', () => {
  setAssetVersion('<script>alert(1)</script>');
  assert.equal(getAssetVersion(), 'scriptalert1');
  assert.ok(!shell().includes('<script>alert'));
  setAssetVersion('');
});

check('without a version the asset URLs stay plain', () => {
  setAssetVersion('');
  const html = shell();
  assert.ok(html.includes('href="/blog/assets/blog.css"'));
  assert.ok(html.includes('src="/blog/assets/blog.js"'));
});

/* ------------------------------------------------------------------ report */

setAvailableLangs(['en']);

const failed = results.filter((r) => !r.ok);
for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.ok ? '' : `\n      ${result.detail}`}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
