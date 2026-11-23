import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * M09.2 — public comment interface.
 *
 * Runs against the local preview that mirrors the nginx routing: static blog
 * pages from the content receiver plus a proxy for /content-api/*. Nothing
 * touches production, and no fixture contains real visitor data.
 *
 *   BASE_URL=http://127.0.0.1:8098 ./node_modules/.bin/playwright test e2e/blog-comments.spec.ts
 */

const EN = '/blog/en/spf-dkim-dmarc-monitoring/';
const DE = '/blog/de/spf-dkim-dmarc-ueberwachen/';
const FR = '/blog/fr/spf-dkim-dmarc-surveiller/';
const DISABLED = '/blog/en/comment-disabled-preview/';

const ROOT_TEXT = 'The DMARC reporting addresses were the part I always got wrong.';
const REPLY_TEXT = 'Same here — the note about p=none running for a few weeks';
const SECOND_TEXT = 'Do you also monitor the aggregate reports for subdomains?';
const PENDING_TEXT = 'Great post, I wrote something similar at';
const SPAM_TEXT = 'Best casino bonus!';
const VISITOR_EMAIL = 'marie@example.com';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../docs/screenshots/m09-2');

async function fillForm(page: Page, { author = 'Test Reader', email = 'reader@example.org', content = 'A test comment with enough text to be accepted.' } = {}) {
  const section = page.locator('#comments');
  await section.getByLabel('Display name', { exact: true }).fill(author);
  await section.getByLabel('Email address', { exact: true }).fill(email);
  await section.getByLabel('Comment', { exact: true }).fill(content);
  await section.locator('input[name="consent"]').check();
}

function collectErrors(page: Page) {
  const consoleErrors: string[] = [];
  const notFound: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('response', (res) => {
    if (res.status() === 404) notFound.push(res.url());
  });
  return { consoleErrors, notFound };
}

test.describe('public comments — visibility', () => {
  test('only approved comments are rendered', async ({ page }) => {
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#comments');

    await expect(section).toBeVisible();
    await expect(section.getByRole('heading', { level: 2 })).toHaveText('3 comments');
    await expect(section.locator('.comment')).toHaveCount(3);
    await expect(section).toContainText(ROOT_TEXT);
    await expect(section).toContainText(SECOND_TEXT);
    await expect(section).toContainText(REPLY_TEXT);

    // Pending and spam comments exist on the receiver but must never appear.
    const html = await page.content();
    expect(html).not.toContain(PENDING_TEXT);
    expect(html).not.toContain(SPAM_TEXT);
    await expect(section).not.toContainText('Moderation');
  });

  test('no personal data is exposed anywhere on the page', async ({ page }) => {
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    expect(html).not.toContain(VISITOR_EMAIL);
    expect(html).not.toContain('marie@');
    // No internal identifiers or moderation reasons.
    expect(html).not.toContain('wpCommentId');
    expect(html).not.toContain('trustworthy');
    expect(html).not.toContain('suspicious');
  });

  test('threaded reply is nested under its root comment', async ({ page }) => {
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const root = page.locator('.comment-list > .comment').filter({ hasText: 'Marie Dupont' });
    await expect(root).toHaveCount(1);
    const replies = root.locator('.comment-replies .comment');
    await expect(replies).toHaveCount(1);
    await expect(replies.first()).toContainText(REPLY_TEXT);
    await expect(replies.first()).toContainText('Thomas Weber');
  });

  test('date and time are shown for every comment', async ({ page }) => {
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const times = page.locator('#comments time');
    await expect(times).toHaveCount(3);
    const value = await times.first().getAttribute('datetime');
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    await expect(times.first()).not.toHaveText('');
  });
});

