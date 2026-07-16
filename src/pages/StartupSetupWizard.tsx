import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { STARTUP_STAGES, INDUSTRIES } from '../constants';
import {
  Rocket, Building2, User as UserIcon, Users, Palette, Link2, FileText,
  Loader2, ArrowRight, ArrowLeft, Check, Upload, Plus, Trash2, PartyPopper,
  BarChart3, Presentation, Handshake, LayoutDashboard, Save,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// StartupSetupWizard — the guided startup creation flow.
// Overview → Company → Founder → Team → Brand → Links → Documents → Done.
// "Save as Draft" on every step. Each startup is its own record in the
// 'startups' collection (status: 'draft' | 'complete'), fully independent.
// Open with /setup/startup for a new one, /setup/startup?id=... to resume.
// ─────────────────────────────────────────────────────────────────────────────

const toLabels = (arr: any[]): string[] =>
  (arr || []).map((s) => (typeof s === 'string' ? s : s?.label ?? s?.value ?? String(s)));

const STEPS = ['Overview', 'Company', 'Founder', 'Team', 'Brand', 'Links', 'Documents'] as const;
const STEP_ICONS = [Rocket, Building2, UserIcon, Users, Palette, Link2, FileText];

const BUSINESS_MODELS = ['B2B', 'B2C', 'B2B2C', 'D2C', 'Marketplace', 'SaaS', 'Subscription', 'Freemium', 'Commission', 'Other'];
const REVENUE_STREAMS = ['Subscription', 'One-time sales', 'Commission / Transaction fee', 'Advertising', 'Licensing', 'Usage-based', 'Other'];
const PRODUCT_TYPES = ['SaaS Platform', 'Mobile App', 'Web App', 'Marketplace', 'Hardware', 'API Tool', 'Physical Product', 'Service-Based', 'Other'];
const LOOKING_FOR = ['Co-founder', 'Developer', 'Designer', 'Marketing', 'Sales', 'Operations', 'Finance', 'Advisor'];

const emptyData = {
  // Overview
  name: '', tagline: '', industry: '', country: '', city: '', stage: '', description: '', logoUrl: '',
  // Company
  problem: '', targetCustomer: '', solution: '', businessModel: '', revenueStream: '', productType: '', website: '',
  // Founder
  founderName: '', founderRole: 'Founder & CEO', founderLinkedin: '', founderBio: '',
  founderExperience: '', founderEducation: '', story: '', elevatorPitch: '',
  // Team
  hasTeam: null as boolean | null, members: [] as any[], planningRecruit: null as boolean | null, lookingFor: [] as string[],
  // Brand
  coverUrl: '', brandColors: '', brandFonts: '', bannerUrl: '',
  // Links
  linkWebsite: '', linkLinkedin: '', linkGithub: '', linkInstagram: '', linkTiktok: '', linkX: '', linkYoutube: '', linkDemo: '', linkCalendly: '',
  // Documents
  pitchDeckDocUrl: '', businessPlanUrl: '', financialModelUrl: '', otherDocsUrl: '',
};

export default function StartupSetupWizard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('id');
  const startupKind = searchParams.get('kind') || null; // 'new' | 'existing'

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [data, setData] = useState<any>({ ...emptyData });
  const [startupId, setStartupId] = useState<string | null>(resumeId);
  const [loadingDraft, setLoadingDraft] = useState(!!resumeId);
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState('');
  const [error, setError] = useState('');
  const [uploadingField, setUploadingField] = useState('');

  const stageOptions = toLabels(STARTUP_STAGES as any[]);
  const industryOptions = toLabels(INDUSTRIES as any[]);

  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: v }));

  // Prefill founder name from the account.
  useEffect(() => {
    if (!data.founderName) {
      const nm = (profile as any)?.displayName || user?.displayName || '';
      if (nm) set('founderName', nm);
    }
    if (!data.country && (profile as any)?.country) set('country', (profile as any).country);
  }, [profile, user]);

  // Homepage idea handoff: if the founder typed their idea on the homepage
  // before signing up, pre-fill it as the description — the questionnaire
  // starts from what they already wrote, and the analysis at the end is
  // built from their FULL answers instead of just the raw idea.
  useEffect(() => {
    if (resumeId) return; // only for brand-new startups
    const pendingIdea = localStorage.getItem('pending_analysis_idea');
    if (pendingIdea) {
      localStorage.removeItem('pending_analysis_idea');
      setData((prev: any) => (prev.description ? prev : { ...prev, description: pendingIdea.slice(0, 2000) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume a draft.
  useEffect(() => {
    if (!resumeId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'startups', resumeId));
        if (snap.exists()) {
          const d = snap.data() as any;
          setData({ ...emptyData, ...d });
          if (typeof d.wizardStep === 'number') setStep(Math.min(d.wizardStep, STEPS.length - 1));
        }
      } catch (e) { console.warn('Draft load failed:', e); }
      finally { setLoadingDraft(false); }
    })();
  }, [resumeId]);

  // Persist (create-or-update) the startup record.
  const persist = async (status: 'draft' | 'complete', wizardStep: number): Promise<string | null> => {
    if (!user?.uid) return null;
    const record: any = {
      ...data,
      founderId: user.uid,
      status,
      wizardStep,
      updatedAt: serverTimestamp(),
    };
    if (startupKind) record.startupKind = startupKind;
    try {
      if (startupId) {
        await updateDoc(doc(db, 'startups', startupId), record);
        return startupId;
      }
      const ref = await addDoc(collection(db, 'startups'), { ...record, createdAt: serverTimestamp() });
      setStartupId(ref.id);
      return ref.id;
    } catch (e) {
      console.warn('Startup save failed:', e);
      setError('Could not save. Check your connection and try again.');
      return null;
    }
  };

  const saveDraft = async () => {
    setError(''); setDraftNotice('');
    setSaving(true);
    const id = await persist('draft', step);
    setSaving(false);
    if (id) setDraftNotice('Draft saved — you can finish this anytime from your dashboard.');
  };

  const nextStep = async () => {
    setError(''); setDraftNotice('');
    if (step === 0 && !data.name.trim()) return setError('Give your startup a name — everything else can wait.');
    setSaving(true);
    const id = await persist('draft', step + 1);
    setSaving(false);
    if (!id) return;
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const finish = async () => {
    setError('');
    setSaving(true);
    const id = await persist('complete', STEPS.length - 1);
    setSaving(false);
    // The congratulations + choices now live at the startup's permanent
    // workspace page, so the founder can always come back to them.
    if (id) navigate(`/startups/${id}`, { state: { justCreated: true } });
  };

  const uploadFile = async (file: File, fieldKey: string, kind: 'image' | 'doc') => {
    setError('');
    if (file.size > 10 * 1024 * 1024) return setError('Files must be under 10MB.');
    setUploadingField(fieldKey);
    try {
      const storage = getStorage();
      const ext = file.name.split('.').pop() || 'bin';
      const path = `startups/${user?.uid}/${fieldKey}-${Date.now()}.${ext}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      set(fieldKey, url);
    } catch (e) {
      console.warn('Upload failed:', e);
      setError('Upload failed — you can also paste a link instead, or skip and add it later.');
    } finally {
      setUploadingField('');
    }
  };

  // ── styles ──
  const field = 'w-full bg-brand-card border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-accent/40 focus:outline-none transition-colors';
  const label = 'text-[11px] font-black text-brand-text-secondary uppercase tracking-widest mb-2 block';
  const chip = (active: boolean) => `px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all active:scale-95 ${active ? 'bg-brand-accent text-brand-bg border-brand-accent' : 'bg-brand-card text-brand-text-secondary border-white/5 hover:text-white'}`;
  const choiceCard = 'w-full text-left p-5 rounded-[1.75rem] bg-brand-card border border-white/5 hover:border-brand-accent/40 transition-all active:scale-[0.99] flex items-center gap-4';

  const UploadButton = ({ fieldKey, accept, kind, labelText }: { fieldKey: string; accept: string; kind: 'image' | 'doc'; labelText: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <label className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 bg-brand-card border-white/10 text-brand-text-primary hover:border-brand-accent/40 ${uploadingField === fieldKey ? 'opacity-50 pointer-events-none' : ''}`}>
        {uploadingField === fieldKey ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {data[fieldKey] ? `Replace ${labelText}` : `Upload ${labelText}`}
        <input type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, fieldKey, kind); e.target.value = ''; }} />
      </label>
      {data[fieldKey] && (
        <a href={data[fieldKey]} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-brand-accent hover:underline truncate">
          <Check size={14} /> Uploaded — view
        </a>
      )}
    </div>
  );

  if (loadingDraft) {
    return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader2 size={24} className="animate-spin text-brand-accent" /></div>;
  }

  // ── Done screen ──
  if (done) {
    const goAnalyze = () => {
      const idea = [data.name, data.tagline, data.description, `Problem: ${data.problem}`, `Solution: ${data.solution}`, `Target customer: ${data.targetCustomer}`]
        .filter((s) => s && !s.endsWith(': ')).join('. ');
      navigate('/analyze', { state: { idea } });
    };
    const doneCard = 'w-full text-left p-5 rounded-[1.75rem] bg-brand-section border border-brand-border hover:border-brand-accent/40 transition-all active:scale-[0.99] flex items-center gap-4';
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PartyPopper size={36} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight font-display mb-3">Congratulations!</h1>
          <p className="text-sm text-brand-text-secondary font-medium mb-10">
            <span className="text-brand-text-primary font-black">{data.name || 'Your startup'}</span> has been created. What would you like to do next?
          </p>
          <div className="space-y-3 text-left">
            <button onClick={goAnalyze} className={doneCard}>
              <div className="w-11 h-11 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0"><BarChart3 size={20} /></div>
              <div><h3 className="text-sm font-black uppercase tracking-tight">Analyze Startup</h3><p className="text-xs text-brand-text-secondary font-medium mt-0.5">Run the full DecisionLab analysis.</p></div>
            </button>
            <button onClick={() => navigate('/pitch-deck')} className={doneCard}>
              <div className="w-11 h-11 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0"><Presentation size={20} /></div>
              <div><h3 className="text-sm font-black uppercase tracking-tight">Build Pitch Deck</h3><p className="text-xs text-brand-text-secondary font-medium mt-0.5">Open the Pitch Deck Architect.</p></div>
            </button>
            <button onClick={() => navigate('/investor-network')} className={doneCard}>
              <div className="w-11 h-11 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0"><Handshake size={20} /></div>
              <div><h3 className="text-sm font-black uppercase tracking-tight">Find Investors</h3><p className="text-xs text-brand-text-secondary font-medium mt-0.5">Explore the Investor Network.</p></div>
            </button>
            <button onClick={() => navigate(startupId ? `/startups/${startupId}` : '/startups')} className={doneCard}>
              <div className="w-11 h-11 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0"><Users size={20} /></div>
              <div><h3 className="text-sm font-black uppercase tracking-tight">Find Team</h3><p className="text-xs text-brand-text-secondary font-medium mt-0.5">Publish open positions in TeamLab.</p></div>
            </button>
            <button onClick={() => navigate('/startups')} className={doneCard}>
              <div className="w-11 h-11 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0"><LayoutDashboard size={20} /></div>
              <div><h3 className="text-sm font-black uppercase tracking-tight">Go to Dashboard</h3><p className="text-xs text-brand-text-secondary font-medium mt-0.5">See all your startups.</p></div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StepIcon = STEP_ICONS[step];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary px-6 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => i < step && setStep(i)}
                className={`text-[9px] font-black uppercase tracking-widest transition-colors ${i === step ? 'text-brand-accent' : i < step ? 'text-emerald-400 hover:underline' : 'text-brand-text-muted'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-brand-accent rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent"><StepIcon size={22} /></div>
            <div>
              <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Step {step + 1} of {STEPS.length}</span>
              <h1 className="text-2xl font-black uppercase tracking-tight font-display">{STEPS[step]}</h1>
            </div>
          </div>

          <div className="space-y-5">

            {/* ── 1. OVERVIEW ── */}
            {step === 0 && (<>
              <div><label className={label}>Startup Name *</label><input value={data.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. ShieldFlow AI" className={field} /></div>
              <div>
                <label className={label}>Startup Logo</label>
                <UploadButton fieldKey="logoUrl" accept="image/*" kind="image" labelText="logo" />
              </div>
              <div><label className={label}>Tagline</label><input value={data.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="One line that captures what you do" className={field} /></div>
              <div>
                <label className={label}>Industry</label>
                <input list="industries" value={data.industry} onChange={(e) => set('industry', e.target.value)} placeholder="Search or type industry" className={field} />
                <datalist id="industries">{industryOptions.map((i) => <option key={i} value={i} />)}</datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>Country</label><input value={data.country} onChange={(e) => set('country', e.target.value)} placeholder="e.g. Bahrain" className={field} /></div>
                <div><label className={label}>City</label><input value={data.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Manama" className={field} /></div>
              </div>
              <div><label className={label}>Business Stage</label><div className="flex flex-wrap gap-2">{stageOptions.map((s) => <button key={s} onClick={() => set('stage', s)} className={chip(data.stage === s)}>{s}</button>)}</div></div>
              <div><label className={label}>Description</label><textarea value={data.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Describe your startup, product, or service in detail" className={field} /></div>
            </>)}

            {/* ── 2. COMPANY ── */}
            {step === 1 && (<>
              <div><label className={label}>What problem are you solving?</label><textarea value={data.problem} onChange={(e) => set('problem', e.target.value)} rows={3} className={field} placeholder="The pain point that made you start" /></div>
              <div><label className={label}>Who is your target customer?</label><textarea value={data.targetCustomer} onChange={(e) => set('targetCustomer', e.target.value)} rows={2} className={field} placeholder="Who feels this problem most" /></div>
              <div><label className={label}>What is your solution?</label><textarea value={data.solution} onChange={(e) => set('solution', e.target.value)} rows={3} className={field} placeholder="How your product solves it" /></div>
              <div><label className={label}>Business Model</label><div className="flex flex-wrap gap-2">{BUSINESS_MODELS.map((s) => <button key={s} onClick={() => set('businessModel', s)} className={chip(data.businessModel === s)}>{s}</button>)}</div></div>
              <div><label className={label}>Revenue Stream</label><div className="flex flex-wrap gap-2">{REVENUE_STREAMS.map((s) => <button key={s} onClick={() => set('revenueStream', s)} className={chip(data.revenueStream === s)}>{s}</button>)}</div></div>
              <div><label className={label}>Product Type</label><div className="flex flex-wrap gap-2">{PRODUCT_TYPES.map((s) => <button key={s} onClick={() => set('productType', s)} className={chip(data.productType === s)}>{s}</button>)}</div></div>
              <div><label className={label}>Website (optional)</label><input value={data.website} onChange={(e) => set('website', e.target.value)} placeholder="https://…" className={field} /></div>
            </>)}

            {/* ── 3. FOUNDER ── */}
            {step === 2 && (<>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={label}>Founder Name</label><input value={data.founderName} onChange={(e) => set('founderName', e.target.value)} className={field} /></div>
                <div><label className={label}>Role</label><input value={data.founderRole} onChange={(e) => set('founderRole', e.target.value)} placeholder="Founder & CEO" className={field} /></div>
              </div>
              <div><label className={label}>LinkedIn</label><input value={data.founderLinkedin} onChange={(e) => set('founderLinkedin', e.target.value)} placeholder="https://linkedin.com/in/you" className={field} /></div>
              <div><label className={label}>Bio</label><textarea value={data.founderBio} onChange={(e) => set('founderBio', e.target.value)} rows={2} className={field} placeholder="A few lines about you" /></div>
              <div><label className={label}>Experience</label><textarea value={data.founderExperience} onChange={(e) => set('founderExperience', e.target.value)} rows={2} className={field} placeholder="Relevant work, achievements, previous startups" /></div>
              <div><label className={label}>Education (optional)</label><input value={data.founderEducation} onChange={(e) => set('founderEducation', e.target.value)} className={field} placeholder="Degrees, schools, certifications" /></div>
              <div><label className={label}>Startup Story</label><textarea value={data.story} onChange={(e) => set('story', e.target.value)} rows={4} className={field} placeholder="How the idea started, why it matters, your long-term vision" /></div>
              <div><label className={label}>Elevator Pitch</label><textarea value={data.elevatorPitch} onChange={(e) => set('elevatorPitch', e.target.value)} rows={2} className={field} placeholder="Your startup in 2–3 sentences, as told to an investor" /></div>
            </>)}

            {/* ── 4. TEAM ── */}
            {step === 3 && (<>
              <div><label className={label}>Do you already have a team?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => set('hasTeam', true)} className={chip(data.hasTeam === true) + ' py-4'}>Yes</button>
                  <button onClick={() => set('hasTeam', false)} className={chip(data.hasTeam === false) + ' py-4'}>No</button>
                </div>
              </div>

              {data.hasTeam === true && (<>
                {(data.members || []).map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-brand-card rounded-2xl px-5 py-3.5 border border-white/5">
                    <div><span className="text-sm font-black">{m.name}</span><span className="text-xs text-brand-text-muted font-medium ml-2">{m.role}</span></div>
                    <button onClick={() => set('members', data.members.filter((_: any, idx: number) => idx !== i))} className="text-brand-text-muted hover:text-brand-coral"><Trash2 size={15} /></button>
                  </div>
                ))}
                <MemberForm onAdd={(m) => set('members', [...(data.members || []), m])} field={field} label={label} />
              </>)}

              {data.hasTeam === false && (<>
                <div><label className={label}>Are you planning to recruit a team?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => set('planningRecruit', true)} className={chip(data.planningRecruit === true) + ' py-4'}>Yes</button>
                    <button onClick={() => set('planningRecruit', false)} className={chip(data.planningRecruit === false) + ' py-4'}>No</button>
                  </div>
                </div>
                {data.planningRecruit === true && (
                  <div><label className={label}>Looking For</label>
                    <div className="flex flex-wrap gap-2">
                      {LOOKING_FOR.map((r) => (
                        <button key={r} onClick={() => set('lookingFor', data.lookingFor.includes(r) ? data.lookingFor.filter((x: string) => x !== r) : [...data.lookingFor, r])} className={chip(data.lookingFor.includes(r))}>{r}</button>
                      ))}
                    </div>
                    <p className="text-[10px] text-brand-text-muted font-medium mt-2">Saved to this startup's TeamLab — publish the openings whenever you're ready.</p>
                  </div>
                )}
              </>)}
            </>)}

            {/* ── 5. BRAND ── */}
            {step === 4 && (<>
              <div><label className={label}>Logo</label><UploadButton fieldKey="logoUrl" accept="image/*" kind="image" labelText="logo" /></div>
              <div><label className={label}>Cover Image</label><UploadButton fieldKey="coverUrl" accept="image/*" kind="image" labelText="cover" /></div>
              <div><label className={label}>Brand Colors</label><input value={data.brandColors} onChange={(e) => set('brandColors', e.target.value)} placeholder="e.g. #0A84FF, #08131D" className={field} /></div>
              <div><label className={label}>Fonts (optional)</label><input value={data.brandFonts} onChange={(e) => set('brandFonts', e.target.value)} placeholder="e.g. Inter, Space Grotesk" className={field} /></div>
              <div><label className={label}>Company Banner (optional)</label><UploadButton fieldKey="bannerUrl" accept="image/*" kind="image" labelText="banner" /></div>
            </>)}

            {/* ── 6. LINKS ── */}
            {step === 5 && (<>
              {[
                ['linkWebsite', 'Website'], ['linkLinkedin', 'LinkedIn'], ['linkGithub', 'GitHub'],
                ['linkInstagram', 'Instagram'], ['linkTiktok', 'TikTok'], ['linkX', 'X (Twitter)'],
                ['linkYoutube', 'YouTube'], ['linkDemo', 'Demo Link'], ['linkCalendly', 'Calendly'],
              ].map(([k, l]) => (
                <div key={k}><label className={label}>{l}</label><input value={data[k]} onChange={(e) => set(k, e.target.value)} placeholder="https://…" className={field} /></div>
              ))}
            </>)}

            {/* ── 7. DOCUMENTS ── */}
            {step === 6 && (<>
              <div><label className={label}>Pitch Deck</label><UploadButton fieldKey="pitchDeckDocUrl" accept=".pdf,application/pdf" kind="doc" labelText="pitch deck (PDF)" /></div>
              <div><label className={label}>Business Plan</label><UploadButton fieldKey="businessPlanUrl" accept=".pdf,application/pdf" kind="doc" labelText="business plan (PDF)" /></div>
              <div><label className={label}>Financial Model</label><UploadButton fieldKey="financialModelUrl" accept=".pdf,application/pdf" kind="doc" labelText="financial model (PDF)" /></div>
              <div><label className={label}>Other Documents</label><UploadButton fieldKey="otherDocsUrl" accept=".pdf,application/pdf" kind="doc" labelText="document (PDF)" /></div>
              <p className="text-[10px] text-brand-text-muted font-medium">All documents are optional — skip anything you don't have yet and add it later.</p>
            </>)}

          </div>

          {error && <p className="text-xs font-bold text-brand-coral bg-brand-coral/10 border border-brand-coral/20 rounded-xl px-4 py-3 mt-6">{error}</p>}
          {draftNotice && <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mt-6">{draftNotice}</p>}

          {/* Controls */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/5">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="px-5 py-4 text-[11px] font-black text-brand-text-muted uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <button onClick={saveDraft} disabled={saving} className="px-5 py-4 text-[11px] font-black text-brand-accent uppercase tracking-widest hover:underline transition-colors flex items-center gap-2 disabled:opacity-50">
              <Save size={14} /> Save as Draft
            </button>
            <button
              onClick={step === STEPS.length - 1 ? finish : nextStep}
              disabled={saving}
              className="flex-1 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : step === STEPS.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
              {step === STEPS.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small inline form for adding a team member.
function MemberForm({ onAdd, field, label }: { onAdd: (m: any) => void; field: string; label: string }) {
  const [m, setM] = useState({ name: '', role: '', email: '', linkedin: '' });
  const [err, setErr] = useState('');
  return (
    <div className="bg-brand-card rounded-2xl p-5 border border-white/5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={label}>Member Name</label><input value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} className={field} placeholder="Ahmed Ali" /></div>
        <div><label className={label}>Role</label><input value={m.role} onChange={(e) => setM({ ...m, role: e.target.value })} className={field} placeholder="Backend Developer" /></div>
        <div><label className={label}>Email (optional)</label><input value={m.email} onChange={(e) => setM({ ...m, email: e.target.value })} className={field} placeholder="name@email.com" /></div>
        <div><label className={label}>LinkedIn (optional)</label><input value={m.linkedin} onChange={(e) => setM({ ...m, linkedin: e.target.value })} className={field} placeholder="https://linkedin.com/in/…" /></div>
      </div>
      {err && <p className="text-xs font-bold text-brand-coral">{err}</p>}
      <button
        onClick={() => {
          if (!m.name.trim() || !m.role.trim()) { setErr('Name and role are required.'); return; }
          setErr('');
          onAdd({ ...m });
          setM({ name: '', role: '', email: '', linkedin: '' });
        }}
        className="w-full py-3 bg-brand-section border border-white/10 text-brand-text-primary text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-accent/40 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={14} /> Add Member
      </button>
    </div>
  );
}