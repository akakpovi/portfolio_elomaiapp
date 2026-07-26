import { useState, useEffect } from 'react';
import { Menu, X, Cpu } from 'lucide-react';
import { useLang, i18n, tx, type Lang } from './i18n';

const NAV_LINKS = [
  { key: 'home', href: '#home' },
  { key: 'solutions', href: '#solutions' },
  { key: 'projects', href: '#projects' },
  { key: 'technologies', href: '#technologies' },
  { key: 'about', href: '#about' },
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
        background: scrolled
          ? 'rgba(2, 8, 23, 0.95)'
          : 'rgba(2, 8, 23, 0.6)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 32px rgba(6, 182, 212, 0.05)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNav('#home')}
            className="flex items-center gap-2 group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
              }}
            >
              <Cpu size={16} className="text-white" />
            </div>
            <span
              className="text-sm tracking-widest uppercase hidden sm:block"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: '#06b6d4' }}
            >
              AI.Engineer
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ key, href }) => (
              <button
                key={key}
                onClick={() => handleNav(href)}
                className="px-3 py-1.5 text-sm rounded-md transition-all duration-200 relative group"
                style={{
                  color: activeSection === key.replace('#', '') ? '#06b6d4' : '#94a3b8',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <span className="relative z-10 group-hover:text-cyan-400 transition-colors">
                  {tx(i18n.nav[key as keyof typeof i18n.nav], lang)}
                </span>
                {activeSection === href.replace('#', '') && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)' }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Right side: language + mobile menu */}
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div
              className="flex items-center gap-0.5 rounded-lg px-1 py-1"
              style={{ background: 'rgba(30, 42, 74, 0.6)', border: '1px solid rgba(6, 182, 212, 0.15)' }}
            >
              {LANGS.map(({ code, label }, i) => (
                <span key={code} className="flex items-center">
                  <button
                    onClick={() => setLang(code)}
                    className="px-2 py-0.5 text-xs rounded-md transition-all duration-150"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 600,
                      background: lang === code ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                      color: lang === code ? '#06b6d4' : '#64748b',
                      boxShadow: lang === code ? '0 0 10px rgba(6, 182, 212, 0.2)' : 'none',
                    }}
                  >
                    {label}
                  </button>
                  {i < LANGS.length - 1 && (
                    <span className="text-xs" style={{ color: '#1e2a4a' }}>|</span>
                  )}
                </span>
              ))}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: '#94a3b8' }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="lg:hidden border-t"
          style={{
            background: 'rgba(2, 8, 23, 0.98)',
            borderColor: 'rgba(6, 182, 212, 0.15)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(({ key, href }) => (
              <button
                key={key}
                onClick={() => handleNav(href)}
                className="text-left px-4 py-3 rounded-lg text-sm transition-all duration-150"
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  color: '#94a3b8',
                  background: 'transparent',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(6, 182, 212, 0.08)';
                  (e.currentTarget as HTMLElement).style.color = '#06b6d4';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                }}
              >
                {tx(i18n.nav[key as keyof typeof i18n.nav], lang)}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
