import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { Loader2, ArrowRight, Search, Lock, Mail, ShieldCheck, Send } from 'lucide-react';

interface InvestorMatchesPageProps {
  user: any;
}

export default function InvestorMatchesPage({ user }: InvestorMatchesPageProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const isApprovedInvestor = (profile as any)?.accountType === 'investor';

  const invStages: string[] = ((profile as any)?.investorStages || []).map((s: string) =>
    (s || '').toLowerCase().replace(/\./g, '').trim()
  );
  const invNiches: string[] = ((profile as any)?.investorNiches || []).map((s: string) =>
    (s || '').toLowerCase().trim()
  );
  const invModels: string[] = ((profile as any)?.investorBusinessModels || []).map((s: string) =>
    (s || '').toLowerCase().trim()
  );

  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchError, setMatchError] = useState('');

  // Route protection: only signed-in approved investors belong here.
  useEffect(() => {
    if (user === undefined) return; // still resolving
    if (!user) {
      navigate('/investor-network');
      return;
    }
    // profile still loading -> wait
    if (profile === null || profile === undefined) return;
    if (!isApprovedInvestor) {
      navigate('/investor-network');
    }
  }, [user, profile, isApprovedInvestor, navigate]);

  useEffect(() => {
    if (!user || !isApprovedInvestor) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setMatchError('');
      try {
        const snap = await getDocs(query(collection(db, 'analyses'), where('sharedWithInvestors', '==', true)));
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        const filtered = rows.filter((r) => {
          const score = Number(r.shareScore ?? 0);
          if (score < 80) return false; // shared + 80%+ implies a Growth founder opted in
          const stage = (r.shareStage || r.startupProfile?.stage || '')
            .toString().toLowerCase().replace(/\./g, '').trim();
          const stageOk =
            invStages.length === 0 || !stage || invStages.some((s) => s === stage || s.includes(stage) || stage.includes(s));
          const industry = (r.startupProfile?.industry || r.industry || '').toString().toLowerCase().trim();
          const nicheOk =
            invNiches.length === 0 || !industry || invNiches.some((n) => industry.includes(n) || n.includes(industry));
          const model = (r.startupProfile?.businessModel || r.businessModel || '').toString().toLowerCase().trim();
          const modelOk =
            invModels.length === 0 || !model || invModels.some((m) => model.includes(m) || m.includes(model));
          return stageOk && nicheOk && modelOk;
        });

        // Best-effort contact backfill: older shares (created before the founder
        // contact was auto-saved onto the analysis) have no shareFounderEmail. For
        // those, look up the founder's own profile by userId so their name + email
        // still show and the pitch-deck button works. Silently skipped if the read
        // is denied by rules — the card just falls back to "contact will appear".
        const enriched = await Promise.all(
          filtered.map(async (r) => {
            if (r.shareFounderEmail || !r.userId) return r;
            try {
              const pSnap = await getDoc(doc(db, 'profiles', r.userId));
              if (pSnap.exists()) {
                const p = pSnap.data() as any;
                return {
                  ...r,
                  shareFounderName: r.shareFounderName || p.displayName || p.fullName || '',
                  shareFounderEmail: p.email || '',
                };
              }
            } catch (_) {
              /* read denied or offline — leave as-is */
            }
            return r;
          })
        );

        if (!cancelled) setMatches(enriched);
      } catch (err) {
        console.warn('Matched startups query failed:', err);
        if (!cancelled) setMatchError('matches_blocked');
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
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-display leading-[0.95]">Matched startups</h1>
            <p className="text-sm text-brand-text-secondary font-medium mt-3 leading-relaxed max-w-xl">
              Founders who opted in, scored 80% or higher, and fit your stages, niches, and business models.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            {(profile as any)?.investorBadge && (
              <span className="px-3 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-black uppercase tracking-widest">
                {(profile as any).investorBadge}
              </span>
            )}
            <button
              onClick={() => navigate('/investor-network?edit=1')}
              className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest hover:text-white transition-colors"
            >
              Change focus
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 size={24} className="animate-spin text-brand-accent" />
            <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.3em]">Finding matches</p>
          </div>
        ) : matchError ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock size={24} />
            </div>
            <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
              Matched startups will appear here once investor access is enabled in the database settings.
            </p>
          </div>
        ) : matches.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-brand-card border border-white/5 flex items-center justify-center text-brand-text-muted">
              <Search size={24} />
            </div>
            <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
              No matches yet. As founders in your stages and niches choose to share, they'll show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((m) => {
              const name = (m.startupProfile?.companyName || m.ideaDescription || 'Startup').toString().replace(/\./g, '');
              const industry = (m.startupProfile?.industry || m.industry || '').toString().replace(/\./g, '');
              const stage = (m.shareStage || m.startupProfile?.stage || '').toString().replace(/\./g, '');
              const score = Number(m.shareScore ?? 0);
              const founderName = m.shareFounderName || (m.userId === user?.uid ? (profile?.fullName || user?.displayName || '') : '');
              const founderEmail = m.shareFounderEmail || (m.userId === user?.uid ? ((profile as any)?.email || user?.email || '') : '');

              // Open the investor's mail client with a pre-filled request to the
              // founder. The investor's own address is the "from", so the founder
              // can reply directly with their deck.
              const requestDeck = () => {
                if (!founderEmail) return;
                const investorName =
                  (profile as any)?.displayName || (profile as any)?.fullName || user?.displayName || 'an investor';
                const subject = encodeURIComponent(`Pitch deck request — ${name}`);
                const body = encodeURIComponent(
                  `Hi${founderName ? ' ' + founderName : ''},\n\n` +
                    `I'm ${investorName} on DecisionLab and I'd love to see the pitch deck for ${name}. ` +
                    `Could you share it when you get a chance?\n\nThank you!`
                );
                window.location.href = `mailto:${founderEmail}?subject=${subject}&body=${body}`;
              };

              return (
                <div key={m.id} className="p-6 bg-brand-card border border-white/5 rounded-[1.75rem] hover:border-brand-accent/40 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-brand-text-primary uppercase tracking-tight truncate">{name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {industry && (
                          <span className="text-[9px] font-black uppercase text-brand-accent tracking-widest bg-brand-accent/5 px-2.5 py-1 rounded-lg border border-brand-accent/10">{industry}</span>
                        )}
                        {stage && (
                          <span className="text-[9px] font-black uppercase text-[#5da9ff] tracking-widest bg-[#5da9ff]/5 px-2.5 py-1 rounded-lg border border-[#5da9ff]/10">{stage}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-black text-emerald-400 leading-none">{score}%</div>
                      <div className="text-[8px] font-black text-brand-text-muted uppercase tracking-widest mt-1">Score</div>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-white/5">
                    <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mb-2">Founder</div>
                    {founderEmail ? (
                      <div className="flex items-center gap-2 text-sm text-brand-text-secondary font-medium">
                        {founderName && <span className="text-brand-text-primary font-bold">{founderName}</span>}
                        <a href={`mailto:${founderEmail}`} className="inline-flex items-center gap-1.5 text-brand-accent hover:underline">
                          <Mail size={13} /> {founderEmail}
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-brand-text-muted font-medium">Contact will appear once the founder shares it.</p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => navigate(`/dashboard/startup/${m.id}/overview?investor=1`)}
                      className="px-6 py-3 bg-brand-card border border-white/10 text-brand-text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center gap-2"
                    >
                      View report <ArrowRight size={13} />
                    </button>
                    <button
                      onClick={requestDeck}
                      disabled={!founderEmail}
                      title={founderEmail ? 'Email the founder to request their pitch deck' : 'Founder contact not shared yet'}
                      className="px-6 py-3 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                      <Send size={13} /> Request pitch deck
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}