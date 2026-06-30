// src/lib/tiers.ts
// Central definition of subscription tiers and a single helper to check access.
// Use hasAccess(profile, 'founder') or hasAccess(profile, 'growth') anywhere a
// feature needs to be locked.

import { UserProfile } from '../types';

export type Tier = 'free' | 'founder' | 'growth';

// Rank order: higher number = higher tier. A user has access to a required
// tier if their own tier rank is >= the required tier's rank.
const TIER_RANK: Record<Tier, number> = {
  free: 0,
  founder: 1,
  growth: 2,
};

// A loose shape so we can read identity fields off whatever profile is passed.
type ProfileLike =
  | {
      subscriptionStatus?: string;
      email?: string;
      fullName?: string;
      displayName?: string;
    }
  | null
  | undefined;

// -------------------------------------------------------------------------
// TEMPORARY OWNER OVERRIDE
// These accounts always get the top (growth) tier, so the owner can test every
// feature without paying. REMOVE this block (and the isOwner call in getTier)
// once real payments are live.
const OWNER_EMAILS = [
  'retajghazwani889@gmail.com',
  'tripandadvisor6@gmail.com',
];
const OWNER_NAME_HINTS = ['retaj', 'assad'];

function isOwner(profile: ProfileLike): boolean {
  if (!profile) return false;
  const email = (profile.email || '').toLowerCase().trim();
  const name = (profile.fullName || profile.displayName || '').toLowerCase().trim();
  if (email && OWNER_EMAILS.includes(email)) return true;
  if (name && OWNER_NAME_HINTS.some((h) => name.includes(h))) return true;
  if (email && OWNER_NAME_HINTS.some((h) => email.includes(h))) return true;
  return false;
}
// -------------------------------------------------------------------------

// Read a normalized tier from a user profile. Handles older 'premium' values
// that may still exist in the database (treated as 'founder').
export function getTier(profile: ProfileLike): Tier {
  if (isOwner(profile)) return 'growth';
  const raw = (profile?.subscriptionStatus || 'free').toLowerCase();
  if (raw === 'growth') return 'growth';
  if (raw === 'founder' || raw === 'premium') return 'founder';
  return 'free';
}

// The main check. Example: hasAccess(profile, 'growth')
export function hasAccess(profile: ProfileLike, required: Tier): boolean {
  return TIER_RANK[getTier(profile)] >= TIER_RANK[required];
}

// Convenience flags
export function isFounderOrAbove(profile: ProfileLike) {
  return hasAccess(profile, 'founder');
}
export function isGrowth(profile: ProfileLike) {
  return hasAccess(profile, 'growth');
}