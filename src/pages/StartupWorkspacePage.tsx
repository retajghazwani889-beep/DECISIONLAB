import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  Loader2, ArrowLeft, ArrowRight, BarChart3, Presentation, Handshake,
  Users, LayoutDashboard, Pencil, MapPin, FileText, Target, TrendingUp,
  AlertTriangle, Sparkles, FolderOpen, Pencil as PencilIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// StartupWorkspacePage — the permanent home of one startup.
// Header (logo, name, score, stage) → Summary panel (analysis / team status,
// missing roles, last updated) → Quick actions → Workspace navigation into
// the full analysis report. Founders can always come back here.
// ─────────────────────────────────────────────────────────────────────────────

export default function StartupWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startup, setStartup] = useState<any | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { navigate('/startups'); return; }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'startups', id));
        if (!cancelled) setStartup(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null);
        // Look for the analysis linked to this startup (saved with startupId).
        if (user?.uid) {
          try {
            const aSnap = await getDocs(query(
              collection(db, 'analyses'),
              where('userId', '==', user.uid),
              where('startupId', '==', id),
            ));
            if (!cancelled && !aSnap.empty) {
              const rows = aSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
              rows.sort((a, b) => (b.createdAt?.toDate?.()?.getTime?.() || 0) - (a.createdAt?.toDate?.()?.getTime?.() || 0));
              setAnalysis(rows[0]);
            }
          } catch (e) { console.warn('Linked analysis lookup failed:', e); }
        }
      } catch (e) { console.warn('Workspace load failed:', e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id, user?.uid]);

  if (loading) {
    return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>;
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text-primary flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-3">Startup not found</h2>
        <button onClick={() => navigate('/startups')} className="text-brand-accent text-xs font-black uppercase tracking-widest hover:underline">← Back to My Startups</button>
      </div>
    );
  }

  const score = Number(
    analysis?.overallScore ?? analysis?.shareScore ?? analysis?.scores?.overall ?? analysis?.readinessScore ?? NaN
  );
  const hasScore = !isNaN(score) && score > 0;

  const teamCount = (startup.members || []).length;
  const missing: string[] = startup.lookingFor || [];
  const lastUpdated = startup.updatedAt?.toDate?.()
    ? startup.updatedAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : '—';

  const goAnalyze = () => {
    // The FULL founder brief from the setup wizard, so every answer the
    // founder gave is evaluated in the analysis — not just the description.
    const s = startup;
    const line = (label: string, v: any) => (v && String(v).trim() ? `${label}: ${String(v).trim()}` : '');
    const teamLine = s.hasTeam === true
      ? `Existing team: ${(s.members || []).map((m: any) => `${m.name} (${m.role})`).join(', ') || 'yes'}`
      : s.hasTeam === false
        ? (s.planningRecruit ? `Solo founder, planning to recruit: ${(s.lookingFor || []).join(', ') || 'a team'}` : 'Solo founder')
        : '';
    const idea = [
      `Startup: ${s.name || 'Untitled'}${s.tagline ? ' — ' + s.tagline : ''}`,
      line('Industry', s.industry),
      line('Business stage', s.stage),
      line('Location', [s.city, s.country].filter(Boolean).join(', ')),
      line('Description', s.description),
      line('Problem being solved', s.problem),
      line('Target customer', s.targetCustomer),
      line('Solution', s.solution),
      line('Business model', s.businessModel),
      line('Revenue stream', s.revenueStream),
      line('Product type', s.productType),
      line('Website', s.website || s.linkWebsite),
      line('Founder', [s.founderName, s.founderRole].filter(Boolean).join(', ')),
      line('Founder experience', s.founderExperience),
      line('Founder education', s.founderEducation),
      line('Startup story', s.story),
      line('Elevator pitch', s.elevatorPitch),
      teamLine,
    ].filter(Boolean).join('\n');
    // startupId + returnTo let the analysis link itself to this startup and
    // bring the founder straight back to this workspace afterwards.
    navigate('/analyze', { state: { idea, startupId: startup.id, returnTo: `/startups/${startup.id}` } });
  };

  const openReport = (tab?: string) => {
    if (!analysis) return;
    navigate(`/dashboard/startup/${analysis.id}/overview`);
  };

  const summaryItems = [
    { label: 'Startup Score', value: hasScore ? `${score}%` : 'Not analyzed yet', accent: hasScore },
    { label: 'Current Stage', value: startup.stage || '—' },
    { label: 'Analysis Status', value: analysis ? 'Complete' : 'Not run yet' },
    { label: 'Team Status', value: startup.hasTeam === true ? `${teamCount || 'Some'} member${teamCount === 1 ? '' : 's'}` : startup.hasTeam === false ? 'Founder only' : '—' },
    { label: 'Missing Roles', value: missing.length ? missing.join(', ') : 'None listed' },
    { label: 'Last Updated', value: lastUpdated },
  ];

  const quickActions = [
    { icon: BarChart3, title: analysis ? 'Re-run Analysis' : 'Analyze Startup', onClick: goAnalyze },
    { icon: Presentation, title: 'Build Pitch Deck', onClick: () => navigate(analysis ? `/pitch-deck?projectId=${analysis.id}` : '/pitch-deck') },
    { icon: Handshake, title: 'Find Investors', onClick: () => navigate('/investor-network') },
    { icon: Users, title: 'TeamLab', onClick: () => (analysis ? openReport() : navigate('/dashboard')) },
  ];

  const workspaceNav = ['Overview', 'Key Insights', 'Risks', 'Growth', 'Reports', 'Pitch Deck', 'TeamLab'];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary px-6 py-14">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/startups')} className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest hover:text-white transition-colors mb-8 flex items-center gap-2">
          <ArrowLeft size={14} /> My Startups
        </button>

        {/* Header */}
        <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 mb-5">
          <div className="flex items-center gap-5">
            {startup.logoUrl ? (
              <img src={startup.logoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10 shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-black text-2xl shrink-0">
                {(startup.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display truncate">{startup.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {hasScore && (
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    {score}% Startup Score
                  </span>
                )}
                {startup.stage && <span className="text-[9px] font-black uppercase text-[#5da9ff] tracking-widest bg-[#5da9ff]/5 px-2.5 py-1 rounded-lg border border-[#5da9ff]/10">{startup.stage}</span>}
                {(startup.city || startup.country) && (
                  <span className="text-[9px] font-black uppercase text-brand-text-muted tracking-widest flex items-center gap-1"><MapPin size={10} /> {[startup.city, startup.country].filter(Boolean).join(', ')}</span>
                )}
                <span className="text-[9px] font-black uppercase text-brand-text-muted tracking-widest">Updated {lastUpdated}</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/setup/startup?id=${startup.id}`)}
              title="Edit startup setup"
              className="shrink-0 p-3 rounded-xl bg-brand-card border border-white/10 text-brand-text-muted hover:text-white hover:border-brand-accent/40 transition-all"
            >
              <Pencil size={16} />
            </button>
          </div>
        </div>

        {/* Summary panel */}
        <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 mb-5">
          <h2 className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest mb-5">Startup Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
            {summaryItems.map((s) => (
              <div key={s.label}>
                <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mb-1">{s.label}</div>
                <div className={`text-sm font-black ${s.accent ? 'text-emerald-400' : 'text-brand-text-primary'}`}>{s.value}</div>
              </div>
            ))}
          </div>
          {!analysis && (
            <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-xs text-brand-text-secondary font-medium flex-1">Run the analysis to unlock your Startup Score, insights, risks, and reports.</p>
              <button onClick={goAnalyze} className="shrink-0 px-6 py-3 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                <Sparkles size={13} /> Analyze Now
              </button>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <h2 className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.title} onClick={a.onClick} className="p-5 rounded-[1.5rem] bg-brand-section border border-brand-border hover:border-brand-accent/40 transition-all active:scale-95 flex flex-col items-center gap-3 text-center">
                <div className="w-11 h-11 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent"><Icon size={20} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{a.title}</span>
              </button>
            );
          })}
        </div>

        {/* Workspace navigation into the full report */}
        <h2 className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest mb-4">Workspace</h2>
        {analysis ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {workspaceNav.map((t) => (
              <button key={t} onClick={() => openReport(t)} className="px-4 py-4 rounded-[1.25rem] bg-brand-card border border-white/5 text-[10px] font-black uppercase tracking-widest text-brand-text-secondary hover:text-white hover:border-brand-accent/40 transition-all active:scale-95 flex items-center justify-center gap-2">
                {t} <ArrowRight size={11} />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-[1.75rem] bg-brand-card border border-dashed border-white/10 text-center">
            <p className="text-xs text-brand-text-secondary font-medium">Overview, Key Insights, Risks, Growth, Reports, Pitch Deck, and TeamLab appear here after the first analysis.</p>
          </div>
        )}

        {/* ── Documents (from the setup wizard) ── */}
        {(() => {
          const docs = [
            { label: 'Pitch Deck', url: startup.pitchDeckDocUrl },
            { label: 'Business Plan', url: startup.businessPlanUrl },
            { label: 'Financial Model', url: startup.financialModelUrl },
            { label: 'Other Documents', url: startup.otherDocsUrl },
          ].filter((d) => d.url);
          return (
            <>
              <h2 className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest mt-8 mb-4">Documents</h2>
              {docs.length === 0 ? (
                <div className="p-6 rounded-[1.75rem] bg-brand-card border border-dashed border-white/10 flex flex-col sm:flex-row sm:items-center gap-4">
                  <p className="text-xs text-brand-text-secondary font-medium flex-1">
                    No documents uploaded yet — add your pitch deck, business plan, or financial model in the setup.
                  </p>
                  <button onClick={() => navigate(`/setup/startup?id=${startup.id}`)} className="shrink-0 px-5 py-3 bg-brand-card border border-white/10 text-brand-text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center gap-2">
                    <PencilIcon size={12} /> Add Documents
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {docs.map((d) => (
                    <a key={d.label} href={d.url} target="_blank" rel="noreferrer"
                      className="p-5 rounded-[1.5rem] bg-brand-section border border-brand-border hover:border-brand-accent/40 transition-all active:scale-[0.99] flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0"><FileText size={19} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black uppercase tracking-tight">{d.label}</div>
                        <div className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest mt-0.5">Open document</div>
                      </div>
                      <ArrowRight size={15} className="text-brand-text-muted shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}