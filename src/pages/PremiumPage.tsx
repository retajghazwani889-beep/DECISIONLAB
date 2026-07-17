import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Zap, Rocket, Shield, Crown, ArrowRight } from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { getTier, Tier } from '../lib/tiers';
import { openPaddleCheckout, PADDLE_PRICES } from '../lib/paddle';

interface PremiumPageProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function PremiumPage({ user, profile }: PremiumPageProps) {
  const { signInWithGoogle, refreshProfile } = useAuth();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  // Founders arriving from the signup flow get a "continue setup" path so
  // they're never stranded here: choose a plan (or stay free) → onboarding.
  const fromSignup = Boolean((location.state as any)?.fromSignup);

  // The user's current tier comes ONLY from their stored profile — no backdoor.
  const currentTier = getTier(profile);

  // After Paddle reports checkout.completed, the WEBHOOK on our server writes
  // the new tier to Firestore (usually within a few seconds). This polls the
  // profile until the change lands, then continues the flow.
  const waitForTierThenContinue = (expected: string) => {
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try { await refreshProfile(); } catch (_) {}
      // getTier can't see the fresh profile from inside this closure reliably,
      // so read straight from the refreshed context on next tick via reload.
      if (attempts >= 8) {
        // Give up polling politely — the webhook may just be slow. Reload:
        // the tier will show as soon as it's written.
        if (fromSignup) navigate('/welcome/founder', { replace: true });
        else window.location.reload();
        return;
      }
      setTimeout(poll, 1500);
    };
    // Small head start so the webhook has time to arrive.
    setTimeout(poll, 2500);
  };

  // REAL checkout via Paddle. The card form is Paddle's — card data never
  // touches our code. After payment, Paddle webhooks our server, and the
  // SERVER sets subscriptionStatus. The browser never writes tiers anymore.
  const handleSelectPlan = async (targetTier: Tier) => {
    if (targetTier === 'free') {
      // Logged-out visitors clicking "Start Free" begin signup; for
      // logged-in users there's nothing to buy.
      if (!user) navigate('/signup');
      return;
    }

    let activeUser = user;
    if (!activeUser) {
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error("Auth failed:", error);
        return;
      }
      // After sign-in the user object updates via context; ask them to retry once.
      return;
    }

    setLoadingTier(targetTier);
    try {
      await openPaddleCheckout({
        priceId: targetTier === 'growth' ? PADDLE_PRICES.growth : PADDLE_PRICES.founder,
        uid: activeUser.uid,
        email: activeUser.email,
        onCompleted: () => waitForTierThenContinue(targetTier),
      });
    } catch (err) {
      console.error('Could not open checkout:', err);
      alert('Could not open the checkout. Please refresh the page and try again.');
    } finally {
      // The overlay is open (or failed); either way stop the button spinner.
      setLoadingTier(null);
    }
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

        <h3 className="text-2xl font-black mb-2 font-display tracking-tight text-brand-text-primary">
          {title}
        </h3>
        <p className="text-brand-accent text-sm font-bold uppercase tracking-wider mb-10">{subtitle}</p>

        <div className="mb-12 flex items-baseline gap-2">
          <span className="text-5xl font-black font-display tracking-tighter text-brand-text-primary">
            ${price}
          </span>
          <span className="text-brand-accent text-sm font-bold">{price === '0' ? '' : '/mo'}</span>
        </div>

        <ul className="space-y-4 mb-12 flex-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-4">
              <div className={cn("mt-1.5 p-0.5 rounded-full shrink-0", popular ? "bg-brand-accent text-brand-text-primary shadow-[0_0_10px_rgba(77,163,255,0.3)]" : "bg-brand-accent/20 text-brand-accent")}>
                <Check size={14} strokeWidth={4} />
              </div>
              <span className={cn("text-base font-medium", popular ? "text-neutral-300" : "text-brand-accent")}>
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

  // ── Investor Pro ($199/mo) ────────────────────────────────────────────────
  // A plan for INVESTOR accounts, separate from the founder tiers. Founders
  // and logged-out visitors are sent to the Investor Network to create an
  // investor account first; investors get the same simulated checkout.
  const isInvestorAccount = (profile as any)?.accountType === 'investor';
  const [investorLoading, setInvestorLoading] = useState(false);
  const investorProActive = (profile as any)?.subscriptionStatus === 'investor_pro';

  const handleInvestorPro = async () => {
    if (!user || !isInvestorAccount) {
      navigate('/investor-network');
      return;
    }
    if (investorProActive) return;
    setInvestorLoading(true);
    try {
      await openPaddleCheckout({
        priceId: PADDLE_PRICES.investor_pro,
        uid: user.uid,
        email: user.email,
        onCompleted: () => waitForTierThenContinue('investor_pro' as any),
      });
    } catch (err) {
      console.error('Could not open checkout:', err);
      alert('Could not open the checkout. Please refresh the page and try again.');
    } finally {
      setInvestorLoading(false);
    }
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
    <div className="relative p-8 rounded-3xl border-2 transition-all duration-500 bg-brand-card border-[#5da9ff]/30 h-full flex flex-col">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#5da9ff] text-brand-bg text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-widest">
        For Investors
      </div>
      <h3 className="text-2xl font-black mb-2 font-display tracking-tight text-brand-text-primary">Investor Pro</h3>
      <p className="text-[#5da9ff] text-sm font-bold uppercase tracking-wider mb-6">Discover · Evaluate · Invest</p>
      <div className="mb-6 flex items-baseline gap-2">
        <span className="text-5xl font-black font-display tracking-tighter text-brand-text-primary">$199</span>
        <span className="text-[#5da9ff] text-sm font-bold">/mo</span>
      </div>
      <p className="text-sm text-brand-text-muted font-medium leading-relaxed mb-8">
        Discover validated startups and connect with founders, all in one dashboard
      </p>
      <ul className="space-y-3 mb-12 flex-1">
        {INVESTOR_FEATURES.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="mt-1 p-0.5 rounded-full shrink-0 bg-[#5da9ff]/20 text-[#5da9ff]">
              <Check size={13} strokeWidth={4} />
            </div>
            <span className="text-sm font-medium text-neutral-300">{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={handleInvestorPro}
        disabled={investorLoading || investorProActive}
        className={cn(
          'w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95',
          'bg-[#5da9ff] text-brand-bg hover:bg-[#5da9ff]/90 shadow-lg shadow-[#5da9ff]/20',
          (investorLoading || investorProActive) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {investorLoading ? 'Processing…' : investorProActive ? 'Current Plan' : isInvestorAccount ? 'Choose Investor Pro' : 'Become an Investor'}
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
      <div className="text-center mb-32 space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 md:gap-10 items-stretch">
        <PlanCard
          tier="free"
          title="Startup at a Glance"
          price="0"
          subtitle="Free forever · Validate your idea"
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
            "Investor Matching",
            "Pitch Decks",
            "Executive Reports",
            "Compare Startups",
            "Growth Opportunities",
          ]}
          cta="Choose Grow"
        />
        <InvestorProCard />
      </div>

    </div>
  );
}