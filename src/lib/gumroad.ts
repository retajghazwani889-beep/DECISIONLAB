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

  let purchaseConfirmed = false;

  // Listen for Gumroad's postMessage success event fired from the popup.
  // Only trust explicit purchase events — NOT generic strings that may include
  // "gumroad" in analytics/tracking messages sent on every page load.
  const onMessage = (e: MessageEvent) => {
    if (purchaseConfirmed) return;
    const d = e.data;
    const isSuccess =
      typeof d === 'object' && d !== null &&
      (d.type === 'gumroad:purchase' || (d.sale && typeof d.sale === 'object'));
    if (isSuccess) {
      purchaseConfirmed = true;
      window.removeEventListener('message', onMessage);
    }
  };
  window.addEventListener('message', onMessage);

  const timer = setInterval(() => {
    // BillingPage confirms tier updated → close popup and celebrate.
    if (localStorage.getItem('gumroad_confirmed')) {
      localStorage.removeItem('gumroad_confirmed');
      purchaseConfirmed = true;
      clearInterval(timer);
      window.removeEventListener('message', onMessage);
      popup.close();
      opts.onSuccess?.();
      return;
    }

    if (popup.closed) {
      clearInterval(timer);
      window.removeEventListener('message', onMessage);
      if (purchaseConfirmed) {
        // Popup closed after Gumroad fired success postMessage.
        opts.onSuccess?.();
      } else {
        // Popup closed without a confirmed purchase (error, cancel, VPN issue etc).
        // Clean up pending_upgrade so billing doesn't show false "ACTIVATING" banner.
        localStorage.removeItem('pending_upgrade');
        opts.onDismissed?.();
      }
    }
  }, 500);
}
