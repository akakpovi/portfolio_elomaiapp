import { Github, Linkedin, Mail, Cpu } from 'lucide-react';
import { useLang, i18n, tx, type Lang } from './i18n';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

const NAV_GROUPS = [
  {
    titleFR: 'Navigation', titleEN: 'Navigation', titleDE: 'Navigation',
    links: [
      { labelFR: 'Accueil', labelEN: 'Home', labelDE: 'Startseite', href: '#home' },
      { labelFR: 'Solutions IA', labelEN: 'AI Solutions', labelDE: 'KI-Lösungen', href: '#solutions' },
      { labelFR: 'Projets', labelEN: 'Projects', labelDE: 'Projekte', href: '#projects' },
      { labelFR: 'Technologies', labelEN: 'Technologies', labelDE: 'Technologien', href: '#technologies' },
      { labelFR: 'Contact', labelEN: 'Contact', labelDE: 'Kontakt', href: '#contact' },
    ],
  },
  {
    titleFR: 'Spécialités', titleEN: 'Specialties', titleDE: 'Spezialgebiete',
    links: [
      { labelFR: 'IA Locale', labelEN: 'Local AI', labelDE: 'Lokale KI', href: '#solutions' },
      { labelFR: 'LLM Privé', labelEN: 'Private LLM', labelDE: 'Privates LLM', href: '#solutions' },
      { labelFR: 'Agents Autonomes', labelEN: 'Autonomous Agents', labelDE: 'Autonome Agenten', href: '#agents' },
      { labelFR: 'Systèmes RAG', labelEN: 'RAG Systems', labelDE: 'RAG-Systeme', href: '#rag' },
      { labelFR: 'Infrastructure IA', labelEN: 'AI Infrastructure', labelDE: 'KI-Infrastruktur', href: '#technologies' },
    ],
  },
];

export function Footer() {
  const { lang, setLang } = useLang();
  const year = new Date().getFullYear();

  const getLink = (link: { labelFR: string; labelEN: string; labelDE: string }) => {
    if (lang === 'fr') return link.labelFR;
    if (lang === 'de') return link.labelDE;
    return link.labelEN;
  };

  const getGroupTitle = (g: { titleFR: string; titleEN: string; titleDE: string }) => {
    if (lang === 'fr') return g.titleFR;
    if (lang === 'de') return g.titleDE;
    return g.titleEN;
  };

  return (
    <footer className="relative" style={{ borderTop: '1px solid rgba(6, 182, 212, 0.1)' }}>
      {/* Top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #06b6d480, transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                }}
              >
                <Cpu size={18} className="text-white" />
              </div>
              <div>
                <div
                  className="text-base"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#e2e8f0' }}
                >
                  AI Engineer
                </div>
                <div className="text-xs" style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                  {tx(i18n.footer.tagline, lang)}
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-6" style={{ color: '#64748b', maxWidth: '320px' }}>
              {tx(i18n.footer.madeWith, lang)}.
            </p>

            {/* Specialty badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {i18n.footer.specialties.map((s, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-xs"
                  style={{
                    background: 'rgba(6, 182, 212, 0.06)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    color: '#64748b',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {tx(s, lang)}
                </span>
              ))}
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              {[
                { icon: <Github size={17} />, href: '#', label: 'GitHub' },
                { icon: <Linkedin size={17} />, href: '#', label: 'LinkedIn' },
                { icon: <Mail size={17} />, href: 'mailto:hello@ai-engineer.dev', label: 'Email' },
              ].map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150"
                  style={{
                    background: 'rgba(10, 20, 44, 0.6)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    color: '#64748b',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = '#06b6d4';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6, 182, 212, 0.35)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(6, 182, 212, 0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = '#64748b';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6, 182, 212, 0.15)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(10, 20, 44, 0.6)';
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav groups */}
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              <h4
                className="text-xs mb-4 uppercase tracking-widest"
                style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {getGroupTitle(group)}
              </h4>
              <ul className="flex flex-col gap-2">
                {group.links.map((link, li) => (
                  <li key={li}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors duration-150"
                      style={{ color: '#64748b', fontFamily: 'DM Sans, sans-serif', textDecoration: 'none' }}
                      onClick={e => {
                        e.preventDefault();
                        const id = link.href.replace('#', '');
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#06b6d4'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748b'}
                    >
                      {getLink(link)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(6, 182, 212, 0.08)' }}
        >
          <p className="text-xs" style={{ color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>
            © {year} AI Engineer. {tx(i18n.footer.rights, lang)}
          </p>

          {/* Language switcher */}
          <div
            className="flex items-center gap-0.5 rounded-lg px-1 py-1"
            style={{ background: 'rgba(10, 20, 44, 0.6)', border: '1px solid rgba(6, 182, 212, 0.12)' }}
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
                    color: lang === code ? '#06b6d4' : '#475569',
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

          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }}
            />
            <span className="text-xs" style={{ color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>
              {lang === 'fr' ? 'Systèmes IA locaux opérationnels' : lang === 'de' ? 'Lokale KI-Systeme in Betrieb' : 'Local AI systems operational'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
