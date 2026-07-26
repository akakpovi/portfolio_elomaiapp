import { useLang, i18n, tx } from './i18n';

const DEPLOYMENT_DATA = [
  {
    key: 'laptop' as const,
    icon: '💻',
    color: '#06b6d4',
    gradient: 'from-cyan-500/10 to-transparent',
  },
  {
    key: 'workstation' as const,
    icon: '🖥️',
    color: '#8b5cf6',
    gradient: 'from-purple-500/10 to-transparent',
    featured: true,
  },
  {
    key: 'server' as const,
    icon: '🗄️',
    color: '#10b981',
    gradient: 'from-emerald-500/10 to-transparent',
  },
];

export function DeploymentOptions() {
  const { lang } = useLang();

  return (
    <section className="py-24 relative">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(6, 182, 212, 0.04) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
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
            DEPLOYMENT OPTIONS
          </div>
          <h2
            className="text-3xl sm:text-4xl"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e2e8f0, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {tx(i18n.deployment.title, lang)}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {DEPLOYMENT_DATA.map(({ key, icon, color, featured }) => {
            const data = i18n.deployment[key];
            return (
              <div
                key={key}
                className="relative rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300"
                style={{
                  background: 'rgba(10, 20, 44, 0.6)',
                  border: featured ? `1px solid ${color}40` : '1px solid rgba(6, 182, 212, 0.1)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: featured ? `0 0 40px ${color}12` : 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${color}18`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = featured ? `0 0 40px ${color}12` : 'none';
                  (e.currentTarget as HTMLElement).style.borderColor = featured ? `${color}40` : 'rgba(6, 182, 212, 0.1)';
                }}
              >
                {/* Top line */}
                <div
                  className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }}
                />

                {featured && (
                  <div
                    className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: `${color}15`,
                      border: `1px solid ${color}30`,
                      color,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    Popular
                  </div>
                )}

                {/* Icon */}
                <div className="text-4xl mb-2">{icon}</div>

                <h3
                  className="text-xl"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#e2e8f0' }}
                >
                  {tx(data.title, lang)}
                </h3>

                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                  {tx(data.desc, lang)}
                </p>

                {/* Specs */}
                <div
                  className="rounded-xl p-4 mt-2"
                  style={{ background: `${color}06`, border: `1px solid ${color}15` }}
                >
                  <p className="text-xs mb-2" style={{ color, fontFamily: 'JetBrains Mono, monospace', opacity: 0.7 }}>
                    SPECIFICATIONS
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {data.specs.map((spec, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#cbd5e1' }}>
                        <span style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>→</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
