import React, { useEffect } from 'react';
import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, ArrowRight, Mail, History, Inbox } from 'lucide-react';

interface InvestorHistoryPageProps {
  user: User | null;
}

interface RequestedStartup {
  id: string;
  companyName?: string;
  founderName?: string;
  founderEmail?: string;
}

export default function InvestorHistoryPage({ user }: InvestorHistoryPageProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const isInvestor = (profile as any)?.accountType === 'investor';

  // Only signed-in investor accounts can see their history.
  useEffect(() => {
    if (!user) {
      navigate('/investor-network', { replace: true });
      return;
    }
    if (profile && !isInvestor) {
      navigate('/investor-network', { replace: true });
    }
  }, [user, profile, isInvestor, navigate]);

  const requested: RequestedStartup[] = Array.isArray((profile as any)?.requestedStartups)
    ? [...(profile as any).requestedStartups].reverse()
    : [];

  const badge = (profile as any)?.investorBadge || 'Investor';

  return (
    <div className="bg-[#102434] min-h-screen">
      <div className="max-w-[1400px] mx-auto py-12 md:py-24 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-6 mb-10">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-brand-accent mb-3 flex items-center gap-2">
              <History size={13} /> Investor Network
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white font-display leading-none">
              Match History
            </h1>
            <p className="mt-4 text-sm text-brand-text-secondary font-medium max-w-xl leading-relaxed">
              Startups you've requested a pitch deck from. Pick up where you left off or reach out again.
            </p>
          </div>
          <span className="hidden sm:inline-block shrink-0 px-4 py-2 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-[10px] font-black uppercase tracking-widest text-brand-accent">
            {badge}
          </span>
        </div>

        {requested.length === 0 ? (
          <div className="bg-[#0b1a26] border border-white/10 rounded-[2rem] p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center mx-auto mb-6">
              <Inbox size={22} className="text-brand-accent" />
            </div>
            <p className="text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
              No requests yet. When you request a pitch deck from a matched startup, it'll show up here.
            </p>
            <button
              onClick={() => navigate('/investor-matches')}
              className="mt-8 px-8 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              Browse matches <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requested.map((s, i) => (
              <div
                key={(s.id || '') + i}
                className="bg-[#0b1a26] border border-white/10 rounded-[2rem] p-8 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-[9px] font-black uppercase tracking-widest text-brand-accent">
                    Pitch deck requested
                  </span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white font-display mb-5">
                  {s.companyName || 'Startup'}
                </h3>

                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted mb-2">
                    Founder
                  </p>
                  {s.founderEmail ? (
                    <p className="text-sm text-brand-text-secondary font-medium flex items-center gap-2">
                      <Mail size={13} className="text-brand-accent" />
                      {s.founderName ? s.founderName + ' • ' : ''}
                      {s.founderEmail}
                    </p>
                  ) : (
                    <p className="text-sm text-brand-text-muted font-medium">Contact not available</p>
                  )}
                </div>

                <div className="mt-auto flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate(`/dashboard/startup/${s.id}/overview?investor=1`)}
                    disabled={!s.id}
                    className="flex-1 px-6 py-3.5 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:scale-100"
                  >
                    <ArrowRight size={14} /> View report
                  </button>
                  {s.founderEmail && (
                    <a
                      href={`mailto:${s.founderEmail}?subject=${encodeURIComponent(
                        `Pitch deck request — ${s.companyName || 'your startup'}`
                      )}`}
                      className="flex-1 px-6 py-3.5 bg-transparent border border-white/15 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Briefcase size={14} /> Email again
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}