import crypto from 'node:crypto';

/**
 * Request authentication for the WordPress -> receiver channel.
 *
 * Each request carries:
 *   X-Elomai-Timestamp : unix seconds
 *   X-Elomai-Nonce     : random hex (16-64 chars)
 *   X-Elomai-Signature : hex HMAC-SHA256(secret, `${timestamp}.${nonce}.${rawBody}`)
 *
 * The secret is a shared 64-hex-character value generated on the WordPress
 * side and configured here through the environment. It is never part of a
 * request body, a URL or a log line.
 */

const MAX_SKEW_SECONDS = 300;

export function secretFromEnv(env = process.env) {
  const direct = (env.ELOMAI_SYNC_SECRET || '').trim();
  if (direct) return direct;
  return '';
}

const seenNonces = new Map(); // nonce -> { bodyHash, at }

function pruneNonces(nowSeconds) {
  for (const [nonce, meta] of seenNonces) {
    if (nowSeconds - meta.at > MAX_SKEW_SECONDS * 4) seenNonces.delete(nonce);
  }
  if (seenNonces.size > 5000) {
    const ordered = [...seenNonces.entries()].sort((a, b) => a[1].at - b[1].at);
    for (const [nonce] of ordered.slice(0, seenNonces.size - 4000)) seenNonces.delete(nonce);
  }
}

function safeEqualHex(a, b) {
  const left = Buffer.from(String(a), 'hex');
  const right = Buffer.from(String(b), 'hex');
  if (left.length === 0 || right.length === 0 || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function verifyRequest({ headers, rawBody, secret, now = Date.now() }) {
  if (!secret || secret.length < 32) {
    return { ok: false, status: 503, error: 'receiver_secret_not_configured' };
  }

  const timestamp = headers['x-elomai-timestamp'];
  const nonce = headers['x-elomai-nonce'];
  const signature = headers['x-elomai-signature'];

  if (!timestamp || !nonce || !signature) {
    return { ok: false, status: 401, error: 'missing_signature_headers' };
  }
  if (!/^\d{10,13}$/.test(String(timestamp))) {
    return { ok: false, status: 401, error: 'invalid_timestamp' };
  }
  if (!/^[a-f0-9]{16,64}$/i.test(String(nonce))) {
    return { ok: false, status: 401, error: 'invalid_nonce' };
  }

  const ts = Number(timestamp);
  const nowSeconds = Math.floor(now / 1000);
  if (Math.abs(nowSeconds - ts) > MAX_SKEW_SECONDS) {
    return { ok: false, status: 401, error: 'timestamp_out_of_window' };
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${ts}.${nonce}.${rawBody}`)
    .digest('hex');

  if (!safeEqualHex(expected, signature)) {
    return { ok: false, status: 401, error: 'invalid_signature' };
  }

  const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  const previous = seenNonces.get(String(nonce));
  if (previous && previous.bodyHash !== bodyHash) {
    return { ok: false, status: 401, error: 'nonce_reused' };
  }
  seenNonces.set(String(nonce), { bodyHash, at: ts });
  pruneNonces(nowSeconds);

  return { ok: true, bodyHash };
}

/** Small fixed-window limiter: protects the endpoint from runaway retry loops. */
export function createRateLimiter({ windowMs = 60_000, max = 120, now = Date.now } = {}) {
  const hits = new Map();
  return function allow(key) {
    const t = now();
    const entry = hits.get(key);
    if (!entry || t - entry.start > windowMs) {
      hits.set(key, { start: t, count: 1 });
      return { allowed: true, remaining: max - 1 };
    }
    entry.count += 1;
    if (entry.count > max) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: max - entry.count };
  };
}
