import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Public comment lifecycle for the Elomai blog.
 *
 * WordPress stays the editorial source of truth. This module only owns the
 * *public* side of a comment: durable storage of what a visitor submitted, the
 * classification that decides how WordPress should import it, and the single
 * public projection that the article pages and the list API are allowed to
 * show (approved comments, nothing else).
 *
 * States
 *   awaiting_import -> stored, WordPress has not confirmed it yet
 *   imported        -> WordPress created the native comment (acknowledged)
 *   approved        -> public
 *   pending         -> awaiting human moderation in WordPress
 *   spam            -> marked as spam in WordPress
 *   deleted         -> removed in WordPress
 *   rejected        -> never imported (honeypot, invalid request)
 *
 * Only `approved` records are ever rendered. Email addresses, addresses and
 * classification reasons are stored for WordPress and for operations, never
 * for the browser.
 */

export const COMMENT_STATUS = {
  AWAITING: 'awaiting_import',
  IMPORTED: 'imported',
  APPROVED: 'approved',
  PENDING: 'pending',
  SPAM: 'spam',
  DELETED: 'deleted',
  REJECTED: 'rejected',
};

export const PUBLIC_STATUSES = [COMMENT_STATUS.APPROVED];
export const MAX_CONTENT = 4000;
export const MIN_CONTENT = 2;
export const MAX_NAME = 60;
export const MAX_EMAIL = 254;
export const PAGE_SIZE = 10;

