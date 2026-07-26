import { useLang, i18n, tx } from './i18n';

const TECH_DATA = {
  models: {
    color: '#06b6d4',
    items: [
      { name: 'Qwen2.5', detail: '7B / 14B / 72B' },
      { name: 'Llama 3.3', detail: '8B / 70B' },
      { name: 'Mistral', detail: '7B / 22B' },
      { name: 'DeepSeek', detail: 'R1 / V3' },
      { name: 'Phi-4', detail: 'Mini / Full' },
      { name: 'Gemma 3', detail: '4B / 12B' },
    ],
  },
  frameworks: {
    color: '#8b5cf6',
    items: [
      { name: 'LangChain', detail: 'Chains & Tools' },
      { name: 'LangGraph', detail: 'Agent Workflows' },
      { name: 'RAG', detail: 'Retrieval AI' },
      { name: 'ChromaDB', detail: 'Vector Store' },
      { name: 'Qdrant', detail: 'Vector DB' },
      { name: 'Ollama', detail: 'Local Runner' },
    ],
  },
  backend: {
    color: '#10b981',
    items: [
      { name: 'Python', detail: '3.11 / 3.12' },
      { name: 'FastAPI', detail: 'Async REST' },
      { name: 'Django', detail: 'Web Framework' },
      { name: 'PostgreSQL', detail: 'Database' },
      { name: 'Redis', detail: 'Cache / Queue' },
      { name: 'SQLite', detail: 'Local DB' },
    ],
  },
  frontend: {
    color: '#f59e0b',
    items: [
      { name: 'React', detail: '18 / 19' },
      { name: 'TypeScript', detail: '5.x' },
      { name: 'TailwindCSS', detail: 'v4' },
      { name: 'Next.js', detail: 'App Router' },
      { name: 'Vite', detail: 'Build Tool' },
      { name: 'Shadcn/ui', detail: 'Components' },
    ],
  },
  infra: {
    color: '#ef4444',
    items: [
      { name: 'Docker', detail: 'Containers' },
      { name: 'Linux', detail: 'Ubuntu / Debian' },
      { name: 'Terraform', detail: 'IaC' },
      { name: 'OpenStack', detail: 'Private Cloud' },
      { name: 'AWS', detail: 'EC2 / S3 / ECS' },
      { name: 'Nginx', detail: 'Reverse Proxy' },
    ],
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
        style={{
          background: 'radial-gradient(ellipse 80% 40% at 50% 50%, rgba(6, 182, 212, 0.03) 0%, transparent 70%)',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
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
            TECH STACK
          </div>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e2e8f0, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {tx(i18n.techStack.title, lang)}
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: '#94a3b8' }}>
            {tx(i18n.techStack.subtitle, lang)}
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {CATEGORY_KEYS.map(catKey => {
            const cat = TECH_DATA[catKey];
            const catLabel = i18n.techStack.categories[catKey];
            return (
              <div
                key={catKey}
                className="rounded-2xl p-5 flex flex-col gap-4"
                style={{
                  background: 'rgba(10, 20, 44, 0.6)',
                  border: `1px solid ${cat.color}18`,
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Category header */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: cat.color, boxShadow: `0 0 6px ${cat.color}` }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: cat.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}
                  >
                    {tx(catLabel, lang).toUpperCase()}
                  </span>
                </div>

                {/* Tech items */}
                <div className="flex flex-col gap-2">
                  {cat.items.map(({ name, detail }) => (
                    <div
                      key={name}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg group cursor-default transition-all duration-150"
                      style={{ background: `${cat.color}06` }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = `${cat.color}12`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = `${cat.color}06`;
                      }}
                    >
                      <span
                        className="text-sm"
                        style={{ color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}
                      >
                        {name}
                      </span>
                      <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: cat.color }}>
                        {detail}
                      </span>
                    </div>
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
