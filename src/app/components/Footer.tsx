import { Github, Mail, Cpu, ArrowUpRight, Globe } from 'lucide-react';
import { useLang, i18n, tx, type Lang } from './i18n';
import { SITE } from '../data/site';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

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

export function Footer() {
  const { lang, setLang } = useLang();
  const year = new Date().getFullYear();

  const scrollTo = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(href.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative" style={{ borderTop: '1px solid rgba(139, 92, 246, 0.16)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}
              >
                <Cpu size={17} className="text-white" />
              </span>
              <div>
                <div
                  className="text-[13px]"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#f1f5f9' }}
                >
                  EL0M.AI
                </div>
                <div className="text-[11px]" style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  {tx(i18n.footer.tagline, lang)}
                </div>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed mb-5" style={{ color: '#7c8aa3', maxWidth: '260px' }}>
              {tx(i18n.footer.madeWith, lang)}.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {i18n.footer.specialties.map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[10.5px]"
                  style={{
                    background: 'rgba(139, 92, 246, 0.07)',
                    border: '1px solid rgba(139, 92, 246, 0.18)',
                    color: '#8fa0b8',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {tx(s, lang)}
                </span>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4
              className="text-[10.5px] mb-3.5 uppercase tracking-[0.14em]"
              style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {tx(i18n.footer.groups.navigation, lang)}
            </h4>
            <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
              {NAV_LINKS.map(link => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    onClick={scrollTo(link.href)}
                    className="text-[13px]"
                    style={{ color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', textDecoration: 'none' }}
                  >
                    {tx(i18n.nav[link.key], lang)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4
              className="text-[10.5px] mb-3.5 uppercase tracking-[0.14em]"
              style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {tx(i18n.footer.groups.services, lang)}
            </h4>
            <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
              {i18n.services.items.map(service => (
                <li key={service.title.en}>
                  <a
                    href="#services"
                    onClick={scrollTo('#services')}
                    className="text-[13px]"
                    style={{ color: '#94a3b8', fontFamily: 'DM Sans, sans-serif', textDecoration: 'none' }}
                  >
                    {tx(service.title, lang)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-[10.5px] mb-3.5 uppercase tracking-[0.14em]"
              style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {tx(i18n.footer.groups.contact, lang)}
            </h4>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-2 text-[13px]"
                  style={{ color: '#94a3b8', textDecoration: 'none' }}
                >
                  <Mail size={13} style={{ color: '#67e8f9' }} />
                  {SITE.email}
                </a>
              </li>
              <li>
                <a
                  href={SITE.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[13px]"
                  style={{ color: '#94a3b8', textDecoration: 'none' }}
                >
                  <Github size={13} style={{ color: '#a78bfa' }} />
                  {SITE.githubHandle}
                </a>
              </li>
              <li>
                <a
                  href={SITE.freelancer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[13px]"
                  style={{ color: '#6ee7b7', textDecoration: 'none' }}
                >
                  <ArrowUpRight size={13} />
                  {tx(i18n.freelancer.profile, lang)}
                </a>
              </li>
              <li>
                <span className="inline-flex items-center gap-2 text-[12.5px]" style={{ color: '#64748b' }}>
                  <Globe size={13} />
                  {SITE.url.replace('https://', '').replace(/\/$/, '')}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-7"
          style={{ borderTop: '1px solid rgba(139, 92, 246, 0.1)' }}
        >
          <p className="text-[11.5px] text-center sm:text-left" style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
            © {year} {SITE.name}. {tx(i18n.footer.rights, lang)}
          </p>

          <div
            className="flex items-center gap-0.5 rounded-lg px-1 py-1"
            style={{ background: 'rgba(12, 18, 40, 0.7)', border: '1px solid rgba(139, 92, 246, 0.16)' }}
            role="group"
            aria-label="Language selector"
          >
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className="px-1.5 py-0.5 text-[11px] rounded-md"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                  background: lang === code ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                  color: lang === code ? '#c4b5fd' : '#475569',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }}
            />
            <span className="text-[11px]" style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
              Docker · Nginx · React
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
