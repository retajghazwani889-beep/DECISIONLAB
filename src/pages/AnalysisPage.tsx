import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfile, AnalysisReport, AnalysisStatus } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { analyzeStartupIdea } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Loader2, CheckCircle2, AlertCircle, Rocket, BarChart3, ShieldAlert, Zap, Users } from 'lucide-react';
import ResultsDashboard from '../components/ResultsDashboard';

interface AnalysisPageProps {
  user: User | null;
  profile: UserProfile | null;
}

const LOADING_STEPS = [
  "Checking market demand...",
  "Analyzing competitors...",
  "Estimating growth potential...",
  "Evaluating risks...",
  "Comparing startup benchmarks..."
];

export default function AnalysisPage({ user, profile }: AnalysisPageProps) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [status, setStatus] = useState<AnalysisStatus>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAnalysis(id);
    } else if (location.state?.idea && user) {
      startNewAnalysis(location.state.idea);
    } else {
      navigate('/');
    }
  }, [id, user]);

  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const fetchAnalysis = async (analysisId: string) => {
    setStatus('processing');
    try {
      const docRef = doc(db, 'analyses', analysisId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as AnalysisReport;
        setAnalysis(data);
        setStatus(data.status);
      } else {
        setError("Analysis not found");
        setStatus('failed');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `analyses/${analysisId}`);
    }
  };

  const startNewAnalysis = async (idea: string) => {
    setStatus('processing');
    const analysisId = `analysis_${Date.now()}`;
    const newAnalysis: AnalysisReport = {
      id: analysisId,
      userId: user!.uid,
      ideaDescription: idea,
      status: 'processing',
      createdAt: serverTimestamp(),
    };

    try {
      // 1. CLEAR previous state in profile for a fresh start
      await updateDoc(doc(db, 'profiles', user!.uid), {
        companyAnalysis: null,
        pitchDeck: null,
        updatedAt: serverTimestamp()
      });

      await setDoc(doc(db, 'analyses', analysisId), newAnalysis);
      
      // Perform Venture Analysis
      const isPremiumUser = profile?.subscriptionStatus === 'premium' || user?.email === 'retajghazwani889@gmail.com';
      const results = await analyzeStartupIdea(idea, isPremiumUser);
      
      const updateData = {
        ...results,
        status: 'completed' as AnalysisStatus,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'analyses', analysisId), updateData);
      
      // Update User Profile with latest analysis
      await updateDoc(doc(db, 'profiles', user!.uid), {
        companyAnalysis: results,
        pitchSummary: idea.slice(0, 500), // Set as summary if empty
        updatedAt: serverTimestamp()
      });
      
      const finalAnalysis = {
        ...newAnalysis,
        ...results,
        status: 'completed' as AnalysisStatus,
        updatedAt: new Date(), // Mock for UI since serverTimestamp is pending
      };

      setAnalysis(finalAnalysis);
      setStatus('completed');
      
      // Navigate to the ID-based URL without refreshing to update browser history
      window.history.replaceState(null, '', `/analysis/${analysisId}`);
    } catch (err: any) {
      console.error("Analysis Error Details:", err);
      setError(err?.message || "Failed to analyze idea. Please try again.");
      setStatus('failed');
      
      // Attempt to save failure status if possible
      try {
        await updateDoc(doc(db, 'analyses', analysisId), { 
          status: 'failed',
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Could not update failure status:", e);
      }
      
      handleFirestoreError(err, OperationType.WRITE, `analyses/${analysisId}`);
    }
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-brand-bg relative overflow-hidden">
        {/* Ambient background particles */}
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/5 blur-[120px] rounded-full animate-pulse" />
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-purple/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative w-48 h-48 mb-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-[1px] border-white/5 border-t-brand-accent rounded-full shadow-[0_0_40px_rgba(77,163,255,0.1)]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 border-[1px] border-white/5 border-b-brand-purple rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="relative"
            >
               <Rocket className="text-brand-accent" size={56} strokeWidth={1.5} />
               <div className="absolute inset-0 blur-xl bg-brand-accent/30 -z-10" />
            </motion.div>
          </div>
        </div>

        <div className="text-center relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={loadingStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-black text-brand-text-primary tracking-tighter uppercase font-display">
                {LOADING_STEPS[loadingStep]}
              </h2>
              <p className="text-brand-text-muted font-black text-sm uppercase tracking-[0.4em] opacity-40 max-w-lg mx-auto leading-relaxed">
                Evaluating structural integrity & venture viability benchmarks
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-20 flex items-center gap-2">
          {LOADING_STEPS.map((_, idx) => (
            <div key={idx} className="relative">
              <div
                className={cn(
                  "w-12 h-1 rounded-full transition-all duration-700",
                  idx <= loadingStep ? 'bg-brand-accent shadow-[0_0_15px_rgba(77,163,255,0.5)]' : 'bg-white/5'
                )}
              />
              {idx === loadingStep && (
                <motion.div 
                  layoutId="indicator"
                  className="absolute -top-1 -left-1 w-14 h-3 bg-brand-accent/20 blur-md rounded-full"
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-12 flex items-center gap-4 text-xs font-black text-brand-text-muted uppercase tracking-widest opacity-30">
           <Zap size={16} /> 
           <span>Venture Logic Engine Active</span>
           <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1 h-1 rounded-full bg-brand-accent" 
                />
              ))}
           </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-brand-bg">
        <div className="w-24 h-24 bg-brand-coral/10 border border-brand-coral/20 text-brand-coral rounded-[2rem] flex items-center justify-center mb-10 shadow-huge">
          <AlertCircle size={48} strokeWidth={1.5} />
        </div>
        <h2 className="text-4xl font-black text-brand-text-primary mb-6 text-center uppercase tracking-tighter font-display">Analysis Interrupted</h2>
        <p className="text-brand-text-muted mb-14 max-w-md text-center font-bold text-xs leading-relaxed">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-12 py-6 bg-brand-section border border-white/5 text-brand-text-primary font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-white/5 transition-all active:scale-95 shadow-huge"
        >
          Return to Launchpad
        </button>
      </div>
    );
  }

  if (status === 'completed' && analysis) {
    return (
      <div className="bg-brand-bg min-h-screen">
        <div className="max-w-[1400px] mx-auto py-24">
          <ResultsDashboard analysis={analysis} profile={profile} />
        </div>
      </div>
    );
  }

  return null;
}
