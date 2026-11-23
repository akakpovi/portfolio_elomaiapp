import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

import { sanitizeArticleHtml, buildTableOfContents, htmlToText, readingMinutes } from './sanitize.mjs';
import { storeImage, rewriteMediaReferences, MAX_MEDIA_BYTES_TOTAL } from './media.mjs';
import { articlePage, listingPage, card } from './pages.mjs';
import { createHash } from 'node:crypto';

import {
  PUBLIC_BASE,
  LANGS,
  listingPath,
  categoryPath,
  setAvailableLangs,
  setAssetVersion,
  t,
} from './templates.mjs';

/* ----------------------------------------------------------- validation */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(['assets', 'category', 'de', 'en', 'fr', 'media', 'index', 'sitemap']);
const MEDIA_REF_RE = /^[a-f0-9]{64}\.(webp|png|jpg|jpeg|avif|gif)$/;

export class ValidationError extends Error {
  constructor(errors) {
    super('validation_failed');
    this.errors = errors;
  }
}

function asString(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function isoDate(value, fallback) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString();
}

/**
 * Turns a WordPress payload into the canonical article document that gets
 * stored and rendered. Everything the renderer uses comes from here, so a
 * malformed or hostile payload is rejected before it can reach the disk.
 */
export async function normalizeArticle(input, { publicDir, siteId: _siteId }) {
  const errors = [];
  const payload = input && typeof input === 'object' ? input : {};

  const uuid = asString(payload.uuid, 64).toLowerCase();
  if (!/^[a-z0-9-]{8,64}$/.test(uuid)) errors.push('uuid:invalid');

  const lang = asString(payload.lang, 5).toLowerCase();
  if (!LANGS.includes(lang)) errors.push('lang:must_be_en_de_or_fr');

  const slug = asString(payload.slug, 120).toLowerCase();
  if (!SLUG_RE.test(slug)) errors.push('slug:invalid');
  if (RESERVED_SLUGS.has(slug)) errors.push('slug:reserved');

  const title = asString(payload.title, 300);
  if (title.length < 8) errors.push('title:too_short');

  const version = Number(payload.version);
  if (!Number.isInteger(version) || version < 1 || version > 1_000_000) errors.push('version:invalid');

  const wpId = Number(payload.wpId);
  if (!Number.isInteger(wpId) || wpId < 1) errors.push('wpId:invalid');

  const rawHtml = typeof payload.html === 'string' ? payload.html : '';
  if (rawHtml.length < 40) errors.push('html:too_short');
  if (rawHtml.length > 900_000) errors.push('html:too_large');

  const media = Array.isArray(payload.media) ? payload.media : [];
  if (media.length > 60) errors.push('media:too_many');

  if (errors.length) throw new ValidationError(errors);

  /* ---- media ---- */
  let mediaTotal = 0;
  const storedMedia = [];
  const available = new Set();

  for (const item of media) {
    const ref = asString(item && item.ref, 80).toLowerCase();
    if (!MEDIA_REF_RE.test(ref)) {
      errors.push(`media:invalid_ref:${ref || 'empty'}`);
      continue;
    }
    let dataBase64 = item && item.dataBase64;
    if (typeof dataBase64 !== 'string') {
      errors.push(`media:missing_data:${ref}`);
      continue;
    }
    const bytes = Buffer.from(dataBase64, 'base64');
    mediaTotal += bytes.length;
    if (mediaTotal > MAX_MEDIA_BYTES_TOTAL) {
      errors.push('media:total_too_large');
      break;
    }
    const digest = crypto.createHash('sha256').update(bytes).digest('hex');
    if (!ref.startsWith(digest)) {
      errors.push(`media:checksum_mismatch:${ref}`);
      continue;
    }
    try {
      const result = await storeImage({ dataBase64, publicDir });
      storedMedia.push(result);
      available.add(ref);
    } catch (err) {
      errors.push(`media:rejected:${ref}:${String(err.message).slice(0, 60)}`);
    }
  }

  if (errors.length) throw new ValidationError(errors);

  /* ---- content ---- */
  const withMedia = rewriteMediaReferences(rawHtml, (name) => (available.has(name) ? `/media/${name}` : null));
  const sanitized = sanitizeArticleHtml(withMedia);
  const { html, toc } = buildTableOfContents(sanitized);
  const text = htmlToText(html);

  const excerpt =
    asString(payload.excerpt, 400) ||
    (text.length > 260 ? `${text.slice(0, 257).replace(/\s+\S*$/, '')}…` : text);

  const publishedAt = isoDate(payload.publishedAt, new Date().toISOString());
  const modifiedAt = isoDate(payload.modifiedAt, publishedAt);

  const featuredInput = payload.featured && typeof payload.featured === 'object' ? payload.featured : null;
  let featured = null;
  if (featuredInput && typeof featuredInput.ref === 'string') {
    const ref = asString(featuredInput.ref, 80).toLowerCase();
    if (available.has(ref)) {
      const variants = (Array.isArray(featuredInput.variants) ? featuredInput.variants : [])
        .filter((v) => v && typeof v.ref === 'string' && available.has(asString(v.ref, 80).toLowerCase()))
        .map((v) => ({ src: `/media/${asString(v.ref, 80).toLowerCase()}`, width: Number(v.width) || 0 }))
        .filter((v) => v.width > 0)
        .sort((a, b) => a.width - b.width);
      // Dedicated 1200×630 social card, when WordPress exported one. Only the
      // ref is trusted from the payload; the dimensions come back with it and
      // are re-checked here against the media that actually got stored.
      let og = null;
      const ogInput = featuredInput.og && typeof featuredInput.og === 'object' ? featuredInput.og : null;
      if (ogInput && typeof ogInput.ref === 'string') {
        const ogRef = asString(ogInput.ref, 80).toLowerCase();
        const ogWidth = Math.trunc(Number(ogInput.width) || 0);
        const ogHeight = Math.trunc(Number(ogInput.height) || 0);
        if (available.has(ogRef) && ogWidth > 0 && ogHeight > 0) {
          og = {
            src: `/media/${ogRef}`,
            width: ogWidth,
            height: ogHeight,
            type: asString(ogInput.mime, 40).toLowerCase(),
          };
        }
      }

      featured = {
        src: `/media/${ref}`,
        srcset: variants,
        width: Number(featuredInput.width) || 1600,
        height: Number(featuredInput.height) || 900,
        alt: asString(featuredInput.alt, 300),
        caption: asString(featuredInput.caption, 400),
        og,
      };
    }
  }

  const categories = (Array.isArray(payload.categories) ? payload.categories : [])
    .filter((c) => c && SLUG_RE.test(asString(c.slug, 60)))
    .slice(0, 4)
    .map((c) => ({ slug: asString(c.slug, 60), name: asString(c.name, 80) }));

  const translations = (Array.isArray(payload.translations) ? payload.translations : [])
    .filter((tr) => tr && LANGS.includes(asString(tr.lang, 5)) && SLUG_RE.test(asString(tr.slug, 120)))
    .filter((tr) => asString(tr.lang, 5) !== lang)
    .map((tr) => ({ lang: asString(tr.lang, 5), slug: asString(tr.slug, 120), title: asString(tr.title, 300) }));

  // The article's native WordPress comment setting decides whether the public
  // page offers a comment form at all.
  const commentsEnabled = !(payload.comments && payload.comments.enabled === false);

  const relatedProjects = (Array.isArray(payload.relatedProjects) ? payload.relatedProjects : [])
    .filter((p) => p && typeof p.url === 'string' && /^\/|^https:\/\/elomaiapp\.com\//.test(p.url))
    .slice(0, 4)
    .map((p) => ({
      name: asString(p.name, 120),
      url: p.url.startsWith('http') ? p.url : `${PUBLIC_BASE}${p.url}`,
      description: asString(p.description, 200),
    }));

  const seoInput = payload.seo && typeof payload.seo === 'object' ? payload.seo : {};
  const seoDescription = asString(seoInput.description, 300) || excerpt.slice(0, 160);
  const seo = {
    title: asString(seoInput.title, 200) || `${title} — EL0M AI ENGINEER`,
    description: seoDescription,
    keywords: Array.isArray(seoInput.keywords)
      ? seoInput.keywords.map((k) => asString(k, 60)).filter(Boolean).slice(0, 10)
      : [],
    ogTitle: asString(seoInput.ogTitle, 200) || asString(seoInput.title, 200) || title,
    ogDescription: asString(seoInput.ogDescription, 300) || seoDescription,
    ogImage: featured ? (featured.og ? featured.og.src : featured.src) : `${PUBLIC_BASE}/og-image.png`,
  };

  const checksum = crypto
    .createHash('sha256')
    .update(JSON.stringify({ title, html, excerpt, seo, featured, categories, publishedAt, modifiedAt }))
    .digest('hex');

  return {
    uuid,
    wpId,
    version,
    lang,
    slug,
    status: 'publish',
    title,
    subtitle: asString(payload.subtitle, 300),
    excerpt,
    html,
    toc,
    featured,
    author: {
      name: asString(payload.author && payload.author.name, 120) || 'Elom Akakpovi',
      url: `${PUBLIC_BASE}/`,
    },
    publishedAt,
    modifiedAt,
    categories,
    tags: (Array.isArray(payload.tags) ? payload.tags : []).map((tag) => asString(tag, 60)).filter(Boolean).slice(0, 12),
    seo,
    translations,
    commentsEnabled,
    relatedProjects,
    readingMinutes: Number(payload.readingMinutes) || readingMinutes(html),
    wordCount: text.split(/\s+/).filter(Boolean).length,
    checksum,
    syncedAt: new Date().toISOString(),
    media: storedMedia,
  };
}

/* -------------------------------------------------------------- rendering */

async function writeFile(file, contents) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmp, contents);
  await fs.rename(tmp, file);
}

