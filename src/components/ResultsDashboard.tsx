import { AnalysisReport, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef } from 'react';
import { 
  Zap, Download, Target, Shield, MapPin, Briefcase, Activity, 
  ChevronRight, X, Edit3, CheckCircle2, Globe, Rocket, Info, ShieldAlert,
  Wand2, Image as ImageIcon, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { VCCommandCenter, RiskEcosystemMap, StrategicExpansionJourney, InvestorRelationshipNetwork } from './ReportVisuals';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateCompanyAnalysis, generatePitchDeck } from '../services/geminiService';
import { PitchDeckSlide } from './PitchDeckSlides';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { INDUSTRIES, STARTUP_STAGES, PRODUCT_TYPES, BUSINESS_TYPES } from '../constants';

interface ResultsDashboardProps {
  analysis: AnalysisReport;
  profile: UserProfile | null;
}

export default function ResultsDashboard({ analysis, profile }: ResultsDashboardProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPitchDeck, setShowPitchDeck] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(analysis);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const defaultProfile = {
    companyName: '',
    country: '',
    city: '',
    stage: 'Idea Stage',
    industry: 'Artificial Intelligence',
    detailedSector: '',
    businessType: 'B2B',
    productType: 'SaaS Platform',
    elevatorPitch: '',
    businessDescription: '',
    founderBackground: '',
    teamSize: 'Solo',
    logo: ''
  };

  const [editedProfile, setEditedProfile] = useState({
    ...defaultProfile,
    ...(currentAnalysis.startupProfile || {})
  });

  const [editedIdea, setEditedIdea] = useState(currentAnalysis.ideaDescription);
  const [isEditingIdea, setIsEditingIdea] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      await updateDoc(doc(db, 'analyses', currentAnalysis.id), {
        startupProfile: editedProfile,
        updatedAt: serverTimestamp()
      });
      setCurrentAnalysis(prev => ({ ...prev, startupProfile: editedProfile }));
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAndReanalyze = async () => {
    setIsSyncing(true);
    try {
      // 1. Update Profile First
      await updateDoc(doc(db, 'analyses', currentAnalysis.id), {
        startupProfile: editedProfile,
        ideaDescription: editedIdea,
        updatedAt: serverTimestamp()
      });

      // 2. Trigger Venture Refinement for Analysis, Investors, and Roadmap
      const refinedResults = await generateCompanyAnalysis(editedProfile);
      
      // 3. Trigger Pitch Deck Update
      const refinedDeck = await generatePitchDeck(editedProfile);

      const updateData = {
        ...refinedResults,
        pitchReadiness: refinedDeck, 
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'analyses', currentAnalysis.id), updateData);
      
      // 4. Update local state
      setCurrentAnalysis(prev => ({
        ...prev,
        ...refinedResults,
        pitchReadiness: refinedDeck,
        startupProfile: editedProfile,
        ideaDescription: editedIdea
      }));

      setIsEditingProfile(false);
      setIsEditingIdea(false);
      alert("Analysis suite refined successfully!");
    } catch (err) {
      console.error("Refinement error:", err);
      alert("Failed to refine. Please check connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!currentAnalysis.pitchReadiness?.slides) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720]
      });

      for (let i = 0; i < currentAnalysis.pitchReadiness.slides.length; i++) {
        const element = document.getElementById(`pitch-slide-${i}`);
        if (element) {
          const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#08131D'
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.85);
          
          if (i > 0) pdf.addPage([1280, 720], 'landscape');
          pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
        }
      }

      pdf.save(`${displayProfile.companyName || 'Venture'}_Pitch_Deck.pdf`);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export pitch deck. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const displayProfile = currentAnalysis.startupProfile || editedProfile;

  const formSections = [
    {
      title: 'Core Venture Idea',
      fields: [
        { label: 'Startup Hypothesis / Original Idea', key: 'ideaDescription', type: 'textarea', isDirect: true },
      ]
    },
    {
      title: 'Basic Info',
      fields: [
        { label: 'Company Name', key: 'companyName', type: 'text' },
        { label: 'Country', key: 'country', type: 'text' },
        { label: 'City', key: 'city', type: 'text' },
        { label: 'Stage', key: 'stage', type: 'select', options: STARTUP_STAGES },
      ]
    },
    {
      title: 'Industry',
      fields: [
        { label: 'Main Industry', key: 'industry', type: 'select', options: INDUSTRIES },
        { label: 'Detailed Sector', key: 'detailedSector', type: 'text' },
      ]
    },
    {
      title: 'Business',
      fields: [
        { label: 'Business Type', key: 'businessType', type: 'select', options: BUSINESS_TYPES },
        { label: 'Product Type', key: 'productType', type: 'select', options: PRODUCT_TYPES },
      ]
    },
    {
      title: 'Company Details',
      fields: [
        { label: 'Elevator Pitch', key: 'elevatorPitch', type: 'textarea' },
        { label: 'Business Description', key: 'businessDescription', type: 'textarea' },
      ]
    },
    {
      title: 'Team',
      fields: [
        { label: 'Founder Background', key: 'founderBackground', type: 'textarea' },
        { label: 'Team Size', key: 'teamSize', type: 'select', options: ['Solo', '2–5', '6–10', '10+'] },
      ]
    }
  ];

  return (
    <div className="space-y-16 animate-in fade-in duration-700 max-w-7xl mx-auto pb-24 px-4 sm:px-6 lg:px-8 bg-brand-bg text-brand-text-primary">
      
      {/* 1. HEADER (Interactive Profile) */}
      <header className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-12">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full h-[300px] bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="relative w-24 h-24 bg-brand-section rounded-3xl border border-brand-border flex items-center justify-center p-4 shadow-2xl overflow-hidden glow-inner group"
          >
              <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              {displayProfile.logo ? (
                <img src={displayProfile.logo} alt="Logo" className="w-full h-full object-contain relative z-10" />
              ) : (
                <span className="text-4xl font-black text-brand-accent font-display relative z-10">
                  {displayProfile.companyName?.charAt(0).toUpperCase() || 'S'}
                </span>
              )}
          </motion.div>
              <div className="flex flex-col">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-brand-text-primary tracking-tighter uppercase font-display leading-[1.1]">
                  {displayProfile.companyName || 'STARTUP NAME'}
                </h1>
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="p-2.5 bg-brand-section rounded-xl hover:bg-brand-hover transition-all text-brand-text-muted hover:text-brand-accent border border-brand-border active:scale-95"
                >
                  <Edit3 size={18} />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-3 text-brand-text-muted">
                <div className="p-1.5 px-3 bg-brand-accent/10 border border-brand-accent/20 rounded-lg flex items-center gap-2">
                   <Target size={14} className="text-brand-accent" />
                   <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-accent">
                     {displayProfile.stage}
                   </span>
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] opacity-40 leading-none">
                  {displayProfile.industry} • {displayProfile.city}, {displayProfile.country}
                </span>
              </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full lg:w-auto">
            <button 
              onClick={() => setShowPitchDeck(true)}
              className="px-10 py-6 bg-brand-section border border-brand-border text-brand-text-primary rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-105 hover:bg-brand-hover transition-all flex items-center gap-3 w-full lg:w-auto justify-center active:scale-95"
            >
              <Zap size={20} className="text-brand-accent" fill="currentColor" /> Pitch Deck Architect
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-10 py-6 bg-brand-accent text-brand-text-primary rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-105 hover:bg-brand-accent/90 transition-all flex items-center gap-3 w-full lg:w-auto justify-center shadow-brand-accent/20 active:scale-95 disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              {isExporting ? 'Generating...' : 'Download Pitch Deck'}
            </button>
        </div>
      </header>

      {/* Profile Edit Backdrop */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingProfile(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-4xl bg-brand-section rounded-[2.5rem] border border-brand-border/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-brand-border/10 flex justify-between items-center bg-brand-card/50">
                <div>
                  <h3 className="text-sm font-black text-brand-text-primary uppercase tracking-tight">Venture Analysis Profile</h3>
                  <p className="text-xs text-brand-text-secondary uppercase tracking-widest mt-1">Refine your venture data for higher precision analysis</p>
                </div>
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="p-2 hover:bg-brand-hover rounded-full text-brand-text-secondary transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-10 space-y-12">
                <form onSubmit={handleUpdateProfile} id="profile-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {formSections.map((section) => (
                      <div key={section.title} className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-brand-accent rounded-full" />
                          <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-widest">{section.title}</h4>
                        </div>
                        <div className="space-y-5">
                          {section.fields.map((field) => (
                            <div key={field.key}>
                              <label className="block text-base font-black text-brand-text-secondary/50 uppercase tracking-[0.2em] mb-2">{field.label}</label>
                              {field.type === 'select' ? (
                                <div className="relative">
                                  <input
                                    type="text"
                                    list={`opts-${field.key}`}
                                    className="w-full bg-brand-card border border-brand-border/20 rounded-xl px-4 py-3 text-xs font-bold text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all placeholder:text-brand-text-primary/20"
                                    value={(field as any).isDirect ? editedIdea : (editedProfile as any)[field.key] || ''}
                                    onChange={e => (field as any).isDirect ? setEditedIdea(e.target.value) : setEditedProfile({...editedProfile, [field.key]: e.target.value})}
                                    placeholder={`Select ${field.label}...`}
                                  />
                                  <datalist id={`opts-${field.key}`}>
                                    {field.options?.map(opt => (
                                      <option key={opt} value={opt} />
                                    ))}
                                  </datalist>
                                </div>
                              ) : field.type === 'textarea' ? (
                                <textarea
                                  className="w-full bg-brand-card border border-brand-border/20 rounded-xl px-4 py-3 text-xs font-medium text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all h-28 resize-none leading-relaxed"
                                  value={(field as any).isDirect ? editedIdea : (editedProfile as any)[field.key] || ''}
                                  onChange={e => (field as any).isDirect ? setEditedIdea(e.target.value) : setEditedProfile({...editedProfile, [field.key]: e.target.value})}
                                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                                />
                              ) : (
                                <input
                                  type="text"
                                  className="w-full bg-brand-card border border-brand-border/20 rounded-xl px-4 py-3 text-xs font-bold text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all placeholder:text-brand-text-primary/10"
                                  value={(field as any).isDirect ? editedIdea : (editedProfile as any)[field.key] || ''}
                                  onChange={e => (field as any).isDirect ? setEditedIdea(e.target.value) : setEditedProfile({...editedProfile, [field.key]: e.target.value})}
                                  placeholder={`e.g. ${field.label === 'Country' ? 'United States' : field.label}`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-brand-border/10 bg-brand-card/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 size={16} />
                  </div>
                  <p className="text-xs text-brand-text-muted font-medium max-w-[200px]">Changes are synced to our modeling engine in real-time.</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 sm:flex-none px-8 py-4 border border-brand-border/20 rounded-xl text-xs font-black uppercase tracking-widest text-brand-text-secondary hover:bg-brand-hover transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSyncAndReanalyze}
                    disabled={isSyncing}
                    className="flex-1 sm:flex-none px-8 py-4 bg-brand-accent text-brand-text-primary rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {isSyncing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : <Wand2 size={14} />}
                    Sync & Refine Analysis
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-12">
        {/* 1. VENTURE PERFORMANCE METRICS */}
        <section 
          onMouseEnter={() => setActiveSection('metrics')}
          onMouseLeave={() => setActiveSection(null)}
          className={cn(
            "bg-brand-section p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge relative group transition-all duration-300 overflow-visible",
            activeSection === 'metrics' ? "z-[400]" : "z-10"
          )}
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-brand-accent/10 transition-all duration-1000" />
          
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
              <div>
                <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-3">VC Command Center</h3>
                <p className="text-sm text-brand-text-muted font-medium opacity-80">Multi-dimensional assessment of startup viability and market potential.</p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <h4 className="text-xs font-black text-brand-text-muted uppercase tracking-[0.3em] mb-2">Composite Score</h4>
                  <p className="text-4xl font-black text-brand-accent tabular-nums">
                    {(currentAnalysis.scores as any)?.overall || (currentAnalysis.scores as any)?.ideaStrength?.score || 0}%
                  </p>
                </div>
              </div>
            </div>

            <VCCommandCenter 
              scores={currentAnalysis.scores || {}} 
              finalVerdict={currentAnalysis.finalVerdict} 
              topInvestorTakeaway={currentAnalysis.topInvestorTakeaway} 
            />

            <div className="mt-12 p-8 bg-brand-card/30 border border-brand-border/20 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex-1">
                <h4 className="text-xs font-black text-brand-accent uppercase tracking-widest mb-4">Institutional Analysis Verdict</h4>
                <p className="text-xs font-bold text-brand-text-primary leading-relaxed italic opacity-90">
                  "{typeof currentAnalysis.finalVerdict === 'object' ? currentAnalysis.finalVerdict.description : (currentAnalysis.finalVerdict || 'Analysis in progress...')}"
                </p>
              </div>
              <div className="shrink-0 pt-4 md:pt-0">
                <div className={cn(
                  "px-8 py-4 rounded-2xl border font-black uppercase tracking-widest text-xs shadow-lg",
                  currentAnalysis.finalVerdict?.status === 'Strong Investment Opportunity' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  currentAnalysis.finalVerdict?.status === 'Moderate Potential' ? "bg-brand-blue/10 text-brand-blue border-brand-blue/20" :
                  "bg-brand-coral/10 text-brand-coral border-brand-coral/20"
                )}>
                  {currentAnalysis.finalVerdict?.status || 'Calculating...'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. RISK INTELLIGENCE MATRIX */}
        <section 
          onMouseEnter={() => setActiveSection('risk')}
          onMouseLeave={() => setActiveSection(null)}
          className={cn(
            "bg-brand-section p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge relative group transition-all duration-300 overflow-visible",
            activeSection === 'risk' ? "z-[400]" : "z-10"
          )}
        >
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-coral/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-brand-coral/10 transition-all duration-1000" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-3">Risk Exposure Matrix</h3>
                <p className="text-sm text-brand-text-muted font-medium opacity-80">Critical identification of execution bottlenecks and latent market threats.</p>
              </div>
              <div className="w-14 h-14 bg-brand-coral/10 rounded-2xl flex items-center justify-center text-brand-coral border border-brand-coral/20 shadow-xl">
                 <ShieldAlert size={28} />
              </div>
            </div>

            <RiskEcosystemMap risks={currentAnalysis.riskMatrix || currentAnalysis.risks} />

            {currentAnalysis.topInvestorTakeaway && (
              <div className="mt-12 pt-12 border-t border-white/5">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-px h-8 bg-brand-accent" />
                   <h4 className="text-xs font-black text-brand-accent uppercase tracking-[0.3em]">Investor Perspective</h4>
                </div>
                <div className="bg-brand-card/50 p-8 rounded-[2.5rem] border border-brand-border/20 shadow-inner group/persp transition-all">
                  <p className="text-xs font-bold text-brand-text-primary leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                    "{currentAnalysis.topInvestorTakeaway}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 4. STRATEGIC EXPANSION JOURNEY */}
      <section 
        onMouseEnter={() => setActiveSection('roadmap')}
        onMouseLeave={() => setActiveSection(null)}
        className={cn(
          "bg-brand-section/40 p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge relative group transition-all duration-300 overflow-visible",
          activeSection === 'roadmap' ? "z-[400]" : "z-10"
        )}
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 blur-[120px] rounded-full group-hover:bg-brand-accent/10 transition-all duration-1000" />
        
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-3">Strategic Expansion Journey</h3>
              <p className="text-sm text-brand-text-muted font-medium opacity-80">A cinematic pathway from structural validation to high-velocity venture maturity.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="px-6 py-4 bg-brand-card/50 border border-brand-border rounded-2xl flex items-center gap-4 shadow-lg">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-ping" />
                  <span className="text-xs font-black text-brand-text-primary uppercase tracking-widest leading-none">Trajectory Locked</span>
               </div>
            </div>
          </div>

          <StrategicExpansionJourney roadmap={currentAnalysis.roadmap} />
        </div>
      </section>

      {/* 5. SUGGESTED INVESTORS (Matchmaking Network) */}
      <section 
        onMouseEnter={() => setActiveSection('investors')}
        onMouseLeave={() => setActiveSection(null)}
        className={cn(
          "bg-brand-section/40 p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge relative group transition-all duration-300 overflow-visible",
          activeSection === 'investors' ? "z-[400]" : "z-10"
        )}
      >
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-emerald/5 blur-[120px] rounded-full group-hover:bg-brand-emerald/10 transition-all duration-1000" />
        
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-3">Investor Matchmaking Network</h3>
              <p className="text-sm text-brand-text-muted font-medium opacity-80">Interactive strategic mapping of high-conviction institutional matches.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="px-6 py-4 bg-brand-card/50 border border-brand-border rounded-2xl flex items-center gap-4 shadow-lg">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-pulse" />
                  <span className="text-xs font-black text-brand-text-primary uppercase tracking-widest leading-none">Logic Stream Online</span>
               </div>
            </div>
          </div>

          <InvestorRelationshipNetwork 
            investors={currentAnalysis.investorMatching || []} 
            startupName={displayProfile.companyName || 'Venture'} 
          />
        </div>
      </section>

      {/* Modal: Pitch Deck Detail */}
      <AnimatePresence>
        {showPitchDeck && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPitchDeck(false)}
              className="absolute inset-0 bg-brand-bg/95 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="relative w-full max-w-6xl bg-brand-section rounded-[3rem] border border-brand-border shadow-huge overflow-hidden flex flex-col max-h-[92vh] group"
            >
              <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-1000" />
              
              <div className="flex items-center justify-between p-10 border-b border-brand-border/10 relative z-10 bg-brand-section/50 backdrop-blur-xl">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-brand-accent rounded-3xl flex items-center justify-center text-brand-text-primary shadow-2xl shadow-brand-accent/30">
                    <Briefcase size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-brand-text-primary tracking-tighter uppercase font-display">Pitch Deck Architect</h2>
                    <p className="text-xs text-brand-accent font-black uppercase tracking-[0.3em]">Institutional Grade Blueprint • Stage {displayProfile.stage}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPitchDeck(false)}
                  className="w-12 h-12 flex items-center justify-center bg-brand-card hover:bg-brand-hover rounded-2xl text-brand-text-muted hover:text-brand-text-primary transition-all active:scale-90 border border-brand-border/10"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 lg:p-14 relative z-10">
                <div className="mb-14 p-10 bg-brand-bg/50 border border-brand-border rounded-[2.5rem] relative overflow-hidden group/top">
                  <div className="absolute top-0 right-0 p-8">
                     <Zap size={32} className="text-brand-accent opacity-20 group-hover/top:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-tight mb-4">Strategic Narrative Engine</h3>
                  <p className="text-brand-text-muted font-medium max-w-2xl leading-relaxed">
                    We've synthesized your unique value proposition into a tailored narrative structure. 
                    This blueprint is designed to navigate common investor objections while highlighting your current velocity.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-12">
                  {Array.isArray(currentAnalysis.pitchReadiness?.slides) && currentAnalysis.pitchReadiness.slides.map((slide: any, idx: number) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ y: -8 }}
                      className="p-8 bg-brand-card/40 border border-brand-border rounded-[2rem] hover:bg-brand-card/60 transition-all duration-300 relative overflow-hidden group/slide"
                    >
                      <div className="absolute bottom-4 right-4 p-4 opacity-5">
                         <span className="text-8xl font-black text-brand-text-primary leading-none">{idx + 1}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-10 h-10 bg-brand-bg flex items-center justify-center rounded-xl text-brand-accent font-black text-xs border border-brand-border/10">
                           {idx + 1}
                        </div>
                        <div className="px-2 py-1 bg-brand-accent/5 border border-brand-accent/20 rounded-md">
                           <span className="text-[8px] font-black text-brand-accent uppercase tracking-widest">Slide Blueprint</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-widest mb-4 group-hover/slide:text-brand-accent transition-colors">{slide.title}</h4>
                      <div className="h-px w-12 bg-brand-accent/30 mb-6 group-hover/slide:w-full transition-all" />
                      
                      <div className="space-y-6 relative z-10">
                        <p className="text-sm text-brand-text-secondary leading-relaxed font-medium italic border-l-2 border-brand-accent/30 pl-4">
                          "{slide.content}"
                        </p>

                        {Array.isArray(slide.points) && (
                          <div className="space-y-3">
                            <p className="text-sm font-black text-brand-text-muted uppercase tracking-[0.3em] mb-1">Key Objectives</p>
                            <div className="space-y-2">
                              {slide.points.map((pt: string, i: number) => (
                                <div key={i} className="flex gap-2 text-xs text-brand-text-secondary font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-brand-accent/40 mt-1 shrink-0" />
                                  {pt}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {slide.metric && (
                          <div className="p-4 bg-brand-bg/50 rounded-xl border border-brand-border/10">
                             <p className="text-sm font-black text-brand-emerald uppercase tracking-[0.3em] mb-1">Success Metric</p>
                             <p className="text-xs font-black text-brand-text-primary">{slide.metric.label}: {slide.metric.value}</p>
                          </div>
                        )}
                        
                        {slide.investorFocus && (
                          <div className="pt-4 border-t border-brand-border/5">
                            <p className="text-sm font-black text-brand-amber uppercase tracking-[0.3em] mb-1">Investor Psychology</p>
                            <p className="text-xs text-brand-text-muted leading-relaxed font-semibold">
                              {slide.investorFocus}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div className="p-10 border-t border-brand-border/10 bg-brand-section relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
                 <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="w-10 h-10 rounded-full border-4 border-brand-section bg-brand-card flex items-center justify-center text-xs font-black text-brand-text-muted shadow-lg">
                            {i}
                         </div>
                       ))}
                    </div>
                    <div>
                      <p className="text-xs font-black text-brand-text-primary uppercase tracking-widest">Trusted by 1,200+ Founding Teams</p>
                      <p className="text-[8px] font-bold text-brand-text-muted uppercase tracking-widest">Verified Venture Architecture</p>
                    </div>
                 </div>
                 <button 
                  onClick={handleExportPDF} 
                  disabled={isExporting}
                  className="px-10 py-5 bg-brand-accent text-brand-text-primary rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-accent/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-3 w-full md:w-auto justify-center disabled:opacity-50"
                 >
                    {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                    {isExporting ? 'Generating Professional PDF...' : 'Export High-Fidelity Deck'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden container for PDF export */}
      <div className="fixed left-[-9999px] top-[-9999px] pointer-events-none" ref={exportContainerRef}>
        {Array.isArray(currentAnalysis.pitchReadiness?.slides) && currentAnalysis.pitchReadiness.slides.map((slide: any, idx: number) => (
          <PitchDeckSlide 
            key={`export-${idx}`} 
            slide={slide} 
            index={idx} 
            companyName={displayProfile.companyName || 'Venture'} 
          />
        ))}
      </div>

    </div>
  );
}
