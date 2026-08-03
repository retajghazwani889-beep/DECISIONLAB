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
  const redirectBack = `${window.location.origin}/billing?upgraded=1`;
  const params = new URLSearchParams({
    uid: opts.uid,
    redirect: redirectBack,
    redirect_url: redirectBack,
  });
  if (opts.email) params.set('email', opts.email);
  const url = `${GUMROAD_BASE}/${opts.productPermalink}?${params.toString()}`;
  // Navigate in the same tab so the redirect_url brings users back here.
  window.location.href = url;
}
