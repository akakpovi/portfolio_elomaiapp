import { ArrowUpRight, BadgeCheck, Check } from 'lucide-react';
import { useLang, i18n, tx } from './i18n';
import { SITE } from '../data/site';

export function Freelancer() {
  const { lang } = useLang();

  return (
    <section id="freelancer" className="py-16 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-3xl overflow-hidden px-6 py-10 sm:px-10 sm:py-12"
          style={{
            background:
              'linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(6, 182, 212, 0.1) 55%, rgba(2, 8, 23, 0.4) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 88% 12%, rgba(34, 211, 238, 0.22), transparent 45%)',
            }}
          />
          <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px]"
                  style={{
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid rgba(16, 185, 129, 0.38)',
                    color: '#6ee7b7',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
                  {tx(i18n.freelancer.badge, lang)}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px]"
                  style={{
                    background: 'rgba(2, 8, 23, 0.45)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#c3cede',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  <BadgeCheck size={12} style={{ color: '#67e8f9' }} />
                  {SITE.freelancerHandle}
                </span>
              </div>

              <h2
                className="text-2xl sm:text-[1.9rem] leading-tight mb-4"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#f8fafc' }}
              >
                {tx(i18n.freelancer.title, lang)}
              </h2>
              <p className="text-[14.5px] leading-relaxed mb-2" style={{ color: '#c3cede' }}>
                {tx(i18n.freelancer.desc, lang)}
              </p>
              <p className="text-[14.5px] leading-relaxed" style={{ color: '#a3b1c6' }}>
                {tx(i18n.freelancer.desc2, lang)}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2 list-none p-0 m-0">
                {i18n.freelancer.bullets.map(b => (
                  <li key={b.en} className="flex items-start gap-2 text-[13px]">
                    <Check size={14} style={{ color: '#67e8f9', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: '#d3dced' }}>{tx(b, lang)}</span>
                  </li>
                ))}
              </ul>

              <a
                href={SITE.freelancer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13.5px] font-semibold text-center"
                style={{
                  background: '#f8fafc',
                  color: '#0b1226',
                  fontFamily: 'DM Sans, sans-serif',
                  textDecoration: 'none',
                }}
              >
                {tx(i18n.freelancer.cta, lang)}
                <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
