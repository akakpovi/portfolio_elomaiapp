import { useState, useEffect } from 'react';
import { Menu, X, Cpu, ArrowUpRight } from 'lucide-react';
import { useLang, i18n, tx, type Lang } from './i18n';
import { SITE } from '../data/site';

const NAV_LINKS = [
  { key: 'home', href: '#home' },
  { key: 'solutions', href: '#solutions' },
  { key: 'services', href: '#services' },
  { key: 'projects', href: '#projects' },
  { key: 'technologies', href: '#technologies' },
  { key: 'about', href: '#about' },
  { key: 'blog', href: '#blog' },
  { key: 'contact', href: '#contact' },
] as const;

const LANGS: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

export function Header() {
  const { lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const ids = NAV_LINKS.map(l => l.href.slice(1));
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    const id = href.replace('#', '');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(2, 8, 23, 0.95)' : 'rgba(2, 8, 23, 0.6)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(139, 92, 246, 0.22)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 32px rgba(2, 8, 23, 0.6)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <button onClick={() => handleNav('#home')} className="flex items-center gap-2.5 group" aria-label="EL0M AI Engineer — home">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                boxShadow: '0 0 18px rgba(139, 92, 246, 0.35)',
              }}
            >
              <Cpu size={16} className="text-white" />
            </span>
            <span
              className="text-xs sm:text-sm tracking-[0.18em] uppercase hidden xs:block"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: '#c4b5fd', fontWeight: 600 }}
            >
              EL0M<span style={{ color: '#22d3ee' }}>.</span>AI
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
            {NAV_LINKS.map(({ key, href }) => {
              const id = href.slice(1);
              const active = activeSection === id;
              return (
                <button
                  key={key}
                  onClick={() => handleNav(href)}
                  aria-current={active ? 'true' : undefined}
                  className="px-2.5 py-1.5 text-[13px] rounded-md relative transition-colors duration-200"
                  style={{
                    color: active ? '#a5b4fc' : '#94a3b8',
                    fontFamily: 'DM Sans, sans-serif',
                    background: active ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                  }}
                >
                  {tx(i18n.nav[key as keyof typeof i18n.nav], lang)}
                </button>
              );
            })}
            <a
              href={SITE.freelancer}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] transition-all duration-200"
              style={{
                color: '#67e8f9',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                background: 'rgba(6, 182, 212, 0.06)',
                fontFamily: 'DM Sans, sans-serif',
                textDecoration: 'none',
              }}
            >
              {tx(i18n.nav.freelancer, lang)}
              <ArrowUpRight size={13} />
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-0.5 rounded-lg px-1 py-1"
              style={{ background: 'rgba(18, 26, 52, 0.7)', border: '1px solid rgba(139, 92, 246, 0.18)' }}
              role="group"
              aria-label="Language selector"
            >
              {LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className="px-1.5 py-0.5 text-[11px] rounded-md transition-all duration-150"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600,
                    background: lang === code ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                    color: lang === code ? '#c4b5fd' : '#64748b',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg"
              style={{ color: '#94a3b8' }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="lg:hidden border-t overflow-y-auto"
          style={{
            background: 'rgba(2, 8, 23, 0.99)',
            borderColor: 'rgba(139, 92, 246, 0.18)',
            maxHeight: 'calc(100vh - 64px)',
          }}
        >
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ key, href }) => (
              <button
                key={key}
                onClick={() => handleNav(href)}
                className="text-left px-4 py-3 rounded-lg text-sm"
                style={{ fontFamily: 'DM Sans, sans-serif', color: '#cbd5e1' }}
              >
                {tx(i18n.nav[key as keyof typeof i18n.nav], lang)}
              </button>
            ))}
            <a
              href={SITE.freelancer}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-between gap-2 px-4 py-3 rounded-lg text-sm"
              style={{
                color: '#67e8f9',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                background: 'rgba(6, 182, 212, 0.06)',
                textDecoration: 'none',
              }}
            >
              {tx(i18n.nav.freelancer, lang)} · {SITE.freelancerHandle}
              <ArrowUpRight size={15} />
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
