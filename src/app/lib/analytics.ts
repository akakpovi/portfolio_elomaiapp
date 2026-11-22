/**
 * First-party Matomo tracking for the public portfolio.
 *
 * Rules encoded here:
 *  - Only the production host is tracked; local dev/preview never reports.
 *  - Cookieless configuration: no cookie, no localStorage identifier.
 *  - The visitor's opt-out (set on /privacy/) wins over everything.
 *  - One page view per distinct URL; React re-renders cannot duplicate them.
 *  - Only non-personal metadata is attached (slug, language, CTA location).
 */

const PRODUCTION_HOSTS = ['elomaiapp.com', 'www.elomaiapp.com'];
const SITE_ID = '1';
const OPTOUT_KEY = 'elomai_analytics_optout';

type Paq = unknown[][];

declare global {
  interface Window {
    _paq?: Paq;
    elomaiTrack?: (category: string, action: string, label?: string) => void;
  }
}

let initialised = false;
let lastTrackedUrl = '';

export function analyticsAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  if (!PRODUCTION_HOSTS.includes(window.location.hostname)) return false;
  try {
    return window.localStorage.getItem(OPTOUT_KEY) !== '1';
  } catch {
    return true;
  }
}

export function setAnalyticsOptOut(optOut: boolean): void {
  try {
    window.localStorage.setItem(OPTOUT_KEY, optOut ? '1' : '0');
  } catch {
    /* storage unavailable: the visitor's choice cannot be persisted */
  }
}

export function analyticsOptedOut(): boolean {
  try {
    return window.localStorage.getItem(OPTOUT_KEY) === '1';
  } catch {
    return false;
  }
}

function paq(): Paq | null {
  if (!analyticsAllowed()) return null;
  window._paq = window._paq || [];
  return window._paq;
}

/** Configures the tracker exactly once per page load. */
export function initAnalytics(): void {
  if (initialised || !analyticsAllowed()) return;
  initialised = true;

  const queue = paq();
  if (!queue) return;

  const origin = window.location.origin;
  queue.push(['disableCookies']);
  queue.push(['setTrackerUrl', `${origin}/matomo/matomo.php`]);
  queue.push(['setSiteId', SITE_ID]);
  queue.push(['enableLinkTracking']);
  queue.push(['setDocumentTitle', document.title]);
  queue.push(['setCustomUrl', `${origin}${window.location.pathname}`]);
  queue.push(['trackPageView']);
  lastTrackedUrl = `${origin}${window.location.pathname}`;

  const script = document.createElement('script');
  script.async = true;
  script.src = `${origin}/matomo/matomo.js`;
  document.head.appendChild(script);

  window.elomaiTrack = trackEvent;

  // Navigation inside this single-page site happens through the hash.
  window.addEventListener('hashchange', () => {
    const url = `${origin}${window.location.pathname}${window.location.hash}`;
    if (url === lastTrackedUrl) return;
    const queueAfter = paq();
    if (!queueAfter) return;
    queueAfter.push(['setCustomUrl', url]);
    queueAfter.push(['setDocumentTitle', `${document.title} ${window.location.hash}`]);
    queueAfter.push(['trackPageView']);
    lastTrackedUrl = url;
  });

  attachConversionTracking();
}

export function trackEvent(category: string, action: string, label = ''): void {
  const queue = paq();
  if (!queue) return;
  queue.push(['trackEvent', category, action, label]);
}

/**
 * One delegated listener instead of editing every CTA: anchors are classified
 * by their destination, and explicit data-event attributes take precedence.
 */
function attachConversionTracking(): void {
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const explicit = anchor.getAttribute('data-event');
      if (explicit) {
        trackEvent('conversion', explicit, anchor.getAttribute('data-location') || 'unknown');
        return;
      }

      const href = anchor.getAttribute('href') || '';
      if (href.includes('freelancer.com/u/eakakpovi656')) {
        trackEvent('conversion', 'freelancer_profile_click', 'link');
      } else if (href.startsWith('mailto:')) {
        trackEvent('conversion', 'email_click', 'mailto');
      } else if (href.includes('#contact')) {
        trackEvent('conversion', 'contact_click', 'anchor');
      }
    },
    { passive: true },
  );
}
