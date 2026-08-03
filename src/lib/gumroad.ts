export const GUMROAD_PRODUCTS = {
  founder: 'rdnzb',  // Startup Validation — $39/mo
  growth:  'tqownt', // Startup Grow — $99/mo
} as const;

const GUMROAD_BASE = 'https://decisionlab888.gumroad.com/l';

export interface GumroadCheckoutOpts {
  productPermalink: string;
  uid: string;
  email?: string | null;
  popup?: Window | null; // pre-opened popup from the synchronous click handler
  onSuccess?: () => void;
}

export function openGumroadCheckout(opts: GumroadCheckoutOpts): void {
  const params = new URLSearchParams({ wanted: 'true', uid: opts.uid });
  if (opts.email) params.set('email', opts.email);
  const url = `${GUMROAD_BASE}/${opts.productPermalink}?${params.toString()}`;

  // Use the pre-opened popup (Chrome allows this because window.open was called
  // synchronously in the user-gesture handler). Navigate it to the checkout URL.
  const popup = opts.popup;
  if (popup && !popup.closed) {
    popup.location.href = url;
  } else {
    // Fallback: same-tab navigation. App.tsx + pending_upgrade handles return.
    window.location.href = url;
    return;
  }

  // Poll until the popup closes (user dismissed) OR billing signals payment confirmed.
  const timer = setInterval(() => {
    if (popup.closed) {
      clearInterval(timer);
      opts.onSuccess?.();
      return;
    }
    // BillingPage sets this key in localStorage when it confirms the tier upgrade.
    if (localStorage.getItem('gumroad_confirmed')) {
      localStorage.removeItem('gumroad_confirmed');
      clearInterval(timer);
      popup.close();
      opts.onSuccess?.();
    }
  }, 500);
}
