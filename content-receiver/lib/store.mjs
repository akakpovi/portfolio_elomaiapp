import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * On-disk store. Deliberately simple: a handful of JSON documents written
 * with atomic renames and guarded by a single in-process write queue, because
 * exactly one receiver process owns the directory.
 */
export function createStore(dataDir) {
  const articlesFile = path.join(dataDir, 'articles.json');
  const idempotencyFile = path.join(dataDir, 'idempotency.json');
  const versionsDir = path.join(dataDir, 'versions');

  let articles = {};
  let idempotency = {};
  let loaded = false;
  let queue = Promise.resolve();

  async function readJson(file, fallback) {
    try {
      const raw = await fs.readFile(file, 'utf8');
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  async function writeAtomic(file, value) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 2));
    await fs.rename(tmp, file);
  }

  async function load() {
    if (loaded) return;
    await fs.mkdir(dataDir, { recursive: true });
    const loadedArticles = await readJson(articlesFile, {});
    const loadedIdempotency = await readJson(idempotencyFile, {});
    articles = loadedArticles && typeof loadedArticles === 'object' ? loadedArticles : {};
    idempotency = loadedIdempotency && typeof loadedIdempotency === 'object' ? loadedIdempotency : {};
    loaded = true;
  }

  function serial(fn) {
    const run = queue.then(fn, fn);
    queue = run.catch(() => {});
    return run;
  }

  return {
    dataDir,
    versionsDir,

    async init() {
      await load();
      return { articles: Object.keys(articles).length };
    },

    list() {
      return Object.values(articles);
    },

    get(uuid) {
      return articles[uuid] || null;
    },

    findVersion(uuid, version) {
      const article = articles[uuid];
      if (!article) return null;
      if (Number(article.version) === Number(version)) return article;
      return null;
    },

    getIdempotency(key) {
      return idempotency[key] || null;
    },

    /** Persist an article version and return the stored document. */
    async saveArticle(article, idempotencyKey, responseMeta) {
      return serial(async () => {
        articles[article.uuid] = article;

        const versionDir = path.join(versionsDir, article.uuid);
        await fs.mkdir(versionDir, { recursive: true });
        await writeAtomic(path.join(versionDir, `v${article.version}.json`), article);

        if (idempotencyKey) {
          idempotency[idempotencyKey] = {
            at: new Date().toISOString(),
            uuid: article.uuid,
            version: article.version,
            slug: article.slug,
            lang: article.lang,
            result: responseMeta || null,
          };
          // Keep the idempotency log bounded.
          const keys = Object.keys(idempotency);
          if (keys.length > 1000) {
            keys
              .sort((a, b) => String(idempotency[a].at).localeCompare(String(idempotency[b].at)))
              .slice(0, keys.length - 800)
              .forEach((k) => delete idempotency[k]);
          }
          await writeAtomic(idempotencyFile, idempotency);
        }

        await writeAtomic(articlesFile, articles);
        return articles[article.uuid];
      });
    },

    async listVersions(uuid) {
      try {
        const files = await fs.readdir(path.join(versionsDir, uuid));
        return files
          .filter((f) => /^v\d+\.json$/.test(f))
          .map((f) => Number(f.slice(1, -5)))
          .sort((a, b) => b - a);
      } catch {
        return [];
      }
    },
  };
}
