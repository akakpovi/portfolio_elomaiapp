import { MapPin, GraduationCap, Briefcase, Languages, ArrowUpRight } from 'lucide-react';
import { useLang, i18n, tx } from './i18n';
import { SITE } from '../data/site';

export function About() {
  const { lang } = useLang();

  return (
    <section id="about" className="py-24 relative">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 45% at 0% 30%, rgba(99, 102, 241, 0.07) 0%, transparent 70%)' }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-10 lg:gap-14 items-start">
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] mb-5"
              style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.26)',
                color: '#c4b5fd',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#c4b5fd' }} />
              ABOUT
            </div>

            <h2
              className="text-2xl sm:text-[2rem] leading-tight mb-5"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                background: 'linear-gradient(120deg, #f1f5f9, #c4b5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {tx(i18n.about.title, lang)}
            </h2>

            <div className="flex flex-col gap-3.5 mb-7">
              {i18n.about.paragraphs.map(p => (
                <p key={p.en} className="text-[14.5px] leading-relaxed" style={{ color: '#a3b1c6' }}>
                  {tx(p, lang)}
                </p>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-6 text-[12.5px]" style={{ color: '#7c8aa3' }}>
              <MapPin size={14} style={{ color: '#22d3ee' }} />
              {tx(i18n.about.location, lang)}
            </div>

            <div className="mb-7">
              <h3
                className="text-[10.5px] tracking-[0.16em] uppercase mb-3"
                style={{ color: '#7c8aa3', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {tx(i18n.about.focusTitle, lang)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {i18n.about.focus.map(f => (
                  <span
                    key={f.en}
                    className="px-2.5 py-1 rounded-md text-[12px]"
                    style={{
                      background: 'rgba(30, 41, 74, 0.5)',
                      border: '1px solid rgba(139, 92, 246, 0.18)',
                      color: '#c3cede',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {tx(f, lang)}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Timeline
                icon={<GraduationCap size={15} />}
                title={tx(i18n.about.educationTitle, lang)}
                items={i18n.about.education.map(e => ({ period: e.period, title: tx(e.title, lang), place: e.place }))}
                accent="#8b5cf6"
              />
              <Timeline
                icon={<Briefcase size={15} />}
                title={tx(i18n.about.experienceTitle, lang)}
                items={i18n.about.experience.map(e => ({ period: e.period, title: tx(e.title, lang), place: e.place }))}
                accent="#06b6d4"
              />
            </div>
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'linear-gradient(160deg, rgba(139, 92, 246, 0.13), rgba(6, 182, 212, 0.08))',
                border: '1px solid rgba(139, 92, 246, 0.25)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px]"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    color: '#fff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                  }}
                >
                  EA
                </span>
                <div>
                  <div className="text-[14px]" style={{ color: '#f1f5f9', fontWeight: 600 }}>{SITE.name}</div>
                  <div className="text-[11px]" style={{ color: '#a5b4fc', fontFamily: 'JetBrains Mono, monospace' }}>
                    {tx(i18n.hero.role, lang)}
                  </div>
                </div>
              </div>

              <h3
                className="text-[10.5px] tracking-[0.16em] uppercase mb-3 flex items-center gap-1.5"
                style={{ color: '#a5b4fc', fontFamily: 'JetBrains Mono, monospace' }}
              >
                <Languages size={13} />
                {tx(i18n.about.languagesTitle, lang)}
              </h3>
              <ul className="flex flex-col gap-2 list-none p-0 m-0">
                {i18n.about.languages.map(l => (
                  <li key={l.name.en} className="flex items-center justify-between text-[13px]">
                    <span style={{ color: '#e2e8f0' }}>{tx(l.name, lang)}</span>
                    <span style={{ color: '#8fa0b8', fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px' }}>
                      {tx(l.level, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-2xl p-6 flex flex-col gap-3"
              style={{
                background: 'rgba(12, 18, 40, 0.72)',
                border: '1px solid rgba(6, 182, 212, 0.18)',
              }}
            >
              <p className="text-[13px] leading-relaxed" style={{ color: '#a3b1c6' }}>
                {tx(i18n.freelancer.desc, lang)}
              </p>
              <a
                href={SITE.freelancer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  color: '#08101f',
                  fontFamily: 'DM Sans, sans-serif',
                  textDecoration: 'none',
                }}
              >
                {tx(i18n.freelancer.cta, lang)}
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Timeline({
  icon, title, items, accent,
}: {
  icon: React.ReactNode;
  title: string;
  items: { period: string; title: string; place: string }[];
  accent: string;
}) {
  return (
    <div>
      <h3
        className="text-[10.5px] tracking-[0.16em] uppercase mb-3 flex items-center gap-1.5"
        style={{ color: '#7c8aa3', fontFamily: 'JetBrains Mono, monospace' }}
      >
        <span style={{ color: accent }}>{icon}</span>
        {title}
      </h3>
      <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
        {items.map(it => (
          <li
            key={it.title + it.period}
            className="pl-3 py-0.5"
            style={{ borderLeft: `2px solid ${accent}45` }}
          >
            <div className="text-[10.5px]" style={{ color: accent, fontFamily: 'JetBrains Mono, monospace' }}>
              {it.period}
            </div>
            <div className="text-[13px]" style={{ color: '#e2e8f0' }}>{it.title}</div>
            <div className="text-[11.5px]" style={{ color: '#7c8aa3' }}>{it.place}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
