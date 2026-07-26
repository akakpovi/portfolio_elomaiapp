import { useState, useEffect } from 'react';
import { ChevronDown, Shield, Lock, Cpu } from 'lucide-react';
import { NeuralCanvas } from './NeuralCanvas';
import { useLang, i18n, tx } from './i18n';

const TECH_BADGES = [
  { label: 'Ollama', color: '#06b6d4' },
  { label: 'Qwen2.5', color: '#8b5cf6' },
  { label: 'Llama 3.3', color: '#10b981' },
  { label: 'Mistral', color: '#06b6d4' },
  { label: 'DeepSeek', color: '#8b5cf6' },
  { label: 'LangChain', color: '#10b981' },
  { label: 'LangGraph', color: '#06b6d4' },
  { label: 'RAG', color: '#8b5cf6' },
  { label: 'Docker', color: '#06b6d4' },
  { label: 'Linux', color: '#10b981' },
  { label: 'Python', color: '#f59e0b' },
  { label: 'FastAPI', color: '#06b6d4' },
];

const ARCH_NODES = [
  { label: '💻 Laptop / 🖥️ Server', sub: 'Your Hardware', color: '#06b6d4' },
  { label: 'Private AI Platform', sub: 'Ollama + Docker', color: '#8b5cf6' },
  { label: 'Local LLM Engine', sub: 'Qwen · Llama · Mistral', color: '#06b6d4' },
  { label: 'AI Agent Layer', sub: 'LangGraph orchestration', color: '#10b981' },
  { label: 'Business Applications', sub: 'Your workflows & data', color: '#8b5cf6' },
];

function ArchNode({ node, index }: { node: typeof ARCH_NODES[0]; index: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 200 + 400);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className="transition-all duration-500"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(20px)' }}
    >
      <div
        className="relative px-4 py-2.5 rounded-lg flex items-center gap-3"
        style={{
          background: 'rgba(10, 20, 44, 0.8)',
          border: `1px solid ${node.color}30`,
          boxShadow: `0 0 16px ${node.color}15`,
        }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
          style={{ background: node.color, boxShadow: `0 0 8px ${node.color}` }}
        />
        <div>
          <div className="text-xs" style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>
            {node.label}
          </div>
          <div className="text-xs" style={{ color: '#64748b' }}>{node.sub}</div>
        </div>
      </div>
      {index < ARCH_NODES.length - 1 && (
        <div className="flex justify-center my-1">
          <div
            className="w-px h-5"
            style={{ background: `linear-gradient(to bottom, ${node.color}80, ${ARCH_NODES[index + 1].color}80)` }}
          />
        </div>
      )}
    </div>
  );
}

export function Hero() {
  const { lang } = useLang();
  const [titleVisible, setTitleVisible] = useState(false);
  const [subVisible, setSubVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setTitleVisible(true), 100);
    const t2 = setTimeout(() => setSubVisible(true), 300);
    const t3 = setTimeout(() => setCtaVisible(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ paddingTop: '64px' }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        <NeuralCanvas />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(6, 182, 212, 0.06) 0%, rgba(139, 92, 246, 0.04) 50%, transparent 100%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to top, #020817, transparent)' }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <div className="flex flex-col gap-6">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-full text-xs"
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#06b6d4',
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }}
              />
              {tx(i18n.hero.badge, lang)}
            </div>

            {/* Main title */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl transition-all duration-700"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                opacity: titleVisible ? 1 : 0,
                transform: titleVisible ? 'translateY(0)' : 'translateY(20px)',
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(135deg, #e2e8f0 0%, #06b6d4 50%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {tx(i18n.hero.title, lang)}
              </span>
            </h1>

            {/* Tagline */}
            <div
              className="transition-all duration-700 delay-100"
              style={{
                opacity: subVisible ? 1 : 0,
                transform: subVisible ? 'translateY(0)' : 'translateY(15px)',
              }}
            >
              <p
                className="text-base"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#06b6d4',
                  letterSpacing: '0.02em',
                }}
              >
                {tx(i18n.hero.tagline, lang)}
              </p>
            </div>

            {/* Subtitle */}
            <p
              className="text-base leading-relaxed transition-all duration-700 delay-150"
              style={{
                color: '#94a3b8',
                maxWidth: '520px',
                opacity: subVisible ? 1 : 0,
                transform: subVisible ? 'translateY(0)' : 'translateY(15px)',
              }}
            >
              {tx(i18n.hero.subtitle, lang)}
            </p>

            {/* Trust badges */}
            <div
              className="flex flex-wrap gap-3 transition-all duration-700 delay-200"
              style={{ opacity: subVisible ? 1 : 0 }}
            >
              {[
                { icon: <Shield size={12} />, label: 'GDPR / DSGVO / RGPD' },
                { icon: <Lock size={12} />, label: '100% Private' },
                { icon: <Cpu size={12} />, label: 'Local First' },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {icon}
                  {label}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-3 transition-all duration-700"
              style={{
                opacity: ctaVisible ? 1 : 0,
                transform: ctaVisible ? 'translateY(0)' : 'translateY(15px)',
              }}
            >
              <button
                onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  color: '#ffffff',
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(6, 182, 212, 0.5)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(6, 182, 212, 0.3)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {tx(i18n.hero.cta1, lang)}
              </button>
              <button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#06b6d4',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(6, 182, 212, 0.08)';
                  (e.currentTarget as HTMLElement).style.borderColor = '#06b6d4';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.15)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6, 182, 212, 0.4)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {tx(i18n.hero.cta2, lang)}
              </button>
            </div>
          </div>

          {/* Right: Architecture viz */}
          <div className="hidden lg:flex flex-col items-center gap-0">
            {/* Architecture panel */}
            <div
              className="w-full max-w-sm rounded-2xl p-6"
              style={{
                background: 'rgba(10, 20, 44, 0.6)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 60px rgba(6, 182, 212, 0.08)',
              }}
            >
              <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(6, 182, 212, 0.1)' }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
                </div>
                <span className="text-xs ml-2" style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  private-ai-stack.yml
                </span>
              </div>
              <div className="flex flex-col">
                {ARCH_NODES.map((node, i) => (
                  <ArchNode key={i} node={node} index={i} />
                ))}
              </div>
            </div>

            {/* Metrics strip */}
            <div
              className="w-full max-w-sm rounded-xl p-3 mt-3 grid grid-cols-3 gap-3"
              style={{
                background: 'rgba(10, 20, 44, 0.5)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {[
                { label: 'Latency', value: '< 100ms', color: '#10b981' },
                { label: 'Privacy', value: '100%', color: '#06b6d4' },
                { label: 'Offline', value: '✓ Yes', color: '#8b5cf6' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <div className="text-sm font-medium" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>
                    {value}
                  </div>
                  <div className="text-xs" style={{ color: '#64748b' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tech badges */}
        <div
          className="mt-16 transition-all duration-1000 delay-500"
          style={{ opacity: ctaVisible ? 1 : 0 }}
        >
          <p className="text-xs mb-4 text-center" style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
            TECH STACK
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {TECH_BADGES.map(({ label, color }) => (
              <span
                key={label}
                className="px-3 py-1 rounded-full text-xs transition-all duration-150 cursor-default"
                style={{
                  background: `${color}12`,
                  border: `1px solid ${color}30`,
                  color: color,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = `${color}25`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${color}30`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = `${color}12`;
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs" style={{ color: '#475569' }}>
            {tx(i18n.hero.scrollHint, lang)}
          </span>
          <ChevronDown size={16} style={{ color: '#475569' }} />
        </div>
      </div>
    </section>
  );
}
