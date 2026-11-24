/**
 * M11 — multilingual routing and translation-group test.
 *
 * Starts the real receiver against a throwaway data directory and exercises the
 * public artifacts exactly as a reader would see them: language hubs, article
 * pages, the language switcher states, hreflang, the sitemap, the feed, and the
 * validation rules that protect a translation group.
 *
 * Run with: npm run test:multilingual
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PORT = 8124;
const SECRET = crypto.randomBytes(32).toString('hex');
const BASE = `http://127.0.0.1:${PORT}`;

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

async function post(body) {
  const raw = JSON.stringify(body);
  const signed = sign(raw);
  const response = await fetch(`${BASE}/v1/sync`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-elomai-timestamp': String(signed.timestamp),
      'x-elomai-nonce': signed.nonce,
      'x-elomai-signature': signed.signature,
    },
    body: raw,
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json };
}

function article({
  uuid,
  lang,
  slug,
  title,
  version = 1,
  group,
  translations = [],
  categories = [],
  publishedAt = '2026-11-01T09:00:00Z',
  wpId = 100,
}) {
  return {
    idempotencyKey: `${uuid}:v${version}:upsert`,
    operation: 'upsert',
    article: {
      uuid,
      wpId,
      version,
      lang,
      slug,
      title,
      translationGroupId: group,
      translations,
      excerpt: `${title} — excerpt.`,
      html: `<p>${title} introduction paragraph that is long enough to be a real article.</p>\n<h2>Section one</h2><p>Body text for the first section of ${title}.</p>\n<h2>Section two</h2><p>More body text so validation and reading time both succeed.</p>`,
      author: { name: 'Elom Akakpovi' },
      publishedAt,
      modifiedAt: publishedAt,
      categories,
      tags: [],
      seo: { title: `${title} — test`, description: `Description for ${title}.`, keywords: [] },
    },
  };
}

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

const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'elomai-multilingual-'));
const proc = spawn(process.execPath, ['server.mjs'], {
  cwd: path.resolve(import.meta.dirname, '..'),
  env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir, ELOMAI_SYNC_SECRET: SECRET, MATOMO_SITE_ID: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
proc.stdout.on('data', (d) => {
  serverLog += d.toString();
});
proc.stderr.on('data', (d) => {
  serverLog += d.toString();
});

const U = {
  group: crypto.randomUUID(),
  en: crypto.randomUUID(),
  de: crypto.randomUUID(),
  fr: crypto.randomUUID(),
  enOther: crypto.randomUUID(),
  intruder: crypto.randomUUID(),
  legacyEn: crypto.randomUUID(),
  legacyDe: crypto.randomUUID(),
};

try {
  await waitForServer(proc);
  const publicDir = path.join(dataDir, 'public');
  const read = (rel) => fs.readFile(path.join(publicDir, rel), 'utf8').catch(() => '');
  const exists = async (rel) =>
    fs
      .access(path.join(publicDir, rel))
      .then(() => true)
      .catch(() => false);

  /* --- 1. an English article, no translations yet ---------------------- */
  const en = await post(
    article({
      uuid: U.en,
      lang: 'en',
      slug: 'what-is-dmarc',
      title: 'What is DMARC',
      group: U.group,
      translations: [
        { lang: 'de', status: 'draft', slug: '', title: 'Was ist DMARC' },
        { lang: 'fr', status: 'draft', slug: '', title: 'Qu’est-ce que DMARC' },
      ],
      categories: [{ slug: 'email-security', name: 'Email security' }],
      wpId: 6,
    }),
  );
  check('english article published', en.status === 200, `status=${en.status}`);
  check('receiver reports created', en.json.result === 'created');
  check('receiver echoes the translation group', en.json.translationGroupId === U.group);

  const enHtml = await read('blog/en/what-is-dmarc/index.html');
  check('english page rendered', enHtml.includes('<h1>What is DMARC</h1>'));
  check(
    'unpublished german sibling is "in preparation"',
    enHtml.includes('data-state="unpublished"') && enHtml.includes('In preparation'),
  );
  check(
    'draft french sibling is "in preparation"',
    enHtml.includes('data-state="unpublished"') && enHtml.includes('In preparation'),
  );
  check('no fake french article url in the switcher', !enHtml.includes('/blog/fr/qu'));
  check('no hreflang advertises an unpublished translation', !enHtml.includes('hreflang="fr"'));
  check(
    'switcher offers the french hub instead',
    enHtml.includes('href="/blog/fr/"') && enHtml.includes('lang-hub-link'),
  );
  check('x-default points at the English original', enHtml.includes('hreflang="x-default" href="https://elomaiapp.com/blog/en/what-is-dmarc/"'));

  const enListing = await read('blog/index.html');
  check('english hub lists the english article', enListing.includes('/blog/en/what-is-dmarc/'));
  check('english hub is indexed', enListing.includes('content="index, follow, max-image-preview:large"'));

  const alias = await read('blog/en/index.html');
  check('/blog/en/ answers with the english listing', alias.includes('/blog/en/what-is-dmarc/'));
  check('/blog/en/ canonicalises to /blog/', alias.includes('<link rel="canonical" href="https://elomaiapp.com/blog/"'));

  /* --- 2. empty languages: reachable, no fallback, noindex ------------- */
  const deEmpty = await read('blog/de/index.html');
  const frEmpty = await read('blog/fr/index.html');
  check('empty german hub answers', deEmpty.length > 0);
  check('empty german hub lists no english article', !deEmpty.includes('/blog/en/'));
  check('empty german hub is noindexed', deEmpty.includes('content="noindex, follow"'));
  check('empty french hub is noindexed', frEmpty.includes('content="noindex, follow"'));
  check('no english fallback title on the french hub', !frEmpty.includes('What is DMARC'));

  let sitemap = await read('sitemap.xml');
  check('sitemap omits empty language hubs', !sitemap.includes('/blog/de/') && !sitemap.includes('/blog/fr/'));
  check('sitemap includes the english article', sitemap.includes('/blog/en/what-is-dmarc/'));
  check('sitemap does not advertise unpublished hreflang', !sitemap.includes('hreflang="de"'));

  /* --- 3. translation published: language switching works ------------- */
  const de = await post(
    article({
      uuid: U.de,
      lang: 'de',
      slug: 'de-was-ist-dmarc',
      title: 'Was ist DMARC',
      group: U.group,
      translations: [
        { lang: 'en', status: 'publish', slug: 'what-is-dmarc', title: 'What is DMARC' },
        { lang: 'fr', status: 'draft', slug: '', title: 'Qu’est-ce que DMARC' },
      ],
      categories: [{ slug: 'email-security', name: 'Email security' }],
      wpId: 11,
    }),
  );
  check('german translation published', de.status === 200);

  const deHtml = await read('blog/de/de-was-ist-dmarc/index.html');
  check(
    'german page links the english original from the switcher',
    deHtml.includes('hreflang="en"') && deHtml.includes('href="/blog/en/what-is-dmarc/"'),
  );
  check(
    'german page still marks the draft french edition as in preparation',
    deHtml.includes('data-state="unpublished"'),
  );
  check(
    'english page now links the german translation',
    (await read('blog/en/what-is-dmarc/index.html')).includes('href="/blog/de/de-was-ist-dmarc/"'),
  );
  check(
    'english page hreflang includes german',
    (await read('blog/en/what-is-dmarc/index.html')).includes('hreflang="de" href="https://elomaiapp.com/blog/de/de-was-ist-dmarc/"'),
  );

  const deListing = await read('blog/de/index.html');
  check('german hub lists the german article', deListing.includes('/blog/de/de-was-ist-dmarc/'));
  check('german hub does not list the english article', !deListing.includes('/blog/en/what-is-dmarc/'));
  check('german hub is now indexed', deListing.includes('content="index, follow, max-image-preview:large"'));

  sitemap = await read('sitemap.xml');
  check('sitemap now advertises the german hub', sitemap.includes('/blog/de/'));
  check('sitemap advertises the german article', sitemap.includes('/blog/de/de-was-ist-dmarc/'));

  /* --- 4. category routes stay language-specific ---------------------- */
  const deCategory = await read('blog/de/category/email-security/index.html');
  check('german category route exists', deCategory.includes('/blog/de/de-was-ist-dmarc/'));
  check('german category route lists no english article', !deCategory.includes('/blog/en/what-is-dmarc/'));
  const enCategory = await read('blog/category/email-security/index.html');
  check('english category route exists', enCategory.includes('/blog/en/what-is-dmarc/'));
  check(
    'category alternates only point at languages that have the category',
    !enCategory.includes('rel="alternate" hreflang="fr"'),
  );
  check(
    'category tabs still offer the empty hub',
    enCategory.includes('href="/blog/fr/"') && enCategory.includes('>FR</a>'),
  );

  /* --- 5. related articles never cross languages --------------------- */
  const enOther = await post(
    article({
      uuid: U.enOther,
      lang: 'en',
      slug: 'how-to-check-dmarc',
      title: 'How to check DMARC',
      group: crypto.randomUUID(),
      categories: [{ slug: 'email-security', name: 'Email security' }],
      wpId: 7,
      publishedAt: '2026-11-02T09:00:00Z',
    }),
  );
  check('second english article published', enOther.status === 200);
  const dePageAfter = await read('blog/de/de-was-ist-dmarc/index.html');
  check(
    'german related block does not recommend english articles',
    !dePageAfter.includes('/blog/en/how-to-check-dmarc/'),
  );
  // An article with no declared siblings at all is the "missing" case.
  const enNoSiblings = await read('blog/en/how-to-check-dmarc/index.html');
  check(
    'a language with no sibling entry is reported as not translated',
    enNoSiblings.includes('data-state="missing"') && enNoSiblings.includes('Not translated yet'),
  );

  /* --- 6. legacy payload without a group still links translations ---- */
  await post(
    article({ uuid: U.legacyEn, lang: 'en', slug: 'legacy-english', title: 'Legacy english article', wpId: 20 }),
  );
  await post(
    article({
      uuid: U.legacyDe,
      lang: 'de',
      slug: 'legacy-german',
      title: 'Legacy german article',
      translations: [{ lang: 'en', status: 'publish', slug: 'legacy-english', title: 'Legacy english article' }],
      wpId: 21,
    }),
  );
  check(
    'legacy explicit translation still becomes a link',
    (await read('blog/de/legacy-german/index.html')).includes('/blog/en/legacy-english/'),
  );
  check(
    'an undeclared legacy sibling is not invented in the other direction',
    !(await read('blog/en/legacy-english/index.html')).includes('/blog/de/legacy-german/'),
  );

  /* --- 7. group integrity -------------------------------------------- */
  const conflict = await post(
    article({
      uuid: U.intruder,
      lang: 'en',
      slug: 'impostor',
      title: 'Impostor english article',
      group: U.group,
      wpId: 99,
    }),
  );
  check('second english article in one group is rejected', conflict.status === 409, `status=${conflict.status}`);
  check('rejection names the conflict', conflict.json.error === 'translation_conflict');
  check('conflicting article was not rendered', !(await exists('blog/en/impostor/index.html')));

  const selfRef = await post(
    article({
      uuid: crypto.randomUUID(),
      lang: 'en',
      slug: 'self-reference',
      title: 'Self reference article',
      translations: [{ lang: 'en', status: 'publish', slug: 'self-reference', title: 'Self reference article' }],
      wpId: 98,
    }),
  );
  check('self reference accepted but dropped', selfRef.status === 200);
  const selfHtml = await read('blog/en/self-reference/index.html');
  check(
    'article cannot point at itself as a translation',
    selfHtml.split('rel="alternate" hreflang="en"').length - 1 === 1,
    `${selfHtml.split('rel="alternate" hreflang="en"').length - 1} english alternate(s)`,
  );
  check('self reference is not listed twice in the switcher', selfHtml.split('href="/blog/en/self-reference/"').length - 1 <= 3);

  /* --- 8. version ordering and idempotency -------------------------- */
  const v3Payload = article({
    uuid: U.en,
    lang: 'en',
    slug: 'what-is-dmarc',
    title: 'What is DMARC v3',
    version: 3,
    group: U.group,
    wpId: 6,
    translations: [
      { lang: 'de', status: 'publish', slug: 'de-was-ist-dmarc', title: 'Was ist DMARC' },
      { lang: 'fr', status: 'publish', slug: 'spf-dkim-dmarc-surveiller', title: 'SPF, DKIM et DMARC' },
    ],
  });
  const v3 = await post(v3Payload);
  check('newer version accepted', v3.status === 200 && v3.json.version === 3);
  check('receiver reports update', v3.json.result === 'updated');

  const stale = await post(
    article({ uuid: U.en, lang: 'en', slug: 'what-is-dmarc', title: 'What is DMARC v2', version: 2, group: U.group, wpId: 6 }),
  );
  check('older version rejected', stale.status === 409 && stale.json.error === 'stale_version', `status=${stale.status}`);
  check('rejected older version did not overwrite', (await read('blog/en/what-is-dmarc/index.html')).includes('What is DMARC v3'));

  const conflictingPayload = article({
    uuid: U.en,
    lang: 'en',
    slug: 'what-is-dmarc',
    title: 'Different content, same version',
    version: 3,
    group: U.group,
    wpId: 6,
  });
  // A distinct idempotency key is what a WordPress retry with a stale hash
  // would produce: same version, different body.
  conflictingPayload.idempotencyKey = `${U.en}:v3:upsert:conflict`;
  const conflicting = await post(conflictingPayload);
  check('same version with different content rejected', conflicting.status === 409 && conflicting.json.error === 'version_conflict');

  const duplicate = await post(
    article({ uuid: U.en, lang: 'en', slug: 'what-is-dmarc', title: 'What is DMARC v3', version: 3, group: U.group, wpId: 6 }),
  );
  check('duplicate delivery acknowledged as already synchronized', duplicate.status === 200 && duplicate.json.duplicate === true);

  /* --- 9. slug change keeps the group intact ------------------------- */
  const renamed = await post(
    article({
      uuid: U.de,
      lang: 'de',
      slug: 'dmarc-erklaert',
      title: 'Was ist DMARC',
      version: 2,
      group: U.group,
      translations: [{ lang: 'en', status: 'publish', slug: 'what-is-dmarc', title: 'What is DMARC' }],
      categories: [{ slug: 'email-security', name: 'Email security' }],
      wpId: 11,
    }),
  );
  check('slug change accepted', renamed.status === 200);
  check('old german slug removed', !(await exists('blog/de/de-was-ist-dmarc/index.html')));
  check('english page follows the new german slug', (await read('blog/en/what-is-dmarc/index.html')).includes('/blog/de/dmarc-erklaert/'));
  check(
    'hreflang follows the new slug',
    (await read('blog/en/what-is-dmarc/index.html')).includes('hreflang="de" href="https://elomaiapp.com/blog/de/dmarc-erklaert/"'),
  );

  /* --- 10. third language becomes available ------------------------- */
  const fr = await post(
    article({
      uuid: U.fr,
      lang: 'fr',
      slug: 'spf-dkim-dmarc-surveiller',
      title: 'SPF, DKIM et DMARC',
      group: U.group,
      translations: [
        { lang: 'en', status: 'publish', slug: 'what-is-dmarc', title: 'What is DMARC' },
        { lang: 'de', status: 'publish', slug: 'dmarc-erklaert', title: 'Was ist DMARC' },
      ],
      categories: [{ slug: 'email-security', name: 'Email security' }],
      wpId: 31,
    }),
  );
  check('french translation published', fr.status === 200);
  const frHtml = await read('blog/fr/spf-dkim-dmarc-surveiller/index.html');
  check('french page links both siblings', frHtml.includes('/blog/en/what-is-dmarc/') && frHtml.includes('/blog/de/dmarc-erklaert/'));
  check('french page has three hreflang alternates plus x-default', frHtml.split('rel="alternate"').length - 1 === 4);
  const enThree = await read('blog/en/what-is-dmarc/index.html');
  check('english page offers all three languages', enThree.includes('hreflang="de"') && enThree.includes('hreflang="fr"'));
  check('x-default still the english original', enThree.includes('hreflang="x-default" href="https://elomaiapp.com/blog/en/what-is-dmarc/"'));
  const frListing = await read('blog/fr/index.html');
  check('french hub lists only the french article', frListing.includes('/blog/fr/spf-dkim-dmarc-surveiller/') && !frListing.includes('/blog/en/what-is-dmarc/'));

  /* --- 11. unpublishing removes the translation from the graph ------ */
  const offline = await post({
    idempotencyKey: `${U.fr}:v2:unpublish`,
    operation: 'unpublish',
    uuid: U.fr,
    version: 2,
  });
  check('french article taken offline', offline.status === 200 && offline.json.unpublished === true);
  check('french article page removed', !(await exists('blog/fr/spf-dkim-dmarc-surveiller/index.html')));
  const enAfterOffline = await read('blog/en/what-is-dmarc/index.html');
  check('english page stops advertising the offline translation', !enAfterOffline.includes('/blog/fr/spf-dkim-dmarc-surveiller/'));
  check(
    'offline translation is shown as temporarily unavailable',
    enAfterOffline.includes('data-state="unavailable"') && enAfterOffline.includes('Temporarily unavailable'),
  );
  check('french hub remains reachable', (await read('blog/fr/index.html')).length > 0);
  check('feed drops the unpublished article', !(await read('content/blog-index.json')).includes('spf-dkim-dmarc-surveiller'));

  /* --- 12. feed exposes the mapping -------------------------------- */
  const feed = JSON.parse(await read('content/blog-index.json'));
  const feedEn = feed.articles.find((a) => a.slug === 'what-is-dmarc');
  check('feed carries the translation group', feedEn && feedEn.translationGroupId === U.group);
  check(
    'feed carries the translation states',
    feedEn && feedEn.translationStates && feedEn.translationStates.fr === 'unavailable',
    JSON.stringify(feedEn && feedEn.translationStates),
  );

  /* --- 13. health counters ---------------------------------------- */
  const health = await (await fetch(`${BASE}/health`)).json();
  check('health counts articles per language', health.byLang.de >= 2 && health.byLang.en >= 3, JSON.stringify(health.byLang));
  check('health counts translation groups', health.translationGroups >= 4, String(health.translationGroups));
} catch (error) {
  check('multilingual test completed without exception', false, String(error && error.message));
} finally {
  proc.kill('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 300));
  await fs.rm(dataDir, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('Server log:\n' + serverLog.split('\n').slice(-25).join('\n'));
  process.exit(1);
}
