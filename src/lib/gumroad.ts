export const GUMROAD_PRODUCTS = {
  founder: 'rdnzb',  // Startup Validation — $39/mo
  growth:  'tqownt', // Startup Grow — $99/mo
} as const;

const GUMROAD_BASE = 'https://decisionlab888.gumroad.com/l';

export interface GumroadCheckoutOpts {
  productPermalink: string;
  uid: string;
  email?: string | null;
  popup?: Window | null;
  onSuccess?: () => void;
  onDismissed?: () => void; // called when popup closed WITHOUT a confirmed payment
}

export function openGumroadCheckout(opts: GumroadCheckoutOpts): void {
  const params = new URLSearchParams({ wanted: 'true', uid: opts.uid });
  if (opts.email) params.set('email', opts.email);
  const url = `${GUMROAD_BASE}/${opts.productPermalink}?${params.toString()}`;

  const popup = opts.popup;
  if (popup && !popup.closed) {
    popup.location.href = url;
  } else {
    window.location.href = url;
    return;
  }

  // NO client-side postMessage detection — Gumroad fires purchase events before
  // the charge is actually confirmed (e.g. on card decline), so we cannot trust them.
  // The ONLY signal that triggers onSuccess is gumroad_confirmed in localStorage,
  // which is written by PremiumPage's server poll AFTER the server confirms the tier changed.

  const timer = setInterval(() => {
    if (localStorage.getItem('gumroad_confirmed')) {
      localStorage.removeItem('gumroad_confirmed');
      clearInterval(timer);
      popup.close();
      opts.onSuccess?.();
      return;
    }

    if (popup.closed) {
      clearInterval(timer);
      // Popup closed without server confirming the purchase.
      localStorage.removeItem('pending_upgrade');
      opts.onDismissed?.();
    }
  }, 500);
}
