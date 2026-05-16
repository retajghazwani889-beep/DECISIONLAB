import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Presentation, 
  Lock, 
  ChevronLeft, 
  Zap, 
  Download, 
  Share2, 
  Trash2, 
  Copy,
  ChevronRight,
  PlusCircle,
  Wand2,
  Settings,
  Layout,
  Palette,
  Eye,
  FileText,
  Loader2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  FileType,
  Image as ImageIcon,
  CheckCircle2,
  Maximize2,
  X,
  Rocket
} from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PitchDeck, PitchDeckSlide, PitchDeckTemplate } from '../types';
import { generatePitchDeck } from '../services/geminiService';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { PitchDeckSlide as SlidePreview } from '../components/PitchDeckSlides';
import { TldrawEditor } from '../components/TldrawEditor';
import { deriveElementsFromLayout } from '../lib/slideEngine';
import { AnalysisReport } from '../types';
import { exportToPPTX, exportToPDF } from '../lib/presentationUtils';
import PresentationMode from '../components/PresentationMode';

const TEMPLATES: { id: PitchDeckTemplate; name: string; desc: string; image: string }[] = [
  { 
    id: 'Institutional VC', 
    name: 'Institutional VC', 
    desc: 'Deep trust, rigorous structure, and sharp data focus.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop'
  },
  { 
    id: 'Executive Corporate', 
    name: 'Executive Corporate', 
    desc: 'Authoritative, polished, and board-ready.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=400&auto=format&fit=crop'
  },
  { 
    id: 'Modern SaaS', 
    name: 'Modern SaaS', 
    desc: 'Clean, approachable, and optimized for growth metrics.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop'
  },
  { 
    id: 'Minimal Dark', 
    name: 'Minimal Dark', 
    desc: 'Cinematic, high-contrast, and focused on storytelling.',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'Founder Narrative',
    name: 'Founder Narrative',
    desc: 'Charismatic mission-driven storytelling with warm visuals.',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'Fintech Editorial',
    name: 'Fintech Editorial',
    desc: 'Boutique, elegant, and sophisticated analytical style.',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'Clean White Investor',
    name: 'Clean White Investor',
    desc: 'Minimalist, essentialist, precision-engineered clarity.',
    image: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'Classic Pitch',
    name: 'Classic Pitch',
    desc: 'High-energy startup energy with bold accents.',
    image: 'https://images.unsplash.com/photo-1553484771-02834cd123bc?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'Gradient Modern',
    name: 'Gradient Modern',
    desc: 'Dynamic tech-forward theme with fluid visuals.',
    image: 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'Bold Presentation',
    name: 'Bold Presentation',
    desc: 'High-impact brutalist design for maximum recall.',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'Elegant Editorial',
    name: 'Elegant Editorial',
    desc: 'Luxurious refined typography and spacious layouts.',
    image: 'https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?q=80&w=400&auto=format&fit=crop'
  }
];

