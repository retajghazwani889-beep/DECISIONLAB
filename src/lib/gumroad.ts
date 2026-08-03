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

// Load Gumroad overlay script once.
let scriptLoaded = false;
function loadGumroadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://gumroad.com/js/gumroad.js';
    s.async = true;
    s.onload = () => { scriptLoaded = true; resolve(); };
    s.onerror = () => resolve(); // fail silently — fallback to same-tab
    document.head.appendChild(s);
  });
}

export async function openGumroadCheckout(opts: GumroadCheckoutOpts): Promise<void> {
  const params = new URLSearchParams({ wanted: 'true', uid: opts.uid });
  if (opts.email) params.set('email', opts.email);
  const url = `${GUMROAD_BASE}/${opts.productPermalink}?${params.toString()}`;

  await loadGumroadScript();

  // Listen for Gumroad's purchase-success postMessage.
  let handled = false;
  const onMessage = (e: MessageEvent) => {
    if (handled) return;
    // Gumroad fires { type: 'gumroad:purchase', ... } or a sale object.
    const d = e.data;
    const isPurchase =
      (typeof d === 'object' && d !== null && (d.type === 'gumroad:purchase' || d.sale)) ||
      (typeof d === 'string' && d.includes('gumroad'));
    if (isPurchase) {
      handled = true;
      window.removeEventListener('message', onMessage);
      opts.onSuccess?.();
    }
  };
  window.addEventListener('message', onMessage);

  // Trigger overlay: create a hidden anchor with the gumroad-button class and click it.
  // Gumroad's script intercepts these clicks and opens the overlay iframe.
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.className = 'gumroad-button';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  // Clean up DOM element after a tick.
  setTimeout(() => document.body.removeChild(anchor), 100);

  // Fallback: if the overlay doesn't open (script blocked, etc.), fall back to
  // same-tab navigation. The pending_upgrade in localStorage + App.tsx redirect
  // handles the return flow.
  setTimeout(() => {
    if (!handled && !document.querySelector('.gumroad-overlay-container, iframe[src*="gumroad"]')) {
      window.removeEventListener('message', onMessage);
      window.location.href = url;
    }
  }, 2000);
}
