import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import { formatAuthError, isEmbeddedBrowser } from '../lib/utils';

// Decide where an account lands after login, based on its role/accountType.
export function dashboardPathFor(profile: any): string {
  const t = (profile as any)?.accountType || (profile as any)?.role;
  if (t === 'investor') return '/investor-matches';
  if (t === 'teamMember') return '/team';
  return '/startups'; // founder (default) — My Startups is the founder homepage
}

export default function LoginPage() {
  const { user, profile, signInWithEmail, signInWithGoogle, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [inAppBrowser] = useState(() => isEmbeddedBrowser());
  const [notice, setNotice] = useState('');

  // Once we know who they are, route to the right dashboard.
  useEffect(() => {
    if (user && profile) navigate(dashboardPathFor(profile), { replace: true });
  }, [user, profile, navigate]);

  const doLogin = async () => {
    setErr('');
    if (!email.includes('@')) return setErr('Enter a valid email.');
    if (!password) return setErr('Enter your password.');
    setBusy(true);
    try {
      await signInWithEmail(email.trim(), password);
      // routing handled by the effect once profile loads
    } catch (e: any) {
      setErr(formatAuthError(e));
      setBusy(false);
    }
  };

  const doGoogle = async () => {
    setErr('');
    setBusy(true);
    try { await signInWithGoogle(); } catch (e: any) { setErr(formatAuthError(e)); setBusy(false); }
  };

  const doForgot = async () => {
    setErr(''); setNotice('');
    if (!email.includes('@')) return setErr('Enter your email above first.');
    try { await forgotPassword(email.trim()); setNotice('Password reset link sent to your email.'); }
    catch (e: any) { setErr(formatAuthError(e)); }
  };

  const field = 'w-full bg-brand-card border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10 shadow-huge">
          <h1 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Log In</h1>
          <p className="text-sm text-brand-text-secondary font-medium mb-8">Welcome back. Continue your work.</p>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={field} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={field}
                onKeyDown={(e) => { if (e.key === 'Enter') doLogin(); }} />
            </div>
            <div className="flex justify-end">
              <button onClick={doForgot} className="text-[11px] font-bold text-brand-accent hover:underline">Forgot password?</button>
            </div>

            {err && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3">{err}</p>}
            {notice && <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">{notice}</p>}

            <button onClick={doLogin} disabled={busy} className="w-full py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} Log In
            </button>

            {inAppBrowser ? (
              <p className="text-center text-[11px] text-brand-text-secondary opacity-60 pt-1">
                For Google sign-in, open this page in your browser.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/10" /><span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">or</span><div className="flex-1 h-px bg-white/10" />
                </div>
                <button onClick={doGoogle} disabled={busy} className="w-full py-3.5 bg-brand-card border border-white/10 text-brand-text-primary text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-accent/40 active:scale-95 transition-all">
                  Continue with Google
                </button>
              </>
            )}

            <p className="text-center text-xs text-brand-text-secondary font-medium pt-2">
              New to DecisionLab?{' '}
              <Link to="/signup" className="text-brand-accent font-black hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}