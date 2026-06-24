// src/lib/tiers.ts
// Central definition of subscription tiers and a single helper to check access.
// Use hasAccess(profile, 'founder') or hasAccess(profile, 'growth') anywhere a
// feature needs to be locked. This replaces the old email-based backdoor.

import { UserProfile } from '../types';

export type Tier = 'free' | 'founder' | 'growth';

// Rank order: higher number = higher tier. A user has access to a required
// tier if their own tier rank is >= the required tier's rank.
const TIER_RANK: Record<Tier, number> = {
  free: 0,
  founder: 1,
  growth: 2,
};

// Read a normalized tier from a user profile. Handles older 'premium' values
// that may still exist in the database (treated as 'founder').
export function getTier(profile: { subscriptionStatus?: string } | null | undefined): Tier {
  const raw = (profile?.subscriptionStatus || 'free').toLowerCase();
  if (raw === 'growth') return 'growth';
  if (raw === 'founder' || raw === 'premium') return 'founder';
  return 'free';
}

// The main check. Example: hasAccess(profile, 'growth')
export function hasAccess(
  profile: { subscriptionStatus?: string } | null | undefined,
  required: Tier
): boolean {
  return TIER_RANK[getTier(profile)] >= TIER_RANK[required];
}

// Convenience flags
export function isFounderOrAbove(profile: { subscriptionStatus?: string } | null | undefined) {
  return hasAccess(profile, 'founder');
}
export function isGrowth(profile: { subscriptionStatus?: string } | null | undefined) {
  return hasAccess(profile, 'growth');
}