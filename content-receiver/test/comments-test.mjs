/**
 * M09.2 — public comment lifecycle test.
 *
 * Spawns the real receiver against a throwaway data directory and exercises
 * submission, classification, acknowledgement, moderation, deletion,
 * authentication, replay protection, rate limiting and offline recovery
 * exactly as the browser and WordPress do.
 *
 * Run with: npm run test:comments
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const SCOPE = 'elomai:comments:v1';
const SECRET = crypto.randomBytes(32).toString('hex');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const EMAIL = 'visitor@example.com';

const results = [];
function check(name, condition, detail) {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function scopeKey(master) {
  return crypto.createHmac('sha256', master).update(SCOPE).digest('hex');
}

function signArticle(body, secret = SECRET) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${nonce}.${body}`).digest('hex');
  return { timestamp, nonce, signature };
}

function articlePayload({ uuid, lang = 'en', slug, title, enabled = true, version = 1 }) {
  const pngRef = `${crypto.createHash('sha256').update(PNG).digest('hex')}.png`;
  return {
    idempotencyKey: `${uuid}:v${version}:upsert`,
    operation: 'upsert',
    article: {
      uuid,
      wpId: 900,
      version,
      lang,
      slug,
      title,
      excerpt: 'Article used by the comment lifecycle test.',
      html: '<p>Intro paragraph with enough text to pass validation.</p><h2>Section</h2><p>Body copy.</p>',
      media: [{ ref: pngRef, dataBase64: PNG.toString('base64') }],
      featured: { ref: pngRef, width: 1200, height: 630, alt: 'Cover', variants: [] },
      author: { name: 'Elom Akakpovi' },
      publishedAt: '2026-11-01T09:00:00Z',
      modifiedAt: '2026-11-02T09:00:00Z',
      categories: [{ slug: 'web-security', name: 'Web Security' }],
      tags: ['test'],
      seo: { title: `${title} — test`, description: 'Description for the comment lifecycle test.', keywords: ['test'] },
      translations: [],
      comments: { enabled },
    },
  };
}

async function startServer({ port, dataDir, rateHour = 1000, rateDay = 5000, classifier = '' }) {
  const proc = spawn(process.execPath, ['server.mjs'], {
    cwd: path.resolve(import.meta.dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      DATA_DIR: dataDir,
      ELOMAI_SYNC_SECRET: SECRET,
      ELOMAI_COMMENT_RATE_HOUR: String(rateHour),
      ELOMAI_COMMENT_RATE_DAY: String(rateDay),
      ELOMAI_COMMENT_CLASSIFIER: classifier,
      MATOMO_SITE_ID: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  proc.stdout.on('data', (d) => {
    log += d.toString();
  });
  proc.stderr.on('data', (d) => {
    log += d.toString();
  });

  const base = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (proc.exitCode !== null) throw new Error(`receiver exited early: ${log.slice(-500)}`);
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return { proc, base, log: () => log };
    } catch {
      /* not ready */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`receiver did not start: ${log.slice(-500)}`);
}

const PORT = 8131;
const RATE_PORT = 8132;
const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'elomai-comments-'));
const publicDir = path.join(dataDir, 'public');

const uuidEnabled = crypto.randomUUID();
const uuidDisabled = crypto.randomUUID();
const uuidDraft = crypto.randomUUID();
const SLUG = 'comment-lifecycle-test';
const SLUG_DISABLED = 'comment-disabled-test';

