import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Github, ArrowRight, X, ArrowUpRight, Layers } from 'lucide-react';
import { useLang, i18n, tx } from './i18n';
import { PROJECTS, type Project, type ProjectStatus } from '../data/projects';

const STATUS_STYLE: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  live: { bg: 'rgba(16, 185, 129, 0.12)', text: '#6ee7b7', border: 'rgba(16, 185, 129, 0.35)' },
  development: { bg: 'rgba(139, 92, 246, 0.12)', text: '#c4b5fd', border: 'rgba(139, 92, 246, 0.35)' },
  prototype: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fcd34d', border: 'rgba(245, 158, 11, 0.32)' },
  research: { bg: 'rgba(6, 182, 212, 0.12)', text: '#67e8f9', border: 'rgba(6, 182, 212, 0.32)' },
  academic: { bg: 'rgba(99, 102, 241, 0.12)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.32)' },
  'open-source': { bg: 'rgba(20, 184, 166, 0.12)', text: '#5eead4', border: 'rgba(20, 184, 166, 0.32)' },
};

function StatusPill({ status }: { status: ProjectStatus }) {
  const { lang } = useLang();
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] whitespace-nowrap"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.text }} />
      {tx(i18n.projects.statusLabels[status], lang)}
    </span>
  );
}

export function Projects() {
  const { lang } = useLang();
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const openProject = useMemo(() => PROJECTS.find(p => p.slug === openSlug) ?? null, [openSlug]);

  const open = useCallback((slug: string) => {
    setOpenSlug(slug);
    if (window.location.hash !== `#project-${slug}`) {
      window.history.replaceState(null, '', `#project-${slug}`);
    }
  }, []);

  const close = useCallback(() => {
    setOpenSlug(null);
    if (window.location.hash.startsWith('#project-')) {
      window.history.replaceState(null, '', '#projects');
    }
  }, []);

  // Deep link support: /#project-aka-ia
  useEffect(() => {
    const fromHash = () => {
      const m = window.location.hash.match(/^#project-(.+)$/);
      if (m && PROJECTS.some(p => p.slug === m[1])) {
        setOpenSlug(m[1]);
        setTimeout(() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }), 60);
      }
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  useEffect(() => {
    if (!openSlug) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [openSlug, close]);

  return (
    <section id="projects" className="py-24 relative">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 65% 45% at 100% 60%, rgba(139, 92, 246, 0.06) 0%, transparent 70%)' }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] mb-5"
            style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.26)',
              color: '#67e8f9',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            PORTFOLIO · {PROJECTS.length} {tx(i18n.projects.counter, lang).toUpperCase()}
          </div>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              background: 'linear-gradient(120deg, #f1f5f9, #67e8f9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {tx(i18n.projects.title, lang)}
          </h2>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: '#94a3b8' }}>
            {tx(i18n.projects.subtitle, lang)}
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {PROJECTS.map(project => (
            <article
              key={project.slug}
              className="group relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(170deg, rgba(16, 23, 48, 0.94), rgba(8, 13, 30, 0.9))',
                border: `1px solid ${project.accent}20`,
              }}
            >
              {/* Cover */}
              <button
                onClick={() => open(project.slug)}
                data-event="project_open"
                data-location="projects_grid"
                className="relative w-full text-left"
                style={{ background: `linear-gradient(140deg, ${project.accent}1f, rgba(8, 13, 30, 0.2) 70%)` }}
                aria-label={`${tx(i18n.projects.viewProject, lang)}: ${project.name}`}
              >
                <div className="h-[104px] flex items-center justify-between px-5 relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-[0.5]"
                    style={{
                      backgroundImage: `radial-gradient(circle at 82% 20%, ${project.accent}33, transparent 55%), repeating-linear-gradient(90deg, ${project.accent}10 0 1px, transparent 1px 26px)`,
                    }}
                  />
                  <span
                    className="relative text-2xl tracking-[0.14em]"
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: project.accent }}
                  >
                    {project.monogram}
                  </span>
                  <StatusPill status={project.status} />
                </div>
              </button>

              <div className="px-5 pb-5 flex flex-col gap-3 flex-1">
                <h3
                  className="text-[14.5px] leading-snug"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#f1f5f9' }}
                >
                  {project.name}
                </h3>
                <p className="text-[13px] leading-relaxed flex-1" style={{ color: '#94a3b8' }}>
                  {tx(project.summary, lang)}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {project.stack.slice(0, 4).map(t => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 rounded text-[10.5px]"
                      style={{
                        background: `${project.accent}0f`,
                        border: `1px solid ${project.accent}20`,
                        color: project.accent,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  {project.stack.length > 4 && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10.5px]"
                      style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      +{project.stack.length - 4}
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-3 pt-3 mt-1"
                  style={{ borderTop: '1px solid rgba(100, 116, 139, 0.16)' }}
                >
                  <button
                    onClick={() => open(project.slug)}
                    data-event="project_open"
                    data-location="projects_card"
                    className="inline-flex items-center gap-1.5 text-[12px] transition-opacity hover:opacity-80"
                    style={{ color: project.accent, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}
                  >
                    {tx(i18n.projects.viewProject, lang)}
                    <ArrowRight size={12} />
                  </button>

                  <div className="ml-auto flex items-center gap-2.5">
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${project.name} — ${tx(i18n.projects.viewCode, lang)}`}
                        title={tx(i18n.projects.viewCode, lang)}
                        style={{ color: '#64748b', display: 'inline-flex' }}
                      >
                        <Github size={14} />
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${project.name} — ${tx(i18n.projects.liveApp, lang)}`}
                        title={tx(i18n.projects.liveApp, lang)}
                        style={{ color: '#64748b', display: 'inline-flex' }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* GitHub */}
        <div className="mt-10 flex justify-center">
          <a
            href="https://github.com/akakpovi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px]"
            style={{
              background: 'rgba(30, 41, 74, 0.45)',
              border: '1px solid rgba(139, 92, 246, 0.22)',
              color: '#c4b5fd',
              fontFamily: 'JetBrains Mono, monospace',
              textDecoration: 'none',
            }}
          >
            <Github size={14} />
            github.com/akakpovi
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>

      {openProject && <ProjectDialog project={openProject} onClose={close} />}
    </section>
  );
}

function ProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const { lang } = useLang();
  const labels = i18n.projects.labels;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      style={{ background: 'rgba(2, 6, 18, 0.82)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-dialog-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col my-0 sm:my-8 rounded-none sm:rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(170deg, #0c1229, #070c1d)',
          border: `1px solid ${project.accent}35`,
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          className="relative px-6 py-5 flex items-start justify-between gap-4"
          style={{
            background: `linear-gradient(135deg, ${project.accent}22, transparent 75%)`,
            borderBottom: `1px solid ${project.accent}25`,
          }}
        >
          <div className="min-w-0">
            <div
              className="text-[10.5px] tracking-[0.2em] mb-1.5"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: project.accent }}
            >
              {project.monogram}
            </div>
            <h3
              id="project-dialog-title"
              className="text-lg sm:text-xl leading-snug"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#f8fafc' }}
            >
              {project.name}
            </h3>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <StatusPill status={project.status} />
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] inline-flex items-center gap-1"
                  style={{ color: '#67e8f9', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none' }}
                >
                  {project.liveUrl.replace('https://', '').replace(/\/$/, '')}
                  <ArrowUpRight size={11} />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={tx(i18n.projects.close, lang)}
            className="p-2 rounded-lg flex-shrink-0"
            style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.18)', color: '#cbd5e1' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto">
          <Block title={tx(labels.overview, lang)}>
            <p className="text-[14px] leading-relaxed" style={{ color: '#c3cede' }}>
              {tx(project.overview, lang)}
            </p>
          </Block>

          <Block title={tx(labels.problem, lang)}>
            <p className="text-[14px] leading-relaxed" style={{ color: '#a3b1c6' }}>
              {tx(project.problem, lang)}
            </p>
          </Block>

          <Block title={tx(labels.features, lang)}>
            <ul className="grid sm:grid-cols-2 gap-2 list-none p-0 m-0">
              {project.features.map(f => (
                <li key={f.en} className="flex items-start gap-2 text-[13px]">
                  <span
                    className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: project.accent }}
                  />
                  <span style={{ color: '#c3cede' }}>{tx(f, lang)}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block title={tx(labels.architecture, lang)}>
            <ul className="flex flex-col gap-2 list-none p-0 m-0">
              {project.architecture.map(a => (
                <li key={a.en} className="flex items-start gap-2 text-[13px]">
                  <Layers size={13} style={{ color: project.accent, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: '#a3b1c6' }}>{tx(a, lang)}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block title={tx(labels.contribution, lang)}>
            <p className="text-[13.5px] leading-relaxed" style={{ color: '#c3cede' }}>
              {tx(project.contribution, lang)}
            </p>
          </Block>

          <Block title={tx(labels.stack, lang)}>
            <div className="flex flex-wrap gap-1.5">
              {project.stack.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded text-[11px]"
                  style={{
                    background: `${project.accent}12`,
                    border: `1px solid ${project.accent}28`,
                    color: project.accent,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </Block>

          {project.note && (
            <div
              className="rounded-xl p-3.5"
              style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
            >
              <div
                className="text-[10.5px] tracking-[0.14em] uppercase mb-1"
                style={{ color: '#fcd34d', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {tx(labels.note, lang)}
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: '#d6c9a8' }}>
                {tx(project.note, lang)}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2.5 pt-1">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${project.accent}, #8b5cf6)`,
                  color: '#08101f',
                  fontFamily: 'DM Sans, sans-serif',
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={14} />
                {tx(i18n.projects.liveApp, lang)}
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium"
                style={{
                  background: 'rgba(30, 41, 74, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.22)',
                  color: '#e2e8f0',
                  fontFamily: 'DM Sans, sans-serif',
                  textDecoration: 'none',
                }}
              >
                <Github size={14} />
                {tx(i18n.projects.viewCode, lang)}
              </a>
            )}
            <a
              href="#contact"
              onClick={e => {
                e.preventDefault();
                onClose();
                setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 80);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium"
              style={{
                background: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                color: '#cbd5e1',
                fontFamily: 'DM Sans, sans-serif',
                textDecoration: 'none',
              }}
            >
              {tx(i18n.hero.cta3, lang)}
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4
        className="text-[10.5px] tracking-[0.16em] uppercase mb-2"
        style={{ color: '#7c8aa3', fontFamily: 'JetBrains Mono, monospace' }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}
