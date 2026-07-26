import { useState, useEffect, useRef } from 'react';
import { useLang, i18n, tx } from './i18n';

const TERMINAL_LINES = [
  { type: 'prompt', text: null },
  { type: 'system', text: '> Analyzing system performance...' },
  { type: 'gap', text: '' },
  { type: 'label', text: '📊 SYSTEM REPORT' },
  { type: 'metric', text: '  CPU Usage:        35% ████░░░░░░░░' },
  { type: 'metric', text: '  RAM Usage:        62% ██████░░░░░░' },
  { type: 'metric', text: '  GPU (RTX 3080):   28% ███░░░░░░░░░' },
  { type: 'metric', text: '  Disk (SSD):       74% ███████░░░░░' },
  { type: 'gap', text: '' },
  { type: 'label', text: '🐳 DOCKER CONTAINERS (8 running)' },
  { type: 'info', text: '  ✓ ollama          UP   11179/tcp' },
  { type: 'info', text: '  ✓ rag-api         UP   8000/tcp' },
  { type: 'info', text: '  ✓ chroma-db       UP   8001/tcp' },
  { type: 'info', text: '  ✓ ai-agent        UP   running' },
  { type: 'gap', text: '' },
  { type: 'success', text: '✅ System healthy. 2 optimizations recommended.' },
];

export function ComputerOperator() {
  const { lang } = useLang();
  const [visibleLines, setVisibleLines] = useState(0);
  const [typing, setTyping] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(false);

  const prompt = tx(i18n.operator.userPrompt, lang);

  useEffect(() => {
    setVisibleLines(0);
    setTyping('');
    setTypingDone(false);
    inViewRef.current = false;
  }, [lang]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !inViewRef.current) {
          inViewRef.current = true;
          startAnimation();
        }
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lang]);

  const startAnimation = () => {
    let charIdx = 0;
    const typeInterval = setInterval(() => {
      if (charIdx <= prompt.length) {
        setTyping(prompt.slice(0, charIdx));
        charIdx++;
      } else {
        clearInterval(typeInterval);
        setTypingDone(true);
        let lineIdx = 1;
        const lineInterval = setInterval(() => {
          setVisibleLines(lineIdx);
          lineIdx++;
          if (lineIdx > TERMINAL_LINES.length) clearInterval(lineInterval);
        }, 120);
      }
    }, 40);
  };

  return (
    <section className="py-24 relative">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 50% 60% at 100% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Terminal */}
          <div
            ref={containerRef}
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#0a0f1e',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 0 60px rgba(16, 185, 129, 0.06)',
            }}
          >
            {/* Terminal header */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.1)', background: 'rgba(10, 20, 44, 0.5)' }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} />
              </div>
              <span className="text-xs ml-2" style={{ color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                local-ai-operator ~ bash
              </span>
              <div
                className="ml-auto px-2 py-0.5 rounded text-xs animate-pulse"
                style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}
              >
                ● LIVE
              </div>
            </div>

            {/* Terminal content */}
            <div className="p-4 min-h-64 font-mono text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {/* User prompt */}
              <div className="flex items-start gap-2 mb-3">
                <span style={{ color: '#8b5cf6' }}>user@local-ai</span>
                <span style={{ color: '#475569' }}>$</span>
                <span style={{ color: '#e2e8f0' }}>
                  {typing}
                  {!typingDone && <span className="animate-pulse" style={{ color: '#10b981' }}>█</span>}
                </span>
              </div>

              {/* Response lines */}
              {typingDone && TERMINAL_LINES.slice(0, visibleLines).map((line, i) => {
                if (line.type === 'gap') return <div key={i} className="h-2" />;
                const colors: Record<string, string> = {
                  system: '#64748b',
                  label: '#06b6d4',
                  metric: '#94a3b8',
                  info: '#10b981',
                  success: '#10b981',
                };
                return (
                  <div key={i} className="text-xs leading-6" style={{ color: colors[line.type] || '#94a3b8' }}>
                    {line.text}
                  </div>
                );
              })}

              {visibleLines >= TERMINAL_LINES.length && (
                <div className="flex items-center gap-2 mt-3">
                  <span style={{ color: '#8b5cf6' }}>user@local-ai</span>
                  <span style={{ color: '#475569' }}>$</span>
                  <span className="animate-pulse" style={{ color: '#10b981' }}>█</span>
                </div>
              )}
            </div>
          </div>

          {/* Right content */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-6"
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
              AI COMPUTER OPERATOR
            </div>

            <h2
              className="text-3xl sm:text-4xl mb-6"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #e2e8f0, #10b981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.2,
              }}
            >
              {tx(i18n.operator.title, lang)}
            </h2>

            <p className="text-base leading-relaxed mb-8" style={{ color: '#94a3b8' }}>
              {tx(i18n.operator.desc, lang)}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {i18n.operator.features.map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(10, 20, 44, 0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.1)',
                    color: '#cbd5e1',
                  }}
                >
                  <span>{feat.icon}</span>
                  <span style={{ fontFamily: 'DM Sans, sans-serif' }}>{tx(feat, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