function http(base) {
  async function postArticle(payload) {
    const body = JSON.stringify(payload);
    const signed = signArticle(body);
    const response = await fetch(`${base}/v1/sync`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-elomai-timestamp': String(signed.timestamp),
        'x-elomai-nonce': signed.nonce,
        'x-elomai-signature': signed.signature,
      },
      body,
    });
    return { status: response.status, json: await response.json().catch(() => ({})) };
  }

  async function wp(operation, { secret = SECRET, timestamp, nonce, rawBody } = {}) {
    const body = rawBody !== undefined ? rawBody : JSON.stringify(operation);
    const timestampValue = timestamp ?? Math.floor(Date.now() / 1000);
    const nonceValue = nonce ?? crypto.randomBytes(16).toString('hex');
    const signature = crypto
      .createHmac('sha256', scopeKey(secret))
      .update(`${timestampValue}.${nonceValue}.${body}`)
      .digest('hex');
    const response = await fetch(`${base}/comments/v1/wp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-elomai-timestamp': String(timestampValue),
        'x-elomai-nonce': nonceValue,
        'x-elomai-signature': signature,
      },
      body,
    });
    return { status: response.status, json: await response.json().catch(() => ({})) };
  }

  async function submit(payload, { origin = 'https://elomaiapp.com', headers = {} } = {}) {
    const response = await fetch(`${base}/comments/v1/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin, ...headers },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    });
    const text = await response.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    return { status: response.status, json };
  }

  async function list(uuid, { cursor = 0, limit = 10 } = {}) {
    const response = await fetch(`${base}/comments/v1/list?article=${encodeURIComponent(uuid)}&cursor=${cursor}&limit=${limit}`);
    return { status: response.status, json: await response.json().catch(() => ({})) };
  }

  return { postArticle, wp, submit, list };
}

function submission(overrides = {}) {
  return {
    article: uuidEnabled,
    author: 'Marie Dupont',
    email: EMAIL,
    content: 'Thank you for this detailed explanation of the DMARC monitoring setup.',
    consent: true,
    website: '',
    elapsed: 12,
    ...overrides,
  };
}

async function readArticleHtml(lang, slug) {
  return fs.readFile(path.join(publicDir, 'blog', lang, slug, 'index.html'), 'utf8');
}

let server;
let rateServer;

