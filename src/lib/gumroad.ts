export const GUMROAD_PRODUCTS = {
  founder: 'rdnzb',  // Startup Validation — $39/mo
  growth:  'tqownt', // Startup Grow — $99/mo
} as const;

const GUMROAD_BASE = 'https://decisionlab888.gumroad.com/l';

export interface GumroadCheckoutOpts {
  productPermalink: string;
  uid: string;
  email?: string | null;
  /** Called as soon as the server confirms the tier changed. */
  onSuccess: () => void;
}

export function openGumroadCheckout(opts: GumroadCheckoutOpts): void {
  const params = new URLSearchParams({ wanted: 'true', uid: opts.uid });
  if (opts.email) params.set('email', opts.email);
  const url = `${GUMROAD_BASE}/${opts.productPermalink}?${params.toString()}`;

  // Open Gumroad in a small popup. The main window stays on DecisionLab and
  // polls the server every 2 s. When the tier changes the popup is closed and
  // onSuccess() is called — no redirect needed.
  const popup = window.open(
    url,
    'gumroad_checkout',
    'width=760,height=700,scrollbars=yes,resizable=yes'
  );

  let closed = false;
  const finish = () => {
    if (closed) return;
    closed = true;
    clearInterval(pollInterval);
    try { popup?.close(); } catch {}
    opts.onSuccess();
  };

  // Poll /api/profile/tier every 2 s. We read the token fresh each tick so
  // token expiry never silently breaks polling during a long checkout.
  const pollInterval = setInterval(async () => {
    // If the user closed the popup themselves, stop polling.
    if (popup?.closed) {
      clearInterval(pollInterval);
      return;
    }
    try {
      const { auth } = await import('./firebase');
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch('/api/profile/tier', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const { tier } = await res.json();
      if (tier && tier !== 'free') finish();
    } catch {}
  }, 2000);

  // Safety timeout — give up after 10 min and let the user continue anyway.
  setTimeout(() => { clearInterval(pollInterval); }, 10 * 60 * 1000);
}
