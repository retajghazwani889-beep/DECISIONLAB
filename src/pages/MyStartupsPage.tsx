import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Rocket, Plus, Loader2, ArrowRight, Pencil, X, Sparkles, Building2, FileText, Presentation, Link2, ArrowLeftRight } from 'lucide-react';
import { hasAccess } from '../lib/tiers';
import { UpgradePrompt } from '../components/UpgradeGate';

// ─────────────────────────────────────────────────────────────────────────────
// MyStartupsPage — the founder's homepage. Every startup as a card with its
// score, stage, team status, and last update. Drafts show setup progress and
// resume the wizard. "+ Create Startup" asks New Idea vs Existing Company.
// ─────────────────────────────────────────────────────────────────────────────

const WIZARD_STEPS = 7;

// Free plan ("Startup at a Glance") includes exactly 1 startup idea.
// Founder/Growth tiers get unlimited.
const FREE_STARTUP_LIMIT = 1;

export default function MyStartupsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [startups, setStartups] = useState<any[]>([]);
  const [analysesByStartup, setAnalysesByStartup] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateChoice, setShowCreateChoice] = useState(false);
  const [showLimitPrompt, setShowLimitPrompt] = useState(false);
  const [quickIdea, setQuickIdea] = useState('');
  const [showQuickIdea, setShowQuickIdea] = useState(false);

  // Tier lock: free users can create their first startup, then must upgrade.
  const atFreeLimit = !hasAccess(profile, 'founder') && startups.length >= FREE_STARTUP_LIMIT;
  const handleCreateClick = () => {
    if (atFreeLimit) setShowLimitPrompt(true);
    else setShowCreateChoice(true);
  };

  // ── Legacy analyses (pre-workspace, not linked to any startup) ──
  const [legacy, setLegacy] = useState<any[]>([]);
  const [linkTargets, setLinkTargets] = useState<Record<string, string>>({});
  const [linkingId, setLinkingId] = useState('');
  const linkLegacy = async (analysisId: string) => {
    const target = linkTargets[analysisId];
    if (!target) return;
    setLinkingId(analysisId);
    try {
      await updateDoc(doc(db, 'analyses', analysisId), { startupId: target });
      const a = legacy.find((x) => x.id === analysisId);
      setLegacy((arr) => arr.filter((x) => x.id !== analysisId));
      if (a) setAnalysesByStartup((m: any) => ({ ...m, [target]: m[target] || { ...a, startupId: target } }));
    } catch (e) { console.warn('Link failed:', e); }
    finally { setLinkingId(''); }
  };

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [sSnap, aSnap] = await Promise.all([
          getDocs(query(collection(db, 'startups'), where('founderId', '==', user.uid))),
          getDocs(query(collection(db, 'analyses'), where('userId', '==', user.uid))),
        ]);
        if (cancelled) return;
        const list = sSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        list.sort((a, b) => (b.updatedAt?.toDate?.()?.getTime?.() || 0) - (a.updatedAt?.toDate?.()?.getTime?.() || 0));
        setStartups(list);
        // Map the newest analysis to each startup (analyses saved with startupId),
        // and keep the unlinked ones for the Legacy section below the grid.
        const all = aSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        const map: Record<string, any> = {};
        all.forEach((a) => {
          if (!a.startupId) return;
          const prev = map[a.startupId];
          const t = (x: any) => x?.createdAt?.toDate?.()?.getTime?.() || 0;
          if (!prev || t(a) > t(prev)) map[a.startupId] = a;
        });
        setAnalysesByStartup(map);
        setLegacy(all.filter((a) => !a.startupId && a.status !== 'failed')
          .sort((a, b) => (b.createdAt?.toDate?.()?.getTime?.() || 0) - (a.createdAt?.toDate?.()?.getTime?.() || 0)));
      } catch (e) { console.warn('Startups load failed:', e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const scoreOf = (s: any): number | null => {
    const a = analysesByStartup[s.id];
    if (!a) return null;
    const v = Number(a.overallScore ?? a.shareScore ?? a.scores?.overall ?? a.readinessScore ?? NaN);
    return !isNaN(v) && v > 0 ? v : null;
  };

  const teamLabel = (s: any) => {
    if (s.hasTeam === true) {
      const n = (s.members || []).length;
      return n > 0 ? `Team: ${n} member${n === 1 ? '' : 's'}` : 'Team: Yes';
    }
    if (s.hasTeam === false) return 'Team: Founder only';
    return null;
  };

  const lastUpdated = (s: any) => {
    const d = s.updatedAt?.toDate?.();
    if (!d) return null;
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Last updated today';
    return 'Updated ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary px-6 py-14">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] block mb-3">Founder Workspace</span>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display">My Startups</h1>
            <p className="text-sm text-brand-text-secondary font-medium mt-2">Manage and grow all your startups from one place.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/compare')}
              className="px-6 py-4 bg-brand-card border border-white/10 text-brand-text-primary text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center gap-2"
            >
              <ArrowLeftRight size={15} /> Compare
            </button>
            <button
              onClick={handleCreateClick}
              className="px-8 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-huge shadow-brand-accent/20 flex items-center gap-2"
            >
              <Plus size={16} /> Create Startup
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>
        ) : startups.length === 0 ? (
          <div className="py-20 text-center bg-brand-section/30 rounded-[3rem] border border-dashed border-white/5 max-w-xl mx-auto px-8">
            <Rocket size={40} strokeWidth={1} className="mx-auto text-brand-accent mb-6" />
            <h3 className="text-xl font-black uppercase tracking-tight font-display mb-3">No startups yet</h3>
            <p className="text-sm text-brand-text-secondary font-medium mb-8 max-w-sm mx-auto">Create your first startup and DecisionLab will walk you through the setup.</p>
            <button onClick={handleCreateClick} className="inline-flex items-center gap-2 px-8 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all">
              <Plus size={15} /> Create Startup
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {startups.map((s) => {
              const isDraft = s.status !== 'complete';
              const score = scoreOf(s);
              const team = teamLabel(s);
              const updated = lastUpdated(s);
              const setupPct = Math.min(100, Math.round(((s.wizardStep || 0) / WIZARD_STEPS) * 100));
              return (
                <div key={s.id} className="bg-brand-section border border-brand-border rounded-[2rem] p-7 flex flex-col hover:border-brand-accent/40 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-black shrink-0">
                          {(s.name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <h3 className="text-base font-black uppercase tracking-tight truncate">{s.name || 'Untitled'}</h3>
                    </div>
                    <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${isDraft ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {isDraft ? 'Draft' : 'Active'}
                    </span>
                  </div>

                  {isDraft ? (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-muted">Setup {setupPct}% complete</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${setupPct}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {score !== null && <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">{score}% Score</span>}
                      {s.stage && <span className="text-[9px] font-black uppercase text-[#5da9ff] tracking-widest bg-[#5da9ff]/5 px-2.5 py-1 rounded-lg border border-[#5da9ff]/10 truncate max-w-[130px]">{s.stage}</span>}
                    </div>
                  )}

                  <div className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest space-y-1 flex-1">
                    {team && <div>{team}</div>}
                    {updated && <div>{updated}</div>}
                  </div>

                  <button
                    onClick={() => navigate(isDraft ? `/setup/startup?id=${s.id}` : `/startups/${s.id}`)}
                    className="mt-5 w-full py-3.5 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isDraft ? <><Pencil size={13} /> Continue Setup</> : <>Open Workspace <ArrowRight size={13} /></>}
                  </button>
                  {!isDraft && analysesByStartup[s.id] && (
                    <button
                      onClick={() => navigate(`/dashboard/startup/${analysesByStartup[s.id].id}/overview?tab=team`)}
                      className="mt-2 w-full py-3 bg-brand-card border border-white/10 text-brand-text-primary text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      TeamLab — Build Your Team
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Legacy analyses & pitch decks (from before the workspace era) ── */}
      {!loading && legacy.length > 0 && (
        <div className="max-w-5xl mx-auto mt-16">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight font-display">Standalone Analyses</h2>
              <p className="text-xs text-brand-text-secondary font-medium mt-1">
                Analyses not attached to a startup yet — including quick idea checks. Link one to a startup to bring its score and report into that workspace.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {legacy.map((a) => {
              const score = Number(a.overallScore ?? a.shareScore ?? a.scores?.overall ?? NaN);
              const deckSlides = a.pitchDeckData?.slides || a.pitchReadiness?.slides || [];
              const created = a.createdAt?.toDate?.()
                ? a.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
              return (
                <div key={a.id} className="bg-brand-section border border-brand-border rounded-[1.75rem] p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black uppercase tracking-tight truncate">
                        {a.startupProfile?.companyName || a.projectName || a.ideaDescription?.slice(0, 60) || 'Analysis'}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {!isNaN(score) && score > 0 && (
                          <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">{Math.round(score)}% Score</span>
                        )}
                        {deckSlides.length > 0 && (
                          <span className="text-[9px] font-black uppercase text-[#5da9ff] tracking-widest bg-[#5da9ff]/5 px-2.5 py-1 rounded-lg border border-[#5da9ff]/10 flex items-center gap-1">
                            <Presentation size={10} /> Deck · {deckSlides.length} slides
                          </span>
                        )}
                        {created && <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-muted">{created}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button onClick={() => navigate(`/dashboard/startup/${a.id}/overview`)}
                        className="px-4 py-2.5 bg-brand-card border border-white/10 text-brand-text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center gap-1.5">
                        <FileText size={12} /> Open Report
                      </button>
                      {deckSlides.length > 0 && (
                        <button onClick={() => navigate(`/pitch-deck?projectId=${a.id}`)}
                          className="px-4 py-2.5 bg-brand-card border border-white/10 text-brand-text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center gap-1.5">
                          <Presentation size={12} /> Open Deck
                        </button>
                      )}
                      {startups.length > 0 && (
                        <div className="flex items-center gap-2">
                          <select
                            value={linkTargets[a.id] || ''}
                            onChange={(e) => setLinkTargets((m) => ({ ...m, [a.id]: e.target.value }))}
                            className="bg-brand-card border border-white/10 rounded-xl px-3 py-2.5 text-[11px] text-brand-text-primary focus:outline-none appearance-none max-w-[160px]"
                          >
                            <option value="" className="bg-[#102434]">Link to startup…</option>
                            {startups.map((s) => <option key={s.id} value={s.id} className="bg-[#102434]">{s.name || 'Untitled'}</option>)}
                          </select>
                          <button onClick={() => linkLegacy(a.id)} disabled={!linkTargets[a.id] || linkingId === a.id}
                            className="px-4 py-2.5 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5">
                            {linkingId === a.id ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />} Link
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Free plan limit reached → upgrade prompt */}
      {showLimitPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowLimitPrompt(false)}>
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowLimitPrompt(false)} className="absolute top-4 right-4 z-10 text-brand-text-muted hover:text-white transition-colors"><X size={18} /></button>
            <UpgradePrompt
              requiredTier="founder"
              featureName="Unlimited Startup Ideas"
              description="The free plan includes 1 startup idea. Upgrade to Startup Validation ($39/mo) to create unlimited startups — your current startup and all its analyses stay exactly where they are."
            />
          </div>
        </div>
      )}

      {/* Create chooser: New Startup Idea vs Existing Startup */}
      {showCreateChoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-section border border-brand-border rounded-[2.5rem] max-w-md w-full p-8 relative">
            <button onClick={() => setShowCreateChoice(false)} className="absolute top-6 right-6 text-brand-text-muted hover:text-white transition-colors"><X size={18} /></button>
            <h3 className="text-xl font-black uppercase tracking-tight font-display mb-6">What would you like to create?</h3>
            <div className="space-y-3">
              <button onClick={() => navigate('/setup/startup?kind=new')} className="w-full text-left p-5 rounded-[1.75rem] bg-brand-card border border-white/5 hover:border-brand-accent/40 transition-all active:scale-[0.99] flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0"><Sparkles size={20} /></div>
                <div><h4 className="text-sm font-black uppercase tracking-tight">New Startup Idea</h4><p className="text-xs text-brand-text-secondary font-medium mt-0.5">Starting fresh from an idea.</p></div>
              </button>
              <button onClick={() => navigate('/setup/startup?kind=existing')} className="w-full text-left p-5 rounded-[1.75rem] bg-brand-card border border-white/5 hover:border-brand-accent/40 transition-all active:scale-[0.99] flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><Building2 size={20} /></div>
                <div><h4 className="text-sm font-black uppercase tracking-tight">Existing Startup</h4><p className="text-xs text-brand-text-secondary font-medium mt-0.5">A company that already exists.</p></div>
              </button>

              {/* Quick idea check — straight to analysis, no setup */}
              {!showQuickIdea ? (
                <button onClick={() => setShowQuickIdea(true)} className="w-full text-left p-5 rounded-[1.75rem] bg-brand-card border border-white/5 hover:border-brand-accent/40 transition-all active:scale-[0.99] flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#5da9ff]/10 border border-[#5da9ff]/20 flex items-center justify-center text-[#5da9ff] shrink-0"><ArrowRight size={20} /></div>
                  <div><h4 className="text-sm font-black uppercase tracking-tight">Quick Idea Check</h4><p className="text-xs text-brand-text-secondary font-medium mt-0.5">Analyze an idea instantly — no setup.</p></div>
                </button>
              ) : (
                <div className="p-5 rounded-[1.75rem] bg-brand-card border border-[#5da9ff]/30">
                  <h4 className="text-sm font-black uppercase tracking-tight mb-3">Quick Idea Check</h4>
                  <textarea
                    value={quickIdea}
                    onChange={(e) => setQuickIdea(e.target.value)}
                    rows={3}
                    autoFocus
                    placeholder="Describe your idea in a sentence or two…"
                    className="w-full bg-brand-bg border border-white/10 rounded-2xl px-4 py-3 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors mb-3"
                  />
                  <button
                    onClick={() => { if (quickIdea.trim()) navigate('/analyze', { state: { idea: quickIdea.trim() } }); }}
                    disabled={!quickIdea.trim()}
                    className="w-full py-3 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40"
                  >
                    Analyze Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}