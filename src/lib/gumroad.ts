export const GUMROAD_PRODUCTS = {
  founder: 'rdnzb',  // Startup Validation — $39/mo
  growth:  'tqownt', // Startup Grow — $99/mo
} as const;

const GUMROAD_BASE = 'https://decisionlab888.gumroad.com/l';

// Load Gumroad's overlay script once and resolve when ready.
let gumroadScriptPromise: Promise<void> | null = null;
function loadGumroadScript(): Promise<void> {
  if (gumroadScriptPromise) return gumroadScriptPromise;
  gumroadScriptPromise = new Promise((resolve) => {
    if (document.querySelector('script[src*="gumroad.com/js/gumroad"]')) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://gumroad.com/js/gumroad.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // fall back gracefully
    document.head.appendChild(s);
  });
  return gumroadScriptPromise;
}

export interface GumroadCheckoutOpts {
  productPermalink: string;
  uid: string;
  email?: string | null;
  /** Called when Gumroad reports a successful purchase (overlay closed after payment). */
  onSuccess?: () => void;
}

export async function openGumroadCheckout(opts: GumroadCheckoutOpts): Promise<void> {
  await loadGumroadScript();

  const params = new URLSearchParams({ wanted: 'true', uid: opts.uid });
  if (opts.email) params.set('email', opts.email);
  const url = `${GUMROAD_BASE}/${opts.productPermalink}?${params.toString()}`;

  // Gumroad's JS intercepts <a> clicks to gumroad.com and opens them as an
  // overlay modal on the current page. The user never navigates away.
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('data-gumroad-overlay-checkout', 'true');
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Listen for Gumroad's postMessage when the purchase completes.
  if (opts.onSuccess) {
    const handler = (e: MessageEvent) => {
      // Gumroad fires { type: 'purchase' } or the string 'purchase' on success.
      const isPurchase =
        e.data === 'purchase' ||
        (e.data && typeof e.data === 'object' && e.data.type === 'purchase');
      if (!isPurchase) return;
      window.removeEventListener('message', handler);
      opts.onSuccess!();
    };
    window.addEventListener('message', handler);
  }
}
