import { useState, useEffect } from 'react';
import { ChevronDown, ArrowUpRight, ArrowRight, MessageSquare, Layers, Server, ShieldCheck } from 'lucide-react';
import { NeuralCanvas } from './NeuralCanvas';
import { useLang, i18n, tx } from './i18n';
import { SITE } from '../data/site';

const ARCH_NODES = [
  { label: '💻 Laptop / 🖥️ Server', sub: 'Your hardware', color: '#06b6d4' },
  { label: 'Private AI Platform', sub: 'Ollama + Docker', color: '#8b5cf6' },
  { label: 'Local LLM Engine', sub: 'Qwen · Llama · Mistral', color: '#06b6d4' },
  { label: 'AI Agent Layer', sub: 'LangGraph orchestration', color: '#10b981' },
  { label: 'Business Applications', sub: 'Your workflows & data', color: '#8b5cf6' },
];

function ArchNode({ node, index }: { node: typeof ARCH_NODES[0]; index: number }) {
  return (
    <div>
      <div
        className="relative px-4 py-2.5 rounded-lg flex items-center gap-3"
        style={{
          background: 'rgba(12, 18, 40, 0.85)',
          border: `1px solid ${node.color}30`,
        }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: node.color, boxShadow: `0 0 8px ${node.color}` }}
        />
        <div className="min-w-0">
          <div className="text-xs truncate" style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>
            {node.label}
          </div>
          <div className="text-xs truncate" style={{ color: '#64748b' }}>{node.sub}</div>
        </div>
      </div>
      {index < ARCH_NODES.length - 1 && (
        <div className="flex justify-center my-1">
          <div
            className="w-px h-4"
            style={{ background: `linear-gradient(to bottom, ${node.color}80, ${ARCH_NODES[index + 1].color}80)` }}
          />
        </div>
      )}
    </div>
  );
}

export function Hero() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ paddingTop: '80px' }}
    >
      <div className="absolute inset-0">
        <NeuralCanvas />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 75% 55% at 50% 30%, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.06) 45%, transparent 100%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to top, #020817, transparent)' }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 w-full">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-16 items-center">
          {/* Left content */}
          <div
            className="flex flex-col gap-5 transition-all duration-700"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
          >
            {/* Availability badge */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={SITE.freelancer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px]"
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                  fontFamily: 'JetBrains Mono, monospace',
                  textDecoration: 'none',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }}
                />
                {tx(i18n.hero.availability, lang)}
              </a>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
                style={{
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  color: '#c4b5fd',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {tx(i18n.hero.badge, lang)}
              </span>
            </div>

            {/* Brand + role */}
            <div>
              <div
                className="text-[11px] mb-2 tracking-[0.28em] uppercase"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: '#22d3ee' }}
              >
                {tx(i18n.hero.brand, lang)}
              </div>
              <div
                className="text-sm sm:text-base"
                style={{ fontFamily: 'DM Sans, sans-serif', color: '#cbd5e1', fontWeight: 500 }}
              >
                Elom Akakpovi — {tx(i18n.hero.role, lang)}
              </div>
            </div>

            {/* Main headline */}
            <h1
              className="text-[1.9rem] leading-[1.15] sm:text-4xl lg:text-[2.9rem]"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(120deg, #f1f5f9 0%, #c4b5fd 45%, #22d3ee 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {tx(i18n.hero.title, lang)}
              </span>
            </h1>

            {/* Description */}
            <div className="flex flex-col gap-2.5" style={{ maxWidth: '600px' }}>
              <p className="text-[15px] leading-relaxed" style={{ color: '#a3b1c6' }}>
                {tx(i18n.hero.subtitle, lang)}
              </p>
              <p className="text-[15px] leading-relaxed" style={{ color: '#8fa0b8' }}>
                {tx(i18n.hero.subtitle2, lang)}
              </p>
            </div>

            {/* Highlights */}
            <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
              {i18n.hero.highlights.map(h => (
                <li
                  key={h.en}
                  className="px-2.5 py-1 rounded-md text-[11.5px]"
                  style={{
                    background: 'rgba(30, 41, 74, 0.5)',
                    border: '1px solid rgba(139, 92, 246, 0.16)',
                    color: '#b6c2d6',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {tx(h, lang)}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
              <button
                onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  color: '#ffffff',
                  boxShadow: '0 8px 30px rgba(99, 102, 241, 0.28)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {tx(i18n.hero.cta1, lang)}
                <ArrowRight size={15} />
              </button>
              <a
                href={SITE.freelancer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#67e8f9',
                  fontFamily: 'DM Sans, sans-serif',
                  textDecoration: 'none',
                }}
              >
                {tx(i18n.hero.cta2, lang)}
                <ArrowUpRight size={15} />
              </a>
              <button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.28)',
                  color: '#cbd5e1',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <MessageSquare size={14} />
                {tx(i18n.hero.cta3, lang)}
              </button>
            </div>
          </div>

          {/* Right: architecture panel */}
          <div className="hidden lg:flex flex-col items-center">
            <div
              className="w-full max-w-sm rounded-2xl p-5"
              style={{
                background: 'linear-gradient(160deg, rgba(18, 24, 51, 0.9), rgba(10, 15, 34, 0.85))',
                border: '1px solid rgba(139, 92, 246, 0.22)',
                boxShadow: '0 24px 70px rgba(2, 8, 23, 0.55)',
              }}
            >
              <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.12)' }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
                </div>
                <span className="text-[11px] ml-2" style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  private-ai-stack.yml
                </span>
              </div>
              <div className="flex flex-col">
                {ARCH_NODES.map((node, i) => (
                  <ArchNode key={node.label} node={node} index={i} />
                ))}
              </div>
            </div>

            <div
              className="w-full max-w-sm rounded-xl p-3 mt-3 grid grid-cols-3 gap-2"
              style={{
                background: 'rgba(12, 18, 40, 0.75)',
                border: '1px solid rgba(6, 182, 212, 0.16)',
              }}
            >
              {[
                { icon: Server, label: 'Local first' },
                { icon: ShieldCheck, label: 'Self-hosted' },
                { icon: Layers, label: 'Docker' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 py-1">
                  <Icon size={14} style={{ color: '#22d3ee' }} />
                  <span className="text-[10.5px] text-center" style={{ color: '#8fa0b8', fontFamily: 'JetBrains Mono, monospace' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-1.5">
          <span className="text-[11px]" style={{ color: '#475569' }}>
            {tx(i18n.hero.scrollHint, lang)}
          </span>
          <ChevronDown size={15} style={{ color: '#475569' }} />
        </div>
      </div>
    </section>
  );
}