test.describe('public comments — form', () => {
  test('form is labelled and its status region is announced', async ({ page }) => {
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#comments');

    await expect(section.getByLabel('Display name', { exact: true })).toBeVisible();
    await expect(section.getByLabel('Email address', { exact: true })).toBeVisible();
    await expect(section.getByLabel('Comment', { exact: true })).toBeVisible();
    await expect(section.getByRole('checkbox')).toHaveAttribute('required', '');
    await expect(section.getByRole('button', { name: 'Post comment' })).toBeVisible();

    const status = section.locator('[data-comment-notice]');
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).toHaveAttribute('aria-live', 'polite');

    // The reply controls only exist once a reply target is chosen.
    await expect(section.getByRole('button', { name: 'Cancel' })).toBeHidden();

    // The privacy acknowledgement links to the published privacy page.
    await expect(section.getByRole('link', { name: 'Privacy notice' })).toHaveAttribute('href', '/privacy/');

    // Honeypot is present for bots but positioned outside the viewport.
    const honey = await section.locator('input[name="website"]').boundingBox();
    expect(honey?.x ?? 0).toBeLessThan(0);
  });

  test('client-side validation prevents an empty submission', async ({ page }) => {
    let requests = 0;
    await page.route('**/comments/v1/submit', (route) => {
      requests += 1;
      return route.abort();
    });
    await page.goto(EN, { waitUntil: 'domcontentloaded' });

    const section = page.locator('#comments');
    await section.getByRole('button', { name: 'Post comment' }).click();
    await expect(section.locator('[data-comment-notice]')).toContainText('Please check the required fields.');
    expect(requests).toBe(0);

    // An invalid address is rejected on the client as well.
    await fillForm(page, { email: 'not-an-email' });
    await section.getByRole('button', { name: 'Post comment' }).click();
    await expect(section.locator('[data-comment-notice]')).toContainText('Please check the required fields.');
    expect(requests).toBe(0);
  });

  test('a successful submission confirms without publishing the comment', async ({ page }, testInfo) => {
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#comments');
    // Unique per project: four viewports submit in parallel against one receiver.
    const tag = testInfo.project.name;
    const content = `A freshly submitted comment that must wait for moderation (${tag}).`;

    await fillForm(page, { email: `reader-${tag}@example.org`, content });
    await section.getByRole('button', { name: 'Post comment' }).scrollIntoViewIfNeeded();
    await section.getByRole('button', { name: 'Post comment' }).click();

    await expect(section.locator('[data-comment-notice]')).toContainText('Thank you. Your comment was received');
    await expect(section.getByLabel('Display name', { exact: true })).toHaveValue('');
    await expect(section.getByLabel('Comment', { exact: true })).toHaveValue('');
    // Still invisible: approval is WordPress' decision, not the browser's.
    await expect(section).not.toContainText('A freshly submitted comment that must wait');
    await expect(section.locator('.comment')).toHaveCount(3);
  });

  test('a rate-limited submission is reported clearly', async ({ page }) => {
    await page.route('**/comments/v1/submit', (route) =>
      route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'rate_limited' }) }),
    );
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#comments');

    await fillForm(page);
    await section.getByRole('button', { name: 'Post comment' }).click();
    await expect(section.locator('[data-comment-notice]')).toContainText('You have submitted several comments recently.');
    await expect(section.locator('[data-comment-notice]')).toHaveClass(/is-error/);
  });

  test('a server failure is reported and the form stays usable', async ({ page }) => {
    await page.route('**/comments/v1/submit', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'internal_error' }) }),
    );
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#comments');

    await fillForm(page);
    const submit = section.getByRole('button', { name: 'Post comment' });
    await submit.click();
    await expect(section.locator('[data-comment-notice]')).toContainText('Your comment could not be sent.');
    await expect(submit).toBeEnabled();
  });

  test('a network failure is reported without losing the input', async ({ page }) => {
    await page.route('**/comments/v1/submit', (route) => route.abort());
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#comments');

    await fillForm(page, { content: 'Draft text that must survive a failed request.' });
    await section.getByRole('button', { name: 'Post comment' }).click();
    await expect(section.locator('[data-comment-notice]')).toContainText('Your comment could not be sent.');
    await expect(section.getByLabel('Comment', { exact: true })).toHaveValue('Draft text that must survive a failed request.');
  });

  test('reply targeting sets and clears the parent', async ({ page }) => {
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#comments');
    const root = page.locator('.comment-list > .comment').filter({ hasText: 'Marie Dupont' });

    // The root also contains its reply, which has its own Reply button.
    await root.getByRole('button', { name: 'Reply' }).first().click();
    await expect(section.locator('[data-reply-note]')).toContainText('Replying to Marie Dupont');
    const parent = section.locator('input[name="parent"]');
    await expect(parent).toHaveValue(/^c_[a-f0-9]{24}$/);

    await section.getByRole('button', { name: 'Cancel' }).click();
    await expect(parent).toHaveValue('');
    await expect(section.locator('[data-reply-note]')).toBeHidden();
  });
});

