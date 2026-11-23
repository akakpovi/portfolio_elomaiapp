/**
 * M09.1.4 — Open Graph title tests.
 *
 * The defect these tests exist for: WordPress stores a dedicated Open Graph
 * title (`_elomai_seo.og_title` → payload `seo.ogTitle` → stored
 * `article.seo.ogTitle`), the receiver normalised it correctly, and then
 * pageShell() emitted `og:title` from the SEO title anyway. The stored social
 * title was dead data, and a page whose social copy differs from its search
 * copy advertised the search copy to every social crawler.
 *
 * The rule now: dedicated og_title → SEO title → site name. Everything is
 * escaped once, exactly one og:title is emitted, and the document title stays
 * the SEO title.
 *
 * These tests exercise the complete rendered document, not an internal helper.
 *
 *   node test/og-title-test.mjs
 *
 * Exits 1 on failure.
 */
import assert from 'node:assert/strict';

import { pageShell, ogTitleFor, PUBLIC_BASE } from '../lib/templates.mjs';
import { articlePage } from '../lib/pages.mjs';

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

/* ------------------------------------------------------------- helpers */

function shell(overrides = {}) {
  return pageShell({
    lang: 'en',
    title: SEO,
    description: 'DMARC fails when SPF and DKIM pass without aligning.',
    canonical: `${PUBLIC_BASE}/blog/en/spf-dkim-dmarc-monitoring/`,
    alternates: [
      { hreflang: 'en', href: `${PUBLIC_BASE}/blog/en/spf-dkim-dmarc-monitoring/` },
      { hreflang: 'de', href: `${PUBLIC_BASE}/blog/de/spf-dkim-dmarc-ueberwachen/` },
      { hreflang: 'x-default', href: `${PUBLIC_BASE}/blog/en/spf-dkim-dmarc-monitoring/` },
    ],
    ogImage: { url: '/media/card.jpg', width: 1200, height: 630, type: 'image/jpeg', alt: 'A social card' },
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

const documentTitle = (html) => {
  const match = html.match(/<title>([^<]*)<\/title>/);
  return match ? match[1] : null;
};

/** Decodes the five entities e() produces, so output can be compared to input. */
function decode(value) {
  return String(value)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function article(overrides = {}) {
  return {
    uuid: '2a9a15ad-5a0e-4667-9a27-1c56919503f7',
    wpId: 29,
    version: 1,
    lang: 'en',
    slug: 'spf-dkim-dmarc-monitoring',
    status: 'publish',
    title: 'SPF, DKIM and DMARC: email authentication you can monitor',
    subtitle: '',
    excerpt: 'DMARC fails when SPF and DKIM pass without aligning.',
    html: '<p>Body text that is long enough to render something meaningful.</p>',
    toc: [],
    featured: null,
    author: { name: 'Elom Akakpovi', url: `${PUBLIC_BASE}/` },
    publishedAt: '2026-11-20T09:00:00.000Z',
    modifiedAt: '2026-11-22T09:00:00.000Z',
    categories: [{ slug: 'security', name: 'Security' }],
    tags: [],
    seo: { title: SEO, description: 'DMARC fails when SPF and DKIM pass without aligning.' },
    translations: [],
    commentsEnabled: true,
    relatedProjects: [],
    readingMinutes: 9,
    wordCount: 1200,
    ...overrides,
  };
}

/* ------------------------------------------- 1. dedicated title wins */

check('a valid og_title is used verbatim', () => {
  const html = shell({ ogTitle: SOCIAL });
  assert.equal(metaContent(html, 'property', 'og:title'), SOCIAL);
});

check('the document title still carries the SEO title', () => {
  const html = shell({ ogTitle: SOCIAL });
  assert.equal(documentTitle(html), SEO);
});

check('exactly one og:title is emitted', () => {
  const html = shell({ ogTitle: SOCIAL });
  assert.equal(count(html, 'property="og:title"'), 1);
  assert.equal(count(html, 'og:title'), 1);
});

check('a dedicated title does not disturb the rest of the head', () => {
  const html = shell({ ogTitle: SOCIAL });
  assert.equal(metaContent(html, 'property', 'og:type'), 'article');
  assert.equal(metaContent(html, 'property', 'og:url'), `${PUBLIC_BASE}/blog/en/spf-dkim-dmarc-monitoring/`);
  assert.equal(metaContent(html, 'property', 'og:description'), 'DMARC fails when SPF and DKIM pass without aligning.');
  assert.equal(metaContent(html, 'name', 'description'), 'DMARC fails when SPF and DKIM pass without aligning.');
  assert.equal(metaContent(html, 'property', 'og:image'), `${PUBLIC_BASE}/media/card.jpg`);
  assert.equal(metaContent(html, 'property', 'og:image:width'), '1200');
  assert.equal(metaContent(html, 'property', 'og:image:height'), '630');
  assert.equal(metaContent(html, 'property', 'og:image:type'), 'image/jpeg');
  assert.equal(metaContent(html, 'property', 'og:image:alt'), 'A social card');
  assert.equal(metaContent(html, 'name', 'twitter:card'), 'summary_large_image');
});

check('canonical and hreflang are untouched', () => {
  const html = shell({ ogTitle: SOCIAL });
  assert.ok(html.includes(`<link rel="canonical" href="${PUBLIC_BASE}/blog/en/spf-dkim-dmarc-monitoring/"`));
  assert.ok(html.includes(`hreflang="de" href="${PUBLIC_BASE}/blog/de/spf-dkim-dmarc-ueberwachen/"`));
  assert.ok(html.includes(`hreflang="x-default" href="${PUBLIC_BASE}/blog/en/spf-dkim-dmarc-monitoring/"`));
  assert.equal(count(html, 'rel="canonical"'), 1);
});

/* ------------------------------------------------------ 2. fallbacks */

check('a missing og_title falls back to the SEO title', () => {
  assert.equal(metaContent(shell({ ogTitle: undefined }), 'property', 'og:title'), SEO);
  assert.equal(metaContent(shell(), 'property', 'og:title'), SEO);
});

check('a null og_title falls back to the SEO title', () => {
  assert.equal(metaContent(shell({ ogTitle: null }), 'property', 'og:title'), SEO);
});

check('an empty og_title falls back to the SEO title', () => {
  assert.equal(metaContent(shell({ ogTitle: '' }), 'property', 'og:title'), SEO);
});

check('a whitespace-only og_title falls back to the SEO title', () => {
  for (const value of [' ', '   ', '\t', '\n', '  \t \n ', '\u00a0']) {
    assert.equal(metaContent(shell({ ogTitle: value }), 'property', 'og:title'), SEO, `value ${JSON.stringify(value)}`);
  }
});

check('a non-string og_title falls back to the SEO title', () => {
  for (const value of [42, true, {}, [], () => 'x']) {
    assert.equal(metaContent(shell({ ogTitle: value }), 'property', 'og:title'), SEO);
  }
});

check('with neither title the site name is used, not an empty attribute', () => {
  const html = shell({ ogTitle: '', title: '' });
  assert.equal(metaContent(html, 'property', 'og:title'), 'EL0M AI ENGINEER');
  assert.equal(count(html, 'property="og:title"'), 1);
});

check('with both values whitespace only the site name is used', () => {
  assert.equal(metaContent(shell({ ogTitle: '  ', title: '\n\t' }), 'property', 'og:title'), 'EL0M AI ENGINEER');
});

/* --------------------------------------------- 3. characters and safety */

check('surrounding whitespace is trimmed from the emitted title', () => {
  assert.equal(metaContent(shell({ ogTitle: `  ${SOCIAL}  ` }), 'property', 'og:title'), SOCIAL);
});

check('Unicode is preserved unchanged', () => {
  const samples = [
    'SPF, DKIM und DMARC: E-Mail-Authentifizierung überwachen',
    "SPF, DKIM et DMARC : surveiller l'authentification e-mail",
    'Straße, Größe und „Anführungszeichen“ — ein Test',
    '日本語のタイトル：メール認証を監視する',
    'Emlékeztető: ő és ű betűk – működik',
    'Monitoring e-mail ✅ en producción',
  ];
  for (const value of samples) {
    const html = shell({ ogTitle: value });
    assert.equal(decode(metaContent(html, 'property', 'og:title')), value, `value ${value}`);
  }
});

check('HTML special characters are escaped once', () => {
  const html = shell({ ogTitle: 'SPF < DKIM & DMARC > "policy"' });
  const raw = metaContent(html, 'property', 'og:title');
  assert.equal(raw, 'SPF &lt; DKIM &amp; DMARC &gt; &quot;policy&quot;');
  assert.equal(decode(raw), 'SPF < DKIM & DMARC > "policy"');
  assert.ok(!html.includes('<meta property="og:title" content="SPF <'));
  assert.ok(!html.includes('&amp;lt;'));
});

check('double quotes cannot break out of the content attribute', () => {
  const html = shell({ ogTitle: 'He said "hello" and left' });
  assert.equal(metaContent(html, 'property', 'og:title'), 'He said &quot;hello&quot; and left');
  assert.equal(count(html, 'property="og:title"'), 1);
});

check('an attribute-injection attempt stays inside the content value', () => {
  const html = shell({ ogTitle: '" onload="alert(1)" data-x="' });
  const raw = metaContent(html, 'property', 'og:title');
  assert.equal(decode(raw), '" onload="alert(1)" data-x="');
  // The whole tag must be exactly one meta element with one content attribute.
  const tag = html.match(/<meta property="og:title"[^>]*>/)[0];
  assert.equal(tag, `<meta property="og:title" content="${raw}" />`);
  assert.ok(!/property="og:title"\s+onload/.test(html));
  assert.ok(!/\sdata-x="/.test(tag));
});

check('an apostrophe is escaped without breaking the markup', () => {
  const html = shell({ ogTitle: "l'authentification e-mail" });
  assert.equal(metaContent(html, 'property', 'og:title'), 'l&#39;authentification e-mail');
  assert.equal(decode(metaContent(html, 'property', 'og:title')), "l'authentification e-mail");
});

check('a script tag in the title is inert', () => {
  const html = shell({ ogTitle: '<script>alert(1)</script>' });
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.equal(metaContent(html, 'property', 'og:title'), '&lt;script&gt;alert(1)&lt;/script&gt;');
});

check('newlines and control characters are collapsed to a single line', () => {
  const html = shell({ ogTitle: 'First line\nsecond\tline\u0000end' });
  assert.equal(metaContent(html, 'property', 'og:title'), 'First line second line end');
  assert.equal(count(html, 'property="og:title"'), 1);
});

check('long titles are emitted intact, not truncated mid-character', () => {
  const value = 'Überwachen '.repeat(10).trim();
  const html = shell({ ogTitle: value });
  assert.equal(decode(metaContent(html, 'property', 'og:title')), value);
});

/* -------------------------------------------------- 4. idempotence */

check('repeated rendering is deterministic and produces no duplicates', () => {
  const articleDoc = article({ seo: { title: SEO, description: 'x', ogTitle: SOCIAL } });
  const first = articlePage({ article: articleDoc, related: [], siteId: '1' });
  const second = articlePage({ article: articleDoc, related: [], siteId: '1' });
  assert.equal(first, second);
  assert.equal(count(first, 'property="og:title"'), 1);
  assert.equal(count(second, 'property="og:title"'), 1);
});

check('rendering both a page with and without a social title leaves no residue', () => {
  const withSocial = shell({ ogTitle: SOCIAL });
  const withoutSocial = shell({ ogTitle: '' });
  assert.equal(metaContent(withSocial, 'property', 'og:title'), SOCIAL);
  assert.equal(metaContent(withoutSocial, 'property', 'og:title'), SEO);
});

/* --------------------------------- 5. the real article pipeline */

check('articlePage prefers the stored seo.ogTitle', () => {
  const html = articlePage({
    article: article({ seo: { title: SEO, description: 'A description.', ogTitle: SOCIAL } }),
    related: [],
    siteId: '1',
  });
  assert.equal(metaContent(html, 'property', 'og:title'), SOCIAL);
  assert.equal(documentTitle(html), SEO);
  assert.equal(count(html, 'property="og:title"'), 1);
});

check('articlePage falls back to seo.title when ogTitle is missing', () => {
  const html = articlePage({
    article: article({ seo: { title: SEO, description: 'A description.' } }),
    related: [],
    siteId: '1',
  });
  assert.equal(metaContent(html, 'property', 'og:title'), SEO);
});

check('articlePage falls back to seo.title when ogTitle is whitespace only', () => {
  const html = articlePage({
    article: article({ seo: { title: SEO, description: 'A description.', ogTitle: '   ' } }),
    related: [],
    siteId: '1',
  });
  assert.equal(metaContent(html, 'property', 'og:title'), SEO);
});

check('articlePage without any stored seo block still emits one title', () => {
  const html = articlePage({ article: article({ seo: null }), related: [], siteId: '1' });
  assert.equal(metaContent(html, 'property', 'og:title'), `SPF, DKIM and DMARC: email authentication you can monitor — EL0M AI ENGINEER`);
  assert.equal(count(html, 'property="og:title"'), 1);
});

/* ------------------------------------------------ 6. multilingual */

const LOCALES = [
  { lang: 'en', slug: 'spf-dkim-dmarc-monitoring', seoTitle: SEO, ogTitle: SOCIAL, htmlLang: 'en', locale: 'en_US' },
  {
    lang: 'de',
    slug: 'spf-dkim-dmarc-ueberwachen',
    seoTitle: 'SPF, DKIM und DMARC überwachen — EL0M AI ENGINEER',
    ogTitle: 'SPF, DKIM und DMARC: E-Mail-Authentifizierung überwachen',
    htmlLang: 'de',
    locale: 'de_DE',
  },
  {
    lang: 'fr',
    slug: 'spf-dkim-dmarc-surveiller',
    seoTitle: 'SPF, DKIM et DMARC : les surveiller — EL0M AI ENGINEER',
    ogTitle: "SPF, DKIM et DMARC : surveiller l'authentification e-mail",
    htmlLang: 'fr',
    locale: 'fr_FR',
  },
];

for (const locale of LOCALES) {
  check(`${locale.lang}: dedicated social title with correct language metadata`, () => {
    const html = articlePage({
      article: article({
        lang: locale.lang,
        slug: locale.slug,
        seo: { title: locale.seoTitle, description: 'Beschreibung.', ogTitle: locale.ogTitle },
      }),
      related: [],
      siteId: '1',
    });
    assert.equal(decode(metaContent(html, 'property', 'og:title')), locale.ogTitle);
    assert.equal(documentTitle(html), locale.seoTitle.replace(/&/g, '&amp;'));
    assert.ok(html.includes(`<html lang="${locale.htmlLang}">`));
    assert.equal(metaContent(html, 'property', 'og:locale'), locale.locale);
    assert.equal(count(html, 'property="og:title"'), 1);
  });

  check(`${locale.lang}: falls back to the localised SEO title`, () => {
    const html = articlePage({
      article: article({
        lang: locale.lang,
        slug: locale.slug,
        seo: { title: locale.seoTitle, description: 'Beschreibung.' },
      }),
      related: [],
      siteId: '1',
    });
    assert.equal(decode(metaContent(html, 'property', 'og:title')), locale.seoTitle);
  });
}

/* --------------------------------------------------------- 7. helper */

check('the helper implements the whole precedence chain', () => {
  assert.equal(ogTitleFor(SOCIAL, SEO), SOCIAL);
  assert.equal(ogTitleFor('', SEO), SEO);
  assert.equal(ogTitleFor('   ', SEO), SEO);
  assert.equal(ogTitleFor(undefined, SEO), SEO);
  assert.equal(ogTitleFor(null, null), 'EL0M AI ENGINEER');
  assert.equal(ogTitleFor(' a  b ', SEO), 'a b');
});

/* ------------------------------------------------------------ reporting */

for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.ok ? '' : ` — ${result.detail}`}`);
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exit(1);
