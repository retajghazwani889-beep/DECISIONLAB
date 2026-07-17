import React, { useState } from 'react';
import { Mail, Send, Loader2, Check, LifeBuoy, Handshake } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ContactPage — professional Contact Us with an info sidebar and a full form:
// topic dropdown · first/last name · email · phone (optional) · message with
// a 1000-character counter · required consent · anti-spam protection.
//
// Submissions are delivered via Web3Forms to info@decisionlabhub.com.
//
// Anti-spam: a hidden "botcheck" honeypot field (Web3Forms built-in). Bots
// fill it, humans never see it, and those submissions are dropped.
// ─────────────────────────────────────────────────────────────────────────────

const WEB3FORMS_ACCESS_KEY = '102db3b1-ba90-4b55-bacd-0921080808c1';
const BUSINESS_EMAIL = 'info@decisionlabhub.com';
const SUPPORT_EMAIL = 'support@decisionlabhub.com';
const PARTNERS_EMAIL = 'info@decisionlabhub.com';

const TOPICS = ['General Inquiry', 'Beta Feedback', 'Bug Report', 'Partnership', 'Investor Inquiry', 'Press & Media', 'Other'];
const MAX_MESSAGE = 1000;

export default function ContactPage() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [botcheck, setBotcheck] = useState(''); // honeypot — humans never see it
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (botcheck) return; // bot caught by the honeypot
    if (!firstName.trim()) return setError('Please enter your first name.');
    if (!lastName.trim()) return setError('Please enter your last name.');
    if (!email.includes('@')) return setError('Please enter a valid email.');
    if (!message.trim()) return setError('Please write a message.');
    if (!consent) return setError('Please tick the consent box so we can respond to your query.');

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const composed = `${message.trim()}${phone.trim() ? `\n\nPhone: ${phone.trim()}` : ''}`;

    // Fallback until the access key is configured: open the visitor's mail app.
    if (!WEB3FORMS_ACCESS_KEY) {
      const body = encodeURIComponent(`${composed}\n\n— ${fullName} (${email.trim()})`);
      window.location.href = `mailto:${BUSINESS_EMAIL}?subject=${encodeURIComponent(`[${topic}] from ${fullName}`)}&body=${body}`;
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          botcheck,
          subject: `[DecisionLab ${topic}] from ${fullName}`,
          from_name: fullName,
          email: email.trim(),
          phone: phone.trim() || undefined,
          message: composed,
        }),
      });
      const data = await res.json();
      if (data.success) setSent(true);
      else setError('Could not send your message. Please email us directly at ' + BUSINESS_EMAIL);
    } catch {
      setError('Could not send your message. Please email us directly at ' + BUSINESS_EMAIL);
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full bg-brand-card border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';
  const label = 'text-[11px] font-black text-brand-text-secondary uppercase tracking-widest mb-2 block';
  const sideTitle = 'text-sm font-black uppercase tracking-tight font-display mb-2';
  const sideText = 'text-xs text-brand-text-secondary font-medium leading-relaxed';

  if (sent) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Check size={36} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight font-display mb-4">Message Sent</h1>
          <p className="text-sm text-brand-text-secondary font-medium leading-relaxed">
            Thanks for reaching out — we read everything and will get back to you at{' '}
            <span className="text-brand-text-primary font-bold">{email}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] block mb-4">Get in touch</span>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight font-display mb-4">Contact Us</h1>
          <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
            For beta feedback, partnerships, investor inquiries, or any other request — fill in the form below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

          {/* ── Info sidebar ── */}
          <aside className="space-y-5 lg:sticky lg:top-28">
            <div className="bg-brand-section border border-brand-border rounded-[2rem] p-7">
              <h3 className={sideTitle + ' flex items-center gap-2'}><Mail size={14} className="text-brand-accent" /> General Enquiries</h3>
              <a href={`mailto:${BUSINESS_EMAIL}`} className="text-xs font-bold text-brand-accent hover:underline break-all">{BUSINESS_EMAIL}</a>
            </div>
            <div className="bg-brand-section border border-brand-border rounded-[2rem] p-7">
              <h3 className={sideTitle + ' flex items-center gap-2'}><LifeBuoy size={14} className="text-brand-accent" /> Support</h3>
                            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-xs font-bold text-brand-accent hover:underline break-all">{SUPPORT_EMAIL}</a>
            </div>
            <div className="bg-brand-section border border-brand-border rounded-[2rem] p-7">
              <h3 className={sideTitle + ' flex items-center gap-2'}><Handshake size={14} className="text-brand-accent" /> Partnerships & Investors</h3>
              <p className={sideText + ' mb-1'}>Collaborations and investment opportunities.</p>
              <a href={`mailto:${PARTNERS_EMAIL}`} className="text-xs font-bold text-brand-accent hover:underline break-all">{PARTNERS_EMAIL}</a>
            </div>
          </aside>

          {/* ── Form ── */}
          <form onSubmit={submit} className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10 space-y-5">
            {/* Honeypot — invisible to humans, bots fill it and get dropped */}
            <input type="text" value={botcheck} onChange={(e) => setBotcheck(e.target.value)}
              tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            <div>
              <label className={label}>Topic *</label>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} className={field + ' appearance-none'}>
                {TOPICS.map((t) => <option key={t} value={t} className="bg-[#102434]">{t}</option>)}
              </select>
            </div>

            <div>
              <label className={label}>Name *</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="" className={field} />
                  <span className="text-[10px] text-brand-text-muted font-medium mt-1 block pl-1">First</span>
                </div>
                <div>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="" className={field} />
                  <span className="text-[10px] text-brand-text-muted font-medium mt-1 block pl-1">Last</span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Email *</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={field} />
              </div>
              <div>
                <label className={label}>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+973 …" className={field} />
              </div>
            </div>

            <div>
              <label className={label}>Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                rows={7}
                placeholder="Tell us what's on your mind…"
                className={field}
              />
              <span className={`text-[10px] font-medium mt-1 block pl-1 ${message.length >= MAX_MESSAGE ? 'text-brand-coral' : 'text-brand-text-muted'}`}>
                {message.length} of {MAX_MESSAGE} max characters
              </span>
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[currentColor] text-brand-accent shrink-0" />
              <span className="text-xs text-brand-text-secondary font-medium leading-relaxed">
                I consent to DecisionLab processing my submitted information so they can respond to my query. *
              </span>
            </label>

            {error && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3">{error}</p>}

            <button type="submit" disabled={busy}
              className="w-full py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}