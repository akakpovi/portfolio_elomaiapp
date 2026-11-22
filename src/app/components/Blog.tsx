import { useEffect, useState } from 'react';
import { FileText, PenLine, ArrowRight, Clock } from 'lucide-react';
import { useLang, i18n, tx, type Lang } from './i18n';

const ACCENTS = ['#06b6d4', '#8b5cf6', '#10b981', '#6366f1', '#f59e0b'];

type FeedArticle = {
  slug: string;
  lang: Lang;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingMinutes: number;
  image: string | null;
  imageAlt: string;
  url: string;
  categories: { slug: string; name: string }[];
};

type Feed = { generatedAt: string; count: number; articles: FeedArticle[] };

const LABELS = {
  latest: { en: 'Latest articles', de: 'Neueste Artikel', fr: 'Derniers articles' },
  all: { en: 'All articles', de: 'Alle Artikel', fr: 'Tous les articles' },
  read: { en: 'Read article', de: 'Artikel lesen', fr: 'Lire l’article' },
  minutes: { en: 'min read', de: 'Min. Lesezeit', fr: 'min de lecture' },
  fallback: {
    en: 'This article is not published in your language yet — showing the English version.',
    de: 'Dieser Artikel ist noch nicht in Ihrer Sprache verfügbar – die englische Fassung wird angezeigt.',
    fr: 'Cet article n’est pas encore disponible dans votre langue — version anglaise affichée.',
  },
};

function formatDate(iso: string, lang: Lang): string {
  const locales: Record<Lang, string> = { en: 'en-GB', de: 'de-DE', fr: 'fr-FR' };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locales[lang], { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function Blog() {
  const { lang } = useLang();
  const [articles, setArticles] = useState<FeedArticle[] | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/content/blog-index.json', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((feed: Feed) => {
        if (cancelled || !feed || !Array.isArray(feed.articles)) return;
        const inLanguage = feed.articles.filter((article) => article.lang === lang);
        if (inLanguage.length > 0) {
          setArticles(inLanguage.slice(0, 3));
          setUsedFallback(false);
        } else {
          const english = feed.articles.filter((article) => article.lang === 'en');
          setArticles(english.slice(0, 3));
          setUsedFallback(english.length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) setArticles(null);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const hasArticles = !!articles && articles.length > 0;

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

        {hasArticles ? (
          <>
            {usedFallback && (
              <p
                className="max-w-3xl mx-auto mb-6 text-[12.5px] rounded-xl px-4 py-3"
                style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#d6c9a8' }}
              >
                {LABELS.fallback[lang]}
              </p>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles!.map((article, idx) => {
                const color = ACCENTS[idx % ACCENTS.length];
                const category = article.categories[0];
                return (
                  <article
                    key={`${article.lang}-${article.slug}`}
                    className="relative rounded-2xl overflow-hidden flex flex-col"
                    style={{
                      background: 'linear-gradient(165deg, rgba(16, 23, 48, 0.9), rgba(9, 14, 32, 0.85))',
                      border: `1px solid ${color}1f`,
                    }}
                  >
                    {article.image && (
                      <img
                        src={article.image}
                        alt={article.imageAlt || ''}
                        width={800}
                        height={450}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10.5px]"
                          style={{ background: `${color}10`, color, fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {category ? category.name : 'BLOG'}
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
                          <Clock size={9} />
                          {article.readingMinutes} {LABELS.minutes[lang]}
                        </span>
                      </div>
                      <h3
                        className="text-[14px] leading-snug"
                        style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#f1f5f9' }}
                      >
                        <a href={article.url} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {article.title}
                        </a>
                      </h3>
                      <p className="text-[12.5px] leading-relaxed flex-1" style={{ color: '#94a3b8' }}>
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[11px]" style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                          {formatDate(article.publishedAt, lang)} · {article.lang.toUpperCase()}
                        </span>
                        <a
                          href={article.url}
                          className="inline-flex items-center gap-1 text-[11.5px]"
                          style={{ color, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}
                        >
                          {LABELS.read[lang]}
                          <ArrowRight size={11} />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-8 flex justify-center">
              <a
                href={lang === 'en' ? '/blog/' : `/blog/${lang}/`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px]"
                style={{
                  background: 'rgba(30, 41, 74, 0.45)',
                  border: '1px solid rgba(139, 92, 246, 0.22)',
                  color: '#c4b5fd',
                  fontFamily: 'JetBrains Mono, monospace',
                  textDecoration: 'none',
                }}
              >
                {LABELS.all[lang]}
                <ArrowRight size={13} />
              </a>
            </div>
          </>
        ) : (
          <>
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
                        style={{ background: `${color}10`, color, fontFamily: 'JetBrains Mono, monospace' }}
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
          </>
        )}
      </div>
    </section>
  );
}
