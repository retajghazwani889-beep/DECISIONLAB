import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import {
  Sparkles, Inbox, Bookmark, User as UserIcon, CreditCard, Loader2, ArrowRight,
  FileText, Presentation, Mail, Trash2, Check, MapPin, TrendingUp, Search,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// InvestorMatchesPage — the investor dashboard.
// Tabs: Recommended · Submissions · Saved · Profile · Billing
//  · Recommended: shared startups ranked by the investor's preferences
//  · Submissions: startups founders officially submitted, with a DYNAMIC
//    pitch-deck button (green "View Pitch Deck" when available, grey
//    "Pitch Deck Not Submitted Yet" when not)
//  · Saved: bookmarks · Profile: preferences · Billing: plan
// ─────────────────────────────────────────────────────────────────────────────

interface InvestorMatchesPageProps {
  user: any;
}

type Tab = 'recommended' | 'submissions' | 'saved' | 'profile' | 'billing';

const NAV: { id: Tab; label: string; icon: any }[] = [
  { id: 'recommended', label: 'Recommended', icon: Sparkles },
  { id: 'submissions', label: 'Submissions', icon: Inbox },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

const PREF_INDUSTRIES = ['Fintech', 'HealthTech', 'SaaS', 'E-Commerce', 'EdTech', 'Cybersecurity', 'ClimateTech', 'Logistics', 'AI', 'Marketplace'];
const PREF_STAGES = ['Idea Stage', 'Research Phase', 'Prototype', 'MVP', 'Beta Launch', 'Early Traction', 'Revenue Generating', 'Seed Stage', 'Growth Stage', 'Scaling', 'Series A Ready', 'Established Business'];

// Best-effort extraction across analysis shapes.
const scoreOf = (a: any): number | null => {
  const v = Number(a.shareScore ?? a.overallScore ?? a.scores?.overall ?? a.readinessScore ?? NaN);
  return !isNaN(v) && v > 0 ? Math.round(v) : null;
};
const nameOf = (a: any) => a.projectName || a.startupProfile?.companyName || a.ideaDescription?.slice(0, 40) || 'Startup';
const industryOf = (a: any) => a.industry || a.startupProfile?.industry || a.startupProfile?.businessType || null;
const stageOf = (a: any) => a.stage || a.startupProfile?.businessStage || a.startupProfile?.stage || null;
const founderOf = (a: any) => a.founderName || a.startupProfile?.founderName || a.userDisplayName || 'Founder';
const founderEmailOf = (a: any) => a.founderEmail || a.contactEmail || a.userEmail || a.startupProfile?.email || null;
// The founder's deck lives ON the analysis as slides (pitchDeckData/pitchReadiness) —
// same source the submissions viewer uses. URL links are a fallback.
const deckSlidesOf = (a: any): any[] => a.pitchDeckData?.slides || a.pitchReadiness?.slides || [];
const deckLinkOf = (a: any) => a.pitchDeckUrl || a.pitchDeckLink || a.briefingLink || a.startupProfile?.briefingLink || null;
const dateOf = (a: any) => {
  const d = a.submittedAt?.toDate?.() || a.updatedAt?.toDate?.() || a.createdAt?.toDate?.();
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
};

export default function InvestorMatchesPage({ user }: InvestorMatchesPageProps) {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const p: any = profile || {};
  const isInvestor = p.accountType === 'investor';

  const [tab, setTab] = useState<Tab>('recommended');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Route protection: investor accounts only.
  useEffect(() => {
    if (user === undefined) return;
    if (!user) { navigate('/investor-network'); return; }
    if (profile === undefined || profile === null) return;
    // Only eject once the REAL profile has loaded — avoids bouncing brand-new
    // investors during the moment a temporary default profile exists.
    const t = (profile as any).accountType;
    if ((profile as any).onboardingCompleted && t && t !== 'investor') navigate('/');
  }, [user, profile, isInvestor, navigate]);

  // Load every startup visible to investors.
  useEffect(() => {
    if (!user || !isInvestor) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [sharedSnap, submittedSnap] = await Promise.all([
          getDocs(query(collection(db, 'analyses'), where('sharedWithInvestors', '==', true))).catch(() => ({ docs: [] as any[] })),
          getDocs(query(collection(db, 'analyses'), where('submittedToInvestors', '==', true))).catch(() => ({ docs: [] as any[] })),
        ]);
        if (cancelled) return;
        const map: Record<string, any> = {};
        [...sharedSnap.docs, ...submittedSnap.docs].forEach((d: any) => {
          map[d.id] = { id: d.id, ...(d.data() as any) };
        });
        setRows(Object.values(map));
      } catch (e) { console.warn('Investor data load failed:', e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user, isInvestor]);

  // ── Saved startups (on the investor's profile) ──
  const [savedIds, setSavedIds] = useState<string[]>(p.savedStartupIds || []);
  useEffect(() => {
    const fromProfile = p.savedStartupIds || [];
    if (fromProfile.length && savedIds.length === 0) setSavedIds(fromProfile);
  }, [profile]);
  const toggleSave = async (id: string) => {
    const next = savedIds.includes(id) ? savedIds.filter((x) => x !== id) : [...savedIds, id];
    setSavedIds(next);
    try { await setDoc(doc(db, 'profiles', user.uid), { savedStartupIds: next }, { merge: true }); }
    catch (e) { console.warn('Save failed:', e); }
  };

  // ── Preferences (Profile tab) ──
  const [prefIndustries, setPrefIndustries] = useState<string[]>(p.prefIndustries || p.investmentFocus || []);
  const [prefStages, setPrefStages] = useState<string[]>(p.prefStages || p.investmentStages || []);
  const [prefCountries, setPrefCountries] = useState((p.prefCountries || []).join?.(', ') || '');
  const [pfCompany, setPfCompany] = useState(p.company || '');
  const [pfLinkedin, setPfLinkedin] = useState(p.pfLinkedin || '');
  const [pfWebsite, setPfWebsite] = useState(p.pfWebsite || '');
  const [pfBio, setPfBio] = useState(p.pfBio || '');
  const [prefBusy, setPrefBusy] = useState(false);
  const [prefNotice, setPrefNotice] = useState('');

  const savePrefs = async () => {
    setPrefBusy(true); setPrefNotice('');
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        prefIndustries, prefStages,
        prefCountries: prefCountries.split(',').map((s: string) => s.trim()).filter(Boolean),
        company: pfCompany.trim() || null,
        pfLinkedin: pfLinkedin.trim() || null,
        pfWebsite: pfWebsite.trim() || null,
        pfBio: pfBio.trim() || null,
      }, { merge: true });
      await refreshProfile();
      setPrefNotice('Saved. Recommendations now use these preferences.');
    } catch (e) { console.warn(e); }
    finally { setPrefBusy(false); }
  };

  // ── Recommendation ranking: preference matches float to the top ──
  const prefScore = (a: any) => {
    let s = 0;
    const ind = (industryOf(a) || '').toLowerCase();
    const stg = (stageOf(a) || '').toLowerCase();
    if (prefIndustries.some((x) => ind.includes(x.toLowerCase()))) s += 2;
    if (prefStages.some((x) => stg.includes(x.toLowerCase()))) s += 1;
    return s;
  };

  const q = search.trim().toLowerCase();
  const matchesSearch = (a: any) =>
    !q || [nameOf(a), industryOf(a), stageOf(a), founderOf(a)].join(' ').toLowerCase().includes(q);

  const recommended = rows.filter(matchesSearch).sort((a, b) => (prefScore(b) - prefScore(a)) || ((scoreOf(b) || 0) - (scoreOf(a) || 0)));
  const submissions = rows.filter((a) => a.submittedToInvestors === true).filter(matchesSearch);
  const savedRows = rows.filter((a) => savedIds.includes(a.id));

  const contactFounder = async (a: any) => {
    let email = founderEmailOf(a);
    // Fall back to the founder's profile email when the analysis lacks one.
    if (!email && a.userId) {
      try {
        const snap = await getDoc(doc(db, 'profiles', a.userId));
        if (snap.exists()) email = (snap.data() as any)?.email || null;
      } catch { /* profile may be private */ }
    }
    const subject = encodeURIComponent(`Interested in ${nameOf(a)} — via DecisionLab`);
    const body = encodeURIComponent(
      `Hi ${founderOf(a)},\n\nI reviewed ${nameOf(a)} on DecisionLab and I'm interested in learning more.\n\nCould we set up a time to talk?\n\nBest regards,\n${p.displayName || 'Investor'}${p.company ? '\n' + p.company : ''}`
    );
    if (email) {
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    } else {
      alert('This founder has not shared a contact email yet.');
    }
  };

  // ── Card ──
  const card = (a: any, ctx: 'recommended' | 'submissions' | 'saved') => {
    const score = scoreOf(a);
    const deckSlides = deckSlidesOf(a);
    const deckLink = deckLinkOf(a);
    const saved = savedIds.includes(a.id);
    return (
      <div key={a.id} className="bg-brand-section border border-brand-border rounded-[2rem] p-7 hover:border-brand-accent/40 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-black uppercase tracking-tight truncate">{nameOf(a)}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {score !== null && <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">{score}% Score</span>}
              {industryOf(a) && <span className="text-[9px] font-black uppercase text-brand-accent tracking-widest bg-brand-accent/5 px-2.5 py-1 rounded-lg border border-brand-accent/10 truncate max-w-[130px]">{industryOf(a)}</span>}
              {stageOf(a) && <span className="text-[9px] font-black uppercase text-[#5da9ff] tracking-widest bg-[#5da9ff]/5 px-2.5 py-1 rounded-lg border border-[#5da9ff]/10 truncate max-w-[130px]">{stageOf(a)}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
              <span className="flex items-center gap-1.5"><UserIcon size={11} /> {founderOf(a)}</span>
              {ctx === 'submissions' && dateOf(a) && <span>Submitted {dateOf(a)}</span>}
            </div>
          </div>
          <button
            onClick={() => toggleSave(a.id)}
            title={saved ? 'Remove from saved' : 'Save startup'}
            className={`shrink-0 p-2.5 rounded-xl border transition-all active:scale-95 ${saved ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30' : 'bg-brand-card text-brand-text-muted border-white/10 hover:text-white'}`}
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-white/5">
          <button onClick={() => navigate(`/dashboard/startup/${a.id}/overview`)} className="px-5 py-3 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            <FileText size={13} /> View Report
          </button>

          {ctx === 'submissions' && (
            deckSlides.length > 0 ? (
              <button onClick={() => navigate('/investor-submissions')} className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center gap-2">
                <Presentation size={13} /> View Pitch Deck — {deckSlides.length} Slides
              </button>
            ) : deckLink ? (
              <a href={deckLink} target="_blank" rel="noreferrer" className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center gap-2">
                <Presentation size={13} /> View Pitch Deck
              </a>
            ) : (
              <span className="px-5 py-3 bg-brand-card border border-white/5 text-brand-text-muted text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 cursor-not-allowed opacity-70">
                <Presentation size={13} /> Pitch Deck Not Submitted Yet
              </span>
            )
          )}

          {ctx === 'submissions' && (
            <button onClick={() => contactFounder(a)} className="px-5 py-3 bg-brand-card border border-white/10 text-brand-text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center gap-2">
              <Mail size={13} /> Contact Founder
            </button>
          )}

          {ctx === 'saved' && (
            <button onClick={() => toggleSave(a.id)} className="ml-auto text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-coral transition-colors flex items-center gap-1.5">
              <Trash2 size={12} /> Remove
            </button>
          )}
        </div>
      </div>
    );
  };

  const emptyState = (title: string, sub: string) => (
    <div className="py-20 text-center bg-brand-section/30 rounded-[3rem] border border-dashed border-white/5 px-8">
      <TrendingUp size={36} strokeWidth={1} className="mx-auto text-brand-accent mb-5" />
      <h3 className="text-lg font-black uppercase tracking-tight font-display mb-2">{title}</h3>
      <p className="text-sm text-brand-text-secondary font-medium max-w-sm mx-auto">{sub}</p>
    </div>
  );

  const field = 'w-full bg-brand-card border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';
  const label = 'text-[11px] font-black text-brand-text-secondary uppercase tracking-widest mb-2 block';
  const chip = (active: boolean) => `px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 ${active ? 'bg-brand-accent text-brand-bg border-brand-accent' : 'bg-brand-card text-brand-text-secondary border-white/5 hover:text-white'}`;

  if (!user || !isInvestor) {
    return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>;
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 h-max">
          <div className="bg-brand-section border border-brand-border rounded-[2rem] p-3">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              return (
                <button key={n.id} onClick={() => setTab(n.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20' : 'text-brand-text-secondary hover:text-white border border-transparent'}`}>
                  <Icon size={17} /> {n.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content */}
        <main>
          {(tab === 'recommended' || tab === 'submissions' || tab === 'saved') && (
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by startup, industry, stage, or founder…" className={field + ' pl-11'} />
            </div>
          )}

          {/* ── Recommended ── */}
          {tab === 'recommended' && (
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Recommended</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-6">
                Startups matching your preferences rank first{prefIndustries.length === 0 ? ' — set your preferences in the Profile tab for sharper matches' : ''}.
              </p>
              {loading ? <div className="py-16 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>
                : recommended.length === 0 ? emptyState('No startups yet', 'When founders share startups with the investor network, they appear here.')
                : <div className="space-y-4">{recommended.map((a) => card(a, 'recommended'))}</div>}
            </div>
          )}

          {/* ── Submissions ── */}
          {tab === 'submissions' && (
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Submissions</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-6">Startups founders officially submitted to investors.</p>
              {loading ? <div className="py-16 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>
                : submissions.length === 0 ? emptyState('No submissions yet', 'Official founder submissions will appear here with their reports and pitch decks.')
                : <div className="space-y-4">{submissions.map((a) => card(a, 'submissions'))}</div>}
            </div>
          )}

          {/* ── Saved ── */}
          {tab === 'saved' && (
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Saved</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-6">Your bookmarked startups.</p>
              {loading ? <div className="py-16 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>
                : savedRows.length === 0 ? emptyState('Nothing saved yet', 'Tap the bookmark on any startup to keep it here.')
                : <div className="space-y-4">{savedRows.map((a) => card(a, 'saved'))}</div>}
            </div>
          )}

          {/* ── Profile ── */}
          {tab === 'profile' && (
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Profile</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-6">
                Your investment preferences shape your recommendations. Personal details live on your{' '}
                <button onClick={() => navigate('/profile')} className="text-brand-accent font-black hover:underline">Personal Profile</button>.
              </p>
              <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className={label}>Company / Firm</label><input value={pfCompany} onChange={(e) => setPfCompany(e.target.value)} className={field} /></div>
                  <div><label className={label}>LinkedIn</label><input value={pfLinkedin} onChange={(e) => setPfLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" className={field} /></div>
                  <div><label className={label}>Website</label><input value={pfWebsite} onChange={(e) => setPfWebsite(e.target.value)} placeholder="https://…" className={field} /></div>
                  <div><label className={label}>Email</label><div className="text-sm font-medium text-brand-text-secondary pt-3">{p.email || user?.email}</div></div>
                </div>
                <div><label className={label}>Bio</label><textarea value={pfBio} onChange={(e) => setPfBio(e.target.value)} rows={3} className={field} placeholder="Who you are and what you invest in…" /></div>
                <div>
                  <label className={label}>Industries You Invest In</label>
                  <div className="flex flex-wrap gap-2">
                    {PREF_INDUSTRIES.map((i) => (
                      <button key={i} onClick={() => setPrefIndustries((arr) => arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i])} className={chip(prefIndustries.includes(i))}>{i}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={label}>Startup Stages</label>
                  <div className="flex flex-wrap gap-2">
                    {PREF_STAGES.map((s) => (
                      <button key={s} onClick={() => setPrefStages((arr) => arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s])} className={chip(prefStages.includes(s))}>{s}</button>
                    ))}
                  </div>
                </div>
                <div><label className={label}>Countries (comma separated)</label><input value={prefCountries} onChange={(e) => setPrefCountries(e.target.value)} placeholder="e.g. Bahrain, UAE, Saudi Arabia" className={field} /></div>
                {prefNotice && <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">{prefNotice}</p>}
                <button onClick={savePrefs} disabled={prefBusy} className="w-full py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {prefBusy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* ── Billing ── */}
          {tab === 'billing' && (
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Billing</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-6">Your plan, payment method, and history.</p>
              <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <div className="text-xl font-black uppercase tracking-tight font-display">
                    {p.subscriptionStatus === 'investor_pro' ? 'Investor Pro — $199/mo' : 'Free Investor Account'}
                  </div>
                  <p className="text-xs text-brand-text-muted font-medium mt-1">Full billing details, usage, and management live on your billing page.</p>
                </div>
                <button onClick={() => navigate('/billing')} className="shrink-0 px-6 py-3.5 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                  <CreditCard size={13} /> Open Billing <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}