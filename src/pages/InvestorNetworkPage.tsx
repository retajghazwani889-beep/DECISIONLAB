import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { STARTUP_STAGES, INDUSTRIES } from '../constants';
import { cn } from '../lib/utils';
import {
  Building2,
  Globe,
  Linkedin,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Target,
  ShieldCheck,
  Search,
  Lock,
  Handshake,
  Mail,
  User as UserIcon,
  MapPin,
  Briefcase,
} from 'lucide-react';

interface InvestorNetworkPageProps {
  user: any;
  onOpenAccess: () => void;
}

// Normalize the shared constants into plain string labels, whether they are
// stored as strings or as { label }/{ value } objects.
const toLabels = (arr: any[]): string[] =>
  (arr || []).map((s) => (typeof s === 'string' ? s : s?.label ?? s?.value ?? String(s)));

// Pull the bare domain out of a website URL: https://www.NorthStar.vc/about -> northstar.vc
const domainOfWebsite = (url: string): string => {
  let u = (url || '').trim().toLowerCase();
  u = u.replace(/^https?:\/\//, '').replace(/^www\./, '');
  return u.split('/')[0].split('?')[0].trim();
};
const domainOfEmail = (email: string): string =>
  ((email || '').split('@')[1] || '').trim().toLowerCase();

const normalizeUrl = (raw: string) => {
  const t = (raw || '').trim();
  if (!t) return '';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

export default function InvestorNetworkPage({ user, onOpenAccess }: InvestorNetworkPageProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const stageOptions = toLabels(STARTUP_STAGES as any[]);
  const nicheOptions = toLabels(INDUSTRIES as any[]);

  // ----- Matched-startups browse (for approved investors) -------------------
  const isApprovedInvestor = (profile as any)?.accountType === 'investor';
  const invStages: string[] = ((profile as any)?.investorStages || []).map((s: string) =>
    (s || '').toLowerCase().replace(/\./g, '').trim()
  );
  const invNiches: string[] = ((profile as any)?.investorNiches || []).map((s: string) =>
    (s || '').toLowerCase().trim()
  );
  const [reapplying, setReapplying] = useState(false);
  const [justApproved, setJustApproved] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchError, setMatchError] = useState('');

  // Stage/niche focus picks (shared by the application form and the browse view).
  const [stages, setStages] = useState<string[]>([]);
  const [niches, setNiches] = useState<string[]>([]);

  // Show the matched-startups dashboard when the saved profile says investor,
  // OR immediately after a fresh approval (before the profile reloads).
  const approvedView = isApprovedInvestor || justApproved;

  useEffect(() => {
    if (!approvedView || !user) return;
    let cancelled = false;
    // Use the saved profile focus if present, otherwise the picks just submitted.
    const effStages = isApprovedInvestor
      ? invStages
      : stages.map((s) => (s || '').toLowerCase().replace(/\./g, '').trim());
    const effNiches = isApprovedInvestor ? invNiches : niches.map((s) => (s || '').toLowerCase().trim());
    (async () => {
      setLoadingMatches(true);
      setMatchError('');
      try {
        const snap = await getDocs(
          query(collection(db, 'analyses'), where('sharedWithInvestors', '==', true))
        );
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        const filtered = rows.filter((r) => {
          const score = Number(r.shareScore ?? 0);
          if (score < 80) return false;
          const stage = (r.shareStage || r.startupProfile?.stage || '')
            .toString()
            .toLowerCase()
            .replace(/\./g, '')
            .trim();
          const stageOk =
            effStages.length === 0 || !stage || effStages.some((s) => s === stage || s.includes(stage) || stage.includes(s));
          const industry = (r.startupProfile?.industry || r.industry || '').toString().toLowerCase().trim();
          const nicheOk =
            effNiches.length === 0 || !industry || effNiches.some((n) => industry.includes(n) || n.includes(industry));
          return stageOk && nicheOk;
        });
        if (!cancelled) setMatches(filtered);
      } catch (err) {
        console.warn('Matched startups query failed:', err);
        if (!cancelled) setMatchError('matches_blocked');
      } finally {
        if (!cancelled) setLoadingMatches(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [approvedView, isApprovedInvestor, user, justApproved]);

  // 'choose' lets them pick the path; then 'organization' or 'individual'
  const [tier, setTier] = useState<'choose' | 'organization' | 'individual'>('choose');

  // Organization fields
  const [firm, setFirm] = useState('');
  const [website, setWebsite] = useState('');
  const [workEmail, setWorkEmail] = useState('');

  // Individual fields
  const [fullName, setFullName] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [country, setCountry] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedBadge, setSubmittedBadge] = useState('');
  const [error, setError] = useState('');

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const saveApproved = async (record: any, badge: string, investorTier: string) => {
    await addDoc(collection(db, 'investorApplications'), {
      ...record,
      uid: user?.uid || null,
      investorTier,
      badge,
      status: 'approved',
      createdAt: serverTimestamp(),
    });
    if (user?.uid) {
      await setDoc(
        doc(db, 'profiles', user.uid),
        {
          accountType: 'investor',
          investorTier,
          investorBadge: badge,
          investorStatus: 'approved',
          investorStages: stages,
          investorNiches: niches,
          investorApprovedAt: serverTimestamp(),
          ...record,
        },
        { merge: true }
      );
    }
  };

  const handleSubmitOrganization = async () => {
    setError('');
    const site = normalizeUrl(website);
    const siteDomain = domainOfWebsite(site);
    const mailDomain = domainOfEmail(workEmail);

    if (!firm.trim()) return setError('Enter your firm or fund name.');
    if (!siteDomain || !/\.[a-z]{2,}/i.test(siteDomain)) return setError('Enter a valid company website (e.g. https://yourfund.com).');
    if (!mailDomain) return setError('Enter your work email (e.g. you@yourfund.com).');
    if (mailDomain !== siteDomain)
      return setError(`Your work email must be at your company domain — "${mailDomain || 'your email'}" needs to match "${siteDomain}".`);
    if (stages.length === 0) return setError('Pick at least one stage you invest in.');
    if (niches.length === 0) return setError('Pick at least one niche you invest in.');

    setSubmitting(true);
    try {
      // NOTE: email-ownership verification (the click-the-link step) is wired in a
      // later step once the email service is set up. For now the automatic check
      // is the domain match, so we badge this honestly as "Organization".
      const badge = 'Organization';
      await saveApproved(
        {
          email: workEmail.trim().toLowerCase(),
          name: user?.displayName || profile?.fullName || null,
          firm: firm.trim(),
          website: site,
          workEmail: workEmail.trim().toLowerCase(),
        },
        badge,
        'organization'
      );
      setSubmittedBadge(badge);
      setJustApproved(true);
      setReapplying(false);
    } catch (err) {
      console.error('Organization application failed:', err);
      setError('Something went wrong saving your application. Please try again.');
    }
    setSubmitting(false);
  };

  const handleSubmitIndividual = async () => {
    setError('');
    const li = normalizeUrl(linkedin);

    if (!fullName.trim()) return setError('Enter your full name.');
    if (!/linkedin\.com/i.test(li)) return setError('Enter a valid LinkedIn URL (must include linkedin.com).');
    if (!personalEmail.includes('@')) return setError('Enter a valid email.');
    if (!country.trim()) return setError('Enter your country.');
    if (stages.length === 0) return setError('Pick at least one stage you invest in.');
    if (niches.length === 0) return setError('Pick at least one niche you invest in.');

    setSubmitting(true);
    try {
      const badge = 'Individual Investor';
      await saveApproved(
        {
          email: personalEmail.trim().toLowerCase(),
          name: fullName.trim(),
          linkedin: li,
          country: country.trim(),
          portfolio: portfolio.trim() || null,
        },
        badge,
        'individual'
      );
      setSubmittedBadge(badge);
      setJustApproved(true);
      setReapplying(false);
    } catch (err) {
      console.error('Individual application failed:', err);
      setError('Something went wrong saving your application. Please try again.');
    }
    setSubmitting(false);
  };

  const chip = (value: string, list: string[], setList: (v: string[]) => void) => (
    <button
      key={value}
      type="button"
      onClick={() => toggle(list, setList, value)}
      className={cn(
        'px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all active:scale-95',
        list.includes(value)
          ? 'bg-brand-accent text-brand-bg border-brand-accent'
          : 'bg-brand-card text-brand-text-secondary border-white/5 hover:text-white'
      )}
    >
      {value}
    </button>
  );

  const fieldClass =
    'w-full bg-brand-card border border-white/5 rounded-2xl px-5 py-4 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';
  const labelClass =
    'text-[11px] font-black text-brand-text-secondary uppercase tracking-widest flex items-center gap-2 mb-2';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-brand-border">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-accent/5 blur-[160px] rounded-full pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 sm:px-10 py-20 sm:py-28 text-center">
          <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
            <Handshake size={30} />
          </div>
          <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] block mb-5">
            Investor Network
          </span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight font-display leading-[0.95] mb-6">
            Discover Founders<br />Ready to Raise
          </h1>
          <p className="text-base sm:text-lg text-brand-text-secondary font-medium max-w-2xl mx-auto leading-relaxed">
            Investors get matched to high-scoring startups whose founders chose to share — filtered to the exact stages and niches you invest in
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 py-16">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: ShieldCheck, title: 'Register your profile', body: 'Join as a verified organization or an individual investor — each gets its own badge.' },
            { icon: Target, title: 'Set your focus', body: 'Choose the stages and niches you invest in, so you only see relevant founders.' },
            { icon: Search, title: 'See matched startups', body: 'Browse reports from founders who opted in and scored 80% or higher.' },
          ].map((step, i) => (
            <div key={i} className="bg-brand-section border border-brand-border rounded-[2rem] p-7">
              <div className="w-11 h-11 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent mb-5">
                <step.icon size={20} />
              </div>
              <h3 className="text-sm font-black text-brand-text-primary uppercase tracking-tight mb-2">{step.title}</h3>
              <p className="text-xs text-brand-text-secondary font-medium leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Apply */}
      <section className="max-w-3xl mx-auto px-6 sm:px-10 pb-28">
        <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10 shadow-huge">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-3">You're approved</h2>
              <span className="inline-block mb-4 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-black uppercase tracking-widest">
                {submittedBadge}
              </span>
              <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
                Welcome to the Investor Network. Your matched startups — founders who opted in, scored 80% or higher, and fit your stages and niches — will appear here. The browse list is being set up next.
              </p>
            </div>
          ) : approvedView && !reapplying ? (
            <>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display">Matched startups</h2>
                  <p className="text-xs text-brand-text-secondary font-medium mt-2 leading-relaxed">
                    Founders who opted in, scored 80% or higher, and fit your stages and niches.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {((profile as any)?.investorBadge || submittedBadge) && (
                    <span className="px-3 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-black uppercase tracking-widest">
                      {(profile as any)?.investorBadge || submittedBadge}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setStages(((profile as any)?.investorStages || []) as string[]);
                      setNiches(((profile as any)?.investorNiches || []) as string[]);
                      setError('');
                      setTier((profile as any)?.investorTier === 'organization' ? 'organization' : 'individual');
                      setReapplying(true);
                    }}
                    className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Change focus
                  </button>
                </div>
              </div>

              {loadingMatches ? (
                <div className="py-16 flex flex-col items-center gap-4">
                  <Loader2 size={24} className="animate-spin text-brand-accent" />
                  <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.3em]">Finding matches</p>
                </div>
              ) : matchError ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Lock size={24} />
                  </div>
                  <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
                    Matched startups will appear here once investor access is enabled in the database settings.
                  </p>
                </div>
              ) : matches.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-brand-card border border-white/5 flex items-center justify-center text-brand-text-muted">
                    <Search size={24} />
                  </div>
                  <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
                    No matches yet. As founders in your stages and niches choose to share, they'll show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((m) => {
                    const name = (m.startupProfile?.companyName || m.ideaDescription || 'Startup').toString().replace(/\./g, '');
                    const industry = (m.startupProfile?.industry || m.industry || '').toString().replace(/\./g, '');
                    const stage = (m.shareStage || m.startupProfile?.stage || '').toString().replace(/\./g, '');
                    const score = Number(m.shareScore ?? 0);
                    // Founder is the analysis owner. We show the contact they opted to share.
                    // Falls back to the current profile when you're viewing your own startup.
                    const founderName =
                      m.shareFounderName || (m.userId === user?.uid ? (profile?.fullName || user?.displayName || '') : '');
                    const founderEmail =
                      m.shareFounderEmail || (m.userId === user?.uid ? ((profile as any)?.email || user?.email || '') : '');
                    const requestDeck = () => {
                      const subject = encodeURIComponent(`Pitch deck request — ${name}`);
                      const body = encodeURIComponent(
                        `Hi${founderName ? ' ' + founderName : ''},\n\nI'm an investor on DecisionLab and I'd love to see the pitch deck for ${name}. Could you share it when you get a chance?\n\nThank you!`
                      );
                      window.location.href = `mailto:${founderEmail}?subject=${subject}&body=${body}`;
                    };
                    return (
                      <div
                        key={m.id}
                        className="p-6 bg-brand-card border border-white/5 rounded-[1.75rem] hover:border-brand-accent/40 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="text-base font-black text-brand-text-primary uppercase tracking-tight truncate">{name}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {industry && (
                                <span className="text-[9px] font-black uppercase text-brand-accent tracking-widest bg-brand-accent/5 px-2.5 py-1 rounded-lg border border-brand-accent/10">
                                  {industry}
                                </span>
                              )}
                              {stage && (
                                <span className="text-[9px] font-black uppercase text-[#5da9ff] tracking-widest bg-[#5da9ff]/5 px-2.5 py-1 rounded-lg border border-[#5da9ff]/10">
                                  {stage}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xl font-black text-emerald-400 leading-none">{score}%</div>
                            <div className="text-[8px] font-black text-brand-text-muted uppercase tracking-widest mt-1">Score</div>
                          </div>
                        </div>

                        {/* Founder contact — they opted in to be shown to investors */}
                        <div className="mt-5 pt-5 border-t border-white/5">
                          <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mb-2">Founder</div>
                          {founderEmail ? (
                            <div className="flex items-center gap-2 text-sm text-brand-text-secondary font-medium">
                              {founderName && <span className="text-brand-text-primary font-bold">{founderName}</span>}
                              <a href={`mailto:${founderEmail}`} className="inline-flex items-center gap-1.5 text-brand-accent hover:underline">
                                <Mail size={13} /> {founderEmail}
                              </a>
                            </div>
                          ) : (
                            <p className="text-xs text-brand-text-muted font-medium">
                              Contact will appear once the founder shares it.
                            </p>
                          )}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => navigate(`/dashboard/startup/${m.id}/overview`)}
                            className="px-5 py-3 bg-brand-card border border-white/10 text-brand-text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center gap-2"
                          >
                            View report <ArrowRight size={13} />
                          </button>
                          <button
                            onClick={requestDeck}
                            disabled={!founderEmail}
                            className="px-5 py-3 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:hover:scale-100"
                          >
                            <Briefcase size={13} /> Request pitch deck
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : !user ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                <Lock size={26} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-3">Sign in to apply</h2>
              <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed mb-8">
                Log in with Google or email first, then register as an investor.
              </p>
              <button
                onClick={onOpenAccess}
                className="inline-flex items-center gap-3 px-10 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-huge shadow-brand-accent/20"
              >
                <Lock className="w-4 h-4" />
                Sign in
              </button>
            </div>
          ) : tier === 'choose' ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display mb-2">Register as an investor</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-8 leading-relaxed">
                Choose how you invest. Founders are only ever shown if they chose to share.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => { setError(''); setTier('organization'); }}
                  className="text-left p-7 rounded-[2rem] bg-brand-card border border-white/5 hover:border-brand-accent/40 transition-all active:scale-[0.99] group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent mb-5">
                    <Building2 size={22} />
                  </div>
                  <h3 className="text-sm font-black text-brand-text-primary uppercase tracking-tight mb-2">Verified Organization</h3>
                  <p className="text-xs text-brand-text-secondary font-medium leading-relaxed">
                    VC firm, accelerator, or fund with a company website and work email. Automatically checked by domain match.
                  </p>
                </button>
                <button
                  onClick={() => { setError(''); setTier('individual'); }}
                  className="text-left p-7 rounded-[2rem] bg-brand-card border border-white/5 hover:border-brand-accent/40 transition-all active:scale-[0.99] group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent mb-5">
                    <UserIcon size={22} />
                  </div>
                  <h3 className="text-sm font-black text-brand-text-primary uppercase tracking-tight mb-2">Individual Investor</h3>
                  <p className="text-xs text-brand-text-secondary font-medium leading-relaxed">
                    Angel investor without a company domain. Register with your name, LinkedIn, and investment focus.
                  </p>
                </button>
              </div>
            </>
          ) : tier === 'organization' ? (
            <>
              <button onClick={() => { setError(''); setReapplying(false); setTier('choose'); }} className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest mb-5 hover:text-white transition-colors">
                ← Back
              </button>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display mb-2">Verified Organization</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-8 leading-relaxed">
                Your work email must be at your company's domain (e.g. you@yourfund.com for yourfund.com). DecisionLab checks this automatically.
              </p>
              <div className="space-y-6">
                <div>
                  <label className={labelClass}><Building2 size={14} className="text-brand-accent" /> Firm / Fund name</label>
                  <input value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="e.g. Northstar Ventures" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}><Globe size={14} className="text-brand-accent" /> Company website</label>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourfund.com" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}><Mail size={14} className="text-brand-accent" /> Work email (must match the website)</label>
                  <input value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} placeholder="you@yourfund.com" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}><Target size={14} className="text-brand-accent" /> Stages you invest in</label>
                  <div className="flex flex-wrap gap-2">{stageOptions.map((s) => chip(s, stages, setStages))}</div>
                </div>
                <div>
                  <label className={labelClass}><Search size={14} className="text-brand-accent" /> Niches you invest in</label>
                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">{nicheOptions.map((n) => chip(n, niches, setNiches))}</div>
                </div>
                {error && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3">{error}</p>}
                <button onClick={handleSubmitOrganization} disabled={submitting} className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-huge shadow-brand-accent/20 disabled:opacity-50 disabled:hover:scale-100">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Submit
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => { setError(''); setReapplying(false); setTier('choose'); }} className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest mb-5 hover:text-white transition-colors">
                ← Back
              </button>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display mb-2">Individual Investor</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-8 leading-relaxed">
                For angels without a company domain. You'll get an Individual Investor badge so founders know how you registered.
              </p>
              <div className="space-y-6">
                <div>
                  <label className={labelClass}><UserIcon size={14} className="text-brand-accent" /> Full name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}><Linkedin size={14} className="text-brand-accent" /> LinkedIn profile</label>
                  <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/yourname" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}><Mail size={14} className="text-brand-accent" /> Email</label>
                  <input value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} placeholder="you@email.com" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}><MapPin size={14} className="text-brand-accent" /> Country</label>
                  <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Bahrain" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}><Briefcase size={14} className="text-brand-accent" /> Portfolio / notable investments (optional)</label>
                  <input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="e.g. earlier investments, a link, or leave blank" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}><Target size={14} className="text-brand-accent" /> Stages you invest in</label>
                  <div className="flex flex-wrap gap-2">{stageOptions.map((s) => chip(s, stages, setStages))}</div>
                </div>
                <div>
                  <label className={labelClass}><Search size={14} className="text-brand-accent" /> Niches you invest in</label>
                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">{nicheOptions.map((n) => chip(n, niches, setNiches))}</div>
                </div>
                {error && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3">{error}</p>}
                <button onClick={handleSubmitIndividual} disabled={submitting} className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-huge shadow-brand-accent/20 disabled:opacity-50 disabled:hover:scale-100">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Submit
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}