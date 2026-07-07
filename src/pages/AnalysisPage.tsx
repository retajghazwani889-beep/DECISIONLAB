import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, AnalysisReport, AnalysisStatus } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { analyzeStartupIdea } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Loader2, CheckCircle2, AlertCircle, Rocket, BarChart3, ShieldAlert, Zap, Users, RefreshCw } from 'lucide-react';
import ResultsDashboard from '../components/ResultsDashboard';
import GuaranteedAnalysisLoader from '../components/GuaranteedAnalysisLoader';
import { safeLocalStorage as localStorage } from '../lib/storage';

interface AnalysisPageProps {
  user: User | null;
  profile: UserProfile | null;
}

const LOADING_STEPS = [
  "Analyzing Idea",
  "Evaluating Market",
  "Calculating Startup Score",
  "Preparing Dashboard"
];

const inMemoryAnalysesCache: Record<string, AnalysisReport> = {};

const backupSaveToServer = async (analysisId: string, docData: any) => {
  try {
    await fetch(`/api/analyses/${analysisId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docData)
    });
    console.log("Dual-writes proxy backup successful for ID:", analysisId);
  } catch (err) {
    console.warn("Dual-writes proxy backup failed (optional fallback flow):", err);
  }
};

const generatePendingProjectName = (text: string): string => {
  const cleanText = text.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleanText.split(/\s+/).filter(w => w.length > 1);
  if (words.length > 0) {
    const name = words.slice(0, 2).map(w => w.toUpperCase()).join(' ');
    if (name.length >= 3) {
      return name;
    }
  }
  return `VENTURE ${Date.now().toString().slice(-4)}`;
};

const detectIndustry = (text: string): string => {
  const lower = text.toLowerCase();
  if (lower.includes('food') || lower.includes('restaurant') || lower.includes('menu') || lower.includes('dine') || lower.includes('eat') || lower.includes('kitchen') || lower.includes('beverage') || lower.includes('cafe')) {
    return 'Restaurant Technology';
  }
  if (lower.includes('security') || lower.includes('cyber') || lower.includes('hack') || lower.includes('protect') || lower.includes('shield') || lower.includes('auth') || lower.includes('identity')) {
    return 'Cybersecurity';
  }
  if (lower.includes('finance') || lower.includes('bank') || lower.includes('pay') || lower.includes('money') || lower.includes('ledger') || lower.includes('wallet') || lower.includes('crypto') || lower.includes('fintech')) {
    return 'Fintech';
  }
  if (lower.includes('health') || lower.includes('medical') || lower.includes('med') || lower.includes('clinic') || lower.includes('biotech') || lower.includes('doctor') || lower.includes('patient')) {
    return 'Healthcare';
  }
  if (lower.includes('ai') || lower.includes('gpt') || lower.includes('intelligence') || lower.includes('learning') || lower.includes('llm') || lower.includes('model') || lower.includes('machine learning')) {
    return 'Artificial Intelligence';
  }
  if (lower.includes('education') || lower.includes('learn') || lower.includes('teach') || lower.includes('academy') || lower.includes('school') || lower.includes('course')) {
    return 'Edtech';
  }
  return 'Technology';
};

// FIX: generateFallbackDataset() used to be called from triggerFallbackRouting()
// on EVERY timeout or exception during a real analysis call — including the
// previously-invalid Gemini model id, and a 5-second timeout that's far too
// short for a real structured Gemini response. It produced a fixed,
// professional-looking but entirely fake dataset (ideaStrength 82, marketFit 78,
// execution 80, scalability 85, competition 75, investorAppeal 81 — every single
// time, regardless of the idea) and then WROTE IT TO FIRESTORE as a permanent
// "completed" record. That's why every project looked identical and "stuck."
// This function (and all calls to it) have been removed. Real failures now
// surface as a real, retryable failure state instead of fabricated data.

export default function AnalysisPage({ user, profile }: AnalysisPageProps) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { saveAnalysisToHistory } = useAuth();

  const getInitialState = () => {
    if (id) {
      if (inMemoryAnalysesCache[id] && inMemoryAnalysesCache[id].status === 'completed') {
        console.log("Found completed analysis in memory. Starting fully complete!");
        return { analysis: inMemoryAnalysesCache[id], status: 'completed' as AnalysisStatus };
      }
      try {
        const cached = localStorage.getItem('cached_analyses');
        if (cached) {
          const allAnalyses = JSON.parse(cached) as AnalysisReport[];
          const found = allAnalyses.find(item => item.id === id);
          if (found && found.status === 'completed') {
            inMemoryAnalysesCache[id] = found;
            return { analysis: found, status: 'completed' as AnalysisStatus };
          }
        }
      } catch (_) {}
    }
    return { analysis: null, status: 'pending' as AnalysisStatus };
  };

  const initialState = React.useMemo(() => getInitialState(), [id]);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(initialState.analysis);
  const [loadingStep, setLoadingStep] = useState(0);
  const [status, setStatus] = useState<AnalysisStatus>(initialState.status);
  const [error, setError] = useState<string | null>(null);

  const [analysisResult, setAnalysisResult] = useState<AnalysisReport | null>(null);
  const [benchmarkComplete, setBenchmarkComplete] = useState(false);
  const [projectSaved, setProjectSaved] = useState(() => !!id);
  const [isSaving, setIsSaving] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (id) {
      if (analysis && analysis.id === id && status === 'completed') {
        return;
      }
      fetchAnalysis(id);
    } else if (location.state?.idea && user) {
      startNewAnalysis(location.state.idea);
    } else {
      navigate('/');
    }
  }, [id, user, retryToken]);

  useEffect(() => {
    if (id) {
      const checkEagerBypass = () => {
        if (inMemoryAnalysesCache[id] && inMemoryAnalysesCache[id].status === 'completed') {
          console.log("Eager memory cache bypass triggered! Skipping loading completely.");
          navigate(`/dashboard/startup/${id}/overview`, { replace: true });
          return true;
        }
        try {
          const cached = localStorage.getItem('cached_analyses');
          if (cached) {
            const allAnalyses = JSON.parse(cached) as AnalysisReport[];
            const found = allAnalyses.find(item => item.id === id);
            if (found && found.status === 'completed') {
              inMemoryAnalysesCache[id] = found;
              console.log("Eager localStorage cache bypass triggered! Skipping loading completely.");
              navigate(`/dashboard/startup/${id}/overview`, { replace: true });
              return true;
            }
          }
        } catch (_) {}
        return false;
      };
      checkEagerBypass();
    }
  }, [id, navigate]);

  useEffect(() => {
    if (status === 'processing') {
      console.log("Venture Logic Milestone pipeline active");
      const interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < 2) {
            return prev + 1;
          } else if (prev === 2) {
            if (analysisResult) {
              return 3;
            }
            return prev;
          } else {
            return prev;
          }
        });
      }, 900);
      return () => clearInterval(interval);
    }
  }, [status, !!analysisResult]);

  useEffect(() => {
    if (status === 'processing' && analysisResult && loadingStep === 2) {
      setLoadingStep(3);
    }
  }, [status, !!analysisResult, loadingStep]);

  const hasNavigatedRef = useRef(false);

  const fetchAnalysis = async (analysisId: string) => {
    if (analysis && analysis.id === analysisId && status === 'completed') {
      return;
    }

    if (inMemoryAnalysesCache[analysisId] && inMemoryAnalysesCache[analysisId].status === 'completed') {
      console.log("Found completed analysis in memory. Loading instantly!");
      setAnalysis(inMemoryAnalysesCache[analysisId]);
      setStatus('completed');
      return;
    }

    const cached = localStorage.getItem('cached_analyses');
    if (cached) {
      try {
        const allAnalyses = JSON.parse(cached) as AnalysisReport[];
        const found = allAnalyses.find(item => item.id === analysisId);
        if (found && found.status === 'completed') {
          console.log("Found completed analysis in cache. Loading instantly!");
          inMemoryAnalysesCache[analysisId] = found;
          setAnalysis(found);
          setStatus('completed');
          return;
        } else if (found) {
          setAnalysis(found);
          setStatus(found.status);
          if (found.status === 'completed') {
            inMemoryAnalysesCache[analysisId] = found;
            return;
          }
        }
      } catch (_) {}
    }

    setStatus('processing');

    try {
      const docRef = doc(db, 'analyses', analysisId);
      
      const docSnap = await Promise.race([
        getDoc(docRef),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout waiting for Firestore")), 8000)
        )
      ]);

      if (docSnap.exists()) {
        const data = docSnap.data() as AnalysisReport;
        setAnalysis(data);
        setStatus(data.status);
      } else {
        const cached = localStorage.getItem('cached_analyses');
        if (cached) {
          try {
            const allAnalyses = JSON.parse(cached) as AnalysisReport[];
            const found = allAnalyses.find(item => item.id === analysisId);
            if (found) {
              setAnalysis(found);
              setStatus(found.status);
              return;
            }
          } catch (_) {}
        }
        setError("Analysis not found");
        setStatus('failed');
      }
    } catch (err: any) {
      console.warn("Firestore unreachable or timed out during fetch. Checking local cache:", err);
      const cached = localStorage.getItem('cached_analyses');
      if (cached) {
        try {
          const allAnalyses = JSON.parse(cached) as AnalysisReport[];
          const found = allAnalyses.find(item => item.id === analysisId);
          if (found) {
            setAnalysis(found);
            setStatus(found.status);
            return;
          }
        } catch (_) {}
      }
      setError("Database is temporarily offline. Showing local or cached summaries if available.");
      setStatus('failed');
    }
  };

  const startNewAnalysis = async (idea: string) => {
    console.log("ANALYSIS_STARTED");
    setStatus('processing');
    setError(null);
    setProjectSaved(false);
    setIsSaving(false);
    setBenchmarkComplete(false);
    setLoadingStep(0);
    hasNavigatedRef.current = false;
    
    let analysisId = `analysis_${Date.now()}`;
    const preliminaryName = generatePendingProjectName(idea);
    const preliminaryIndustry = detectIndustry(idea);
    const preliminaryCountry = (profile?.location || '').trim().replace(/\./g, '');
    const universalTimestamp = new Date().toISOString();
    
    const normalizedIdea = idea.trim().toLowerCase();
    const cleanNewName = preliminaryName.toLowerCase().replace(/\./g, '');
    let isDuplicate = false;

    try {
      const cached = localStorage.getItem('cached_analyses');
      if (cached) {
        const list = JSON.parse(cached) as any[];
        const found = list.find(x => 
          (x.ideaDescription?.trim().toLowerCase() === normalizedIdea) ||
          (x.startupProfile?.companyName?.trim().toLowerCase().replace(/\./g, '') === cleanNewName)
        );
        if (found) {
          analysisId = found.id;
          isDuplicate = true;
          console.log("Eager deduplication matched existing ID in cache:", analysisId);
        }
      }
    } catch (_) {}

    if (!isDuplicate && user) {
      try {
        const q = query(
          collection(db, 'analyses'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const existingDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const duplicate = existingDocs.find(x => {
          const existingName = x.startupProfile?.companyName?.trim();
          const cleanExisting = existingName ? existingName.toLowerCase().replace(/\./g, '') : '';
          return (cleanExisting === cleanNewName && cleanNewName !== '') ||
                 (x.ideaDescription?.trim().toLowerCase() === normalizedIdea);
        });
        if (duplicate) {
          analysisId = duplicate.id;
          isDuplicate = true;
          console.log("Eager deduplication matched existing ID in Firestore:", analysisId);
        }
      } catch (err) {
        console.warn("Eager Firestore deduplication check failed:", err);
      }
    }

    const placeholderRecord = {
      id: analysisId,
      userId: user!.uid,
      ideaDescription: idea,
      projectName: preliminaryName,
      projectDescription: idea,
      projectIndustry: preliminaryIndustry,
      industry: preliminaryIndustry,
      startupStage: 'Pre-Seed',
      status: 'processing' as AnalysisStatus,
      targetCountry: preliminaryCountry,
      dateCreated: universalTimestamp,
      startupProfile: {
        companyName: preliminaryName,
        country: preliminaryCountry,
        city: '',
        stage: 'Pre-Seed',
        industry: preliminaryIndustry,
        detailedSector: '',
        businessType: 'B2B',
        productType: 'SaaS Platform',
        elevatorPitch: idea,
        businessDescription: idea,
        founderBackground: '',
        teamSize: 'Solo',
        logo: '',
      }
    };

    // FIX: this used to call triggerFallbackRouting(), which fabricated a fake
    // "completed" analysis with hardcoded scores and wrote it to Firestore
    // permanently. It now does the opposite: marks the placeholder record as
    // genuinely failed, surfaces a real error to the person, and lets them
    // retry — it never invents data.
    const handleAnalysisFailure = async (reason: string, err?: any) => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;

      if (err) {
        console.error("Analysis failed:", reason, err.stack || err);
      } else {
        console.warn("Analysis failed:", reason);
      }

      try {
        await setDoc(doc(db, 'analyses', analysisId), {
          userId: user!.uid,
          status: 'failed',
          failureReason: reason,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (writeErr) {
        console.warn("Could not persist failed status:", writeErr);
      }

      try {
        const cachedJson = localStorage.getItem('cached_analyses');
        let list: any[] = cachedJson ? JSON.parse(cachedJson) : [];
        if (!Array.isArray(list)) list = [];
        const idx = list.findIndex(item => item.id === analysisId);
        if (idx > -1) {
          list[idx] = { ...list[idx], status: 'failed' };
          localStorage.setItem('cached_analyses', JSON.stringify(list));
        }
      } catch (_) {}

      setError(
        err?.message
          ? `We couldn't generate this analysis: ${err.message}`
          : "We couldn't generate this analysis. Please try again — no placeholder data was saved."
      );
      setStatus('failed');
    };

    // Generous timeout — large structured Gemini responses (pitch deck, risk
    // matrix, investor matching, etc.) can legitimately take well over 5
    // seconds. We give it real time instead of silently swapping in fake data.
    const timeoutTimer = setTimeout(() => {
      handleAnalysisFailure("Analysis is taking longer than expected (60s timeout).");
    }, 60000);

    try {
      setAnalysis(placeholderRecord as any);
      const cachedJson = localStorage.getItem('cached_analyses');
      let list: any[] = cachedJson ? JSON.parse(cachedJson) : [];
      if (!Array.isArray(list)) list = [];
      const existingIdx = list.findIndex(item => item && item.id === placeholderRecord.id);
      if (existingIdx > -1) {
        list[existingIdx] = placeholderRecord;
      } else {
        list.push(placeholderRecord);
      }
      localStorage.setItem('cached_analyses', JSON.stringify(list));
    } catch (_) {}

    try {
      updateDoc(doc(db, 'profiles', user!.uid), {
        companyAnalysis: null,
        pitchDeck: null,
        updatedAt: serverTimestamp()
      }).catch(err => console.warn("Background clear profile failed:", err));

      await setDoc(doc(db, 'analyses', analysisId), {
        ...placeholderRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log("Placeholder committed to permanent database storage:", analysisId);

      const isPremiumUser = 
        profile?.subscriptionStatus === 'premium' || 
        user?.email === 'retajghazwani889@gmail.com' ||
        user?.email?.toLowerCase().includes('retaj') ||
        user?.displayName?.toLowerCase().includes('retaj') ||
        user?.displayName?.toLowerCase().includes('assad');

      const results = await analyzeStartupIdea(idea, isPremiumUser);
      console.log("ANALYSIS_COMPLETED");

      if (hasNavigatedRef.current) {
        clearTimeout(timeoutTimer);
        return;
      }

      // FIX: previously, if the model didn't return usable score data, this
      // code silently substituted overallScore = 85 (twice — once for "all
      // scores were 0" and once for "NaN/undefined"). Both magic-number
      // fallbacks are removed. If Gemini genuinely didn't return scores, that's
      // a real failure that should surface, not get papered over with a fake
      // "85%".
      const resultsScores = results?.scores;
      if (!resultsScores) {
        throw new Error("Gemini response did not include scoring data.");
      }

      const newCompanyName = results?.startupProfile?.companyName?.trim() || preliminaryName;
      let targetAnalysisId = analysisId;

      try {
        const q = query(
          collection(db, 'analyses'),
          where('userId', '==', user!.uid)
        );
        const querySnapshot = await getDocs(q);
        const existingDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalysisReport));
        
        const duplicate = existingDocs.find(x => {
          const existingName = x.startupProfile?.companyName?.trim();
          const cleanExisting = existingName ? existingName.toLowerCase().replace(/\./g, '') : '';
          const cleanNew = newCompanyName ? newCompanyName.toLowerCase().replace(/\./g, '') : '';
          return (cleanExisting === cleanNew && cleanNew !== '') ||
                 (x.ideaDescription?.trim().toLowerCase() === idea.trim().toLowerCase());
        });
        
        if (duplicate) {
          console.log("Deduplication Match Found! Updating existing project:", duplicate.id);
          targetAnalysisId = duplicate.id;
          
          if (targetAnalysisId !== analysisId) {
            deleteDoc(doc(db, 'analyses', analysisId)).catch(err => console.warn("Could not delete temp skeleton:", err));
          }
        }
      } catch (err) {
        console.warn("Deduplication check failed, falling back to cached analyses check:", err);
      }

      const getScoreVal = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'object' && typeof val?.score === 'number') return val.score;
        return null;
      };
      
      const ideaStrengthVal = getScoreVal(resultsScores.ideaStrength);
      const marketFitVal = getScoreVal(resultsScores.marketFit);
      const investorAppealVal = getScoreVal(resultsScores.investorAppeal || resultsScores.investorAttractiveness);
      const executionVal = getScoreVal(resultsScores.execution || resultsScores.executionReadiness);
      const competitionVal = getScoreVal(resultsScores.competition || resultsScores.competitiveAdvantage);

      const collectedScores = [ideaStrengthVal, marketFitVal, investorAppealVal, executionVal, competitionVal].filter(
        (v): v is number => typeof v === 'number'
      );

      if (collectedScores.length === 0) {
        throw new Error("Gemini response did not include any usable numeric scores.");
      }

      const overallScore = Math.round(collectedScores.reduce((sum, v) => sum + v, 0) / collectedScores.length);
      resultsScores.overall = overallScore;
      
      const calculatedRisk = results?.riskMatrix ? Math.round(
        ((results.riskMatrix.market?.impact + results.riskMatrix.market?.likelihood) +
         (results.riskMatrix.execution?.impact + results.riskMatrix.execution?.likelihood) +
         (results.riskMatrix.competition?.impact + results.riskMatrix.competition?.likelihood) +
         (results.riskMatrix.financial?.impact + results.riskMatrix.financial?.likelihood)) * 2.5
      ) : null;

      const calculatedGrowth = resultsScores.scalability?.score ?? resultsScores.marketFit?.score ?? null;

      const companyNameClean = (results?.startupProfile?.companyName || "Unnamed Venture").trim().replace(/\./g, '');
      const industryClean = (results?.startupProfile?.industry || preliminaryIndustry).trim().replace(/\./g, '');
      const descClean = (results?.startupProfile?.businessDescription || results?.startupProfile?.elevatorPitch || idea || "Venture Details").trim().replace(/\./g, '');

      const finalAnalysis = {
        id: targetAnalysisId,
        userId: user!.uid,
        ideaDescription: idea,
        ...results,
        startupProfile: {
          ...results?.startupProfile,
          companyName: companyNameClean,
          country: results?.startupProfile?.country || preliminaryCountry,
          city: results?.startupProfile?.city || '',
          stage: results?.startupProfile?.stage || 'Pre-Seed',
          industry: industryClean,
          businessDescription: descClean,
        },
        projectName: companyNameClean,
        projectDescription: descClean,
        projectIndustry: industryClean,
        analysisScore: overallScore,
        overallScore: overallScore,
        riskScore: calculatedRisk,
        growthScore: calculatedGrowth,
        marketData: results?.marketAnalysis || null,
        pitchDeckData: results?.pitchReadiness || null,
        status: 'completed' as AnalysisStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dateCreated: new Date().toISOString(),
      };

      console.log("REPORT_CREATED");

      try {
        const cachedJson = localStorage.getItem('cached_analyses');
        let list: any[] = cachedJson ? JSON.parse(cachedJson) : [];
        if (!Array.isArray(list)) list = [];
        const idx = list.findIndex(item => item.id === targetAnalysisId);
        if (idx > -1) {
          list[idx] = { ...list[idx], ...finalAnalysis };
        } else {
          list.push(finalAnalysis);
        }
        localStorage.setItem('cached_analyses', JSON.stringify(list));
      } catch (e) {
        console.warn("Bypass localStorage cache commit warning:", e);
      }

      try {
        saveAnalysisToHistory(finalAnalysis);
      } catch (e) {
        console.warn("Error calling saveAnalysisToHistory for finalAnalysis:", e);
      }

      inMemoryAnalysesCache[targetAnalysisId] = finalAnalysis;
      console.log("REPORT_SAVED");

      try {
        const payload = {
          ...finalAnalysis,
          status: 'completed'
        };
        backupSaveToServer(targetAnalysisId, payload);
        await setDoc(doc(db, 'analyses', targetAnalysisId), {
          ...payload,
          updatedAt: serverTimestamp()
        }, { merge: true });
        console.log("Synchronous success doc write complete:", targetAnalysisId);
      } catch (err) {
        console.warn("Synchronous success doc write failed:", err);
      }

      if (user) {
        try {
          await updateDoc(doc(db, 'profiles', user.uid), {
            companyAnalysis: finalAnalysis,
            pitchSummary: idea.slice(0, 500),
            updatedAt: serverTimestamp()
          });
          console.log("Synchronous success profile write complete");
        } catch (err) {
          console.warn("Synchronous success profile write failed:", err);
        }
      }

      hasNavigatedRef.current = true;
      clearTimeout(timeoutTimer);

      setAnalysis(finalAnalysis);
      setAnalysisResult(finalAnalysis);
      setStatus('completed');
      setProjectSaved(true);
      setBenchmarkComplete(true);

      console.log("ROUTE_TO_REPORT");
      navigate(`/dashboard/startup/${targetAnalysisId}/overview`, { replace: true });

    } catch (err: any) {
      clearTimeout(timeoutTimer);
      handleAnalysisFailure("exception", err);
    }
  };

  if (status === 'processing' && analysis?.status !== 'completed') {
    return (
      <GuaranteedAnalysisLoader 
        projectData={{
          id: analysis?.id || id,
          analysisStatus: 'Analyzing',
        }}
      />
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#102434]">
        <div className="w-24 h-24 bg-brand-coral/10 border border-brand-coral/20 text-brand-coral rounded-[2rem] flex items-center justify-center mb-10 shadow-huge">
          <AlertCircle size={48} strokeWidth={1.5} />
        </div>
        <h3 className="text-4xl font-black text-white mb-6 text-center uppercase tracking-tighter font-display">Analysis Interrupted</h3>
        <p className="text-brand-text-muted mb-14 max-w-md text-center font-bold text-lg leading-relaxed">{error}</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setRetryToken(t => t + 1)}
            className="px-12 py-6 bg-brand-accent text-brand-text-primary font-black text-sm uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all active:scale-95 shadow-huge flex items-center gap-3"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-12 py-6 bg-brand-section border border-white/5 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-white/5 transition-all active:scale-95 shadow-huge"
          >
            Return to Launchpad
          </button>
        </div>
      </div>
    );
  }

  if (status === 'completed' && analysis) {
    if (!id) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#102434] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/5 blur-[120px] rounded-full" />
          </div>
          <div className="flex flex-col items-center gap-6 relative z-10">
            <Loader2 className="w-12 h-12 text-[#5ce1e6] animate-spin" />
            <div className="text-[10px] font-black text-[#5ce1e6] uppercase tracking-[0.4em] animate-pulse">
              REDIRECTING TO VC COMMAND CENTER
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#102434] min-h-screen">
        <div className="max-w-[1400px] mx-auto py-24">
          <ResultsDashboard analysis={analysis} profile={profile} />
        </div>
      </div>
    );
  }

  return null;
}