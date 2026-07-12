import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { EMPLOYMENT_TYPES, WORK_TYPES, EXPERIENCE_LEVELS } from '../TeamLab';
import type { EmploymentType, WorkType, ExperienceLevel, TeamLabIntent } from '../TeamLab';
import {
  Users, UserPlus, Search, Clock, Plus, X, Loader2, ArrowRight, Check,
  Briefcase, MapPin, TrendingUp, Linkedin, Mail, Trash2,
} from 'lucide-react';

interface TeamLabIntroProps {
  startupId: string;
  founderId: string;
  startupName?: string;
  industry?: string;
  stage?: string;
  /** Called when the founder finishes (any path) to continue into the dashboard. */
  onComplete: () => void;
}

type Screen = 'choose' | 'have_team' | 'looking';

export default function TeamLabIntro({
  startupId, founderId, startupName, industry, stage, onComplete,
}: TeamLabIntroProps) {
  const [screen, setScreen] = useState<Screen>('choose');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Option 1: existing team members ────────────────────────────────────────
  const [members, setMembers] = useState<{ fullName: string; position: string; linkedin: string; email: string }[]>([]);
  const [mForm, setMForm] = useState({ fullName: '', position: '', linkedin: '', email: '' });

  const addMemberToList = () => {
    setError('');
    if (!mForm.fullName.trim() || !mForm.position.trim()) {
      setError('Full name and position are required.');
      return;
    }
    setMembers((m) => [...m, { ...mForm }]);
    setMForm({ fullName: '', position: '', linkedin: '', email: '' });
  };

  const saveTeam = async () => {
    setError('');
    setSaving(true);
    try {
      for (const mem of members) {
        await addDoc(collection(db, 'teams'), {
          startupId, founderId,
          fullName: mem.fullName.trim(),
          position: mem.position.trim(),
          linkedin: mem.linkedin.trim() || null,
          email: mem.email.trim() || null,
          createdAt: serverTimestamp(),
        });
      }
      onComplete();
    } catch (e) {
      console.warn('Save team failed:', e);
      setError('Could not save your team. Please try again.');
      setSaving(false);
    }
  };

  // ── Option 2: publish positions ────────────────────────────────────────────
  const [positions, setPositions] = useState<any[]>([]);
  const [pForm, setPForm] = useState({
    title: '',
    employmentType: '' as EmploymentType | '',
    workType: '' as WorkType | '',
    experienceLevel: '' as ExperienceLevel | '',
    requiredSkills: '',
    description: '',
  });

  const publishPosition = async () => {
    setError('');
    if (!pForm.title.trim()) return setError('Position title is required.');
    if (!pForm.employmentType) return setError('Choose an employment type.');
    if (!pForm.workType) return setError('Choose a work type.');
    if (!pForm.experienceLevel) return setError('Choose an experience level.');
    setSaving(true);
    try {
      const skills = pForm.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const ref = await addDoc(collection(db, 'positions'), {
        startupId, founderId,
        startupName: startupName || null,
        industry: industry || null,
        stage: stage || null,
        title: pForm.title.trim(),
        employmentType: pForm.employmentType,
        workType: pForm.workType,
        experienceLevel: pForm.experienceLevel,
        requiredSkills: skills,
        description: pForm.description.trim(),
        status: 'open',
        applicantCount: 0,
        createdAt: serverTimestamp(),
      });
      setPositions((p) => [...p, { id: ref.id, ...pForm, requiredSkills: skills }]);
      setPForm({ title: '', employmentType: '', workType: '', experienceLevel: '', requiredSkills: '', description: '' });
    } catch (e) {
      console.warn('Publish position failed:', e);
      setError('Could not publish this position. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full bg-brand-card border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';
  const label = 'text-[11px] font-black text-brand-text-secondary uppercase tracking-widest flex items-center gap-2 mb-2';
  const chip = (active: boolean) => `px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all active:scale-95 ${active ? 'bg-brand-accent text-brand-bg border-brand-accent' : 'bg-brand-card text-brand-text-secondary border-white/5 hover:text-white'}`;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-start justify-center py-16 px-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
            <Users size={30} />
          </div>
          <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] block mb-3">TeamLab</span>
          {screen === 'choose' && (
            <>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display mb-3">Do you already have a team for this startup?</h1>
              <p className="text-sm text-brand-text-secondary font-medium">Every startup gets its own TeamLab. You can always come back to this later.</p>
            </>
          )}
        </div>

        {error && (
          <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3 mb-6">{error}</p>
        )}

        {/* ── Choose ─────────────────────────────────────────────────────── */}
        {screen === 'choose' && (
          <div className="space-y-4">
            <button onClick={() => { setError(''); setScreen('have_team'); }} className="w-full text-left p-6 rounded-[2rem] bg-brand-section border border-brand-border hover:border-brand-accent/40 transition-all active:scale-[0.99] flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><UserPlus size={22} /></div>
              <div><h3 className="text-sm font-black uppercase tracking-tight">Yes, I already have a team</h3><p className="text-xs text-brand-text-secondary font-medium mt-1">Add your existing team members.</p></div>
            </button>
            <button onClick={() => { setError(''); setScreen('looking'); }} className="w-full text-left p-6 rounded-[2rem] bg-brand-section border border-brand-border hover:border-brand-accent/40 transition-all active:scale-[0.99] flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0"><Search size={22} /></div>
              <div><h3 className="text-sm font-black uppercase tracking-tight">No, I'm looking for team members</h3><p className="text-xs text-brand-text-secondary font-medium mt-1">Publish open positions and receive applications.</p></div>
            </button>
            <button onClick={onComplete} className="w-full text-left p-6 rounded-[2rem] bg-brand-section border border-brand-border hover:border-white/20 transition-all active:scale-[0.99] flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-text-muted shrink-0"><Clock size={22} /></div>
              <div><h3 className="text-sm font-black uppercase tracking-tight">I'll do this later</h3><p className="text-xs text-brand-text-secondary font-medium mt-1">Skip for now — find TeamLab in your dashboard anytime.</p></div>
            </button>
          </div>
        )}

        {/* ── Option 1: have team ────────────────────────────────────────── */}
        {screen === 'have_team' && (
          <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8">
            <h2 className="text-xl font-black uppercase tracking-tight font-display mb-6">Add your team members</h2>
            {members.length > 0 && (
              <div className="space-y-2 mb-6">
                {members.map((m, i) => (
                  <div key={i} className="flex items-center justify-between bg-brand-card rounded-2xl px-5 py-3.5 border border-white/5">
                    <div><span className="text-sm font-black text-brand-text-primary">{m.fullName}</span><span className="text-xs text-brand-text-muted font-medium ml-2">{m.position}</span></div>
                    <button onClick={() => setMembers((arr) => arr.filter((_, idx) => idx !== i))} className="text-brand-text-muted hover:text-brand-coral transition-colors"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-4">
              <div><label className={label}><UserPlus size={13} className="text-brand-accent" /> Full Name</label><input value={mForm.fullName} onChange={(e) => setMForm({ ...mForm, fullName: e.target.value })} placeholder="Ahmed Ali" className={field} /></div>
              <div><label className={label}><Briefcase size={13} className="text-brand-accent" /> Position</label><input value={mForm.position} onChange={(e) => setMForm({ ...mForm, position: e.target.value })} placeholder="Backend Developer" className={field} /></div>
              <div><label className={label}><Linkedin size={13} className="text-brand-accent" /> LinkedIn (optional)</label><input value={mForm.linkedin} onChange={(e) => setMForm({ ...mForm, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." className={field} /></div>
              <div><label className={label}><Mail size={13} className="text-brand-accent" /> Email (optional)</label><input value={mForm.email} onChange={(e) => setMForm({ ...mForm, email: e.target.value })} placeholder="name@email.com" className={field} /></div>
              <button onClick={addMemberToList} className="w-full py-3.5 bg-brand-card border border-white/10 text-brand-text-primary text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center justify-center gap-2"><Plus size={15} /> Add Team Member</button>
            </div>
            <div className="flex items-center gap-3 mt-8">
              <button onClick={() => { setError(''); setScreen('choose'); }} className="px-5 py-4 text-[11px] font-black text-brand-text-muted uppercase tracking-widest hover:text-white transition-colors">← Back</button>
              <button onClick={saveTeam} disabled={saving} className="flex-1 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} Continue to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ── Option 2: looking (publish positions) ──────────────────────── */}
        {screen === 'looking' && (
          <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8">
            <h2 className="text-xl font-black uppercase tracking-tight font-display mb-6">Create a position</h2>
            {positions.length > 0 && (
              <div className="space-y-2 mb-6">
                {positions.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl px-5 py-3.5">
                    <Check size={15} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-black text-brand-text-primary">{p.title}</span>
                    <span className="text-xs text-brand-text-muted font-medium ml-auto">Published</span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-5">
              <div><label className={label}><Briefcase size={13} className="text-brand-accent" /> Position Title</label><input value={pForm.title} onChange={(e) => setPForm({ ...pForm, title: e.target.value })} placeholder="Backend Developer" className={field} /></div>
              <div><label className={label}>Employment Type</label><div className="flex flex-wrap gap-2">{EMPLOYMENT_TYPES.map((t) => <button key={t} onClick={() => setPForm({ ...pForm, employmentType: t })} className={chip(pForm.employmentType === t)}>{t}</button>)}</div></div>
              <div><label className={label}><MapPin size={13} className="text-brand-accent" /> Work Type</label><div className="flex flex-wrap gap-2">{WORK_TYPES.map((t) => <button key={t} onClick={() => setPForm({ ...pForm, workType: t })} className={chip(pForm.workType === t)}>{t}</button>)}</div></div>
              <div><label className={label}><TrendingUp size={13} className="text-brand-accent" /> Experience Level</label><div className="flex flex-wrap gap-2">{EXPERIENCE_LEVELS.map((t) => <button key={t} onClick={() => setPForm({ ...pForm, experienceLevel: t })} className={chip(pForm.experienceLevel === t)}>{t}</button>)}</div></div>
              <div><label className={label}>Required Skills</label><input value={pForm.requiredSkills} onChange={(e) => setPForm({ ...pForm, requiredSkills: e.target.value })} placeholder="Node.js, PostgreSQL, AWS (comma separated)" className={field} /></div>
              <div><label className={label}>Short Description</label><textarea value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} placeholder="What this person will work on..." rows={3} className={field} /></div>
              <button onClick={publishPosition} disabled={saving} className="w-full py-3.5 bg-brand-card border border-white/10 text-brand-text-primary text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Publish Position
              </button>
            </div>
            <div className="flex items-center gap-3 mt-8">
              <button onClick={() => { setError(''); setScreen('choose'); }} className="px-5 py-4 text-[11px] font-black text-brand-text-muted uppercase tracking-widest hover:text-white transition-colors">← Back</button>
              <button onClick={onComplete} className="flex-1 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2">
                <ArrowRight size={16} /> Continue to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}