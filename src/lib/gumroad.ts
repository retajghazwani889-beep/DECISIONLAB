export const GUMROAD_PRODUCTS = {
  founder: 'rdnzb',  // Startup Validation — $39/mo
  growth:  'tqownt', // Startup Grow — $99/mo
} as const;

const GUMROAD_BASE = 'https://decisionlab888.gumroad.com/l';

export interface GumroadCheckoutOpts {
  productPermalink: string;
  uid: string;
  email?: string | null;
  onSuccess?: () => void;
}

export function openGumroadCheckout(opts: GumroadCheckoutOpts): void {
  const params = new URLSearchParams({ wanted: 'true', uid: opts.uid });
  if (opts.email) params.set('email', opts.email);
  const url = `${GUMROAD_BASE}/${opts.productPermalink}?${params.toString()}`;

  // Open checkout as a centered popup window. Must be called synchronously
  // inside the click handler so browsers don't block it as an unsolicited popup.
  const w = 520, h = 700;
  const left = Math.max(0, (window.screen.width - w) / 2);
  const top = Math.max(0, (window.screen.height - h) / 2);
  const popup = window.open(url, 'gumroad_checkout',
    `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);

  if (!popup) {
    // Popup blocked — fall back to same-tab navigation.
    window.location.href = url;
    return;
  }

  // Poll until the popup closes (user completed or dismissed the checkout).
  // When closed after a real purchase, the webhook will have already fired
  // (or be in flight), and pending_upgrade in localStorage ensures billing
  // picks it up.
  const timer = setInterval(() => {
    if (popup.closed) {
      clearInterval(timer);
      opts.onSuccess?.();
    }
  }, 500);
}