function categoriesFor(articles, lang) {
  const counts = new Map();
  for (const article of articles) {
    if (article.status !== 'publish' || article.lang !== lang) continue;
    for (const category of article.categories || []) {
      const entry = counts.get(category.slug) || { slug: category.slug, name: category.name, count: 0 };
      entry.count += 1;
      counts.set(category.slug, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function relatedFor(article, articles) {
  const others = articles.filter((a) => a.status === 'publish' && a.uuid !== article.uuid);
  const primary = (article.categories || [])[0];
  const scored = others.map((other) => {
    let score = 0;
    if (primary && (other.categories || []).some((c) => c.slug === primary.slug)) score += 5;
    if (other.lang === article.lang) score += 2;
    return { other, score };
  });
  return scored
    .sort((a, b) => b.score - a.score || String(b.other.publishedAt).localeCompare(String(a.other.publishedAt)))
    .slice(0, 3)
    .map((entry) => entry.other);
}

function sitemapXml(articles, { staticLastmod }) {
  const urls = [];
  const add = (loc, lastmod, changefreq, priority, alternates) => {
    urls.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${(alternates || [])
      .map((alt) => `\n    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`)
      .join('')}
  </url>`);
  };

  add(`${PUBLIC_BASE}/`, staticLastmod, 'monthly', '1.0', []);
  add(`${PUBLIC_BASE}/privacy/`, staticLastmod, 'yearly', '0.3', []);

  const published = articles.filter((a) => a.status === 'publish');
  const newest = published
    .map((a) => a.modifiedAt || a.publishedAt)
    .sort()
    .pop();

  // Only languages that actually have a published article get a listing page:
  // the sitemap must never advertise an empty language hub.
  const activeLangs = LANGS.filter((code) => published.some((a) => a.lang === code));
  for (const lang of activeLangs) {
    const listingAlternates = activeLangs.map((code) => ({
      hreflang: code,
      href: `${PUBLIC_BASE}${listingPath(code)}`,
    }));
    add(`${PUBLIC_BASE}${listingPath(lang)}`, newest || staticLastmod, 'weekly', '0.8', listingAlternates);
  }

  for (const article of published) {
    const alternates = [
      { hreflang: article.lang, href: `${PUBLIC_BASE}/blog/${article.lang}/${article.slug}/` },
      ...(article.translations || []).map((tr) => ({
        hreflang: tr.lang,
        href: `${PUBLIC_BASE}/blog/${tr.lang}/${tr.slug}/`,
      })),
    ];
    add(
      `${PUBLIC_BASE}/blog/${article.lang}/${article.slug}/`,
      article.modifiedAt || article.publishedAt,
      'monthly',
      '0.7',
      alternates,
    );
  }

  for (const lang of LANGS) {
    for (const category of categoriesFor(published, lang)) {
      add(`${PUBLIC_BASE}${categoryPath(lang, category.slug)}`, newest || staticLastmod, 'weekly', '0.5', []);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

/**
 * Rebuilds every public artifact from the stored articles. Called after each
 * successful sync so the site never needs a database at request time.
 */
export async function renderAll({ store, comments, publicDir, siteId, staticLastmod }) {
  const stored = store.list().filter((a) => a.status === 'publish');
  // A translation link may only be published when the target is published too,
  // otherwise the hreflang graph and the language switcher would point at a 404.
  const publishedKeys = new Set(stored.map((a) => `${a.lang}/${a.slug}`));
  const articles = stored.map((a) => ({
    ...a,
    translations: (a.translations || []).filter((tr) => publishedKeys.has(`${tr.lang}/${tr.slug}`)),
  }));
  const blogDir = path.join(publicDir, 'blog');

  // Language switcher reflects what is really published.
  setAvailableLangs(LANGS.filter((code) => articles.some((a) => a.lang === code)));

  await fs.rm(blogDir, { recursive: true, force: true });
  await fs.mkdir(blogDir, { recursive: true });

  const css = await fs.readFile(new URL('../assets/blog.css', import.meta.url), 'utf8');
  const js = await fs.readFile(new URL('../assets/blog.js', import.meta.url), 'utf8');
  await writeFile(path.join(blogDir, 'assets', 'blog.css'), css);
  await writeFile(path.join(blogDir, 'assets', 'blog.js'), js);

  // Asset URLs carry their own content hash so a CDN in front of the site can
  // never keep serving an old blog.js — or an old cached 404 for it.
  setAssetVersion(createHash('sha256').update(css).update(js).digest('hex').slice(0, 10));

  // A language with no published article gets no hub at all: empty language
  // pages are neither linked nor indexed. The default language lives at
  // /blog/ so its listing and category pages share that prefix.
  for (const lang of LANGS) {
    if (!articles.some((a) => a.lang === lang)) {
      continue;
    }
    const categories = categoriesFor(articles, lang);
    const listing = listingPage({ lang, articles, categories, siteId });
    await writeFile(path.join(blogDir, lang === 'en' ? 'index.html' : `${lang}/index.html`), listing);

    for (const category of categories) {
      const page = listingPage({ lang, articles, categories, activeCategory: category.slug, siteId });
      await writeFile(
        path.join(blogDir, lang === 'en' ? '' : lang, 'category', category.slug, 'index.html'),
        page,
      );
    }
  }

  for (const article of articles) {
    const related = relatedFor(article, articles);
    // Only approved comments are ever rendered into the static page.
    const thread = comments ? comments.thread(article.uuid) : { roots: [], total: 0 };
    const html = articlePage({
      article,
      related,
      siteId,
      comments: {
        enabled: article.commentsEnabled !== false,
        roots: thread.roots,
        total: thread.total,
        nextCursor: thread.nextCursor || '',
      },
    });
    await writeFile(path.join(blogDir, article.lang, article.slug, 'index.html'), html);
  }

  const feed = {
    generatedAt: new Date().toISOString(),
    count: articles.length,
    articles: [...articles]
      .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
      .map((a) => ({
        uuid: a.uuid,
        slug: a.slug,
        lang: a.lang,
        title: a.title,
        excerpt: a.excerpt,
        publishedAt: a.publishedAt,
        modifiedAt: a.modifiedAt,
        readingMinutes: a.readingMinutes,
        image: a.featured ? a.featured.src : null,
        imageAlt: a.featured ? a.featured.alt : '',
        url: `/blog/${a.lang}/${a.slug}/`,
        categories: a.categories || [],
        translations: (a.translations || []).map((tr) => ({ lang: tr.lang, slug: tr.slug })),
      })),
  };
  await writeFile(path.join(publicDir, 'content', 'blog-index.json'), JSON.stringify(feed, null, 2));
  await writeFile(path.join(publicDir, 'sitemap.xml'), sitemapXml(articles, { staticLastmod }));

  return { articles: articles.length, generatedAt: feed.generatedAt };
}

export { t, card };
