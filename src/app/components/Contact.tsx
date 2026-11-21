import { useState, type ReactNode } from 'react';
import { Mail, Github, CheckCircle, Shield, Clock, ArrowUpRight, Copy, Check, AlertCircle } from 'lucide-react';
import { useLang, i18n, tx } from './i18n';
import { SITE } from '../data/site';

type Fields = { name: string; email: string; subject: string; message: string; company: string };
type Errors = Partial<Record<'name' | 'email' | 'subject' | 'message', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function Contact() {
  const { lang } = useLang();
  const [form, setForm] = useState<Fields>({ name: '', email: '', subject: '', message: '', company: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');
  const [copied, setCopied] = useState(false);

  const set = (key: keyof Fields) => (value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key as keyof Errors]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = (values: Fields): Errors => {
    const next: Errors = {};
    if (values.name.trim().length < 2) next.name = tx(i18n.contact.errors.name, lang);
    if (!EMAIL_RE.test(values.email.trim())) next.email = tx(i18n.contact.errors.email, lang);
    if (values.subject.trim().length < 3) next.subject = tx(i18n.contact.errors.subject, lang);
    if (values.message.trim().length < 20) next.message = tx(i18n.contact.errors.message, lang);
    return next;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Honeypot: bots fill hidden fields, humans never see them.
    if (form.company.trim() !== '') {
      setStatus('sent');
      return;
    }
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.focus();
      return;
    }

    const subject = `${tx(i18n.contact.mailSubjectPrefix, lang)}: ${form.subject.trim()}`;
    const body = [
      `${form.name.trim()} <${form.email.trim()}>`,
      '',
      form.message.trim(),
      '',
      '—',
      `Sent from ${SITE.url}`,
    ].join('\n');

    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus('sent');
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 55%, transparent 100%)',
        }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] mb-5"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
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
              background: 'linear-gradient(120deg, #f1f5f9 0%, #a5b4fc 55%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
            }}
          >
            {tx(i18n.contact.title, lang)}
          </h2>
          <p className="text-[13px] mb-2" style={{ color: '#a5b4fc', fontFamily: 'JetBrains Mono, monospace' }}>
            {tx(i18n.contact.subtitle, lang)}
          </p>
          <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: '#94a3b8' }}>
            {tx(i18n.contact.desc, lang)}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-2 flex flex-col gap-3.5">
            <ContactCard
              icon={<Mail size={17} />}
              label="Email"
              value={SITE.email}
              color="#06b6d4"
              href={`mailto:${SITE.email}`}
            />
            <ContactCard
              icon={<Github size={17} />}
              label="GitHub"
              value={SITE.githubHandle}
              color="#a78bfa"
              href={SITE.github}
            />
            <ContactCard
              icon={<ArrowUpRight size={17} />}
              label="Freelancer"
              value={SITE.freelancerHandle}
              color="#10b981"
              href={SITE.freelancer}
            />

            <div
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: 'rgba(12, 18, 40, 0.7)', border: '1px solid rgba(139, 92, 246, 0.18)' }}
            >
              <div className="flex items-center gap-3">
                <Clock size={15} style={{ color: '#6ee7b7' }} />
                <span className="text-[13px]" style={{ color: '#a3b1c6' }}>{tx(i18n.contact.response, lang)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield size={15} style={{ color: '#67e8f9' }} />
                <span className="text-[13px]" style={{ color: '#a3b1c6' }}>{tx(i18n.contact.privacy, lang)}</span>
              </div>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.09), rgba(6, 182, 212, 0.06))',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <p className="text-[12.5px] mb-3" style={{ color: '#c3cede' }}>
                {tx(i18n.contact.freelancerHint, lang)}
              </p>
              <a
                href={SITE.freelancer}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12.5px] font-semibold"
                style={{
                  background: 'rgba(2, 8, 23, 0.55)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#6ee7b7',
                  fontFamily: 'DM Sans, sans-serif',
                  textDecoration: 'none',
                }}
              >
                {tx(i18n.contact.freelancerCta, lang)}
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div
              className="rounded-2xl p-6 sm:p-7"
              style={{
                background: 'linear-gradient(170deg, rgba(16, 23, 48, 0.92), rgba(8, 13, 30, 0.9))',
                border: '1px solid rgba(139, 92, 246, 0.22)',
              }}
            >
              {status === 'sent' ? (
                <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                  >
                    <CheckCircle size={28} style={{ color: '#10b981' }} />
                  </div>
                  <h3 className="text-base" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#f1f5f9' }}>
                    {tx(i18n.contact.successTitle, lang)}
                  </h3>
                  <p className="text-[13px] leading-relaxed max-w-sm" style={{ color: '#a3b1c6' }}>
                    {tx(i18n.contact.success, lang)}
                  </p>
                  <button
                    onClick={copyEmail}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[12.5px]"
                    style={{
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: '#67e8f9',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? tx(i18n.contact.copied, lang) : SITE.email}
                  </button>
                  <button
                    onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '', company: '' }); }}
                    className="text-[12.5px] underline underline-offset-4"
                    style={{ color: '#94a3b8', fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {tx(i18n.contact.again, lang)}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      id="contact-name"
                      label={tx(i18n.contact.namePlaceholder, lang)}
                      value={form.name}
                      onChange={set('name')}
                      error={errors.name}
                      autoComplete="name"
                    />
                    <FormField
                      id="contact-email"
                      label={tx(i18n.contact.emailPlaceholder, lang)}
                      value={form.email}
                      onChange={set('email')}
                      type="email"
                      error={errors.email}
                      autoComplete="email"
                    />
                  </div>
                  <FormField
                    id="contact-subject"
                    label={tx(i18n.contact.subjectPlaceholder, lang)}
                    value={form.subject}
                    onChange={set('subject')}
                    error={errors.subject}
                  />
                  <FormField
                    id="contact-message"
                    label={tx(i18n.contact.messagePlaceholder, lang)}
                    value={form.message}
                    onChange={set('message')}
                    error={errors.message}
                    multiline
                  />

                  {/* Honeypot — hidden from users and assistive tech */}
                  <div aria-hidden="true" className="absolute" style={{ left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
                    <label htmlFor="contact-company">Company</label>
                    <input
                      id="contact-company"
                      name="company"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.company}
                      onChange={e => set('company')(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                      color: '#fff',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {tx(i18n.contact.cta, lang)}
                  </button>

                  <p className="text-[11px] text-center" style={{ color: '#64748b' }}>
                    {tx(i18n.contact.direct, lang)}:{' '}
                    <a href={`mailto:${SITE.email}`} style={{ color: '#67e8f9', textDecoration: 'none' }}>
                      {SITE.email}
                    </a>
                  </p>
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
  id, label, value, onChange, type = 'text', error, multiline = false, autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  multiline?: boolean;
  autoComplete?: string;
}) {
  const base: React.CSSProperties = {
    background: 'rgba(21, 30, 58, 0.6)',
    border: `1px solid ${error ? 'rgba(239, 68, 68, 0.55)' : 'rgba(139, 92, 246, 0.22)'}`,
    color: '#e2e8f0',
    fontFamily: 'DM Sans, sans-serif',
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px]"
        style={{ color: '#8fa0b8', fontFamily: 'JetBrains Mono, monospace' }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={5}
          required
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
          style={base}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none"
          style={base}
        />
      )}
      {error && (
        <span
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-[11.5px]"
          style={{ color: '#fca5a5' }}
        >
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  );
}

function ContactCard({
  icon, label, value, color, href,
}: {
  icon: ReactNode; label: string; value: string; color: string; href: string;
}) {
  const external = href.startsWith('http');
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex items-center gap-3.5 p-4 rounded-xl transition-colors duration-200"
      style={{
        background: 'rgba(12, 18, 40, 0.7)',
        border: `1px solid ${color}22`,
        textDecoration: 'none',
      }}
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}12`, border: `1px solid ${color}28`, color }}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span
          className="block text-[10px] mb-0.5"
          style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
        >
          {label}
        </span>
        <span className="block text-[13px] truncate" style={{ color: '#dbe3ef', fontFamily: 'DM Sans, sans-serif' }}>
          {value}
        </span>
      </span>
    </a>
  );
}
