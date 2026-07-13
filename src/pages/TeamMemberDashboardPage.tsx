import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  collection, query, where, getDocs, addDoc, updateDoc, setDoc, doc,
  serverTimestamp, increment,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  LayoutDashboard, Search, FileText, Bookmark, User as UserIcon, Settings,
  Loader2, Briefcase, MapPin, TrendingUp, ArrowRight, X, Check, Linkedin, Link2, Mail, Upload,
} from 'lucide-react';

// Same role list founders pick from in TeamLab, so profiles and positions match.
const ROLE_OPTIONS = [
  'Co-Founder (CTO)', 'Co-Founder (CEO)', 'Backend Developer', 'Frontend Developer',
  'Full-Stack Developer', 'Mobile Developer', 'UI/UX Designer', 'Product Manager',
  'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'QA Engineer',
  'Marketing Manager', 'Growth Lead', 'Sales Lead', 'Business Development',
  'Operations Manager', 'Customer Success', 'Finance Lead', 'Advisor',
];

interface TeamMemberDashboardPageProps {
  user: any;
}

type Tab = 'dashboard' | 'browse' | 'applications' | 'saved' | 'profile' | 'settings';

const NAV: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'browse', label: 'Browse Startups', icon: Search },
  { id: 'applications', label: 'My Applications', icon: FileText },
  { id: 'saved', label: 'Saved Startups', icon: Bookmark },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-brand-coral/10 text-brand-coral border-brand-coral/20',
};

