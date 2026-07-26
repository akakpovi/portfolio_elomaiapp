import { CheckCircle, Laptop, Server, Wrench } from 'lucide-react';
import { useLang, i18n, tx } from './i18n';

const CARD_ICONS = [Laptop, Server, Wrench];
const CARD_COLORS = ['#06b6d4', '#8b5cf6', '#10b981'];
const CARD_KEYS = ['card1', 'card2', 'card3'] as const;

export function Solutions() {
  const { lang } = useLang();

  return (
    <section id="solutions" className="py-24 relative">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-6"
            style={{
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              color: '#8b5cf6',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6' }} />
            PRIVATE AI SOLUTIONS
          </div>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e2e8f0, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {tx(i18n.solutions.title, lang)}
          </h2>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {CARD_KEYS.map((cardKey, idx) => {
            const card = i18n.solutions[cardKey];
            const Icon = CARD_ICONS[idx];
            const color = CARD_COLORS[idx];

            return (
              <div
                key={cardKey}
                className="relative rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 group"
                style={{
                  background: 'rgba(10, 20, 44, 0.6)',
                  border: '1px solid rgba(6, 182, 212, 0.12)',
                  backdropFilter: 'blur(20px)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${color}35`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${color}10`;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(6, 182, 212, 0.12)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Top gradient accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
                />

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${color}15`,
                    border: `1px solid ${color}30`,
                    boxShadow: `0 0 20px ${color}15`,
                  }}
                >
                  <Icon size={22} style={{ color }} />
                </div>

                {/* Title */}
                <h3
                  className="text-lg"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600,
                    color: '#e2e8f0',
                  }}
                >
                  {tx(card.title, lang)}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                  {tx(card.desc, lang)}
                </p>

                {/* Features */}
                <ul className="flex flex-col gap-2 flex-1">
                  {card.features.map((feature, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} style={{ color, flexShrink: 0 }} />
                      <span style={{ color: '#cbd5e1' }}>{tx(feature, lang)}</span>
                    </li>
                  ))}
                </ul>

                {/* Hardware footer */}
                <div
                  className="pt-4 mt-2"
                  style={{ borderTop: '1px solid rgba(6, 182, 212, 0.1)' }}
                >
                  <p className="text-xs" style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                    {tx(card.hardware, lang)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
