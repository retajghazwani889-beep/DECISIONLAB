import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfile, AnalysisReport } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { Loader2, AlertCircle, ArrowLeft, RefreshCw, Briefcase, ArrowRight, Mail, Presentation, Bell, Check, User as UserAvatarIcon, Linkedin, ChevronLeft, ChevronRight, X as CloseIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ResultsDashboard from '../components/ResultsDashboard';
import FounderTimeline from '../components/FounderTimeline';
import SlideCanvas from '../components/SlideCanvas';

interface StartupDashboardPageProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function StartupDashboardPage({ user, profile }: StartupDashboardPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cameFromInvestorList = searchParams.get('investor') === '1';
  // Only needed so a freshly-logged pitch-deck request appears in Match History
  // right away rather than after a manual reload.
  const { refreshProfile } = useAuth();

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
  // Founder contact resolved by looking up the founder's profile, used as a
  // fallback for older shares whose analysis doc never saved the contact.
  const [resolvedFounder, setResolvedFounder] = useState<{ name: string; email: string } | null>(null);
  const [notifySaved, setNotifySaved] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

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
        // analysis (hardcoded scores) whenever the real project genuinely could not
        // be found anywhere. We no longer fabricate a stand-in analysis. If the
        // project truly isn't found anywhere, show a real error and let the person
        // retry or go back — never silently substitute invented numbers.
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

  // Auto-fill founder contact on a shared startup the FIRST time its owner
  // opens it, so matched investors can always see name + email (and the
  // "Request pitch deck" button works) without any manual step.
  useEffect(() => {
    const a: any = analysis;
    if (!a || !user?.uid) return;
    const isOwner = a.userId === user.uid;
    const isShared = a.sharedWithInvestors === true;
    const missingContact = !a.shareFounderName || !a.shareFounderEmail;
    if (isOwner && isShared && missingContact) {
      const nm = (profile as any)?.fullName || (profile as any)?.displayName || user.displayName || '';
      const em = (profile as any)?.email || user.email || '';
      if (nm || em) {
        updateDoc(doc(db, 'analyses', a.id || id || ''), {
          shareFounderName: nm,
          shareFounderEmail: em,
        }).catch((err) => console.warn('Could not backfill founder contact:', err));
      }
    }
  }, [analysis, user, profile, id]);

  // Investor-side fallback: if an investor opens a startup whose share never
  // saved the founder contact (older shares, before auto-save), look the founder
  // up by their userId so the contact shows and the pitch-deck button enables —
  // without waiting for the founder to re-open their own report. Best-effort;
  // silently skipped if the profile read is denied by rules.
  useEffect(() => {
    const a: any = analysis;
    if (!a || a.shareFounderEmail || !a.userId) return;
    const isInvestorAcct = (profile as any)?.accountType === 'investor';
    const isOwner = a.userId === user?.uid;
    if (!isInvestorAcct || isOwner) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'profiles', a.userId));
        if (!cancelled && snap.exists()) {
          const p = snap.data() as any;
          setResolvedFounder({ name: p.displayName || p.fullName || '', email: p.email || '' });
        }
      } catch (_) {
        /* read denied or offline — leave the button disabled */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [analysis, profile, user]);

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
  const isInvestorAccount = (profile as any)?.accountType === 'investor';
  // Only investor accounts ever see the investor view / "Interested?" bar.
  // Founder accounts always get the normal dashboard, on every project.
  const investorMode = isInvestorAccount && (cameFromInvestorList || (!!analysis?.userId && !isOwnerViewing));

  const founderName =
    (analysis as any)?.shareFounderName ||
    resolvedFounder?.name ||
    (isOwnerViewing ? (profile?.fullName || user?.displayName || '') : '');
  const founderEmail =
    (analysis as any)?.shareFounderEmail ||
    resolvedFounder?.email ||
    (isOwnerViewing ? ((profile as any)?.email || user?.email || '') : '');
  const companyName = (analysis as any)?.startupProfile?.companyName || (analysis as any)?.ideaDescription || 'this startup';

  // The founder's deck lives on the analysis as slides (same source the
  // submissions viewer renders). Submitted = slides exist.
  const deckSlides: any[] = (analysis as any)?.pitchDeckData?.slides || (analysis as any)?.pitchReadiness?.slides || [];
  // A deck is only visible to investors once the founder OFFICIALLY submits.
  // Built-but-unsubmitted decks stay private — investors see the founder's
  // timeline instead, until submission.
  const deckSubmitted = deckSlides.length > 0 && (analysis as any)?.submittedToInvestors === true;

  // "Notify me when the deck is ready" — saved on the investor's own profile.
  // New submissions already appear in the investor's Notifications, so the
  // promise is kept automatically the moment the founder submits.
  const alreadyNotifying = ((profile as any)?.deckNotifyIds || []).includes((analysis as any)?.id || id || '');
  // Inline deck viewer — opens THIS startup's deck right here, no redirects.
  const deckTemplate: string | undefined =
    (analysis as any)?.pitchDeckTemplate || (analysis as any)?.pitchDeckData?.template || undefined;
  const notifyMe = async () => {
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        deckNotifyIds: arrayUnion((analysis as any)?.id || id || ''),
      }, { merge: true });
      setNotifySaved(true);
      refreshProfile().catch(() => {});
    } catch (e) { console.warn('Notify save failed:', e); }
  };

  const requestPitchDeck = async () => {
    // Save this startup to the investor's Match History so they can find it later,
    // then refresh the profile so it shows up immediately.
    if (user?.uid) {
      try {
        await setDoc(
          doc(db, 'profiles', user.uid),
          {
            requestedStartups: arrayUnion({
              id: (analysis as any)?.id || id || '',
              companyName,
              founderName: founderName || '',
              founderEmail: founderEmail || '',
            }),
          },
          { merge: true }
        );
        await refreshProfile();
      } catch (e) {
        console.warn('Could not save request history:', e);
      }
    }
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
          <div className="mt-10 space-y-6">

            {deckSubmitted ? (
              /* ── Deck submitted: view it ── */
              <div className="bg-[#0b1a26] border border-emerald-500/20 rounded-[2rem] p-8 sm:p-10 text-center">
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-5">
                  <Check size={12} /> Pitch Deck Submitted
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-display mb-2">
                  The founder's pitch deck is ready
                </h3>
                <p className="text-sm text-brand-text-secondary font-medium mb-8 max-w-md mx-auto leading-relaxed">
                  Review the full deck, then reach out if it's a fit.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => { setSlideIdx(0); setDeckOpen((v) => !v); }}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {deckOpen ? <CloseIcon size={15} /> : <Presentation size={15} />}
                    {deckOpen ? 'Close Deck' : `View Pitch Deck — ${deckSlides.length} Slides`}
                  </button>
                  <button
                    onClick={() => navigate('/investor-network')}
                    className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/15 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={15} /> Not for me — view others
                  </button>
                </div>

                {deckOpen && deckSlides.length > 0 && (
                  <div className="mt-8 text-left">
                    <div className="rounded-[1.5rem] overflow-hidden border border-white/10 bg-black/30">
                      <SlideCanvas slide={deckSlides[slideIdx] || {}} templateName={deckTemplate} />
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <button
                        onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                        disabled={slideIdx === 0}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted tabular-nums">
                        Slide {slideIdx + 1} of {deckSlides.length}
                      </span>
                      <button
                        onClick={() => setSlideIdx((i) => Math.min(deckSlides.length - 1, i + 1))}
                        disabled={slideIdx === deckSlides.length - 1}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── No deck yet: show where the founder has reached ── */
              <div className="bg-[#0b1a26] border border-white/10 rounded-[2rem] p-8 sm:p-10">
                <div className="text-center mb-8">
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-4 py-1.5 rounded-full mb-5">
                    Pitch Deck Not Submitted Yet
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-display mb-2">
                    Where the founder has reached
                  </h3>
                  <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
                    Follow the journey below — you'll be notified the moment the pitch deck is submitted.
                  </p>
                </div>
                <FounderTimeline analysis={analysis as any} canEdit={false} />
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                  <button
                    onClick={notifyMe}
                    disabled={notifySaved || alreadyNotifying}
                    className="w-full sm:w-auto px-8 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {(notifySaved || alreadyNotifying) ? <><Check size={15} /> You'll be notified</> : <><Bell size={15} /> Notify me when it's ready</>}
                  </button>
                  <button
                    onClick={() => navigate('/investor-network')}
                    className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/15 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={15} /> Not for me — view others
                  </button>
                </div>
              </div>
            )}

            {/* ── Founder contact card ── */}
            {(founderName || founderEmail) && (
              <div className="bg-[#0b1a26] border border-white/10 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-black text-xl shrink-0">
                  {(founderName || 'F').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="text-lg font-black uppercase tracking-tight text-white truncate">{founderName || 'Founder'}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted mt-1">
                    Founder of {typeof companyName === 'string' ? companyName.slice(0, 60) : 'this startup'}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                  {(analysis as any)?.userId && (
                    <button
                      onClick={() => navigate(`/profile/${(analysis as any).userId}`)}
                      className="px-6 py-3.5 bg-brand-card border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <UserAvatarIcon size={13} /> View Profile
                    </button>
                  )}
                  {founderEmail && (
                    <button
                      onClick={requestPitchDeck}
                      className="px-6 py-3.5 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Mail size={13} /> Contact Founder
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}