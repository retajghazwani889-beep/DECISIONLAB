import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasAccess, Tier } from '../lib/tiers';

// ─────────────────────────────────────────────────────────────────────────────
// UpgradeGate — the single source of truth for locking features behind tiers.
//
//   <RequireTier tier="growth" featureName="Pitch Deck Architect">…</RequireTier>
//     Route-level wrapper: requires login + the given tier, otherwise shows a
//     full upgrade screen with a link to /pricing.
//
//   <UpgradePrompt requiredTier="growth" featureName="TeamLab" />
//     The upgrade card itself, for embedding inside tabs/panels/modals.
//
// These are FRONTEND locks (good for beta). Anything that costs real money or
// data must ALSO be re-checked in server.ts once payments are live.
// ─────────────────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<Exclude<Tier, 'free'>, { name: string; price: string }> = {
  founder: { name: 'Startup Validation', price: '$39/mo' },
  growth: { name: 'Startup Grow', price: '$99/mo' },
};

export function UpgradePrompt({
  requiredTier,
  featureName,
  description,
}: {
  requiredTier: Exclude<Tier, 'free'>;
  featureName: string;
  description?: string;
}) {
  const navigate = useNavigate();
  const plan = TIER_LABELS[requiredTier];

  return (
    <div className="w-full flex items-center justify-center py-16 px-6">
      <div className="relative w-full max-w-lg bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10 shadow-huge text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
          <Lock size={26} />
        </div>
        <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] block mb-3">
          {plan.name} Feature
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-4 leading-tight">
          {featureName}
        </h2>
        <button
          onClick={() => navigate('/pricing')}
          className="inline-flex items-center gap-3 px-10 py-5 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-accent/20"
        >
          View Plans <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

export function RequireTier({
  tier,
  featureName,
  children,
}: {
  tier: Exclude<Tier, 'free'>;
  featureName: string;
  children?: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();

  // Wait for auth to resolve so we never flash the lock at a paying user.
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!hasAccess(profile, tier)) {
    return <UpgradePrompt requiredTier={tier} featureName={featureName} />;
  }

  return <>{children}</>;
}