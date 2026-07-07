import React from 'react';
import { cn } from '../lib/utils';

// Compact, read-only progress strip for investor-facing cards. It shows where
// the founder has taken this venture — derived from the same fields the founder
// writes on their own timeline, so it stays in sync (on reload).
const PITCH_ORDER = ['not_started', 'started', 'in_progress', 'completed', 'finalized', 'submitted'];
const pitchRank = (s?: string) => Math.max(0, PITCH_ORDER.indexOf(s || 'not_started'));

const STAGES = [
  { key: 'idea', label: 'Idea' },
  { key: 'analyzed', label: 'Analyzed' },
  { key: 'matched', label: 'Matched' },
  { key: 'deck_started', label: 'Deck' },
  { key: 'deck_progress', label: 'Building' },
  { key: 'deck_completed', label: 'Complete' },
  { key: 'deck_finalized', label: 'Finalized' },
  { key: 'submitted', label: 'Submitted' },
];

export default function TimelineStrip({ analysis }: { analysis: any }) {
  const a = analysis || {};
  const has = (v: any) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0);
  const rank = pitchRank(a.pitchDeckStatus);

  const ideaDone = has(a.ideaDescription) || has(a.startupProfile) || has(a.id);
  const analysisDone =
    a.status === 'completed' || has(a.scores) || has(a.companyAnalysis) || has(a.overallScore);
  const matched = has(a.investorMatching) || a.sharedWithInvestors === true;

  // Highest stage index the founder has reached.
  let reached = 0;
  if (ideaDone) reached = 0;
  if (analysisDone) reached = 1;
  if (matched) reached = 2;
  if (rank >= 1) reached = 3;
  if (rank >= 2) reached = 4;
  if (rank >= 3) reached = 5;
  if (rank >= 4) reached = 6;
  if (rank >= 5) reached = 7;

  const currentLabel = STAGES[reached]?.label || 'Idea';

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[8px] font-black text-brand-text-muted uppercase tracking-[0.25em]">Founder progress</span>
        <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">{currentLabel}</span>
      </div>
      <div className="flex items-center gap-1">
        {STAGES.map((s, i) => {
          const done = i <= reached;
          const current = i === reached;
          return (
            <React.Fragment key={s.key}>
              <div
                title={s.label}
                className={cn(
                  'h-2 w-2 rounded-full shrink-0 transition-colors',
                  current
                    ? 'bg-brand-accent ring-2 ring-brand-accent/30'
                    : done
                    ? 'bg-emerald-400'
                    : 'bg-white/10'
                )}
              />
              {i < STAGES.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 rounded-full transition-colors',
                    i < reached ? 'bg-emerald-400/60' : 'bg-white/10'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}