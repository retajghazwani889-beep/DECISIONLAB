import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import {
  CreditCard, Zap, ArrowRight, Loader2, Rocket, BarChart3, Presentation,
  FileText, Users, Handshake, XCircle, Receipt,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// BillingPage — current plan, live usage pulled from real data, and
// subscription management. Payment methods & invoices show honest
// placeholders until a real payment provider (PayPal/Stripe) is connected.
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
  const [tierConfirmed, setTierConfirmed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const waitingRef = useRef(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always sync profile from server on mount so navbar + billing show the same tier.
  useEffect(() => { refreshProfile().catch(() => {}); }, []);

  const confirmTier = async (tier: string) => {
    localStorage.removeItem('pending_upgrade');
    localStorage.setItem('gumroad_confirmed', '1'); // signals popup to auto-close
    waitingRef.current = false;
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    await refreshProfile();
    setWaitingForTier(false);
    setTierConfirmed(true);
    try { (window as any).gtag?.('event', 'purchase', { tier }); } catch {}
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

    // Real-time Firestore listener — fires the instant the webhook writes the tier.
    if (user?.uid) {
      unsubRef.current = onSnapshot(doc(db, 'profiles', user.uid), async (snap) => {
        if (!waitingRef.current) return;
        const tier = (snap.data()?.subscriptionStatus || 'free').toString().toLowerCase();
        const isPaidTier = ['founder', 'growth', 'investor_pro'].includes(tier);
        if (isPaidTier && tier !== previousTier) {
          await confirmTier(tier);
        }
      });
    }

    // Sync immediately (2s) and again at 8s in case webhook is slow or missed.
    const trySyncAt = async (delay: number) => {
      timeoutRef.current = setTimeout(async () => {
        if (!waitingRef.current) return;
        const syncedTier = await callSync();
        if (syncedTier && syncedTier !== 'free' && syncedTier !== previousTier) {
          await confirmTier(syncedTier);
          return;
        }
        if (delay < 8000) {
          trySyncAt(8000 - delay); // one more attempt at ~8s total
        } else if (waitingRef.current) {
          localStorage.removeItem('pending_upgrade');
          waitingRef.current = false;
          if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
          setWaitingForTier(false);
          setTimedOut(true);
        }
      }, delay);
    };
    trySyncAt(2000);
  };

  // Trigger waiting whenever ?upgraded=1 or pending_upgrade in localStorage.
  useEffect(() => {
    if (!user) return;
    const upgraded = searchParams.get('upgraded') === '1';
    if (upgraded) setSearchParams({}, { replace: true }); // strip params from URL

    let previousTier = 'free';
    try {
      const raw = localStorage.getItem('pending_upgrade');
      if (raw) {
        const pending = JSON.parse(raw);
        if (Date.now() - pending.ts < 30 * 60 * 1000) {
          previousTier = pending.previousTier || 'free';
          const expectedTier = pending.tier || '';
          // Instant-confirm if tier already changed (webhook was fast).
          const currentTierKey = ((profile as any)?.subscriptionStatus || 'free').toString().toLowerCase();
          if (expectedTier && currentTierKey === expectedTier && currentTierKey !== previousTier) {
            confirmTier(expectedTier);
            return;
          }
          startWaiting(previousTier);
          return;
        } else {
          localStorage.removeItem('pending_upgrade');
        }
      }
    } catch { localStorage.removeItem('pending_upgrade'); }

    if (upgraded) startWaiting(previousTier);

    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
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
          <div className="mb-8 p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-4">
            <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center shrink-0 text-amber-400 font-black text-xs">!</div>
            <div>
              <p className="text-sm font-black text-amber-400 uppercase tracking-wide">Payment received — plan updating shortly</p>
              <p className="text-xs font-medium text-brand-text-secondary mt-0.5">Your payment went through. Your plan may take a few more minutes to activate — refresh this page in 2 minutes or contact <span className="text-brand-accent">support@decisionlabhub.com</span> if it doesn't update.</p>
            </div>
          </div>
        )}
        {tierConfirmed && (
          <div className="mb-8 p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <p className="text-sm font-black text-emerald-400 uppercase tracking-wide">Payment Confirmed — Plan Activated!</p>
              <p className="text-xs font-medium text-brand-text-secondary mt-0.5">Your new plan is live. All features are now unlocked on your account.</p>
            </div>
          </div>
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