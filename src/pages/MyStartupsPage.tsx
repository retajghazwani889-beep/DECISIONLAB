import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Rocket, Plus, Loader2, ArrowRight, Pencil, X, Sparkles, Building2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// MyStartupsPage — the founder's homepage. Every startup as a card with its
// score, stage, team status, and last update. Drafts show setup progress and
// resume the wizard. "+ Create Startup" asks New Idea vs Existing Company.
// ─────────────────────────────────────────────────────────────────────────────

const WIZARD_STEPS = 7;

export default function MyStartupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startups, setStartups] = useState<any[]>([]);
  const [analysesByStartup, setAnalysesByStartup] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateChoice, setShowCreateChoice] = useState(false);

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
        // Map the newest analysis to each startup (analyses saved with startupId).
        const map: Record<string, any> = {};
        aSnap.docs.forEach((d) => {
          const a = { id: d.id, ...(d.data() as any) };
          if (!a.startupId) return;
          const prev = map[a.startupId];
          const t = (x: any) => x?.createdAt?.toDate?.()?.getTime?.() || 0;
          if (!prev || t(a) > t(prev)) map[a.startupId] = a;
        });
        setAnalysesByStartup(map);
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
          <button
            onClick={() => setShowCreateChoice(true)}
            className="shrink-0 px-8 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-huge shadow-brand-accent/20 flex items-center gap-2"
          >
            <Plus size={16} /> Create Startup
          </button>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>
        ) : startups.length === 0 ? (
          <div className="py-20 text-center bg-brand-section/30 rounded-[3rem] border border-dashed border-white/5 max-w-xl mx-auto px-8">
            <Rocket size={40} strokeWidth={1} className="mx-auto text-brand-accent mb-6" />
            <h3 className="text-xl font-black uppercase tracking-tight font-display mb-3">No startups yet</h3>
            <p className="text-sm text-brand-text-secondary font-medium mb-8 max-w-sm mx-auto">Create your first startup and DecisionLab will walk you through the setup.</p>
            <button onClick={() => setShowCreateChoice(true)} className="inline-flex items-center gap-2 px-8 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all">
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
                </div>
              );
            })}
          </div>
        )}
      </div>

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}