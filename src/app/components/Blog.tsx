import { FileText, PenLine } from 'lucide-react';
import { useLang, i18n, tx } from './i18n';

const ACCENTS = ['#06b6d4', '#8b5cf6', '#10b981', '#6366f1', '#f59e0b'];

export function Blog() {
  const { lang } = useLang();

  return (
    <section id="blog" className="py-24 relative">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 70%)' }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] mb-5"
            style={{
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.26)',
              color: '#c4b5fd',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            BLOG
          </div>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              background: 'linear-gradient(120deg, #f1f5f9, #c4b5fd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {tx(i18n.blog.title, lang)}
          </h2>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: '#94a3b8' }}>
            {tx(i18n.blog.subtitle, lang)}
          </p>
        </div>

        <div
          className="max-w-3xl mx-auto mb-8 rounded-xl px-4 py-3 flex items-start gap-2.5"
          style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.18)' }}
        >
          <FileText size={14} style={{ color: '#fcd34d', flexShrink: 0, marginTop: 2 }} />
          <p className="text-[12.5px] leading-relaxed" style={{ color: '#d6c9a8' }}>
            {tx(i18n.blog.disclaimer, lang)}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {i18n.blog.topics.map((topic, idx) => {
            const color = ACCENTS[idx % ACCENTS.length];
            return (
              <article
                key={topic.title.en}
                className="relative rounded-2xl p-5 flex flex-col gap-3"
                style={{
                  background: 'linear-gradient(165deg, rgba(16, 23, 48, 0.9), rgba(9, 14, 32, 0.85))',
                  border: `1px solid ${color}1f`,
                }}
              >
                <div
                  className="absolute top-0 left-5 right-5 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}70, transparent)` }}
                />
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10.5px]"
                    style={{
                      background: `${color}10`,
                      color,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {topic.tag}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(148, 163, 184, 0.08)',
                      border: '1px solid rgba(148, 163, 184, 0.18)',
                      color: '#94a3b8',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    <PenLine size={9} />
                    {tx(i18n.blog.inPreparation, lang)}
                  </span>
                </div>
                <h3
                  className="text-[13.5px] leading-snug"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#f1f5f9' }}
                >
                  {tx(topic.title, lang)}
                </h3>
                <p className="text-[12.5px] leading-relaxed" style={{ color: '#94a3b8' }}>
                  {tx(topic.desc, lang)}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
