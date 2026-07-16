import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Mail, Lock, User, MapPin, Loader2, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import { formatAuthError } from '../lib/utils';

export default function FounderSignUpPage() {
  const { signUpWithEmail, signInWithGoogle, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const doSignUp = async () => {
    setErr('');
    // Validate everything at once so the user fixes all issues in one pass
    // (testers hit sequential errors one by one — frustrating).
    const problems: string[] = [];
    if (!fullName.trim()) problems.push('enter your full name');
    if (!country.trim()) problems.push('enter your country');
    if (!email.includes('@')) problems.push('enter a valid email');
    if (password.length < 6) problems.push('use a password of at least 6 characters');
    if (password.length >= 6 && password !== confirm) problems.push('make both passwords match');
    if (!agreed) problems.push('agree to the Terms & Privacy Policy');
    if (problems.length > 0) return setErr('Please ' + problems.join(', ') + '.');
    setBusy(true);
    try {
      await signUpWithEmail(email.trim(), password, fullName.trim());
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          await setDoc(doc(db, 'profiles', uid), {
            uid,
            email: email.trim(),
            displayName: fullName.trim(),
            country: country.trim(),
            photoURL: null,
            accountType: 'founder',
            roleType: 'Founder',
            subscriptionStatus: 'free',
            onboardingCompleted: true,
            createdAt: serverTimestamp(),
          });
          await refreshProfile();
        } catch (e) {
          console.warn('Profile save failed (offline mode?):', e);
        }
      }
      navigate('/pricing', { replace: true, state: { fromSignup: true } });
    } catch (e: any) {
      setErr(formatAuthError(e));
      setBusy(false);
    }
  };

  const doGoogle = async () => {
    setErr('');
    if (!agreed) return setErr('Please agree to the Terms & Privacy Policy.');
    setBusy(true);
    try {
      await signInWithGoogle();
      const u = auth.currentUser;
      if (u) {
        const ref = doc(db, 'profiles', u.uid);
        let existing: any = null;
        try {
          const snap = await getDoc(ref);
          if (snap.exists()) {
            existing = snap.data();
          } else {
            await setDoc(ref, {
              uid: u.uid,
              email: u.email || '',
              displayName: u.displayName || 'Founder',
              photoURL: u.photoURL || null,
              accountType: 'founder',
              roleType: 'Founder',
              subscriptionStatus: 'free',
              onboardingCompleted: true,
              createdAt: serverTimestamp(),
            });
          }
          await refreshProfile();
        } catch (e) {
          console.warn('Profile save failed (offline mode?):', e);
        }
        const t = existing?.accountType || existing?.role;
        if (t === 'investor') navigate('/investor-matches', { replace: true });
        else if (t === 'teamMember') navigate('/team', { replace: true });
        else if (existing) navigate('/startups', { replace: true });
        else navigate('/pricing', { replace: true, state: { fromSignup: true } });
      }
    } catch (e: any) {
      setErr(formatAuthError(e));
      setBusy(false);
    }
  };

  const field = 'w-full bg-brand-card border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10 shadow-huge">
          <h1 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Founder Account</h1>
          <p className="text-sm text-brand-text-secondary font-medium mb-8">Build, validate, and grow startups.</p>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={field} />
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country (e.g. Bahrain)" className={field} />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={field} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={field} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" className={field}
                onKeyDown={(e) => { if (e.key === 'Enter') doSignUp(); }} />
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[currentColor] text-brand-accent" />
              <span className="text-xs text-brand-text-secondary font-medium">I agree to the Terms &amp; Privacy Policy.</span>
            </label>

            {err && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3">{err}</p>}

            <button onClick={doSignUp} disabled={busy} className="w-full py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} Create Founder Account
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10" /><span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">or</span><div className="flex-1 h-px bg-white/10" />
            </div>
            <button onClick={doGoogle} disabled={busy} className="w-full py-3.5 bg-brand-card border border-white/10 text-brand-text-primary text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-accent/40 active:scale-95 transition-all">
              Continue with Google
            </button>

            <p className="text-center text-xs text-brand-text-secondary font-medium pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-accent font-black hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}