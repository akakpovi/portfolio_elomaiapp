import {
  e,
  t,
  formatDate,
  articlePath,
  listingPath,
  categoryPath,
  headerHtml,
  footerHtml,
  pageShell,
  PUBLIC_BASE,
  LANGS,
  LANG_LABEL,
} from './templates.mjs';

/* ------------------------------------------------------------ shared parts */

function breadcrumbs(lang, items) {
  const list = items
    .map((item, index) => {
      const last = index === items.length - 1;
      const inner = last
        ? `<span aria-current="page">${e(item.name)}</span>`
        : `<a href="${item.href}">${e(item.name)}</a>`;
      return `<li>${inner}</li>`;
    })
    .join('');
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><div class="wrap"><ol>${list}</ol></div></nav>`;
}

function shareLinks(article) {
  const url = `${PUBLIC_BASE}${articlePath(article)}`;
  const utm = `utm_source=__SOURCE__&utm_medium=social&utm_campaign=${encodeURIComponent(article.slug)}`;
  const withUtm = (source) => `${url}?${utm.replace('__SOURCE__', source)}`;
  const title = encodeURIComponent(article.title);

  return `<div class="share" aria-label="${e(t('share', article.lang))}">
  <span class="share-label">${e(t('share', article.lang))}</span>
  <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(withUtm('linkedin'))}" target="_blank" rel="noopener noreferrer" data-share="linkedin">LinkedIn</a>
  <a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(withUtm('facebook'))}" target="_blank" rel="noopener noreferrer" data-share="facebook">Facebook</a>
  <a class="share-btn" href="https://x.com/intent/tweet?text=${title}&url=${encodeURIComponent(withUtm('x'))}" target="_blank" rel="noopener noreferrer" data-share="x">X</a>
  <a class="share-btn" href="mailto:?subject=${title}&body=${encodeURIComponent(withUtm('email'))}" data-share="email">E-Mail</a>
  <button class="share-btn share-copy" type="button" data-share="copy" data-url="${e(url)}">${e(t('copyLink', article.lang))}</button>
