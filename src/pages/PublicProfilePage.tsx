import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  User as UserIcon, MapPin, Calendar, Rocket, Mail, Phone, Linkedin, Globe,
  CalendarClock, Loader2, ArrowLeft, Lock, ArrowRight,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PublicProfilePage — the business card. Anyone's profile, viewed by others:
// investors clicking a founder, founders clicking a team member. The contact
// card respects the owner's privacy setting:
//   public       → any signed-in user
//   investors    → investor accounts + accepted team connections + owner
//   connections  → accepted team connections + owner
//   private      → owner only
// ─────────────────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const viewer: any = profile || {};

  const [target, setTarget] = useState<any | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [startups, setStartups] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Viewing your own public link → your editable profile.
  useEffect(() => {
    if (uid && user?.uid === uid) navigate('/profile', { replace: true });
  }, [uid, user?.uid, navigate]);

  useEffect(() => {
    if (!uid || !user?.uid || user.uid === uid) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'profiles', uid));
        if (!cancelled) setTarget(snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null);

        // Their completed startups ("Founder of …").
        try {
          const sSnap = await getDocs(query(collection(db, 'startups'), where('founderId', '==', uid)));
          if (!cancelled) setStartups(sSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).filter((s) => s.status === 'complete'));
        } catch { /* non-fatal */ }

        // Connection check: an ACCEPTED application between viewer and target
        // (either direction) makes them connections.
        try {
          const [asApplicant, asFounder] = await Promise.all([
            getDocs(query(collection(db, 'applications'), where('applicantId', '==', user.uid), where('founderId', '==', uid))),
            getDocs(query(collection(db, 'applications'), where('founderId', '==', user.uid), where('applicantId', '==', uid))),
          ]);
          const anyAccepted = [...asApplicant.docs, ...asFounder.docs].some((d) => (d.data() as any).status === 'accepted');
          if (!cancelled) setConnected(anyAccepted);
        } catch { /* non-fatal */ }
      } catch (e: any) {
        console.warn('Profile load failed:', e);
        if (!cancelled && e?.code === 'permission-denied') setBlocked(true);
      }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [uid, user?.uid]);

  if (loading) {
    return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>;
  }

  if (!target) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text-primary flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-3">{blocked ? 'This profile is private' : 'Profile not found'}</h2>
        {blocked && <p className="text-sm text-brand-text-secondary font-medium mb-4 max-w-sm">The owner has set their profile to private.</p>}
        <button onClick={() => navigate(-1)} className="text-brand-accent text-xs font-black uppercase tracking-widest hover:underline">← Go back</button>
      </div>
    );
  }

  const name = target.displayName || target.fullName || 'Member';
  const roleLabel = target.accountType === 'investor' ? (target.investorBadge || 'Investor')
    : target.accountType === 'teamMember' ? (target.tmHeadline || 'Team Member')
    : (target.roleType || 'Founder');
  const isInvestorViewer = viewer.accountType === 'investor';

  // ── Privacy: who sees the contact card ──
  const privacy = target.profilePrivacy || 'investors';
  const canSeeContact =
    privacy === 'public' ? true :
    privacy === 'investors' ? (isInvestorViewer || connected) :
    privacy === 'connections' ? connected :
    false; // private

  const email = target.email;
  const phone = target.phone;
  const linkedin = target.pfLinkedin || target.tmLinkedin;
  const website = target.pfWebsite || target.tmPortfolio;
  const calendly = target.pfCalendly;
  const skills: string[] = target.skillsTags || target.tmSkills || [];
  const experience: string[] = target.experienceTags || [];

  const sectionCls = 'bg-brand-section border border-brand-border rounded-[2.5rem] p-8 mb-5';

  const contactBtn = (href: string, Icon: any, text: string, primary = false) => (
    <a key={text} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
      className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all flex items-center gap-2 ${primary ? 'bg-brand-accent text-brand-bg hover:scale-105' : 'bg-brand-card border border-white/10 text-brand-text-primary hover:border-brand-accent/40'}`}>
      <Icon size={13} /> {text}
    </a>
  );

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary px-6 py-14">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest hover:text-white transition-colors mb-8 flex items-center gap-2">
          <ArrowLeft size={14} /> Back
        </button>

        {/* ── Business card ── */}
        <div className={sectionCls + ' text-center'}>
          {target.photoURL ? (
            <img src={target.photoURL} alt="" className="w-24 h-24 rounded-3xl object-cover border border-white/10 mx-auto mb-5" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-black text-3xl mx-auto mb-5">
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display">{name}</h1>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
            <span className="text-brand-accent">{roleLabel}</span>
            {target.country && <span className="flex items-center gap-1"><MapPin size={11} /> {target.country}</span>}
          </div>

          {startups.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/5">
              <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mb-3">Founder of</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {startups.map((s) => (
                  <span key={s.id} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-card border border-white/5 text-[10px] font-black uppercase tracking-wider text-brand-text-secondary">
                    <Rocket size={11} className="text-brand-accent" /> {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact card — privacy enforced */}
          <div className="mt-6 pt-5 border-t border-white/5">
            {canSeeContact ? (
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {email && contactBtn(`mailto:${email}`, Mail, 'Email', true)}
                {phone && contactBtn(`tel:${phone}`, Phone, 'Phone')}
                {linkedin && contactBtn(linkedin.startsWith('http') ? linkedin : `https://${linkedin}`, Linkedin, 'LinkedIn')}
                {website && contactBtn(website.startsWith('http') ? website : `https://${website}`, Globe, 'Website')}
                {calendly && contactBtn(calendly.startsWith('http') ? calendly : `https://${calendly}`, CalendarClock, 'Book Meeting', true)}
                {!email && !phone && !linkedin && !website && !calendly && (
                  <p className="text-xs font-medium text-brand-text-muted">No contact details shared yet.</p>
                )}
              </div>
            ) : (
              <p className="flex items-center justify-center gap-2 text-xs font-bold text-brand-text-muted">
                <Lock size={13} /> Contact details are {privacy === 'private' ? 'private' : privacy === 'connections' ? 'visible to connections only' : 'visible to investors only'}.
              </p>
            )}
          </div>
        </div>

        {/* ── About ── */}
        {(target.pfBio || target.tmBio) && (
          <div className={sectionCls}>
            <h2 className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest mb-4">About</h2>
            <p className="text-sm font-medium text-brand-text-secondary leading-relaxed whitespace-pre-wrap">{target.pfBio || target.tmBio}</p>
          </div>
        )}

        {/* ── Experience & Skills ── */}
        {(experience.length > 0 || skills.length > 0) && (
          <div className={sectionCls}>
            {experience.length > 0 && (<>
              <h2 className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest mb-4">Experience</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {experience.map((t) => <span key={t} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-brand-accent/10 text-brand-accent border border-brand-accent/20">{t}</span>)}
              </div>
            </>)}
            {skills.length > 0 && (<>
              <h2 className="text-[11px] font-black text-brand-text-muted uppercase tracking-widest mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(skills) ? skills : [skills]).map((t: string) => <span key={t} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-brand-card text-brand-text-secondary border border-white/5">{t}</span>)}
              </div>
            </>)}
          </div>
        )}
      </div>
    </div>
  );
}