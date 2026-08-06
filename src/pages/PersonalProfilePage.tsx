import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  User as UserIcon, MapPin, Calendar, Rocket, Pencil, Check, Loader2,
  Mail, Phone, Linkedin, Globe, CalendarClock, Shield, Award, ArrowRight, X,
} from 'lucide-react';
import { getCalculatedVentureScore } from '../components/ResultsDashboard';

// ─────────────────────────────────────────────────────────────────────────────
// PersonalProfilePage — every user's personal profile, separate from startups.
// Created automatically at signup; nothing is filled twice. Contains the
// contact card (with privacy), about, experience & skills tags, education,
// the auto-generated startup portfolio, and auto-earned achievements.
// ─────────────────────────────────────────────────────────────────────────────

const EXPERIENCE_TAGS = ['Founder', 'CEO', 'Product Manager', 'Software Engineer', 'Designer', 'Marketing', 'Sales'];
const SKILL_TAGS = ['AI', 'SaaS', 'Cybersecurity', 'Fintech', 'Pitching', 'Fundraising', 'Growth', 'Leadership', 'Product', 'UI/UX'];
const PRIVACY_OPTIONS = [
  { id: 'public', label: 'Public' },
  { id: 'investors', label: 'Investors Only' },
  { id: 'connections', label: 'Connections Only' },
  { id: 'private', label: 'Private' },
];
const CONTACT_METHODS = ['Email', 'Phone', 'LinkedIn', 'Calendly'];

