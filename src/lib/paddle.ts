// src/lib/paddle.ts
// Paddle billing — the ONLY place checkout is opened from.
//
// How it works: Paddle.js opens Paddle's hosted checkout overlay. The card
// details go straight to Paddle (never through our code). After payment,
// Paddle calls our server webhook (/api/paddle/webhook), which verifies the
// signature and writes the user's new tier to their Firestore profile.
// We attach the user's uid as customData so the webhook knows whose tier to set.

// ─── CONFIG ─────────────────────────────────────────────────────────────────
// SANDBOX for building/testing. To go live later: set ENVIRONMENT to
// 'production', replace the token with the LIVE client-side token, and replace
// the price IDs with the live ones.
//
// Client-side tokens are designed to be public (like the Firebase config),
// so it's safe for this to live in frontend code.
const PADDLE_ENVIRONMENT: 'sandbox' | 'production' = 'sandbox';
const PADDLE_CLIENT_TOKEN = 'test_9cfe76f84df67ce63df11ae3d8f'; // sandbox client-side token

// Sandbox price IDs (from the Paddle catalog):
export const PADDLE_PRICES = {
  founder: 'pri_01kxqajffbej30b0ewj8mmgfz2',      // Startup Validation — $39/mo
  growth: 'pri_01kxqamsgjabxzhsw9e4yx4drn',       // Startup Grow — $99/mo
  investor_pro: 'pri_01kxqapbvfd1fby56azj195esj', // Investor Pro — $199/mo
} as const;
// ────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window { Paddle?: any; }
}

let initialized = false;
let onCompletedCallback: (() => void) | null = null;

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Paddle) return resolve();
    const existing = document.querySelector('script[data-paddle]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Paddle.js failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    s.async = true;
    s.setAttribute('data-paddle', '1');
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Paddle.js failed to load'));
    document.head.appendChild(s);
  });
}

async function ensureInitialized(): Promise<void> {
  await loadScript();
  if (initialized) return;
  if (PADDLE_ENVIRONMENT === 'sandbox') {
    window.Paddle.Environment.set('sandbox');
  }
  window.Paddle.Initialize({
    token: PADDLE_CLIENT_TOKEN,
    eventCallback: (event: any) => {
      // Fired for all checkout lifecycle events.
      if (event?.name === 'checkout.completed') {
        try { onCompletedCallback?.(); } catch (_) {}
      }
    },
  });
  initialized = true;
}

// Opens the Paddle checkout overlay for one of our plans.
//  - priceId: which plan (use PADDLE_PRICES)
//  - uid:     the Firebase uid — CRITICAL: the webhook uses this to know
//             which profile to upgrade
//  - email:   pre-fills the checkout for a smoother experience
//  - onCompleted: called when payment succeeds (webhook then updates the tier
//             within a few seconds; poll the profile to reflect it in the UI)
export async function openPaddleCheckout(opts: {
  priceId: string;
  uid: string;
  email?: string | null;
  onCompleted?: () => void;
}): Promise<void> {
  await ensureInitialized();
  onCompletedCallback = opts.onCompleted || null;
  window.Paddle.Checkout.open({
    items: [{ priceId: opts.priceId, quantity: 1 }],
    customData: { uid: opts.uid },
    ...(opts.email ? { customer: { email: opts.email } } : {}),
    settings: {
      displayMode: 'overlay',
      theme: 'dark',
      allowLogout: false,
    },
  });
}