import { useLang, i18n, tx } from './i18n';

const SOURCE_ICONS: Record<string, string> = {
  PDF: '📄',
  Word: '📝',
  Markdown: '📋',
  Emails: '📧',
  Database: '🗄️',
  Web: '🌐',
};

export function RAGSystem() {
  const { lang } = useLang();

  return (
    <section id="rag" className="py-24 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
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
            RAG KNOWLEDGE SYSTEMS
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
            {tx(i18n.rag.title, lang)}
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: '#94a3b8' }}>
            {tx(i18n.rag.desc, lang)}
          </p>
        </div>

        {/* Pipeline visualization */}
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-2 justify-center mb-16">
          {/* Sources */}
          <div
            className="rounded-2xl p-5 w-full lg:w-56"
            style={{
              background: 'rgba(10, 20, 44, 0.7)',
              border: '1px solid rgba(6, 182, 212, 0.15)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <p className="text-xs mb-3 text-center" style={{ color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace' }}>
              SOURCES
            </p>
            <div className="grid grid-cols-3 gap-2">
              {i18n.rag.sources.map(src => (
                <div key={src} className="flex flex-col items-center gap-1">
                  <span className="text-lg">{SOURCE_ICONS[src]}</span>
                  <span className="text-xs" style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>{src}</span>
                </div>
              ))}
            </div>
          </div>

          <PipelineArrow />

          {/* Embedding */}
          <PipelineNode
            icon="⚡"
            label="Embedding System"
            sub="nomic-embed-text"
            color="#f59e0b"
          />

          <PipelineArrow />

          {/* Vector DB */}
          <PipelineNode
            icon="🗃️"
            label="Vector Database"
            sub="ChromaDB / Qdrant"
            color="#8b5cf6"
          />

          <PipelineArrow />

          {/* AI Assistant */}
          <div
            className="rounded-2xl p-5 w-full lg:w-56"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(139, 92, 246, 0.08))',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)',
            }}
          >
            <div className="text-2xl text-center mb-2">🤖</div>
            <p className="text-xs text-center mb-1" style={{ color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace' }}>
              PRIVATE AI ASSISTANT
            </p>
            <p className="text-xs text-center" style={{ color: '#475569' }}>Qwen / Llama local</p>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {i18n.rag.features.map((feat, i) => {
            const icons = ['🔍', '📖', '💬', '🔗'];
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center gap-2 p-4 rounded-xl"
                style={{
                  background: 'rgba(10, 20, 44, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.12)',
                }}
              >
                <span className="text-2xl">{icons[i]}</span>
                <span className="text-sm" style={{ color: '#cbd5e1', fontFamily: 'DM Sans, sans-serif' }}>
                  {tx(feat, lang)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PipelineNode({ icon, label, sub, color }: {
  icon: string; label: string; sub: string; color: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 w-full lg:w-44 flex flex-col items-center text-center gap-2"
      style={{
        background: 'rgba(10, 20, 44, 0.7)',
        border: `1px solid ${color}25`,
        backdropFilter: 'blur(20px)',
      }}
    >
      <span className="text-2xl">{icon}</span>
      <p className="text-xs" style={{ color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{label}</p>
      <p className="text-xs" style={{ color: '#475569' }}>{sub}</p>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div className="flex items-center justify-center w-8 lg:flex-shrink-0 my-2 lg:my-0">
      <div className="hidden lg:block text-2xl" style={{ color: '#1e2a4a' }}>→</div>
      <div className="lg:hidden text-2xl" style={{ color: '#1e2a4a' }}>↓</div>
    </div>
  );
}
