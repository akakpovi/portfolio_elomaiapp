import { X, Check } from 'lucide-react';
import { useLang, i18n, tx } from './i18n';

export function WhyLocal() {
  const { lang } = useLang();

  return (
    <section id="about" className="py-24 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 100% 50%, rgba(6, 182, 212, 0.04) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-6"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10b981',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            WHY LOCAL AI?
          </div>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e2e8f0, #10b981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {tx(i18n.whyLocal.title, lang)}
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: '#94a3b8' }}>
            {tx(i18n.whyLocal.subtitle, lang)}
          </p>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Column headers */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="px-4 py-2 text-xs" style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                ASPECT
              </div>
              <div
                className="px-4 py-2.5 rounded-xl text-center text-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                }}
              >
                ☁️ {tx(i18n.whyLocal.cloudTitle, lang)}
              </div>
              <div
                className="px-4 py-2.5 rounded-xl text-center text-sm"
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.08)',
                }}
              >
                💻 {tx(i18n.whyLocal.localTitle, lang)}
              </div>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-2">
              {i18n.whyLocal.comparison.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-3 gap-3 rounded-xl overflow-hidden"
                  style={{ background: idx % 2 === 0 ? 'rgba(10, 20, 44, 0.4)' : 'rgba(10, 20, 44, 0.2)' }}
                >
                  {/* Aspect */}
                  <div
                    className="px-4 py-3 flex items-center text-sm"
                    style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {tx(row.aspect, lang)}
                  </div>

                  {/* Cloud */}
                  <div className="px-4 py-3 flex items-center gap-2">
                    <X size={14} className="flex-shrink-0" style={{ color: '#ef4444' }} />
                    <span className="text-sm" style={{ color: '#64748b' }}>
                      {tx(row.cloud, lang)}
                    </span>
                  </div>

                  {/* Local */}
                  <div className="px-4 py-3 flex items-center gap-2">
                    <Check size={14} className="flex-shrink-0" style={{ color: '#10b981' }} />
                    <span className="text-sm" style={{ color: '#cbd5e1' }}>
                      {tx(row.local, lang)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA banner */}
        <div
          className="mt-12 rounded-2xl p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.06) 0%, rgba(139, 92, 246, 0.06) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.15)',
          }}
        >
          <p
            className="text-xl mb-2"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              color: '#e2e8f0',
            }}
          >
            {lang === 'fr' ? 'Prenez le contrôle de votre IA' : lang === 'de' ? 'Übernehmen Sie die Kontrolle über Ihre KI' : 'Take control of your AI'}
          </p>
          <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>
            {lang === 'fr' ? 'Vos données. Votre matériel. Votre IA.' : lang === 'de' ? 'Ihre Daten. Ihre Hardware. Ihre KI.' : 'Your data. Your hardware. Your AI.'}
          </p>
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 rounded-xl text-sm"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              color: '#fff',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
              boxShadow: '0 0 30px rgba(6, 182, 212, 0.25)',
            }}
          >
            {tx(i18n.contact.cta, lang)}
          </button>
        </div>
      </div>
    </section>
  );
}
