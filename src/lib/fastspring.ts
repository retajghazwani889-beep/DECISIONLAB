// src/lib/fastspring.ts
// FastSpring billing — the ONLY place checkout is opened from.
// Drop-in replacement for the old paddle.ts.
//
// How it works: FastSpring's Store Builder Library (SBL) loads a hosted
// popup checkout. Card details go straight to FastSpring (never through our
// code). After payment, FastSpring calls our SERVER webhook, which verifies
// the signature and writes the user's new tier to their Firestore profile.
//
// We attach the user's uid via `tags` (FastSpring's equivalent of Paddle's
// customData) so the webhook knows whose tier to set. Whatever key you set in
// `tags` here MUST be the key the server webhook reads back out.
//
// ─── CONFIG ──────────────────────────────────────────────────────────────────
// STOREFRONT: your FastSpring store's "storefront" domain. Find it in the
// FastSpring dashboard under: Checkouts → (your checkout) → the URL will look
// like  decisionlab.onfastspring.com  (test)  or  decisionlab.test.onfastspring.com
// Set the TEST storefront while building; swap to the live one before launch.
//
// PRODUCT PATHS: these are the "Product Path" values you set when creating each
// subscription in the FastSpring catalog. You created:
//    startup-validation   → founder tier ($39)
//    startup-grow         → growth tier ($99)
// If you named the paths differently, change them here to match EXACTLY.
// ─────────────────────────────────────────────────────────────────────────────

const FASTSPRING_STOREFRONT = 'decisionlab.test.onfastspring.com'; // TODO: confirm exact storefront in dashboard; use live domain before launch

export const FASTSPRING_PRODUCTS = {
  founder: 'startup-validation', // Startup Validation — $39/mo
  growth: 'startup-grow',        // Startup Grow — $99/mo
} as const;
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window { fastspring?: any; }
}

let scriptLoading: Promise<void> | null = null;
let onCompletedCallback: (() => void) | null = null;

// The SBL fires this global when a checkout completes. We register it on window
// so FastSpring can find it by name (data-popup-webhook-received).
function installGlobalCallbacks() {
  (window as any).__dlOnFastSpringPurchase = (_orderReference: any) => {
    // Payment succeeded on FastSpring's side. Our SERVER webhook is what
    // actually upgrades the tier; here we just tell the UI to start polling
    // the profile so it reflects the change within a few seconds.
    try { onCompletedCallback?.(); } catch (_) {}
  };
}

function loadScript(): Promise<void> {
  if (window.fastspring) return Promise.resolve();
  if (scriptLoading) return scriptLoading;

  installGlobalCallbacks();

  scriptLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-fastspring]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('FastSpring SBL failed to load')));
      return;
    }
    const s = document.createElement('script');
    // FastSpring Store Builder Library v2.
    s.src = 'https://sbl.onfastspring.com/sbl/1.0.1/fastspring-builder.min.js';
    s.type = 'text/javascript';
    s.async = true;
    s.setAttribute('data-fastspring', '1');
    // The storefront this checkout belongs to.
    s.setAttribute('data-storefront', FASTSPRING_STOREFRONT);
    // Name of the global function FastSpring calls after a successful order.
    s.setAttribute('data-popup-webhook-received', '__dlOnFastSpringPurchase');
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('FastSpring SBL failed to load'));
    document.head.appendChild(s);
  });

  return scriptLoading;
}

async function ensureReady(): Promise<void> {
  await loadScript();
  // The SBL attaches window.fastspring.builder after the script initializes.
  // Give it a couple of ticks if it's not ready the instant onload fires.
  for (let i = 0; i < 20 && !window.fastspring?.builder; i++) {
    await new Promise((r) => setTimeout(r, 50));
  }
  if (!window.fastspring?.builder) {
    throw new Error('FastSpring builder did not initialize');
  }
}

// Opens the FastSpring popup checkout for one of our plans.
//  - productPath:  which plan (use FASTSPRING_PRODUCTS)
//  - uid:          the Firebase uid — CRITICAL: the webhook uses this to know
//                  which profile to upgrade. Sent as a FastSpring tag.
//  - email:        pre-fills the checkout for a smoother experience
//  - onCompleted:  called when payment succeeds (server webhook then updates the
//                  tier within a few seconds; poll the profile to reflect it)
export async function openFastSpringCheckout(opts: {
  productPath: string;
  uid: string;
  email?: string | null;
  onCompleted?: () => void;
}): Promise<void> {
  await ensureReady();
  onCompletedCallback = opts.onCompleted || null;

  const fs = window.fastspring.builder;

  // Attach the uid so the webhook can identify the user. FastSpring exposes
  // order tags on the webhook payload; the SERVER must read this same 'uid' key.
  //
  // IMPORTANT: tags must be set BEFORE push/checkout so they ride along with
  // the order. tags() merges, it doesn't replace.
  fs.tag({ uid: opts.uid });

  if (opts.email) {
    // Pre-fill the buyer's email on the checkout.
    fs.recognize({ email: opts.email });
  }

  // Reset any previous session items, add this plan, and open the popup.
  fs.reset();
  fs.push({ path: opts.productPath, quantity: 1 });
  fs.checkout();
}