test.describe('public comments — configuration and languages', () => {
  test('comments can be disabled per article', async ({ page }) => {
    await page.goto(DISABLED, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#comments');
    await expect(section).toBeVisible();
    await expect(section).toContainText('Comments are closed for this article.');
    await expect(section.locator('[data-comment-form]')).toHaveCount(0);
    await expect(page.locator('.article-body')).toContainText('DMARC');
  });

  test('German labels are localised', async ({ page }) => {
    await page.goto(DE, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#comments');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(section.getByRole('heading', { level: 2 })).toHaveText('1 Kommentar');
    await expect(section).toContainText('Kommentare werden moderiert.');
    await expect(section.getByLabel('Anzeigename', { exact: true })).toBeVisible();
    await expect(section.getByLabel('E-Mail-Adresse', { exact: true })).toBeVisible();
    await expect(section.getByRole('button', { name: 'Kommentar absenden' })).toBeVisible();
    await expect(section.getByRole('link', { name: 'Datenschutzhinweis' })).toBeVisible();
  });

  test('French labels are localised', async ({ page }) => {
    await page.goto(FR, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#comments');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(section.getByRole('heading', { level: 2 })).toHaveText('1 commentaire');
    await expect(section.getByLabel('Nom affiché', { exact: true })).toBeVisible();
    await expect(section.getByLabel('Adresse e-mail', { exact: true })).toBeVisible();
    await expect(section.getByRole('button', { name: 'Publier le commentaire' })).toBeVisible();
    await expect(section.getByRole('link', { name: 'Mentions de confidentialité' })).toBeVisible();
  });

  test('English labels are used on the English article', async ({ page }) => {
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const section = page.locator('#comments');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(section.getByLabel('Display name', { exact: true })).toBeVisible();
    await expect(section.getByRole('button', { name: 'Post comment' })).toBeVisible();
  });
});

test.describe('public comments — layout and runtime', () => {
  test('no horizontal overflow at this viewport', async ({ page }) => {
    await page.goto(EN, { waitUntil: 'networkidle' });
    const viewport = page.viewportSize();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);

    const box = await page.locator('#comments').boundingBox();
    expect(box?.width ?? 0).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
    expect(box?.width ?? 0).toBeGreaterThan(240);

    // Inputs never overflow their container either.
    const overflow = await page.locator('#comments input, #comments textarea').evaluateAll((elements) =>
      elements.filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1).length,
    );
    expect(overflow).toBe(0);
  });

  test('no console errors and no missing resources', async ({ page }) => {
    const { consoleErrors, notFound } = collectErrors(page);
    await page.goto(EN, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    expect(notFound, `404 responses: ${notFound.join(', ')}`).toEqual([]);
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
  });

  test('analytics stays inactive on the local host and is not required', async ({ page }) => {
    await page.goto(EN, { waitUntil: 'domcontentloaded' });
    const paq = await page.evaluate(() => typeof (window as unknown as { _paq?: unknown })._paq);
    expect(paq).toBe('undefined');
    // The form is fully usable without any tracker.
    await expect(page.locator('#comments [data-comment-form]')).toBeVisible();
  });

  test('captures the comment interface screenshots', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440x900', 'captured once, from the desktop project');
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    const shots: { name: string; url: string; width: number; height: number; target?: string }[] = [
      { name: 'comments-en-desktop-1440x900', url: EN, width: 1440, height: 900, target: '#comments' },
      { name: 'comments-en-mobile-390x844', url: EN, width: 390, height: 844, target: '#comments' },
      { name: 'comments-de-desktop-1440x900', url: DE, width: 1440, height: 900, target: '#comments' },
      { name: 'comments-disabled-en-desktop-1440x900', url: DISABLED, width: 1440, height: 900, target: '#comments' },
      { name: 'article-with-comments-en-1440x900', url: EN, width: 1440, height: 900 },
    ];

    for (const shot of shots) {
      await page.setViewportSize({ width: shot.width, height: shot.height });
      await page.goto(shot.url, { waitUntil: 'networkidle' });
      // Screenshot-only: the sticky header would otherwise cover the top of the
      // element capture. It does not change the layout being reviewed.
      await page.addStyleTag({ content: '.site-header { position: static !important; }' });
      const file = path.join(SCREENSHOT_DIR, `${shot.name}.png`);
      if (shot.target) {
        await page.locator(shot.target).screenshot({ path: file });
      } else {
        await page.screenshot({ path: file, fullPage: true });
      }
      expect(fs.statSync(file).size).toBeGreaterThan(8_000);
    }

    // The filled state is evidence for the review, not a submitted comment.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(EN, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '.site-header { position: static !important; }' });
    await page.locator('.comment-list > .comment').first().getByRole('button', { name: 'Reply' }).first().click();
    await fillForm(page, { content: 'This is what a visitor sees while writing a comment.' });
    await page.locator('#comments').screenshot({ path: path.join(SCREENSHOT_DIR, 'comments-form-filled-en-1440x900.png') });
    expect(fs.statSync(path.join(SCREENSHOT_DIR, 'comments-form-filled-en-1440x900.png')).size).toBeGreaterThan(8_000);
  });
});