</div>`;
}

function videoFacades(html) {
  return html.replace(/<iframe([^>]*)src="([^"]+)"([^>]*)><\/iframe>/gi, (_m, before, src, after) => {
    const provider = /youtube/i.test(src) ? 'youtube' : /vimeo/i.test(src) ? 'vimeo' : 'video';
    const safeSrc = src.replace(/"/g, '&quot;');
    return `<div class="video-facade" data-src="${safeSrc}" data-provider="${provider}">
      <button type="button" class="video-play" aria-label="Play ${provider} video"><span aria-hidden="true">▶</span></button>
      <p class="video-hint">Video · ${provider}</p>
    </div>`;
  });
}

function coverImage(article, className = '') {
  const img = article.featured;
  if (!img || !img.src) {
    return `<div class="cover cover-fallback ${className}" aria-hidden="true"><span>EL0M.AI</span></div>`;
  }
  const srcset = img.srcset && img.srcset.length
    ? ` srcset="${img.srcset.map((s) => `${e(s.src)} ${s.width}w`).join(', ')}" sizes="(max-width: 720px) 100vw, 760px"`
    : '';
  return `<img class="cover ${className}" src="${e(img.src)}"${srcset} width="${Number(img.width) || 1600}" height="${Number(img.height) || 900}" alt="${e(img.alt || '')}" loading="lazy" decoding="async" />`;
}

function authorName(article) {
  return (article.author && article.author.name) || 'Elom Akakpovi';
}

/* --------------------------------------------------------------- article */

export function articlePage({ article, related, siteId }) {
  const lang = article.lang;
  const canonical = `${PUBLIC_BASE}${articlePath(article)}`;
  const seoTitle = (article.seo && article.seo.title) || `${article.title} — EL0M AI ENGINEER`;
  const description = (article.seo && article.seo.description) || article.excerpt || '';
  const primaryCategory = article.categories && article.categories[0];

  const alternates = [
    ...(article.translations || []).map((tr) => ({
      hreflang: tr.lang,
      href: `${PUBLIC_BASE}/blog/${tr.lang}/${tr.slug}/`,
    })),
    { hreflang: lang, href: canonical },
  ];
  const english = (article.translations || []).find((tr) => tr.lang === 'en');
  alternates.push({
    hreflang: 'x-default',
    href: english ? `${PUBLIC_BASE}/blog/en/${english.slug}/` : canonical,
  });

  const toc = article.toc || [];
  const hasToc = toc.filter((item) => item.level === 2).length >= 2;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${canonical}#article`,
      headline: article.title,
      description,
      inLanguage: lang,
      datePublished: article.publishedAt,
      dateModified: article.modifiedAt || article.publishedAt,
      author: { '@type': 'Person', name: authorName(article), url: `${PUBLIC_BASE}/` },
      publisher: { '@type': 'Person', name: 'Elom Akakpovi', url: `${PUBLIC_BASE}/` },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
      url: canonical,
      image: article.featured && article.featured.src ? `${PUBLIC_BASE}${article.featured.src}` : `${PUBLIC_BASE}/og-image.png`,
      keywords: (article.seo && article.seo.keywords ? article.seo.keywords : article.tags || []).join(', '),
      articleSection: primaryCategory ? primaryCategory.name : undefined,
      wordCount: article.wordCount || undefined,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('breadcrumbHome', lang), item: `${PUBLIC_BASE}/` },
        { '@type': 'ListItem', position: 2, name: t('blog', lang), item: `${PUBLIC_BASE}${listingPath(lang)}` },
        ...(primaryCategory
          ? [{ '@type': 'ListItem', position: 3, name: primaryCategory.name, item: `${PUBLIC_BASE}${categoryPath(lang, primaryCategory.slug)}` }]
          : []),
        { '@type': 'ListItem', position: primaryCategory ? 4 : 3, name: article.title, item: canonical },
      ],
    },
  ];

  const crumbs = breadcrumbs(lang, [
    { name: t('breadcrumbHome', lang), href: '/' },
    { name: t('blog', lang), href: listingPath(lang) },
    ...(primaryCategory
      ? [{ name: primaryCategory.name, href: categoryPath(lang, primaryCategory.slug) }]
      : []),
    { name: article.title, href: articlePath(article) },
  ]);

  const translationBar = (article.translations || []).length
    ? `<div class="translation-bar"><span>${e(t('availableIn', lang))}:</span>${article.translations
        .map((tr) => `<a href="/blog/${tr.lang}/${tr.slug}/" hreflang="${tr.lang}" lang="${tr.lang}">${LANG_LABEL[tr.lang] || tr.lang}</a>`)
        .join('')}</div>`
    : '';

  const tocHtml = hasToc
    ? `<aside class="toc" aria-label="${e(t('contents', lang))}">
        <h2>${e(t('contents', lang))}</h2>
        <ol>${toc.filter((item) => item.level === 2).map((item) => `<li><a href="#${e(item.id)}">${e(item.text)}</a></li>`).join('')}</ol>
      </aside>`
    : '';

  const relatedHtml = related.length
    ? `<section class="related" aria-labelledby="related-title">
        <h2 id="related-title">${e(t('related', lang))}</h2>
        <div class="card-grid">${related.map((item) => card(item, lang)).join('')}</div>
      </section>`
    : '';

  const projects = article.relatedProjects || [];
  const projectsHtml = projects.length
    ? `<section class="related-projects" aria-labelledby="projects-title">
        <h2 id="projects-title">${e(t('relatedProjects', lang))}</h2>
        <ul>${projects
          .map(
            (project) =>
              `<li><a href="${e(project.url)}" data-event="project_open" data-location="article">${e(project.name)}</a>${
                project.description ? `<span>${e(project.description)}</span>` : ''
              }</li>`,
          )
          .join('')}</ul>
      </section>`
    : '';

  const content = `${headerHtml(lang, articlePath(article))}
${crumbs}
<main id="main" class="wrap article-wrap">
  <article class="article">
    <header class="article-head">
      ${primaryCategory ? `<a class="kicker" href="${categoryPath(lang, primaryCategory.slug)}">${e(primaryCategory.name)}</a>` : ''}
      <h1>${e(article.title)}</h1>
      ${article.subtitle ? `<p class="lede">${e(article.subtitle)}</p>` : ''}
      <div class="article-meta">
        <span>${e(t('by', lang))} ${e(authorName(article))}</span>
        <span><time datetime="${e(article.publishedAt)}">${e(formatDate(article.publishedAt, lang))}</time></span>
        <span>${Number(article.readingMinutes) || 1} ${e(t('minRead', lang))}</span>
        <span class="lang-badge">${lang.toUpperCase()}</span>
      </div>
      ${translationBar}
    </header>
    <figure class="article-cover">${coverImage(article, 'cover-wide')}${
      article.featured && article.featured.caption ? `<figcaption>${e(article.featured.caption)}</figcaption>` : ''
    }</figure>
    <div class="article-layout">
      <div class="article-body prose">${videoFacades(article.html || '')}</div>
      ${tocHtml}
    </div>
    ${shareLinks(article)}
    ${projectsHtml}
    ${relatedHtml}
    <section class="cta-panel">
      <div>
        <h2>${e(t('workWithMe', lang))}</h2>
        <p>${e(t('workWithMeText', lang))}</p>
      </div>
      <div class="cta-actions">
        <a class="btn btn-primary" href="https://www.freelancer.com/u/eakakpovi656" target="_blank" rel="noopener noreferrer" data-event="freelancer_profile_click" data-location="article_cta">${e(t('hireMe', lang))}</a>
        <a class="btn btn-ghost" href="/#contact" data-event="contact_click" data-location="article_cta">${e(t('contactMe', lang))}</a>
      </div>
    </section>
    <p class="back-link"><a href="${listingPath(lang)}">← ${e(t('backToBlog', lang))}</a></p>
  </article>
</main>
${footerHtml(lang)}`;

  return pageShell({
    lang,
    title: seoTitle,
    description,
    canonical,
    alternates,
    ogImage: article.seo && article.seo.ogImage ? article.seo.ogImage : article.featured && article.featured.src,
    ogType: 'article',
    jsonLd,
    bodyClass: 'page-article',
    content,
    siteId,
    analyticsAction: 'article_view',
    analyticsLabel: `${article.lang}/${article.slug}`,
  });
}

