import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Bell, Loader2, Users, Check, X, Eye, ArrowRight, Inbox } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsPage — real events, no fake feed:
//  · Founders: new applications from team members + investor review activity
//  · Team members: accepted / rejected application updates
// Items newer than the last visit are tagged NEW.
// ─────────────────────────────────────────────────────────────────────────────

type Notif = {
  id: string;
  icon: any;
  tone: 'accent' | 'green' | 'red' | 'blue';
  title: string;
  sub: string;
  at: Date | null;
  to?: string;
};

const TONE: Record<string, string> = {
  accent: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  red: 'bg-brand-coral/10 text-brand-coral border-brand-coral/20',
  blue: 'bg-[#5da9ff]/10 text-[#5da9ff] border-[#5da9ff]/20',
};

export default function NotificationsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const p: any = profile || {};
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenAt, setSeenAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!user?.uid || !profile) return;
    let cancelled = false;
    (async () => {
      try {
        const prevSeen = p.notificationsSeenAt?.toDate?.() || null;
        setSeenAt(prevSeen);

        const list: Notif[] = [];
        const isTeamMember = p.accountType === 'teamMember';
        const isInvestor = p.accountType === 'investor';

        if (isInvestor) {
          // New founder submissions to investors.
          const snap = await getDocs(query(collection(db, 'analyses'), where('submittedToInvestors', '==', true)));
          snap.docs.forEach((d) => {
            const a: any = d.data();
            list.push({
              id: 'sub-' + d.id,
              icon: Inbox,
              tone: 'blue',
              title: 'New startup submission',
              sub: `${a.projectName || a.startupProfile?.companyName || 'A startup'}${a.founderName || a.startupProfile?.founderName ? ' · by ' + (a.founderName || a.startupProfile?.founderName) : ''}`,
              at: a.submittedAt?.toDate?.() || a.updatedAt?.toDate?.() || a.createdAt?.toDate?.() || null,
              to: `/dashboard/startup/${d.id}/overview`,
            });
          });
        } else if (isTeamMember) {
          // My application updates.
          const snap = await getDocs(query(collection(db, 'applications'), where('applicantId', '==', user.uid)));
          snap.docs.forEach((d) => {
            const a: any = d.data();
            if (a.status === 'accepted' || a.status === 'rejected') {
              list.push({
                id: d.id,
                icon: a.status === 'accepted' ? Check : X,
                tone: a.status === 'accepted' ? 'green' : 'red',
                title: `Application ${a.status}`,
                sub: `${a.positionTitle || 'Position'}${a.startupName ? ' · ' + a.startupName : ''}`,
                at: a.decidedAt?.toDate?.() || a.createdAt?.toDate?.() || null,
                to: '/team',
              });
            }
          });
        } else if (!isInvestor) {
          // Founder: new applications on my positions.
          const appsSnap = await getDocs(query(collection(db, 'applications'), where('founderId', '==', user.uid)));
          appsSnap.docs.forEach((d) => {
            const a: any = d.data();
            list.push({
              id: d.id,
              icon: Users,
              tone: a.status === 'accepted' ? 'green' : a.status === 'rejected' ? 'red' : 'accent',
              title: a.status === 'pending' ? 'New application' : `Application ${a.status}`,
              sub: `${a.applicantName || 'Someone'} applied for ${a.positionTitle || 'a position'}${a.startupName ? ' · ' + a.startupName : ''}`,
              at: a.createdAt?.toDate?.() || null,
              to: a.startupId ? `/dashboard/startup/${a.startupId}/overview` : undefined,
            });
          });
          // Founder: investor review activity on submitted decks.
          try {
            const anSnap = await getDocs(query(collection(db, 'analyses'), where('userId', '==', user.uid)));
            anSnap.docs.forEach((d) => {
              const a: any = d.data();
              if (a.submittedToInvestors && a.investorReviewStatus && a.investorReviewStatus !== 'New Submission') {
                list.push({
                  id: 'inv-' + d.id,
                  icon: Eye,
                  tone: 'blue',
                  title: `Investor activity: ${a.investorReviewStatus}`,
                  sub: a.projectName || a.ideaDescription?.slice(0, 60) || 'Your submission',
                  at: a.investorReviewAt?.toDate?.() || null,
                  to: `/dashboard/startup/${d.id}/overview`,
                });
              }
            });
          } catch (e) { /* non-fatal */ }
        }

        list.sort((a, b) => (b.at?.getTime?.() || 0) - (a.at?.getTime?.() || 0));
        if (!cancelled) setItems(list);

        // Mark as seen.
        await setDoc(doc(db, 'profiles', user.uid), { notificationsSeenAt: serverTimestamp() }, { merge: true });
      } catch (e) { console.warn('Notifications load failed:', e); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user?.uid, profile]);

  const fmt = (d: Date | null) => {
    if (!d) return '';
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary px-6 py-14">
      <div className="max-w-2xl mx-auto">
        <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] block mb-3">Account</span>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display mb-10">Notifications</h1>

        {loading ? (
          <div className="py-24 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-brand-section/30 rounded-[3rem] border border-dashed border-white/5 px-8">
            <Bell size={36} strokeWidth={1} className="mx-auto text-brand-accent mb-5" />
            <h3 className="text-lg font-black uppercase tracking-tight font-display mb-2">Nothing yet</h3>
            <p className="text-sm text-brand-text-secondary font-medium max-w-sm mx-auto">
              Applications, team updates, and investor activity will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => {
              const Icon = n.icon;
              const isNew = seenAt === null ? true : (n.at ? n.at > seenAt : false);
              return (
                <button
                  key={n.id}
                  onClick={() => n.to && navigate(n.to)}
                  className={`w-full text-left p-5 rounded-[1.75rem] bg-brand-section border border-brand-border transition-all flex items-center gap-4 ${n.to ? 'hover:border-brand-accent/40 active:scale-[0.99]' : 'cursor-default'}`}
                >
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${TONE[n.tone]}`}>
                    <Icon size={19} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black uppercase tracking-tight truncate">{n.title}</span>
                      {isNew && <span className="shrink-0 text-[8px] font-black uppercase tracking-widest bg-brand-accent text-brand-bg px-2 py-0.5 rounded-full">New</span>}
                    </div>
                    <p className="text-xs text-brand-text-secondary font-medium mt-0.5 truncate">{n.sub}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest">{fmt(n.at)}</span>
                    {n.to && <ArrowRight size={14} className="text-brand-text-muted" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}