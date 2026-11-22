import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

import { verifyRequest, secretFromEnv, createRateLimiter } from './lib/auth.mjs';
import { createStore } from './lib/store.mjs';
import { normalizeArticle, renderAll, ValidationError } from './lib/render.mjs';

const PORT = Number(process.env.PORT || 8080);
const DATA_DIR = process.env.DATA_DIR || '/data';
const PUBLIC_DIR = path.join(DATA_DIR, 'public');
const SITE_ID = process.env.MATOMO_SITE_ID || '1';
const STATIC_LASTMOD = process.env.STATIC_LASTMOD || new Date().toISOString().slice(0, 10);
const MAX_BODY_BYTES = 30 * 1024 * 1024;

const secret = secretFromEnv();
const store = createStore(DATA_DIR);
const allow = createRateLimiter({ max: 120 });
let ready = false;
let lastRender = null;

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('payload_too_large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function clientKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress || 'unknown';
}

async function handleUpsert(req, res, rawBody) {
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json(res, 400, { ok: false, error: 'invalid_json' });
  }

  const idempotencyKey = typeof payload.idempotencyKey === 'string' ? payload.idempotencyKey.slice(0, 160) : '';
  if (!idempotencyKey) return json(res, 400, { ok: false, error: 'idempotency_key_required' });

  const previous = store.getIdempotency(idempotencyKey);
  if (previous) {
    return json(res, 200, {
      ok: true,
      duplicate: true,
      uuid: previous.uuid,
      version: previous.version,
      url: `/blog/${previous.lang}/${previous.slug}/`,
      message: 'already_synchronized',
    });
  }

  const operation = payload.operation === 'unpublish' ? 'unpublish' : 'upsert';

  if (operation === 'unpublish') {
    const uuid = String(payload.uuid || '').toLowerCase();
    const article = store.get(uuid);
    if (!article) {
      return json(res, 404, { ok: false, error: 'article_unknown', uuid });
    }
    const unpublished = {
      ...article,
      status: 'unpublish',
      version: Math.max(Number(payload.version) || 0, Number(article.version) || 0) + 1,
      unpublishedAt: new Date().toISOString(),
      syncedAt: new Date().toISOString(),
    };
    await store.saveArticle(unpublished, idempotencyKey, { operation: 'unpublish' });
    lastRender = await renderAll({ store, publicDir: PUBLIC_DIR, siteId: SITE_ID, staticLastmod: STATIC_LASTMOD });
    return json(res, 200, {
      ok: true,
      uuid,
      version: unpublished.version,
      unpublished: true,
      url: `/blog/${article.lang}/${article.slug}/`,
      renderedAt: lastRender.generatedAt,
    });
  }

  let article;
  try {
    article = await normalizeArticle(payload.article || {}, { publicDir: PUBLIC_DIR, siteId: SITE_ID });
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 422, { ok: false, error: 'validation_failed', errors: err.errors });
    }
    throw err;
  }

  await store.saveArticle(article, idempotencyKey, { operation: 'upsert' });
  lastRender = await renderAll({ store, publicDir: PUBLIC_DIR, siteId: SITE_ID, staticLastmod: STATIC_LASTMOD });

  return json(res, 200, {
    ok: true,
    uuid: article.uuid,
    version: article.version,
    status: article.status,
    lang: article.lang,
    slug: article.slug,
    url: `/blog/${article.lang}/${article.slug}/`,
    publicUrl: `https://elomaiapp.com/blog/${article.lang}/${article.slug}/`,
    articles: lastRender.articles,
    renderedAt: lastRender.generatedAt,
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://receiver');
  const route = url.pathname.replace(/\/+$/, '') || '/';

  if (route === '/health' && req.method === 'GET') {
    const articles = store.list();
    return json(res, ready ? 200 : 503, {
      ok: ready,
      service: 'elomai-content-receiver',
      articles: articles.filter((a) => a.status === 'publish').length,
      stored: articles.length,
      lastRender: lastRender ? lastRender.generatedAt : null,
      secretConfigured: Boolean(secret),
      uptimeSeconds: Math.round(process.uptime()),
    });
  }

  if (route !== '/v1/sync') {
    return json(res, 404, { ok: false, error: 'not_found' });
  }

  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  const limit = allow(clientKey(req));
  if (!limit.allowed) {
    return json(res, 429, { ok: false, error: 'rate_limited' });
  }

  let rawBody = '';
  try {
    rawBody = await readBody(req);
  } catch (err) {
    return json(res, err.status || 400, { ok: false, error: err.message });
  }

  const auth = verifyRequest({ headers: req.headers, rawBody, secret });
  if (!auth.ok) {
    // Deliberately terse: never echo the expected signature or the secret.
    return json(res, auth.status, { ok: false, error: auth.error });
  }

  try {
    return await handleUpsert(req, res, rawBody);
  } catch (err) {
    console.error('[sync-error]', err && err.message ? err.message : 'unknown');
    return json(res, 500, { ok: false, error: 'internal_error' });
  }
});

async function bootstrap() {
  await store.init();
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  lastRender = await renderAll({ store, publicDir: PUBLIC_DIR, siteId: SITE_ID, staticLastmod: STATIC_LASTMOD });
  ready = true;
  console.log(`[receiver] ready articles=${lastRender.articles} data=${DATA_DIR} secret=${secret ? 'set' : 'MISSING'}`);
}

bootstrap()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => console.log(`[receiver] listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('[receiver] bootstrap failed:', err && err.message);
    process.exit(1);
  });

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
