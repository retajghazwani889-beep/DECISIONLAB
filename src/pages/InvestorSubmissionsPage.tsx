import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { cn } from '../lib/utils';
import SlideCanvas from '../components/SlideCanvas';
import { createPortal } from 'react-dom';
import { Maximize2, X as CloseIcon } from 'lucide-react';
import {
  Loader2, ArrowRight, Inbox, Lock, Mail, Calendar,
  Presentation, ChevronLeft, ChevronRight, PenSquare, User as UserIcon,
} from 'lucide-react';

interface InvestorSubmissionsPageProps {
  user: any;
}

// ── One submission card, with its own inline deck viewer ────────────────────
function SubmissionCard({ r, user, profile, navigate }: any) {
  const [deckOpen, setDeckOpen] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [presenting, setPresenting] = useState(false);

  const name = (r.startupProfile?.companyName || r.projectName || r.ideaDescription || 'Startup').toString().replace(/\./g, '');
  const industry = (r.startupProfile?.industry || r.projectIndustry || r.industry || '').toString().replace(/\./g, '');
  const score = Number(r.overallScore ?? r.scores?.overall ?? r.shareScore ?? r.analysisScore ?? 0);

  // The founder's full pitch deck lives on the analysis doc (same slides the
  // Architect edits). Read the primary location, fall back to the alternate key.
  const slides: any[] = r.pitchDeckData?.slides || r.pitchReadiness?.slides || [];
  const deckTemplate: string | undefined = r.pitchDeckTemplate || r.pitchDeckData?.template || undefined;
  const hasDeck = slides.length > 0;

  const founderName = r.shareFounderName || (r.userId === user?.uid ? (profile?.fullName || user?.displayName || '') : '');
  const founderEmail = r.shareFounderEmail || (r.userId === user?.uid ? ((profile as any)?.email || user?.email || '') : '');

  const submitted = (() => {
    try {
      const ts = r.submittedToInvestorsAt;
      const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
      if (!d || isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return null;
    }
  })();

  const writeReview = () => {
    if (!founderEmail) return;
    const investorName = (profile as any)?.displayName || (profile as any)?.fullName || user?.displayName || 'an investor';
    const subject = encodeURIComponent(`Review — ${name} pitch deck`);
    const body = encodeURIComponent(
      `Hi${founderName ? ' ' + founderName : ''},\n\n` +
        `I'm ${investorName} on DecisionLab and I reviewed the ${name} pitch deck you submitted. ` +
        `Here's my feedback:\n\n[ write your review here ]\n\nBest regards,\n${investorName}`
    );
    window.location.href = `mailto:${founderEmail}?subject=${subject}&body=${body}`;
  };

  const slide = slides[slideIdx] || {};

  useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPresenting(false);
      else if (e.key === 'ArrowRight') setSlideIdx((i) => Math.min(slides.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setSlideIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting, slides.length]);


  return (
    <div className="p-6 bg-brand-card border border-white/5 rounded-[1.75rem] hover:border-brand-accent/40 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-black text-brand-text-primary uppercase tracking-tight truncate">{name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {industry && (
              <span className="text-[9px] font-black uppercase text-brand-accent tracking-widest bg-brand-accent/5 px-2.5 py-1 rounded-lg border border-brand-accent/10">{industry}</span>
            )}
            {submitted && (
              <span className="text-[9px] font-black uppercase text-brand-text-muted tracking-widest bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                <Calendar size={10} /> Submitted {submitted}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl font-black text-emerald-400 leading-none">{score}%</div>
          <div className="text-[8px] font-black text-brand-text-muted uppercase tracking-widest mt-1">Score</div>
        </div>
      </div>

      {/* Full pitch deck viewer */}
      <div className="mt-5 pt-5 border-t border-white/5">
        <button
          onClick={() => { setDeckOpen((o) => !o); setSlideIdx(0); }}
          disabled={!hasDeck}
          className={cn(
            'w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border transition-all',
            hasDeck
              ? 'bg-brand-accent/5 border-brand-accent/20 text-brand-accent hover:bg-brand-accent/10'
              : 'bg-white/5 border-white/10 text-brand-text-muted cursor-not-allowed'
          )}
        >
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Presentation size={14} />
            {hasDeck ? `View pitch deck — ${slides.length} slides` : 'No deck attached'}
          </span>
          {hasDeck && (
            <span className="text-[9px] font-black uppercase tracking-widest">{deckOpen ? 'Hide' : 'Open'}</span>
          )}
        </button>

        {deckOpen && hasDeck && (
          <div className="mt-4 bg-brand-section border border-white/10 rounded-[1.5rem] overflow-hidden">
            {/* Slide — rendered as a 16:9 canvas. If the founder uploaded an
                image for this slide, it fills the slide like a real presentation
                with the text overlaid; otherwise we fall back to a clean styled
                text layout. */}
            <SlideCanvas slide={slide} templateName={deckTemplate} />

            {/* Slide nav */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-brand-card/40">
              <button
                onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                disabled={slideIdx === 0}
                className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-brand-text-muted hover:text-brand-accent disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">
                Slide {slideIdx + 1} of {slides.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPresenting(true)}
                  title="Present full screen"
                  className="h-9 px-3 rounded-xl border border-brand-accent/30 bg-brand-accent/10 flex items-center gap-1.5 text-brand-accent hover:bg-brand-accent/20 transition-all text-[9px] font-black uppercase tracking-widest"
                >
                  <Maximize2 size={13} /> Present
                </button>
                <button
                  onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
                  disabled={slideIdx === slides.length - 1}
                  className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-brand-text-muted hover:text-brand-accent disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Full-screen presenter ─────────────────────────────────────────── */}
      {presenting && hasDeck && createPortal(
        <div className="fixed inset-0 z-[3000] bg-black flex flex-col">
          {/* Top bar with Return to Submissions */}
          <div className="flex items-center justify-between px-5 sm:px-8 py-4 shrink-0">
            <div className="min-w-0">
              <p className="text-sm font-black text-white uppercase tracking-tight truncate">{name}</p>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                Slide {slideIdx + 1} of {slides.length}
              </p>
            </div>
            <button
              onClick={() => setPresenting(false)}
              className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <CloseIcon size={14} /> Return to Submissions
            </button>
          </div>

          {/* Stage — slide fills the space, scaled to fit fully */}
          <div className="flex-1 min-h-0 px-4 sm:px-12 pb-4 flex items-center justify-center">
            <div className="w-full h-full max-w-[1600px]">
              <SlideCanvas slide={slide} templateName={deckTemplate} fit="contain" />
            </div>
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-center gap-6 py-5 shrink-0">
            <button
              onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
              disabled={slideIdx === 0}
              className="w-12 h-12 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-25 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-xs font-black text-white/60 uppercase tracking-widest tabular-nums">
              {slideIdx + 1} / {slides.length}
            </span>
            <button
              onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
              disabled={slideIdx === slides.length - 1}
              className="w-12 h-12 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-25 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <p className="text-center text-[9px] font-black text-white/30 uppercase tracking-widest pb-4">
            Use ← → arrows · Esc to exit
          </p>
        </div>,
        document.body
      )}

      {/* Founder contact card + Write a Review */}
      <div className="mt-5 pt-5 border-t border-white/5">
        <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mb-3">Founder</div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-brand-section border border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0">
              <UserIcon size={18} />
            </div>
            <div className="min-w-0">
              {founderName && <p className="text-sm font-black text-brand-text-primary truncate">{founderName}</p>}
              {founderEmail ? (
                <p className="text-xs text-brand-text-secondary font-medium truncate flex items-center gap-1.5">
                  <Mail size={11} className="text-brand-accent" /> {founderEmail}
                </p>
              ) : (
                <p className="text-xs text-brand-text-muted font-medium">Contact not available</p>
              )}
            </div>
          </div>
          <button
            onClick={writeReview}
            disabled={!founderEmail}
            title={founderEmail ? 'Email the founder your review' : 'Founder contact not available'}
            className="shrink-0 px-5 py-3 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <PenSquare size={13} /> Write a Review
          </button>
        </div>
      </div>

      <div className="mt-5">
        <button
          onClick={() => navigate(`/dashboard/startup/${r.id}/overview?investor=1`)}
          className="px-6 py-3 bg-brand-card border border-white/10 text-brand-text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center gap-2"
        >
          View full report <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

export default function InvestorSubmissionsPage({ user }: InvestorSubmissionsPageProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const isApprovedInvestor = (profile as any)?.accountType === 'investor';

  const invStages: string[] = ((profile as any)?.investorStages || []).map((s: string) =>
    (s || '').toLowerCase().replace(/\./g, '').trim()
  );
  const invNiches: string[] = ((profile as any)?.investorNiches || []).map((s: string) =>
    (s || '').toLowerCase().trim()
  );

  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      navigate('/investor-network');
      return;
    }
    if (profile === null || profile === undefined) return;
    if (!isApprovedInvestor) navigate('/investor-network');
  }, [user, profile, isApprovedInvestor, navigate]);

  useEffect(() => {
    if (!user || !isApprovedInvestor) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const snap = await getDocs(
          query(collection(db, 'analyses'), where('submittedToInvestors', '==', true))
        );
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        const filtered = rows.filter((r) => {
          const stage = (r.shareStage || r.startupProfile?.stage || '')
            .toString().toLowerCase().replace(/\./g, '').trim();
          const stageOk =
            invStages.length === 0 || !stage || invStages.some((s) => s === stage || s.includes(stage) || stage.includes(s));
          const industry = (r.startupProfile?.industry || r.industry || '').toString().toLowerCase().trim();
          const nicheOk =
            invNiches.length === 0 || !industry || invNiches.some((n) => industry.includes(n) || n.includes(industry));
          return stageOk && nicheOk;
        });
        filtered.sort((a, b) => {
          const ta = a.submittedToInvestorsAt?.toDate ? a.submittedToInvestorsAt.toDate().getTime() : 0;
          const tb = b.submittedToInvestorsAt?.toDate ? b.submittedToInvestorsAt.toDate().getTime() : 0;
          return tb - ta;
        });
        if (!cancelled) setSubs(filtered);
      } catch (err) {
        console.warn('Submissions query failed:', err);
        if (!cancelled) setLoadError('blocked');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isApprovedInvestor]);

  if (!user || !isApprovedInvestor) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] block mb-3">Investor Network</span>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-display leading-[0.95]">Submissions</h1>
            <p className="text-sm text-brand-text-secondary font-medium mt-3 leading-relaxed max-w-xl">
              Founders who submitted their pitch deck to investors. Read the full deck, then reach out to the founder with your review.
            </p>
          </div>
          {(profile as any)?.investorBadge && (
            <span className="shrink-0 px-3 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-black uppercase tracking-widest">
              {(profile as any).investorBadge}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 size={24} className="animate-spin text-brand-accent" />
            <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.3em]">Loading submissions</p>
          </div>
        ) : loadError ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock size={24} />
            </div>
            <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
              Submissions will appear here once investor access to submitted decks is enabled in the database rules.
            </p>
          </div>
        ) : subs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-brand-card border border-white/5 flex items-center justify-center text-brand-text-muted">
              <Inbox size={24} />
            </div>
            <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
              No submissions yet. When founders in your stages and niches submit their pitch decks, they'll show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subs.map((r) => (
              <SubmissionCard key={r.id} r={r} user={user} profile={profile} navigate={navigate} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}