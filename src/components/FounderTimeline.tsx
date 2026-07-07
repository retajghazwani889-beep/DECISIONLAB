import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Lightbulb,
  BarChart3,
  Target,
  Users,
  Presentation,
  Wand2,
  CheckCircle2,
  BadgeCheck,
  Send,
  ChevronDown,
  Loader2,
  Circle,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ── Pitch-deck workflow ordering ────────────────────────────────────────────
// The founder moves a project through these manually. Everything before the
// pitch deck (idea → analysis → validation → matching) is derived automatically
// from data already on the analysis doc, so it never needs a manual click.
const PITCH_ORDER = ['not_started', 'started', 'in_progress', 'completed', 'finalized', 'submitted'] as const;
type PitchStatus = (typeof PITCH_ORDER)[number];
const pitchRank = (s?: string) => Math.max(0, PITCH_ORDER.indexOf((s as PitchStatus) || 'not_started'));

const EDIT_CHOICES: { value: PitchStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'started', label: 'Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'finalized', label: 'Finalized' },
];

interface FounderTimelineProps {
  analysis: any;
  /** Pass the app's real calculated venture score so gating matches the report. */
  scoreOverride?: number;
  /** Only the project's owner may change the pitch-deck status. */
  canEdit?: boolean;
  /** Optional callback after a successful status write (e.g. to refresh). */
  onUpdated?: () => void;
}

type StageStatus = 'completed' | 'in_progress' | 'not_started';

