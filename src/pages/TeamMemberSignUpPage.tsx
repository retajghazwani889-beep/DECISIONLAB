import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import { formatAuthError } from '../lib/utils';
import { track } from '../lib/analytics';

export default function TeamMemberSignUpPage() {
  const { signUpWithEmail, signInWithGoogle, refreshProfile, user, profile, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const doSignUp = async () => {
    setErr('');
    if (!firstName.trim()) return setErr('Enter your first name.');
    if (!lastName.trim()) return setErr('Enter your last name.');
    if (!email.includes('@')) return setErr('Enter a valid email.');
    if (password.length < 6) return setErr('Password must be at least 6 characters.');
    if (password !== confirm) return setErr('Passwords do not match.');
    setBusy(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await signUpWithEmail(email.trim(), password, fullName);
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          await setDoc(doc(db, 'profiles', uid), {
            uid,
            email: email.trim(),
            displayName: fullName,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            photoURL: null,
            accountType: 'teamMember',
            roleType: 'Team Member',
            onboardingCompleted: true,
            signupAt: serverTimestamp(),
            emailStage: 0,
            createdAt: serverTimestamp(),
          });
          await refreshProfile();
        } catch (e) {
          console.warn('Profile save failed (offline mode?):', e);
        }
      }
      track.signupCompleted('email');
      navigate('/team', { replace: true });
    } catch (e: any) {
      setErr(formatAuthError(e));
      setBusy(false);
    }
  };

  const doGoogle = async () => {
    setErr('');
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
              displayName: u.displayName || 'Team Member',
              photoURL: u.photoURL || null,
              accountType: 'teamMember',
              roleType: 'Team Member',
              onboardingCompleted: true,
              createdAt: serverTimestamp(),
            });
            track.signupCompleted('google');
          }
          await refreshProfile();
        } catch (e) {
          console.warn('Profile save failed (offline mode?):', e);
        }
        const t = existing?.accountType || existing?.role;
        if (t === 'investor') navigate('/investor-matches', { replace: true });
        else if (t && t !== 'teamMember') navigate('/startups', { replace: true });
        else navigate('/team', { replace: true });
      }
    } catch (e: any) {
      setErr(formatAuthError(e));
      setBusy(false);
    }
  };

  const field = 'w-full bg-brand-card border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';

  // ── Already-logged-in guard ──────────────────────────────────────────────
  // Beta finding: logged-in founders clicking "join a team" hit
  // "This email is already in use" and got stuck. Instead, intercept:
  // explain the situation and offer a one-click "log out and continue".
  const accountType = (profile as any)?.accountType || '';
  const roleLabel =
    accountType === 'teamMember' ? 'Team Member'
    : accountType === 'investor' ? 'Investor'
    : 'Founder';

  // If they're already a team member, this page is pointless — send them
  // straight to their team dashboard.
  React.useEffect(() => {
    if (!loading && user && accountType === 'teamMember') {
      navigate('/team', { replace: true });
    }
  }, [loading, user, accountType, navigate]);

  const doLogoutAndContinue = async () => {
    setLoggingOut(true);
    try {
      await logout();
      // user becomes null → the guard below disappears and the form renders
    } finally {
      setLoggingOut(false);
    }
  };

  const goToMyDashboard = () => {
    if (accountType === 'investor') navigate('/investor-matches');
    else navigate('/startups');
  };

  // Show the guard only for an existing session — never mid-signup (busy),
  // otherwise the account we just created would trigger it for a moment.
  if (!loading && user && !busy) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8"><Logo /></div>
          <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10 shadow-huge">
            <h1 className="text-2xl font-black uppercase tracking-tight font-display mb-2">You're Already Logged In</h1>
            <p className="text-sm text-brand-text-secondary font-medium mb-8">
              You're currently logged in as a <span className="text-brand-text-primary font-bold">{roleLabel}</span>
              {user.email ? <> (<span className="text-brand-text-primary font-bold">{user.email}</span>)</> : null}.
              To create a separate Team Member account, log out first.
            </p>
            <div className="space-y-3">
              <button onClick={doLogoutAndContinue} disabled={loggingOut} className="w-full py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} Log Out & Continue
              </button>
              <button onClick={goToMyDashboard} disabled={loggingOut} className="w-full py-3.5 bg-brand-card border border-white/10 text-brand-text-primary text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-accent/40 active:scale-95 transition-all">
                Back To My Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10 shadow-huge">
          <h1 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Team Member Account</h1>
          <p className="text-sm text-brand-text-secondary font-medium mb-8">Join startups looking for developers, designers, marketers, advisors, and other professionals.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={field} />
              </div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={field} />
              </div>
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

            {err && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3">{err}</p>}

            <button onClick={doSignUp} disabled={busy} className="w-full py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} Create Team Member Account
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