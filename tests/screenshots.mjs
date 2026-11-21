/**
 * Captures production screenshots for docs/screenshots.
 * Usage: BASE_URL=https://elomaiapp.com node screenshots.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE_URL || 'https://elomaiapp.com';
const out = new URL('../docs/screenshots/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });

async function shot(page, name, target) {
  const path = `${out}${name}.png`;
  if (target) await page.locator(target).screenshot({ path });
  else await page.screenshot({ path });
  console.log('saved', name);
}

async function settle(page, id) {
  await page.evaluate(sel => {
    document.querySelector(sel)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, id);
  await page.waitForTimeout(700);
}

// ---------- Desktop ----------
const desk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desk.goto(base, { waitUntil: 'networkidle' });
await desk.waitForTimeout(1200);
await shot(desk, '01-hero-en-desktop');

for (const [id, name] of [
  ['#services', '02-services-en'],
  ['#projects', '03-projects-grid-en'],
  ['#freelancer', '05-freelancer-en'],
  ['#about', '06-about-en'],
  ['#contact', '07-contact-en'],
]) {
  await settle(desk, id);
  await shot(desk, name, id);
}

// Project detail dialog
await settle(desk, '#projects');
await desk.locator('#projects article').first().getByRole('button', { name: /Project details/ }).first().click();
await desk.getByRole('dialog').waitFor();
await desk.waitForTimeout(500);
await shot(desk, '04-project-detail-aka-ia', '[role="dialog"]');
await desk.keyboard.press('Escape');

// Other languages
await desk.evaluate(() => window.scrollTo(0, 0));
await desk.locator('header').getByRole('group', { name: 'Language selector' }).getByRole('button', { name: 'FR' }).click();
await desk.waitForTimeout(900);
await shot(desk, '08-hero-fr-desktop');

await desk.locator('header').getByRole('group', { name: 'Language selector' }).getByRole('button', { name: 'DE' }).click();
await desk.waitForTimeout(900);
await shot(desk, '09-hero-de-desktop');

// ---------- Mobile ----------
const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mob.goto(base, { waitUntil: 'networkidle' });
await mob.waitForTimeout(1200);
await shot(mob, '10-mobile-hero-en');
await settle(mob, '#projects');
await mob.screenshot({ path: `${out}11-mobile-projects-en.png` });
console.log('saved 11-mobile-projects-en');

await mob.getByRole('button', { name: /open menu/i }).click();
await mob.waitForTimeout(500);
await mob.screenshot({ path: `${out}12-mobile-menu-en.png` });
console.log('saved 12-mobile-menu-en');

await browser.close();