export default function FounderTimeline({ analysis, canEdit = false, onUpdated, scoreOverride }: FounderTimelineProps) {
  const a = analysis || {};

  // Local mirror of the pitch-deck status so edits reflect instantly.
  const [status, setStatus] = useState<PitchStatus>((a.pitchDeckStatus as PitchStatus) || 'not_started');
  const [dates, setDates] = useState<Record<string, string>>(a.pitchDeckStatusDates || {});
  const [saving, setSaving] = useState<PitchStatus | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const rank = pitchRank(status);
  const has = (v: any) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0);

  // The investor journey (and the ability to submit to investors) is reserved for
  // investor-ready ventures scoring 80% or higher — the same bar the Investor
  // Network uses. Pull the score from wherever the analysis stored it.
  const score = Number(
    (typeof scoreOverride === 'number' ? scoreOverride : undefined) ??
      a.overallScore ??
      a.scores?.overall ??
      a.companyAnalysis?.scores?.overall ??
      a.shareScore ??
      a.analysisScore ??
      0
  );
  const isInvestorReady = score >= 80;

  // ── Derived early stages (read-only) ──────────────────────────────────────
  const ideaDone = has(a.ideaDescription) || has(a.startupProfile) || has(a.id);
  const analysisDone =
    a.status === 'completed' || has(a.scores) || has(a.companyAnalysis) || has(a.overallScore) || has(a.overallScore);
  const validationDone = has(a.marketAnalysis) || has(a.marketData);
  const matchingDone = has(a.investorMatching) || a.sharedWithInvestors === true;

  const dateFor = (key: string, isoOrTs?: any): string | null => {
    const raw = dates[key] || isoOrTs;
    if (!raw) return null;
    try {
      const d = raw?.toDate ? raw.toDate() : new Date(raw);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return null;
    }
  };

  const stages: {
    key: string;
    label: string;
    icon: React.ReactNode;
    status: StageStatus;
    date: string | null;
    detail: string;
  }[] = [
    {
      key: 'idea',
      label: 'Idea Submitted',
      icon: <Lightbulb size={16} />,
      status: ideaDone ? 'completed' : 'not_started',
      date: dateFor('idea', a.createdAt),
      detail: 'The venture idea was submitted to DecisionLab and a project was created.',
    },
    {
      key: 'analysis',
      label: 'Startup Analysis Completed',
      icon: <BarChart3 size={16} />,
      status: analysisDone ? 'completed' : ideaDone ? 'in_progress' : 'not_started',
      date: dateFor('analysis', a.updatedAt),
      detail: 'The full venture analysis ran and produced scores across idea strength, market fit, execution, and more.',
    },
    {
      key: 'validation',
      label: 'Market Validation Completed',
      icon: <Target size={16} />,
      status: validationDone ? 'completed' : analysisDone ? 'in_progress' : 'not_started',
      date: dateFor('validation'),
      detail: 'Market analysis — demand signals, growth trends, and size estimates (TAM/SAM/SOM) — was generated for the venture.',
    },
    {
      key: 'matching',
      label: 'Investor Matching Completed',
      icon: <Users size={16} />,
      status: matchingDone ? 'completed' : validationDone ? 'in_progress' : 'not_started',
      date: dateFor('matching'),
      detail: a.sharedWithInvestors
        ? 'This startup is shared with the Investor Network and matched to relevant investors.'
        : 'Suggested investor matches were computed for this venture.',
    },
    {
      key: 'deck_started',
      label: 'Pitch Deck Started',
      icon: <Presentation size={16} />,
      status: rank >= 1 ? 'completed' : rank === 0 && matchingDone ? 'in_progress' : 'not_started',
      date: dateFor('started'),
      detail: 'Work on the pitch deck has begun in the Pitch Deck Architect.',
    },
    {
      key: 'deck_progress',
      label: 'Pitch Deck In Progress',
      icon: <Wand2 size={16} />,
      status: rank >= 2 ? 'completed' : rank === 1 ? 'in_progress' : 'not_started',
      date: dateFor('in_progress'),
      detail: 'The deck is actively being built out slide by slide.',
    },
    {
      key: 'deck_completed',
      label: 'Pitch Deck Completed',
      icon: <CheckCircle2 size={16} />,
      status: rank >= 3 ? 'completed' : rank === 2 ? 'in_progress' : 'not_started',
      date: dateFor('completed'),
      detail: 'All slides are drafted and the deck is content-complete.',
    },
    {
      key: 'deck_finalized',
      label: 'Pitch Deck Finalized',
      icon: <BadgeCheck size={16} />,
      status: rank >= 4 ? 'completed' : rank === 3 ? 'in_progress' : 'not_started',
      date: dateFor('finalized'),
      detail: 'The deck is polished, reviewed, and ready to send to investors.',
    },
    {
      key: 'deck_submitted',
      label: 'Pitch Deck Submitted to Investors',
      icon: <Send size={16} />,
      status: rank >= 5 ? 'completed' : rank === 4 ? 'in_progress' : 'not_started',
      date: dateFor('submitted', a.submittedToInvestorsAt),
      detail:
        rank >= 5
          ? `The finalized deck has been submitted to your matched investors.${
              a.investorReviewStatus && a.investorReviewStatus !== 'new_submission'
                ? ` Latest investor status: ${String(a.investorReviewStatus).replace(/_/g, ' ')}.`
                : ' Awaiting investor review.'
            }`
          : 'The finalized deck has been submitted to your matched investors.',
    },
  ];

  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const progressPct = Math.round((completedCount / stages.length) * 100);

  const badge = (s: StageStatus) => {
    if (s === 'completed')
      return { text: 'Completed', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (s === 'in_progress')
      return { text: 'In Progress', cls: 'bg-[#5da9ff]/10 text-[#5da9ff] border-[#5da9ff]/20' };
    return { text: 'Not Started', cls: 'bg-white/5 text-brand-text-muted border-white/10' };
  };

  const applyStatus = async (next: PitchStatus) => {
    if (!canEdit || !a.id) return;
    setError('');
    setSaving(next);
    const newDates = { ...dates };
    if (next !== 'not_started' && !newDates[next]) newDates[next] = new Date().toISOString();
    try {
      const patch: any = {
        pitchDeckStatus: next,
        pitchDeckStatusDates: newDates,
        updatedAt: serverTimestamp(),
      };
      if (next === 'submitted') {
        // Mark the venture as submitted so it surfaces on the investor side.
        patch.submittedToInvestors = true;
        patch.submittedToInvestorsAt = serverTimestamp();
        patch.investorReviewStatus = 'new_submission';

        // Mirror the founder's REAL edited deck (built in the Pitch Deck
        // Architect, saved to pitchDecks/{id}, including their uploaded image
        // URLs) onto this analysis doc. Investors can already read submitted
        // analyses, so copying the slides here lets them see the actual deck
        // with images — no extra rules on the pitchDecks collection needed.
        try {
          const deckSnap = await getDoc(doc(db, 'pitchDecks', a.id));
          if (deckSnap.exists()) {
            const deck = deckSnap.data() as any;
            if (Array.isArray(deck.slides) && deck.slides.length) {
              patch.pitchDeckData = { slides: deck.slides, template: deck.template || null };
              if (deck.template) patch.pitchDeckTemplate = deck.template;
            }
          }
        } catch (e) {
          console.warn('Could not mirror deck onto analysis for investors:', e);
          // Non-fatal: submission still succeeds; the deck just may show text-only.
        }
      }
      await updateDoc(doc(db, 'analyses', a.id), patch);
      setStatus(next);
      setDates(newDates);
      onUpdated?.();
    } catch (err: any) {
      console.warn('Timeline status update failed:', err);
      setError('Could not save status. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  // Sub-80 ventures don't get the investor journey — show a short locked note so
  // the founder knows what unlocks it, instead of the full timeline.
  if (!isInvestorReady) {
    return (
      <div className="mt-10 bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10 shadow-huge text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-text-muted">
          <Target size={24} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-tight font-display text-brand-text-primary mb-2">
          Investor journey locked
        </h3>
        <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
          The Founder Journey Timeline and investor submission unlock once this venture scores{' '}
          <span className="text-brand-accent font-black">80% or higher</span>. This one is at{' '}
          <span className="text-brand-text-primary font-black">{score || 0}%</span> — strengthen the idea and
          re-run the analysis to reach investor-ready status.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10 shadow-huge">
      {/* Header + overall progress */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.35em] block mb-3">
            Founder Journey
          </span>
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display text-brand-text-primary">
            Progress Timeline
          </h3>
        </div>
        <div className="shrink-0 w-full sm:w-64">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
              {completedCount} of {stages.length} stages
            </span>
            <span className="text-lg font-black text-brand-accent leading-none">{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-brand-accent to-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Vertical timeline */}
      <div className="relative">
        {/* Track */}
        <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-white/5 rounded-full" />
        {/* Filled track up to the last completed stage */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${(completedCount / stages.length) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute left-[19px] top-3 w-0.5 bg-gradient-to-b from-emerald-400 to-brand-accent rounded-full"
        />

        <div className="space-y-3">
          {stages.map((stage) => {
            const b = badge(stage.status);
            const open = openKey === stage.key;
            return (
              <div key={stage.key} className="relative pl-14">
                {/* Node */}
                <div
                  className={cn(
                    'absolute left-0 top-1 w-10 h-10 rounded-xl border flex items-center justify-center transition-colors',
                    stage.status === 'completed'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : stage.status === 'in_progress'
                      ? 'bg-[#5da9ff]/15 border-[#5da9ff]/30 text-[#5da9ff] animate-pulse'
                      : 'bg-brand-card border-white/10 text-brand-text-muted'
                  )}
                >
                  {stage.icon}
                </div>

                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : stage.key)}
                  className="w-full text-left bg-brand-card border border-white/5 hover:border-brand-accent/30 rounded-2xl px-5 py-4 transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-tight truncate">
                        {stage.label}
                      </h4>
                      {stage.date && (
                        <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mt-1">
                          {stage.date}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest',
                          b.cls
                        )}
                      >
                        {b.text}
                      </span>
                      <ChevronDown
                        size={16}
                        className={cn('text-brand-text-muted transition-transform', open && 'rotate-180')}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-brand-text-secondary font-medium leading-relaxed pt-4 mt-4 border-t border-white/5">
                          {stage.detail}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Founder-only pitch-deck controls */}
      {canEdit && (
        <div className="mt-10 pt-8 border-t border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Circle size={8} className="fill-brand-accent text-brand-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
              Update pitch deck status
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {EDIT_CHOICES.map((c) => {
              const active = status === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  disabled={!!saving}
                  onClick={() => applyStatus(c.value)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50',
                    active
                      ? 'bg-brand-accent text-brand-bg border-brand-accent'
                      : 'bg-brand-card text-brand-text-secondary border-white/5 hover:text-white hover:border-brand-accent/30'
                  )}
                >
                  {saving === c.value && <Loader2 size={12} className="animate-spin" />}
                  {c.label}
                </button>
              );
            })}

            {/* Submit to investors — sets the flag + timestamp. The investor-facing
                Submissions page is a separate build; this marks the deck ready. */}
            <button
              type="button"
              disabled={!!saving || pitchRank(status) < 4}
              onClick={() => applyStatus('submitted')}
              title={
                pitchRank(status) < 4
                  ? 'Finalize the deck before submitting to investors'
                  : 'Submit the finalized deck to your matched investors'
              }
              className={cn(
                'px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed',
                status === 'submitted'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-500 text-brand-bg hover:brightness-110'
              )}
            >
              {saving === 'submitted' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {status === 'submitted' ? 'Submitted' : 'Submit to Investors'}
            </button>
          </div>
          {error && <p className="text-xs text-brand-coral font-bold mt-3">{error}</p>}
        </div>
      )}
    </div>
  );
}