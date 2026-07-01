import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfile, AnalysisReport } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, AlertCircle, ArrowLeft, RefreshCw, Briefcase, ArrowRight, Mail } from 'lucide-react';
import ResultsDashboard from '../components/ResultsDashboard';

interface StartupDashboardPageProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function StartupDashboardPage({ user, profile }: StartupDashboardPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cameFromInvestorList = searchParams.get('investor') === '1';

  const getInitialState = () => {
    if (id) {
      try {
        const cached = localStorage.getItem('cached_analyses');
        if (cached) {
          const allAnalyses = JSON.parse(cached) as AnalysisReport[];
          const found = allAnalyses.find(item => item.id === id);
          if (found && found.status === 'completed') {
            console.log("Eager Cache Match in StartupDashboardPage:", id);
            return { analysis: found, status: 'completed' as const, error: null };
          }
        }
      } catch (err) {
        console.warn("Error reading cache on startup dashboard:", err);
      }
    }
    return { analysis: null, status: 'loading' as const, error: null };
  };

  const initialState = React.useMemo(() => getInitialState(), [id]);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(initialState.analysis);
  const [status, setStatus] = useState<'loading' | 'completed' | 'failed'>(initialState.status);
  const [error, setError] = useState<string | null>(initialState.error);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (status === 'completed' && analysis) {
      console.log("REPORT_PAGE_LOADED");
    }
  }, [status, !!analysis]);

  useEffect(() => {
    if (!id) {
      navigate('/dashboard');
      return;
    }

    if (analysis && status === 'completed' && retryKey === 0) {
      return;
    }

    const fetchProject = async () => {
      try {
        setStatus('loading');
        setError(null);
        
        console.log("Fetching project from firestore:", id);
        const docRef = doc(db, 'analyses', id);
        
        let docSnap;
        let isLoaded = false;

        // Tier 1: Try client-side Firestore SDK lookup
        try {
          docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as AnalysisReport;
            if (data.status === 'completed') {
              setAnalysis(data);
              setStatus('completed');
              isLoaded = true;
              
              try {
                const cached = localStorage.getItem('cached_analyses');
                let list: any[] = cached ? JSON.parse(cached) : [];
                if (!Array.isArray(list)) list = [];
                const idx = list.findIndex(item => item.id === id);
                if (idx > -1) {
                  list[idx] = { ...list[idx], ...data };
                } else {
                  list.push(data);
                }
                localStorage.setItem('cached_analyses', JSON.stringify(list));
              } catch (_) {}
            } else {
              console.warn(`Analysis found but has status: ${data.status}. Redirecting to progress tracker.`);
              navigate(`/analyze`, { state: { idea: data.ideaDescription } });
              return;
            }
          }
        } catch (dbErr: any) {
          console.warn("Client getDoc failed (offline, timeout, or blocked inside iframe). Trying Backup Server Proxy API:", dbErr);
        }

        // Tier 2: Try Server Proxy API fetch
        if (!isLoaded) {
          try {
            const apiRes = await fetch(`/api/analyses/${id}`);
            if (apiRes.ok) {
              const apiJson = await apiRes.json();
              if (apiJson && apiJson.found && apiJson.data) {
                console.log("Loaded analysis successfully via stable Server Firestore proxy API!");
                const data = apiJson.data as AnalysisReport;
                if (data.status === 'completed') {
                  setAnalysis(data);
                  setStatus('completed');
                  isLoaded = true;
                  
                  try {
                    const cached = localStorage.getItem('cached_analyses');
                    let list: any[] = cached ? JSON.parse(cached) : [];
                    if (!Array.isArray(list)) list = [];
                    const idx = list.findIndex(item => item.id === id);
                    if (idx > -1) {
                      list[idx] = { ...list[idx], ...data };
                    } else {
                      list.push(data);
                    }
                    localStorage.setItem('cached_analyses', JSON.stringify(list));
                  } catch (_) {}
                } else {
                  navigate(`/analyze`, { state: { idea: data.ideaDescription } });
                  return;
                }
              }
            }
          } catch (apiErr) {
            console.error("Backup Server Proxy API also failed:", apiErr);
          }
        }

        // Tier 3: Search localStorage for recently generated caches or shell records
        if (!isLoaded) {
          const cached = localStorage.getItem('cached_analyses');
          if (cached) {
            try {
              const allAnalyses = JSON.parse(cached) as AnalysisReport[];
              const found = allAnalyses.find(item => item.id === id);
              if (found) {
                if (found.status === 'completed') {
                  console.log("Offline cache match successfully loaded:", id);
                  setAnalysis(found);
                  setStatus('completed');
                  isLoaded = true;
                  return;
                } else {
                  console.warn("Offline cache found in-progress analysis. Navigating to analyzer.");
                  navigate(`/analyze`, { state: { idea: found.ideaDescription || "" } });
                  return;
                }
              }
            } catch (_) {}
          }
        }

        // FIX: Tier 4 used to be a "Dynamic on-the-fly analytical synthesis fallback"
        // that fabricated a completely fake but professional-looking completed
        // analysis (hardcoded scores: overall 85, ideaStrength 75, marketFit 80,
        // execution 82, scalability 85, competition 88, investorAppeal 84;
        // fake competitors, fake TAM/SAM/SOM, fake investor matches, etc.) whenever
        // the real project genuinely could not be found anywhere — Firestore, the
        // server proxy, and local cache all came up empty. That fake data was
        // indistinguishable from a real analysis in the UI, which is part of why
        // scores looked "stuck" on the same numbers across different ideas.
        // We no longer fabricate a stand-in analysis. If the project truly isn't
        // found anywhere, show a real error and let the person retry or go back —
        // never silently substitute invented numbers for a venture they asked
        // DecisionLab to analyze.
        if (!isLoaded) {
          console.warn("Project not found in Firestore, proxy API, or local cache:", id);
          setError("This venture analysis could not be found. It may still be generating, or the connection was interrupted before it finished saving.");
          setStatus('failed');
        }
      } catch (err: any) {
        console.error("General error handler triggered during fetchProject:", err);
        setError(err.message || "An unexpected error occurred while loading this venture project.");
        setStatus('failed');
      }
    };

    fetchProject();
  }, [id, navigate, retryKey]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#08131D] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-12 h-12 text-[#5ce1e6] animate-spin" />
          <div className="text-[11px] font-black text-[#5ce1e6] uppercase tracking-[0.4em] animate-pulse">
            LOADING VC COMMAND CENTER
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed' || !analysis) {
    return (
      <div className="min-h-screen bg-[#08131D] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-brand-coral/15 border border-brand-coral/25 text-brand-coral rounded-3xl flex items-center justify-center mb-10 shadow-huge">
          <AlertCircle size={40} strokeWidth={1.5} />
        </div>
        <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter font-display">Venture Project Missing</h3>
        <p className="text-brand-text-muted mb-12 max-w-md font-medium text-base leading-relaxed">
          {error || "The requested analysis is either not verified or belongs to another workspace portfolio."}
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setRetryKey(k => k + 1)}
            className="px-10 py-5 bg-brand-accent text-brand-text-primary font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all flex items-center gap-2.5 active:scale-95 shadow-lg cursor-pointer"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-10 py-5 bg-[#0b1420] border border-white/5 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white/5 transition-all flex items-center gap-2.5 active:scale-95 shadow-lg shadow-black/40 cursor-pointer"
          >
            <ArrowLeft size={16} />
            Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  // Investor view: forced when opened from the investor list, or when the
  // viewer isn't the owner. Founders viewing their own startup see everything.
  const isOwnerViewing = !!analysis?.userId && analysis.userId === user?.uid;
  const investorMode = cameFromInvestorList || (!!analysis?.userId && !isOwnerViewing);

  const founderName =
    (analysis as any)?.shareFounderName || (isOwnerViewing ? (profile?.fullName || user?.displayName || '') : '');
  const founderEmail =
    (analysis as any)?.shareFounderEmail || (isOwnerViewing ? ((profile as any)?.email || user?.email || '') : '');
  const companyName = (analysis as any)?.startupProfile?.companyName || (analysis as any)?.ideaDescription || 'this startup';

  const requestPitchDeck = () => {
    const subject = encodeURIComponent(`Pitch deck request — ${companyName}`);
    const body = encodeURIComponent(
      `Hi${founderName ? ' ' + founderName : ''},\n\nI'm an investor on DecisionLab and I'd love to see the pitch deck for ${companyName}. Could you share it when you get a chance?\n\nThank you!`
    );
    window.location.href = `mailto:${founderEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-[#102434] min-h-screen">
      <div className="max-w-[1400px] mx-auto py-12 md:py-24 px-4 sm:px-6">
        <ResultsDashboard analysis={analysis} profile={profile} investorView={investorMode} />

        {investorMode && (
          <div className="mt-10 bg-[#0b1a26] border border-white/10 rounded-[2rem] p-8 sm:p-10 text-center">
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-display mb-2">
              Interested in this startup?
            </h3>
            <p className="text-sm text-brand-text-secondary font-medium mb-8 max-w-md mx-auto leading-relaxed">
              If it's a fit, request the pitch deck from the founder. If not, head back to your other matches.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={requestPitchDeck}
                disabled={!founderEmail}
                className="w-full sm:w-auto px-8 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:scale-100"
              >
                <Briefcase size={15} /> Yes — request pitch deck
              </button>
              <button
                onClick={() => navigate('/investor-network')}
                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/15 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={15} /> Not for me — view others
              </button>
            </div>
            {founderEmail && (
              <p className="mt-6 text-xs text-brand-text-muted font-medium flex items-center justify-center gap-2">
                <Mail size={12} /> Founder: {founderName ? founderName + ' • ' : ''}{founderEmail}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}