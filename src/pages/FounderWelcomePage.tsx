import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { PartyPopper, Rocket, Wrench, Sparkles, ArrowRight, Clock } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// FounderWelcomePage — shown right after a founder creates their account.
// Step 1: 🎉 welcome + time estimate.  Step 2: "Do you already have a startup?"
// (and if yes, "Is it operating?").  Answers are saved to the profile, then the
// founder continues into the startup setup wizard.
// ─────────────────────────────────────────────────────────────────────────────

type Step = 'welcome' | 'hasStartup' | 'operating';

export default function FounderWelcomePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [saving, setSaving] = useState(false);

  const firstName =
    ((profile as any)?.displayName || user?.displayName || '').split(' ')[0] || '';

  const saveAndContinue = async (answers: { hasStartup: boolean; operating?: boolean }) => {
    setSaving(true);
    try {
      if (user?.uid) {
        await setDoc(doc(db, 'profiles', user.uid), {
          onboardingHasStartup: answers.hasStartup,
          onboardingStartupOperating: answers.operating ?? null,
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Could not save onboarding answers:', e);
    }
    navigate('/setup/startup');
  };

  const card = 'w-full text-left p-6 rounded-[2rem] bg-brand-section border border-brand-border hover:border-brand-accent/40 transition-all active:scale-[0.99] flex items-center gap-5 disabled:opacity-50';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl text-center">

        {step === 'welcome' && (
          <>
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
              <PartyPopper size={36} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display mb-4">
              Welcome to DecisionLab{firstName ? `, ${firstName}` : ''}!
            </h1>
            <p className="text-sm text-brand-text-secondary font-medium mb-3 leading-relaxed">
              We're going to set up your workspace.
            </p>
            <p className="text-xs font-black text-brand-text-muted uppercase tracking-widest mb-10 flex items-center justify-center gap-2">
              <Clock size={13} /> Estimated time: 3–5 minutes
            </p>
            <button
              onClick={() => setStep('hasStartup')}
              className="inline-flex items-center gap-3 px-12 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-huge shadow-brand-accent/20"
            >
              Continue <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === 'hasStartup' && (
          <>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display mb-8">
              Do you already have a startup?
            </h1>
            <div className="space-y-4 text-left">
              <button disabled={saving} onClick={() => setStep('operating')} className={card}>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><Rocket size={22} /></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Yes</h3>
                  <p className="text-xs text-brand-text-secondary font-medium mt-1">I have an existing startup or company.</p>
                </div>
              </button>
              <button disabled={saving} onClick={() => saveAndContinue({ hasStartup: false })} className={card}>
                <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0"><Sparkles size={22} /></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">No</h3>
                  <p className="text-xs text-brand-text-secondary font-medium mt-1">I'm starting fresh — create a new startup.</p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === 'operating' && (
          <>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display mb-8">
              Is it already operating?
            </h1>
            <div className="space-y-4 text-left">
              <button disabled={saving} onClick={() => saveAndContinue({ hasStartup: true, operating: true })} className={card}>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><Rocket size={22} /></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Yes</h3>
                  <p className="text-xs text-brand-text-secondary font-medium mt-1">We're live and operating.</p>
                </div>
              </button>
              <button disabled={saving} onClick={() => saveAndContinue({ hasStartup: true, operating: false })} className={card}>
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0"><Wrench size={22} /></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">No, still in development</h3>
                  <p className="text-xs text-brand-text-secondary font-medium mt-1">We're building — not launched yet.</p>
                </div>
              </button>
            </div>
          </>
        )}

        {step !== 'welcome' && (
          <button
            onClick={() => navigate('/startups')}
            className="mt-10 text-[10px] font-black text-brand-text-muted uppercase tracking-widest hover:text-white transition-colors"
          >
            Skip for now — go to dashboard
          </button>
        )}
      </div>
    </div>
  );
}