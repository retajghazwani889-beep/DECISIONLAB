import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { EMPLOYMENT_TYPES, WORK_TYPES, EXPERIENCE_LEVELS } from '../TeamLab';
import type { EmploymentType, WorkType, ExperienceLevel } from '../TeamLab';
import {
  Users, UserPlus, Plus, X, Loader2, Briefcase, MapPin, TrendingUp,
  Linkedin, Mail, Trash2, Check, Search, FileText, ChevronDown, Target,
} from 'lucide-react';

// Common roles for the dropdown, grouped so founders pick fast. "Suggested"
// is derived from the startup's industry (tailored, no AI call needed).
const COMMON_ROLES = [
  'Co-Founder (CTO)', 'Co-Founder (CEO)', 'Backend Developer', 'Frontend Developer',
  'Full-Stack Developer', 'Mobile Developer', 'UI/UX Designer', 'Product Manager',
  'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'QA Engineer',
  'Marketing Manager', 'Growth Lead', 'Sales Lead', 'Business Development',
  'Operations Manager', 'Customer Success', 'Finance Lead', 'Advisor',
];

const INDUSTRY_ROLE_HINTS: Record<string, string[]> = {
  fintech: ['Backend Developer', 'ML Engineer', 'Compliance Specialist', 'Security Engineer', 'Data Scientist'],
  healthtech: ['Backend Developer', 'ML Engineer', 'Regulatory / Compliance Lead', 'Clinical Advisor', 'UI/UX Designer'],
  health: ['Backend Developer', 'Clinical Advisor', 'Regulatory / Compliance Lead', 'UI/UX Designer'],
  cybersecurity: ['Security Engineer', 'Backend Developer', 'ML Engineer', 'DevOps Engineer'],
  ecommerce: ['Full-Stack Developer', 'Growth Lead', 'Operations Manager', 'UI/UX Designer', 'Marketing Manager'],
  edtech: ['Full-Stack Developer', 'Content Lead', 'UI/UX Designer', 'Growth Lead'],
  saas: ['Backend Developer', 'Frontend Developer', 'Product Manager', 'Growth Lead', 'Customer Success'],
  climatetech: ['Hardware Engineer', 'Data Scientist', 'Operations Manager', 'Business Development'],
  logistics: ['Backend Developer', 'Operations Manager', 'Data Scientist', 'Business Development'],
  marketplace: ['Full-Stack Developer', 'Growth Lead', 'Operations Manager', 'Business Development'],
};

const suggestRoles = (industry?: string): string[] => {
  const key = (industry || '').toLowerCase().replace(/[^a-z]/g, '');
  for (const k of Object.keys(INDUSTRY_ROLE_HINTS)) {
    if (key.includes(k)) return INDUSTRY_ROLE_HINTS[k];
  }
  return ['Backend Developer', 'Frontend Developer', 'Product Manager', 'Growth Lead'];
};


interface TeamLabPanelProps {
  startupId: string;
  founderId: string;
  startupName?: string;
  industry?: string;
  stage?: string;
  /** Whether the current viewer owns this startup (only owner can edit). */
  canEdit: boolean;
}

const APP_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-brand-coral/10 text-brand-coral border-brand-coral/20',
};

