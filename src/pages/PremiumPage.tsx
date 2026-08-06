import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Zap, Rocket, Shield, Crown, ArrowRight } from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { getTier, Tier } from '../lib/tiers';
import { openGumroadCheckout, GUMROAD_PRODUCTS } from '../lib/gumroad';
import { ecommerce } from '../lib/analytics';

interface PremiumPageProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function PremiumPage({ user, profile }: PremiumPageProps) {
  const { signInWithGoogle, refreshProfile } = useAuth();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // While popup is open, poll the server every 2s for a tier change.
  // When the server confirms the tier changed, set gumroad_confirmed so
  // gumroad.ts closes the popup and triggers onSuccess.
  // This is the ONLY legitimate trigger — no client-side postMessage guessing.
  useEffect(() => {
    if (!loadingTier || !user) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    const expectedTier = loadingTier;
    const previousTier = getTier(profile);
    pollRef.current = setInterval(async () => {
      try {
        const token = await (user as any).getIdToken(true);
        const res = await fetch('/api/profile/tier', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const { tier } = await res.json();
        if (tier === expectedTier && tier !== previousTier) {
          localStorage.setItem('gumroad_confirmed', '1');
        }
      } catch {}
    }, 2000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [loadingTier, user]);
  // Founders arriving from the signup flow get a "continue setup" path so
  // they're never stranded here: choose a plan (or stay free) → onboarding.
  const fromSignup = Boolean((location.state as any)?.fromSignup);

  // The user's current tier comes ONLY from their stored profile — no backdoor.
  const currentTier = getTier(profile);

  // Fire view_item once per session for each paid plan visible on this page.
  useEffect(() => {
    ecommerce.viewItem('founder');
    ecommerce.viewItem('growth');
  }, []);


  // REAL checkout via Gumroad. The card form is Gumroad's — card data
  // never touches our code. After payment, Gumroad Pings our server, and
  // the SERVER sets subscriptionStatus. The browser never writes tiers.
  const handleSelectPlan = (targetTier: Tier) => {
    if (targetTier === 'free') {
      if (!user) navigate('/signup');
      return;
    }

    // Scenario 7: Prevent double-click — if a popup is already open, focus it.
    if (loadingTier) {
      const existing = window.open('', 'gumroad_checkout');
      existing?.focus();
      return;
    }

    // Open the popup SYNCHRONOUSLY here — Chrome only allows window.open
    // inside a direct user-gesture handler, before any async awaits.
    const w = 520, h = 700;
    const left = Math.max(0, (window.screen.width - w) / 2);
    const top  = Math.max(0, (window.screen.height - h) / 2);
    const popup = window.open('about:blank', 'gumroad_checkout',
      `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);

    const proceed = async () => {
      let activeUser = user;
      if (!activeUser) {
        try {
          await signInWithGoogle();
          activeUser = auth.currentUser;
        } catch {
          popup?.close();
          return;
        }
        if (!activeUser) { popup?.close(); return; }
      }

      const previousTier = currentTier;
      localStorage.setItem('pending_upgrade', JSON.stringify({ tier: targetTier, previousTier, ts: Date.now() }));
      setLoadingTier(targetTier);
      ecommerce.beginCheckout(targetTier);

      openGumroadCheckout({
        productPermalink: targetTier === 'growth' ? GUMROAD_PRODUCTS.growth : GUMROAD_PRODUCTS.founder,
        uid: activeUser.uid,
        email: activeUser.email,
        popup,
        onSuccess: () => {
          setLoadingTier(null);
          navigate(`/billing?upgraded=1&t=${Date.now()}`, { replace: true });
        },
        onDismissed: () => {
          // Payment was not completed — reset button, don't navigate.
          setLoadingTier(null);
        },
      });
    };

    proceed();
  };

  const PlanCard = ({
    tier, title, price, subtitle, features, popular, cta,
  }: {
    tier: Tier; title: string; price: string; subtitle: string;
    features: string[]; popular?: boolean; cta: string;
  }) => {
    const isCurrent = currentTier === tier;
    const isLoading = loadingTier === tier;
    // A plan button is disabled if it's the user's current plan, or it's the
    // free plan (nothing to buy), or a payment is in progress.
    const disabled = isCurrent || (tier === 'free' && !!user) || isLoading;

    return (
      <div className={cn(
        "relative p-8 rounded-3xl border-2 transition-all duration-500 h-full flex flex-col",
        popular
        ? "bg-brand-section border-brand-accent shadow-2xl shadow-brand-accent/20 z-10"
        : "bg-brand-card border-brand-border/10"
      )}>
        {popular && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-accent text-brand-text-primary text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-widest shadow-[0_0_15px_rgba(77,163,255,0.5)]">
            Most Popular
          </div>
        )}

        <h3 className="text-2xl font-black mb-2 font-display tracking-tight text-brand-text-primary whitespace-nowrap">
          {title}
        </h3>
        <p className="text-brand-accent text-sm font-bold uppercase tracking-wider mb-10 whitespace-nowrap">{subtitle}</p>

        <div className="mb-12 flex items-baseline gap-2">
          <span className="text-5xl font-black font-display tracking-tighter text-brand-text-primary">
            ${price}
          </span>
          <span className="text-brand-accent text-sm font-bold">{price === '0' ? '' : '/mo'}</span>
        </div>

        <ul className="space-y-4 mb-12 flex-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-4">
              <div className="mt-1.5 p-0.5 rounded-full shrink-0 bg-brand-accent text-brand-text-primary shadow-[0_0_10px_rgba(77,163,255,0.3)]">
                <Check size={14} strokeWidth={4} />
              </div>
              <span className="text-base font-medium text-neutral-300 whitespace-nowrap">
                {f}
              </span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => handleSelectPlan(tier)}
          disabled={disabled}
          className={cn(
            "w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95",
            popular ? "bg-brand-accent text-brand-text-primary hover:bg-brand-accent/90 shadow-lg shadow-brand-accent/20" : "bg-brand-section text-brand-text-primary border border-brand-border/10 hover:border-brand-accent/50 hover:bg-brand-hover",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? 'Processing…' : isCurrent ? 'Current Plan' : cta}
        </button>

      </div>
    );
  };

  // ── Investor Pro — EARLY ACCESS WAITLIST ─────────────────────────────────
  // The investor browse experience is still being completed, so we do not
  // charge for Investor Pro yet. The card presents it as early access and
  // the button leads to the contact page to join the waitlist. No checkout.
  const isInvestorAccount = (profile as any)?.accountType === 'investor';
  const investorProActive = (profile as any)?.subscriptionStatus === 'investor_pro';

  const handleInvestorPro = () => {
    navigate('/contact');
  };

  const INVESTOR_FEATURES = [
    'Browse Startups',
    'Startup Reports',
    'Pitch Decks',
    'Founder Contacts',
    'Track Startups',
    'PDF Reports',
    'Investor Dashboard',
    'Priority Support',
  ];

  const InvestorProCard = () => (
    <div className="relative p-8 rounded-3xl border-2 transition-all duration-500 bg-brand-section border-brand-accent shadow-2xl shadow-brand-accent/20 z-10 h-full flex flex-col">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-accent text-brand-text-primary text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-widest shadow-[0_0_15px_rgba(77,163,255,0.5)] whitespace-nowrap">
        Early Access
      </div>
      <h3 className="text-2xl font-black mb-2 font-display tracking-tight text-brand-text-primary">Investor Pro</h3>
      <p className="text-brand-accent text-sm font-bold uppercase tracking-wider mb-10 whitespace-nowrap">Discover · Evaluate · Invest</p>
      <div className="mb-12 flex items-baseline gap-2">
        <span className="text-5xl font-black font-display tracking-tighter text-brand-text-primary">Coming Soon</span>
      </div>
      <ul className="space-y-4 mb-12 flex-1">
        {INVESTOR_FEATURES.map((f, i) => (
          <li key={i} className="flex items-center gap-4">
            <div className="p-0.5 rounded-full shrink-0 bg-brand-accent text-brand-text-primary shadow-[0_0_10px_rgba(77,163,255,0.3)]">
              <Check size={14} strokeWidth={4} />
            </div>
            <span className="text-base font-medium text-neutral-300 whitespace-nowrap">{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={handleInvestorPro}
        className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 bg-brand-accent text-brand-text-primary hover:bg-brand-accent/90 shadow-lg shadow-brand-accent/20"
      >
        {investorProActive ? 'Current Plan' : 'Join the Waitlist'}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {fromSignup && (
        <div className="mb-16 p-6 rounded-3xl bg-brand-accent/5 border border-brand-accent/20 flex flex-col sm:flex-row sm:items-center gap-5">
          <p className="flex-1 text-sm font-medium text-brand-text-secondary">
            <span className="font-black text-brand-text-primary uppercase tracking-wide">No payment needed.</span>{' '}
            You can use DecisionLab completely free — pick a plan later, anytime.
          </p>
          <button
            onClick={() => navigate('/welcome/founder')}
            className="shrink-0 px-6 py-3.5 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            Continue Free <ArrowRight size={14} />
          </button>
        </div>
      )}
      <div className="text-center mb-10 md:mb-32 space-y-6">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-black uppercase tracking-[0.2em] mb-6 border border-brand-accent/20">
          Scale your startup
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-brand-text-primary tracking-tighter font-display leading-[1.1] uppercase">
          Pricing
        </h1>
        <p className="text-lg md:text-xl text-brand-text-muted max-w-3xl mx-auto font-medium leading-relaxed opacity-80">
          Validate your idea, then unlock the tools investors expect. Choose the plan that fits your stage.
        </p>
        <p className="mt-6 text-[11px] font-black text-[#5da9ff] uppercase tracking-[0.35em] drop-shadow-[0_0_10px_rgba(93,169,255,0.35)]">Trusted by founders worldwide</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 md:gap-10 items-stretch">
        <PlanCard
          tier="free"
          title="Startup at a Glance"
          price="0"
          subtitle="Free · Validate your idea"
          features={[
            "1 Startup",
            "Startup Profile",
            "Startup Overview",
            "Initial Analysis",
            "Readiness Score",
            "Save Project",
          ]}
          cta="Start Free"
        />
        <PlanCard
          tier="founder"
          title="Startup Validation"
          price="39"
          subtitle="Validate before you build"
          features={[
            "Free Features",
            "Unlimited Ideas",
            "Market Analysis",
            "Competitor Analysis",
            "Revenue & SWOT",
            "Risk Analysis",
            "Improvement Tips",
            "Growth Roadmap",
            "Growth Opportunities",
          ]}
          cta="Choose Validation"
        />
        <PlanCard
          tier="growth"
          title="Startup Grow"
          price="99"
          subtitle="Investor & growth toolkit"
          popular={true}
          features={[
            "Validation Features",
            "Team Building",
            "Pitch Decks",
            "Executive Reports",
            "Compare Startups",
            "Priority Support",
          ]}
          cta="Choose Grow"
        />
        <InvestorProCard />
      </div>

      <p className="mt-16 text-center text-sm text-brand-text-muted font-medium max-w-2xl mx-auto leading-relaxed">
        DecisionLab plans are software subscriptions. We charge no listing fees, no commissions, and no
        recruitment or introduction fees — team features are free for team members.
      </p>

    </div>
  );
}