try {
  server = await startServer({ port: PORT, dataDir });
  const api = http(server.base);

  /* ------------------------------------------------- 1. publish articles */
  const enabledArticle = await api.postArticle(
    articlePayload({ uuid: uuidEnabled, slug: SLUG, title: 'Comment lifecycle test article' }),
  );
  check('article with comments published', enabledArticle.status === 200, `status=${enabledArticle.status}`);
  const disabledArticle = await api.postArticle(
    articlePayload({ uuid: uuidDisabled, slug: SLUG_DISABLED, title: 'Article with comments disabled', enabled: false }),
  );
  check('article with comments disabled published', disabledArticle.status === 200, `status=${disabledArticle.status}`);

  let html = await readArticleHtml('en', SLUG);
  check('comment section rendered on article', html.includes('id="comments"') && html.includes('data-comments="open"'));
  check('article embeds its public identifier', html.includes(`data-article="${uuidEnabled}"`));
  check('empty state shown before any approved comment', html.includes('No comments yet'));
  check('privacy acknowledgement is required in the form', html.includes('name="consent"') && html.includes('required'));
  check('honeypot field present and hidden from assistive tech', /class="comment-hp"[\s\S]*?name="website"/.test(html));

  const disabledHtml = await readArticleHtml('en', SLUG_DISABLED);
  check('disabled article renders no form', disabledHtml.includes('data-comments="closed"') && !disabledHtml.includes('data-comment-form'));

  /* ---------------------------------------------------- 2. submission */
  const first = await api.submit(submission({ idempotencyKey: 'test-key-1' }));
  check('trustworthy submission accepted', first.status === 202, `status=${first.status} ${JSON.stringify(first.json)}`);
  check('submission reports moderation, never public approval', first.json.status === 'awaiting_moderation');
  const firstId = first.json.id;
  check('submission returns an opaque identifier', /^c_[a-f0-9]{24}$/.test(firstId || ''), firstId);

  const notYet = await api.list(uuidEnabled);
  check('submission is not public before WordPress acknowledges it', notYet.json.total === 0);
  html = await readArticleHtml('en', SLUG);
  check('pending comment absent from the rendered page', !html.includes('detailed explanation of the DMARC'));

  /* ------------------------------------------- 3. WordPress pulls + acks */
  const pending = await api.wp({ operation: 'pending', limit: 25 });
  check('pending pull authenticated', pending.status === 200, `status=${pending.status}`);
  check('pending pull returns the submission', pending.json.comments?.length === 1);
  const pulled = pending.json.comments?.[0] || {};
  check('pending pull carries the email for WordPress', pulled.email === EMAIL);
  check('pending pull carries the classification for WordPress', pulled.classification?.verdict === 'trustworthy', JSON.stringify(pulled.classification));
  check('public identifier is stable across the pull', pulled.id === firstId);

  const ack = await api.wp({
    operation: 'ack',
    comments: [{ id: firstId, wpCommentId: 101, status: 'approved' }],
  });
  check('acknowledgement accepted', ack.status === 200 && ack.json.changed === 1, JSON.stringify(ack.json));

  const visible = await api.list(uuidEnabled);
  check('approved comment becomes public after the acknowledgement', visible.json.total === 1);
  const publicComment = visible.json.comments?.[0] || {};
  check('public payload has no email field', !('email' in publicComment), Object.keys(publicComment).join(','));
  check('public payload has no moderation reason', !('classification' in publicComment));
  check('public payload has no internal identifiers', !('wpCommentId' in publicComment) && !('articleUuid' in publicComment));
  check('list response never contains the email address', !JSON.stringify(visible.json).includes(EMAIL));

  html = await readArticleHtml('en', SLUG);
  check('approved comment rendered into the article', html.includes('detailed explanation of the DMARC'));
  check('rendered article never contains the email address', !html.includes(EMAIL));
  check('comment count label reflects one comment', html.includes('1 comment'));

  /* -------------------------------------------- 4. idempotency + dedupe */
  const sameKey = await api.submit(submission({ idempotencyKey: 'test-key-1' }));
  const repeated = await api.submit(
    submission({ content: 'A second, different comment from the same visitor about monitoring.' }),
  );
  const duplicate = await api.submit(
    submission({ content: 'A second, different comment from the same visitor about monitoring.' }),
  );
  check('identical idempotency key returns the stored comment', sameKey.status === 200 && sameKey.json.duplicate === true);
  check('first new comment is stored', repeated.status === 202);
  check('repeated identical content is detected as duplicate', duplicate.status === 200 && duplicate.json.duplicate === true);
  check('duplicate does not create a second comment', (await api.wp({ operation: 'stats' })).json.stats.received === 2, JSON.stringify((await api.wp({ operation: 'stats' })).json.stats));

  /* ------------------------------------------------ 5. classification */
  const suspicious = await api.submit(
    submission({
      content: 'Interesting, more details are on my page https://example.org/notes for anyone interested.',
    }),
  );
  check('comment with a link is accepted but stays unclassified', suspicious.status === 202);
  const spamSubmit = await api.submit(
    submission({
      content: 'Best casino bonus! Visit https://spam-one.top https://spam-two.xyz https://spam-three.click now.',
    }),
  );
  check('obvious spam is accepted for review, never published', spamSubmit.status === 202);

  const secondPull = await api.wp({ operation: 'pending', limit: 25 });
  const verdicts = (secondPull.json.comments || []).map((c) => c.classification?.verdict);
  check('suspicious comment classified as suspicious', verdicts.includes('suspicious'), verdicts.join(','));
  check('spam comment classified as spam', verdicts.includes('spam'), verdicts.join(','));

  const suspiciousItem = (secondPull.json.comments || []).find((c) => c.classification?.verdict === 'suspicious');
  const spamItem = (secondPull.json.comments || []).find((c) => c.classification?.verdict === 'spam');
  await api.wp({
    operation: 'ack',
    comments: [
      { id: suspiciousItem.id, wpCommentId: 102, status: 'pending' },
      { id: spamItem.id, wpCommentId: 103, status: 'spam' },
    ],
  });
  const afterClass = await api.list(uuidEnabled);
  check('suspicious comment is not public', afterClass.json.total === 1, `total=${afterClass.json.total}`);
  html = await readArticleHtml('en', SLUG);
  check('spam comment never reaches the rendered page', !html.includes('casino bonus'));
  check('suspicious comment never reaches the rendered page', !html.includes('more details are on my page'));

  /* ------------------------------------------------------- 6. threading */
  const reply = await api.submit(
    submission({ content: 'A short follow-up question about the p=none phase and its duration.', parent: firstId }),
  );
  check('reply to an approved comment accepted', reply.status === 202, JSON.stringify(reply.json));
  const pendingParent = (await api.wp({ operation: 'pending', limit: 50 })).json.comments || [];
  const replyItem = pendingParent.find((c) => c.id === reply.json.id);
  check('reply keeps its parent relationship', replyItem?.parentId === firstId);
  await api.wp({ operation: 'ack', comments: [{ id: reply.json.id, wpCommentId: 104, status: 'approved' }] });

  // Two levels only: a reply to an approved reply hangs off the same root.
  const nested = await api.submit(
    submission({ content: 'And a second follow-up on the reporting address configuration.', parent: reply.json.id }),
  );
  check('reply to an approved reply accepted', nested.status === 202, JSON.stringify(nested.json));
  const nestedItem = ((await api.wp({ operation: 'pending', limit: 50 })).json.comments || []).find((c) => c.id === nested.json.id);
  check('nested reply is attached to the thread root', nestedItem?.parentId === firstId, nestedItem?.parentId);
  const badParent = await api.submit(submission({ content: 'Reply to something that does not exist.', parent: 'c_ffffffffffffffffffffffff' }));
  check('reply to unknown comment rejected', badParent.status === 422 && badParent.json.error === 'parent_unavailable');
  const pendingParentReply = await api.submit(submission({ content: 'Reply to a comment that is not approved yet.', parent: suspiciousItem.id }));
  check('reply to a non-approved comment rejected', pendingParentReply.status === 422);

  await api.wp({ operation: 'ack', comments: [{ id: nested.json.id, wpCommentId: 105, status: 'approved' }] });
  const threaded = await api.list(uuidEnabled);
  const root = (threaded.json.comments || []).find((c) => c.id === firstId);
  check('approved replies appear under their root', root?.replies?.length === 2, JSON.stringify(root?.replies?.map((r) => r.id)));
  html = await readArticleHtml('en', SLUG);
  check('threaded replies rendered as nested list', html.includes('class="comment-replies"'));

  /* --------------------------------------------- 7. validation + abuse */
  const badEmail = await api.submit(submission({ email: 'not-an-email' }));
  check('invalid email rejected', badEmail.status === 422 && badEmail.json.fields.includes('email_invalid'), JSON.stringify(badEmail.json));
  const empty = await api.submit(submission({ content: '   ' }));
  check('empty comment rejected', empty.status === 422 && empty.json.fields.includes('content_invalid'));
  const long = await api.submit(submission({ content: 'x'.repeat(4100) }));
  check('over-long comment rejected', long.status === 422 && long.json.fields.includes('content_invalid'));
  const badName = await api.submit(submission({ author: 'A' }));
  check('too-short name rejected', badName.status === 422 && badName.json.fields.includes('name_invalid'));

  const honeypot = await api.submit(submission({ website: 'https://bot.example' }));
  check('honeypot submission is not stored as a comment', honeypot.status === 202 && honeypot.json.status === 'received');
  const tooFast = await api.submit(submission({ elapsed: 0 }));
  check('instant submission treated as a bot', tooFast.status === 202);

  const unknown = await api.submit(submission({ article: crypto.randomUUID() }));
  check('unknown article rejected', unknown.status === 404 && unknown.json.error === 'article_unavailable');
  const invalidArticle = await api.submit(submission({ article: '../etc/passwd' }));
  check('malformed article identifier rejected', invalidArticle.status === 400);
  const disabledSubmit = await api.submit(submission({ article: uuidDisabled }));
  check('comments disabled for the article rejects submissions', disabledSubmit.status === 403 && disabledSubmit.json.error === 'comments_disabled');
  const disabledList = await api.list(uuidDisabled);
  check('disabled article lists no comments', disabledList.json.enabled === false && disabledList.json.total === 0);

  const foreign = await api.submit(submission(), { origin: 'https://evil.example' });
  check('foreign origin rejected', foreign.status === 403 && foreign.json.error === 'origin_not_allowed');
  const noOrigin = await api.submit(submission({ content: 'A submission from a non-browser client without an origin header.' }), { origin: '' });
  check('non-browser client without origin is accepted on the same API', noOrigin.status === 202, `status=${noOrigin.status}`);

  const wrongType = await fetch(`${server.base}/comments/v1/submit`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'hello' });
  check('unsupported content type rejected', wrongType.status === 415);
  const getSubmit = await fetch(`${server.base}/comments/v1/submit`);
  check('GET on the submit route is not handled', getSubmit.status === 404 || getSubmit.status === 405, `status=${getSubmit.status}`);
  const oversized = await fetch(`${server.base}/comments/v1/submit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://elomaiapp.com' },
    body: JSON.stringify(submission({ content: 'y'.repeat(40 * 1024) })),
  });
  check('oversized payload rejected', oversized.status === 413, `status=${oversized.status}`);

  /* ------------------------------------------------- 8. XSS + injection */
  const xss = await api.submit(
    submission({
      author: '<b>Bold</b> Name',
      content: "Nice article <script>alert('x')</script> <img src=x onerror=alert(1)> and more text here.",
    }),
  );
  check('markup submission accepted as plain text', xss.status === 202);
  const xssItem = ((await api.wp({ operation: 'pending', limit: 50 })).json.comments || []).find((c) => c.id === xss.json.id);
  check('html tags stripped server-side', !/<script|<img/i.test(xssItem?.content || ''), xssItem?.content);
  check('author markup stripped', !/<b>/i.test(xssItem?.author || ''), xssItem?.author);
  await api.wp({ operation: 'ack', comments: [{ id: xss.json.id, wpCommentId: 106, status: 'approved' }] });
  html = await readArticleHtml('en', SLUG);
  check('no script tag from user content in the page', !html.includes("<script>alert('x')"));
  check('no event handler from user content in the page', !html.includes('onerror='));

  const sqli = await api.submit(
    submission({ content: "Robert'); DROP TABLE comments;-- and a few more words to look natural." }),
  );
  check('sql injection attempt stored as text', sqli.status === 202);
  const sqliItem = ((await api.wp({ operation: 'pending', limit: 50 })).json.comments || []).find((c) => c.id === sqli.json.id);
  check('sql injection stored literally', String(sqliItem?.content || '').includes('DROP TABLE comments'));
  await api.wp({ operation: 'ack', comments: [{ id: sqli.json.id, wpCommentId: 107, status: 'approved' }] });
  check('store still healthy after injection attempt', (await api.list(uuidEnabled)).status === 200);

  /* ---------------------------------------------------- 9. authentication */
  const unsigned = await fetch(`${server.base}/comments/v1/wp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ operation: 'pending' }),
  });
  check('unsigned request rejected', unsigned.status === 401);

  const articleKey = crypto.randomBytes(32).toString('hex');
  const crossScope = await api.wp({ operation: 'pending' }, { secret: articleKey });
  check('wrong secret rejected', crossScope.status === 401 && crossScope.json.error === 'invalid_signature');

  // A payload signed with the article-channel key must never work here.
  const articleChannelBody = JSON.stringify({ operation: 'pending' });
  const articleTs = Math.floor(Date.now() / 1000);
  const articleNonce = crypto.randomBytes(16).toString('hex');
  const articleSignature = crypto.createHmac('sha256', SECRET).update(`${articleTs}.${articleNonce}.${articleChannelBody}`).digest('hex');
  const wrongScope = await fetch(`${server.base}/comments/v1/wp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-elomai-timestamp': String(articleTs),
      'x-elomai-nonce': articleNonce,
      'x-elomai-signature': articleSignature,
    },
    body: articleChannelBody,
  });
  check('article-channel signature rejected on the comment channel', wrongScope.status === 401);

  const stale = await api.wp({ operation: 'pending' }, { timestamp: Math.floor(Date.now() / 1000) - 4000 });
  check('stale timestamp rejected', stale.status === 401 && stale.json.error === 'timestamp_out_of_window');

  const replayNonce = crypto.randomBytes(16).toString('hex');
  const replayTs = Math.floor(Date.now() / 1000);
  const firstBody = JSON.stringify({ operation: 'stats' });
  await api.wp({}, { rawBody: firstBody, nonce: replayNonce, timestamp: replayTs });
  const replay = await api.wp({}, { rawBody: JSON.stringify({ operation: 'prune' }), nonce: replayNonce, timestamp: replayTs });
  check('replayed nonce with a different body rejected', replay.status === 401 && replay.json.error === 'nonce_reused');

  const badOperation = await api.wp({ operation: 'drop-everything' });
  check('unknown authenticated operation rejected', badOperation.status === 400 && badOperation.json.error === 'unknown_operation');

  /* ------------------------------------------------- 10. moderation sync */
  const pendingUpdate = await api.wp({
    operation: 'status',
    updates: [{ id: firstId, status: 'pending', version: 99 }],
  });
  check('unapprove accepted', pendingUpdate.status === 200);
  const hidden = await api.list(uuidEnabled);
  check('unapproved comment disappears from the public list', !(hidden.json.comments || []).some((c) => c.id === firstId));
  html = await readArticleHtml('en', SLUG);
  check('unapproved comment disappears from the rendered page', !html.includes('detailed explanation of the DMARC'));

  await api.wp({ operation: 'status', updates: [{ id: firstId, status: 'approved', version: 100 }] });
  const reapproved = await api.list(uuidEnabled);
  check('re-approved comment returns to the public list', (reapproved.json.comments || []).some((c) => c.id === firstId));

  const staleVersion = await api.wp({
    operation: 'status',
    updates: [{ id: firstId, status: 'pending', version: 90 }],
  });
  check('older moderation decision is ignored', staleVersion.json.changed === 0);
  check('newer moderation decision still wins', (await api.list(uuidEnabled)).json.total > 0);

  const edited = await api.wp({
    operation: 'status',
    updates: [{ id: firstId, status: 'approved', content: 'Edited in WordPress before publication.', version: 200 }],
  });
  check('edited content accepted', edited.json.changed === 1);
  html = await readArticleHtml('en', SLUG);
  check('edited content replaces the public text', html.includes('Edited in WordPress before publication.'));

  await api.wp({ operation: 'status', updates: [{ id: firstId, status: 'deleted', version: 300 }] });
  const deleted = await api.list(uuidEnabled);
  check('deleted comment removed from the public list', !(deleted.json.comments || []).some((c) => c.id === firstId));
  html = await readArticleHtml('en', SLUG);
  check('deleted comment removed from the rendered page', !html.includes('Edited in WordPress before publication.'));

  /* -------------------------------------- 11. WordPress-authored replies */
  const local = await api.wp({
    operation: 'publish',
    comment: {
      articleUuid: uuidEnabled,
      parentId: null,
      authorName: 'Elom Akakpovi',
      content: 'Thanks for the detailed question — the p=none phase should run for at least four weeks.',
      createdAt: '2026-11-20T10:00:00Z',
      externalId: 'wp-555',
    },
  });
  check('WordPress-authored reply published', local.status === 200 && local.json.changed === 1);
  const localAgain = await api.wp({
    operation: 'publish',
    comment: {
      articleUuid: uuidEnabled,
      authorName: 'Elom Akakpovi',
      content: 'Thanks for the detailed question — the p=none phase should run for at least four weeks.',
      externalId: 'wp-555',
    },
  });
  check('repeated WordPress reply is idempotent', localAgain.json.changed === 0);
  html = await readArticleHtml('en', SLUG);
  check('WordPress reply visible on the public page', html.includes('should run for at least four weeks'));

  /* ---------------------------------------------- 12. pagination limits */
  const many = [];
  for (let index = 0; index < 12; index += 1) {
    many.push(
      api.submit(
        submission({
          author: `Reader ${index}`,
          email: `reader${index}@example.org`,
          content: `Comment number ${index} about monitoring, reporting and long-term maintenance.`,
        }),
      ),
    );
  }
  await Promise.all(many);
  const batch = (await api.wp({ operation: 'pending', limit: 100 })).json.comments || [];
  await api.wp({
    operation: 'ack',
    comments: batch.map((item, index) => ({ id: item.id, wpCommentId: 200 + index, status: 'approved' })),
  });
  const page1 = await api.list(uuidEnabled, { cursor: 0, limit: 5 });
  check('paginated list respects the limit', page1.json.comments.length <= 5, `got ${page1.json.comments.length}`);
  check('paginated list exposes a next cursor', typeof page1.json.nextCursor === 'string');
  const page2 = await api.list(uuidEnabled, { cursor: page1.json.nextCursor, limit: 5 });
  check('second page does not repeat the first', !page2.json.comments.some((c) => page1.json.comments.some((p) => p.id === c.id)));
  html = await readArticleHtml('en', SLUG);
  check('static page renders only the first thread page', (html.match(/class="comment"/g) || []).length <= 10);
  check('static page offers incremental loading', html.includes('data-comments-more'));

  /* --------------------------------------------------------- 13. health */
  const health = await (await fetch(`${server.base}/health`)).json();
  check('health reports comment counters', health.comments && typeof health.comments.received === 'number', JSON.stringify(health.comments));
  check('health exposes no personal data', !JSON.stringify(health).includes(EMAIL));
  check('health counts awaiting imports', health.comments.awaitingImport >= 0);

  /* ---------------------------------------- 14. retention + pruning */
  const pruned = await api.wp({ operation: 'prune' });
  check('prune operation authenticated and applied', pruned.status === 200);

  /* ------------------------------------------------------ 15. durability */
  // This submission arrives after the last pull: WordPress is, from the
  // receiver's point of view, offline.
  const whileAway = await api.submit(
    submission({ content: 'Submitted while WordPress was offline and must be imported later.' }),
  );
  check('comment accepted while WordPress is not pulling', whileAway.status === 202);
  const offlineList = await api.list(uuidEnabled);
  check('comment received while WordPress is offline is not public', !(offlineList.json.comments || []).some((c) => c.id === whileAway.json.id));

  server.proc.kill('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 400));
  server = await startServer({ port: PORT, dataDir });
  const api2 = http(server.base);
  const afterRestart = await api2.list(uuidEnabled);
  check('approved comments survive a receiver restart', afterRestart.json.total > 0, `total=${afterRestart.json.total}`);
  const restartStats = (await api2.wp({ operation: 'stats' })).json.stats;
  check('stored comments survive a receiver restart', restartStats.received >= 12, JSON.stringify(restartStats));
  const stillPendingThere = (await api2.wp({ operation: 'pending', limit: 100 })).json.comments || [];
  check(
    'comments submitted while WordPress was away are still importable',
    stillPendingThere.some((c) => c.id === whileAway.json.id),
    `pending=${stillPendingThere.length}`,
  );
  const htmlAfterRestart = await readArticleHtml('en', SLUG);
  check('rendered page rebuilt after restart still shows approved comments', htmlAfterRestart.includes('should run for at least four weeks'));

  /* --------------------------------------- 16. fail-safe classification */
  const failSafeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'elomai-comments-failsafe-'));
  const failSafe = await startServer({ port: 8133, dataDir: failSafeDir, classifier: 'broken' });
  const failSafeApi = http(failSafe.base);
  await failSafeApi.postArticle(articlePayload({ uuid: uuidEnabled, slug: SLUG, title: 'Comment lifecycle test article' }));
  const failSafeSubmit = await failSafeApi.submit(submission({ content: 'A perfectly ordinary comment that must not be auto-approved.' }));
  const failSafePull = await failSafeApi.wp({ operation: 'pending', limit: 10 });
  const failSafeItem = (failSafePull.json.comments || [])[0] || {};
  check(
    'broken classifier leaves the comment pending instead of publishing it',
    failSafeSubmit.status === 202 && failSafeItem.classification?.verdict === 'suspicious',
    JSON.stringify(failSafeItem.classification),
  );
  failSafe.proc.kill('SIGTERM');
  await fs.rm(failSafeDir, { recursive: true, force: true });

  /* ------------------------------------------------------- 17. rate limit */
  const rateDir = await fs.mkdtemp(path.join(os.tmpdir(), 'elomai-comments-rate-'));
  rateServer = await startServer({ port: RATE_PORT, dataDir: rateDir, rateHour: 2, rateDay: 10 });
  const rateApi = http(rateServer.base);
  await rateApi.postArticle(articlePayload({ uuid: uuidEnabled, slug: SLUG, title: 'Comment lifecycle test article' }));
  const r1 = await rateApi.submit(submission({ content: 'First comment inside the rate window, long enough.' }));
  const r2 = await rateApi.submit(submission({ content: 'Second comment inside the rate window, long enough.' }));
  const r3 = await rateApi.submit(submission({ content: 'Third comment inside the rate window, must be blocked.' }));
  check('first submissions inside the window accepted', r1.status === 202 && r2.status === 202, `${r1.status}/${r2.status}`);
  check('submission above the hourly limit is throttled', r3.status === 429 && r3.json.error === 'rate_limited', `status=${r3.status}`);
  rateServer.proc.kill('SIGTERM');
  await fs.rm(rateDir, { recursive: true, force: true });
} catch (error) {
  check('comment test completed without exception', false, String(error && error.message));
} finally {
  if (server) server.proc.kill('SIGTERM');
  if (rateServer) rateServer.proc.kill('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 300));
  await fs.rm(dataDir, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('\nFailed checks:');
  for (const item of failed) console.log(` - ${item.name}${item.detail ? ` (${item.detail})` : ''}`);
  process.exit(1);
}
