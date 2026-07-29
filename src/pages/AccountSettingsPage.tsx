import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../lib/firebase';
import { updateProfile, sendPasswordResetEmail, deleteUser, verifyBeforeUpdateEmail } from 'firebase/auth';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User as UserIcon, Mail, Lock, Trash2, Loader2, Check, Send } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// AccountSettingsPage — change name, change email (verified), password reset,
// and delete account. All real.
// ─────────────────────────────────────────────────────────────────────────────

export default function AccountSettingsPage() {
  const { user, profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const p: any = profile || {};

  const nameInitialized = useRef(false);
  const [name, setName] = useState(p.displayName || user?.displayName || '');
  useEffect(() => {
    if (nameInitialized.current) return;
    const resolved = profile?.displayName || user?.displayName || '';
    if (resolved) { setName(resolved); nameInitialized.current = true; }
  }, [profile, user]);
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const sectionCls = 'bg-brand-section border border-brand-border rounded-[2.5rem] p-8 mb-5';
  const label = 'text-[11px] font-black text-brand-text-secondary uppercase tracking-widest mb-2 block';
  const field = 'w-full bg-brand-card border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';
  const btn = 'px-6 py-3.5 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50';

  const flash = (msg: string) => { setNotice(msg); setError(''); setTimeout(() => setNotice(''), 4000); };
  const fail = (msg: string) => { setError(msg); setNotice(''); };

  const saveName = async () => {
    if (!name.trim() || !user) return fail('Enter a name.');
    setBusy('name');
    try {
      await updateProfile(auth.currentUser!, { displayName: name.trim() });
      await setDoc(doc(db, 'profiles', user.uid), { displayName: name.trim() }, { merge: true });
      await refreshProfile();
      flash('Name updated.');
    } catch (e) { console.warn(e); fail('Could not update name.'); }
    finally { setBusy(''); }
  };

  const sendReset = async () => {
    const email = user?.email;
    if (!email) return fail('No email on this account (Google sign-in accounts manage their password with Google).');
    setBusy('password');
    try {
      await sendPasswordResetEmail(auth, email);
      flash(`Password reset link sent to ${email}.`);
    } catch (e) { console.warn(e); fail('Could not send the reset email.'); }
    finally { setBusy(''); }
  };

  const isGoogleOnly = !!user?.providerData?.length &&
    user.providerData.every((pr: any) => pr?.providerId === 'google.com');

  const changeEmail = async () => {
    if (!newEmail.includes('@')) return fail('Enter a valid new email address.');
    if (isGoogleOnly) return fail('This account signs in with Google — its email is managed in your Google account.');
    setBusy('email');
    try {
      await verifyBeforeUpdateEmail(auth.currentUser!, newEmail.trim());
      flash(`Verification link sent to ${newEmail.trim()}. Your login email changes once you confirm it, then log in with the new address.`);
      setNewEmail('');
    } catch (e: any) {
      console.warn(e);
      if (e?.code === 'auth/requires-recent-login') {
        fail('For security, changing email requires a recent login. Log out, log back in, then try again.');
      } else if (e?.code === 'auth/email-already-in-use') {
        fail('That email is already used by another account.');
      } else {
        fail('Could not start the email change. Please try again.');
      }
    } finally { setBusy(''); }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return fail('Type DELETE (in capitals) to confirm.');
    if (!window.confirm('This permanently deletes your account and profile. Are you absolutely sure?')) return;
    setBusy('delete');
    try {
      // Best-effort wipe of the user's data before removing the login.
      const wipe = async (col: string, field: string) => {
        try {
          const snap = await getDocs(query(collection(db, col), where(field, '==', user!.uid)));
          await Promise.all(snap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
        } catch { /* keep going */ }
      };
      await Promise.all([
        wipe('startups', 'founderId'),
        wipe('analyses', 'userId'),
        wipe('positions', 'founderId'),
        wipe('teams', 'founderId'),
        wipe('applications', 'applicantId'),
        wipe('pitchDecks', 'userId'),
        wipe('savedComparisons', 'userId'),
      ]);
      try { await deleteDoc(doc(db, 'profiles', user!.uid)); } catch (e) { console.warn('Profile delete failed:', e); }
      await deleteUser(auth.currentUser!);
      navigate('/', { replace: true });
    } catch (e: any) {
      console.warn(e);
      if (e?.code === 'auth/requires-recent-login') {
        fail('For security, deleting an account requires a recent login. Log out, log back in, then try again.');
      } else {
        fail('Could not delete the account. Please try again.');
      }
    } finally { setBusy(''); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary px-6 py-14">
      <div className="max-w-2xl mx-auto">
        <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] block mb-3">Account</span>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display mb-10">Account Settings</h1>

        {notice && <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-5">{notice}</p>}
        {error && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3 mb-5">{error}</p>}

        {/* Name */}
        <div className={sectionCls}>
          <label className={label + ' flex items-center gap-2'}><UserIcon size={12} /> Name</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
            <button onClick={saveName} disabled={busy === 'name'} className={btn + ' shrink-0'}>
              {busy === 'name' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
            </button>
          </div>
        </div>

        {/* Email */}
        <div className={sectionCls}>
          <label className={label + ' flex items-center gap-2'}><Mail size={12} /> Email</label>
          <p className="text-sm font-medium text-brand-text-secondary mb-4">Current: {user.email || '—'}</p>
          {isGoogleOnly ? (
            <p className="text-[10px] text-brand-text-muted font-medium">
              This account signs in with Google, so its email is managed in your Google account.
            </p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new@email.com" className={field} />
                <button onClick={changeEmail} disabled={busy === 'email'} className={btn + ' shrink-0'}>
                  {busy === 'email' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Change Email
                </button>
              </div>
              <p className="text-[10px] text-brand-text-muted font-medium mt-3">
                We send a verification link to the new address — the change applies after you confirm it.
              </p>
            </>
          )}
        </div>

        {/* Password */}
        <div className={sectionCls}>
          <label className={label + ' flex items-center gap-2'}><Lock size={12} /> Password</label>
          <p className="text-sm font-medium text-brand-text-secondary mb-4">We'll email you a secure link to set a new password.</p>
          <button onClick={sendReset} disabled={busy === 'password'} className={btn}>
            {busy === 'password' ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />} Send Password Reset Email
          </button>
        </div>

        {/* Delete Account */}
        <div className="bg-brand-section border border-brand-coral/20 rounded-[2.5rem] p-8">
          <label className={label + ' flex items-center gap-2 text-brand-coral'}><Trash2 size={12} /> Delete Account</label>
          <p className="text-sm font-medium text-brand-text-secondary mb-4">
            Permanently deletes your login, profile, startups, analyses, and applications. This cannot be undone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder='Type DELETE to confirm' className={field} />
            <button onClick={deleteAccount} disabled={busy === 'delete'}
              className="shrink-0 px-6 py-3.5 bg-brand-coral/10 border border-brand-coral/20 text-brand-coral text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-coral/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
              {busy === 'delete' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}