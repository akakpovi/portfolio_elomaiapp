import { test, expect, type Page } from '@playwright/test';

const FREELANCER = 'https://www.freelancer.com/u/eakakpovi656';
const LIVE_LINKS = ['https://appchat.elomaiapp.com/', 'https://app.elomaiapp.com/'];
const PROJECT_SLUGS = [
  'aka-ia',
  'afro-haar',
  'presence',
  'ecovision',
  'thermal-yolo',
  'infrastructure-as-code',
  'local-ai-operator',
  'private-ai-platform',
  'ai-security-assistant',
  'metaclean',
];

const SECTION_IDS = ['home', 'solutions', 'services', 'projects', 'technologies', 'about', 'blog', 'contact'];

const HEADLINES = {
  en: 'Building Intelligent Software',
  fr: 'Je construis des logiciels intelligents',
  de: 'Ich entwickle intelligente Software',
};

function isMobile(page: Page) {
  return (page.viewportSize()?.width ?? 1440) < 1024;
}

test.describe('page health', () => {
  test('renders the hero with the main headline and no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(HEADLINES.en);
    await expect(page.getByText('AI Engineer & Full-Stack Developer').first()).toBeVisible();

    const h1Count = await page.locator('h1').count();
    expect(h1Count, 'exactly one h1 per page').toBe(1);

    // Same-origin resources must all answer successfully.
    expect(errors, `console errors: ${errors.join(' | ')}`).toHaveLength(0);
  });

  test('has SEO metadata, canonical URL and structured data', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/AI Engineer/);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description?.length ?? 0).toBeGreaterThan(80);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://elomaiapp.com/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.png$/);
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ld).toContain('"@type": "Person"');
  });

  test('sitemap and robots are served', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain('Sitemap:');
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain('<urlset');
  });
});

test.describe('navigation', () => {
  for (const id of SECTION_IDS) {
    test(`navigates to #${id}`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const label = { home: 'Home', solutions: 'AI Solutions', services: 'Services', projects: 'Projects', technologies: 'Technologies', about: 'About', blog: 'Blog', contact: 'Contact' }[id];
      if (isMobile(page)) {
        await page.getByRole('button', { name: /open menu/i }).click();
        await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: label, exact: true }).click();
      } else {
        await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: label, exact: true }).click();
      }
      await page.waitForTimeout(700);
      const section = page.locator(`#${id}`);
      await expect(section).toBeInViewport({ ratio: 0.1 });
    });
  }

  test('mobile menu opens and closes', async ({ page }) => {
    test.skip(!isMobile(page), 'mobile only');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const toggle = page.getByRole('button', { name: /open menu/i });
    await toggle.click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
    await page.getByRole('button', { name: /close menu/i }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toHaveCount(0);
  });
});

test.describe('languages', () => {
  for (const [code, headline] of Object.entries(HEADLINES)) {
    test(`switches to ${code.toUpperCase()}`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator('header').getByRole('group', { name: 'Language selector' }).getByRole('button', { name: code.toUpperCase() }).click();
      await expect(page.getByRole('heading', { level: 1 })).toContainText(headline);
      expect(await page.locator('html').getAttribute('lang')).toBe(code === 'fr' ? 'fr' : code);
      // Services section must be translated too.
      const servicesHeading = page.locator('#services h2');
      await expect(servicesHeading).not.toBeEmpty();
    });
  }
});