export default function TeamLabPanel({ startupId, founderId, startupName, industry, stage, canEdit }: TeamLabPanelProps) {
  const navigate = useNavigate();
  const [team, setTeam] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [busy, setBusy] = useState(false);

  // Which position's applicant list is expanded.
  const [openApplicants, setOpenApplicants] = useState<string | null>(null);

  const [mForm, setMForm] = useState({ fullName: '', position: '', linkedin: '', email: '' });
  const [customTitle, setCustomTitle] = useState(false);
  const [pForm, setPForm] = useState({
    title: '', employmentType: '' as EmploymentType | '', workType: '' as WorkType | '',
    experienceLevel: '' as ExperienceLevel | '', requiredSkills: '', description: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      // teams + applications are founder-private in the security rules, so the
      // queries must be founder-scoped or Firestore rejects them outright.
      const [tSnap, pSnap, aSnap] = await Promise.all([
        getDocs(query(collection(db, 'teams'), where('founderId', '==', founderId), where('startupId', '==', startupId))),
        getDocs(query(collection(db, 'positions'), where('startupId', '==', startupId))),
        getDocs(query(collection(db, 'applications'), where('founderId', '==', founderId), where('startupId', '==', startupId))),
      ]);
      setTeam(tSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setPositions(pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setApps(aSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.warn('TeamLab load failed:', e);
      setError('Could not load TeamLab data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (startupId) load(); }, [startupId]);

  // ── Team gaps: the roles the founder said they're LOOKING FOR in the
  // setup wizard. TeamLab's startupId is the analysis id; the analysis
  // points at its startup record, which carries lookingFor.
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  useEffect(() => {
    if (!startupId) return;
    let cancelled = false;
    (async () => {
      try {
        const aSnap = await getDoc(doc(db, 'analyses', startupId));
        const linkedStartupId = (aSnap.exists() ? (aSnap.data() as any)?.startupId : null) || null;
        if (!linkedStartupId) return;
        const sSnap = await getDoc(doc(db, 'startups', linkedStartupId));
        if (!cancelled && sSnap.exists()) {
          setLookingFor(((sSnap.data() as any)?.lookingFor || []) as string[]);
        }
      } catch (e) { /* non-fatal — gaps board simply hides */ }
    })();
    return () => { cancelled = true; };
  }, [startupId]);

  // Map wizard roles to publishable titles + matching keywords.
  const GAP_ROLE_MAP: Record<string, { title: string; match: string[] }> = {
    'Co-founder': { title: 'Co-Founder (CTO)', match: ['co-founder', 'cofounder', 'cto', 'ceo'] },
    'Developer': { title: 'Full-Stack Developer', match: ['developer', 'engineer'] },
    'Designer': { title: 'UI/UX Designer', match: ['design'] },
    'Marketing': { title: 'Marketing Manager', match: ['marketing', 'growth'] },
    'Sales': { title: 'Sales Lead', match: ['sales', 'business development'] },
    'Operations': { title: 'Operations Manager', match: ['operations', 'ops'] },
    'Finance': { title: 'Finance Lead', match: ['finance', 'cfo'] },
    'Advisor': { title: 'Advisor', match: ['advisor', 'mentor'] },
  };
  const gapStatus = (role: string): { state: 'filled' | 'open' | 'missing'; who?: string } => {
    const keys = GAP_ROLE_MAP[role]?.match || [role.toLowerCase()];
    const member = team.find((m) => keys.some((k) => (m.position || '').toLowerCase().includes(k)));
    if (member) return { state: 'filled', who: member.fullName };
    const openPos = positions.find((p) => p.status === 'open' && keys.some((k) => (p.title || '').toLowerCase().includes(k)));
    if (openPos) return { state: 'open' };
    return { state: 'missing' };
  };
  const publishForRole = (role: string) => {
    setCustomTitle(false);
    setPForm((f) => ({ ...f, title: GAP_ROLE_MAP[role]?.title || role }));
    setShowPositionForm(true);
    setError('');
  };

  const appsFor = (positionId: string) => apps.filter((a) => a.positionId === positionId);

  // Accept / reject an application. The team member sees this status change
  // instantly in their "My Applications" tab. Accepting also adds them to
  // the Current Team list.
  const setAppStatus = async (app: any, status: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'applications', app.id), { status, decidedAt: serverTimestamp() });
      setApps((arr) => arr.map((a) => (a.id === app.id ? { ...a, status } : a)));
      if (status === 'accepted') {
        const already = team.some((m) => m.applicantId === app.applicantId);
        if (!already) {
          const ref = await addDoc(collection(db, 'teams'), {
            startupId, founderId,
            fullName: app.applicantName || 'Team Member',
            position: app.positionTitle || app.applicantHeadline || 'Team Member',
            linkedin: app.applicantLinkedin || null,
            email: app.applicantEmail || null,
            applicantId: app.applicantId || null,
            createdAt: serverTimestamp(),
          });
          setTeam((t) => [...t, {
            id: ref.id,
            fullName: app.applicantName, position: app.positionTitle || app.applicantHeadline,
            linkedin: app.applicantLinkedin, email: app.applicantEmail, applicantId: app.applicantId,
          }]);
        }
      }
    } catch (e) {
      console.warn('Application status update failed:', e);
    }
  };

  const addMember = async () => {
    setError('');
    if (!mForm.fullName.trim() || !mForm.position.trim()) return setError('Full name and position are required.');
    setBusy(true);
    try {
      const ref = await addDoc(collection(db, 'teams'), {
        startupId, founderId,
        fullName: mForm.fullName.trim(), position: mForm.position.trim(),
        linkedin: mForm.linkedin.trim() || null, email: mForm.email.trim() || null,
        createdAt: serverTimestamp(),
      });
      setTeam((t) => [...t, { id: ref.id, ...mForm }]);
      setMForm({ fullName: '', position: '', linkedin: '', email: '' });
      setShowMemberForm(false);
    } catch (e) { console.warn(e); setError('Could not add member.'); }
    finally { setBusy(false); }
  };

  const removeMember = async (id: string) => {
    try { await deleteDoc(doc(db, 'teams', id)); setTeam((t) => t.filter((m) => m.id !== id)); }
    catch (e) { console.warn(e); }
  };

  const publishPosition = async () => {
    setError('');
    if (!pForm.title.trim()) return setError('Position title is required.');
    if (!pForm.employmentType || !pForm.workType || !pForm.experienceLevel) return setError('Choose employment type, work type, and experience level.');
    setBusy(true);
    try {
      const skills = pForm.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const ref = await addDoc(collection(db, 'positions'), {
        startupId, founderId, startupName: startupName || null, industry: industry || null, stage: stage || null,
        title: pForm.title.trim(), employmentType: pForm.employmentType, workType: pForm.workType,
        experienceLevel: pForm.experienceLevel, requiredSkills: skills, description: pForm.description.trim(),
        status: 'open', applicantCount: 0, createdAt: serverTimestamp(),
      });
      setPositions((p) => [...p, { id: ref.id, ...pForm, requiredSkills: skills, status: 'open', applicantCount: 0 }]);
      setPForm({ title: '', employmentType: '', workType: '', experienceLevel: '', requiredSkills: '', description: '' });
      setShowPositionForm(false);
    } catch (e) { console.warn(e); setError('Could not publish position.'); }
    finally { setBusy(false); }
  };

  const togglePosition = async (p: any) => {
    const next = p.status === 'open' ? 'closed' : 'open';
    try {
      await updateDoc(doc(db, 'positions', p.id), { status: next });
      setPositions((arr) => arr.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    } catch (e) { console.warn(e); }
  };

  const field = 'w-full bg-brand-card border border-white/5 rounded-2xl px-5 py-3.5 text-base text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';
  const label = 'text-xs font-black text-brand-text-secondary uppercase tracking-widest mb-2 block';
  const chip = (active: boolean) => `px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all active:scale-95 ${active ? 'bg-brand-accent text-brand-bg border-brand-accent' : 'bg-brand-card text-brand-text-secondary border-white/5 hover:text-white'}`;

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.35em] block mb-3">TeamLab</span>
        <h3 className="text-3xl font-black text-white uppercase tracking-tight font-display mb-2 drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]">Build Your Team</h3>
        <p className="text-base text-slate-300 font-medium">Add your existing team members and post open positions for people to apply.</p>
      </div>

      {error && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3">{error}</p>}

      {/* ── Current Team ─────────────────────────────────────────────────── */}
      <section className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-black text-white uppercase tracking-tight font-display flex items-center gap-3"><Users size={22} className="text-brand-accent" /> Current Team</h4>
          {canEdit && (
            <button onClick={() => { setShowMemberForm((v) => !v); setError(''); }} className="px-4 py-2.5 bg-brand-card border border-white/10 text-brand-text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center gap-2">
              {showMemberForm ? <X size={13} /> : <Plus size={13} />} {showMemberForm ? 'Cancel' : 'Add Member'}
            </button>
          )}
        </div>

        {showMemberForm && canEdit && (
          <div className="bg-brand-card rounded-2xl p-6 mb-6 border border-white/5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className={label}>Full Name</label><input value={mForm.fullName} onChange={(e) => setMForm({ ...mForm, fullName: e.target.value })} placeholder="Ahmed Ali" className={field} /></div>
              <div><label className={label}>Position</label><input value={mForm.position} onChange={(e) => setMForm({ ...mForm, position: e.target.value })} placeholder="Backend Developer" className={field} /></div>
              <div><label className={label}>LinkedIn (optional)</label><input value={mForm.linkedin} onChange={(e) => setMForm({ ...mForm, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." className={field} /></div>
              <div><label className={label}>Email (optional)</label><input value={mForm.email} onChange={(e) => setMForm({ ...mForm, email: e.target.value })} placeholder="name@email.com" className={field} /></div>
            </div>
            <button onClick={addMember} disabled={busy} className="w-full py-3.5 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Add Team Member
            </button>
          </div>
        )}

        {team.length === 0 ? (
          <p className="text-base text-brand-text-muted font-medium py-4">No team members added yet.</p>
        ) : (
          <div className="space-y-2">
            {team.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-brand-card rounded-2xl px-5 py-4 border border-white/5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-black text-sm shrink-0">{(m.fullName || '?').slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0">
                    {m.applicantId ? (
                      <button onClick={() => navigate(`/profile/${m.applicantId}`)} className="text-base font-black text-white truncate hover:text-brand-accent hover:underline transition-colors text-left">
                        {m.fullName}
                      </button>
                    ) : (
                      <div className="text-base font-black text-white truncate">{m.fullName}</div>
                    )}
                    <div className="text-sm text-slate-400 font-medium">{m.position}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {m.linkedin && <a href={m.linkedin} target="_blank" rel="noreferrer" className="text-brand-text-muted hover:text-brand-accent"><Linkedin size={15} /></a>}
                  {m.email && <a href={`mailto:${m.email}`} className="text-brand-text-muted hover:text-brand-accent"><Mail size={15} /></a>}
                  {canEdit && <button onClick={() => removeMember(m.id)} className="text-brand-text-muted hover:text-brand-coral"><Trash2 size={15} /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Team Gaps ────────────────────────────────────────────────────── */}
      {lookingFor.length > 0 && (
        <section className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8">
          <h4 className="text-xl font-black text-white uppercase tracking-tight font-display flex items-center gap-3 mb-2">
            <Target size={20} className="text-brand-accent" /> Team Gaps
          </h4>
          <p className="text-base text-slate-300 font-medium mb-6">The roles you said you're looking for — filled, open, or still missing.</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-brand-card rounded-2xl px-5 py-3.5 border border-emerald-500/10">
              <span className="text-sm font-black text-brand-text-primary">Founder</span>
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400"><Check size={13} /> You</span>
            </div>
            {lookingFor.map((role) => {
              const g = gapStatus(role);
              return (
                <div key={role} className="flex items-center justify-between gap-3 bg-brand-card rounded-2xl px-5 py-3.5 border border-white/5">
                  <span className="text-sm font-black text-brand-text-primary">{role}</span>
                  {g.state === 'filled' ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400"><Check size={13} /> {g.who}</span>
                  ) : g.state === 'open' ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5da9ff]">Position open — receiving applications</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Missing</span>
                      {canEdit && (
                        <button onClick={() => publishForRole(role)} className="px-4 py-2 bg-brand-accent text-brand-bg text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all">
                          Find Team Members
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Open Positions ───────────────────────────────────────────────── */}
      <section className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-black text-white uppercase tracking-tight font-display flex items-center gap-3"><Briefcase size={20} className="text-brand-accent" /> Open Positions</h4>
          {canEdit && (
            <button onClick={() => { setShowPositionForm((v) => !v); setError(''); }} className="px-4 py-2.5 bg-brand-card border border-white/10 text-brand-text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center gap-2">
              {showPositionForm ? <X size={13} /> : <Plus size={13} />} {showPositionForm ? 'Cancel' : 'Add Position'}
            </button>
          )}
        </div>

        {showPositionForm && canEdit && (
          <div className="bg-brand-card rounded-2xl p-6 mb-6 border border-white/5 space-y-5">
            <div>
              <label className={label}>Position Title</label>
              {!customTitle ? (
                <select
                  value={pForm.title}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') { setCustomTitle(true); setPForm({ ...pForm, title: '' }); }
                    else setPForm({ ...pForm, title: e.target.value });
                  }}
                  className={field + ' appearance-none'}
                >
                  <option value="" disabled className="bg-[#102434]">Select a role</option>
                  <optgroup label="Suggested for your startup" className="bg-[#102434]">
                    {suggestRoles(industry).map((r) => <option key={'s-' + r} value={r} className="bg-[#102434]">{r}</option>)}
                  </optgroup>
                  <optgroup label="Common roles" className="bg-[#102434]">
                    {COMMON_ROLES.map((r) => <option key={'c-' + r} value={r} className="bg-[#102434]">{r}</option>)}
                  </optgroup>
                  <option value="__custom__" className="bg-[#102434]">+ Custom role…</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input value={pForm.title} onChange={(e) => setPForm({ ...pForm, title: e.target.value })} placeholder="Type a custom role" className={field} autoFocus />
                  <button type="button" onClick={() => { setCustomTitle(false); setPForm({ ...pForm, title: '' }); }} className="px-4 rounded-2xl bg-brand-card border border-white/10 text-brand-text-muted hover:text-white text-[10px] font-black uppercase tracking-widest">List</button>
                </div>
              )}
            </div>
            <div><label className={label}>Employment Type</label><div className="flex flex-wrap gap-2">{EMPLOYMENT_TYPES.map((t) => <button key={t} onClick={() => setPForm({ ...pForm, employmentType: t })} className={chip(pForm.employmentType === t)}>{t}</button>)}</div></div>
            <div><label className={label}>Work Type</label><div className="flex flex-wrap gap-2">{WORK_TYPES.map((t) => <button key={t} onClick={() => setPForm({ ...pForm, workType: t })} className={chip(pForm.workType === t)}>{t}</button>)}</div></div>
            <div><label className={label}>Experience Level</label><div className="flex flex-wrap gap-2">{EXPERIENCE_LEVELS.map((t) => <button key={t} onClick={() => setPForm({ ...pForm, experienceLevel: t })} className={chip(pForm.experienceLevel === t)}>{t}</button>)}</div></div>
            <div><label className={label}>Required Skills</label><input value={pForm.requiredSkills} onChange={(e) => setPForm({ ...pForm, requiredSkills: e.target.value })} placeholder="Node.js, PostgreSQL, AWS (comma separated)" className={field} /></div>
            <div><label className={label}>Short Description</label><textarea value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} rows={3} placeholder="What this person will work on..." className={field} /></div>
            <button onClick={publishPosition} disabled={busy} className="w-full py-3.5 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Publish Position
            </button>
          </div>
        )}

        {positions.length === 0 ? (
          <p className="text-sm text-brand-text-muted font-medium py-4">No open positions yet.</p>
        ) : (
          <div className="space-y-3">
            {positions.map((p) => {
              const positionApps = appsFor(p.id);
              const expanded = openApplicants === p.id;
              return (
                <div key={p.id} className="bg-brand-card rounded-2xl p-6 border border-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h5 className="text-lg font-black text-white uppercase tracking-tight">{p.title}</h5>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {p.employmentType && <span className="text-xs font-black uppercase text-brand-accent tracking-widest bg-brand-accent/5 px-3 py-1.5 rounded-lg border border-brand-accent/10">{p.employmentType}</span>}
                        {p.workType && <span className="text-xs font-black uppercase text-[#5da9ff] tracking-widest bg-[#5da9ff]/5 px-3 py-1.5 rounded-lg border border-[#5da9ff]/10">{p.workType}</span>}
                        {p.experienceLevel && <span className="text-xs font-black uppercase text-amber-400 tracking-widest bg-amber-400/5 px-3 py-1.5 rounded-lg border border-amber-400/10">{p.experienceLevel}</span>}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${p.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-brand-text-muted border-white/10'}`}>{p.status === 'open' ? 'Open' : 'Closed'}</span>
                  </div>
                  {p.description && <p className="text-base text-slate-300 font-medium mt-3 leading-relaxed">{p.description}</p>}

                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/5">
                    <button
                      onClick={() => setOpenApplicants(expanded ? null : p.id)}
                      className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${positionApps.length > 0 ? 'text-brand-accent hover:underline' : 'text-brand-text-muted'}`}
                    >
                      Applicants: {positionApps.length}
                      {positionApps.length > 0 && <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />}
                    </button>
                    {canEdit && (
                      <button onClick={() => togglePosition(p)} className="ml-auto text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-white transition-colors">
                        {p.status === 'open' ? 'Close Position' : 'Reopen'}
                      </button>
                    )}
                  </div>

                  {/* ── Applicants list ── */}
                  {expanded && positionApps.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {positionApps.map((a) => (
                        <div key={a.id} className="bg-brand-section rounded-2xl p-5 border border-white/5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-black text-sm shrink-0">
                                {(a.applicantName || '?').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                {a.applicantId ? (
                                  <button onClick={() => navigate(`/profile/${a.applicantId}`)} className="text-base font-black text-white truncate hover:text-brand-accent hover:underline transition-colors text-left">
                                    {a.applicantName || 'Applicant'}
                                  </button>
                                ) : (
                                  <div className="text-base font-black text-white truncate">{a.applicantName || 'Applicant'}</div>
                                )}
                                {a.applicantHeadline && <div className="text-sm text-slate-400 font-medium">{a.applicantHeadline}</div>}
                              </div>
                            </div>
                            <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${APP_STATUS_STYLE[a.status] || APP_STATUS_STYLE.pending}`}>
                              {a.status || 'pending'}
                            </span>
                          </div>

                          {(a.applicantSkills || []).length > 0 && (
                            <p {A}
                              <span className="font-black uppercase tracking-widest text-[9px]">Skills:</span>{' '}
                              {Array.isArray(a.applicantSkills) ? a.applicantSkills.join(', ') : a.applicantSkills}
                            </p>
                          )}
                          {a.message && (
                            <p className="text-base text-slate-200 font-medium mt-3 leading-relaxed">"{a.message}"</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/5">
                            {a.applicantCvUrl && (
                              <a href={a.applicantCvUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-brand-accent hover:underline">
                                <FileText size={14} /> View CV
                              </a>
                            )}
                            {a.applicantLinkedin && (
                              <a href={a.applicantLinkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-brand-accent hover:underline">
                                <Linkedin size={14} /> LinkedIn
                              </a>
                            )}
                            {a.applicantEmail && (
                              <a href={`mailto:${a.applicantEmail}`} className="flex items-center gap-1.5 text-xs font-bold text-brand-accent hover:underline">
                                <Mail size={14} /> Email
                              </a>
                            )}
                            {canEdit && (a.status || 'pending') === 'pending' && (
                              <div className="ml-auto flex items-center gap-2">
                                <button
                                  onClick={() => setAppStatus(a, 'accepted')}
                                  className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                  <Check size={13} /> Accept
                                </button>
                                <button
                                  onClick={() => setAppStatus(a, 'rejected')}
                                  className="px-4 py-2 bg-brand-coral/10 text-brand-coral border border-brand-coral/20 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-coral/20 active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                  <X size={13} /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}