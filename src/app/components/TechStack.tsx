import { useLang, i18n, tx } from './i18n';

const TECH_DATA = {
  ai: {
    color: '#22d3ee',
    items: ['Python', 'Ollama', 'Qwen', 'Llama', 'Mistral', 'DeepSeek', 'RAG', 'LangChain', 'LangGraph'],
  },
  frontend: {
    color: '#a78bfa',
    items: ['React', 'TypeScript', 'JavaScript', 'Vite', 'Tailwind CSS'],
  },
  backend: {
    color: '#34d399',
    items: ['Python', 'Django', 'FastAPI', 'REST APIs'],
  },
  databases: {
    color: '#fbbf24',
    items: ['PostgreSQL', 'Redis', 'SQLite', 'ChromaDB', 'Qdrant'],
  },
  infra: {
    color: '#818cf8',
    items: ['Docker', 'Docker Compose', 'Linux', 'Terraform', 'OpenTofu', 'AWS', 'OpenStack', 'Nginx'],
  },
  security: {
    color: '#f87171',
    items: ['OWASP ZAP', 'Nuclei', 'SSL', 'DNS', 'SPF', 'DKIM', 'DMARC'],
  },
};

type CategoryKey = keyof typeof TECH_DATA;
const CATEGORY_KEYS = Object.keys(TECH_DATA) as CategoryKey[];

export function TechStack() {
  const { lang } = useLang();

  return (
    <section id="technologies" className="py-24 relative">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 75% 40% at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 70%)' }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] mb-5"
            style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.26)',
              color: '#67e8f9',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            TECH STACK
          </div>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              background: 'linear-gradient(120deg, #f1f5f9, #67e8f9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {tx(i18n.techStack.title, lang)}
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: '#94a3b8' }}>
            {tx(i18n.techStack.subtitle, lang)}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_KEYS.map(catKey => {
            const cat = TECH_DATA[catKey];
            return (
              <div
                key={catKey}
                className="rounded-2xl p-5 flex flex-col gap-3.5"
                style={{
                  background: 'linear-gradient(165deg, rgba(16, 23, 48, 0.9), rgba(9, 14, 32, 0.85))',
                  border: `1px solid ${cat.color}1f`,
                }}
              >
                <div className="flex items-center gap-2 pb-2.5" style={{ borderBottom: `1px solid ${cat.color}18` }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                  <h3
                    className="text-[11px] tracking-[0.1em] uppercase"
                    style={{ color: cat.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}
                  >
                    {tx(i18n.techStack.categories[catKey], lang)}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map(name => (
                    <span
                      key={name}
                      className="px-2 py-1 rounded-md text-[12px]"
                      style={{
                        background: `${cat.color}0c`,
                        border: `1px solid ${cat.color}20`,
                        color: '#dbe3ef',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
