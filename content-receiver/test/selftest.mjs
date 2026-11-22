/**
 * End-to-end self test for the content receiver.
 * Starts the real server against a throwaway data directory, then exercises
 * authentication, validation, idempotency, rendering, translations and
 * unpublishing exactly as WordPress would.
 *
 * Run with: npm run selftest
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PORT = 8123;
const SECRET = crypto.randomBytes(32).toString('hex');
const BASE = `http://127.0.0.1:${PORT}`;

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const results = [];
function check(name, condition, detail) {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function sign(body) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', SECRET).update(`${timestamp}.${nonce}.${body}`).digest('hex');
  return { timestamp, nonce, signature };
}

async function post(body, { secret = SECRET, timestamp } = {}) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  const signed = sign(raw);
  const headers = {
    'content-type': 'application/json',
    'x-elomai-timestamp': String(timestamp || signed.timestamp),
    'x-elomai-nonce': signed.nonce,
    'x-elomai-signature': secret === SECRET ? signed.signature : crypto.createHmac('sha256', secret).update(`${signed.timestamp}.${signed.nonce}.${raw}`).digest('hex'),
  };
  const response = await fetch(`${BASE}/v1/sync`, { method: 'POST', headers, body: raw });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json };
}

function articlePayload({ uuid, lang, slug, title, version = 1, translations = [] }) {
  const pngRef = `${crypto.createHash('sha256').update(PNG).digest('hex')}.png`;
  return {
    idempotencyKey: `${uuid}:v${version}:upsert`,
    operation: 'upsert',
    article: {
      uuid,
      wpId: 101,
      version,
      lang,
      slug,
      title,
      excerpt: 'A test article used by the receiver self test.',
      html: `<p>Intro paragraph with <strong>markup</strong> and a <script>alert(1)</script> script that must be removed.</p>
<h2>First section</h2><p>Body text for the first section.</p>
<h2>Second section</h2><pre><code class="language-bash">docker compose up -d</code></pre>
<p><img src="elomai-media:${pngRef}" width="1" height="1" alt="Test image" /></p>
<p><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe></p>`,
      media: [{ ref: pngRef, dataBase64: PNG.toString('base64') }],
      featured: {
        ref: pngRef,
        width: 1200,
        height: 630,
        alt: 'Test cover',
        caption: 'Test caption',
        variants: [{ ref: pngRef, width: 800 }],
      },
      author: { name: 'Elom Akakpovi' },
      publishedAt: '2026-11-01T09:00:00Z',
      modifiedAt: '2026-11-02T09:00:00Z',
      categories: [{ slug: 'artificial-intelligence-llm', name: 'Artificial Intelligence & LLM' }],
      tags: ['test'],
      seo: { title: `${title} — test`, description: 'Test description for SEO.', keywords: ['test'] },
      translations,
    },
  };
}

const uuidEn = crypto.randomUUID();
const uuidDe = crypto.randomUUID();

async function waitForServer(proc) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (proc.exitCode !== null) throw new Error(`receiver exited early (${proc.exitCode})`);
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('receiver did not become healthy');
}

const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'elomai-receiver-'));
const proc = spawn(process.execPath, ['server.mjs'], {
  cwd: path.resolve(import.meta.dirname, '..'),
  env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir, ELOMAI_SYNC_SECRET: SECRET, MATOMO_SITE_ID: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
proc.stdout.on('data', (d) => { serverLog += d.toString(); });
proc.stderr.on('data', (d) => { serverLog += d.toString(); });

try {
  await waitForServer(proc);

  const publicDir = path.join(dataDir, 'public');
  const read = (rel) => fs.readFile(path.join(publicDir, rel), 'utf8');
  const exists = async (rel) => {
    try {
      await fs.access(path.join(publicDir, rel));
      return true;
    } catch {
      return false;
    }
  };

  /* --- 1. publish --------------------------------------------------- */
  const first = await post(articlePayload({ uuid: uuidEn, lang: 'en', slug: 'receiver-self-test', title: 'Receiver self test article' }));
  check('publish returns 200', first.status === 200, `status=${first.status}`);
  check('publish reports public url', first.json.publicUrl === 'https://elomaiapp.com/blog/en/receiver-self-test/', first.json.publicUrl);

  const articleHtml = await read('blog/en/receiver-self-test/index.html');
  check('article page rendered', articleHtml.includes('Receiver self test article'));
  check('script tag stripped', !articleHtml.includes('<script>alert(1)</script>'));
  check('heading ids and TOC generated', articleHtml.includes('id="first-section"') && articleHtml.includes('href="#first-section"'));
  check('code block preserved', articleHtml.includes('docker compose up -d'));
  check('media rewritten to public path', /\/media\/[a-f0-9]{64}\.png/.test(articleHtml));
  check('video replaced by privacy facade', articleHtml.includes('video-facade') && !articleHtml.includes('youtube.com/embed'));
  check('blogposting json-ld present', articleHtml.includes('"@type":"BlogPosting"'));
  check('breadcrumbs json-ld present', articleHtml.includes('"@type":"BreadcrumbList"'));
  check('canonical points at article', articleHtml.includes('<link rel="canonical" href="https://elomaiapp.com/blog/en/receiver-self-test/"'));
  check('tracker configured first-party', articleHtml.includes('/matomo/matomo.php'));

  const listing = await read('blog/index.html');
  check('listing links the article', listing.includes('/blog/en/receiver-self-test/'));
  const sitemap = await read('sitemap.xml');
  check('sitemap includes article', sitemap.includes('https://elomaiapp.com/blog/en/receiver-self-test/'));
  const feed = JSON.parse(await read('content/blog-index.json'));
  check('feed exposes article', feed.count === 1 && feed.articles[0].slug === 'receiver-self-test');

  /* --- 2. idempotency ------------------------------------------------- */
  const repeat = await post(articlePayload({ uuid: uuidEn, lang: 'en', slug: 'receiver-self-test', title: 'Receiver self test article' }));
  check('repeat returns duplicate', repeat.status === 200 && repeat.json.duplicate === true);

  /* --- 3. update replaces, no duplicate ------------------------------- */
  const update = await post(articlePayload({ uuid: uuidEn, lang: 'en', slug: 'receiver-self-test', title: 'Receiver self test article', version: 2 }));
  check('version 2 accepted', update.status === 200 && update.json.version === 2);
  const versions = (await fs.readdir(path.join(dataDir, 'versions', uuidEn))).sort();
  check('both versions stored', versions.length === 2, versions.join(','));

  /* --- 4. translation ------------------------------------------------ */
  const de = await post(
    articlePayload({
      uuid: uuidDe,
      lang: 'de',
      slug: 'receiver-selbsttest',
      title: 'Receiver Selbsttest Artikel',
      translations: [{ lang: 'en', slug: 'receiver-self-test', title: 'Receiver self test article' }],
    }),
  );
  check('german translation published', de.status === 200, `status=${de.status}`);
  const deHtml = await read('blog/de/receiver-selbsttest/index.html');
  check('hreflang alternate to english', deHtml.includes('hreflang="en" href="https://elomaiapp.com/blog/en/receiver-self-test/"'));
  check('german listing has article', (await read('blog/de/index.html')).includes('/blog/de/receiver-selbsttest/'));
  // A language without a published article must not get a hub page, and the
  // sitemap must not advertise one.
  const frExists = await fs
    .access(path.join(dataDir, 'public', 'blog', 'fr', 'index.html'))
    .then(() => true)
    .catch(() => false);
  check('no empty french language hub', !frExists);
  check(
    'sitemap omits empty language hub',
    !(await read('sitemap.xml')).includes('/blog/fr/'),
  );

  /* --- 5. security --------------------------------------------------- */
  const badSig = await post(articlePayload({ uuid: crypto.randomUUID(), lang: 'en', slug: 'evil', title: 'Evil article' }), {
    secret: crypto.randomBytes(32).toString('hex'),
  });
  check('wrong secret rejected', badSig.status === 401, `status=${badSig.status}`);
  check('rejection leaks nothing', JSON.stringify(badSig.json).toLowerCase().indexOf(SECRET) === -1 && badSig.json.error === 'invalid_signature');

  const stale = await post(articlePayload({ uuid: crypto.randomUUID(), lang: 'en', slug: 'stale', title: 'Stale article' }), {
    timestamp: Math.floor(Date.now() / 1000) - 4000,
  });
  check('stale timestamp rejected', stale.status === 401 && stale.json.error === 'timestamp_out_of_window');

  const invalid = await post({
    idempotencyKey: 'x:1:upsert',
    operation: 'upsert',
    article: { uuid: 'bad', lang: 'xx', slug: 'Bad Slug', title: 'short', version: 0, wpId: 0, html: 'x' },
  });
  check('invalid payload rejected', invalid.status === 422 && Array.isArray(invalid.json.errors), `status=${invalid.status}`);

  const missing = await fetch(`${BASE}/v1/sync`, { method: 'POST', body: '{}' });
  check('unsigned request rejected', missing.status === 401);

  /* --- 6. unpublish --------------------------------------------------- */
  const unpublish = await post(
    { idempotencyKey: `${uuidEn}:v3:unpublish`, operation: 'unpublish', uuid: uuidEn, version: 3 },
  );
  check('unpublish accepted', unpublish.status === 200 && unpublish.json.unpublished === true);
  check('article page removed', !(await exists('blog/en/receiver-self-test/index.html')));
  check('article removed from sitemap', !(await read('sitemap.xml')).includes('receiver-self-test'));
  check('german translation still public', await exists('blog/de/receiver-selbsttest/index.html'));
  const deAfter = await read('blog/de/receiver-selbsttest/index.html');
  check('stale hreflang to unpublished translation removed', !deAfter.includes('/blog/en/receiver-self-test/'));

  const health = await (await fetch(`${BASE}/health`)).json();
  check('health reports one published article', health.articles === 1 && health.secretConfigured === true);
} catch (error) {
  check('selftest completed without exception', false, String(error && error.message));
} finally {
  proc.kill('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 300));
  await fs.rm(dataDir, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('Server log:\n' + serverLog.split('\n').slice(-20).join('\n'));
  process.exit(1);
}
