import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  CreditCard, Zap, ArrowRight, Loader2, Rocket, BarChart3, Presentation,
  FileText, Users, Handshake, XCircle, Receipt,
} from 'lucide-react';

const WELCOME_INFO: Record<string, { title: string; subtitle: string; perks: string[] }> = {
  founder: {
    title: 'Welcome to Startup Validation',
    subtitle: 'Your subscription is now active.',
    perks: ['Unlimited Ideas', 'Market & Competitor Analysis', 'Revenue & SWOT', 'Risk Analysis', 'Growth Roadmap'],
  },
  growth: {
    title: 'Welcome to Startup Grow',
    subtitle: 'Your subscription is now active.',
    perks: ['Everything in Validation', 'Team Building', 'Pitch Decks', 'Executive Reports', 'Compare Startups', 'Growth Opportunities', 'Priority Support'],
  },
  investor_pro: {
    title: 'Welcome to Investor Pro',
    subtitle: 'Your subscription is now active.',
    perks: ['Browse Startups', 'Startup Reports', 'Pitch Decks', 'Founder Contacts', 'Track Startups', 'Investor Dashboard'],
  },
};

function WelcomeModal({ tier, onClose }: { tier: string; onClose: () => void }) {
  const info = WELCOME_INFO[tier];
  if (!info) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-brand-section border border-emerald-500/30 rounded-3xl p-8 shadow-2xl shadow-emerald-500/10 text-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Animated checkmark */}
        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 14l6 6L23 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <p className="text-3xl mb-2">🎉</p>
        <h2 className="text-xl font-black uppercase tracking-tight text-brand-text-primary font-display mb-1">{info.title}</h2>
        <p className="text-sm font-medium text-emerald-400 mb-6">{info.subtitle}</p>

        <ul className="space-y-2 mb-8 text-left">
          {info.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-3 text-sm font-medium text-neutral-300">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l2 2L6.5 2" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {perk}
            </li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="w-full py-4 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
        >
          Start Using {info.title.replace('Welcome to ', '')}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BillingPage — current plan, live usage pulled from real data, and
// subscription management.
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_INFO: Record<string, { name: string; price: string }> = {
  free: { name: 'Startup at a Glance', price: '$0/month' },
  founder: { name: 'Startup Validation', price: '$39/month' },
  growth: { name: 'Startup Grow', price: '$99/month' },
  investor_pro: { name: 'Investor Pro', price: '$199/month' },
};

export default function BillingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const p: any = profile || {};

  const [waitingForTier, setWaitingForTier] = useState(false);
  const [confirmedTier, setConfirmedTier] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const waitingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always sync profile from server on mount so navbar + billing show the same tier.
  useEffect(() => { refreshProfile().catch(() => {}); }, []);

  // Scenario 6 & 37: Multi-tab sync — when another tab confirms a tier change,
  // refresh this tab automatically so all tabs show the correct plan.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tier_confirmed') refreshProfile().catch(() => {});
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const confirmTier = async (tier: string) => {
    localStorage.removeItem('pending_upgrade');
    // Broadcast to other tabs so they refresh too (Scenario 6, 37).
    localStorage.setItem('tier_confirmed', Date.now().toString());
    localStorage.removeItem('tier_confirmed');
    waitingRef.current = false;
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    await refreshProfile();
    setWaitingForTier(false);
    setConfirmedTier(tier);
    try { (window as any).gtag?.('event', 'purchase', { tier }); } catch {}
  };

  const fetchFreshTier = async (): Promise<string> => {
    try {
      const token = await (user as any)?.getIdToken(true);
      if (!token) return 'free';
      const res = await fetch('/api/profile/tier', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) return (await res.json()).tier || 'free';
    } catch {}
    return 'free';
  };

  const callSync = async (): Promise<string> => {
    try {
      const token = await (user as any)?.getIdToken(true);
      if (!token) return 'free';
      const res = await fetch('/api/gumroad/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) return (await res.json()).tier || 'free';
    } catch {}
    return 'free';
  };

  const startWaiting = (previousTier: string) => {
    if (waitingRef.current) return;
    waitingRef.current = true;
    setWaitingForTier(true);
    setTimedOut(false);

    // Poll server endpoint every 2s — uses Admin SDK so Firestore rules don't apply.
    let attempts = 0;
    const poll = async () => {
      if (!waitingRef.current) return;
      attempts += 1;
      // First 3 attempts: fast check via /api/profile/tier (webhook result).
      // After that: active Gumroad sales sync as fallback.
      const tier = attempts <= 3 ? await fetchFreshTier() : await callSync();
      const isPaidTier = ['founder', 'growth', 'investor_pro'].includes(tier);
      if (isPaidTier && tier !== previousTier) {
        await confirmTier(tier);
        return;
      }
      if (attempts >= 12) { // give up after ~20s
        localStorage.removeItem('pending_upgrade');
        waitingRef.current = false;
        setWaitingForTier(false);
        setTimedOut(true);
        return;
      }
      timeoutRef.current = setTimeout(poll, attempts <= 3 ? 1500 : 2500);
    };
    timeoutRef.current = setTimeout(poll, 1500);
  };

  // Trigger waiting whenever ?upgraded=1 or pending_upgrade in localStorage.
  useEffect(() => {
    if (!user) return;
    const upgraded = searchParams.get('upgraded') === '1';
    if (upgraded) setSearchParams({}, { replace: true }); // strip params from URL

    // Only show the "ACTIVATING" banner when redirected from checkout with ?upgraded=1.
    // pending_upgrade in localStorage alone is NOT enough — the card may have been
    // declined, the popup may still be open, or the user may just be browsing billing.
    if (!upgraded) return;

    let previousTier = 'free';
    try {
      const raw = localStorage.getItem('pending_upgrade');
      if (raw) {
        const pending = JSON.parse(raw);
        if (Date.now() - pending.ts < 30 * 60 * 1000) {
          previousTier = pending.previousTier || 'free';
          const expectedTier = pending.tier || '';
          // Instant-confirm if webhook already updated the tier before we landed here.
          const currentTierKey = ((profile as any)?.subscriptionStatus || 'free').toString().toLowerCase();
          if (expectedTier && currentTierKey === expectedTier && currentTierKey !== previousTier) {
            confirmTier(expectedTier);
            return;
          }
        } else {
          localStorage.removeItem('pending_upgrade');
        }
      }
    } catch { localStorage.removeItem('pending_upgrade'); }

    startWaiting(previousTier);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams]);

  const tierKey = (p.subscriptionStatus || 'free').toString().toLowerCase();
  const plan = PLAN_INFO[tierKey] || PLAN_INFO.free;
  // Only REAL paid tiers count as paid. Early test accounts can carry legacy
  // values in subscriptionStatus (from the old simulated checkout); anything
  // unrecognized behaves as the free plan — no Cancel button, free limits.
  const isPaid = ['founder', 'growth', 'investor_pro'].includes(tierKey);
  // Set by the server when a cancellation is scheduled with Paddle; cleared
  // by the webhook when the subscription actually ends.
  const cancelScheduledAt: string | null = p.subscriptionCancelAt || null;
  const cancelScheduledLabel = cancelScheduledAt && cancelScheduledAt !== 'scheduled'
    ? new Date(cancelScheduledAt).toLocaleDateString()
    : null;

  // Renewal date: use subscriptionStartedAt if available (set when tier was granted),
  // otherwise fall back to the tier-changed date stored separately.
  const renewDate = (() => {
    if (!isPaid) return null;
    const raw = (p as any).subscriptionStartedAt || (p as any).tierGrantedAt;
    const base = raw ? (raw.toDate?.() ?? new Date(raw)) : null;
    if (!base) return null;
    const d = new Date(base);
    d.setMonth(d.getMonth() + 1);
    while (d < new Date()) d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  // ── Live usage ──
  const [usage, setUsage] = useState<any>(null);
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      const count = async (col: string, field: string) => {
        try {
          const snap = await getDocs(query(collection(db, col), where(field, '==', user.uid)));
          return snap.docs.length;
        } catch { return 0; }
      };
      const [startups, analysesSnap, decks, positions] = await Promise.all([
        count('startups', 'founderId'),
        getDocs(query(collection(db, 'analyses'), where('userId', '==', user.uid))).catch(() => ({ docs: [] as any[] })),
        count('pitchDecks', 'userId'),
        count('positions', 'founderId'),
      ]);
      if (cancelled) return;
      const analyses = analysesSnap.docs.map((d: any) => d.data()).filter((a: any) => a.status !== 'failed');
      setUsage({
        startups,
        analyses: analyses.length,
        decks,
        reports: analyses.filter((a: any) => a.status !== 'failed').length,
        positions,
        matches: analyses.filter((a: any) => a.submittedToInvestors === true || a.sharedWithInvestors === true).length,
      });
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  // ── Cancel subscription ──
  // Goes through the SERVER, which cancels the real Paddle subscription so
  // billing genuinely stops. The plan stays active until the end of the paid
  // period; the Paddle webhook then drops the tier to free automatically.
  // (Browsers can no longer write subscriptionStatus — security rules.)
  const [cancelling, setCancelling] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const cancelPlan = async () => {
    if (!isPaid || !user?.uid) return;
    if (!window.confirm('Cancel your subscription? Your plan stays active until the end of the period you already paid for, then moves to the free plan.')) return;
    setCancelling(true);
    setCancelNote('');
    try {
      const idToken = await (user as any).getIdToken();
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCancelNote(data?.error || 'Could not cancel. Please try again or contact support@decisionlabhub.com.');
        return;
      }
      const ends = data?.endsAt ? new Date(data.endsAt).toLocaleDateString() : null;
      setCancelNote(ends
        ? `Cancellation confirmed. Your plan stays active until ${ends}, then switches to the free plan automatically.`
        : 'Cancellation confirmed. Your plan stays active until the end of the current billing period.');
      await refreshProfile();
    } catch (e) {
      console.warn('Cancel failed:', e);
      setCancelNote('Could not cancel. Please check your connection and try again.');
    }
    finally { setCancelling(false); }
  };

  const sectionCls = 'bg-brand-section border border-brand-border rounded-[2.5rem] p-8 mb-5';
  const sectionTitle = 'text-[11px] font-black text-brand-text-muted uppercase tracking-widest mb-5';

  const usageItems = usage ? [
    { icon: Rocket, label: 'Startups', value: `${usage.startups} / ${isPaid ? 'Unlimited' : '1'}` },
    { icon: BarChart3, label: 'Analyses', value: usage.analyses },
    { icon: Presentation, label: 'Pitch Decks', value: usage.decks },
    { icon: FileText, label: 'Reports', value: usage.reports },
    { icon: Users, label: 'Team Posts', value: usage.positions },
    { icon: Handshake, label: 'Investor Matches', value: usage.matches },
  ] : [];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary px-6 py-14">
      <div className="max-w-3xl mx-auto">
        <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] block mb-3">Account</span>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display mb-10">Billing & Subscription</h1>

        {waitingForTier && (
          <div className="mb-8 p-6 rounded-3xl bg-brand-accent/10 border border-brand-accent/30 flex items-center gap-4">
            <Loader2 size={20} className="animate-spin text-brand-accent shrink-0" />
            <div>
              <p className="text-sm font-black text-brand-text-primary uppercase tracking-wide">Activating your plan…</p>
              <p className="text-xs font-medium text-brand-text-secondary mt-0.5">Payment received — your plan will update automatically in seconds.</p>
            </div>
          </div>
        )}
        {timedOut && (
          <div className="mb-8 p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center shrink-0 text-amber-400 font-black text-xs">!</div>
            <div className="flex-1">
              <p className="text-sm font-black text-amber-400 uppercase tracking-wide">Payment received — plan updating shortly</p>
              <p className="text-xs font-medium text-brand-text-secondary mt-0.5">Your payment went through. Click "Refresh My Plan" to check again or contact <span className="text-brand-accent">support@decisionlabhub.com</span> if it doesn't update.</p>
            </div>
            <button
              onClick={async () => {
                setTimedOut(false);
                setWaitingForTier(true);
                const tier = await callSync();
                const isPaidTier = ['founder', 'growth', 'investor_pro'].includes(tier);
                // Only confirm if it's a paid tier AND different from what's currently shown.
                if (isPaidTier && tier !== tierKey) {
                  await confirmTier(tier);
                } else {
                  setWaitingForTier(false);
                  setTimedOut(true);
                }
              }}
              className="shrink-0 px-5 py-3 bg-amber-500 text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-amber-400 active:scale-95 transition-all"
            >
              Refresh My Plan
            </button>
          </div>
        )}
        {confirmedTier && (
          <WelcomeModal tier={confirmedTier} onClose={() => setConfirmedTier(null)} />
        )}

        {/* ── Current Plan ── */}
        <div className={sectionCls}>
          <h2 className={sectionTitle}>Current Plan</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="text-2xl font-black uppercase tracking-tight font-display">{plan.name}</div>
              <div className="text-sm font-bold text-brand-accent mt-1">{plan.price}</div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
                <span>Status: <span className="text-emerald-400">Active</span></span>
                {renewDate && <span>Renews: {renewDate}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/pricing')} className="px-6 py-3.5 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                <Zap size={13} /> {isPaid ? 'Change Plan' : 'Upgrade'}
              </button>
              {isPaid && !cancelScheduledAt && (
                <button onClick={cancelPlan} disabled={cancelling} className="px-6 py-3.5 bg-brand-coral/10 border border-brand-coral/20 text-brand-coral text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-coral/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
                  {cancelling ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />} Cancel
                </button>
              )}
            </div>
            {isPaid && cancelScheduledAt && (
              <p className="mt-4 text-xs font-bold text-brand-amber leading-relaxed">
                Cancellation scheduled{cancelScheduledLabel ? ` — your plan stays active until ${cancelScheduledLabel}` : ''}, then switches to the free plan automatically.
              </p>
            )}
            {cancelNote && !cancelScheduledAt && (
              <p className="mt-4 text-xs font-medium text-brand-text-secondary leading-relaxed">{cancelNote}</p>
            )}
          </div>
        </div>

        {/* ── Usage ── */}
        <div className={sectionCls}>
          <h2 className={sectionTitle}>Usage</h2>
          {!usage ? (
            <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin text-brand-accent" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {usageItems.map((u) => {
                const Icon = u.icon;
                return (
                  <div key={u.label} className="bg-brand-card rounded-2xl p-5 border border-white/5 text-center">
                    <Icon size={18} className="text-brand-accent mx-auto mb-2" />
                    <div className="text-xl font-black">{u.value}</div>
                    <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mt-1">{u.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Payment Method ── */}
        <div className={sectionCls}>
          <h2 className={sectionTitle}>Payment Method</h2>
          <div className="flex items-center gap-4 p-5 bg-brand-card rounded-2xl border border-dashed border-white/10">
            <CreditCard size={20} className="text-brand-text-muted shrink-0" />
            <p className="text-sm font-medium text-brand-text-secondary flex-1">
              Payments are processed securely via Gumroad. To update your payment method, visit your Gumroad receipt email or contact support.
            </p>
          </div>
        </div>

        {/* ── Billing History ── */}
        <div className={sectionCls}>
          <h2 className={sectionTitle}>Billing History</h2>
          <div className="flex items-center gap-4 p-5 bg-brand-card rounded-2xl border border-dashed border-white/10">
            <Receipt size={20} className="text-brand-text-muted shrink-0" />
            <p className="text-sm font-medium text-brand-text-secondary flex-1">
              No invoices yet. Your invoices will appear here once payments go live.
            </p>
          </div>
        </div>

        <p className="text-center">
          <button onClick={() => navigate('/pricing')} className="inline-flex items-center gap-2 text-[10px] font-black text-brand-text-muted uppercase tracking-widest hover:text-white transition-colors">
            Compare all plans <ArrowRight size={12} />
          </button>
        </p>
      </div>
    </div>
  );
}