import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  ArrowRight, 
  Check, 
  X,
  User as UserIcon,
  Building,
  Lock,
  Loader2,
  Mail,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { safeLocalStorage as localStorage } from '../lib/storage';
import { formatAuthError } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES = [
  { id: 'Founder', desc: 'Venture Leader' },
  { id: 'Builder', desc: 'Product & Eng' },
  { id: 'Investor', desc: 'Capital & Strategy' },
  { id: 'Operator', desc: 'Growth & Systems' },
  { id: 'Student', desc: 'Academic Research' }
] as const;

const UserOnboarding: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, profile, signInWithGoogle, signInWithEmail, signUpWithEmail, forgotPassword, logout, refreshProfile } = useAuth();
  const [step, setStep] = useState(1); // 1: Auth, 3: Profile, 5: Success
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signup');
  const [flowContext, setFlowContext] = useState<'signup' | 'signin'>('signup');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [formData, setFormData] = useState({
    fullName: '',
    startupName: '',
    roleType: '' as UserProfile['roleType']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
    if (mode === 'signup' || mode === 'signin') {
      setFlowContext(mode);
    }
  }, [mode]);

  // ── Step routing ─────────────────────────────────────────────────────────
  // A user who hasn't finished onboarding must ALWAYS answer the questions
  // (step 3) before they can ever reach the success screen (step 5). This is
  // what stops the flow from jumping straight to "workspace activated" without
  // the questions being answered. A returning user who genuinely completed
  // onboarding is sent to the welcome-back screen — but only when they just
  // signed in, never mid-signup (finalizeProfile owns that transition itself).
  useEffect(() => {
    if (!isOpen) return;

    if (user && (!profile || !profile.onboardingCompleted)) {
      if (step < 3) setStep(3);
      return;
    }

    if (
      user &&
      profile?.onboardingCompleted &&
      (profile as any)?.accountType !== 'investor' &&
      flowContext === 'signin' &&
      step < 5
    ) {
      setStep(5);
    }
  }, [user, profile, isOpen, step, flowContext]);

  // Investors never see the founder onboarding/welcome flow. The moment we know
  // the signed-in account is an approved investor, close this modal and send them
  // straight to their matches dashboard — not the founder "Welcome back" screen,
  // and never the investor sign-in page while already logged in.
  useEffect(() => {
    if (!isOpen || !user || !profile) return;
    if ((profile as any).accountType === 'investor') {
      onClose();
      navigate('/investor-matches');
    }
  }, [isOpen, user, profile, navigate, onClose]);

  // Pre-fill the role step's name field with whatever we already know (the name
  // typed at signup, or the Google display name) so the user can confirm or edit
  // it rather than retype from scratch.
  useEffect(() => {
    if (step !== 3) return;
    setFormData((f) =>
      f.fullName ? f : { ...f, fullName: authForm.fullName || user?.displayName || '' }
    );
  }, [step, authForm.fullName, user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === 'signup') {
        if (!authForm.fullName || !authForm.email || !authForm.password) throw new Error("Please complete all fields.");
        setFlowContext('signup');
        await signUpWithEmail(authForm.email, authForm.password, authForm.fullName);
        setStep(3);
      } else if (mode === 'signin') {
        setFlowContext('signin');
        await signInWithEmail(authForm.email, authForm.password);
      } else if (mode === 'forgot') {
        await forgotPassword(authForm.email);
        setSuccessMsg("Reset link sent to your email.");
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizeProfile = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const chosenName = formData.fullName.trim() || authForm.fullName || user.displayName || 'User';
    const profileData: UserProfile = {
      uid: user.uid,
      userId: user.uid,
      fullName: chosenName,
      displayName: chosenName,
      email: user.email!,
      photoURL: user.photoURL,
      subscriptionStatus: 'premium', // Automatically premium for institutional setup
      startupName: formData.startupName,
      roleType: (formData.roleType as any) || 'Founder',
      onboardingCompleted: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, `profiles/${user.uid}`), profileData);
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'welcome', userData: profileData })
        });
      } catch (err) {}
      await refreshProfile();
      setFlowContext('signup'); // Ensure it stays signup context for immediate first-time entry
      setStep(5);
    } catch (error: any) {
      console.warn("Profile setup met a network check. Proceeding in offline mode:", error);
      if (error && (error.code === 'unavailable' || error.message?.includes('offline') || error.message?.includes('reach Cloud'))) {
        setError("Our system is currently operating in offline-cached mode. We've queued your profile setup—click 'Continue' to enter offline mode!");
        await refreshProfile().catch(() => {});
        setFlowContext('signup');
        setStep(5);
      } else {
        setError(error?.message || "Failed to initialize profile. Please check your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      setFlowContext('signin'); // Default to signin context for Google, profile check will fix if new
      await signInWithGoogle();
    } catch (err: any) {
      setError("Secure tunnel initialization failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#08131D]/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-md bg-[#102434] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pb-0 flex justify-between items-start">
              <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-brand-accent" />
              </div>
              <button onClick={onClose} className="p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 pt-6 overflow-y-auto max-h-[80vh]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-brand-text-primary mb-2">
                        {mode === 'signup' ? 'Start' : mode === 'signin' ? 'Access' : 'Reset'}
                      </h2>
                      <p className="text-base font-medium text-slate-300 tracking-[0.02em] leading-[1.7] opacity-95">
                        {mode === 'signup' ? 'Start your startup study now' : mode === 'signin' ? 'Continue your startup study' : 'Enter your email to recover access'}
                      </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                      {mode === 'signup' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary ml-1">Full Name</label>
                          <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <input 
                              type="text"
                              value={authForm.fullName}
                              onChange={e => setAuthForm({...authForm, fullName: e.target.value})}
                              placeholder="John Doe"
                              className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all"
                              required
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary ml-1">Work Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input 
                            type="email"
                            value={authForm.email}
                            onChange={e => setAuthForm({...authForm, email: e.target.value})}
                            placeholder="name@company.com"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      {mode !== 'forgot' && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">Password</label>
                            {mode === 'signin' && (
                              <button type="button" onClick={() => setMode('forgot')} className="text-[10px] text-brand-accent hover:underline">Forgot Password?</button>
                            )}
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <input 
                              type="password"
                              value={authForm.password}
                              onChange={e => setAuthForm({...authForm, password: e.target.value})}
                              placeholder="••••••••"
                              className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all"
                              required
                            />
                          </div>
                        </div>
                      )}

                      {mode !== 'forgot' && (
                        <div className="flex items-center justify-between px-1">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-brand-accent focus:ring-brand-accent/20 transition-all cursor-pointer" />
                            <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Remember Session</span>
                          </label>
                        </div>
                      )}

                      {error && <p className="text-xs text-[#FF6B6B] font-medium px-1">{error}</p>}
                      {successMsg && <p className="text-xs text-emerald-500 font-medium px-1">{successMsg}</p>}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-brand-accent text-[#08131D] font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20"
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                          <>
                            {mode === 'signup' ? 'Start Now' : mode === 'signin' ? 'Continue' : 'Reset Password'}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {mode !== 'forgot' && (
                        <>
                          <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">or</span>
                            <div className="h-px flex-1 bg-white/5"></div>
                          </div>

                          <button
                            type="button"
                            onClick={handleGoogleAuth}
                            className="w-full py-3 bg-white/[0.03] border border-white/5 text-brand-text-primary text-sm font-bold rounded-xl hover:bg-white/[0.06] transition-all flex items-center justify-center gap-3"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                          </button>
                        </>
                      )}

                      <div className="text-center pt-2">
                        {mode === 'forgot' ? (
                          <button type="button" onClick={() => setMode('signin')} className="text-xs text-brand-text-secondary opacity-60 hover:opacity-100 flex items-center gap-2 mx-auto">
                            <ChevronLeft className="w-4 h-4" /> Back to Login
                          </button>
                        ) : (
                          <p className="text-xs text-brand-text-secondary opacity-60">
                            {mode === 'signup' ? 'Already have access?' : "Don't have an account?"}{' '}
                            <button type="button" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')} className="text-brand-accent font-bold hover:underline">
                              {mode === 'signup' ? 'Log in' : 'Initialize Workspace'}
                            </button>
                          </p>
                        )}
                      </div>
                    </form>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Finalize</h2>
                      <p className="text-base text-slate-300 font-medium tracking-[0.02em] opacity-95">Tell us a bit more about your role</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary ml-1">Full Name</label>
                        <div className="relative">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                            placeholder="John Doe"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary ml-1">Role</label>
                        <select 
                          value={formData.roleType}
                          onChange={e => setFormData({...formData, roleType: e.target.value as any})}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all appearance-none"
                        >
                          <option value="" disabled className="bg-[#102434]">Select your role</option>
                          {ROLES.map(r => (
                            <option key={r.id} value={r.id} className="bg-[#102434]">{r.id} ({r.desc})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary ml-1">Startup/Project Name (Optional)</label>
                        <div className="relative">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input 
                            type="text"
                            value={formData.startupName}
                            onChange={e => setFormData({...formData, startupName: e.target.value})}
                            placeholder="e.g. Protocol Alpha"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={finalizeProfile}
                      disabled={isSubmitting || !formData.roleType || !formData.fullName.trim()}
                      className="w-full py-4 bg-brand-accent text-[#08131D] font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          Start Now
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <div className="text-center">
                       <button onClick={logout} className="text-xs text-brand-text-secondary opacity-40 hover:opacity-100 transition-opacity">Sign out</button>
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center py-8"
                  >
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                      className="w-20 h-20 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                    >
                      <motion.div 
                         animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                         transition={{ duration: 3, repeat: Infinity }}
                         className="absolute inset-0 bg-brand-accent rounded-full blur-xl -z-10"
                      />
                      <Check className="w-10 h-10 text-brand-accent" />
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold text-brand-text-primary mb-2">
                       {flowContext === 'signup' ? 'Welcome to DecisionLab' : `Welcome back, ${profile?.fullName?.split(' ')[0] || 'User'}`}
                    </h2>
                    <p className="text-base font-medium text-slate-300 tracking-[0.02em] opacity-95 mb-8 max-w-xs mx-auto">
                       {flowContext === 'signup' ? 'Your workspace has been activated' : 'Your workspace is ready'}
                    </p>
                    
                    <button
                      onClick={() => {
                        const pendingIdea = localStorage.getItem('pending_analysis_idea');
                        if (pendingIdea) {
                          localStorage.removeItem('pending_analysis_idea');
                          onClose();
                          navigate('/analyze', { state: { idea: pendingIdea } });
                        } else {
                          onClose();
                        }
                      }}
                      className="w-full py-4 bg-brand-accent text-[#08131D] font-bold text-sm rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Continue to Platform
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserOnboarding;