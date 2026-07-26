import { ExternalLink, Github, ArrowRight } from 'lucide-react';
import { useLang, i18n, tx } from './i18n';

const PROJECT_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5'] as const;
const PROJECT_COLORS = ['#06b6d4', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b'];
const PROJECT_EMOJIS = ['🤖', '🏢', '🔒', '🧹', '💈'];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Production': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  'En production': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  'Produktiv': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  'Beta': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  'Stable': { bg: 'rgba(6, 182, 212, 0.1)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' },
  'Stabil': { bg: 'rgba(6, 182, 212, 0.1)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' },
  'In Development': { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
  'En développement': { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
  'In Entwicklung': { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
};

export function Projects() {
  const { lang } = useLang();

  return (
    <section id="projects" className="py-24 relative">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 0% 80%, rgba(139, 92, 246, 0.04) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-6"
            style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              color: '#06b6d4',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            PROJECTS
          </div>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e2e8f0, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {tx(i18n.projects.title, lang)}
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: '#94a3b8' }}>
            {tx(i18n.projects.subtitle, lang)}
          </p>
        </div>

        {/* Projects grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROJECT_KEYS.map((key, idx) => {
            const project = i18n.projects[key];
            const color = PROJECT_COLORS[idx];
            const emoji = PROJECT_EMOJIS[idx];
            const statusText = tx(project.status, lang);
            const statusStyle = STATUS_COLORS[statusText] || STATUS_COLORS['Production'];

            return (
              <div
                key={key}
                className="group relative rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 cursor-pointer"
                style={{
                  background: 'rgba(10, 20, 44, 0.6)',
                  border: '1px solid rgba(6, 182, 212, 0.1)',
                  backdropFilter: 'blur(20px)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${color}30`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${color}10`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(6, 182, 212, 0.1)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Top accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
                />

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${color}12`, border: `1px solid ${color}25` }}
                  >
                    {emoji}
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {statusText}
                  </span>
                </div>

                {/* Title & description */}
                <div>
                  <h3
                    className="text-base mb-2"
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#e2e8f0' }}
                  >
                    {tx(project.title, lang)}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                    {tx(project.desc, lang)}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-xs"
                      style={{
                        background: `${color}10`,
                        border: `1px solid ${color}20`,
                        color,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer actions */}
                <div
                  className="flex items-center gap-3 pt-3 mt-auto"
                  style={{ borderTop: '1px solid rgba(6, 182, 212, 0.08)' }}
                >
                  <button
                    className="flex items-center gap-1.5 text-xs transition-colors"
                    style={{ color: '#64748b' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = color}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748b'}
                  >
                    <Github size={13} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{tx(i18n.projects.viewCode, lang)}</span>
                  </button>
                  <button
                    className="ml-auto flex items-center gap-1.5 text-xs transition-all"
                    style={{ color }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.gap = '8px';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.gap = '6px';
                    }}
                  >
                    <span style={{ fontFamily: 'DM Sans, sans-serif' }}>{tx(i18n.projects.viewProject, lang)}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* More projects placeholder */}
          <div
            className="rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border-dashed"
            style={{
              background: 'rgba(10, 20, 44, 0.3)',
              border: '1px dashed rgba(6, 182, 212, 0.15)',
              minHeight: '200px',
            }}
          >
            <span className="text-3xl opacity-40">+</span>
            <p className="text-sm text-center" style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
              {lang === 'fr' ? 'Plus de projets sur GitHub' : lang === 'de' ? 'Mehr Projekte auf GitHub' : 'More projects on GitHub'}
            </p>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all"
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                color: '#06b6d4',
                fontFamily: 'JetBrains Mono, monospace',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(6, 182, 212, 0.15)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(6, 182, 212, 0.08)';
              }}
            >
              <Github size={13} />
              GitHub
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