test.describe('projects', () => {
  test('lists ten projects with status labels', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const cards = page.locator('#projects article');
    await expect(cards).toHaveCount(10);
    await expect(page.locator('#projects')).toContainText(/portfolio/i);
  });

  test('opens every project detail dialog and closes it', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    for (const slug of PROJECT_SLUGS) {
      const card = page.locator('#projects article').filter({ hasText: '' }).nth(PROJECT_SLUGS.indexOf(slug));
      await card.getByRole('button', { name: /Project details|Détails du projet|Projektdetails/ }).first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(/Project overview|Aperçu du projet|Projektüberblick/);
      await expect(dialog).toContainText(/My contribution|Ma contribution|Mein Beitrag/);
      await dialog.getByRole('button', { name: /Close|Fermer|Schließen/ }).click();
      await expect(dialog).toHaveCount(0);
    }
  });

  test('supports project deep links', async ({ page }) => {
    await page.goto('/#project-presence', { waitUntil: 'domcontentloaded' });
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Presence');
  });

  test('esc closes the project dialog', async ({ page }) => {
    await page.goto('/#project-metaclean', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('external links', () => {
  test('every freelancer CTA points at the profile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const links = page.locator(`a[href="${FREELANCER}"]`);
    const count = await links.count();
    expect(count, 'freelancer links exist in nav, hero and section').toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      await expect(links.nth(i)).toHaveAttribute('target', '_blank');
      await expect(links.nth(i)).toHaveAttribute('rel', /noopener/);
    }
  });

  test('verified live application links are the only outward project links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const hrefs = await page.locator('#projects a[href^="http"]').evaluateAll(
      els => els.map(e => (e as HTMLAnchorElement).href)
    );
    for (const live of LIVE_LINKS) {
      expect(hrefs).toContain(live);
    }
    const repos = hrefs.filter(h => h.includes('github.com') || h.includes('gitlab'));
    expect(repos).toContain('https://github.com/akakpovi/Meta_Clean');
    expect(repos).toContain('https://github.com/akakpovi/SaaS_Web_Application_digitale_presenz');
    expect(repos).toContain('https://gitlab.rlp.net/iac-schulung-projekt/infrastructure-as-code-schulung');
    // Dead links discovered during the audit must not be published.
    expect(hrefs.join(' ')).not.toContain('Afro-Haar-App');
    expect(hrefs.join(' ')).not.toContain('rag_multimodal');
  });

  test('no empty or placeholder hrefs remain', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const bad = await page.locator('a').evaluateAll(els =>
      els
        .map(e => (e as HTMLAnchorElement).getAttribute('href') || '')
        .filter(h => h === '' || h === '#' || h === 'undefined')
    );
    expect(bad).toEqual([]);
  });
});

test.describe('contact', () => {
  test('validates required fields', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.locator('#contact').getByRole('button', { name: /Send Message|Envoyer le message|Nachricht senden/ }).click();
    await expect(page.getByRole('alert').first()).toBeVisible();
    const alerts = await page.getByRole('alert').allTextContents();
    expect(alerts.length).toBeGreaterThanOrEqual(3);
  });

  test('rejects an invalid email address', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.getByLabel(/Your name|Votre nom|Ihr Name/).fill('Ada Lovelace');
    await page.getByLabel(/Your email|Votre email|Ihre E-Mail/).fill('not-an-email');
    await page.getByLabel(/Project subject|Sujet de votre projet|Betreff Ihres Projekts/).fill('Private AI assistant');
    await page.getByLabel(/Describe your project|Décrivez votre projet|Beschreiben Sie Ihr Projekt/).fill('I would like a private RAG assistant on my own workstation.');
    await page.locator('#contact').getByRole('button', { name: /Send Message|Envoyer le message|Nachricht senden/ }).click();
    await expect(page.getByText(/valid email|adresse email valide|gültige E-Mail-Adresse/)).toBeVisible();
  });

  test('accepts a valid submission and shows the ready state', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.getByLabel(/Your name|Votre nom|Ihr Name/).fill('Ada Lovelace');
    await page.getByLabel(/Your email|Votre email|Ihre E-Mail/).fill('ada@example.com');
    await page.getByLabel(/Project subject|Sujet de votre projet|Betreff Ihres Projekts/).fill('Private AI assistant');
    await page.getByLabel(/Describe your project|Décrivez votre projet|Beschreiben Sie Ihr Projekt/).fill('I would like a private RAG assistant on my own workstation, running fully locally with Ollama.');
    await page.locator('#contact').getByRole('button', { name: /Send Message|Envoyer le message|Nachricht senden/ }).click();
    await expect(page.getByText(/Your message is ready|Votre message est prêt|Ihre Nachricht ist vorbereitet/)).toBeVisible();
    await expect(page.getByText('ekakpovi656@gmail.com').first()).toBeVisible();
  });
});

test.describe('sections', () => {
  test('all main sections are present', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const sections = ['home', 'solutions', 'services', 'projects', 'technologies', 'about', 'freelancer', 'blog', 'contact'];
    for (const id of sections) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    await expect(page.locator('#services article')).toHaveCount(6);
  });

  test('about section states verified education and languages', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const about = page.locator('#about');
    await expect(about).toContainText('Hochschule Worms');
    await expect(about).toContainText('C1');
  });

  test('footer links are real', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const footer = page.locator('footer');
    await expect(footer.locator(`a[href="${FREELANCER}"]`)).toHaveCount(1);
    await expect(footer.locator('a[href="https://github.com/akakpovi"]')).toHaveCount(1);
    await expect(footer.locator('a[href="mailto:ekakpovi656@gmail.com"]')).toHaveCount(1);
  });
});