/* --------------------------------------------------------------- listing */

export function card(article, lang, { large = false } = {}) {
  const primaryCategory = article.categories && article.categories[0];
  return `<article class="post-card${large ? ' post-card-large' : ''}" data-lang="${e(article.lang)}" data-category="${
    primaryCategory ? e(primaryCategory.slug) : ''
  }" data-title="${e(article.title.toLowerCase())}" data-search="${e(`${article.title} ${article.excerpt || ''}`.toLowerCase())}">
  <a class="post-card-media" href="${articlePath(article)}" tabindex="-1" aria-hidden="true">${coverImage(article)}</a>
  <div class="post-card-body">
    ${primaryCategory ? `<a class="kicker" href="${categoryPath(article.lang, primaryCategory.slug)}">${e(primaryCategory.name)}</a>` : ''}
    <h3><a href="${articlePath(article)}">${e(article.title)}</a></h3>
    <p>${e(article.excerpt || '')}</p>
    <div class="post-card-meta">
      <time datetime="${e(article.publishedAt)}">${e(formatDate(article.publishedAt, lang))}</time>
      <span>${Number(article.readingMinutes) || 1} ${e(t('minRead', lang))}</span>
      <span class="lang-badge">${article.lang.toUpperCase()}</span>
    </div>
  </div>
</article>`;
}