export default function PitchDeckArchitectPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<PitchDeck | null>(profile?.pitchDeck || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PitchDeckTemplate>(deck?.template || 'Institutional VC');
  const [analyses, setAnalyses] = useState<AnalysisReport[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(deck?.linkedAnalysisId || null);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'pptx' | null>(null);

  // Initialize Elements if not exists
  useEffect(() => {
    if (deck?.slides[activeSlideIndex]) {
      const slide = deck.slides[activeSlideIndex];
      // Only auto-derive if elements array is completely missing or empty
      if (!slide.elements || slide.elements.length === 0) {
        const derived = deriveElementsFromLayout(slide, deck.template);
        updateSlide(activeSlideIndex, { elements: derived });
      }
    }
  }, [activeSlideIndex, deck?.slides]);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user) return;
      setIsLoadingAnalyses(true);
      try {
        const q = query(
          collection(db, 'analyses'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalysisReport));
        setAnalyses(data);
        if (data.length > 0 && !selectedAnalysisId) {
          setSelectedAnalysisId(data[0].id);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'analyses');
      } finally {
        setIsLoadingAnalyses(false);
      }
    };

    fetchAnalyses();
  }, [user]);

  const isPremium = profile?.subscriptionStatus === 'premium' || user?.email === 'retajghazwani889@gmail.com';

  const persistDeck = async (updatedDeck: PitchDeck) => {
    const path = `profiles/${user?.uid}`;
    try {
      await updateDoc(doc(db, path), {
        pitchDeck: updatedDeck,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleGenerate = async () => {
    if (!isPremium) return;
    if (!profile) return;
    
    setIsGenerating(true);
    try {
      const targetAnalysis = analyses.find(a => a.id === selectedAnalysisId);
      const generated = await generatePitchDeck(targetAnalysis?.startupProfile ? { 
        ...profile, 
        companyName: targetAnalysis.startupProfile.companyName,
        companyDescription: targetAnalysis.startupProfile.businessDescription,
        industry: targetAnalysis.startupProfile.industry,
        startupStage: targetAnalysis.startupProfile.stage,
        businessType: targetAnalysis.startupProfile.businessType,
        productType: targetAnalysis.startupProfile.productType,
        template: selectedTemplate
      } : { ...profile, template: selectedTemplate });

      const newDeck: PitchDeck = {
        id: crypto.randomUUID(),
        userId: user.uid,
        linkedAnalysisId: selectedAnalysisId || undefined,
        projectName: targetAnalysis?.startupProfile?.companyName || profile.companyName || profile.startupName || 'New Project',
        slides: generated.slides,
        template: selectedTemplate,
        theme: {
          primaryColor: '#5DA9FF',
          secondaryColor: '#102434',
          fontFamily: 'Inter',
          mode: 'dark'
        },
        generatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await persistDeck(newDeck);
      setDeck(newDeck);
      await refreshProfile();
    } catch (error) {
      console.error("Deck Generation Failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateSlide = async (index: number, updates: Partial<PitchDeckSlide>) => {
    if (!deck) return;
    const newSlides = [...deck.slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    const newDeck = { ...deck, slides: newSlides, updatedAt: serverTimestamp() };
    setDeck(newDeck);
    persistDeck(newDeck);
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    if (!deck) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= deck.slides.length) return;
    
    const newSlides = [...deck.slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    const newDeck = { ...deck, slides: newSlides, updatedAt: serverTimestamp() };
    setDeck(newDeck);
    setActiveSlideIndex(newIndex);
    persistDeck(newDeck);
  };

  const duplicateSlide = (index: number) => {
    if (!deck) return;
    const newSlides = [...deck.slides];
    const duplicated = { ...newSlides[index], id: crypto.randomUUID() };
    newSlides.splice(index + 1, 0, duplicated);
    const newDeck = { ...deck, slides: newSlides, updatedAt: serverTimestamp() };
    setDeck(newDeck);
    setActiveSlideIndex(index + 1);
    persistDeck(newDeck);
  };

  const removeSlide = (index: number) => {
    if (!deck || deck.slides.length <= 1) return;
    const newSlides = deck.slides.filter((_, i) => i !== index);
    const newDeck = { ...deck, slides: newSlides, updatedAt: serverTimestamp() };
    setDeck(newDeck);
    setActiveSlideIndex(Math.max(0, index - 1));
    persistDeck(newDeck);
  };

  const updateTheme = (template: PitchDeckTemplate) => {
    if (!deck) return;
    setSelectedTemplate(template);
    const newDeck = { ...deck, template, updatedAt: serverTimestamp() };
    setDeck(newDeck);
    persistDeck(newDeck);
  };

  const handleExport = async (type: 'pdf' | 'pptx') => {
    if (!deck) return;
    setExporting(type);
    try {
      if (type === 'pptx') {
        await exportToPPTX(deck, profile?.companyName || 'DecisionLab');
      } else {
        await exportToPDF('deck-container', deck.projectName);
      }
    } finally {
      setExporting(null);
    }
  };

  if (!user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-[#08131D] text-white">
      {/* Navbar for Editor */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#102434]/80 backdrop-blur-xl border-b border-white/5 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white">
            <ChevronLeft size={20} />
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <Presentation className="w-5 h-5 text-brand-accent" />
            <h1 className="text-sm font-black uppercase tracking-[0.2em]">{deck?.projectName || 'Pitch Deck Architect'}</h1>
            {isPremium && <span className="px-2 py-0.5 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-xs font-black text-brand-accent uppercase tracking-widest">Premium Workspace</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {deck && (
            <>
              <button 
                onClick={() => setIsPresenting(true)}
                className="px-4 py-2 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
              >
                <Maximize2 size={14} />
                Presentation Mode
              </button>
              
              <div className="h-6 w-px bg-white/10 mx-2" />

              <button 
                disabled={!!exporting}
                onClick={() => handleExport('pptx')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-lg transition-all flex items-center gap-2 group"
              >
                {exporting === 'pptx' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />}
                PPTX
              </button>
              <button 
                disabled={!!exporting}
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-lg transition-all flex items-center gap-2 group"
              >
                {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />}
                PDF
              </button>

              <button 
                 onClick={() => setIsConfiguring(true)}
                 className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-lg transition-all flex items-center gap-2"
              >
                <Settings size={14} />
                Project
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="pt-16 flex h-screen overflow-hidden">
        {/* Left Sidebar: Slide Navigator */}
        <aside className="w-72 bg-[#102434] border-r border-white/5 flex flex-col h-full overflow-hidden">
          {!deck ? (
            <div className="p-8 flex-1 flex flex-col items-center justify-center text-center opacity-40">
              <Sparkles className="w-12 h-12 mb-4 text-brand-accent" />
              <p className="text-xs font-black uppercase tracking-widest mb-2">No Deck Initialized</p>
              <p className="text-xs uppercase tracking-wider leading-relaxed">Select a venture analysis to construct your deck.</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-brand-bg/30">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Canvas Pipeline</span>
                  <span className="text-xs font-bold text-brand-accent">{deck.slides.length} Sequential Slides</span>
                </div>
                <button 
                  onClick={() => {
                    const newSlide: PitchDeckSlide = {
                      id: crypto.randomUUID(),
                      title: "New Strategic Slide",
                      content: "Core message of the slide goes here.",
                      points: ["Insight One", "Insight Two", "Insight Three"],
                      visualSuggestion: "Data visualization placeholder",
                      imageKeywords: "business,tech,strategy",
                      colorAccent: "#5DA9FF",
                      layout: "split",
                      metric: { label: "Performance", value: "85%" }
                    };
                    const newSlides = [...deck.slides];
                    newSlides.splice(activeSlideIndex + 1, 0, newSlide);
                    const newDeck = { ...deck, slides: newSlides, updatedAt: serverTimestamp() };
                    setDeck(newDeck);
                    setActiveSlideIndex(activeSlideIndex + 1);
                    persistDeck(newDeck);
                  }}
                  className="p-2 hover:bg-white/5 rounded-xl text-brand-accent transition-all group"
                  title="Add Slide"
                >
                  <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {deck.slides.map((slide, idx) => (
                  <div key={slide.id} className="relative group/slide">
                    <button
                      onClick={() => {
                        setActiveSlideIndex(idx);
                        setActiveElementId(null);
                      }}
                      className={cn(
                        "w-full text-left transition-all rounded-2xl border p-3 flex gap-4 items-center group",
                        activeSlideIndex === idx 
                          ? "bg-brand-accent/10 border-brand-accent/40 shadow-lg shadow-brand-accent/5" 
                          : "bg-[#163447]/30 border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center text-xs font-black text-white/40 group-hover:text-brand-accent transition-colors">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-black uppercase tracking-widest truncate",
                          activeSlideIndex === idx ? "text-brand-accent" : "text-white/60"
                        )}>
                          {slide.title}
                        </p>
                        <p className="text-sm text-white/20 uppercase tracking-widest font-bold mt-1">
                          {slide.layout} layout
                        </p>
                      </div>
                    </button>
                    
                    {/* Slide Actions Tooltip/Overlay */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/slide:opacity-100 transition-all">
                       <button onClick={() => moveSlide(idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 disabled:hidden">
                          <ArrowUp size={12} />
                       </button>
                       <button onClick={() => moveSlide(idx, 'down')} disabled={idx === deck.slides.length - 1} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 disabled:hidden">
                          <ArrowDown size={12} />
                       </button>
                       <button onClick={() => duplicateSlide(idx)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40">
                          <Copy size={12} />
                       </button>
                       <button onClick={() => removeSlide(idx)} className="p-1.5 hover:bg-white/10 rounded-lg text-brand-coral">
                          <Trash2 size={12} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <div className="p-4 bg-[#0d1e2b] border-t border-white/5">
             <div className="grid grid-cols-2 gap-3 mb-4">
                <button 
                  onClick={() => setIsConfiguring(true)}
                  className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                >
                   <Palette size={18} className="text-brand-accent mb-2 group-hover:scale-110 transition-transform" />
                   <span className="text-xs font-black uppercase tracking-widest text-white/40">Themes</span>
                </button>
                <button 
                   onClick={() => handleGenerate()}
                   disabled={isGenerating}
                   className="flex flex-col items-center justify-center p-4 bg-brand-accent/10 hover:bg-brand-accent/20 rounded-2xl transition-all group border border-brand-accent/20"
                >
                   {isGenerating ? <Loader2 size={18} className="text-brand-accent animate-spin mb-2" /> : <Wand2 size={18} className="text-brand-accent mb-2 group-hover:rotate-12 transition-transform" />}
                   <span className="text-xs font-black uppercase tracking-widest text-brand-accent">Re-Sync</span>
                </button>
             </div>
          </div>
        </aside>

        {/* Main Editor Stage */}
        <main className="flex-1 bg-[#08131D] flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {!deck ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 overflow-y-auto px-12 py-12 flex flex-col items-center"
              >
                <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[80vh]">
                  <div className="w-24 h-24 bg-brand-accent/10 rounded-3xl flex items-center justify-center mb-8 relative">
                     <div className="absolute inset-0 bg-brand-accent/20 blur-2xl rounded-full" />
                     <Presentation className="w-12 h-12 text-brand-accent relative z-10" />
                  </div>
                   <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 text-center">Institutional Pitch Designer</h2>
                  <p className="text-brand-text-secondary text-center max-w-xl mb-16 opacity-60 leading-relaxed font-sans text-xs">
                    Build a cinematic, institutional-grade presentation layer. Select your venture profile and choose a design aesthetic to begin.
                  </p>

                  {/* Project Selector View */}
                  <div className="w-full max-w-3xl space-y-12">
                    <section>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center shadow-lg shadow-brand-accent/20">
                           <FileText size={20} className="text-brand-bg" />
                        </div>
                        <div>
                           <h3 className="text-sm font-black uppercase tracking-tight">Venture Intelligence Source</h3>
                           <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Select the project data to map into slides</p>
                        </div>
                      </div>

                      {isLoadingAnalyses ? (
                        <div className="h-32 flex items-center justify-center bg-brand-section/50 rounded-3xl border border-white/5">
                          <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {analyses.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => setSelectedAnalysisId(a.id)}
                              className={cn(
                                "group flex items-center justify-between p-6 rounded-[2rem] border transition-all relative overflow-hidden",
                                selectedAnalysisId === a.id 
                                  ? "bg-brand-accent/5 border-brand-accent shadow-xl shadow-brand-accent/5" 
                                  : "bg-[#102434] border-white/5 hover:border-white/10"
                              )}
                            >
                              <div className="flex items-center gap-6 relative z-10">
                                <div className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                  selectedAnalysisId === a.id ? "bg-brand-accent text-brand-bg" : "bg-white/5 text-white/20"
                                )}>
                                  <Rocket size={24} />
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-black text-brand-text-primary uppercase tracking-tight">{(a as any).startupProfile?.companyName || 'Untitled Project'}</p>
                                  <p className="text-xs text-brand-text-muted mt-1 uppercase tracking-[0.2em] font-bold">
                                    {a.startupProfile?.industry} • {a.finalVerdict?.status}
                                  </p>
                                </div>
                              </div>
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                selectedAnalysisId === a.id ? "border-brand-accent bg-brand-accent/20" : "border-white/5"
                              )}>
                                {selectedAnalysisId === a.id && <CheckCircle2 size={12} className="text-brand-accent" />}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </section>

                    <section>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                           <Layout size={20} className="text-white" />
                        </div>
                        <div>
                           <h3 className="text-sm font-black uppercase tracking-tight">Design Aesthetic</h3>
                           <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Global typography and color protocol</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {TEMPLATES.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTemplate(t.id)}
                            className={cn(
                              "p-8 rounded-[2.5rem] border text-left transition-all duration-500 group relative overflow-hidden",
                              selectedTemplate === t.id 
                                ? "bg-brand-accent/10 border-brand-accent shadow-xl" 
                                : "bg-[#102434] border-white/5 hover:border-white/20"
                            )}
                          >
                            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                               <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="relative z-10">
                              <h3 className="text-xs font-black uppercase tracking-tight mb-2">{t.name}</h3>
                              <p className="text-xs text-white/40 leading-relaxed max-w-[80%]">{t.desc}</p>
                            </div>
                            {selectedTemplate === t.id && (
                              <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-brand-accent shadow-glow animate-pulse" />
                            )}
                          </button>
                        ))}
                      </div>
                    </section>

                    <div className="pt-12 flex justify-center">
                       {isPremium ? (
                         <button
                           onClick={handleGenerate}
                           disabled={isGenerating || !selectedAnalysisId}
                           className="group relative px-16 py-6 bg-brand-accent text-brand-bg font-black uppercase tracking-[0.4em] text-xs rounded-[3rem] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(93,169,255,0.4)] overflow-hidden flex items-center gap-4"
                         >
                           {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Presentation size={18} />}
                           {isGenerating ? 'Structuring Content...' : 'Build Presentation Architecture'}
                         </button>
                       ) : (
                         <Link 
                           to="/premium"
                           className="px-12 py-5 bg-gradient-to-r from-brand-accent to-purple-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl flex items-center gap-3"
                         >
                           <Lock size={18} /> Unlock Presentation Architect
                         </Link>
                       )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Editor Top Toolbar */}
                <div className="h-14 bg-[#163447]/50 border-b border-white/5 px-6 flex items-center justify-between">
                   <div className="flex items-center gap-8">
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-black uppercase tracking-widest text-white/30">Layout:</span>
                         <div className="flex gap-1">
                            {['split', 'centered', 'grid', 'hero'].map(l => (
                               <button 
                                 key={l}
                                 onClick={() => updateSlide(activeSlideIndex, { layout: l as any })}
                                 className={cn(
                                   "px-3 py-1 rounded-md text-base font-black uppercase tracking-widest transition-all",
                                   deck.slides[activeSlideIndex].layout === l 
                                     ? "bg-brand-accent text-brand-bg" 
                                     : "bg-white/5 text-white/40 hover:bg-white/10"
                                 )}
                               >
                                  {l}
                               </button>
                            ))}
                         </div>
                      </div>
                      <div className="h-4 w-px bg-white/10" />
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-black uppercase tracking-widest text-white/30">Accent:</span>
                         <input 
                           type="color" 
                           value={deck.slides[activeSlideIndex].colorAccent}
                           onChange={(e) => updateSlide(activeSlideIndex, { colorAccent: e.target.value })}
                           className="w-6 h-6 bg-transparent border-none cursor-pointer rounded overflow-hidden"
                         />
                      </div>
                   </div>

                   <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-white/20 italic">Draft saved to institutional vault</span>
                   </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                   {/* Workspace Canvas */}
                   <div className="flex-1 bg-[#08131D] flex flex-col items-center justify-start overflow-y-auto p-16 custom-scrollbar">
                      <div className="relative group/canvas">
                         <TldrawEditor 
                           slide={deck.slides[activeSlideIndex]} 
                           onUpdate={(updates) => updateSlide(activeSlideIndex, updates)}
                         />
                         
                         <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-8">
                            <button 
                              onClick={() => activeSlideIndex > 0 && setActiveSlideIndex(activeSlideIndex - 1)}
                              disabled={activeSlideIndex === 0}
                              className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white disabled:opacity-20"
                            >
                               <ChevronLeft size={24} />
                            </button>
                            <div className="px-6 py-2 bg-brand-section border border-white/5 rounded-full text-xs font-black uppercase tracking-widest text-white/40">
                               Slide {activeSlideIndex + 1} <span className="mx-2">/</span> {deck.slides.length}
                            </div>
                            <button 
                              onClick={() => activeSlideIndex < deck.slides.length - 1 && setActiveSlideIndex(activeSlideIndex + 1)}
                              disabled={activeSlideIndex === deck.slides.length - 1}
                              className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white disabled:opacity-20"
                            >
                               <ChevronRight size={24} />
                            </button>
                         </div>
                      </div>
                   </div>

                   {/* Right Sidebar: Element Editor */}
                   <aside className="w-96 bg-[#102434] border-l border-white/5 flex flex-col h-full overflow-hidden">
                      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-brand-bg/20">
                         <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
                            {activeElementId ? <Settings size={20} /> : <Layout size={20} />}
                         </div>
                         <h3 className="text-sm font-black uppercase tracking-widest">
                            {activeElementId ? 'Element Logic' : 'Slide Structure'}
                         </h3>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                         {activeElementId?.includes('title') && (
                           <div className="space-y-6">
                              <div>
                                 <label className="text-xs font-black uppercase tracking-widest text-white/30 block mb-4">Master Headline</label>
                                 <textarea 
                                   value={deck.slides[activeSlideIndex].title}
                                   onChange={(e) => updateSlide(activeSlideIndex, { title: e.target.value })}
                                   rows={3}
                                   className="w-full bg-[#163447] border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-brand-accent/50 outline-none transition-all shadow-inner"
                                 />
                              </div>
                           </div>
                         )}

                         {activeElementId?.includes('content') && (
                           <div className="space-y-6">
                              <div>
                                 <label className="text-xs font-black uppercase tracking-widest text-white/30 block mb-4">Core Narrative</label>
                                 <textarea 
                                   value={deck.slides[activeSlideIndex].content}
                                   onChange={(e) => updateSlide(activeSlideIndex, { content: e.target.value })}
                                   rows={4}
                                   className="w-full bg-[#163447] border border-white/10 rounded-2xl p-5 text-xs font-medium text-white/80 focus:border-brand-accent/50 outline-none transition-all resize-none shadow-inner leading-relaxed"
                                 />
                              </div>
                           </div>
                         )}

                         {activeElementId?.includes('points') && (
                           <div className="space-y-6">
                              <label className="text-xs font-black uppercase tracking-widest text-white/30 block mb-4">Strategic Bullets</label>
                              <div className="space-y-3">
                                 {deck.slides[activeSlideIndex].points.map((point, pIdx) => (
                                   <div key={pIdx} className="relative group/point">
                                     <input 
                                       type="text"
                                       value={point}
                                       onChange={(e) => {
                                         const newPoints = [...deck.slides[activeSlideIndex].points];
                                         newPoints[pIdx] = e.target.value;
                                         updateSlide(activeSlideIndex, { points: newPoints });
                                       }}
                                       className="w-full bg-[#163447]/50 border border-white/5 rounded-xl py-4 pl-5 pr-12 text-sm font-medium text-white/70 focus:border-brand-accent/50 focus:bg-[#163447] outline-none transition-all"
                                     />
                                     <button 
                                       onClick={() => {
                                         const newPoints = deck.slides[activeSlideIndex].points.filter((_, i) => i !== pIdx);
                                         updateSlide(activeSlideIndex, { points: newPoints });
                                       }}
                                       className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/20 hover:text-brand-coral transition-all"
                                     >
                                       <Trash2 size={14} />
                                     </button>
                                   </div>
                                 ))}
                                 <button 
                                   onClick={() => {
                                     updateSlide(activeSlideIndex, { points: [...deck.slides[activeSlideIndex].points, "New strategic point"] });
                                   }}
                                   className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-white/20 hover:text-brand-accent hover:border-brand-accent/20 transition-all flex items-center justify-center gap-2"
                                 >
                                   <PlusCircle size={14} /> New Point
                                 </button>
                              </div>
                           </div>
                         )}

                         {activeElementId?.includes('image') && (
                           <div className="space-y-6">
                              <label className="text-xs font-black uppercase tracking-widest text-white/30 block mb-4">Slide Visuals</label>
                              <div className="aspect-video w-full bg-[#08131D] rounded-2xl border border-white/5 overflow-hidden mb-6 relative">
                                 <img 
                                   src={deck.slides[activeSlideIndex].imageUrl || `https://source.unsplash.com/featured/?${deck.slides[activeSlideIndex].imageKeywords}`}
                                   alt="Slide"
                                   className="w-full h-full object-cover opacity-50"
                                 />
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <ImageIcon className="text-white/20" size={32} />
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <div>
                                   <label className="text-sm font-bold text-white/20 uppercase tracking-widest block mb-2">Image URL</label>
                                   <input 
                                     type="text"
                                     value={deck.slides[activeSlideIndex].imageUrl || ''}
                                     placeholder="Custom image URL..."
                                     onChange={(e) => updateSlide(activeSlideIndex, { imageUrl: e.target.value })}
                                     className="w-full bg-[#163447] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-brand-accent/50 outline-none"
                                   />
                                 </div>
                                 <div>
                                   <label className="text-sm font-bold text-white/20 uppercase tracking-widest block mb-2">Content Keywords</label>
                                   <input 
                                     type="text"
                                     value={deck.slides[activeSlideIndex].imageKeywords}
                                     onChange={(e) => updateSlide(activeSlideIndex, { imageKeywords: e.target.value })}
                                     className="w-full bg-[#163447] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-brand-accent/50 outline-none"
                                   />
                                   <p className="text-sm text-white/20 mt-2 italic">Affects "Re-Generate Image" logic</p>
                                 </div>
                                 <button className="w-full py-4 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent font-black uppercase tracking-widest text-base rounded-xl hover:bg-brand-accent/20 transition-all flex items-center justify-center gap-2">
                                    <Sparkles size={14} /> Refresh Smart Image
                                 </button>
                                 <button className="w-full py-4 bg-white/5 border border-white/5 text-white/40 font-black uppercase tracking-widest text-base rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <Download size={14} /> Upload Custom Asset
                                 </button>
                              </div>
                           </div>
                         )}

                         {activeElementId?.includes('metric') && (
                           <div className="space-y-6">
                              <label className="text-xs font-black uppercase tracking-widest text-white/30 block mb-4">Metric Protocol</label>
                              <div className="space-y-6">
                                 <div>
                                   <label className="text-xs font-bold text-white/20 uppercase tracking-widest block mb-2">Metric Label</label>
                                   <input 
                                     type="text"
                                     value={deck.slides[activeSlideIndex].metric?.label || ''}
                                     onChange={(e) => updateSlide(activeSlideIndex, { metric: { ...deck.slides[activeSlideIndex].metric!, label: e.target.value } })}
                                     className="w-full bg-[#163447] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-brand-accent/50 outline-none"
                                   />
                                 </div>
                                 <div>
                                   <label className="text-xs font-bold text-white/20 uppercase tracking-widest block mb-2">Quantifiable Value</label>
                                   <input 
                                     type="text"
                                     value={deck.slides[activeSlideIndex].metric?.value || ''}
                                     onChange={(e) => updateSlide(activeSlideIndex, { metric: { ...deck.slides[activeSlideIndex].metric!, value: e.target.value } })}
                                     className="w-full bg-[#163447] border border-white/10 rounded-xl px-4 py-4 text-sm font-black text-brand-accent focus:border-brand-accent/50 outline-none"
                                   />
                                 </div>
                              </div>
                           </div>
                         )}

                         {!activeElementId && (
                           <div className="space-y-8 py-4">
                              <div className="flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-3xl border border-dashed border-white/10 mb-8">
                                 <Sparkles className="text-white/20 mb-4" size={32} />
                                 <p className="text-xs font-black uppercase tracking-widest text-white/20">Canvas Intelligence</p>
                                 <p className="text-xs font-bold text-white/40 mt-2">Click any slide element to activate its terminal interface.</p>
                              </div>

                              <div className="space-y-4">
                                 <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Project Overview</h4>
                                 <div className="p-5 bg-brand-bg/40 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <FileType className="text-brand-accent" size={16} />
                                       <span className="text-xs font-bold text-white/60">Template:</span>
                                    </div>
                                    <span className="text-xs font-black text-brand-accent uppercase tracking-widest">{deck.template}</span>
                                 </div>
                                 <div className="p-5 bg-brand-bg/40 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <ImageIcon className="text-brand-accent" size={16} />
                                       <span className="text-xs font-bold text-white/60">Visuals:</span>
                                    </div>
                                    <span className="text-xs font-black text-brand-accent uppercase tracking-widest">Smart-Synced</span>
                                 </div>
                              </div>

                              <div className="pt-8">
                                 <button 
                                   onClick={() => setIsConfiguring(true)}
                                   className="w-full py-5 bg-brand-accent/5 border border-brand-accent/20 rounded-2xl text-brand-accent text-xs font-black uppercase tracking-widest hover:bg-brand-accent/10 transition-all flex items-center justify-center gap-2"
                                 >
                                    <Palette size={16} /> Change Presentation Theme
                                 </button>
                              </div>
                           </div>
                         )}
                      </div>
                      
                      {activeElementId && (
                        <div className="p-6 bg-brand-bg/50 border-t border-white/5">
                           <button 
                             onClick={() => setActiveElementId(null)}
                             className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg"
                           >
                              Finishing Editing
                           </button>
                        </div>
                      )}
                   </aside>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Project Configuration Modal */}
      <AnimatePresence>
        {isConfiguring && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-[#102434] rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[85vh]"
            >
               <div className="p-10 border-b border-white/5 bg-brand-bg/30 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent">
                        <Settings size={28} />
                     </div>
                     <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Deck Configuration</h2>
                        <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Manage project source, aesthetic, and terminal settings</p>
                     </div>
                  </div>
                  <button onClick={() => setIsConfiguring(false)} className="p-4 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
                     <X size={24} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-16">
                  {/* Theme Selector */}
                  <section>
                    <h3 className="text-xs font-black uppercase tracking-widest mb-10 flex items-center gap-4">
                       <Palette className="text-brand-accent" size={24} />
                       Visual Template Selection
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                       {TEMPLATES.map(t => (
                         <button
                           key={t.id}
                           onClick={() => updateTheme(t.id)}
                           className={cn(
                             "relative aspect-[4/3] rounded-[2.5rem] border overflow-hidden p-8 text-left transition-all duration-500 group",
                             deck?.template === t.id 
                               ? "border-brand-accent ring-4 ring-brand-accent/20" 
                               : "border-white/5 hover:border-white/20"
                           )}
                         >
                            <div className="absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-700">
                               <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/60 to-transparent" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-end">
                               <h4 className="text-sm font-black uppercase tracking-tight mb-2">{t.name}</h4>
                               <p className="text-xs text-white/40 leading-relaxed max-w-[90%]">{t.desc}</p>
                            </div>
                            {deck?.template === t.id && (
                              <div className="absolute top-8 right-8 w-10 h-10 bg-brand-accent rounded-2xl flex items-center justify-center text-brand-bg shadow-huge">
                                 <CheckCircle2 size={24} />
                              </div>
                            )}
                         </button>
                       ))}
                    </div>
                  </section>

                  {/* Project Selector - If user wants to switch linked analysis */}
                  <section>
                    <h3 className="text-xs font-black uppercase tracking-widest mb-10 flex items-center gap-4 text-white/40">
                       <FileText size={24} />
                       Update Venture Source
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                       {analyses.map(a => (
                         <button 
                           key={a.id}
                           onClick={() => setSelectedAnalysisId(a.id)}
                           className={cn(
                             "flex items-center justify-between p-6 rounded-3xl border transition-all",
                             selectedAnalysisId === a.id 
                               ? "bg-brand-accent/5 border-brand-accent" 
                               : "bg-white/5 border-white/5 hover:bg-white/10"
                           )}
                         >
                            <div className="flex items-center gap-4">
                               <Rocket className={selectedAnalysisId === a.id ? "text-brand-accent" : "text-white/20"} size={20} />
                               <div className="text-left">
                                  <p className="text-sm font-black uppercase">{(a as any).startupProfile?.companyName || 'Untitled Project'}</p>
                                  <p className="text-xs text-white/20 font-bold uppercase mt-1 tracking-widest">{a.startupProfile?.industry}</p>
                               </div>
                            </div>
                            {selectedAnalysisId === a.id && <span className="text-xs font-black text-brand-accent uppercase tracking-widest">Active Source</span>}
                         </button>
                       ))}
                    </div>
                  </section>
               </div>

               <div className="p-10 border-t border-white/5 bg-brand-bg/30 flex justify-end gap-4">
                  <button onClick={() => setIsConfiguring(false)} className="px-10 py-5 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest rounded-2xl transition-all">
                     Dismiss
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-12 py-5 bg-brand-accent text-brand-bg font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-accent/20 flex items-center gap-3"
                  >
                     {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                     Full Refresh
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Presentation Mode Overlay */}
      {isPresenting && deck && (
        <PresentationMode 
          deck={deck} 
          onClose={() => setIsPresenting(false)} 
          companyName={profile?.companyName || 'DecisionLab'}
        />
      )}
    </div>
  );
}
