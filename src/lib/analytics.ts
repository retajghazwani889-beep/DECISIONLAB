declare function gtag(...args: any[]): void;

const fire = (eventName: string, params?: Record<string, any>) => {
  try {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, params);
    }
  } catch {
    // GA4 not loaded (dev/blocked) — silent
  }
};

export const track = {
  ideaSubmitted: () => fire('idea_submitted'),
  signupStarted: (method: 'email' | 'google') => fire('signup_started', { method }),
  signupCompleted: (method: 'email' | 'google') => fire('sign_up', { method }),
  analysisStarted: () => fire('analysis_started'),
  analysisCompleted: () => fire('analysis_completed'),
  pitchDeckGenerated: () => fire('pitch_deck_generated'),
};

// ── GA4 Ecommerce ─────────────────────────────────────────────────────────────
// Prices and item metadata for each paid tier.
const TIER_META: Record<string, { item_id: string; item_name: string; price: number }> = {
  founder: { item_id: 'plan_founder', item_name: 'Startup Validation', price: 39 },
  growth:  { item_id: 'plan_growth',  item_name: 'Startup Grow',       price: 99 },
};

// Dedup key stored in sessionStorage so each browser session fires each event once.
const fired = (key: string): boolean => {
  if (sessionStorage.getItem(key)) return true;
  sessionStorage.setItem(key, '1');
  return false;
};

export const ecommerce = {
  // Fire once per pricing page visit for each visible paid plan.
  viewItem: (tier: string) => {
    const meta = TIER_META[tier];
    if (!meta) return;
    // view_item fires every page visit — no dedup needed (standard GA4 behavior).
    fire('view_item', {
      currency: 'USD',
      value: meta.price,
      items: [{
        item_id: meta.item_id,
        item_name: meta.item_name,
        item_category: 'subscription',
        price: meta.price,
        quantity: 1,
      }],
    });
  },

  // Fire when the user clicks Upgrade and the Gumroad popup opens.
  // Deduplicated per tier per session so a double-click doesn't double-count.
  beginCheckout: (tier: string) => {
    const meta = TIER_META[tier];
    if (!meta) return;
    const key = `ga4_begin_checkout_${tier}`;
    if (fired(key)) return;
    fire('begin_checkout', {
      currency: 'USD',
      value: meta.price,
      items: [{
        item_id: meta.item_id,
        item_name: meta.item_name,
        item_category: 'subscription',
        price: meta.price,
        quantity: 1,
      }],
    });
  },

  // Fire ONLY after the backend confirms a successful Gumroad payment.
  // transaction_id is the Gumroad sale_id stored in pending_upgrade (or a
  // timestamp fallback). Deduplicated on transaction_id so multi-tab confirm
  // or a component remount never double-fires.
  purchase: (tier: string, transactionId: string) => {
    const meta = TIER_META[tier];
    if (!meta) return;
    const key = `ga4_purchase_${transactionId}`;
    if (fired(key)) return;
    fire('purchase', {
      transaction_id: transactionId,
      currency: 'USD',
      value: meta.price,
      items: [{
        item_id: meta.item_id,
        item_name: meta.item_name,
        item_category: 'subscription',
        price: meta.price,
        quantity: 1,
      }],
    });
  },
};