export function listingPage({ lang, articles, categories, activeCategory, siteId, titleOverride, path }) {
  const langArticles = articles.filter((a) => a.status === 'publish');
  const filtered = activeCategory ? langArticles.filter((a) => (a.categories || []).some((c) => c.slug === activeCategory)) : langArticles;
  const sorted = [...filtered].sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  const [featured, ...rest] = sorted;

  const canonical = `${PUBLIC_BASE}${activeCategory ? categoryPath(lang, activeCategory) : listingPath(lang)}`;
  const activeCategoryName = activeCategory ? (categories.find((c) => c.slug === activeCategory) || {}).name : null;

  const pageTitle = titleOverride
    ? titleOverride
    : activeCategoryName
      ? `${activeCategoryName} — ${t('blog', lang)} — EL0M AI ENGINEER`
      : `${t('blog', lang)} — EL0M AI ENGINEER`;
  const description = activeCategoryName
    ? `${activeCategoryName}: ${t('blogSubtitle', lang)}`
    : t('blogSubtitle', lang);

  const alternates = LANGS.map((code) => ({
    hreflang: code,
    href: `${PUBLIC_BASE}${activeCategory ? categoryPath(code, activeCategory) : listingPath(code)}`,
  }));
  alternates.push({ hreflang: 'x-default', href: `${PUBLIC_BASE}/blog/` });

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': `${PUBLIC_BASE}${listingPath(lang)}#blog`,
      name: `${t('blog', lang)} — EL0M AI ENGINEER`,
      description: t('blogSubtitle', lang),
      inLanguage: lang,
      url: canonical,
      publisher: { '@type': 'Person', name: 'Elom Akakpovi', url: `${PUBLIC_BASE}/` },
      blogPost: sorted.slice(0, 10).map((a) => ({
        '@type': 'BlogPosting',
        headline: a.title,
        url: `${PUBLIC_BASE}${articlePath(a)}`,
        datePublished: a.publishedAt,
        inLanguage: a.lang,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('breadcrumbHome', lang), item: `${PUBLIC_BASE}/` },
        { '@type': 'ListItem', position: 2, name: t('blog', lang), item: `${PUBLIC_BASE}${listingPath(lang)}` },
        ...(activeCategoryName
          ? [{ '@type': 'ListItem', position: 3, name: activeCategoryName, item: canonical }]
          : []),
      ],
    },
  ];

  const chips = [`<a class="chip${activeCategory ? '' : ' is-active'}" href="${listingPath(lang)}">${e(t('allCategories', lang))}</a>`]
    .concat(
      categories.map(
        (cat) =>
          `<a class="chip${cat.slug === activeCategory ? ' is-active' : ''}" href="${categoryPath(lang, cat.slug)}">${e(cat.name)} <span class="chip-count">${cat.count}</span></a>`,
      ),
    )
    .join('');

  const emptyState = `<div class="empty-state">
      <h2>${e(t('noArticles', lang))}</h2>
      <p>${e(
        lang === 'en'
          ? 'New technical articles are published regularly. Meanwhile, the English articles are available.'
          : 'Regelmäßig erscheinen neue technische Artikel. Die englischen Artikel sind bereits verfügbar.',
      )}</p>
      ${lang !== 'en' ? `<a class="btn btn-primary" href="/blog/">${e(t('readArticle', 'en'))} · English</a>` : ''}
    </div>`;

  const body = featured
    ? `<section class="featured-block" aria-labelledby="featured-title">
        <h2 id="featured-title" class="section-label">${e(t('featured', lang))}</h2>
        ${card(featured, lang, { large: true })}
      </section>
      ${
        rest.length
          ? `<section class="all-posts" aria-labelledby="all-title">
              <h2 id="all-title" class="section-label">${e(t('latest', lang))}</h2>
              <div class="card-grid" id="post-grid">${rest.map((a) => card(a, lang)).join('')}</div>
            </section>`
          : ''
      }`
    : emptyState;

  const content = `${headerHtml(lang, activeCategory ? categoryPath(lang, activeCategory) : listingPath(lang))}
<main id="main" class="wrap blog-wrap">
  <header class="blog-head">
    <p class="eyebrow">BLOG</p>
    <h1>${e(activeCategoryName || t('blog', lang))}</h1>
    <p class="blog-sub">${e(t('blogSubtitle', lang))}</p>
    <div class="blog-tools">
      <label class="search-field">
        <span class="sr-only">${e(t('search', lang))}</span>
        <input type="search" id="blog-search" placeholder="${e(t('search', lang))}" autocomplete="off" />
      </label>
      <div class="lang-tabs" role="group" aria-label="${e(t('languageNotice', lang))}">
        ${LANGS.map(
          (code) =>
            `<a href="${activeCategory ? categoryPath(code, activeCategory) : listingPath(code)}" hreflang="${code}" lang="${code}"${
              code === lang ? ' aria-current="true" class="is-active"' : ''
            }>${code.toUpperCase()}</a>`,
        ).join('')}
      </div>
    </div>
    <nav class="chips" aria-label="${e(t('categories', lang))}">${chips}</nav>
  </header>
  ${body}
  <div class="pagination" id="pagination" hidden>
    <button type="button" class="btn btn-ghost" data-page="prev">← ${e(t('previous', lang))}</button>
    <span id="page-status"></span>
    <button type="button" class="btn btn-ghost" data-page="next">${e(t('next', lang))} →</button>
  </div>
  <p class="search-empty" id="search-empty" hidden>${e(t('searchEmpty', lang))}</p>
</main>
${footerHtml(lang)}`;

  return pageShell({
    lang,
    title: pageTitle,
    description,
    canonical,
    alternates,
    ogImage: '/og-image.png',
    jsonLd,
    bodyClass: 'page-blog',
    content,
    siteId,
    analyticsAction: 'blog_listing_view',
    analyticsLabel: activeCategory ? `${lang}/category/${activeCategory}` : lang,
  });
}

export function privacyNotice(lang) {
  return {
    title:
      lang === 'de'
        ? 'Datenschutz & Analyse — EL0M AI ENGINEER'
        : lang === 'fr'
          ? 'Confidentialité & analyse — EL0M AI ENGINEER'
          : 'Privacy & analytics — EL0M AI ENGINEER',
    description:
      lang === 'de'
        ? 'Wie elomaiapp.com mit Besucherdaten umgeht: cookiefreie, anonymisierte Reichweitenmessung mit Matomo.'
        : 'How elomaiapp.com handles visitor data: cookieless, anonymised audience measurement with Matomo.',
  };
}

export { PUBLIC_BASE };
