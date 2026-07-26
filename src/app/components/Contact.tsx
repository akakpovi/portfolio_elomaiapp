import { useState, type ReactNode } from 'react';
import { Mail, Github, Linkedin, CheckCircle, Shield, Clock } from 'lucide-react';
import { useLang, i18n, tx } from './i18n';

export function Contact() {
  const { lang } = useLang();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(6, 182, 212, 0.05) 0%, rgba(139, 92, 246, 0.03) 50%, transparent 100%)',
        }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
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
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
            {tx(i18n.contact.availability, lang)}
          </div>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e2e8f0 0%, #06b6d4 60%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
            }}
          >
            {tx(i18n.contact.title, lang)}
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: '#94a3b8' }}>
            {tx(i18n.contact.desc, lang)}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left sidebar */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Contact cards */}
            <ContactCard
              icon={<Mail size={18} />}
              label="Email"
              value="hello@ai-engineer.dev"
              color="#06b6d4"
              href="mailto:hello@ai-engineer.dev"
            />
            <ContactCard
              icon={<Github size={18} />}
              label="GitHub"
              value="github.com/ai-engineer"
              color="#8b5cf6"
              href="#"
            />
            <ContactCard
              icon={<Linkedin size={18} />}
              label="LinkedIn"
              value="linkedin.com/in/ai-engineer"
              color="#10b981"
              href="#"
            />

            {/* Info chips */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{
                background: 'rgba(10, 20, 44, 0.5)',
                border: '1px solid rgba(6, 182, 212, 0.12)',
              }}
            >
              <div className="flex items-center gap-3">
                <Clock size={15} style={{ color: '#10b981' }} />
                <span className="text-sm" style={{ color: '#94a3b8' }}>{tx(i18n.contact.response, lang)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield size={15} style={{ color: '#06b6d4' }} />
                <span className="text-sm" style={{ color: '#94a3b8' }}>{tx(i18n.contact.gdpr, lang)}</span>
              </div>
            </div>

            {/* Subtitle */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(139,92,246,0.06))',
                border: '1px solid rgba(6,182,212,0.15)',
              }}
            >
              <p className="text-sm" style={{ color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>
                {tx(i18n.contact.subtitle, lang)}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {['Local AI', 'Private LLM', 'Agents', 'RAG', 'Docker'].map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(6,182,212,0.08)',
                      border: '1px solid rgba(6,182,212,0.15)',
                      color: '#64748b',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'rgba(10, 20, 44, 0.7)',
                border: '1px solid rgba(6, 182, 212, 0.15)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 60px rgba(6, 182, 212, 0.05)',
              }}
            >
              {sent ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                  >
                    <CheckCircle size={32} style={{ color: '#10b981' }} />
                  </div>
                  <p
                    className="text-lg text-center"
                    style={{ fontFamily: 'JetBrains Mono, monospace', color: '#e2e8f0' }}
                  >
                    {tx(i18n.contact.success, lang)}
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="text-sm"
                    style={{ color: '#06b6d4', fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {lang === 'fr' ? 'Envoyer un autre message' : lang === 'de' ? 'Weitere Nachricht senden' : 'Send another message'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      label={tx(i18n.contact.namePlaceholder, lang)}
                      value={form.name}
                      onChange={v => setForm(f => ({ ...f, name: v }))}
                      required
                    />
                    <FormField
                      label={tx(i18n.contact.emailPlaceholder, lang)}
                      value={form.email}
                      onChange={v => setForm(f => ({ ...f, email: v }))}
                      type="email"
                      required
                    />
                  </div>
                  <FormField
                    label={tx(i18n.contact.subjectPlaceholder, lang)}
                    value={form.subject}
                    onChange={v => setForm(f => ({ ...f, subject: v }))}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs" style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                      {tx(i18n.contact.messagePlaceholder, lang)}
                    </label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      rows={5}
                      required
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all duration-150"
                      style={{
                        background: 'rgba(30, 42, 74, 0.5)',
                        border: '1px solid rgba(6, 182, 212, 0.15)',
                        color: '#e2e8f0',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.08)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.15)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3.5 rounded-xl text-sm transition-all duration-200 relative overflow-hidden"
                    style={{
                      background: sending ? 'rgba(6, 182, 212, 0.3)' : 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                      color: '#fff',
                      fontFamily: 'DM Sans, sans-serif',
                      fontWeight: 600,
                      boxShadow: sending ? 'none' : '0 0 30px rgba(6, 182, 212, 0.25)',
                      cursor: sending ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {sending ? tx(i18n.contact.sending, lang) : tx(i18n.contact.cta, lang)}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FormField({
  label, value, onChange, type = 'text', required = false
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs" style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150"
        style={{
          background: 'rgba(30, 42, 74, 0.5)',
          border: '1px solid rgba(6, 182, 212, 0.15)',
          color: '#e2e8f0',
          fontFamily: 'DM Sans, sans-serif',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.08)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.15)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

function ContactCard({
  icon, label, value, color, href
}: {
  icon: ReactNode; label: string; value: string; color: string; href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group"
      style={{
        background: 'rgba(10, 20, 44, 0.5)',
        border: `1px solid ${color}15`,
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}35`;
        (e.currentTarget as HTMLElement).style.background = `${color}06`;
        (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}15`;
        (e.currentTarget as HTMLElement).style.background = 'rgba(10, 20, 44, 0.5)';
        (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs mb-0.5" style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
          {label}
        </div>
        <div className="text-sm" style={{ color: '#cbd5e1', fontFamily: 'DM Sans, sans-serif' }}>
          {value}
        </div>
      </div>
    </a>
  );
}
