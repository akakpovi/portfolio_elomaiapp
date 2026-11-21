import { Code2, Bot, Server, Container, ShieldCheck, Check, ArrowUpRight } from 'lucide-react';
import { useLang, i18n, tx } from './i18n';
import { SITE } from '../data/site';

const ICONS = [Code2, Bot, Server, Container, ShieldCheck];
const ACCENTS = ['#06b6d4', '#8b5cf6', '#22d3ee', '#6366f1', '#10b981'];

export function Services() {
  const { lang } = useLang();

  return (
    <section id="services" className="py-24 relative">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(99, 102, 241, 0.07) 0%, transparent 70%)' }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] mb-5"
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.28)',
              color: '#a5b4fc',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a5b4fc' }} />
            SERVICES
          </div>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              background: 'linear-gradient(120deg, #f1f5f9, #a5b4fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {tx(i18n.services.title, lang)}
          </h2>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: '#94a3b8' }}>
            {tx(i18n.services.subtitle, lang)}
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {i18n.services.items.map((service, idx) => {
            const Icon = ICONS[idx];
            const color = ACCENTS[idx];
            return (
              <article
                key={service.title.en}
                className="relative rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300"
                style={{
                  background: 'linear-gradient(165deg, rgba(16, 23, 48, 0.92), rgba(9, 14, 32, 0.88))',
                  border: `1px solid ${color}22`,
                }}
              >
                <div
                  className="absolute top-0 left-6 right-6 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}70, transparent)` }}
                />

                <div className="flex items-start justify-between gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}14`, border: `1px solid ${color}33` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>
                  <span
                    className="text-[10.5px] px-2 py-0.5 rounded"
                    style={{
                      color: '#64748b',
                      border: '1px solid rgba(100, 116, 139, 0.25)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    0{idx + 1}
                  </span>
                </div>

                <div>
                  <h3
                    className="text-base mb-2 leading-snug"
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#f1f5f9' }}
                  >
                    {tx(service.title, lang)}
                  </h3>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: '#94a3b8' }}>
                    {tx(service.desc, lang)}
                  </p>
                </div>

                <div>
                  <div
                    className="text-[10.5px] tracking-[0.14em] uppercase mb-2.5"
                    style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {tx(i18n.services.includes, lang)}
                  </div>
                  <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
                    {service.items.map(item => (
                      <li key={item.en} className="flex items-start gap-2 text-[13px]">
                        <Check size={13} style={{ color, flexShrink: 0, marginTop: 3 }} />
                        <span style={{ color: '#c3cede' }}>{tx(item, lang)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {service.note && (
                  <p
                    className="text-[12px] leading-relaxed rounded-lg p-2.5"
                    style={{
                      color: '#a5b4fc',
                      background: 'rgba(99, 102, 241, 0.07)',
                      border: '1px solid rgba(99, 102, 241, 0.18)',
                    }}
                  >
                    {tx(service.note, lang)}
                  </p>
                )}

                <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(100, 116, 139, 0.16)' }}>
                  <div
                    className="text-[10.5px] tracking-[0.14em] uppercase mb-2"
                    style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {tx(i18n.services.stackLabel, lang)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {service.tech.map(t => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[11px]"
                        style={{
                          background: `${color}0d`,
                          border: `1px solid ${color}22`,
                          color,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}

          {/* Freelancer CTA card */}
          <article
            className="rounded-2xl p-6 flex flex-col gap-4 justify-between"
            style={{
              background:
                'linear-gradient(150deg, rgba(6, 182, 212, 0.13), rgba(139, 92, 246, 0.13))',
              border: '1px solid rgba(6, 182, 212, 0.28)',
            }}
          >
            <div className="flex flex-col gap-3">
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10.5px] self-start"
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
                {tx(i18n.freelancer.badge, lang)}
              </div>
              <h3
                className="text-base leading-snug"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#f1f5f9' }}
              >
                {tx(i18n.freelancer.title, lang)}
              </h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: '#b6c2d6' }}>
                {tx(i18n.freelancer.desc2, lang)}
              </p>
            </div>
            <a
              href={SITE.freelancer}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                color: '#fff',
                fontFamily: 'DM Sans, sans-serif',
                textDecoration: 'none',
              }}
            >
              {tx(i18n.freelancer.cta, lang)}
              <ArrowUpRight size={15} />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
