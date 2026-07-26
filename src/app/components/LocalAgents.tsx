import { useLang, i18n, tx } from './i18n';

export function LocalAgents() {
  const { lang } = useLang();

  return (
    <section id="agents" className="py-24 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 0% 50%, rgba(6, 182, 212, 0.04) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-6"
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                color: '#06b6d4',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#06b6d4' }} />
              LOCAL AI AGENTS
            </div>

            <h2
              className="text-3xl sm:text-4xl mb-6"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #e2e8f0, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.2,
              }}
            >
              {tx(i18n.agents.title, lang)}
            </h2>

            <p className="text-base leading-relaxed mb-8" style={{ color: '#94a3b8', maxWidth: '480px' }}>
              {tx(i18n.agents.desc, lang)}
            </p>

            {/* Agent list */}
            <div className="grid grid-cols-2 gap-3">
              {i18n.agents.agents.map(agent => (
                <div
                  key={agent.key}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                  style={{
                    background: 'rgba(10, 20, 44, 0.5)',
                    border: '1px solid rgba(6, 182, 212, 0.12)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6, 182, 212, 0.3)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(6, 182, 212, 0.06)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6, 182, 212, 0.12)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(10, 20, 44, 0.5)';
                  }}
                >
                  <span className="text-2xl">{agent.icon}</span>
                  <span className="text-sm" style={{ color: '#cbd5e1', fontFamily: 'DM Sans, sans-serif' }}>
                    {tx(agent.label, lang)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Architecture diagram */}
          <div className="flex justify-center">
            <div
              className="w-full max-w-sm rounded-2xl p-6"
              style={{
                background: 'rgba(10, 20, 44, 0.7)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 60px rgba(6, 182, 212, 0.06)',
              }}
            >
              {/* Flow diagram */}
              <div className="flex flex-col items-center gap-2">
                {/* User node */}
                <FlowNode label="User" icon="👤" color="#e2e8f0" bgColor="rgba(226, 232, 240, 0.08)" borderColor="rgba(226, 232, 240, 0.2)" />
                <FlowArrow />
                <FlowNode label="AI Interface" icon="🖥️" color="#06b6d4" bgColor="rgba(6, 182, 212, 0.08)" borderColor="rgba(6, 182, 212, 0.25)" />
                <FlowArrow />
                <FlowNode label="Agent Controller" icon="🧠" color="#8b5cf6" bgColor="rgba(139, 92, 246, 0.08)" borderColor="rgba(139, 92, 246, 0.25)" />
                <FlowArrow />

                {/* Agents row */}
                <div
                  className="w-full rounded-xl p-3"
                  style={{ background: 'rgba(6, 182, 212, 0.04)', border: '1px solid rgba(6, 182, 212, 0.1)' }}
                >
                  <p className="text-xs text-center mb-2" style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                    AI SPECIALISTS
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {i18n.agents.agents.map(agent => (
                      <div
                        key={agent.key}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs"
                        style={{
                          background: 'rgba(10, 20, 44, 0.6)',
                          border: '1px solid rgba(6, 182, 212, 0.1)',
                          color: '#94a3b8',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        <span>{agent.icon}</span>
                        <span style={{ fontSize: '10px' }}>{tx(agent.label, lang)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <FlowArrow />

                {/* Local tools */}
                <div
                  className="w-full rounded-xl p-3"
                  style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)' }}
                >
                  <p className="text-xs text-center mb-2" style={{ color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                    LOCAL TOOLS
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {i18n.agents.tools.map((tool, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-md text-xs"
                        style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        {tx(tool, lang)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowNode({ label, icon, color, bgColor, borderColor }: {
  label: string; icon: string; color: string; bgColor: string; borderColor: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-2.5 rounded-xl w-full"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <span>{icon}</span>
      <span className="text-sm" style={{ color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-px h-4" style={{ background: 'linear-gradient(to bottom, rgba(6,182,212,0.4), rgba(139,92,246,0.4))' }} />
      <div style={{ color: '#475569', fontSize: '10px' }}>▼</div>
    </div>
  );
}