export default function TeamMemberDashboardPage({ user }: TeamMemberDashboardPageProps) {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');

  const isTeamMember = (profile as any)?.accountType === 'teamMember';

  // Route protection: only team-member accounts.
  React.useEffect(() => {
    if (user === undefined) return;
    if (!user) { navigate('/'); return; }
    if (profile === null || profile === undefined) return;
    if (!isTeamMember) navigate('/');
  }, [user, profile, isTeamMember, navigate]);

  // ── Data: open positions + my applications ─────────────────────────────
  const [positions, setPositions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    if (!user || !isTeamMember) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      setDataError('');
      try {
        const [pSnap, aSnap] = await Promise.all([
          getDocs(query(collection(db, 'positions'), where('status', '==', 'open'))),
          getDocs(query(collection(db, 'applications'), where('applicantId', '==', user.uid))),
        ]);
        if (!cancelled) {
          setPositions(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
          setApplications(aSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        }
      } catch (e) {
        console.warn('Team dashboard load failed:', e);
        if (!cancelled) setDataError('Could not load startup positions. Please try again later.');
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, isTeamMember]);

  const appliedIds = new Set(applications.map((a) => a.positionId));

  // ── Saved positions (stored on the profile) ─────────────────────────────
  const [savedIds, setSavedIds] = useState<string[]>(
    ((profile as any)?.savedPositionIds || []) as string[]
  );
  useEffect(() => {
    const fromProfile = ((profile as any)?.savedPositionIds || []) as string[];
    if (fromProfile.length && savedIds.length === 0) setSavedIds(fromProfile);
  }, [profile]);

  const toggleSave = async (positionId: string) => {
    const next = savedIds.includes(positionId)
      ? savedIds.filter((id) => id !== positionId)
      : [...savedIds, positionId];
    setSavedIds(next);
    try {
      await setDoc(doc(db, 'profiles', user.uid), { savedPositionIds: next }, { merge: true });
    } catch (e) { console.warn('Save toggle failed:', e); }
  };

  // ── Apply flow ──────────────────────────────────────────────────────────
  const [applyingTo, setApplyingTo] = useState<any | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyBusy, setApplyBusy] = useState(false);
  const [applyError, setApplyError] = useState('');

  const submitApplication = async () => {
    if (!applyingTo) return;
    setApplyError('');
    setApplyBusy(true);
    try {
      const applicantName =
        (profile as any)?.displayName || (profile as any)?.fullName || user?.displayName || 'Team Member';
      const ref = await addDoc(collection(db, 'applications'), {
        positionId: applyingTo.id,
        positionTitle: applyingTo.title || '',
        startupId: applyingTo.startupId || null,
        startupName: applyingTo.startupName || null,
        founderId: applyingTo.founderId || null,
        applicantId: user.uid,
        applicantName,
        applicantEmail: (profile as any)?.email || user?.email || null,
        applicantHeadline: (profile as any)?.tmHeadline || null,
        applicantSkills: (profile as any)?.tmSkills || null,
        applicantLinkedin: (profile as any)?.tmLinkedin || null,
        applicantCvUrl: (profile as any)?.tmCvUrl || cvUrl || null,
        applicantCvName: (profile as any)?.tmCvName || cvName || null,
        message: applyMessage.trim() || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      try {
        await updateDoc(doc(db, 'positions', applyingTo.id), { applicantCount: increment(1) });
      } catch (e) { console.warn('applicantCount update failed:', e); }
      setApplications((a) => [
        { id: ref.id, positionId: applyingTo.id, positionTitle: applyingTo.title, startupName: applyingTo.startupName, status: 'pending', message: applyMessage.trim() || null },
        ...a,
      ]);
      setApplyingTo(null);
      setApplyMessage('');
    } catch (e) {
      console.warn('Application failed:', e);
      setApplyError('Could not send your application. Please try again.');
    } finally {
      setApplyBusy(false);
    }
  };

  // ── Profile form ────────────────────────────────────────────────────────
  const [pfHeadline, setPfHeadline] = useState((profile as any)?.tmHeadline || '');
  const [customRole, setCustomRole] = useState(
    Boolean((profile as any)?.tmHeadline && !ROLE_OPTIONS.includes((profile as any)?.tmHeadline))
  );
  const [pfSkills, setPfSkills] = useState(((profile as any)?.tmSkills || []).join?.(', ') || (profile as any)?.tmSkills || '');
  const [pfLinkedin, setPfLinkedin] = useState((profile as any)?.tmLinkedin || '');
  const [pfPortfolio, setPfPortfolio] = useState((profile as any)?.tmPortfolio || '');
  const [pfBio, setPfBio] = useState((profile as any)?.tmBio || '');
  const [pfBusy, setPfBusy] = useState(false);
  const [pfNotice, setPfNotice] = useState('');
  const [pfError, setPfError] = useState('');

  // ── CV upload (Firebase Storage) ────────────────────────────────────────
  const [cvUrl, setCvUrl] = useState((profile as any)?.tmCvUrl || '');
  const [cvName, setCvName] = useState((profile as any)?.tmCvName || '');
  const [cvUploading, setCvUploading] = useState(false);
  const [cvError, setCvError] = useState('');

  const uploadCv = async (file: File) => {
    setCvError('');
    if (file.size > 5 * 1024 * 1024) return setCvError('CV must be under 5MB.');
    const okTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!okTypes.includes(file.type)) return setCvError('Upload a PDF or Word document.');
    setCvUploading(true);
    try {
      const storage = getStorage();
      const ext = file.name.split('.').pop() || 'pdf';
      const ref = storageRef(storage, `cvs/${user.uid}/cv.${ext}`);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      setCvUrl(url);
      setCvName(file.name);
      // Persist immediately so it's never lost even if they skip Save Profile.
      await setDoc(doc(db, 'profiles', user.uid), { tmCvUrl: url, tmCvName: file.name }, { merge: true });
      await refreshProfile();
    } catch (e) {
      console.warn('CV upload failed:', e);
      setCvError('Upload failed. If this keeps happening, file storage may not be enabled yet — you can paste a link to your CV in the Portfolio field instead.');
    } finally {
      setCvUploading(false);
    }
  };

  const saveProfile = async () => {
    setPfNotice(''); setPfError('');
    setPfBusy(true);
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        tmHeadline: pfHeadline.trim(),
        tmSkills: pfSkills.split(',').map((s: string) => s.trim()).filter(Boolean),
        tmLinkedin: pfLinkedin.trim() || null,
        tmPortfolio: pfPortfolio.trim() || null,
        tmBio: pfBio.trim() || null,
      }, { merge: true });
      await refreshProfile();
      setPfNotice('Profile saved. Founders will see this when you apply.');
    } catch (e) {
      console.warn('Profile save failed:', e);
      setPfError('Could not save your profile. Please try again.');
    } finally {
      setPfBusy(false);
    }
  };

  // ── Browse search ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const visiblePositions = positions.filter((p) => {
    if (!q) return true;
    const hay = [p.title, p.startupName, p.industry, p.stage, (p.requiredSkills || []).join(' '), p.description]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
  const savedPositions = positions.filter((p) => savedIds.includes(p.id));

  if (!user || !isTeamMember) {
    return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>;
  }

  const fieldCls = 'w-full bg-brand-card border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';
  const labelCls = 'text-[11px] font-black text-brand-text-secondary uppercase tracking-widest mb-2 block';
  const firstName = ((profile as any)?.displayName || (profile as any)?.fullName || '').split(' ')[0] || '';

  const positionCard = (p: any, context: 'browse' | 'saved') => {
    const applied = appliedIds.has(p.id);
    const saved = savedIds.includes(p.id);
    return (
      <div key={p.id} className="bg-brand-card rounded-2xl p-6 border border-white/5 hover:border-brand-accent/40 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h5 className="text-base font-black text-brand-text-primary uppercase tracking-tight">{p.title}</h5>
            {p.startupName && <p className="text-xs text-brand-text-secondary font-bold mt-1">{p.startupName}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {p.industry && <span className="text-[9px] font-black uppercase text-brand-accent tracking-widest bg-brand-accent/5 px-2.5 py-1 rounded-lg border border-brand-accent/10">{p.industry}</span>}
              {p.employmentType && <span className="text-[9px] font-black uppercase text-[#5da9ff] tracking-widest bg-[#5da9ff]/5 px-2.5 py-1 rounded-lg border border-[#5da9ff]/10">{p.employmentType}</span>}
              {p.workType && <span className="text-[9px] font-black uppercase text-[#5da9ff] tracking-widest bg-[#5da9ff]/5 px-2.5 py-1 rounded-lg border border-[#5da9ff]/10">{p.workType}</span>}
              {p.experienceLevel && <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest bg-amber-400/5 px-2.5 py-1 rounded-lg border border-amber-400/10">{p.experienceLevel}</span>}
            </div>
          </div>
          <button
            onClick={() => toggleSave(p.id)}
            title={saved ? 'Remove from saved' : 'Save'}
            className={`shrink-0 p-2.5 rounded-xl border transition-all active:scale-95 ${saved ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30' : 'bg-brand-card text-brand-text-muted border-white/10 hover:text-white'}`}
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        {(p.requiredSkills || []).length > 0 && (
          <p className="text-xs text-brand-text-muted font-medium mt-3">
            <span className="font-black uppercase tracking-widest text-[9px]">Skills:</span> {(p.requiredSkills || []).join(', ')}
          </p>
        )}
        {p.description && <p className="text-sm text-brand-text-secondary font-medium mt-3 leading-relaxed">{p.description}</p>}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/5">
          {applied ? (
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400"><Check size={14} /> Applied</span>
          ) : (
            <button
              onClick={() => { setApplyError(''); setApplyMessage(''); setApplyingTo(p); }}
              className="px-6 py-3 bg-brand-accent text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              Apply <ArrowRight size={13} />
            </button>
          )}
          {context === 'saved' && (
            <button onClick={() => toggleSave(p.id)} className="ml-auto text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-coral transition-colors">Remove</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 h-max">
          <div className="bg-brand-section border border-brand-border rounded-[2rem] p-3">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20' : 'text-brand-text-secondary hover:text-white border border-transparent'}`}
                >
                  <Icon size={17} /> {n.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content */}
        <main>
          {/* ── Dashboard ── */}
          {tab === 'dashboard' && (
            <div>
              <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] block mb-3">Team Member</span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display mb-2">
                Welcome{firstName ? `, ${firstName}` : ''}
              </h1>
              <p className="text-sm text-brand-text-secondary font-medium mb-8">Find startups looking for people like you, apply, and track your applications.</p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Open positions', value: positions.length },
                  { label: 'My applications', value: applications.length },
                  { label: 'Saved', value: savedIds.length },
                ].map((s) => (
                  <div key={s.label} className="bg-brand-section border border-brand-border rounded-[1.75rem] p-6 text-center">
                    <div className="text-2xl font-black text-brand-text-primary">{loadingData ? '—' : s.value}</div>
                    <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <button onClick={() => setTab('browse')} className="text-left p-6 rounded-[2rem] bg-brand-section border border-brand-border hover:border-brand-accent/40 transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent"><Search size={22} /></div>
                  <div><h3 className="text-sm font-black uppercase tracking-tight">Browse Startups</h3><p className="text-xs text-brand-text-secondary font-medium mt-1">See who's hiring.</p></div>
                </button>
                <button onClick={() => setTab('profile')} className="text-left p-6 rounded-[2rem] bg-brand-section border border-brand-border hover:border-brand-accent/40 transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent"><UserIcon size={22} /></div>
                  <div><h3 className="text-sm font-black uppercase tracking-tight">Complete Your Profile</h3><p className="text-xs text-brand-text-secondary font-medium mt-1">Founders see this when you apply.</p></div>
                </button>
              </div>
            </div>
          )}

          {/* ── Browse ── */}
          {tab === 'browse' && (
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Browse Startups</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-6">Open positions published by founders on DecisionLab.</p>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by role, startup, industry, or skill…"
                  className={fieldCls + ' pl-11'}
                />
              </div>
              {loadingData ? (
                <div className="py-16 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>
              ) : dataError ? (
                <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3">{dataError}</p>
              ) : visiblePositions.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto">
                    {positions.length === 0
                      ? 'No open positions yet. As founders publish openings in TeamLab, they will appear here.'
                      : 'No positions match your search.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">{visiblePositions.map((p) => positionCard(p, 'browse'))}</div>
              )}
            </div>
          )}

          {/* ── Applications ── */}
          {tab === 'applications' && (
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-2">My Applications</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-6">Everything you've applied to, and where it stands.</p>
              {loadingData ? (
                <div className="py-16 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>
              ) : applications.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto">You haven't applied to any positions yet. Head to Browse Startups to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((a) => (
                    <div key={a.id} className="bg-brand-card rounded-2xl p-6 border border-white/5 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h5 className="text-sm font-black text-brand-text-primary uppercase tracking-tight">{a.positionTitle || 'Position'}</h5>
                        {a.startupName && <p className="text-xs text-brand-text-secondary font-bold mt-1">{a.startupName}</p>}
                        {a.message && <p className="text-xs text-brand-text-muted font-medium mt-2 leading-relaxed">"{a.message}"</p>}
                      </div>
                      <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${STATUS_STYLE[a.status] || STATUS_STYLE.pending}`}>
                        {a.status || 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Saved ── */}
          {tab === 'saved' && (
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Saved Startups</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-6">Positions you bookmarked to come back to.</p>
              {loadingData ? (
                <div className="py-16 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>
              ) : savedPositions.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-brand-text-secondary font-medium max-w-md mx-auto">Nothing saved yet. Tap the bookmark icon on any position in Browse Startups.</p>
                </div>
              ) : (
                <div className="space-y-4">{savedPositions.map((p) => positionCard(p, 'saved'))}</div>
              )}
            </div>
          )}

          {/* ── Profile ── */}
          {tab === 'profile' && (
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Profile</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-6">Founders see this information with every application you send.</p>
              <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 space-y-5">
                <div>
                  <label className={labelCls}>Headline / Role</label>
                  {!customRole ? (
                    <select
                      value={ROLE_OPTIONS.includes(pfHeadline) ? pfHeadline : ''}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') { setCustomRole(true); setPfHeadline(''); }
                        else setPfHeadline(e.target.value);
                      }}
                      className={fieldCls + ' appearance-none'}
                    >
                      <option value="" disabled className="bg-[#102434]">Select your role</option>
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r} className="bg-[#102434]">{r}</option>
                      ))}
                      <option value="__custom__" className="bg-[#102434]">+ Custom role…</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input value={pfHeadline} onChange={(e) => setPfHeadline(e.target.value)} placeholder="Type your role" className={fieldCls} autoFocus />
                      <button type="button" onClick={() => { setCustomRole(false); setPfHeadline(''); }} className="px-4 rounded-2xl bg-brand-card border border-white/10 text-brand-text-muted hover:text-white text-[10px] font-black uppercase tracking-widest">List</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>CV / Resume</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 ${cvUploading ? 'opacity-50 pointer-events-none' : ''} bg-brand-card border-white/10 text-brand-text-primary hover:border-brand-accent/40`}>
                      {cvUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      {cvUrl ? 'Replace CV' : 'Upload CV'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCv(f); e.target.value = ''; }}
                      />
                    </label>
                    {cvUrl && (
                      <a href={cvUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-brand-accent hover:underline truncate">
                        <FileText size={14} /> {cvName || 'View uploaded CV'}
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] text-brand-text-muted font-medium mt-2">PDF or Word, up to 5MB. Sent to founders with every application.</p>
                  {cvError && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3 mt-2">{cvError}</p>}
                </div>
                <div>
                  <label className={labelCls}>Skills (comma separated)</label>
                  <input value={pfSkills} onChange={(e) => setPfSkills(e.target.value)} placeholder="React, Node.js, Figma…" className={fieldCls} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>LinkedIn</label>
                    <input value={pfLinkedin} onChange={(e) => setPfLinkedin(e.target.value)} placeholder="https://linkedin.com/in/you" className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Portfolio / GitHub</label>
                    <input value={pfPortfolio} onChange={(e) => setPfPortfolio(e.target.value)} placeholder="https://…" className={fieldCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Short bio</label>
                  <textarea value={pfBio} onChange={(e) => setPfBio(e.target.value)} rows={4} placeholder="A few lines about you and what you're looking for…" className={fieldCls} />
                </div>
                {pfError && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3">{pfError}</p>}
                {pfNotice && <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">{pfNotice}</p>}
                <button onClick={saveProfile} disabled={pfBusy} className="w-full py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {pfBusy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Profile
                </button>
              </div>
            </div>
          )}

          {/* ── Settings ── */}
          {tab === 'settings' && (
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-display mb-2">Settings</h2>
              <p className="text-sm text-brand-text-secondary font-medium mb-6">Your account details.</p>
              <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-brand-text-secondary font-medium">
                  <Mail size={16} className="text-brand-accent" /> {(profile as any)?.email || user?.email || '—'}
                </div>
                <div className="flex items-center gap-3 text-sm text-brand-text-secondary font-medium">
                  <UserIcon size={16} className="text-brand-accent" /> Account type: Team Member
                </div>
                <p className="text-xs text-brand-text-muted font-medium pt-2">
                  Use the menu in the top-right corner to log out.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Apply modal ── */}
      {applyingTo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-section border border-brand-border rounded-[2.5rem] max-w-lg w-full p-8 relative">
            <button onClick={() => setApplyingTo(null)} className="absolute top-6 right-6 text-brand-text-muted hover:text-white transition-colors"><X size={18} /></button>
            <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.35em] block mb-2">Apply</span>
            <h3 className="text-xl font-black uppercase tracking-tight font-display">{applyingTo.title}</h3>
            {applyingTo.startupName && <p className="text-xs text-brand-text-secondary font-bold mt-1 mb-5">{applyingTo.startupName}</p>}
            <label className={labelCls + ' mt-4'}>Message to the founder (optional)</label>
            <textarea
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              rows={4}
              placeholder="Why you're a fit for this role…"
              className={fieldCls}
            />
            <p className="text-[10px] text-brand-text-muted font-medium mt-3">
              Your name, email, profile (headline, skills, LinkedIn){(profile as any)?.tmCvUrl || cvUrl ? ', and CV' : ''} are sent with the application.
            </p>
            {applyError && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3 mt-4">{applyError}</p>}
            <button onClick={submitApplication} disabled={applyBusy} className="w-full mt-5 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {applyBusy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} Send Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}