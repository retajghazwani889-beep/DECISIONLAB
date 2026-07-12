import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';

interface TeamLabCardProps {
  /** The startup (analysis) id this TeamLab belongs to. */
  startupId: string;
}

// A small dashboard nudge encouraging the founder to set up their team.
// Links to the startup's TeamLab page (built in Phase 3).
export default function TeamLabCard({ startupId }: TeamLabCardProps) {
  const navigate = useNavigate();
  return (
    <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div className="flex items-center gap-5 min-w-0">
        <div className="w-14 h-14 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0">
          <Users size={26} />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.35em] block mb-1">TeamLab</span>
          <h3 className="text-lg font-black text-brand-text-primary uppercase tracking-tight font-display">Build your team</h3>
          <p className="text-sm text-brand-text-secondary font-medium mt-1 leading-relaxed">
            Add your existing team or publish open positions for this startup whenever you're ready.
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate(`/dashboard/startup/${startupId}/team`)}
        className="shrink-0 px-6 py-3.5 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        Open TeamLab <ArrowRight size={15} />
      </button>
    </div>
  );
}