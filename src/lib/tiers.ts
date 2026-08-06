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
// NOTE: The temporary OWNER OVERRIDE that granted top-tier access based on
// email/name has been REMOVED for the live payment launch. Tier now comes
// ONLY from a verified payment writing subscriptionStatus to the profile.
//
// If you (the owner) need free access to test paid features, do it the safe
// way instead of a code backdoor: set your own account's `subscriptionStatus`
// field to "growth" directly in the Firestore console. That affects only your
// specific document and can't accidentally unlock strangers whose name or
// email happens to contain a matching string.
// -------------------------------------------------------------------------

// Read a normalized tier from a user profile. Handles older 'premium' values
// that may still exist in the database (treated as 'founder').
export function getTier(profile: ProfileLike): Tier {
  const raw = (profile?.subscriptionStatus || 'free').toLowerCase();
  if (raw === 'growth') return 'growth';
  if (raw === 'founder' || raw === 'premium') return 'founder';
  return 'free';
}

// TEMPORARY OWNER OVERRIDE — remove after testing
const OWNER_EMAILS = ['decisionlab00@gmail.com'];

// The main check. Example: hasAccess(profile, 'growth')
export function hasAccess(profile: ProfileLike, required: Tier, userEmail?: string): boolean {
  const emailToCheck = (profile?.email || userEmail || '').toLowerCase();
  if (emailToCheck && OWNER_EMAILS.includes(emailToCheck)) return true;
  return TIER_RANK[getTier(profile)] >= TIER_RANK[required];
}

// Convenience flags
export function isFounderOrAbove(profile: ProfileLike) {
  return hasAccess(profile, 'founder');
}
export function isGrowth(profile: ProfileLike) {
  return hasAccess(profile, 'growth');
}