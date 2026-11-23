import {
  COMMENT_STATUS,
  PAGE_SIZE,
  createCommentLimiter,
  validateSubmission,
} from './comments.mjs';
import { verifyRequest, COMMENT_SCOPE } from './auth.mjs';

/**
 * Comment HTTP API.
 *
 * Public (no signature, same origin, rate limited, honeypot):
 *   POST /comments/v1/submit   visitor submission
 *   GET  /comments/v1/list     approved comments only
 *
 * Authenticated WordPress channel (HMAC, derived scope key, replay protected):
 *   POST /comments/v1/wp       pending | ack | status | publish | prune | stats
 *
 * The receiver never connects to WordPress. WordPress is always the client.
 */

const MAX_BODY = 32 * 1024;
const MAX_COMMENT_JSON = 16 * 1024;

const DEFAULT_ORIGINS = ['https://elomaiapp.com', 'https://www.elomaiapp.com'];

function allowedOrigins(env = process.env) {
  const configured = String(env.ELOMAI_COMMENT_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const list = configured.length ? configured : DEFAULT_ORIGINS.slice();
  // Loopback is only ever accepted for local previews and tests.
  list.push('http://127.0.0.1:8098', 'http://localhost:8098', 'http://127.0.0.1:8081', 'http://localhost:8081');
  return list;
}

function originAllowed(origin, env) {
  if (!origin) return true; // non-browser clients carry no Origin; CSRF needs a browser
  return allowedOrigins(env).includes(String(origin).replace(/\/$/, ''));
}

export function readLimitedBody(req, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        // Stop buffering but let the response go out: destroying the socket
        // here would turn a clear 413 into a connection reset.
        chunks.length = 0;
        req.removeAllListeners('data');
        req.resume();
        reject(Object.assign(new Error('payload_too_large'), { status: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseBody(raw, contentType) {
  const type = String(contentType || '').toLowerCase();
  if (type.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  if (!type.includes('application/json')) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function truncate(value, max) {
  return String(value == null ? '' : value).slice(0, max);
}

/**
 * @param {object} deps
 * @param {object} deps.comments comment store
 * @param {object} deps.store    article store (article identifiers)
 * @param {function} deps.rerender rebuild public pages
 */
export function createCommentApi({ comments, store, rerender, secret = '', env = process.env, now = Date.now }) {
  const limiter = createCommentLimiter({
    perHour: Number(env.ELOMAI_COMMENT_RATE_HOUR || 5),
    perDay: Number(env.ELOMAI_COMMENT_RATE_DAY || 20),
    now,
  });
  const JSON_HEADERS = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  };

  function json(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, { ...JSON_HEADERS, 'content-length': Buffer.byteLength(payload) });
    res.end(payload);
  }

  /** Published article lookup. Unknown, unpublished and disabled all differ. */
  function findArticle(value) {
    const uuid = truncate(value, 64).toLowerCase();
    if (!/^[a-z0-9-]{8,64}$/.test(uuid)) return { error: 'article_invalid' };
    const article = store.get(uuid);
    if (!article || article.status !== 'publish') return { error: 'article_unknown' };
    return { article };
  }

  function clientIp(req) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return forwarded || req.socket.remoteAddress || 'unknown';
  }

  /* ------------------------------------------------------------- public */

  async function handleSubmit(req, res) {
    if (!originAllowed(req.headers.origin, env)) {
      return json(res, 403, { ok: false, error: 'origin_not_allowed' });
    }

    let raw = '';
    try {
      raw = await readLimitedBody(req);
    } catch (err) {
      return json(res, err.status || 400, { ok: false, error: 'request_too_large' });
    }

    const body = parseBody(raw, req.headers['content-type']);
    if (!body) return json(res, 415, { ok: false, error: 'unsupported_content_type' });

    const ip = clientIp(req);

    // Honeypot and submission timing: a real visitor needs several seconds and
    // never fills a field that is invisible to humans.
    if (truncate(body.website, 200).trim() !== '') {
      await comments.reject({ articleUuid: truncate(body.article, 64), reason: 'honeypot' });
      return json(res, 202, { ok: true, status: 'received' });
    }
    const elapsed = Number(body.elapsed);
    if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 2) {
      await comments.reject({ articleUuid: truncate(body.article, 64), reason: 'too_fast' });
      return json(res, 202, { ok: true, status: 'received' });
    }

    const found = findArticle(body.article);
    if (found.error) {
      // Generic answer: a visitor cannot probe which identifiers exist.
      return json(res, found.error === 'article_invalid' ? 400 : 404, { ok: false, error: 'article_unavailable' });
    }
    if (found.article.commentsEnabled === false) {
      return json(res, 403, { ok: false, error: 'comments_disabled' });
    }

    const parsed = validateSubmission(body);
    if (parsed.errors.length) {
      const messages = parsed.errors.map((code) =>
        code.startsWith('email') ? 'email_invalid' : code.startsWith('content') ? 'content_invalid' : 'name_invalid',
      );
      return json(res, 422, { ok: false, error: 'validation_failed', fields: [...new Set(messages)] });
    }

    if (truncate(raw, MAX_COMMENT_JSON).length !== raw.length) {
      return json(res, 413, { ok: false, error: 'request_too_large' });
    }

    const limit = limiter(ip);
    if (!limit.allowed) {
      return json(res, 429, { ok: false, error: 'rate_limited', retryAfter: 3600 });
    }

    let parentId = null;
    if (body.parent) {
      const parent = comments.get(truncate(body.parent, 40));
      if (!parent || parent.articleUuid !== found.article.uuid || parent.status !== COMMENT_STATUS.APPROVED) {
        return json(res, 422, { ok: false, error: 'parent_unavailable' });
      }
      // Two levels only: a reply to a reply hangs off the same root.
      parentId = parent.parentId || parent.id;
    }

    const result = await comments.submit({
      articleUuid: found.article.uuid,
      lang: found.article.lang,
      slug: found.article.slug,
      name: parsed.name,
      email: parsed.email,
      content: parsed.content,
      parentId,
      ip,
      idempotencyKey: truncate(body.idempotencyKey, 120),
      userAgent: truncate(req.headers['user-agent'], 200),
    });

    if (result.duplicate) {
      return json(res, 200, { ok: true, id: result.comment.id, status: 'received', duplicate: true });
    }

    // Anything that is not obviously acceptable waits for a human.
    const published = result.comment.status === COMMENT_STATUS.APPROVED;
    const responseStatus = /form-urlencoded/i.test(String(req.headers['content-type']))
      ? 303
      : 202;
    if (responseStatus === 303) {
      const target = `/blog/${found.article.lang}/${found.article.slug}/#comments`;
      res.writeHead(303, { location: target, 'cache-control': 'no-store' });
      return res.end();
    }
    return json(res, responseStatus, {
      ok: true,
      id: result.comment.id,
      status: published ? 'approved' : 'awaiting_moderation',
    });
  }

  function handleList(req, res, url) {
    const found = findArticle(url.searchParams.get('article'));
    if (found.error) return json(res, 404, { ok: false, error: 'article_unavailable' });
    if (found.article.commentsEnabled === false) {
      return json(res, 200, { ok: true, comments: [], total: 0, nextCursor: null, enabled: false });
    }

    const page = comments.pageApproved(found.article.uuid, {
      cursor: Number(url.searchParams.get('cursor') || 0),
      limit: Number(url.searchParams.get('limit') || PAGE_SIZE),
    });

    return json(res, 200, {
      ok: true,
      enabled: true,
      total: page.total,
      nextCursor: page.nextCursor,
      comments: page.comments,
    });
  }

  /* --------------------------------------------------- WordPress channel */

  async function handleWordPress(req, res) {
    let raw = '';
    try {
      raw = await readLimitedBody(req);
    } catch (err) {
      return json(res, err.status || 400, { ok: false, error: 'request_too_large' });
    }

    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method_not_allowed' });

    // Same HMAC convention as the article channel, with a derived key so the
    // two directions never share one usable credential.
    const auth = verifyRequest({ headers: req.headers, rawBody: raw, secret, scope: COMMENT_SCOPE });
    if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.error });

    const body = parseBody(raw, req.headers['content-type'] || 'application/json');
    if (!body) return json(res, 400, { ok: false, error: 'invalid_json' });

    let changed = 0;
    switch (body.operation) {
      case 'pending': {
        // A pull is a read: it must not rebuild the public pages.
        const rows = comments.pending({ limit: body.limit });
        return json(res, 200, {
          ok: true,
          comments: rows.map((comment) => ({
            id: comment.id,
            articleUuid: comment.articleUuid,
            parentId: comment.parentId,
            lang: comment.lang,
            slug: comment.slug,
            author: comment.author,
            email: comment.email,
            content: comment.content,
            createdAt: comment.createdAt,
            classification: comment.classification,
          })),
          stats: comments.stats(),
        });
      }
      case 'ack': {
        const applied = await comments.acknowledge({ entries: body.comments });
        changed = applied.length;
        break;
      }
      case 'status': {
        const applied = await comments.applyStatus({ updates: body.updates });
        changed = applied.length;
        break;
      }
      case 'publish': {
        const input = body.comment || {};
        const found = findArticle(input.articleUuid);
        if (found.error) return json(res, 404, { ok: false, error: 'article_unavailable' });
        const result = await comments.publishLocal({
          articleUuid: found.article.uuid,
          parentId: input.parentId ? truncate(input.parentId, 40) : null,
          authorName: input.authorName,
          content: input.content,
          createdAt: input.createdAt,
          externalId: truncate(input.externalId, 80),
        });
        changed = result && result.created ? 1 : 0;
        break;
      }
      case 'prune': {
        const result = await comments.prune({});
        changed = result.removed;
        break;
      }
      case 'stats':
        return json(res, 200, { ok: true, stats: comments.stats() });
      default:
        return json(res, 400, { ok: false, error: 'unknown_operation' });
    }

    if (changed) {
      try {
        await rerender();
      } catch (err) {
        // A failed re-render must not roll back a stored moderation decision.
        console.error('[comments] render failed:', err && err.message ? err.message : 'unknown');
      }
    }

    return json(res, 200, { ok: true, changed, stats: comments.stats() });
  }

  /** Returns true when the request was handled. */
  async function handle(req, res, url) {
    const route = url.pathname.replace(/\/+$/, '');
    if (route === '/comments/v1/submit' && req.method === 'POST') {
      await handleSubmit(req, res);
      return true;
    }
    if (route === '/comments/v1/list' && req.method === 'GET') {
      handleList(req, res, url);
      return true;
    }
    if (route === '/comments/v1/wp') {
      await handleWordPress(req, res);
      return true;
    }
    return false;
  }

  return { handle, handleSubmit, handleList, handleWordPress };
}
