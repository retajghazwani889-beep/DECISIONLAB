import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, AnalysisReport } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { generateCompanyAnalysis, generatePitchDeck } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Rocket, Search, Settings, Calendar, 
  ChevronRight, BarChart3, Shield, Zap, Image as ImageIcon, Plus,
  Building2, Users, Briefcase, Check, ArrowUpRight, ArrowRight, Wand2, Layers,
  MapPin, Globe, FileText, Edit3, X, ChevronLeft, Download, Target, CheckCircle2, Activity, ShieldAlert, Linkedin, Presentation
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CircularProgress, AnimatedCounter, VCCommandCenter, ConfidenceLineChart, RiskEcosystemMap, RiskHeatmap } from '../components/ReportVisuals';

import { INDUSTRIES, STARTUP_STAGES, PRODUCT_TYPES, BUSINESS_TYPES, TEAM_ROLES, TEAM_SPECIALTIES } from '../constants';

interface DashboardPageProps {
  user: User;
  profile: UserProfile | null;
}

export default function DashboardPage({ user, profile }: DashboardPageProps) {
  const [analyses, setAnalyses] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      alert("Select at least 2 ideas to compare");
      return;
    }
    navigate(`/compare?ids=${selectedIds.join(',')}`);
  };

  const isPremium = profile?.subscriptionStatus === 'premium' || user?.email === 'retajghazwani889@gmail.com';

  const riskData = profile?.companyAnalysis?.scores ? [
    { subject: 'Market', A: (profile.companyAnalysis.scores.marketFit as any)?.score || profile.companyAnalysis.scores.marketFit || 0, fullMark: 100 },
    { subject: 'Execution', A: (profile.companyAnalysis.scores.execution as any)?.score || (profile.companyAnalysis.scores as any).executionReadiness?.score || profile.companyAnalysis.scores.execution || 0, fullMark: 100 },
    { subject: 'Competitive', A: (profile.companyAnalysis.scores.competition as any)?.score || (profile.companyAnalysis.scores as any).competitiveAdvantage?.score || profile.companyAnalysis.scores.competition || 0, fullMark: 100 },
    { subject: 'Financial', A: (profile.companyAnalysis.scores.investorAppeal as any)?.score || (profile.companyAnalysis.scores as any).investorAttractiveness?.score || profile.companyAnalysis.scores.investorAppeal || 0, fullMark: 100 },
    { subject: 'Product', A: (profile.companyAnalysis.scores.ideaStrength as any)?.score || profile.companyAnalysis.scores.ideaStrength || 0, fullMark: 100 },
  ] : [];

  const investorAttractiveness = (profile?.companyAnalysis?.scores as any)?.investorAppeal || (profile?.companyAnalysis?.scores as any)?.investorAttractiveness;
  const attractivenessScore = typeof investorAttractiveness === 'object' ? investorAttractiveness.score : investorAttractiveness;

  const confidenceData = attractivenessScore ? [
    { stage: 'Pre-Seed', value: 20 },
    { stage: 'Seed', value: 45 },
    { stage: 'Series A', value: attractivenessScore },
    { stage: 'Series B', value: Math.min(100, attractivenessScore + 15) },
    { stage: 'Scale', value: Math.min(100, attractivenessScore + 30) },
  ] : [];

  const handleExportReport = () => {
    window.print();
  };

  const [activeTab, setActiveTab] = useState<'analyses' | 'profile'>('analyses');

  // Profile Form State
  const [companyName, setCompanyName] = useState(profile?.companyName || '');
  const [industry, setIndustry] = useState(profile?.industry || '');
  const [companyDescription, setCompanyDescription] = useState(profile?.companyDescription || '');
  const [startupStage, setStartupStage] = useState<UserProfile['startupStage']>(profile?.startupStage || 'Idea Stage');
  const [pitchSummary, setPitchSummary] = useState(profile?.pitchSummary || '');
  const [founderInfo, setFounderInfo] = useState(profile?.founderInfo || '');
  const [teamMembers, setTeamMembers] = useState(profile?.teamMembers || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [businessType, setBusinessType] = useState<UserProfile['businessType']>(profile?.businessType || 'B2B');
  const [productType, setProductType] = useState<UserProfile['productType']>(profile?.productType || 'SaaS Platform');
  const [pitchDeckUrl, setPitchDeckUrl] = useState(profile?.pitchDeckUrl || '');
  const [sectors, setSectors] = useState(profile?.sectors?.join(', ') || '');
  const [teamStructure, setTeamStructure] = useState<UserProfile['teamStructure']>(profile?.teamStructure || []);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(profile?.companyLogo || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingDeck, setGeneratingDeck] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showDeck, setShowDeck] = useState(false);

  useEffect(() => {
    fetchAnalyses();
    if (profile) {
      setCompanyName(profile.companyName || '');
      setCompanyLogo(profile.companyLogo || '');
      setIndustry(profile.industry || '');
      setCompanyDescription(profile.companyDescription || '');
      setStartupStage(profile.startupStage || 'Idea Stage');
      setPitchSummary(profile.pitchSummary || '');
      setFounderInfo(profile.founderInfo || '');
      setTeamMembers(profile.teamMembers || '');
      setLocation(profile.location || '');
      setBusinessType(profile.businessType || 'B2B');
      setProductType(profile.productType || 'SaaS Platform');
      setPitchDeckUrl(profile.pitchDeckUrl || '');
      setSectors(profile.sectors?.join(', ') || '');
      setTeamStructure(profile.teamStructure || []);
    }
  }, [user, profile]);

  const fetchAnalyses = async () => {
    try {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalysisReport));
      setAnalyses(data);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        companyName,
        companyLogo,
        industry,
        companyDescription,
        startupStage,
        pitchSummary,
        founderInfo,
        teamMembers,
        location,
        businessType,
        productType,
        pitchDeckUrl,
        teamStructure,
        sectors: sectors.split(',').map(s => s.trim()).filter(Boolean),
        updatedAt: serverTimestamp()
      });
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!profile) return;
    
    // Validation: Require at least a description or pitch
    if (!profile.companyDescription?.trim() && !profile.pitchSummary?.trim()) {
      alert("Meaningful startup information is required. Please provide at least a Business Description or Elevator Pitch in your profile.");
      setIsEditing(true);
      return;
    }

    setAnalyzing(true);
    try {
      const analysisInput = {
        companyName: profile.companyName,
        industry: profile.industry,
        companyDescription: profile.companyDescription,
        startupStage: profile.startupStage,
        pitchSummary: profile.pitchSummary,
        founderInfo: profile.founderInfo,
        teamMembers: profile.teamMembers,
        location: profile.location,
        businessType: profile.businessType,
        productType: profile.productType,
        pitchDeckUrl: profile.pitchDeckUrl,
        sectors: profile.sectors,
        teamStructure: profile.teamStructure
      };

      const result = await generateCompanyAnalysis(analysisInput);
      await updateDoc(doc(db, 'profiles', user.uid), {
        companyAnalysis: {
          ...result,
          generatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
      alert("Failed to generate analysis. Please ensure your profile has enough detail.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateDeck = async () => {
    if (!profile) return;
    setGeneratingDeck(true);
    try {
      const result = await generatePitchDeck(profile);
      await updateDoc(doc(db, 'profiles', user.uid), {
        pitchDeck: {
          ...result,
          generatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
      setShowDeck(true);
      setCurrentSlide(0);
    } catch (err) {
      console.error(err);
      alert("Failed to generate pitch deck.");
    } finally {
      setGeneratingDeck(false);
    }
  };

  const ScoreBar = ({ label, score, explanation }: { label: string; score: number; explanation: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-brand-text-primary">{label}</span>
        <span className={cn(
          "text-xs font-black",
          score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-rose-500"
        )}>{score}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className={cn(
            "h-full transition-all duration-1000",
            score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500"
          )}
        />
      </div>
      <p className="text-xs text-brand-text-secondary leading-relaxed">{explanation}</p>
    </div>
  );

  const handleExportDeck = () => {
    window.print();
  };

  const SlideTheme = (slideTitle: string) => {
    const t = slideTitle.toLowerCase();
    if (t.includes('problem') || t.includes('risk')) return 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/20';
    if (t.includes('solution') || t.includes('growth') || t.includes('traction') || t.includes('mvp')) return 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20';
    if (t.includes('market') || t.includes('financial') || t.includes('ask') || t.includes('business model')) return 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-950/20';
    return 'border-neutral-800 text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800/50';
  };

  const MetricTheme = (slide: any) => {
    return {
      color: slide.colorAccent || '#3b82f6',
      backgroundColor: `${slide.colorAccent || '#3b82f6'}10`,
      borderColor: `${slide.colorAccent || '#3b82f6'}30`
    };
  };

  const currentSlideData = profile?.pitchDeck?.slides[currentSlide];
  const bgImageUrl = currentSlideData?.imageKeywords 
    ? `https://images.unsplash.com/photo-1?auto=format&fit=crop&q=80&w=1200&h=800&keywords=${encodeURIComponent(currentSlideData.imageKeywords)}`
    : `https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200&h=800`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-brand-bg">
      <div className="flex flex-col lg:flex-row gap-12 items-start bg-brand-bg">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-80 space-y-8 no-print lg:sticky lg:top-32 transition-all">
          <div className="space-y-2">
            <div className="px-6 mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-brand-text-muted">Strategic Hub</h3>
            </div>
            
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('analyses')}
              className={cn(
                 "w-full flex items-center justify-between px-8 py-6 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all duration-500 bg-brand-card",
                 activeTab === 'analyses' 
                 ? "bg-brand-section text-brand-accent shadow-huge border border-white/5" 
                 : "text-brand-text-muted hover:bg-brand-section/50 hover:text-brand-text-primary border border-transparent"
              )}
            >
              <div className="flex items-center gap-4 text-brand-text-primary">
                <div className={cn("w-2.5 h-2.5 rounded-full", activeTab === 'analyses' ? "bg-brand-accent shadow-glow" : "bg-white/10")} />
                Venture Archive
              </div>
              {analyses.length > 0 && (
                <span className="px-4 py-1.5 bg-brand-bg rounded-xl text-xs font-black text-brand-accent/60 border border-white/5">
                  {analyses.length}
                </span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('profile')}
              className={cn(
                 "w-full flex items-center gap-4 px-8 py-6 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all duration-500 text-[#fbfbff]",
                 activeTab === 'profile' 
                 ? "bg-brand-section text-brand-accent shadow-huge border border-white/5" 
                 : "text-brand-text-muted hover:bg-brand-section/50 hover:text-brand-text-primary border border-transparent"
              )}
            >
              <div className={cn("w-2.5 h-2.5 rounded-full", activeTab === 'profile' ? "bg-brand-accent shadow-glow" : "bg-white/10")} />
              Institutional Profile
            </motion.button>

            <Link
              to="/pitch-deck"
              className={cn(
                 "w-full flex items-center justify-between px-8 py-6 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all duration-500 group",
                 "text-brand-text-muted hover:bg-brand-section/50 hover:text-brand-text-primary border border-transparent"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-brand-accent group-hover:shadow-glow transition-all" />
                Deck Architect
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
            </Link>
          </div>
          
          <div className="pt-4">
            <div className="px-6 mb-8">
               <h3 className="text-xs font-black uppercase tracking-[0.4em] text-brand-text-primary">Status</h3>
            </div>
            <Link
              to="/premium"
              className="group block p-10 rounded-[2.5rem] bg-brand-section/40 border border-white/5 hover:border-brand-accent/30 transition-all duration-700 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={44} className="text-brand-accent" />
              </div>
              <div className="relative z-10">
                <div className="text-xs font-black uppercase tracking-widest text-brand-accent mb-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                   {isPremium ? 'Institutional' : 'Standard Ingress'}
                </div>
                <h4 className="text-sm font-black text-brand-text-primary uppercase mb-6 tracking-tight">
                  {isPremium ? 'Full Logic Access' : 'Upgrade Analysis'}
                </h4>
                <div className="flex items-center gap-2 text-xs font-black text-brand-text-muted uppercase tracking-widest group-hover:text-brand-accent transition-colors">
                  System Protocol <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Main Operating Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'analyses' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-black uppercase tracking-[0.2em] mb-6">
                    Analysis Archive
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-brand-text-primary uppercase font-display tracking-tight leading-none mb-6">Venture Log</h2>
                  <p className="text-sm text-brand-text-secondary font-medium opacity-80">Historical institutional analysis reports</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {analyses.length > 1 && (
                    <button 
                      onClick={() => {
                        if (comparisonMode) {
                          handleCompare();
                        } else {
                          setComparisonMode(true);
                        }
                      }}
                      className={cn(
                        "px-6 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-3",
                        comparisonMode 
                          ? "bg-brand-accent text-brand-text-primary shadow-huge" 
                          : "bg-brand-card text-brand-text-muted border border-white/5 shadow-2xl"
                      )}
                    >
                      <Zap size={16} strokeWidth={3} />
                      {comparisonMode ? `Synthesize (${selectedIds.length})` : 'Compare Analysis'}
                    </button>
                  )}
                  {comparisonMode && (
                    <button 
                      onClick={() => {
                        setComparisonMode(false);
                        setSelectedIds([]);
                      }}
                      className="px-8 py-4 text-sm font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-text-primary transition-colors"
                    >
                      Reset
                    </button>
                  )}
                  <Link 
                    to="/" 
                    className="px-10 py-5 bg-brand-accent text-brand-text-primary text-sm font-black uppercase tracking-widest rounded-3xl hover:bg-brand-accent shadow-huge hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                  >
                    Execute Briefing <ArrowRight size={20} strokeWidth={3} />
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6">
                  <div className="w-12 h-12 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-black text-brand-text-muted uppercase tracking-[0.4em]">Synchronizing Archive...</p>
                </div>
              ) : analyses.length === 0 ? (
                <div className="py-32 text-center bg-brand-section/50 rounded-[4rem] border border-dashed border-white/5">
                  <Rocket size={48} strokeWidth={1.5} className="mx-auto text-brand-text-muted mb-8 opacity-20" />
                  <p className="text-sm font-black text-brand-text-muted uppercase tracking-tighter mb-4">No Analysis Logged</p>
                  <p className="text-sm text-brand-text-muted/60 max-w-xs mx-auto font-medium">Your venture analyses will appear here once executed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {analyses.map((item) => (
                    <div key={item.id} className="relative flex items-center group/row">
                      {comparisonMode && (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={(e) => toggleSelection(e, item.id)}
                          className={cn(
                            "mr-6 w-8 h-8 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all shrink-0",
                            selectedIds.includes(item.id) 
                              ? "bg-brand-accent border-brand-accent text-brand-text-primary shadow-glow" 
                              : "border-white/10 hover:border-brand-accent/50"
                          )}
                        >
                          {selectedIds.includes(item.id) && <Check size={16} strokeWidth={3} />}
                        </motion.div>
                      )}
                      <Link
                        to={`/analysis/${item.id}`}
                        className={cn(
                          "group relative flex-1 flex items-center justify-between p-10 bg-brand-section rounded-[3rem] border transition-all duration-700 overflow-hidden",
                          comparisonMode && selectedIds.includes(item.id) 
                            ? "border-brand-accent bg-brand-accent/[0.03] shadow-huge" 
                            : "border-white/5 hover:border-brand-accent/30 bg-brand-card shadow-2xl"
                        )}
                      >
                        <div className="absolute -bottom-4 right-20 text-brand-text-primary/[0.02] text-9xl font-black pointer-events-none select-none tracking-tighter uppercase italic">
                           {(item.scores as any)?.overall || (item.scores as any)?.ideaStrength?.score || '-'}
                        </div>

                        <div className="flex items-center gap-10 relative z-10">
                          <div className={cn(
                            "w-20 h-20 rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-huge shrink-0 transition-all duration-500 group-hover:scale-110",
                            item.status === 'completed' 
                              ? "bg-brand-bg text-brand-accent border border-white/10" 
                              : "bg-brand-bg text-brand-text-muted opacity-40 border border-white/5"
                          )}>
                            {(item.scores as any)?.overall || (item.scores as any)?.ideaStrength?.score || '-'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-brand-text-primary group-hover:text-brand-accent transition-colors line-clamp-1 truncate font-display tracking-tight uppercase leading-none mb-6">
                              {item.ideaDescription}
                            </h4>
                            <div className="flex flex-wrap items-center gap-10">
                              <span className="flex items-center gap-4 text-xs font-black uppercase text-brand-text-muted tracking-[0.2em] bg-brand-bg/50 px-4 py-2 rounded-xl border border-white/5">
                                <Calendar size={14} strokeWidth={3} className="text-brand-accent/60" />
                                {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                              </span>
                              <span className={cn(
                                "text-xs uppercase font-black tracking-[0.2em] flex items-center gap-4",
                                item.status === 'completed' ? "text-emerald-400" : "text-amber-400"
                              )}>
                                <div className={cn("w-2.5 h-2.5 rounded-full", item.status === 'completed' ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]")} />
                                {item.status}
                              </span>
                              {(item as any).updatedAt && (
                                <span className="text-xs font-black uppercase text-brand-purple tracking-[0.2em] flex items-center gap-3 px-4 py-2 bg-brand-purple/5 rounded-xl border border-brand-purple/10">
                                  <Activity size={14} strokeWidth={3} /> REFINED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-brand-bg border border-white/5 flex items-center justify-center text-brand-text-muted group-hover:bg-brand-accent group-hover:text-brand-text-primary group-hover:border-brand-accent transition-all duration-500 shadow-huge relative z-10">
                          <ArrowRight size={22} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-black uppercase tracking-[0.2em] mb-6">
                    Venture Identity
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-brand-text-primary uppercase font-display tracking-tight leading-none mb-6">Profile</h2>
                  <p className="text-sm text-brand-text-muted font-medium opacity-80">Manage your institutional presence</p>
                </div>
                {isPremium && (
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={cn(
                      "flex items-center gap-3 px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all duration-500 shadow-huge",
                      isEditing 
                        ? "bg-brand-bg border border-white/10 text-brand-text-primary hover:bg-white/5" 
                        : "bg-brand-accent border border-brand-accent text-brand-text-primary hover:scale-105 active:scale-95"
                    )}
                  >
                    {isEditing ? (
                      <>
                        <X size={16} strokeWidth={3} /> Abort Edit
                      </>
                    ) : (
                      <>
                        <Edit3 size={16} strokeWidth={3} /> Configure Profile
                      </>
                    )}
                  </button>
                )}
              </div>

              {!profile || !isPremium ? (
                <div className="p-16 bg-brand-section rounded-[4rem] border border-white/5 flex flex-col md:flex-row items-center gap-12 shadow-huge relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                    <Zap size={120} className="text-brand-accent" />
                  </div>
                  <div className="w-28 h-28 bg-brand-accent/10 rounded-[2.5rem] flex items-center justify-center text-brand-accent shadow-huge border border-brand-accent/20 relative z-10">
                    <Zap size={56} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 text-center md:text-left relative z-10">
                    <div className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-6">Premium Required</div>
                    <h3 className="text-4xl font-black text-brand-text-primary mb-6 uppercase tracking-tight font-display leading-tight">Institutional Profile</h3>
                    <p className="text-brand-text-muted text-xs mb-10 max-w-xl font-medium leading-relaxed opacity-80">
                      Unlock the ability to track your venture evolution, manage team structures, and generate institutional-grade documentation.
                    </p>
                    <Link to="/premium" className="inline-flex items-center gap-4 px-12 py-6 bg-brand-accent text-brand-text-primary font-black uppercase tracking-widest text-sm rounded-3xl hover:bg-brand-accent shadow-huge hover:scale-105 active:scale-95 transition-all">
                      Upgrade Ingress <ArrowRight size={22} strokeWidth={3} />
                    </Link>
                  </div>
                </div>
              ) : isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-12 max-w-5xl">
                  {/* Basic Info Section */}
                  <div className="bg-brand-section p-12 rounded-[4rem] border border-white/5 shadow-huge space-y-10 relative overflow-hidden">
                    <div className="flex items-center gap-5">
                       <div className="w-2 h-8 bg-brand-accent rounded-full shadow-glow" />
                       <h3 className="text-sm font-black uppercase tracking-[0.4em] text-brand-accent">Executive Summary</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Designation</label>
                        <div className="relative group/field">
                          <div className="absolute inset-0 bg-brand-accent/5 rounded-2xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                          <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-text-muted/30 group-focus-within/field:text-brand-accent transition-colors" size={20} />
                          <input
                            type="text"
                            className="w-full pl-16 pr-6 py-5 bg-brand-bg/50 border border-white/5 rounded-2xl text-base font-bold text-brand-text-primary focus:border-brand-accent/50 focus:ring-0 transition-all outline-none"
                            placeholder="Acme Institutional"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Asset Identifier (Logo URL)</label>
                        <div className="relative group/field">
                          <div className="absolute inset-0 bg-brand-accent/5 rounded-2xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                          <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-text-muted/30 group-focus-within/field:text-brand-accent transition-colors" size={20} />
                          <input
                            type="url"
                            className="w-full pl-16 pr-6 py-5 bg-brand-bg/50 border border-white/5 rounded-2xl text-base font-bold text-brand-text-primary focus:border-brand-accent/50 focus:ring-0 transition-all outline-none"
                            placeholder="https://assets.decisionlab.ai/logo.png"
                            value={companyLogo}
                            onChange={(e) => setCompanyLogo(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Sector Classification</label>
                        <div className="relative group/field">
                          <div className="absolute inset-0 bg-brand-accent/5 rounded-2xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                          <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-text-muted/30 group-focus-within/field:text-brand-accent transition-colors" size={20} />
                          <input
                            type="text"
                            list="industry-options"
                            className="w-full pl-16 pr-6 py-5 bg-brand-bg/50 border border-white/5 rounded-2xl text-base font-bold text-brand-text-primary focus:border-brand-accent/50 focus:ring-0 transition-all outline-none placeholder:text-white/10"
                            placeholder="Search sectors..."
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                          />
                          <datalist id="industry-options">
                            {INDUSTRIES.map(ind => (
                              <option key={ind} value={ind} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Operational Node (Location)</label>
                        <div className="relative group/field">
                          <div className="absolute inset-0 bg-brand-accent/5 rounded-2xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-text-muted/30 group-focus-within/field:text-brand-accent transition-colors" size={20} />
                          <input
                            type="text"
                            className="w-full pl-16 pr-6 py-5 bg-brand-bg/50 border border-white/5 rounded-2xl text-base font-bold text-brand-text-primary focus:border-brand-accent/50 focus:ring-0 transition-all outline-none"
                            placeholder="City, Country"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-6">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Venturing Stage</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2 bg-brand-bg/30 rounded-[2.5rem] border border-white/5">
                          {STARTUP_STAGES.map((stage) => (
                            <button
                              key={stage}
                              type="button"
                              onClick={() => setStartupStage(stage)}
                              className={cn(
                                "py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all duration-500 relative overflow-hidden group",
                                startupStage === stage 
                                  ? "bg-brand-accent text-brand-text-primary shadow-huge" 
                                  : "text-brand-text-muted hover:text-brand-text-primary hover:bg-white/5"
                              )}
                            >
                              <span className="relative z-10">{stage}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Granular Specialization</label>
                        <div className="relative group/field">
                          <div className="absolute inset-0 bg-brand-accent/5 rounded-2xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                          <input
                            type="text"
                            className="w-full px-8 py-5 bg-brand-bg/50 border border-white/5 rounded-2xl text-base font-bold text-brand-text-primary focus:border-brand-accent/50 focus:ring-0 transition-all outline-none"
                            placeholder="e.g. Neo-banking, Cross-border, Yield Optimization"
                            value={sectors}
                            onChange={(e) => setSectors(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Model Section */}
                  <div className="bg-brand-section p-12 rounded-[4rem] border border-white/5 shadow-huge space-y-10 relative overflow-hidden">
                    <div className="flex items-center gap-5">
                       <div className="w-2 h-8 bg-brand-purple rounded-full shadow-glow" />
                       <h3 className="text-sm font-black uppercase tracking-[0.4em] text-brand-purple">Economic Framework</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Monetization Engine</label>
                        <div className="relative group/field">
                          <div className="absolute inset-0 bg-brand-purple/5 rounded-2xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                          <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-text-muted/30 group-focus-within/field:text-brand-purple transition-colors" size={20} />
                          <input
                            type="text"
                            list="business-options"
                            className="w-full pl-16 pr-6 py-5 bg-brand-bg/50 border border-white/5 rounded-2xl text-base font-bold text-brand-text-primary focus:border-brand-purple/50 focus:ring-0 transition-all outline-none"
                            placeholder="Select model..."
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value as any)}
                          />
                          <datalist id="business-options">
                            {BUSINESS_TYPES.map(type => (
                              <option key={type} value={type} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Product Architecture</label>
                        <div className="relative group/field">
                          <div className="absolute inset-0 bg-brand-purple/5 rounded-2xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                          <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-text-muted/30 group-focus-within/field:text-brand-purple transition-colors" size={20} />
                          <input
                            type="text"
                            list="product-options"
                            className="w-full pl-16 pr-6 py-5 bg-brand-bg/50 border border-white/5 rounded-2xl text-base font-bold text-brand-text-primary focus:border-brand-purple/50 focus:ring-0 transition-all outline-none"
                            placeholder="Select type..."
                            value={productType}
                            onChange={(e) => setProductType(e.target.value as any)}
                          />
                          <datalist id="product-options">
                            {PRODUCT_TYPES.map(type => (
                              <option key={type} value={type} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Briefing Link (Pitch Deck)</label>
                        <div className="relative group/field">
                          <div className="absolute inset-0 bg-brand-purple/5 rounded-2xl opacity-0 group-focus-within/field:opacity-100 transition-opacity duration-500" />
                          <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-text-muted/30 group-focus-within/field:text-brand-purple transition-colors" size={20} />
                          <input
                            type="url"
                            className="w-full pl-16 pr-6 py-5 bg-brand-bg/50 border border-white/5 rounded-2xl text-base font-bold text-brand-text-primary focus:border-brand-purple/50 focus:ring-0 transition-all outline-none"
                            placeholder="https://docsend.com/ institutional-brief"
                            value={pitchDeckUrl}
                            onChange={(e) => setPitchDeckUrl(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deep Details Section */}
                  <div className="bg-brand-section p-12 rounded-[4rem] border border-white/5 shadow-huge space-y-14 relative overflow-hidden">
                    <div className="flex items-center gap-5">
                       <div className="w-2 h-8 bg-brand-accent rounded-full shadow-glow" />
                       <h3 className="text-sm font-black uppercase tracking-[0.4em] text-brand-accent">Strategic Thesis</h3>
                    </div>
                    <div className="space-y-12">
                      <div className="space-y-5">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Venture Narrative (Detailed)</label>
                        <textarea
                          className="w-full px-10 py-10 bg-brand-bg/50 border border-white/5 rounded-[2.5rem] text-base font-medium h-64 focus:border-brand-accent/50 focus:ring-0 transition-all resize-none text-brand-text-primary outline-none leading-relaxed"
                          placeholder="Articulate your vision, institutional value proposition, and competitive moats..."
                          value={companyDescription}
                          onChange={(e) => setCompanyDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-5">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Executive Ingress (Elevator Pitch)</label>
                        <textarea
                          className="w-full px-10 py-10 bg-brand-bg/50 border border-white/5 rounded-[2rem] text-base font-medium h-40 focus:border-brand-accent/50 focus:ring-0 transition-all resize-none text-brand-text-primary outline-none leading-relaxed"
                          placeholder="Synthesize your business into a high-impact thesis..."
                          value={pitchSummary}
                          onChange={(e) => setPitchSummary(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-5">
                          <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-muted px-2">Founder Pedigree & Institutional Expertise</label>
                          <textarea
                            className="w-full px-10 py-10 bg-brand-bg/50 border border-white/5 rounded-[2.5rem] text-base font-medium h-64 focus:border-brand-accent/50 focus:ring-0 transition-all resize-none text-brand-text-primary outline-none leading-relaxed"
                            placeholder="Who leads this venture? Detail their relevant experience and expertise..."
                            value={founderInfo}
                            onChange={(e) => setFounderInfo(e.target.value)}
                          />
                        </div>
                      <div className="md:col-span-2 space-y-10">
                        <div className="flex items-center justify-between px-2">
                           <div className="flex items-center gap-4">
                              <div className="w-1.5 h-6 bg-brand-cyan rounded-full shadow-glow" />
                              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-brand-cyan">Operational Hierarchy</h3>
                           </div>
                           <button
                             type="button"
                             onClick={() => {
                               const newMember = {
                                 id: Math.random().toString(36).substr(2, 9),
                                 name: '',
                                 role: 'CEO',
                                 specialty: [],
                                 experience: 5,
                                 background: ''
                               };
                               setTeamStructure([...teamStructure, newMember]);
                             }}
                             className="text-xs font-black uppercase text-brand-accent hover:text-brand-cyan transition-colors flex items-center gap-4 px-6 py-3 bg-brand-bg/50 border border-white/5 rounded-xl hover:border-brand-accent/30"
                           >
                             <Plus size={16} strokeWidth={3} /> Add Personnel
                           </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {teamStructure.map((member, idx) => (
                            <div key={member.id} className="p-8 bg-brand-bg/50 border border-white/5 rounded-[2.5rem] space-y-8 relative group shadow-2xl hover:border-brand-accent/20 transition-all duration-500">
                              <button
                                type="button"
                                onClick={() => setTeamStructure(teamStructure.filter(m => m.id !== member.id))}
                                className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-brand-bg border border-white/5 flex items-center justify-center text-brand-text-muted hover:text-rose-500 hover:border-rose-500/30 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X size={16} strokeWidth={3} />
                              </button>
                              
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase text-brand-text-muted tracking-[0.2em] px-1">Full Legal Name</label>
                                  <input
                                    type="text"
                                    className="w-full bg-brand-section border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all"
                                    value={member.name}
                                    onChange={(e) => {
                                      const newTeam = [...teamStructure];
                                      newTeam[idx].name = e.target.value;
                                      setTeamStructure(newTeam);
                                    }}
                                    placeholder="Jane Doe"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase text-brand-text-muted tracking-[0.2em] px-1">Institutional Role</label>
                                  <select
                                    className="w-full bg-brand-section border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all appearance-none cursor-pointer"
                                    value={member.role}
                                    onChange={(e) => {
                                      const newTeam = [...teamStructure];
                                      newTeam[idx].role = e.target.value;
                                      setTeamStructure(newTeam);
                                    }}
                                  >
                                    {TEAM_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase text-brand-text-muted tracking-[0.2em] px-1">Industry Tenure (Yrs)</label>
                                  <input
                                    type="number"
                                    className="w-full bg-brand-section border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all"
                                    value={member.experience}
                                    onChange={(e) => {
                                      const newTeam = [...teamStructure];
                                      newTeam[idx].experience = parseInt(e.target.value) || 0;
                                      setTeamStructure(newTeam);
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase text-brand-text-muted tracking-[0.2em] px-1">Professional Trace (LinkedIn)</label>
                                  <input
                                    type="text"
                                    className="w-full bg-brand-section border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all"
                                    value={member.linkedin || ''}
                                    onChange={(e) => {
                                      const newTeam = [...teamStructure];
                                      newTeam[idx].linkedin = e.target.value;
                                      setTeamStructure(newTeam);
                                    }}
                                    placeholder="linkedin.com/in/identifier"
                                  />
                                </div>
                              </div>

                              <div className="space-y-4">
                                <label className="text-xs font-black uppercase text-brand-text-muted tracking-[0.2em] px-1">Operational Domains</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {member.specialty.map(s => (
                                    <span key={s} className="px-3 py-1.5 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2">
                                      {s}
                                      <X 
                                        size={10} 
                                        strokeWidth={3}
                                        className="cursor-pointer hover:text-white transition-colors" 
                                        onClick={() => {
                                          const newTeam = [...teamStructure];
                                          newTeam[idx].specialty = newTeam[idx].specialty.filter(x => x !== s);
                                          setTeamStructure(newTeam);
                                        }} 
                                      />
                                    </span>
                                  ))}
                                </div>
                                <select
                                  className="w-full bg-brand-section/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-brand-text-muted focus:text-white focus:border-brand-accent/50 outline-none transition-all cursor-pointer"
                                  onChange={(e) => {
                                    if (!e.target.value) return;
                                    const newTeam = [...teamStructure];
                                    if (!newTeam[idx].specialty.includes(e.target.value)) {
                                      newTeam[idx].specialty.push(e.target.value);
                                      setTeamStructure(newTeam);
                                    }
                                    e.target.value = '';
                                  }}
                                >
                                  <option value="">Index Domain Specialty...</option>
                                  {TEAM_SPECIALTIES.filter(s => !member.specialty.includes(s)).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-black uppercase text-brand-text-muted tracking-[0.2em] px-1">Institutional Trace (Bio)</label>
                                <textarea
                                  className="w-full bg-brand-section border border-white/5 rounded-2xl px-4 py-4 text-xs font-semibold text-brand-text-primary focus:border-brand-accent/50 outline-none transition-all h-24 resize-none leading-relaxed"
                                  value={member.background}
                                  onChange={(e) => {
                                    const newTeam = [...teamStructure];
                                    newTeam[idx].background = e.target.value;
                                    setTeamStructure(newTeam);
                                  }}
                                  placeholder="Academic pedigree, historical exits, or domain mastery..."
                                />
                              </div>
                            </div>
                          ))}
                          {teamStructure.length === 0 && (
                            <div className="md:col-span-2 border-2 border-dashed border-white/5 rounded-[4rem] p-16 text-center bg-brand-bg/20">
                              <div className="w-16 h-16 bg-brand-bg border border-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-brand-text-muted opacity-20">
                                 <Users size={32} />
                              </div>
                              <p className="text-sm font-black text-brand-text-muted uppercase tracking-tighter mb-4">Leadership Missing</p>
                              <p className="text-sm text-brand-text-muted/60 max-w-xs mx-auto mb-10 font-medium">No institutional personnel have been indexed for this venture.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  const newMember = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    name: '',
                                    role: 'Founder',
                                    specialty: [],
                                    experience: 5,
                                    background: ''
                                  };
                                  setTeamStructure([newMember]);
                                }}
                                className="px-8 py-4 bg-brand-accent text-brand-text-primary text-xs font-black uppercase tracking-widest rounded-3xl hover:bg-brand-accent shadow-huge hover:scale-105 active:scale-95 transition-all"
                              >
                                + Build Leadership Team
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 sticky bottom-10 z-20 bg-brand-bg/80 backdrop-blur-2xl p-6 rounded-[3rem] border border-white/10 shadow-huge">
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-12 py-5 bg-brand-accent text-brand-text-primary text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-brand-accent shadow-huge hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      {updating ? 'Synchronizing Logic...' : 'Publish Update'}
                    </button>
                    {profile?.companyAnalysis && (
                      <button
                        type="button"
                        onClick={async () => {
                          await handleUpdateProfile(new Event('submit') as any);
                          handleRunAnalysis();
                        }}
                        disabled={updating || analyzing}
                        className="px-12 py-5 bg-brand-bg border border-white/10 text-brand-text-primary text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-white/5 shadow-huge hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3"
                      >
                        {analyzing ? (
                           <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                        ) : <Wand2 size={16} className="text-brand-accent" />}
                        Sync & Regenerate Analysis
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-10 py-5 text-brand-text-muted text-xs font-black uppercase tracking-widest hover:text-brand-text-primary transition-colors"
                    >
                      Abort Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-16 animate-in slide-in-from-bottom-6 duration-1000 pb-32">
                  {/* Institutional Identity Profile Header */}
                  <div className="relative bg-brand-section rounded-[4rem] border border-white/5 overflow-hidden shadow-huge">
                    <div className="h-64 bg-brand-card relative overflow-hidden">
                       <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                       <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/10 to-brand-purple/10" />
                       <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-brand-section to-transparent" />
                    </div>
                    <div className="px-10 md:px-16 pb-16 relative">
                       {/* Identity Mark */}
                       <div className="absolute -top-24 left-10 md:left-16 w-48 h-48 bg-brand-section rounded-[3rem] p-1 border-[12px] border-brand-bg shadow-huge flex items-center justify-center overflow-hidden">
                          {profile?.companyLogo ? (
                             <img src={profile.companyLogo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                             <div className="w-full h-full bg-brand-bg flex items-center justify-center text-brand-accent font-black text-6xl font-display italic">
                                {profile?.companyName ? profile.companyName.charAt(0).toUpperCase() : <Building2 size={72} className="opacity-10" />}
                             </div>
                          )}
                       </div>
                       
                       <div className="pt-28 flex flex-col md:flex-row md:items-end justify-between gap-12">
                          <div className="space-y-6 flex-1">
                             <div className="flex flex-wrap items-center gap-4">
                               <h1 className="text-5xl md:text-6xl font-black text-brand-text-primary tracking-tighter font-display uppercase leading-none">{profile?.companyName || 'Institutional Entity'}</h1>
                               <div className="px-4 py-1.5 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-base font-black uppercase tracking-[0.3em] rounded-full shadow-glow">
                                 {isPremium ? 'Institutional Grade' : 'Standard'}
                               </div>
                             </div>
                             <p className="text-2xl font-medium text-brand-text-muted max-w-3xl leading-relaxed italic opacity-80">
                               "{profile?.pitchSummary || 'Venture narrative synthesis required.'}"
                             </p>
                             <div className="flex flex-wrap items-center gap-x-12 gap-y-4 pt-10 border-t border-white/5">
                                <span className="flex items-center gap-4 text-xs font-black text-brand-text-muted uppercase tracking-[0.2em]">
                                   <Briefcase size={20} className="text-brand-accent/60" /> {profile?.industry || 'Classified'}
                                </span>
                                <span className="flex items-center gap-4 text-xs font-black text-brand-text-muted uppercase tracking-[0.2em]">
                                   <MapPin size={20} className="text-brand-accent/60" /> {profile?.location || 'Undisclosed'}
                                </span>
                                <div className="h-4 w-px bg-white/10 hidden md:block" />
                                <span className="flex items-center gap-4 text-xs font-black text-brand-accent uppercase tracking-[0.2em]">
                                   <Rocket size={20} className="animate-pulse" /> {profile?.startupStage?.toUpperCase() || 'ALPHA'} PHASE
                                </span>
                             </div>
                          </div>
                          
                          <div className="flex flex-col gap-4 shrink-0">
                             {profile?.pitchDeckUrl && (
                                <motion.a 
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  href={profile.pitchDeckUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-10 py-5 bg-brand-bg border border-white/10 text-brand-text-primary rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-white/5 transition-all shadow-huge"
                                >
                                   <FileText size={20} className="text-brand-accent" /> Institutional Deck
                                </motion.a>
                             )}
                             <motion.button 
                               whileHover={{ scale: 1.02 }}
                               whileTap={{ scale: 0.98 }}
                               onClick={() => setIsEditing(true)}
                               className="px-10 py-5 bg-brand-accent border border-brand-accent text-brand-text-primary rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 shadow-huge hover:bg-brand-accent"
                             >
                                <Settings size={20} /> Configure Identity
                             </motion.button>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Deep Analysis Trigger */}
                  {!profile?.companyAnalysis ? (
                    <section className="bg-brand-section p-16 rounded-[4.5rem] border border-white/5 shadow-huge relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/10 blur-[120px] rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                      <div className="relative z-10">
                         <div className="flex items-center gap-6 mb-12">
                            <div className="w-20 h-20 bg-brand-accent rounded-[2.5rem] flex items-center justify-center shadow-huge">
                               <Zap className="text-brand-text-primary" size={36} strokeWidth={3} />
                            </div>
                            <div>
                               <div className="text-xs font-black uppercase tracking-[0.4em] text-brand-accent mb-2">Protocol Deployment</div>
                               <h2 className="text-4xl font-black text-brand-text-primary font-display uppercase tracking-tight leading-none">Capital Audit</h2>
                            </div>
                         </div>
                         
                         {(!profile?.companyDescription?.trim() && !profile?.pitchSummary?.trim()) ? (
                           <div className="max-w-2xl">
                             <h2 className="text-5xl font-black mb-8 font-display tracking-tight text-brand-text-primary uppercase leading-tight">Baseline Synthesis <br />Required</h2>
                             <p className="text-brand-text-muted mb-12 text-xs font-medium leading-relaxed">
                               Before execution of our high-fidelity venture analysis models, the core institutional narrative must be saved. Articulate your <b>Strategic Thesis</b> and <b>Executive Ingress</b> to proceed.
                             </p>
                             <button 
                                onClick={() => setIsEditing(true)}
                                className="px-12 py-6 bg-brand-accent text-brand-text-primary font-black uppercase tracking-widest text-xs rounded-3xl hover:bg-brand-accent shadow-huge transition-all active:scale-95 flex items-center gap-4"
                             >
                                <Edit3 size={20} strokeWidth={3} /> Invoke Logic Editor
                             </button>
                           </div>
                         ) : (
                           <div className="max-w-2xl">
                             <h2 className="text-5xl font-black mb-8 font-display tracking-tight text-brand-text-primary uppercase leading-tight">Execute Deep <br />Venture Analysis</h2>
                             <p className="text-brand-text-muted mb-12 text-xs font-medium leading-relaxed">
                                Deploy our proprietary institutional evaluation protocol to measure scale potential, risk concentration, and absolute market fit. Powered by high-fidelity decision logic.
                             </p>
                             <button 
                                onClick={handleRunAnalysis}
                                disabled={analyzing}
                                className="px-12 py-6 bg-brand-accent text-brand-text-primary font-black uppercase tracking-widest text-xs rounded-3xl hover:bg-brand-accent shadow-huge transition-all active:scale-95 disabled:opacity-50 flex items-center gap-4"
                             >
                                {analyzing ? (
                                   <>
                                      <div className="w-6 h-6 border-3 border-brand-text-primary border-t-white/30 rounded-full animate-spin" />
                                      Synchronizing Nodes...
                                   </>
                                ) : (
                                   <>
                                      <Rocket size={20} strokeWidth={3} /> Execute Institutional Audit
                                   </>
                                )}
                             </button>
                           </div>
                         )}
                      </div>
                    </section>
                  ) : null}

                   {profile?.companyAnalysis && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 no-print">
                          <div>
                             <div className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-3 px-1">Institutional Report</div>
                             <h2 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display">Analysis Output</h2>
                          </div>
                          <div className="flex items-center gap-6">
                             <button 
                               onClick={handleRunAnalysis}
                               disabled={analyzing}
                               className="px-8 py-4 bg-brand-section border border-white/5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-accent hover:border-brand-accent/50 transition-all flex items-center gap-3 shadow-huge"
                             >
                               {analyzing ? (
                                 <div className="w-3 h-3 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                               ) : (
                                 <Zap size={14} className="text-brand-accent" />
                               )}
                               Refresh Analysis
                             </button>
                             <button 
                                onClick={handleExportReport}
                                className="w-14 h-14 bg-brand-accent text-brand-text-primary rounded-2xl flex items-center justify-center shadow-huge hover:scale-105 active:scale-95 transition-all group"
                                title="Download Institutional Report"
                             >
                                <Download size={22} strokeWidth={3} className="group-hover:-translate-y-1 transition-transform" />
                             </button>
                          </div>
                       </div>

                       {/* Print Only Title */}
                       <div className="hidden print:block mb-16 pt-16 border-t border-neutral-900">
                          <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 text-neutral-950">{profile.companyName}</h1>
                          <p className="text-2xl font-bold text-neutral-500 uppercase tracking-widest">Institutional Venture Analytics</p>
                       </div>

                       {/* 1. EXECUTIVE SUMMARY & INSIGHTS */}
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                          {/* Main Summary Card */}
                          <section className="lg:col-span-2 bg-brand-section p-16 rounded-[4rem] border border-white/5 shadow-huge relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-brand-accent/10" />
                             <div className="relative z-10">
                                <div className="flex items-center gap-6 mb-12">
                                   <div className="w-16 h-16 bg-brand-accent rounded-[2rem] flex items-center justify-center shadow-huge">
                                      <Activity className="text-brand-text-primary" size={32} />
                                   </div>
                                   <h2 className="text-xs font-black text-brand-accent uppercase tracking-[0.4em]">Executive Synthesis</h2>
                                </div>
                                <h3 className="text-4xl lg:text-5xl font-black text-brand-text-primary leading-[1.1] mb-12 font-display uppercase tracking-tight">
                                   {profile.companyAnalysis.summary}
                                </h3>
                                
                                {profile.companyAnalysis.topInvestorTakeaway && (
                                  <div className="mb-12 p-10 bg-brand-bg/50 border border-brand-accent/20 rounded-[3rem] relative overflow-hidden group/box">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-brand-accent" />
                                    <p className="text-xs font-black text-brand-accent uppercase tracking-[0.3em] mb-4">Core Investor Logic</p>
                                    <p className="text-2xl font-bold text-brand-text-primary leading-relaxed opacity-90">
                                      "{profile.companyAnalysis.topInvestorTakeaway}"
                                    </p>
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-8">
                                   <div className="px-10 py-6 bg-brand-bg/30 border border-white/5 rounded-3xl bg-brand-bg/50 backdrop-blur-xl">
                                      <p className="text-xs font-black text-brand-text-muted uppercase tracking-widest mb-2">Institutional Confidence</p>
                                      <p className="text-4xl font-black text-brand-accent">{attractivenessScore || 0}%</p>
                                   </div>
                                   <div className="px-10 py-6 bg-brand-bg/30 border border-white/5 rounded-3xl bg-brand-bg/50 backdrop-blur-xl">
                                      <p className="text-xs font-black text-brand-text-muted uppercase tracking-widest mb-2">Market Pulse</p>
                                      <p className="text-4xl font-black text-emerald-400">{(typeof profile.companyAnalysis.scores.marketFit === 'object' ? profile.companyAnalysis.scores.marketFit.score : profile.companyAnalysis.scores.marketFit) > 70 ? 'BULL' : 'NEUTRAL'}</p>
                                   </div>
                                </div>
                             </div>
                          </section>

                          {/* Key Insight Cards */}
                          <section className="space-y-6">
                             <div className="px-4 mb-2">
                                <h4 className="text-xs font-black text-brand-text-muted uppercase tracking-[0.4em] opacity-40">Strategic Signals</h4>
                             </div>
                             {profile.companyAnalysis.keyInsights?.map((insight, idx) => (
                                <motion.div 
                                   key={idx}
                                   initial={{ opacity: 0, x: 20 }}
                                   whileInView={{ opacity: 1, x: 0 }}
                                   viewport={{ once: true }}
                                   transition={{ delay: idx * 0.1 }}
                                   className="p-8 bg-brand-section border border-white/5 rounded-[2.5rem] shadow-huge hover:border-brand-accent/30 transition-all duration-500 group relative overflow-hidden"
                                >
                                   <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                   <div className="flex gap-6 relative z-10">
                                      <div className="w-12 h-12 shrink-0 rounded-2xl bg-brand-bg border border-white/10 flex items-center justify-center text-brand-accent text-xs font-black shadow-huge italic">
                                         {idx + 1}
                                      </div>
                                       <div className="flex flex-col gap-3 pt-1">
                                          {insight.includes('[') && insight.includes(']') ? (
                                            <div className="space-y-3">
                                              <span className={cn(
                                                "inline-block font-black uppercase px-3 py-1 rounded-full border",
                                                idx === 1 ? "text-xs" : idx === 2 ? "text-xs" : idx === 3 ? "text-xs" : "text-base",
                                                insight.toLowerCase().includes('[high]') ? "bg-rose-500/10 text-rose-500 border-rose-500/30" :
                                                insight.toLowerCase().includes('[medium]') ? "bg-amber-500/10 text-amber-500 border-amber-500/30" :
                                                "bg-cyan-500/10 text-cyan-500 border-cyan-500/30"
                                              )}>
                                                {insight.match(/\[(.*?)\]/)?.[1] || 'INFO'}
                                              </span>
                                              <p className={cn(
                                                "font-bold leading-relaxed group-hover:text-brand-text-primary transition-colors text-brand-text-muted",
                                                idx === 1 ? "text-sm" : (idx === 2 || idx === 3) ? "text-sm" : "text-sm"
                                              )}>
                                                {insight.replace(/\[.*?\]/, '').trim()}
                                              </p>
                                            </div>
                                          ) : (
                                            <p className={cn(
                                              "font-bold leading-relaxed group-hover:text-brand-text-primary transition-colors text-brand-text-muted",
                                              idx === 1 ? "text-sm" : (idx === 2 || idx === 3) ? "text-sm" : "text-sm"
                                            )}>
                                              {insight}
                                            </p>
                                          )}
                                       </div>
                                   </div>
                                </motion.div>
                             ))}
                          </section>
                       </div>

 

                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                          {/* Health Scores Dashboard Component */}
                          <section className="bg-brand-section p-12 rounded-[4rem] border border-white/5 shadow-huge relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-[500px] h-64 bg-brand-accent/5 blur-[100px] rounded-full pointer-events-none" />
                             <h4 className="text-xs font-black uppercase tracking-[0.4em] text-brand-text-muted mb-12 flex items-center gap-4">
                                <Zap className="text-brand-accent shadow-glow" size={24} /> VC Command Center
                             </h4>
                             <div className="space-y-6">
                                <VCCommandCenter 
                                  scores={profile.companyAnalysis.scores} 
                                  finalVerdict={profile.companyAnalysis.finalVerdict}
                                />
                                
                                <div className="mt-8 p-10 bg-brand-accent/5 border border-brand-accent/20 rounded-[3rem] relative overflow-hidden group/insight">
                                   <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                                   <div className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                                      <Zap size={16} strokeWidth={3} className="animate-pulse" /> Synthesis Logic
                                   </div>
                                   <p className="text-sm text-brand-text-primary font-bold italic opacity-80 leading-relaxed max-w-2xl">
                                      "{Object.values(profile.companyAnalysis.scores as any).every((s: any) => typeof s === 'object' ? s.score > 70 : s > 70) ? "Balanced, high-growth architecture detected across all primary vectors." : 
                                       Object.values(profile.companyAnalysis.scores as any).some((s: any) => typeof s === 'object' ? s.score < 40 : s < 40) ? "Critical imbalance observed. Immediate strategic pivot or resource allocation required on weak vectors." :
                                       "Strong core detected. Tactical optimization required to solve scalability and execution bottlenecks."}"
                                   </p>
                                </div>
                             </div>
                          </section>

                          {/* Verdict & Risk Matrix Dashboard Component */}
                          <div className="space-y-8">
                             {/* Verdict Badge */}
                             <section className={cn(
                                "p-12 rounded-[4rem] border-2 shadow-huge relative overflow-hidden group",
                                profile.companyAnalysis.finalVerdict?.status === 'Strong Investment Opportunity' ? "bg-emerald-500/5 border-emerald-500/30" :
                                profile.companyAnalysis.finalVerdict?.status === 'Moderate Potential' ? "bg-brand-accent/5 border-brand-accent/30" :
                                "bg-rose-500/5 border-rose-500/30"
                             )}>
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <p className="text-xs font-black uppercase tracking-[0.5em] text-brand-text-muted mb-6 relative z-10 text-center opacity-40">Institutional Analysis Verdict</p>
                                <div className={cn(
                                   "text-4xl font-black mb-8 text-center tracking-tighter leading-none relative z-10 uppercase font-display",
                                   profile.companyAnalysis.finalVerdict?.status === 'Strong Investment Opportunity' ? "text-emerald-400" :
                                   profile.companyAnalysis.finalVerdict?.status === 'Moderate Potential' ? "text-brand-accent" :
                                   "text-rose-400"
                                )}>
                                   {profile.companyAnalysis.finalVerdict?.status || 'Calculating...'}
                                </div>
                                <p className="text-xs font-bold text-brand-text-muted text-center leading-relaxed max-w-sm mx-auto relative z-10 italic">
                                    "{profile.companyAnalysis.finalVerdict?.description || (typeof profile.companyAnalysis.finalVerdict === 'string' ? profile.companyAnalysis.finalVerdict : 'Venture summary pending logical processing...')}"
                                </p>
                             </section>

                              {/* Risk Matrix Teaser / Integration */}
                              <section className="bg-brand-section p-12 rounded-[4rem] border border-white/5 shadow-huge relative overflow-hidden group">
                                <div className="space-y-4 mb-10">
                                  <div className="flex items-center gap-4">
                                     <ShieldAlert className="text-brand-coral shadow-glow" size={28} />
                                     <h3 className="text-4xl font-black text-brand-text-primary font-display uppercase tracking-tight">Risk Exposure Matrix</h3>
                                  </div>
                                  <p className="text-sm text-brand-text-muted font-medium opacity-60">Critical identification of execution bottlenecks and latent market threats.</p>
                                </div>
                                
                                {isPremium ? (
                                  <RiskHeatmap risks={profile.companyAnalysis.riskMatrix || profile.companyAnalysis.risks} />
                                ) : (
                                  <div className="relative h-64 flex flex-col items-center justify-center p-8 bg-brand-bg/50 rounded-[3rem] border border-dashed border-white/10 overflow-hidden">
                                    <div className="absolute inset-0 backdrop-blur-md bg-brand-bg/20 z-0 rounded-[3rem]" />
                                    <div className="relative z-10 text-center">
                                      <Zap className="mx-auto text-brand-accent mb-4" size={32} />
                                      <h5 className="text-sm font-black text-brand-text-primary uppercase tracking-widest mb-2">Premium Risk Exposure</h5>
                                      <p className="text-sm text-brand-text-muted font-medium mb-6">Upgrade to visualize high-fidelity risk heatmaps.</p>
                                      <Link to="/premium" className="text-xs font-black text-brand-accent uppercase tracking-widest hover:underline">Explore Premium Protocols</Link>
                                    </div>
                                  </div>
                                )}
                              </section>
                          </div>
                       </div>

                        {/* Venture Strategy Dashboard Component */}
                        <section className="bg-brand-section p-16 rounded-[4.5rem] border border-white/5 shadow-huge relative overflow-hidden mb-12">
                          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                              <div className="space-y-4">
                                 <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-8 bg-brand-cyan shadow-glow rounded-full" />
                                    <h3 className="text-4xl font-black text-brand-text-primary font-display uppercase tracking-tight">Strategic Execution Map</h3>
                                 </div>
                                 <p className="text-sm text-brand-text-muted font-medium opacity-60">High-fidelity autonomous growth sequencing Protocol.</p>
                              </div>
                             <div className="shrink-0">
                                <div className="px-6 py-3 bg-brand-card border border-brand-border/20 rounded-2xl flex items-center gap-3">
                                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                   <span className="text-xs font-black text-brand-text-primary uppercase tracking-widest">Active Plan Mode</span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             {[
                                { id: 'immediate', label: 'Immediate Execution', color: 'text-brand-accent' },
                                { id: 'shortTerm', label: 'Short-Term Velocity', color: 'text-amber-400' },
                                { id: 'growthPhase', label: 'Scale Up Operations', color: 'text-emerald-400' },
                                { id: 'investorReadinessPlan', label: 'Capitalization Strategy', color: 'text-purple-400' }
                             ].map((step) => (
                                <motion.div 
                                   key={step.id}
                                   whileHover={{ y: -5 }}
                                   className="p-8 bg-brand-card/30 border border-brand-border/10 rounded-[24px] group"
                                >
                                   <div className={cn("text-base font-black uppercase tracking-[0.3em] mb-4", step.color)}>
                                      {step.label}
                                   </div>
                                   <div className="text-sm font-medium text-brand-text-muted leading-relaxed group-hover:text-brand-text-primary transition-colors">
                                      {((profile.companyAnalysis.businessPlan as any)?.[step.id] || '').split('\n').filter(Boolean).map((line: string, lIdx: number) => (
                                        <div key={lIdx} className="flex gap-3">
                                          <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", step.color.replace('text-', 'bg-'))} />
                                          <p className="text-sm font-medium text-brand-text-muted leading-relaxed group-hover:text-brand-text-primary transition-colors">
                                            {line.replace(/^[•\-\d.\s]+/, '').trim()}
                                          </p>
                                        </div>
                                      ))}
                                      {!((profile.companyAnalysis.businessPlan as any)?.[step.id]) && (
                                        <p className="text-sm font-medium text-brand-text-muted leading-relaxed group-hover:text-brand-text-primary transition-colors">
                                          Strategy data pending analysis...
                                        </p>
                                      )}
                                   </div>
                                </motion.div>
                             ))}
                          </div>
                       </section>

                        {/* Institutional Matchmaking Component */}
                        {isPremium && (profile.companyAnalysis.riskMatrix || profile.companyAnalysis.risks) && (
                          <section className="bg-brand-section p-16 rounded-[4.5rem] border border-white/5 shadow-huge relative overflow-hidden mb-12">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
                               <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                     <div className="w-1.5 h-8 bg-brand-coral shadow-glow rounded-full" />
                                     <h3 className="text-4xl font-black text-brand-text-primary font-display uppercase tracking-tight">Venture Risk Ecosystem</h3>
                                  </div>
                                  <p className="text-sm text-brand-text-muted font-medium opacity-60">Multi-dimensional risk mapping and systemic exposure analysis.</p>
                               </div>
                            </div>
                            <RiskEcosystemMap risks={profile.companyAnalysis.riskMatrix || profile.companyAnalysis.risks} />
                          </section>
                        )}

                        {/* Institutional Matchmaking Component */}
                        <section className="bg-brand-section p-16 rounded-[4.5rem] border border-white/5 shadow-huge relative overflow-hidden mb-12">
                           <div className="absolute top-0 right-0 w-80 h-80 bg-[brand-accent]/5 blur-[100px] rounded-full pointer-events-none" />
                           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
                              <div className="space-y-4">
                                 <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-8 bg-brand-accent shadow-glow rounded-full" />
                                    <h3 className="text-4xl font-black text-brand-text-primary font-display uppercase tracking-tight">Institutional Matchmaking</h3>
                                 </div>
                                 <p className="text-sm text-brand-text-muted font-medium opacity-60">High-fidelity smart matching system optimized for the global venture ecosystem.</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="px-4 py-2 bg-brand-card border border-brand-border/20 rounded-xl text-xs font-black text-brand-text-muted uppercase tracking-widest shadow-lg">
                                    Target Region: <span className="text-brand-accent">{profile.location || 'GCC / Global'}</span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                              {(['Angel', 'VC', 'Accelerator'] as const).map((group) => (
                                 <div key={group} className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6 bg-brand-card/40 p-4 rounded-2xl border border-brand-border/10">
                                       <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center text-brand-text-primary shadow-lg shadow-brand-accent/20">
                                          {group === 'Angel' ? <Users size={20} /> : group === 'VC' ? <Briefcase size={20} /> : <Rocket size={20} />}
                                       </div>
                                       <div>
                                          <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-widest leading-none mb-1">{group}s</h4>
                                          <p className="text-sm font-bold text-brand-text-muted uppercase tracking-widest opacity-60">High Match Group</p>
                                       </div>
                                    </div>
                                    <div className="space-y-6">
                                       {profile.companyAnalysis.investors
                                         ?.filter(i => i.type === group)
                                         .map((investor, idx) => (
                                          <motion.div 
                                            key={idx} 
                                            whileHover={{ y: -5, backgroundColor: '#2A4558' }}
                                            className="p-6 rounded-[22px] bg-brand-card border border-brand-border/20 group transition-all duration-300 relative overflow-hidden shadow-lg hover:shadow-brand-accent/10"
                                          >
                                             <div className="absolute top-0 right-0 p-4">
                                                <div className="px-2 py-1 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-xs font-black rounded-lg shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                                   {investor.matchScore || '88'}% Match
                                                </div>
                                             </div>

                                             <h5 className="text-xs font-black text-brand-text-primary mb-1 leading-tight">{investor.name}</h5>
                                             <p className="text-xs font-black text-brand-accent uppercase tracking-[0.2em] mb-4">{investor.stage}</p>
                                             
                                             <div className="space-y-3 mb-6">
                                                <div className="flex items-center justify-between text-xs font-bold">
                                                   <span className="text-brand-text-muted uppercase tracking-widest">Focus</span>
                                                   <span className="text-brand-text-primary text-right max-w-[120px] truncate font-black" title={investor.focus}>{investor.focus}</span>
                                                </div>
                                             </div>
 
                                             <div className="p-4 bg-brand-section rounded-2xl border border-brand-border/20 group-hover:border-brand-accent/30 transition-colors mb-3">
                                                <p className="text-xs font-black uppercase text-brand-accent mb-2 tracking-widest">Why This Match?</p>
                                                <p className="text-sm text-brand-text-muted leading-relaxed font-medium">
                                                   {investor.whyFit}
                                                </p>
                                             </div>
 
                                             <div className="p-4 bg-brand-section rounded-2xl border border-brand-border/20 transition-colors border-dashed">
                                                <p className="text-xs font-black uppercase text-emerald-400 mb-2 tracking-widest">Suggested Pitch Angle</p>
                                                <p className="text-sm text-brand-text-muted leading-relaxed italic font-medium">
                                                   {investor.suggestedPitch}
                                                </p>
                                             </div>
                                          </motion.div>
                                       ))}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </section>

                        {/* Pitch Deck Architect CTA */}
                        <section className="bg-brand-section p-16 rounded-[4.5rem] border border-white/5 shadow-huge relative overflow-hidden no-print mb-12 group cursor-pointer" onClick={() => navigate('/pitch-deck')}>
                          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent/5 blur-[140px] rounded-full pointer-events-none group-hover:bg-brand-accent/10 transition-all duration-1000" />
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand-accent/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                          
                          <div className="relative z-10">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                                <div>
                                   <div className="flex items-center gap-4 mb-4">
                                      <div className="w-14 h-14 bg-brand-accent rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-accent/30 group-hover:scale-110 transition-transform duration-500">
                                         <Presentation className="text-brand-bg uppercase" size={28} />
                                      </div>
                                      <div>
                                         <h3 className="text-4xl font-black text-brand-text-primary font-display uppercase tracking-tight">Pitch Deck Architect</h3>
                                         <p className="text-xs font-black text-brand-accent uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Zap size={10} fill="currentColor" /> Premium Protocol Active
                                         </p>
                                      </div>
                                   </div>
                                   <p className="text-brand-text-muted max-w-xl font-medium leading-relaxed italic opacity-80">
                                      "The definitive venture storytelling operating system. Transform your strategic thesis into a cinematic, investor-ready deck."
                                   </p>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                   <Link 
                                      to="/pitch-deck"
                                      className="px-10 py-5 bg-brand-accent text-brand-bg font-black rounded-2xl shadow-2xl shadow-brand-accent/30 transition-all active:scale-95 flex items-center gap-3 text-xs uppercase tracking-[0.2em] relative overflow-hidden group-hover:opacity-100 opacity-90"
                                   >
                                      Launch Architect <ArrowRight size={18} />
                                   </Link>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 opacity-40 group-hover:opacity-100 transition-all duration-1000">
                                {['Cover', 'Problem', 'Solution', 'Market', 'Product', 'Model', 'Traction', 'GTM', 'Tech', 'Team', 'Finance', 'Ask'].map((title, idx) => (
                                      <div
                                         key={title}
                                         className="relative p-4 rounded-xl border border-white/5 bg-brand-card/30 flex flex-col justify-between aspect-video"
                                      >
                                         <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">0{idx + 1}</span>
                                         <h5 className="text-sm font-black text-white/40 uppercase tracking-widest">{title}</h5>
                                      </div>
                                ))}
                             </div>
                          </div>
                        </section>
                     </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                       {/* Team Section */}
                       <section className="bg-brand-section p-10 rounded-[3rem] border border-brand-border/10 shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[100px] rounded-full pointer-events-none" />
                          <h3 className="text-sm font-black text-brand-text-primary mb-8 uppercase tracking-tight flex items-center gap-3">
                             <Users className="text-brand-accent" size={24} /> Leadership & Team
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {profile?.teamStructure && profile.teamStructure.length > 0 ? (
                               profile.teamStructure.map((member) => (
                                 <motion.div 
                                   key={member.id}
                                   whileHover={{ y: -5 }}
                                   className="p-6 bg-brand-card border border-brand-border/20 rounded-3xl hover:border-brand-accent transition-all group"
                                 >
                                   <div className="flex justify-between items-start mb-4">
                                     <div>
                                       <h4 className="text-xs font-bold text-brand-text-primary group-hover:text-brand-accent transition-colors">
                                         {member.name || 'Unnamed Member'}
                                       </h4>
                                       <div className="flex items-center gap-2 mt-1">
                                         <span className="px-2 py-0.5 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-base font-black uppercase tracking-widest rounded-lg">
                                           {member.role}
                                         </span>
                                         <span className="text-xs font-bold text-brand-text-secondary">
                                           {member.experience} Yrs Exp
                                         </span>
                                       </div>
                                     </div>
                                     {member.linkedin && (
                                       <a 
                                         href={member.linkedin.startsWith('http') ? member.linkedin : `https://${member.linkedin}`}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         className="p-2 bg-brand-bg rounded-lg text-brand-text-secondary hover:text-[#0077b5] transition-colors"
                                       >
                                         <Linkedin size={16} />
                                       </a>
                                     )}
                                   </div>
                                   
                                   <div className="flex flex-wrap gap-1 mb-4">
                                     {member.specialty.map(s => (
                                       <span key={s} className="px-2 py-0.5 bg-white/5 border border-white/10 text-brand-text-primary/50 text-[8px] font-bold rounded uppercase">
                                         {s}
                                       </span>
                                     ))}
                                   </div>
                                   
                                   <p className="text-sm text-brand-text-secondary leading-relaxed line-clamp-3">
                                     {member.background}
                                   </p>
                                 </motion.div>
                               ))
                             ) : (
                               <div className="md:col-span-2 p-8 border border-dashed border-brand-border/20 rounded-3xl text-center">
                                 <p className="text-brand-text-secondary text-sm italic">No team members added to profile.</p>
                                 {isEditing === false && isPremium && (
                                   <button 
                                     onClick={() => setIsEditing(true)}
                                     className="mt-4 text-brand-accent font-black text-xs uppercase"
                                   >
                                     + Build Team Profile
                                   </button>
                                 )}
                               </div>
                             )}
                          </div>

                          {profile?.founderInfo && (
                            <div className="mt-8 pt-8 border-t border-brand-border/10">
                              <h4 className="text-xs font-black text-brand-accent uppercase tracking-widest mb-4">Founder DNA</h4>
                              <p className="text-sm text-brand-text-secondary leading-relaxed">
                                {profile.founderInfo}
                              </p>
                            </div>
                          )}
                       </section>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-8">
                       <section className="bg-gradient-to-br from-brand-section to-brand-card text-brand-text-primary p-10 rounded-[3rem] shadow-2xl relative overflow-hidden border border-brand-border/20">
                          <div className="relative z-10">
                             <h3 className="text-sm font-black mb-8 uppercase tracking-tight">Venture Logic</h3>
                             <div className="space-y-8">
                                <div className="flex justify-between items-end border-b border-brand-border/20 pb-4">
                                   <div>
                                      <p className="text-xs font-black uppercase text-brand-accent mb-1">Architecture</p>
                                      <p className="font-black text-sm text-brand-text-primary">{profile?.businessType || 'N/A'}</p>
                                   </div>
                                   <div className="px-2 py-1 bg-[brand-accent]/20 border border-[brand-accent]/30 text-brand-accent text-[8px] font-black rounded uppercase">Validated</div>
                                </div>
                                <div className="flex justify-between items-end border-b border-brand-border/20 pb-4">
                                   <div>
                                      <p className="text-xs font-black uppercase text-brand-accent mb-1">Category</p>
                                      <p className="font-black text-sm text-brand-text-primary">{profile?.productType || 'N/A'}</p>
                                   </div>
                                </div>
                                <div className="flex justify-between items-end">
                                   <div>
                                      <p className="text-xs font-black uppercase text-emerald-400 mb-1">Status</p>
                                      <p className="font-black text-sm text-brand-text-primary">
                                         {isPremium ? 'VERIFIED' : 'CORE ANALYTICS'}
                                      </p>
                                   </div>
                                   <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                   </div>
                                </div>
                             </div>
                          </div>
                          <div className="absolute top-0 right-0 p-6 opacity-10">
                             <Shield size={64} />
                          </div>
                       </section>

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDeck && profile?.pitchDeck && (
          <>
            {/* Print Only: All slides rendered sequentially */}
            <div className="hidden print:block space-y-0 bg-white">
               {profile.pitchDeck.slides.map((slide, sIdx) => {
                  const printBgUrl = slide.imageKeywords 
                    ? `https://images.unsplash.com/photo-1?auto=format&fit=crop&q=80&w=1200&h=800&keywords=${encodeURIComponent(slide.imageKeywords)}`
                    : `https://picsum.photos/seed/${sIdx}/1200/800`;
                    
                  return (
                    <div key={slide.id} className="h-screen w-screen break-after-page relative overflow-hidden flex flex-col justify-center p-20">
                       {/* Background for print */}
                       <div className="absolute inset-0 z-0">
                          <img 
                            src={printBgUrl}
                            className="w-full h-full object-cover opacity-10 grayscale"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/80 to-transparent" />
                       </div>

                       <div className="relative z-10">
                          {sIdx === 0 && (
                             <div className="mb-10">
                                <div className="w-32 h-32 bg-white rounded-3xl shadow-xl flex items-center justify-center overflow-hidden border-2 border-neutral-100">
                                   {profile.companyLogo ? (
                                      <img src={profile.companyLogo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                   ) : (
                                      <div className="text-primary-600 font-black text-5xl">
                                         {profile.companyName?.charAt(0).toUpperCase()}
                                      </div>
                                   )}
                                </div>
                             </div>
                          )}
                          <div className="flex items-center gap-6 mb-12">
                             <span 
                               className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl border-2"
                               style={{
                                 borderColor: slide.colorAccent || '#3b82f6',
                                 color: slide.colorAccent || '#3b82f6',
                                 background: `${slide.colorAccent || '#3b82f6'}10`
                               }}
                             >
                                {sIdx + 1}
                             </span>
                             <h2 className="text-6xl font-black text-neutral-900 tracking-widest uppercase">
                                {slide.title}
                             </h2>
                          </div>

                          <div className="grid grid-cols-2 gap-16">
                             <div className="space-y-10">
                                <p className="text-2xl text-neutral-600 font-medium leading-relaxed border-l-4 border-neutral-100 pl-6 italic">
                                   {slide.content}
                                </p>
                                <ul className="space-y-6">
                                   {slide.points.map((point, pIdx) => (
                                      <li key={pIdx} className="flex gap-4 text-sm font-bold text-neutral-800">
                                         <div 
                                           className="mt-2.5 w-3 h-3 rounded-full shrink-0" 
                                           style={{ backgroundColor: slide.colorAccent || '#3b82f6' }}
                                         />
                                         {point}
                                      </li>
                                   ))}
                                </ul>
                                {slide.metric && (
                                   <div 
                                      className="mt-12 p-10 rounded-[2.5rem] border inline-block min-w-[340px]"
                                      style={{
                                        color: slide.colorAccent || '#3b82f6',
                                        backgroundColor: `${slide.colorAccent || '#3b82f6'}10`,
                                        borderColor: `${slide.colorAccent || '#3b82f6'}30`
                                      }}
                                   >
                                      <p className="text-xs font-black uppercase mb-3 tracking-[0.3em] opacity-70">Strategic Proof Point</p>
                                      <div className="flex items-baseline gap-3">
                                         <span className="text-5xl font-black text-neutral-900">
                                            {slide.metric.value}
                                         </span>
                                         <span className="text-xs font-black opacity-60">
                                            {slide.metric.label}
                                         </span>
                                      </div>
                                   </div>
                                )}
                             </div>
                             <div className="bg-neutral-50 p-12 rounded-[3.5rem] border-4 border-dashed border-neutral-200 flex flex-col justify-center items-center text-center relative overflow-hidden">
                                <img 
                                   src={`https://images.unsplash.com/photo-1?auto=format&fit=crop&q=80&w=600&h=400&keywords=${encodeURIComponent(slide.imageKeywords || 'modern business')}`}
                                   className="absolute inset-0 w-full h-full object-cover opacity-10"
                                   referrerPolicy="no-referrer"
                                />
                                <div className="relative z-10">
                                   <p className="text-xs font-black uppercase text-neutral-400 mb-4 tracking-[0.2em]">Visual Recommendation</p>
                                   <p className="text-neutral-600 text-sm font-medium leading-relaxed max-w-sm">
                                      "{slide.visualSuggestion}"
                                   </p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  );
               })}
            </div>

            <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg/95 backdrop-blur-xl p-4 md:p-10"
          >
            <button 
              onClick={() => setShowDeck(false)}
              className="absolute top-8 right-8 text-brand-text-primary/40 hover:text-brand-text-primary transition-colors no-print"
            >
              <X size={40} />
            </button>

            <div className="w-full max-w-7xl aspect-video bg-white rounded-[3.5rem] overflow-hidden shadow-2xl relative flex flex-col border border-brand-accent/10">
               <div className="flex-1 flex overflow-hidden relative">
                    {/* Posh Backdrop Image */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <motion.img 
                        key={bgImageUrl}
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.15 }}
                        src={bgImageUrl}
                        className="w-full h-full object-cover grayscale"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-white via-white/40 to-transparent" />
                    </div>

                    <motion.div 
                      key={currentSlide}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex-1 p-12 md:p-20 overflow-y-auto print:p-8 z-10"
                    >
                       {currentSlide === 0 && (
                          <div className="mb-12 flex justify-center lg:justify-start">
                             <div className="w-28 h-28 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center overflow-hidden border border-neutral-100 p-2">
                                {profile.companyLogo ? (
                                   <img src={profile.companyLogo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                   <div className="text-brand-accent font-black text-5xl font-display">
                                      {profile.companyName?.charAt(0).toUpperCase()}
                                   </div>
                                )}
                             </div>
                          </div>
                       )}
                       <div className="flex items-center gap-8 mb-16">
                        <span 
                          className="w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-3xl border-2 shadow-sm"
                          style={{
                            borderColor: currentSlideData?.colorAccent || '#5DA9FF',
                            color: currentSlideData?.colorAccent || '#5DA9FF',
                            background: `${currentSlideData?.colorAccent || '#5DA9FF'}10`
                          }}
                        >
                           {currentSlide + 1}
                        </span>
                        <div>
                          <h2 className="text-5xl md:text-6xl font-black text-neutral-950 tracking-tighter uppercase font-display">
                             {currentSlideData?.title}
                          </h2>
                          <div 
                            className="h-2 w-32 mt-4 rounded-full" 
                            style={{ backgroundColor: currentSlideData?.colorAccent || '#5DA9FF' }}
                          />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
                        <div className="space-y-12">
                           <textarea
                             className="w-full text-2xl text-neutral-600 font-medium leading-relaxed border-l-4 border-neutral-100 pl-8 italic bg-transparent focus:outline-none focus:border-brand-accent transition-all resize-none min-h-[140px] placeholder:text-neutral-300"
                             value={currentSlideData?.content}
                             placeholder="Slide narrative/brief description..."
                             onChange={(e) => {
                               const newSlides = [...profile.pitchDeck!.slides];
                               newSlides[currentSlide].content = e.target.value;
                               updateDoc(doc(db, 'profiles', user.uid), { 'pitchDeck.slides': newSlides });
                             }}
                           />
                           <ul className="space-y-6">
                              {currentSlideData?.points.map((point, idx) => (
                                 <li key={idx} className="flex gap-4 items-center group">
                                    <div 
                                      className="w-3 h-3 rounded-full shrink-0 group-hover:scale-125 transition-transform" 
                                      style={{ backgroundColor: currentSlideData?.colorAccent || '#5DA9FF' }}
                                    />
                                    <input 
                                       className="bg-transparent border-none focus:outline-none w-full text-sm font-bold text-neutral-900 placeholder:text-neutral-300"
                                       value={point}
                                       placeholder="Bullet point (6-10 words)..."
                                       onChange={(e) => {
                                         const newSlides = [...profile.pitchDeck!.slides];
                                         newSlides[currentSlide].points[idx] = e.target.value;
                                         updateDoc(doc(db, 'profiles', user.uid), { 'pitchDeck.slides': newSlides });
                                       }}
                                    />
                                 </li>
                              ))}
                           </ul>
                           
                           {currentSlideData?.metric && (
                              <div 
                                className="mt-16 p-12 rounded-[3.5rem] border inline-block min-w-[380px] shadow-sm bg-white"
                                style={MetricTheme(currentSlideData)}
                              >
                                 <p className="text-xs font-black uppercase mb-4 tracking-[0.4em] opacity-70">Strategic Proof Point</p>
                                 <div className="flex items-baseline gap-4">
                                    <span className="text-6xl font-black text-neutral-950">
                                       {currentSlideData.metric.value}
                                    </span>
                                    <span className="text-sm font-black opacity-60">
                                       {currentSlideData.metric.label}
                                    </span>
                                 </div>
                              </div>
                           )}
                        </div>
                        <div className="space-y-12">
                           <div className="bg-neutral-50 p-12 rounded-[4rem] border-4 border-dashed border-neutral-100 flex flex-col justify-center items-center text-center min-h-[450px] group transition-all hover:bg-neutral-100 relative overflow-hidden shadow-inner">
                              <img 
                                src={`https://images.unsplash.com/photo-1?auto=format&fit=crop&q=80&w=800&h=600&keywords=${encodeURIComponent(currentSlideData?.imageKeywords || 'business technology')}`}
                                className="absolute inset-0 w-full h-full object-cover opacity-5 group-hover:opacity-10 transition-opacity"
                                referrerPolicy="no-referrer"
                              />
                              <div className="w-24 h-24 bg-white rounded-4xl shadow-xl flex items-center justify-center mb-10 border border-neutral-100 relative z-10 group-hover:scale-110 transition-transform">
                                <ImageIcon size={40} className="text-brand-accent" />
                              </div>
                              <div className="relative z-10 p-6 bg-white/50 backdrop-blur-md rounded-3xl border border-white/20">
                                <p className="text-xs font-black uppercase text-neutral-400 mb-6 tracking-[0.3em]">Design Asset Direction</p>
                                <p className="text-neutral-900 text-2xl font-black leading-tight max-w-sm">
                                   "{currentSlideData?.visualSuggestion}"
                                </p>
                              </div>
                           </div>
                           
                           <div className="bg-brand-accent/5 text-brand-accent p-10 rounded-[2.5rem] flex items-start gap-6 border border-brand-accent/10 shadow-sm">
                              <Shield size={32} className="shrink-0 mt-1" />
                              <div>
                                <p className="text-xs font-black uppercase text-brand-accent/60 mb-3 tracking-[0.25em]">Strategic Guardrail</p>
                                <p className="text-xs font-bold text-neutral-900 leading-relaxed">
                                   Professional Tip: This slide is designed to address {currentSlideData?.title.toLowerCase()} in under 15 seconds. Keep your verbal pitch data-dense but simple.
                                </p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </motion.div>

               </div>

               <div className="p-10 border-t border-neutral-100 flex items-center justify-between bg-white no-print">
                  <div className="flex gap-4">
                     <button 
                        onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                        disabled={currentSlide === 0}
                        className="w-16 h-16 rounded-[2rem] border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-30 transition-all font-bold text-neutral-400 hover:text-brand-accent active:scale-90 shadow-sm"
                     >
                        <ChevronLeft size={32} />
                     </button>
                     <button 
                        onClick={() => setCurrentSlide(prev => Math.min(profile.pitchDeck!.slides.length - 1, prev + 1))}
                        disabled={currentSlide === profile.pitchDeck.slides.length - 1}
                        className="w-16 h-16 rounded-[2rem] border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 disabled:opacity-30 transition-all font-bold text-neutral-400 hover:text-brand-accent active:scale-90 shadow-sm"
                     >
                        <ChevronRight size={32} />
                     </button>
                  </div>
                  
                  <div className="hidden md:flex flex-col items-center">
                    <div className="text-xs font-black text-neutral-400 tracking-[0.5em] uppercase mb-3">
                       Slide {currentSlide + 1} of {profile.pitchDeck.slides.length}
                    </div>
                    <div className="flex gap-1.5">
                      {profile.pitchDeck.slides.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "h-2 transition-all rounded-full",
                            idx === currentSlide ? "w-10 bg-brand-accent" : "w-2.5 bg-neutral-100"
                          )} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                     <div className="hidden lg:block text-right">
                        <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">Asset Portability</p>
                        <p className="text-xs text-neutral-500 font-medium">Export optimized for 16:9 PDF format.</p>
                     </div>
                     <button 
                       onClick={handleExportDeck}
                       className="px-10 py-4 bg-brand-accent text-brand-text-primary rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-accent/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                     >
                        <Download size={20} /> Export Files
                     </button>
                  </div>
               </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </div>
  );
}
