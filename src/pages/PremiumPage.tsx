import React, { useState } from 'react';
import { Check, Zap, Rocket, Shield, Crown } from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface PremiumPageProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function PremiumPage({ user, profile }: PremiumPageProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const isPremium = profile?.subscriptionStatus === 'premium' || user?.email === 'retajghazwani889@gmail.com';

  const handleUpgrade = async () => {
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error("Auth failed:", error);
        return;
      }
    }

    setLoading(true);
    // Simulate PayPal payment processing
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'profiles', user!.uid), {
          subscriptionStatus: 'premium',
          updatedAt: serverTimestamp()
        });
        alert("Success! You are now a Premium user.");
        window.location.reload();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `profiles/${user!.uid}`);
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  const PlanCard = ({ title, price, subtitle, features, popular, cta }: any) => (
    <div className={cn(
      "relative p-8 rounded-3xl border-2 transition-all duration-500",
      popular 
      ? "bg-brand-section border-brand-accent shadow-2xl shadow-brand-accent/10 scale-110 z-10" 
      : "bg-brand-card border-brand-border/10"
    )} style={{ transitionDelay: '0.2s' }}>
      {popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-accent text-brand-text-primary text-xs font-black uppercase px-4 py-1 rounded-full tracking-widest shadow-[0_0_15px_rgba(77,163,255,0.5)]">
          Most Popular
        </div>
      )}
      
      <h3 className={cn("text-2xl font-black mb-2 font-display tracking-tight text-brand-text-primary")}>
        {title}
      </h3>
      <p className="text-brand-accent text-sm font-bold uppercase tracking-wider mb-10">{subtitle}</p>
      
      <div className="mb-12 flex items-baseline gap-2">
        <span className={cn("text-5xl font-black font-display tracking-tighter text-brand-text-primary")}>
          ${price}
        </span>
        <span className="text-brand-accent text-sm font-bold">{price === '0' ? '' : '/mo'}</span>
      </div>

      <ul className="space-y-5 mb-12">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-4">
            <div className={cn("mt-1.5 p-0.5 rounded-full shrink-0", popular ? "bg-brand-accent text-brand-text-primary shadow-[0_0_10px_rgba(77,163,255,0.3)]" : "bg-brand-accent/20 text-brand-accent")}>
              <Check size={14} strokeWidth={4} />
            </div>
            <span className={cn("text-base font-medium", popular ? "text-neutral-300" : "text-brand-accent")}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleUpgrade}
        disabled={loading || (isPremium && title !== 'Free')}
        className={cn(
          "w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-brand-accent/10",
          popular ? "bg-brand-accent text-brand-text-primary hover:bg-brand-accent/90 shadow-lg shadow-brand-accent/20" : "bg-brand-section text-brand-text-primary border border-brand-border/10 hover:border-brand-accent/50 hover:bg-brand-hover",
          isPremium && title !== 'Free' && "opacity-50 cursor-not-allowed"
        )}
      >
        {isPremium && title !== 'Free' ? 'Current Plan' : cta}
      </button>

      {popular && (
         <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 grayscale opacity-50">
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" />
            </div>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Secure Checkout</p>
         </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-32 space-y-6">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-black uppercase tracking-[0.2em] mb-6 border border-brand-accent/20">
          Capital Management
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-brand-text-primary tracking-tighter font-display leading-[1.1] uppercase">
          Institutional <br />
          <span className="text-brand-accent">Venture Analysis.</span>
        </h1>
        <p className="text-xs md:text-sm text-brand-text-muted max-w-3xl mx-auto font-medium leading-relaxed opacity-80">
          Unlock the same validation models used by firms like Greylock and Republic to vet hyper-growth opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center">
        <PlanCard 
          title="Free Baseline"
          price="0"
          subtitle="Idea market research & scoring"
          features={[
            "3 Analysis reports per month",
            "Core viability ranking",
            "Synthesized problem audit",
            "Competitive landscape map",
            "Community forum access"
          ]}
          cta="Start Free"
        />
        <PlanCard 
          title="Venture Builder"
          price="49"
          subtitle="Full institutional toolset"
          popular={true}
          features={[
            "Unlimited strategic audits",
            "Deep proprietary data access",
            "Dynamic Matchmaking Score",
            "VC & Angel firm targeting",
            "Auto-generated Deal Memorandums",
            "Priority modeling queue",
            "Premium slack community"
          ]}
          cta="Upgrade for $49/mo"
        />
        <PlanCard 
          title="Elite Lifetime"
          price="149"
          subtitle="Institutional grade, forever"
          features={[
            "Lifetime platform access",
            "DecisionLab Alpha access",
            "Custom data ingestion",
            "Dedicated analyst support",
            "Investment committee mode",
            "Permanent API access"
          ]}
          cta="Get Lifecycle Access"
        />
      </div>

      <div className="mt-32 pt-20 border-t border-white/5 text-center">
        <h2 className="text-2xl font-bold mb-12 text-brand-text-primary">Trusted by founders worldwide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700 text-brand-accent">
           <div className="flex items-center justify-center p-4"><Rocket size={32} /></div>
           <div className="flex items-center justify-center p-4"><Shield size={32} /></div>
           <div className="flex items-center justify-center p-4"><Crown size={32} /></div>
           <div className="flex items-center justify-center p-4"><Zap size={32} /></div>
        </div>
      </div>
    </div>
  );
}
