export const GUMROAD_PRODUCTS = {
  founder: 'rdnzb',  // Startup Validation — $39/mo
  growth:  'tqownt', // Startup Grow — $99/mo
} as const;

const GUMROAD_BASE = 'https://decisionlab888.gumroad.com/l';

export function openGumroadCheckout(opts: {
  productPermalink: string;
  uid: string;
  email?: string | null;
}): void {
  const params = new URLSearchParams({ wanted: 'true', uid: opts.uid });
  if (opts.email) params.set('email', opts.email);
  params.set('redirect_url', `${window.location.origin}/billing?upgraded=1`);
  const url = `${GUMROAD_BASE}/${opts.productPermalink}?${params.toString()}`;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
