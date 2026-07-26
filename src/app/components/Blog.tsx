import { ArrowRight, Clock } from 'lucide-react';
import { useLang, i18n, tx } from './i18n';

const ARTICLE_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

function formatDate(dateStr: string, lang: string) {
  const d = new Date(dateStr);
  const locales: Record<string, string> = { fr: 'fr-FR', en: 'en-US', de: 'de-DE' };
  return d.toLocaleDateString(locales[lang] || 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function Blog() {
  const { lang } = useLang();

  return (
    <section id="blog" className="py-24 relative">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139, 92, 246, 0.04) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
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
            BLOG
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
            {tx(i18n.blog.title, lang)}
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: '#94a3b8' }}>
            {tx(i18n.blog.subtitle, lang)}
          </p>
        </div>

        {/* Featured article (first) + grid for rest */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Featured */}
          {i18n.blog.articles.slice(0, 1).map((article, idx) => {
            const color = ARTICLE_COLORS[idx];
            return (
              <div
                key={idx}
                className="lg:col-span-1 relative rounded-2xl p-6 flex flex-col gap-4 cursor-pointer transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, rgba(10, 20, 44, 0.9) 0%, rgba(6, 182, 212, 0.06) 100%)`,
                  border: `1px solid ${color}25`,
                  backdropFilter: 'blur(20px)',
                  boxShadow: `0 0 40px ${color}08`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${color}15`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${color}08`;
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }}
                />
                <span
                  className="self-start px-2.5 py-1 rounded-full text-xs"
                  style={{
                    background: `${color}12`,
                    border: `1px solid ${color}25`,
                    color,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {article.tag}
                </span>
                <div
                  className="text-xs px-2.5 py-1 self-start rounded"
                  style={{
                    background: 'rgba(6, 182, 212, 0.08)',
                    color: '#06b6d4',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  ✦ FEATURED
                </div>
                <h3
                  className="text-lg"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4 }}
                >
                  {tx(article.title, lang)}
                </h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: '#94a3b8' }}>
                  {tx(article.desc, lang)}
                </p>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(6,182,212,0.08)' }}>
                  <div className="flex items-center gap-3 text-xs" style={{ color: '#475569' }}>
                    <span>{formatDate(article.date, lang)}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {article.readTime}
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color, fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {tx(i18n.blog.readMore, lang)} <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Other articles */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {i18n.blog.articles.slice(1).map((article, idx) => {
              const color = ARTICLE_COLORS[idx + 1];
              return (
                <div
                  key={idx}
                  className="relative rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300"
                  style={{
                    background: 'rgba(10, 20, 44, 0.6)',
                    border: '1px solid rgba(6, 182, 212, 0.1)',
                    backdropFilter: 'blur(20px)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.border = `1px solid ${color}25`;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${color}10`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.border = '1px solid rgba(6, 182, 212, 0.1)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                    style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }}
                  />
                  <span
                    className="self-start px-2 py-0.5 rounded text-xs"
                    style={{
                      background: `${color}10`,
                      color,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {article.tag}
                  </span>
                  <h3
                    className="text-sm"
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.5 }}
                  >
                    {tx(article.title, lang)}
                  </h3>
                  <p className="text-xs leading-relaxed flex-1" style={{ color: '#64748b' }}>
                    {tx(article.desc, lang).slice(0, 120)}...
                  </p>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(6,182,212,0.06)' }}>
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
                      <Clock size={10} />
                      {article.readTime}
                    </div>
                    <button
                      className="flex items-center gap-1 text-xs"
                      style={{ color, fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {tx(i18n.blog.readMore, lang)} <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