export default function PersonalProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const p: any = profile || {};

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Editable fields, pre-filled from the profile (never filled twice).
  const formInitialized = useRef(false);
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (formInitialized.current) return;
    if (!profile) return;
    formInitialized.current = true;
    setForm({
      phone: p.phone || '',
      city: p.city || '',
      linkedin: p.pfLinkedin || p.tmLinkedin || '',
      website: p.pfWebsite || '',
      calendly: p.pfCalendly || '',
      preferredContact: p.preferredContact || 'Email',
      privacy: p.profilePrivacy || 'investors',
      bio: p.pfBio || p.tmBio || '',
      experienceTags: p.experienceTags || [],
      skillsTags: p.skillsTags || [],
      university: p.university || '',
      degree: p.degree || '',
      certificates: p.certificates || '',
    });
  }, [profile]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const toggleTag = (k: 'experienceTags' | 'skillsTags', tag: string) =>
    set(k, form[k].includes(tag) ? form[k].filter((t: string) => t !== tag) : [...form[k], tag]);

  // Auto data: startup portfolio + achievements.
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [ach, setAch] = useState({ startup: false, analysis: false, deck: false, investor: false, team: false });
  const [loadingAuto, setLoadingAuto] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setLoadingAuto(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [sSnap, aSnap, dSnap, tSnap] = await Promise.all([
          getDocs(query(collection(db, 'startups'), where('founderId', '==', user.uid))),
          getDocs(query(collection(db, 'analyses'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'pitchDecks'), where('userId', '==', user.uid))).catch(() => ({ docs: [] as any[] })),
          getDocs(query(collection(db, 'teams'), where('founderId', '==', user.uid))).catch(() => ({ docs: [] as any[] })),
        ]);
        if (cancelled) return;
        const startups = sSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setPortfolio(startups.filter((s) => s.status === 'complete'));
        const analyses = aSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        const map: Record<string, number> = {};
        analyses.forEach((a) => {
          if (!a.startupId) return;
          const v = a.scores ? getCalculatedVentureScore(a.scores) : Number(a.overallScore ?? a.shareScore ?? NaN);
          if (!isNaN(v) && v > 0) map[a.startupId] = v;
        });
        setScores(map);
        setAch({
          startup: startups.length > 0,
          analysis: analyses.length > 0,
          deck: (dSnap.docs || []).length > 0,
          investor: analyses.some((a) => a.submittedToInvestors === true || a.sharedWithInvestors === true),
          team: (tSnap.docs || []).length > 0,
        });
      } catch (e) { console.warn('Profile auto-data failed:', e); }
      finally { if (!cancelled) setLoadingAuto(false); }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const save = async () => {
    setError(''); setNotice('');
    setBusy(true);
    try {
      await setDoc(doc(db, 'profiles', user!.uid), {
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        pfLinkedin: form.linkedin.trim() || null,
        pfWebsite: form.website.trim() || null,
        pfCalendly: form.calendly.trim() || null,
        preferredContact: form.preferredContact,
        profilePrivacy: form.privacy,
        pfBio: form.bio.trim() || null,
        experienceTags: form.experienceTags,
        skillsTags: form.skillsTags,
        university: form.university.trim() || null,
        degree: form.degree.trim() || null,
        certificates: form.certificates.trim() || null,
      }, { merge: true });
      await refreshProfile();
      setNotice('Profile saved.');
      setEditing(false);
    } catch (e) {
      console.warn('Profile save failed:', e);
      setError('Could not save. Please try again.');
    } finally { setBusy(false); }
  };

  const displayName = p.displayName || p.fullName || user?.displayName || 'Member';
  const roleLabel = p.accountType === 'investor' ? (p.investorBadge || 'Investor')
    : p.accountType === 'teamMember' ? 'Team Member'
    : (p.roleType || 'Founder');
  const joined = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  const field = 'w-full bg-brand-card border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';
  const label = 'text-[11px] font-black text-brand-text-secondary uppercase tracking-widest mb-2 block';
  const chip = (active: boolean) => `px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 ${active ? 'bg-brand-accent text-brand-bg border-brand-accent' : 'bg-brand-card text-brand-text-secondary border-white/5 hover:text-white'} ${editing ? 'cursor-pointer' : 'pointer-events-none'}`;
  const sectionCls = 'bg-brand-section border border-brand-border rounded-[2.5rem] p-8 mb-5';
  const sectionTitle = 'text-[11px] font-black text-brand-text-muted uppercase tracking-widest mb-5';

  if (!user) return null;

  const contactRows = [
    { icon: Mail, label: 'Email', value: p.email || user.email },
    { icon: Phone, label: 'Phone', value: form.phone, key: 'phone', placeholder: '+973 …' },
    { icon: MapPin, label: 'Country', value: p.country || '—' },
    { icon: MapPin, label: 'City', value: form.city, key: 'city', placeholder: 'e.g. Manama' },
    { icon: Linkedin, label: 'LinkedIn', value: form.linkedin, key: 'linkedin', placeholder: 'https://linkedin.com/in/…' },
    { icon: Globe, label: 'Website', value: form.website, key: 'website', placeholder: 'https://…' },
    { icon: CalendarClock, label: 'Calendly', value: form.calendly, key: 'calendly', placeholder: 'https://calendly.com/…' },
  ];

  const achievements = [
    { done: ach.startup, label: 'First Startup' },
    { done: ach.analysis, label: 'First Analysis' },
    { done: ach.deck, label: 'First Pitch Deck' },
    { done: ach.investor, label: 'First Investor Match' },
    { done: ach.team, label: 'Team Built' },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary px-6 py-14">
      <div className="max-w-3xl mx-auto">

        {/* ── Header ── */}
        <div className={sectionCls}>
          <div className="flex items-center gap-6">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-20 h-20 rounded-3xl object-cover border border-white/10 shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0">
                <UserIcon size={32} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display truncate">{displayName}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
                <span className="text-brand-accent">{roleLabel}</span>
                {p.country && <span className="flex items-center gap-1"><MapPin size={11} /> {p.country}</span>}
                <span className="flex items-center gap-1"><Calendar size={11} /> Joined {joined}</span>
                <span className="flex items-center gap-1"><Rocket size={11} /> {loadingAuto ? '…' : portfolio.length} Startup{portfolio.length === 1 ? '' : 's'}</span>
              </div>
            </div>
            <button
              onClick={() => (editing ? save() : setEditing(true))}
              disabled={busy}
              className="shrink-0 px-6 py-3.5 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : editing ? <Check size={14} /> : <Pencil size={14} />}
              {editing ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>
          {error && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3 mt-5">{error}</p>}
          {notice && <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mt-5">{notice}</p>}
        </div>

        {/* ── Contact Card ── */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={sectionTitle + ' mb-0'}>Contact Card</h2>
            <span className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest">Visible to investors, accepted team members & you</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
            {contactRows.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label}>
                  <label className={label}>{r.label}</label>
                  {editing && r.key ? (
                    <input value={form[r.key]} onChange={(e) => set(r.key!, e.target.value)} placeholder={r.placeholder} className={field} />
                  ) : (
                    <div className="flex items-center gap-2.5 text-sm font-medium text-brand-text-secondary min-h-[1.5rem]">
                      <Icon size={14} className="text-brand-accent shrink-0" />
                      <span className="truncate">{r.value || <span className="text-brand-text-muted">—</span>}</span>
                    </div>
                  )}
                </div>
              );
            })}
            <div>
              <label className={label}>Preferred Contact Method</label>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {CONTACT_METHODS.map((m) => (
                    <button key={m} onClick={() => set('preferredContact', m)} className={chip(form.preferredContact === m)}>{m}</button>
                  ))}
                </div>
              ) : (
                <div className="text-sm font-medium text-brand-text-secondary">{form.preferredContact}</div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/5">
            <label className={label + ' flex items-center gap-2'}><Shield size={12} /> Profile Privacy</label>
            <div className="flex flex-wrap gap-2">
              {PRIVACY_OPTIONS.map((o) => (
                <button key={o.id} onClick={() => editing && set('privacy', o.id)} className={chip(form.privacy === o.id)}>{o.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── About ── */}
        <div className={sectionCls}>
          <h2 className={sectionTitle}>About</h2>
          {editing ? (
            <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={4}
              placeholder="Who are you? What do you build? Your experience and mission…" className={field} />
          ) : (
            <p className="text-sm font-medium text-brand-text-secondary leading-relaxed whitespace-pre-wrap">
              {form.bio || <span className="text-brand-text-muted">Add a short bio — who you are, what you build, your experience and mission.</span>}
            </p>
          )}
        </div>

        {/* ── Experience & Skills ── */}
        <div className={sectionCls}>
          <h2 className={sectionTitle}>Experience</h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {EXPERIENCE_TAGS.map((t) => <button key={t} onClick={() => editing && toggleTag('experienceTags', t)} className={chip(form.experienceTags?.includes(t))}>{t}</button>)}
          </div>
          <h2 className={sectionTitle}>Skills</h2>
          <div className="flex flex-wrap gap-2">
            {SKILL_TAGS.map((t) => <button key={t} onClick={() => editing && toggleTag('skillsTags', t)} className={chip(form.skillsTags?.includes(t))}>{t}</button>)}
          </div>
        </div>

        {/* ── Education ── */}
        <div className={sectionCls}>
          <h2 className={sectionTitle}>Education</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={label}>University</label>
              {editing ? <input value={form.university} onChange={(e) => set('university', e.target.value)} className={field} placeholder="e.g. University of Bahrain" />
                : <div className="text-sm font-medium text-brand-text-secondary">{form.university || '—'}</div>}
            </div>
            <div><label className={label}>Degree</label>
              {editing ? <input value={form.degree} onChange={(e) => set('degree', e.target.value)} className={field} placeholder="e.g. BSc Computer Science" />
                : <div className="text-sm font-medium text-brand-text-secondary">{form.degree || '—'}</div>}
            </div>
            <div className="sm:col-span-2"><label className={label}>Certificates</label>
              {editing ? <input value={form.certificates} onChange={(e) => set('certificates', e.target.value)} className={field} placeholder="Comma separated" />
                : <div className="text-sm font-medium text-brand-text-secondary">{form.certificates || '—'}</div>}
            </div>
          </div>
        </div>

        {/* ── Startup Portfolio (auto) ── */}
        {p.accountType !== 'investor' && p.accountType !== 'teamMember' && (
          <div className={sectionCls}>
            <div className="flex items-center justify-between mb-5">
              <h2 className={sectionTitle + ' mb-0'}>Startup Portfolio</h2>
              <span className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest">Automatically generated</span>
            </div>
            {loadingAuto ? (
              <div className="py-6 flex justify-center"><Loader2 size={18} className="animate-spin text-brand-accent" /></div>
            ) : portfolio.length === 0 ? (
              <p className="text-sm font-medium text-brand-text-muted">No completed startups yet — they appear here automatically.</p>
            ) : (
              <div className="space-y-3">
                {portfolio.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-4 bg-brand-card rounded-2xl px-5 py-4 border border-white/5">
                    <div className="flex items-center gap-4 min-w-0">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-black shrink-0">
                          {(s.name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-black uppercase tracking-tight truncate">{s.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-muted">{s.founderRole || 'Founder'}</span>
                          {scores[s.id] && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{scores[s.id]}%</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/startups/${s.id}`)} className="shrink-0 px-4 py-2.5 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-accent/20 active:scale-95 transition-all flex items-center gap-1.5">
                      Open Workspace <ArrowRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Achievements (auto) ── */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={sectionTitle + ' mb-0'}>Achievements</h2>
            <span className="text-[9px] font-bold text-brand-text-muted uppercase tracking-widest">Automatically earned</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {achievements.map((a) => (
              <span key={a.label} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${a.done ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-brand-card text-brand-text-muted border-white/5 opacity-60'}`}>
                {a.done ? <Check size={13} /> : <Award size={13} />} {a.label}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}