/* ------------------------------------------------------------- validation */

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const URL_RE = /https?:\/\/[^\s<>"']+/gi;

/** Removes every kind of markup and control character from user text. */
export function plainText(value, max = MAX_CONTENT) {
  let text = String(value == null ? '' : value);
  text = text.replace(/\r\n?/g, '\n');
  // No HTML can survive: comments are plain text and are escaped on output.
  text = text.replace(/<[^>]*>/g, ' ');
  // Strip C0/C1 control characters that would corrupt the JSON store or logs.
  text = text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  text = text.replace(/[ \t\u00a0]+/g, ' ');
  text = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
  return text.slice(0, max);
}

export function normalizeEmail(value) {
  return String(value == null ? '' : value).trim().toLowerCase().slice(0, MAX_EMAIL);
}

export function validateSubmission(input) {
  const errors = [];
  const name = plainText(input.author, MAX_NAME);
  const email = normalizeEmail(input.email);
  const content = plainText(input.content, MAX_CONTENT + 1);

  if (name.length < 2) errors.push('name:too_short');
  if (name.length > MAX_NAME) errors.push('name:too_long');
  if (!EMAIL_RE.test(email)) errors.push('email:invalid');
  if (content.trim().length < MIN_CONTENT) errors.push('content:too_short');
  if (content.length > MAX_CONTENT) errors.push('content:too_long');

  return { errors, name, email, content: content.slice(0, MAX_CONTENT) };
}

/* --------------------------------------------------------- classification */

/**
 * Deterministic, documented heuristics. No accuracy is claimed: the policy
 * says "trustworthy only when nothing is suspicious", and every uncertain
 * result stays pending for a human.
 */
const SPAM_PATTERNS = [
  { id: 'pharma', re: /\b(viagra|cialis|levitra|tramadol|oxycontin|phentermine)\b/i },
  { id: 'gambling', re: /\b(online casino|sportsbook|betting tips|slot machine|jackpot bonus)\b/i },
  { id: 'crypto-giveaway', re: /\b(bitcoin giveaway|double your (btc|bitcoin|crypto)|free crypto|claim your airdrop)\b/i },
  { id: 'link-selling', re: /\b(buy backlinks|guest post service|seo services|rank (higher|#1) on google)\b/i },
  { id: 'loan', re: /\b(payday loan|quick loan|crypto loan|no credit check)\b/i },
  { id: 'adult', re: /\b(escort service|porn|xxx)\b/i },
  { id: 'work-from-home', re: /\b(work from home|make \$?\d{2,} ?(per|a) (day|hour)|passive income blueprint)\b/i },
];

const LINK_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'cutt.ly', 'shorturl.at', 'rb.gy', 'rebrand.ly',
];

const SUSPICIOUS_TLDS = ['.top', '.xyz', '.click', '.loan', '.work', '.buzz', '.surf', '.cam', '.rest'];

export function extractLinks(text) {
  return String(text || '').match(URL_RE) || [];
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * @returns {{verdict: 'trustworthy'|'suspicious'|'spam', reasons: string[]}}
 */
export function classifyComment({ name, content }) {
  const reasons = [];
  const links = extractLinks(content);
  const hosts = links.map(hostOf).filter(Boolean);
  const text = String(content || '');

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.re.test(text)) reasons.push(`spam_pattern:${pattern.id}`);
  }
  if (reasons.length) return { verdict: 'spam', reasons };

  if (hosts.some((host) => LINK_SHORTENERS.includes(host))) {
    return { verdict: 'spam', reasons: ['link_shortener'] };
  }
  if (hosts.some((host) => SUSPICIOUS_TLDS.some((tld) => host.endsWith(tld)))) {
    return { verdict: 'spam', reasons: ['suspicious_tld'] };
  }
  if (links.length >= 3) return { verdict: 'spam', reasons: ['too_many_links'] };
  if (extractLinks(name).length) return { verdict: 'spam', reasons: ['link_in_name'] };

  if (text.length < 8) reasons.push('too_short');
  if (text.length > 20) {
    const letters = text.replace(/[^A-Za-z]/g, '');
    const upper = text.replace(/[^A-Z]/g, '');
    if (letters.length >= 20 && upper.length / letters.length > 0.7) reasons.push('excessive_caps');
  }
  if (links.length > 0) reasons.push('link_present');

  if (reasons.length) return { verdict: 'suspicious', reasons };
  return { verdict: 'trustworthy', reasons: ['no_signals'] };
}

/** Comment ids are unguessable and carry no sequence or user information. */
function newCommentId() {
  return `c_${crypto.randomBytes(12).toString('hex')}`;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

/* ------------------------------------------------------------------ store */

/**
 * Durable comment storage next to the existing article store: one JSON file,
 * atomic renames, one in-process writer. No second database is introduced.
 */
export function createCommentStore(dataDir, { secret = '', now = () => Date.now(), classifier = classifyComment } = {}) {
  const file = path.join(dataDir, 'comments.json');
  let comments = {};
  let idempotency = {};
  let meta = {};
  let loaded = false;
  let queue = Promise.resolve();

  function keyed(prefix, value) {
    const material = `${prefix}:${String(value)}`;
    if (secret && secret.length >= 32) {
      return crypto.createHmac('sha256', secret).update(material).digest('hex');
    }
    // A receiver without a secret never accepts authenticated traffic; the
    // fallback only keeps local tests deterministic.
    return sha256(material);
  }

  async function readJson(target, fallback) {
    try {
      const raw = await fs.readFile(target, 'utf8');
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  async function persist() {
    await fs.mkdir(dataDir, { recursive: true });
    const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
    await fs.writeFile(tmp, JSON.stringify({ comments, idempotency, meta }, null, 2));
    await fs.rename(tmp, file);
  }

  function serial(fn) {
    const run = queue.then(fn, fn);
    queue = run.catch(() => {});
    return run;
  }

  async function load() {
    if (loaded) return;
    await fs.mkdir(dataDir, { recursive: true });
    const parsed = await readJson(file, {});
    comments = parsed && typeof parsed.comments === 'object' ? parsed.comments : {};
    idempotency = parsed && typeof parsed.idempotency === 'object' ? parsed.idempotency : {};
    meta = parsed && typeof parsed.meta === 'object' ? parsed.meta : {};
    loaded = true;
  }

  function publicProjection(comment) {
    return {
      id: comment.id,
      parentId: comment.parentId || null,
      author: comment.author,
      content: comment.content,
      createdAt: comment.createdAt,
    };
  }

  return {
    file,

    async init() {
      await load();
      return { comments: Object.keys(comments).length };
    },

    get(id) {
      return comments[id] || null;
    },

    count() {
      return Object.keys(comments).length;
    },

    /** Approved comments for one article, oldest first, as a flat list. */
    listApproved(articleUuid) {
      return Object.values(comments)
        .filter((c) => c.articleUuid === articleUuid && c.status === COMMENT_STATUS.APPROVED)
        .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    },

    /**
     * Pagination is by thread root, so a page never delivers a reply without
     * its parent. Replies always travel with their root.
     */
    pageApproved(articleUuid, { cursor = 0, limit = PAGE_SIZE } = {}) {
      const { roots, total, totalRoots } = this.buildThread(articleUuid);
      const start = Math.max(0, Math.min(Number(cursor) || 0, roots.length));
      const size = Math.max(1, Math.min(Number(limit) || PAGE_SIZE, 50));
      const slice = roots.slice(start, start + size);
      const next = start + slice.length;
      return {
        comments: slice,
        total,
        totalRoots,
        nextCursor: next < roots.length ? String(next) : null,
      };
    },

    /** Full approved tree, oldest first. */
    buildThread(articleUuid) {
      const all = this.listApproved(articleUuid);
      const roots = [];
      const byId = new Map();
      for (const comment of all) {
        byId.set(comment.id, { ...publicProjection(comment), replies: [] });
      }
      for (const comment of all) {
        const node = byId.get(comment.id);
        const parent = comment.parentId ? byId.get(comment.parentId) : null;
        if (parent) parent.replies.push(node);
        else roots.push(node);
      }
      return { roots, total: all.length, totalRoots: roots.length };
    },

    /** First page of the thread, used when the static article page renders. */
    thread(articleUuid, { limit = PAGE_SIZE } = {}) {
      const { roots, total, totalRoots } = this.buildThread(articleUuid);
      const size = Math.max(1, Math.min(Number(limit) || PAGE_SIZE, 50));
      return {
        roots: roots.slice(0, size),
        total,
        totalRoots,
        nextCursor: roots.length > size ? String(size) : null,
      };
    },

    /**
     * Stores one visitor submission. Callers have already validated the fields
     * and resolved the article; this only decides the classification, applies
     * duplicate protection and persists.
     */
    async submit({ articleUuid, lang, slug, name, email, content, parentId = null, ip = '', idempotencyKey = '', userAgent = '' }) {
      return serial(async () => {
        await load();

        if (idempotencyKey) {
          const previous = idempotency[idempotencyKey];
          if (previous && comments[previous]) {
            return { duplicate: true, comment: comments[previous] };
          }
        }

        const emailHash = keyed('email', email);
        const contentHash = sha256(content);
        const recentDuplicate = Object.values(comments).find(
          (c) =>
            c.articleUuid === articleUuid &&
            c.contentHash === contentHash &&
            c.emailHash === emailHash &&
            c.status !== COMMENT_STATUS.DELETED &&
            now() - Date.parse(c.createdAt) < 30 * 24 * 60 * 60 * 1000,
        );
        if (recentDuplicate) {
          return { duplicate: true, comment: recentDuplicate };
        }

        // Fail-safe: a classifier that throws or returns nonsense must never
        // auto-publish anything. The comment waits for a human instead.
        let classification;
        try {
          const candidate = classifier({ name, content });
          classification =
            candidate && ['trustworthy', 'suspicious', 'spam'].includes(candidate.verdict)
              ? { verdict: candidate.verdict, reasons: Array.isArray(candidate.reasons) ? candidate.reasons : [] }
              : { verdict: 'suspicious', reasons: ['classifier_unavailable'] };
        } catch {
          classification = { verdict: 'suspicious', reasons: ['classifier_unavailable'] };
        }
        const id = newCommentId();
        const createdAt = new Date(now()).toISOString();
        const record = {
          id,
          articleUuid,
          lang: lang || '',
          slug: slug || '',
          parentId: parentId || null,
          author: name,
          email,
          emailHash,
          content,
          contentHash,
          status: COMMENT_STATUS.AWAITING,
          classification,
          source: 'web',
          createdAt,
          updatedAt: createdAt,
          importedAt: null,
          wpCommentId: null,
          attempts: 0,
          version: 1,
          ipHash: ip ? keyed('ip', ip).slice(0, 32) : '',
          userAgentHash: userAgent ? sha256(userAgent).slice(0, 16) : '',
        };

        comments[id] = record;
        if (idempotencyKey) idempotency[idempotencyKey] = id;
        const idempotencyKeys = Object.keys(idempotency);
        if (idempotencyKeys.length > 2000) {
          for (const stale of idempotencyKeys.slice(0, idempotencyKeys.length - 1500)) delete idempotency[stale];
        }
        await persist();
        return { duplicate: false, comment: record };
      });
    },

    /** Records a submission that must never be imported (honeypot). */
    async reject({ articleUuid, reason }) {
      return serial(async () => {
        await load();
        const id = newCommentId();
        const at = new Date(now()).toISOString();
        // Deliberately stores no content, no name and no email.
        comments[id] = {
          id,
          articleUuid: String(articleUuid || '').slice(0, 64),
          lang: '',
          slug: '',
          parentId: null,
          author: '',
          email: '',
          content: '',
          status: COMMENT_STATUS.REJECTED,
          classification: { verdict: 'invalid', reasons: [String(reason || 'invalid').slice(0, 40)] },
          source: 'web',
          createdAt: at,
          updatedAt: at,
          importedAt: null,
          wpCommentId: null,
          attempts: 0,
          version: 1,
        };
        await persist();
        return comments[id];
      });
    },

    /** Items WordPress may import now. Parents are delivered before replies. */
    pending({ limit = 25 } = {}) {
      const rows = Object.values(comments)
        .filter((c) => c.status === COMMENT_STATUS.AWAITING)
        .sort((a, b) => {
          const parentOrder = (c) => (c.parentId ? 1 : 0);
          return parentOrder(a) - parentOrder(b) || String(a.createdAt).localeCompare(String(b.createdAt));
        })
        .slice(0, Math.max(1, Math.min(Number(limit) || 25, 100)));
      return rows;
    },

    /**
     * WordPress confirms an import. This is the only place a comment can
     * become public, so a receiver that never receives the acknowledgement
     * never publishes anything.
     */
    async acknowledge({ entries = [] } = {}) {
      return serial(async () => {
        await load();
        const applied = [];
        const at = new Date(now()).toISOString();
        for (const entry of entries) {
          const comment = comments[entry && entry.id];
          if (!comment) continue;
          const status = [COMMENT_STATUS.APPROVED, COMMENT_STATUS.PENDING, COMMENT_STATUS.SPAM].includes(entry.status)
            ? entry.status
            : COMMENT_STATUS.PENDING;
          comment.status = status;
          comment.wpCommentId = Number(entry.wpCommentId) || null;
          comment.importedAt = at;
          comment.updatedAt = at;
          comment.attempts = Number(comment.attempts || 0) + 1;
          comment.version = Number(comment.version || 1) + 1;
          applied.push(comment);
        }
        if (applied.length) {
          meta.lastImportAt = at;
          await persist();
        }
        return applied;
      });
    },

    /** WordPress moderation result, including edits and deletions. */
    async applyStatus({ updates = [] } = {}) {
      return serial(async () => {
        await load();
        const applied = [];
        const at = new Date(now()).toISOString();
        for (const update of updates) {
          const comment = comments[update && update.id];
          if (!comment) continue;
          const allowed = [
            COMMENT_STATUS.APPROVED,
            COMMENT_STATUS.PENDING,
            COMMENT_STATUS.SPAM,
            COMMENT_STATUS.DELETED,
          ];
          if (!allowed.includes(update.status)) continue;
          // WordPress versions are compared only with WordPress versions: an
          // older decision never overrides a newer one, and the receiver's own
          // revision counter is never mixed into that comparison.
          const wpVersion = Number(update.version) || 0;
          if (wpVersion && wpVersion <= Number(comment.wpVersion || 0)) continue;
          if (wpVersion) comment.wpVersion = wpVersion;
          comment.status = update.status;
          if (typeof update.content === 'string' && update.content.length) {
            comment.content = plainText(update.content, MAX_CONTENT);
            comment.contentHash = sha256(comment.content);
          }
          if (typeof update.authorName === 'string' && update.authorName.trim()) {
            comment.author = plainText(update.authorName, MAX_NAME);
          }
          if (update.wpCommentId) comment.wpCommentId = Number(update.wpCommentId);
          comment.version = Number(comment.version || 1) + 1;
          comment.updatedAt = at;
          applied.push(comment);
        }
        if (applied.length) {
          meta.lastStatusAt = at;
          await persist();
        }
        return applied;
      });
    },

    /**
     * A comment that originated in WordPress (an administrator reply). It is
     * already approved there, so it becomes public immediately.
     */
    async publishLocal({ articleUuid, parentId = null, authorName, content, createdAt, externalId = '' }) {
      return serial(async () => {
        await load();
        const text = plainText(content, MAX_CONTENT);
        if (!text) return null;
        if (externalId) {
          const existing = Object.values(comments).find((c) => c.externalId === externalId);
          // Idempotent: a retried publish must not duplicate a public reply.
          if (existing) return { created: false, comment: existing };
        }
        const id = newCommentId();
        const at = createdAt ? new Date(createdAt).toISOString() : new Date(now()).toISOString();
        comments[id] = {
          id,
          articleUuid: String(articleUuid),
          lang: '',
          slug: '',
          parentId: parentId || null,
          author: plainText(authorName || 'Elom Akakpovi', MAX_NAME),
          email: '',
          content: text,
          contentHash: sha256(text),
          status: COMMENT_STATUS.APPROVED,
          classification: { verdict: 'editorial', reasons: ['authored_in_wordpress'] },
          source: 'wordpress',
          externalId: externalId || '',
          createdAt: at,
          updatedAt: at,
          importedAt: at,
          wpCommentId: null,
          attempts: 0,
          version: 1,
        };
        await persist();
        return { created: true, comment: comments[id] };
      });
    },

    /** Retention: spam, rejected and deleted records do not live forever. */
    async prune({ spamDays = 30, rejectedDays = 14, deletedDays = 30 } = {}) {
      return serial(async () => {
        await load();
        const day = 24 * 60 * 60 * 1000;
        const limits = {
          [COMMENT_STATUS.SPAM]: spamDays * day,
          [COMMENT_STATUS.REJECTED]: rejectedDays * day,
          [COMMENT_STATUS.DELETED]: deletedDays * day,
        };
        let removed = 0;
        for (const [id, comment] of Object.entries(comments)) {
          const limit = limits[comment.status];
          if (!limit) continue;
          if (now() - Date.parse(comment.updatedAt || comment.createdAt) > limit) {
            delete comments[id];
            removed += 1;
          }
        }
        if (removed) await persist();
        return { removed };
      });
    },

    stats() {
      const values = Object.values(comments);
      const countBy = (status) => values.filter((c) => c.status === status).length;
      return {
        received: values.filter((c) => c.status !== COMMENT_STATUS.REJECTED).length,
        awaitingImport: countBy(COMMENT_STATUS.AWAITING),
        imported: values.filter((c) => c.importedAt).length,
        approved: countBy(COMMENT_STATUS.APPROVED),
        pending: countBy(COMMENT_STATUS.PENDING),
        spam: countBy(COMMENT_STATUS.SPAM),
        rejected: countBy(COMMENT_STATUS.REJECTED),
        deleted: countBy(COMMENT_STATUS.DELETED),
        lastImportAt: meta.lastImportAt || null,
        lastStatusAt: meta.lastStatusAt || null,
      };
    },
  };
}

/* ------------------------------------------------------- abuse throttling */

/**
 * Two fixed windows per identity: a burst window and a daily window. Keys are
 * the caller's pseudonymous IP hash, so no address is retained.
 */
export function createCommentLimiter({ perHour = 5, perDay = 20, now = Date.now } = {}) {
  const hits = new Map();

  return function allow(key, { weight = 1 } = {}) {
    const t = now();
    const entry = hits.get(key) || { hourStart: t, hour: 0, dayStart: t, day: 0 };
    if (t - entry.hourStart > 60 * 60 * 1000) {
      entry.hourStart = t;
      entry.hour = 0;
    }
    if (t - entry.dayStart > 24 * 60 * 60 * 1000) {
      entry.dayStart = t;
      entry.day = 0;
    }
    if (entry.hour + weight > perHour) {
      hits.set(key, entry);
      return { allowed: false, reason: 'hour' };
    }
    if (entry.day + weight > perDay) {
      hits.set(key, entry);
      return { allowed: false, reason: 'day' };
    }
    entry.hour += weight;
    entry.day += weight;
    hits.set(key, entry);
    if (hits.size > 20000) {
      for (const [oldKey, old] of hits) {
        if (t - old.dayStart > 24 * 60 * 60 * 1000) hits.delete(oldKey);
      }
    }
    return { allowed: true };
  };
}
