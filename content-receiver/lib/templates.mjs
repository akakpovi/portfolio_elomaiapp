/**
 * Public HTML templates for the statically rendered blog.
 * They intentionally reuse the portfolio's visual language (dark navy,
 * mono headings, cyan/violet accents) so /blog never looks like a different site.
 */

export const PUBLIC_BASE = 'https://elomaiapp.com';
export const LANGS = ['en', 'de', 'fr'];
export const HTML_LANG = { en: 'en', de: 'de', fr: 'fr' };
export const OG_LOCALE = { en: 'en_US', de: 'de_DE', fr: 'fr_FR' };
export const INTL_LOCALE = { en: 'en-GB', de: 'de-DE', fr: 'fr-FR' };
export const LANG_LABEL = { en: 'English', de: 'Deutsch', fr: 'Français' };

export function e(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const label = (en, de, fr) => ({ en, de, fr });

/** Last-resort title, identical to the value already published as og:site_name. */
export const SITE_NAME = 'EL0M AI ENGINEER';

/**
 * Open Graph titles are their own field in WordPress (`og_title`): a shorter,
 * social-specific headline that does not have to carry the brand suffix of the
 * SEO title. Precedence is dedicated title → SEO title → site name.
 *
 * The chosen value is collapsed to a single line so that a stray newline, tab
 * or NUL in the stored field can never break out of the content attribute, and
 * whitespace-only input counts as absent. Everything else — including non-ASCII
 * text — is preserved verbatim and escaped once, by e().
 */
export function ogTitleFor(ogTitle, seoTitle) {
  for (const candidate of [ogTitle, seoTitle]) {
    if (typeof candidate !== 'string') continue;
    const clean = candidate
      .replace(/[\u0000-\u001f\u007f]+/g, ' ')
      .replace(/ {2,}/g, ' ')
      .trim();
    if (clean) return clean;
  }
  return SITE_NAME;
}

/* ------------------------------------------------------------ social card */

/**
 * The portfolio ships a static 1200×630 PNG as the site-wide fallback card.
 * Its dimensions are a property of that file, so they are allowed to live here.
 */
const OG_FALLBACK = { path: '/og-image.png', width: 1200, height: 630, type: 'image/png' };

const IMAGE_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

function absoluteUrl(value) {
  const url = String(value || '');
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return `${PUBLIC_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

function ogMimeType(url, explicit) {
  const candidates = [String(explicit || '').toLowerCase(), IMAGE_TYPES[String(url).split('?')[0].split('.').pop().toLowerCase()] || ''];
  return candidates.find((type) => Object.values(IMAGE_TYPES).includes(type)) || '';
}

/**
 * Normalises the Open Graph image to {url, width, height, type, alt}.
 *
 * Dimensions are data, not constants: a caller that does not know them gets no
 * og:image:width/og:image:height tag at all, instead of a wrong one. The
 * template used to advertise 1200×630 for every article while the actual file
 * was the 1600×900 cover.
 */
export function resolveOgImage(ogImage, fallbackAlt = '') {
  const fallback = {
    url: absoluteUrl(OG_FALLBACK.path),
    width: OG_FALLBACK.width,
    height: OG_FALLBACK.height,
    type: OG_FALLBACK.type,
    alt: String(fallbackAlt || ''),
  };

  if (ogImage && typeof ogImage === 'object') {
    const url = absoluteUrl(ogImage.url || ogImage.src);
    if (!url) return fallback;
    return {
      url,
      width: Math.max(0, Math.trunc(Number(ogImage.width) || 0)),
      height: Math.max(0, Math.trunc(Number(ogImage.height) || 0)),
      type: ogMimeType(url, ogImage.type),
      alt: String(ogImage.alt || fallbackAlt || ''),
    };
  }

  if (typeof ogImage === 'string' && ogImage) {
    const url = absoluteUrl(ogImage);
    if (url === fallback.url || url.endsWith(OG_FALLBACK.path)) return fallback;
    return { url, width: 0, height: 0, type: ogMimeType(url), alt: String(fallbackAlt || '') };
  }

  return fallback;
}

export const strings = {
  navHome: label('Home', 'Start', 'Accueil'),
  navSolutions: label('AI Solutions', 'AI-Lösungen', 'Solutions IA'),
  navServices: label('Services', 'Leistungen', 'Services'),
  navProjects: label('Projects', 'Projekte', 'Projets'),
  navTechnologies: label('Technologies', 'Technologien', 'Technologies'),
  navAbout: label('About', 'Über mich', 'À propos'),
  navBlog: label('Blog', 'Blog', 'Blog'),
  navContact: label('Contact', 'Kontakt', 'Contact'),
  navFreelancer: label('Freelancer', 'Freelancer', 'Freelancer'),
  blog: label('Blog', 'Blog', 'Blog'),
  blogSubtitle: label(
    'Notes on AI engineering, full-stack development, infrastructure and security — written from real projects.',
    'Notizen zu AI-Engineering, Full-Stack-Entwicklung, Infrastruktur und Sicherheit — aus echten Projekten.',
    'Notes sur l’ingénierie IA, le développement full-stack, l’infrastructure et la sécurité — issues de projets réels.',
  ),
  latest: label('Latest articles', 'Neueste Artikel', 'Derniers articles'),
  featured: label('Featured article', 'Empfohlener Artikel', 'Article à la une'),
  readArticle: label('Read article', 'Artikel lesen', 'Lire l’article'),
  readMore: label('Read more', 'Weiterlesen', 'Lire la suite'),
  minRead: label('min read', 'Min. Lesezeit', 'min de lecture'),
  by: label('By', 'Von', 'Par'),
  published: label('Published', 'Veröffentlicht', 'Publié'),
  updated: label('Updated', 'Aktualisiert', 'Mis à jour'),
  categories: label('Categories', 'Kategorien', 'Catégories'),
  allCategories: label('All categories', 'Alle Kategorien', 'Toutes les catégories'),
  search: label('Search articles', 'Artikel suchen', 'Rechercher un article'),
  searchEmpty: label('No article matches your search.', 'Kein Artikel entspricht Ihrer Suche.', 'Aucun article ne correspond à votre recherche.'),
  noArticles: label('No articles in this language yet.', 'Noch keine Artikel in dieser Sprache.', 'Pas encore d’articles dans cette langue.'),
  noArticlesHint: label(
    'This article is not available in your language yet. You can read it in another language or browse the blog.',
    'Dieser Artikel ist noch nicht in Ihrer Sprache verfügbar. Sie können ihn in einer anderen Sprache lesen oder den Blog durchsuchen.',
    'Cet article n’est pas encore disponible dans votre langue. Vous pouvez le lire dans une autre langue ou parcourir le blog.',
  ),
  availableIn: label('Available in', 'Verfügbar in', 'Disponible en'),
  otherLanguages: label('This article in other languages', 'Dieser Artikel in anderen Sprachen', 'Cet article dans d’autres langues'),
  currentLanguage: label('Current language', 'Aktuelle Sprache', 'Langue actuelle'),
  translationStateAvailable: label('Available', 'Verfügbar', 'Disponible'),
  translationStateMissing: label('Not translated yet', 'Noch nicht übersetzt', 'Pas encore traduit'),
  translationStateUnpublished: label('In preparation', 'In Vorbereitung', 'En préparation'),
  translationStateUnavailable: label('Temporarily unavailable', 'Vorübergehend nicht verfügbar', 'Temporairement indisponible'),
  goToLanguageBlog: label('Go to the {lang} blog', 'Zum Blog auf {lang}', 'Aller au blog en {lang}'),
  emptyLanguageHint: label(
    'New technical articles are published regularly. The other language editions remain available.',
    'Regelmäßig erscheinen neue technische Artikel. Die anderen Sprachausgaben bleiben verfügbar.',
    'De nouveaux articles techniques paraissent régulièrement. Les autres éditions linguistiques restent disponibles.',
  ),
  contents: label('Contents', 'Inhalt', 'Sommaire'),
  showContents: label('Show contents', 'Inhalt anzeigen', 'Afficher le sommaire'),
  related: label('Related articles', 'Verwandte Artikel', 'Articles liés'),
  share: label('Share this article', 'Artikel teilen', 'Partager cet article'),
  copyLink: label('Copy link', 'Link kopieren', 'Copier le lien'),
  copied: label('Copied', 'Kopiert', 'Copié'),
  backToBlog: label('Back to blog', 'Zurück zum Blog', 'Retour au blog'),
  breadcrumbHome: label('Home', 'Start', 'Accueil'),
  relatedProjects: label('Related projects', 'Verwandte Projekte', 'Projets liés'),
  workWithMe: label('Build something similar', 'Ähnliches Projekt umsetzen', 'Réaliser un projet similaire'),
  workWithMeText: label(
    'I build private AI systems, RAG applications and production web software. Available for freelance projects.',
    'Ich baue private AI-Systeme, RAG-Anwendungen und produktive Websoftware. Verfügbar für Freelance-Projekte.',
    'Je construis des systèmes IA privés, des applications RAG et des logiciels web en production. Disponible en freelance.',
  ),
  hireMe: label('View freelancer profile', 'Freelancer-Profil ansehen', 'Voir le profil freelancer'),
  contactMe: label('Contact me', 'Kontakt aufnehmen', 'Me contacter'),
  previous: label('Previous', 'Zurück', 'Précédent'),
  next: label('Next', 'Weiter', 'Suivant'),
  page: label('Page', 'Seite', 'Page'),
  notFoundTitle: label('Page not found', 'Seite nicht gefunden', 'Page introuvable'),
  notFoundText: label(
    'This page does not exist or is no longer public.',
    'Diese Seite existiert nicht oder ist nicht mehr öffentlich.',
    'Cette page n’existe pas ou n’est plus publique.',
  ),
  privacy: label('Privacy & analytics', 'Datenschutz & Analyse', 'Confidentialité & analyse'),
  languageNotice: label('Language', 'Sprache', 'Langue'),
  readingTime: label('Reading time', 'Lesezeit', 'Temps de lecture'),

  /* ---- comments: every string is localised for DE, EN and FR ---- */
  comments: label('Comments', 'Kommentare', 'Commentaires'),
  commentCountOne: label('1 comment', '1 Kommentar', '1 commentaire'),
  commentCountMany: label('{n} comments', '{n} Kommentare', '{n} commentaires'),
  commentsIntro: label(
    'Comments are moderated. Only approved comments are shown, and your email address is never published.',
    'Kommentare werden moderiert. Es werden nur freigegebene Kommentare angezeigt, und Ihre E-Mail-Adresse wird niemals veröffentlicht.',
    'Les commentaires sont modérés. Seuls les commentaires approuvés sont affichés et votre adresse e-mail n’est jamais publiée.',
  ),
  commentsEmpty: label(
    'No comments yet. Be the first to write one.',
    'Noch keine Kommentare. Schreiben Sie den ersten.',
    'Aucun commentaire pour l’instant. Soyez le premier à en écrire un.',
  ),
  commentsClosed: label(
    'Comments are closed for this article.',
    'Die Kommentarfunktion ist für diesen Artikel geschlossen.',
    'Les commentaires sont fermés pour cet article.',
  ),
  commentFormTitle: label('Write a comment', 'Kommentar schreiben', 'Écrire un commentaire'),
  commentName: label('Display name', 'Anzeigename', 'Nom affiché'),
  commentEmail: label('Email address', 'E-Mail-Adresse', 'Adresse e-mail'),
  commentEmailHint: label(
    'Not published. Used only to contact you about this comment.',
    'Wird nicht veröffentlicht. Wird nur für Rückfragen zu diesem Kommentar verwendet.',
    'Non publiée. Utilisée uniquement pour vous contacter au sujet de ce commentaire.',
  ),
  commentContent: label('Comment', 'Kommentar', 'Commentaire'),
  commentPrivacy: label(
    'I agree that my name, email address and comment are stored so that the comment can be published and moderated.',
    'Ich stimme zu, dass mein Name, meine E-Mail-Adresse und mein Kommentar gespeichert werden, damit der Kommentar veröffentlicht und moderiert werden kann.',
    'J’accepte que mon nom, mon adresse e-mail et mon commentaire soient enregistrés afin de publier et de modérer le commentaire.',
  ),
  commentPrivacyLink: label('Privacy notice', 'Datenschutzhinweis', 'Mentions de confidentialité'),
  commentSubmit: label('Post comment', 'Kommentar absenden', 'Publier le commentaire'),
  commentSending: label('Sending…', 'Wird gesendet…', 'Envoi…'),
  commentReceived: label(
    'Thank you. Your comment was received and will appear here once it has been reviewed.',
    'Danke. Ihr Kommentar ist eingegangen und erscheint hier, sobald er geprüft wurde.',
    'Merci. Votre commentaire a été reçu et apparaîtra ici dès qu’il aura été vérifié.',
  ),
  commentError: label(
    'Your comment could not be sent. Please try again later.',
    'Ihr Kommentar konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
    'Votre commentaire n’a pas pu être envoyé. Veuillez réessayer plus tard.',
  ),
  commentRateLimited: label(
    'You have submitted several comments recently. Please try again later.',
    'Sie haben in letzter Zeit mehrere Kommentare gesendet. Bitte versuchen Sie es später erneut.',
    'Vous avez envoyé plusieurs commentaires récemment. Veuillez réessayer plus tard.',
  ),
  commentReply: label('Reply', 'Antworten', 'Répondre'),
  commentReplyingTo: label('Replying to {name}', 'Antwort an {name}', 'Réponse à {name}'),
  commentCancelReply: label('Cancel', 'Abbrechen', 'Annuler'),
  commentLoadMore: label('Load more comments', 'Weitere Kommentare laden', 'Charger plus de commentaires'),
  commentRequired: label(
    'Please check the required fields.',
    'Bitte prüfen Sie die Pflichtfelder.',
    'Veuillez vérifier les champs obligatoires.',
  ),
};

export function t(key, lang) {
  const entry = strings[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}

export function commentCountLabel(count, lang) {
  const total = Number(count) || 0;
  const key = total === 1 ? 'commentCountOne' : 'commentCountMany';
  return t(key, lang).replace('{n}', String(total));
}

/** Date and time, always in UTC so every reader sees the same timestamp. */
export function formatDateTime(iso, lang) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(INTL_LOCALE[lang] || 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDate(iso, lang) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(INTL_LOCALE[lang] || 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function articlePath(article) {
  return `/blog/${article.lang}/${article.slug}/`;
}

export function listingPath(lang) {
  return lang === 'en' ? '/blog/' : `/blog/${lang}/`;
}

export function categoryPath(lang, slug) {
  return `${listingPath(lang)}category/${slug}/`;
}

/* ------------------------------------------------------------------ shell */

const NAV = [
  { key: 'navHome', href: '/' },
  { key: 'navSolutions', href: '/#solutions' },
  { key: 'navServices', href: '/#services' },
  { key: 'navProjects', href: '/#projects' },
  { key: 'navTechnologies', href: '/#technologies' },
  { key: 'navAbout', href: '/#about' },
  { key: 'navBlog', href: '/blog/' },
  { key: 'navContact', href: '/#contact' },
];

/**
 * Languages that actually have published content. The header never links to a
 * language hub that does not exist, so an unreviewed translation cannot show
 * up as a broken link.
 */
let availableLangs = LANGS.slice();

export function setAvailableLangs(langs) {
  const filtered = LANGS.filter((code) => (langs || []).includes(code));
  availableLangs = filtered.length ? filtered : ['en'];
}

/** The languages with published content, as set by the last render. */
export function getAvailableLangs() {
  return availableLangs.slice();
}

/**
 * Content hash of the blog assets, appended to their URLs. The asset names are
 * not fingerprinted, so without this a CDN in front of the site can keep serving
 * an old blog.js (or a cached 404) after a deploy. Set once per render.
 */
let assetVersion = '';

export function setAssetVersion(version) {
  assetVersion = String(version || '').replace(/[^a-z0-9]/gi, '').slice(0, 12);
}

export function getAssetVersion() {
  return assetVersion;
}

/**
 * Category labels are editorial data from WordPress, but the taxonomy is shared
 * across languages: a category route is /blog/<lang>/category/<slug>/, so the
 * slug must stay identical while the visible label follows the page language.
 * Only terms that appear on published or in-review articles need an entry; any
 * other term falls back to the name WordPress sends.
 */
const CATEGORY_LABELS = {
  'cybersecurity-monitoring': {
    en: 'Cybersecurity & Monitoring',
    de: 'Cybersicherheit & Monitoring',
    fr: 'Cybersécurité et supervision',
  },
  'security-automation': {
    en: 'Security Automation',
    de: 'Sicherheitsautomatisierung',
    fr: 'Automatisation de la sécurité',
  },
  'devops-cloud-infrastructure': {
    en: 'DevOps & Cloud Infrastructure',
    de: 'DevOps & Cloud-Infrastruktur',
    fr: 'DevOps et infrastructure cloud',
  },
  'email-security': {
    en: 'Email security',
    de: 'E-Mail-Sicherheit',
    fr: 'Sécurité des e-mails',
  },
};

export function categoryLabel(slug, fallback, lang) {
  const entry = CATEGORY_LABELS[String(slug || '').toLowerCase()];
  if (entry && entry[lang]) return entry[lang];
  const name = typeof fallback === 'string' ? fallback.trim() : '';
  return name || String(slug || '');
}

/**
 * Human label for a translation state. The four states are deliberately
 * distinct: only "available" ever becomes a link to another article.
 */
export function translationStateLabel(state, lang) {
  const key =
    {
      current: 'currentLanguage',
      available: 'translationStateAvailable',
      missing: 'translationStateMissing',
      unpublished: 'translationStateUnpublished',
      unavailable: 'translationStateUnavailable',
    }[state] || 'translationStateMissing';
  return t(key, lang);
}

/**
 * Language switcher entries for one article.
 *
 * A translation is offered as a link only when the receiver actually holds a
 * published article in that language for the same translation group. Every
 * other state resolves to the language hub — never to a guessed URL.
 */
export function articleLangLinks(article) {
  const published = new Map();
  for (const tr of article.translations || []) {
    if (!published.has(tr.lang)) published.set(tr.lang, tr);
  }
  const declared = article.translationStates || {};

  return LANGS.map((code) => {
    if (code === article.lang) {
      return { code, href: articlePath(article), state: 'current' };
    }
    const sibling = published.get(code);
    if (sibling) {
      return { code, href: `/blog/${code}/${sibling.slug}/`, state: 'available' };
    }
    // WordPress knows the sibling but it is not public yet: in preparation.
    if (declared[code] === 'unpublished') {
      return { code, href: listingPath(code), state: 'unpublished' };
    }
    // WordPress says it is published but the receiver has no rendered copy
    // (removed, rejected or still being rebuilt): temporarily unavailable.
    if (declared[code] === 'unavailable') {
      return { code, href: listingPath(code), state: 'unavailable' };
    }
    return { code, href: listingPath(code), state: 'missing' };
  });
}

export function headerHtml(lang, activePath, langLinks = null) {
  const nav = NAV.map((item) => {
    const active = item.href === activePath ? ' aria-current="page"' : '';
    return `<a href="${item.href}"${active}>${e(t(item.key, lang))}</a>`;
  }).join('');

  // Listing pages only link to hubs that exist; article pages pass their own
  // entries so every language state is visible, including "not available".
  const hubs = getAvailableLangs();
  const entries = langLinks || (hubs.includes(lang) ? hubs : [lang, ...hubs]).map((code) => ({
    code,
    href: code === lang ? activePath : langSwitchTarget(code, activePath),
    state: code === lang ? 'current' : 'available',
  }));
  const langSwitch = entries.map((entry) => {
    const current = entry.state === 'current' ? ' aria-current="true"' : '';
    const state = entry.state === 'available' || entry.state === 'current' ? '' : ` data-state="${entry.state}"`;
    const note = entry.state === 'available' || entry.state === 'current'
      ? ''
      : ` title="${e(`${LANG_LABEL[entry.code] || entry.code} — ${translationStateLabel(entry.state, lang)}`)}"`;
    // hreflang describes the document actually behind the link, so it is only
    // emitted for a real translated article (or the current page itself). A
    // hub link is not a translation and must not look like one.
    const hreflang = entry.state === 'available' || entry.state === 'current' ? ` hreflang="${entry.code}"` : '';
    return `<a href="${entry.href}"${hreflang} lang="${entry.code}"${current}${state}${note}>${entry.code.toUpperCase()}</a>`;
  }).join('');

  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="EL0M AI Engineer — home">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="brand-text">EL0M<span class="brand-dot">.</span>AI</span>
    </a>
    <nav class="site-nav" aria-label="Main navigation">${nav}</nav>
    <div class="header-right">
      <div class="lang-switch" role="group" aria-label="${e(t('languageNotice', lang))}">${langSwitch}</div>
      <a class="btn btn-ghost btn-small" href="https://www.freelancer.com/u/eakakpovi656" target="_blank" rel="noopener noreferrer" data-event="freelancer_profile_click" data-location="header">${e(t('navFreelancer', lang))}</a>
    </div>
  </div>
</header>`;
}

export function langSwitchTarget(code, activePath) {
  const blog = /^\/blog\/(de|fr)\//.exec(activePath);
  if (activePath === '/blog/' || blog) return listingPath(code);
  return listingPath(code);
}

export function footerHtml(lang) {
  const year = new Date().getUTCFullYear();
  return `<footer class="site-footer">
  <div class="wrap footer-inner">
    <div class="footer-brand">
      <span class="brand-text">EL0M<span class="brand-dot">.</span>AI</span>
      <p>AI engineering · full-stack development · infrastructure</p>
    </div>
    <nav class="footer-links" aria-label="Footer">
      <a href="/">${e(t('breadcrumbHome', lang))}</a>
      <a href="/blog/">${e(t('blog', lang))}</a>
      <a href="/#projects">${e(t('navProjects', lang))}</a>
      <a href="/#contact">${e(t('navContact', lang))}</a>
      <a href="/privacy/">${e(t('privacy', lang))}</a>
    </nav>
    <p class="footer-note">© ${year} Elom Akakpovi · Worms, Germany</p>
  </div>
</footer>`;
}

/**
 * First-party Matomo bootstrap. Tracking is limited to the production host and
 * honours the visitor's opt-out stored by /privacy/.
 */
export function analyticsHtml({ siteId, canonical, eventLabel, eventAction }) {
  const payload = JSON.stringify({
    siteId: String(siteId || '1'),
    canonical: canonical || '',
    action: eventAction || '',
    label: eventLabel || '',
  });
  return `<script>
(function () {
  var cfg = ${payload};
  var host = location.hostname;
  if (host !== 'elomaiapp.com' && host !== 'www.elomaiapp.com') return;
  try { if (localStorage.getItem('elomai_analytics_optout') === '1') return; } catch (err) {}
  window._paq = window._paq || [];
  var _paq = window._paq;
  _paq.push(['disableCookies']);
  _paq.push(['setTrackerUrl', 'https://elomaiapp.com/matomo/matomo.php']);
  _paq.push(['setSiteId', cfg.siteId]);
  if (cfg.canonical) _paq.push(['setCustomUrl', cfg.canonical]);
  _paq.push(['setDocumentTitle', document.title]);
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  if (cfg.action) _paq.push(['trackEvent', 'content', cfg.action, cfg.label]);
  var g = document.createElement('script');
  g.async = true; g.src = 'https://elomaiapp.com/matomo/matomo.js';
  document.head.appendChild(g);
  window.elomaiTrack = function (category, action, label) {
    if (!window._paq) return;
    window._paq.push(['trackEvent', category, action, label || '']);
  };
})();
</script>`;
}

export function pageShell({
  lang,
  title,
  ogTitle,
  description,
  canonical,
  alternates,
  ogImage,
  ogType = 'website',
  jsonLd,
  robots,
  bodyClass,
  content,
  siteId,
  analyticsAction,
  analyticsLabel,
}) {
  const altTags = (alternates || [])
    .map((alt) => `<link rel="alternate" hreflang="${alt.hreflang}" href="${e(alt.href)}" />`)
    .join('\n    ');

  const jsonLdBlocks = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [])
    .map((block) => `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</script>`)
    .join('\n    ');

  const og = resolveOgImage(ogImage, title);
  const socialTitle = ogTitleFor(ogTitle, title);
  const assetQuery = assetVersion ? `?v=${assetVersion}` : '';
  const dimensions = og.width > 0 && og.height > 0
    ? `\n    <meta property="og:image:width" content="${og.width}" />\n    <meta property="og:image:height" content="${og.height}" />`
    : '';
  const imageType = og.type ? `\n    <meta property="og:image:type" content="${e(og.type)}" />` : '';

  return `<!doctype html>
<html lang="${HTML_LANG[lang] || 'en'}">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${e(title)}</title>
    <meta name="description" content="${e(description)}" />
    <link rel="canonical" href="${e(canonical)}" />
    ${altTags}
    <meta name="robots" content="${e(robots || 'index, follow, max-image-preview:large')}" />
    <meta name="author" content="Elom Akakpovi" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="EL0M AI ENGINEER" />
    <meta property="og:locale" content="${OG_LOCALE[lang] || 'en_US'}" />
    <meta property="og:url" content="${e(canonical)}" />
    <meta property="og:title" content="${e(socialTitle)}" />
    <meta property="og:description" content="${e(description)}" />
    <meta property="og:image" content="${e(og.url)}" />${dimensions}${imageType}
    <meta property="og:image:alt" content="${e(og.alt || title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${e(socialTitle)}" />
    <meta name="twitter:description" content="${e(description)}" />
    <meta name="twitter:image" content="${e(og.url)}" />
    <meta name="twitter:image:alt" content="${e(og.alt || title)}" />
    <meta name="theme-color" content="#020817" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" />
    <link rel="stylesheet" href="/blog/assets/blog.css${assetQuery}" />
    ${jsonLdBlocks}
    ${analyticsHtml({ siteId, canonical, eventAction: analyticsAction, eventLabel: analyticsLabel })}
</head>
<body class="${bodyClass || ''}">
${content}
<script src="/blog/assets/blog.js${assetQuery}" defer></script>
</body>
</html>`;
}
