import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'h2', 'h3', 'h4',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'small',
  'ul', 'ol', 'li',
  'blockquote', 'cite',
  'pre', 'code', 'kbd', 'samp',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'figure', 'figcaption', 'img',
  'a', 'sup', 'sub',
  'dl', 'dt', 'dd',
  'div', 'span',
  'iframe', 'details', 'summary',
];

const ALLOWED_IFRAME_HOSTS = [
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'www.youtube.com',
  'youtube.com',
  'player.vimeo.com',
];

/**
 * YouTube is always rewritten to the no-cookie host so an accepted embed does
 * not set advertising cookies before the visitor presses play.
 */
function privacyEmbedHost(src) {
  try {
    const url = new URL(src);
    if (/(^|\.)youtube(-nocookie)?\.com$/.test(url.hostname)) {
      url.hostname = 'www.youtube-nocookie.com';
      return url.toString();
    }
    return src;
  } catch {
    return src;
  }
}

/**
 * Article HTML comes from the WordPress editor (an authenticated
 * administrator), but the public renderer must still not trust it: the body
 * is sanitised again here so a compromised or careless editor cannot inject
 * scripts, inline handlers, styles or arbitrary frames into the static pages.
 */
export function sanitizeArticleHtml(html) {
  return sanitizeHtml(String(html || ''), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
      iframe: ['src', 'title', 'width', 'height', 'loading', 'allow', 'allowfullscreen', 'frameborder', 'referrerpolicy'],
      h2: ['id'],
      h3: ['id'],
      h4: ['id'],
      code: ['class'],
      pre: ['class'],
      div: ['class'],
      span: ['class'],
      figure: ['class'],
      table: ['class'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
      li: ['class'],
    },
    allowedClasses: {
      code: ['language-*'],
      pre: ['language-*', 'wp-block-code', 'highlight'],
      div: ['embed', 'embed-video', 'table-wrap', 'callout'],
      span: ['kbd'],
      figure: ['wp-block-image', 'wp-block-embed', 'gallery', 'gallery-item'],
      table: ['table', 'is-style-stripes'],
      li: ['task-list-item'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    allowedIframeHosts: ALLOWED_IFRAME_HOSTS,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        const external = /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?elomaiapp\.com/i.test(href);
        const next = { ...attribs };
        if (external) {
          next.rel = 'noopener noreferrer';
          next.target = '_blank';
        } else if (href.startsWith('http')) {
          delete next.target;
        }
        return { tagName, attribs: next };
      },
      img: (tagName, attribs) => {
        const next = { ...attribs };
        next.loading = 'lazy';
        next.decoding = 'async';
        if (!next.alt) next.alt = '';
        return { tagName, attribs: next };
      },
      iframe: (tagName, attribs) => {
        const next = { ...attribs };
        if (next.src) next.src = privacyEmbedHost(next.src);
        next.loading = 'lazy';
        next.referrerpolicy = 'strict-origin-when-cross-origin';
        return { tagName, attribs: next };
      },
    },
    exclusiveFilter: (frame) => frame.tag === 'iframe' && !frame.attribs.src,
  });
}

/** Converts text to a safe heading id. */
export function headingId(text, used = new Set()) {
  const base = String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'section';
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n++}`;
  }
  used.add(id);
  return id;
}

/** Adds stable ids to h2/h3 and returns the table of contents. */
export function buildTableOfContents(html) {
  const used = new Set();
  const toc = [];
  const withIds = String(html).replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    if (!text) return match;
    const existing = /id="([^"]+)"/.exec(attrs);
    const id = existing && !used.has(existing[1]) ? existing[1] : headingId(text, used);
    used.add(id);
    toc.push({ level: Number(level), id, text });
    const cleanAttrs = attrs.replace(/\sid="[^"]*"/g, '');
    return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
  });
  return { html: withIds, toc };
}

/** Plain text used for reading time, search and meta descriptions. */
export function htmlToText(html) {
  return sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

export function readingMinutes(html) {
  const words = htmlToText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
