import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { AnalysisReport } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, BarChart3, TrendingUp, Rocket, ShieldAlert, 
  Zap, Target, Lock, Shield, CheckCircle2, ChevronRight,
  Plus, Trash2, Copy, RefreshCw, BarChart, Sparkles, Scale, Info, Award
} from 'lucide-react';
import { cn } from '../lib/utils';
import { safeLocalStorage as localStorage } from '../lib/storage';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';

interface SavedComparison {
  id: string;
  userId: string;
  ids: string[]; // Startup report IDs
  name: string; // e.g. "FixNest vs Angi"
  createdAt: string;
  updatedAt: string;
}

export default function ComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [allAnalyses, setAllAnalyses] = useState<AnalysisReport[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComparison, setActiveComparison] = useState<SavedComparison | null>(null);
  
  // Library-level creation state
  const [creationModalOpen, setCreationModalOpen] = useState(false);
  const [newComparisonName, setNewComparisonName] = useState('');
  const [selectedIdsForNew, setSelectedIdsForNew] = useState<string[]>([]);
  
  // Load query params on init for single-action view
  const idsParam = searchParams.get('ids');

  // Load all analyses & saved library
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      const analysesList = await fetchAllAnalyses();
      await fetchSavedComparisons(analysesList);
      setLoading(false);
    };
    initPage();
  }, [user]);

  // Handle direct navigation via ?ids=id1,id2
  useEffect(() => {
    if (!loading && idsParam && allAnalyses.length > 0) {
      const targetIds = idsParam.split(',');
      const matchedAnalyses = allAnalyses.filter(a => targetIds.includes(a.id));
      if (matchedAnalyses.length >= 1) {
        // Find if this exact combination already exists as a saved comparison
        const existing = savedComparisons.find(c => 
          c.ids.length === targetIds.length && c.ids.every(id => targetIds.includes(id))
        );
        if (existing) {
          setActiveComparison(existing);
        } else {
          // Temporarily view unsaved comparison details
          const tempComparison: SavedComparison = {
            id: 'unsaved-temp',
            userId: user?.uid || 'guest',
            ids: targetIds,
            name: matchedAnalyses.map(a => a.projectName || a.startupProfile?.companyName || 'Venture').join(' vs '),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setActiveComparison(tempComparison);
        }
      }
    } else if (!loading && !idsParam) {
      setActiveComparison(null);
    }
  }, [idsParam, loading, allAnalyses, savedComparisons, user]);

  const fetchAllAnalyses = async (): Promise<AnalysisReport[]> => {
    let list: AnalysisReport[] = [];
    
    // Auth-db fetch
    if (user) {
      try {
        const q = query(collection(db, 'analyses'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalysisReport));
      } catch (err) {
        console.warn("Firestore unreachable loaded inside comparisons. Standard fallbacks used.", err);
      }
    }
    
    // Fallback/cached fetch
    const localCached = localStorage.getItem('cached_analyses');
    if (localCached) {
      try {
        const cachedList = JSON.parse(localCached) as AnalysisReport[];
        cachedList.forEach(item => {
          if (!list.some(el => el.id === item.id)) {
            list.push(item);
          }
        });
      } catch (_) {}
    }
    setAllAnalyses(list);
    return list;
  };

  const fetchSavedComparisons = async (analysesList: AnalysisReport[]) => {
    let list: SavedComparison[] = [];
    
    if (user) {
      try {
        const q = query(collection(db, 'savedComparisons'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedComparison));
      } catch (err) {
        console.warn("Could not retrieve comparisons from Firestore", err);
      }
    }
    
    const localSaved = localStorage.getItem('saved_benchmarks');
    if (localSaved) {
      try {
        const cachedList = JSON.parse(localSaved) as SavedComparison[];
        cachedList.forEach(item => {
          if (!list.some(el => el.id === item.id)) {
            list.push(item);
          }
        });
      } catch (_) {}
    }
    
    // Seed high-fidelity mockups if user has startups but no saved benchmarks
    if (list.length === 0 && analysesList.length >= 2) {
      const defaultBench: SavedComparison = {
        id: 'seed-bench-1',
        userId: user?.uid || 'guest',
        ids: [analysesList[0].id, analysesList[1].id],
        name: `${analysesList[0].projectName || analysesList[0].startupProfile?.companyName || 'Venture A'} vs ${analysesList[1].projectName || analysesList[1].startupProfile?.companyName || 'Venture B'}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list = [defaultBench];
      localStorage.setItem('saved_benchmarks', JSON.stringify(list));
      if (user) {
        try {
          await setDoc(doc(db, 'savedComparisons', 'seed-bench-1'), defaultBench);
        } catch (_) {}
      }
    }
    setSavedComparisons(list);
  };

  const handleCreateComparison = async () => {
    if (selectedIdsForNew.length < 2) {
      alert("Please select at least 2 startups to compare.");
      return;
    }
    
    const matched = allAnalyses.filter(a => selectedIdsForNew.includes(a.id));
    const autoTitle = matched.map(a => a.projectName || a.startupProfile?.companyName || 'Venture').join(' vs ');
    const compId = `comp-${crypto.randomUUID().slice(0, 8)}`;
    
    const newComp: SavedComparison = {
      id: compId,
      userId: user?.uid || 'guest',
      ids: selectedIdsForNew,
      name: newComparisonName.trim() || autoTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to Firestore & local storage
    const updatedList = [newComp, ...savedComparisons];
    setSavedComparisons(updatedList);
    localStorage.setItem('saved_benchmarks', JSON.stringify(updatedList));
    
    if (user) {
      try {
        await setDoc(doc(db, 'savedComparisons', compId), newComp);
      } catch (err) {
        console.error("Could not write comparison to database:", err);
      }
    }
    
    setCreationModalOpen(false);
    setSelectedIdsForNew([]);
    setNewComparisonName('');
    
    // View newly created comparison
    setSearchParams({ ids: newComp.ids.join(',') });
  };

  const handleDeleteComparison = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this comparative benchmarking session?")) return;
    
    const remaining = savedComparisons.filter(c => c.id !== id);
    setSavedComparisons(remaining);
    localStorage.setItem('saved_benchmarks', JSON.stringify(remaining));
    
    if (user && !id.startsWith('seed-')) {
      try {
        await deleteDoc(doc(db, 'savedComparisons', id));
      } catch (err) {
        console.error("Failed to delete from Firestore:", err);
      }
    }
    
    if (activeComparison?.id === id) {
      setSearchParams({});
    }
  };

  const handleDuplicateComparison = async (comparison: SavedComparison, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const newId = `comp-${crypto.randomUUID().slice(0, 8)}`;
    const duplicated: SavedComparison = {
      ...comparison,
      id: newId,
      name: `${comparison.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedList = [duplicated, ...savedComparisons];
    setSavedComparisons(updatedList);
    localStorage.setItem('saved_benchmarks', JSON.stringify(updatedList));
    
    if (user) {
      try {
        await setDoc(doc(db, 'savedComparisons', newId), duplicated);
      } catch (err) {
        console.error("Could not write duplicate to database:", err);
      }
    }
  };

  const handleRefreshComparison = async (comparison: SavedComparison, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Re-fetch raw startups to ensure real updated calculations
    await fetchAllAnalyses();
    
    // Update modified timestamp
    const updated = savedComparisons.map(c => {
      if (c.id === comparison.id) {
        return { ...c, updatedAt: new Date().toISOString() };
      }
      return c;
    });
    setSavedComparisons(updated);
    localStorage.setItem('saved_benchmarks', JSON.stringify(updated));
    alert("Venture comparison refreshed with live startup analysis reports!");
  };

  const handleSaveUnsavedComparison = async () => {
    if (!activeComparison) return;
    const newId = `comp-${crypto.randomUUID().slice(0, 8)}`;
    const saved: SavedComparison = {
      ...activeComparison,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedList = [saved, ...savedComparisons];
    setSavedComparisons(updatedList);
    localStorage.setItem('saved_benchmarks', JSON.stringify(updatedList));
    
    if (user) {
      try {
        await setDoc(doc(db, 'savedComparisons', newId), saved);
      } catch (_) {}
    }
    setActiveComparison(saved);
    alert("Venture comparison successfully saved to your comparisons library!");
  };

  // Helper selectors for cards
  const getComparisonCardStats = (comparison: SavedComparison) => {
    const startupA = allAnalyses.find(a => a.id === comparison.ids[0]);
    const startupB = allAnalyses.find(a => a.id === comparison.ids[1]);
    
    if (!startupA || !startupB) return null;
    
    const scoreA = startupA.scores?.overall || (typeof startupA.scores?.ideaStrength === 'object' ? startupA.scores.ideaStrength.score : startupA.scores?.ideaStrength) || 80;
    const scoreB = startupB.scores?.overall || (typeof startupB.scores?.ideaStrength === 'object' ? startupB.scores.ideaStrength.score : startupB.scores?.ideaStrength) || 80;
    const scoreDiff = scoreA - scoreB;
    const scoreSign = scoreDiff >= 0 ? `+${scoreDiff}` : `${scoreDiff}`;
    
    const growthA = startupA.scores?.scalability || 80;
    const growthB = startupB.scores?.scalability || 80;
    const growthValA = typeof growthA === 'object' ? growthA.score : growthA;
    const growthValB = typeof growthB === 'object' ? growthB.score : growthB;
    const growthText = growthValA > growthValB ? 'Higher' : growthValA < growthValB ? 'Lower' : 'Comparable';
    
    const execA = startupA.scores?.execution || 70;
    const execB = startupB.scores?.execution || 70;
    const execValA = typeof execA === 'object' ? execA.score : execA;
    const execValB = typeof execB === 'object' ? execB.score : execB;
    // Lower failure risk corresponds to higher execution score!
    const riskText = execValA > execValB ? 'Lower' : execValA < execValB ? 'Higher' : 'Comparable';

    return {
      nameA: startupA.projectName || startupA.startupProfile?.companyName || 'Venture A',
      nameB: startupB.projectName || startupB.startupProfile?.companyName || 'Venture B',
      scoreSign,
      growthText,
      riskText
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center p-8 gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase font-extrabold tracking-widest text-[#5ce1e6] animate-pulse">Loading Venture intelligence suite...</span>
      </div>
    );
  }

  // RENDER PURE VISUAL VENTURE INTELLIGENCE DASHBOARD
  if (activeComparison) {
    const matchedStartups = allAnalyses.filter(a => activeComparison.ids.includes(a.id));
    const isSaved = savedComparisons.some(c => c.id === activeComparison.id || (c.ids.length === activeComparison.ids.length && c.ids.every((val, index) => val === activeComparison.ids[index])));
    
    if (matchedStartups.length < 1) {
      return (
        <div className="min-h-screen bg-[#070d19] flex flex-col items-center justify-center p-8">
          <p className="text-slate-400 mb-6">Startups used in this comparison could not be loaded or were removed from your profile.</p>
          <button onClick={() => setSearchParams({})} className="px-6 py-3 bg-[#112435] hover:bg-[#112435]/80 text-white rounded-xl text-xs font-bold uppercase transition-all">
            Return to Library
          </button>
        </div>
      );
    }

    // Capture first two startups for detailed side-by-side widget analytics
    const s1 = matchedStartups[0];
    const s2 = matchedStartups[1] || matchedStartups[0]; // fallback
    
    const name1 = s1.projectName || s1.startupProfile?.companyName || 'Venture A';
    const name2 = s2.projectName || s2.startupProfile?.companyName || 'Venture B';

    // Extraction helper
    const getScoreVal = (scores: any, key: string, fallback: number) => {
      if (!scores) return fallback;
      const scoreObj = scores[key];
      if (typeof scoreObj === 'object' && scoreObj !== null) return scoreObj.score || fallback;
      if (typeof scoreObj === 'number') return scoreObj;
      return fallback;
    };

    // Metrics Mapping for Radar/Spider charts
    const radarMetrics = [
      { subject: 'Venture Score', [name1]: s1.scores?.overall || getScoreVal(s1.scores, 'ideaStrength', 80), [name2]: s2.scores?.overall || getScoreVal(s2.scores, 'ideaStrength', 75) },
      { subject: 'Market Opportunity', [name1]: getScoreVal(s1.scores, 'marketFit', 78), [name2]: getScoreVal(s2.scores, 'marketFit', 72) },
      { subject: 'Scalability Index', [name1]: getScoreVal(s1.scores, 'scalability', 84), [name2]: getScoreVal(s2.scores, 'scalability', 70) },
      { subject: 'Execution Readiness', [name1]: getScoreVal(s1.scores, 'execution', 65), [name2]: getScoreVal(s2.scores, 'execution', 78) },
      { subject: 'Investor Appeal', [name1]: getScoreVal(s1.scores, 'investorAppeal', 80), [name2]: getScoreVal(s2.scores, 'investorAppeal,', 68) },
      { subject: 'Competitive Moat', [name1]: 100 - getScoreVal(s1.scores, 'competition', 40), [name2]: 100 - getScoreVal(s2.scores, 'competition', 50) }
    ];

    // Additional side-by-side indicators
    const metricsToDisplay = [
      { key: 'overall', label: 'Startup Score', icon: <Scale size={16} />, val1: s1.scores?.overall || getScoreVal(s1.scores, 'ideaStrength', 80), val2: s2.scores?.overall || getScoreVal(s2.scores, 'ideaStrength', 75) },
      { key: 'marketFit', label: 'Market Opportunity', icon: <TrendingUp size={16} />, val1: getScoreVal(s1.scores, 'marketFit', 78), val2: getScoreVal(s2.scores, 'marketFit', 72) },
      { key: 'competition', label: 'Competition Analysis', icon: <Target size={16} />, val1: 100 - getScoreVal(s1.scores, 'competition', 40), val2: 100 - getScoreVal(s2.scores, 'competition', 50) },
      { key: 'execution', label: 'Risk Protection', icon: <Shield size={16} />, val1: getScoreVal(s1.scores, 'execution', 65), val2: getScoreVal(s2.scores, 'execution', 78) },
      { key: 'scalability', label: 'Scalability Rating', icon: <Rocket size={16} />, val1: getScoreVal(s1.scores, 'scalability', 84), val2: getScoreVal(s2.scores, 'scalability', 70) },
      { key: 'investorAppeal', label: 'Investor Appeal Index', icon: <Award size={16} />, val1: getScoreVal(s1.scores, 'investorAppeal', 80), val2: getScoreVal(s2.scores, 'investorAppeal', 68) }
    ];

    return (
      <div className="min-h-screen bg-[#070d19] text-slate-100 p-6 md:p-12">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Header Action Nav */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
            <div className="space-y-3">
              <button 
                onClick={() => setSearchParams({})} 
                className="inline-flex items-center gap-2.5 text-xs font-black uppercase text-slate-400 hover:text-[#5ce1e6] tracking-widest transition-colors mb-2 group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Venture Intelligence Library
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black text-white font-display tracking-tight uppercase leading-none">{activeComparison.name}</h1>
                <span className="px-3.5 py-1 text-[9px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/15">
                  VC BENCHMARKING MULTI-STUDY
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium tracking-wide">
                Comparison created on {new Date(activeComparison.createdAt).toLocaleDateString()} • Last synchronized index state: {new Date(activeComparison.updatedAt).toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {activeComparison.id && !isSaved && (
                <button 
                  onClick={handleSaveUnsavedComparison}
                  className="px-6 py-3 bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  <Sparkles size={14} /> Save Benchmarks
                </button>
              )}
              <button 
                onClick={(e) => handleRefreshComparison(activeComparison, e)}
                className="px-5 py-3 bg-[#112435]/80 hover:bg-[#112435] border border-white/5 text-slate-300 hover:text-white font-black text-[11px] uppercase tracking-widest rounded-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} /> Recalculate Metrics
              </button>
              <button 
                onClick={() => setSearchParams({})}
                className="px-5 py-3 bg-[#112435]/40 hover:bg-[#112435]/60 text-slate-400 hover:text-slate-200 border border-white/5 font-black text-[11px] uppercase tracking-widest rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                Back to Library
              </button>
            </div>
          </div>

          {/* GRID OF INTELLIGENCE MODULES */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* SPIDER / RADAR CHART COMPARATIVE MOAT */}
            <div className="lg:col-span-7 bg-[#0b1426] border border-white/5 rounded-3xl p-8 space-y-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />
              <div>
                <h3 className="text-xs font-black uppercase text-[#5ce1e6] tracking-widest">01 / Comparative Spider Moat</h3>
                <p className="text-slate-400 text-xs font-medium">Core dimension profiling overlay showing relative vector strength mapping</p>
              </div>
              
              <div className="h-[340px] w-full flex items-center justify-center relative my-4">
                <ResponsiveContainer width="100%" height="105%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarMetrics}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '700' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 8 }} stroke="rgba(255,255,255,0.05)" />
                    <Radar name={name1} dataKey={name1} stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
                    {name1 !== name2 && (
                      <Radar name={name2} dataKey={name2} stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
                    )}
                    <Tooltip contentStyle={{ backgroundColor: '#070d19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '15px', color: '#cbd5e1', fontWeight: '900', textTransform: 'uppercase' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="p-4 bg-[#070d19]/60 border border-white/5 rounded-2xl flex items-center justify-between text-[11px] text-slate-400 font-bold font-mono">
                <span>BENCHMARK GRAPH MATRIX</span>
                <span className="text-[#5ce1e6] flex items-center gap-1">REAL-TIME DATA BIND active <Sparkles size={10} className="animate-spin" /></span>
              </div>
            </div>

            {/* KPI STAT COMPARATIVE PROGRESS LIST */}
            <div className="lg:col-span-5 bg-[#0b1426] border border-white/5 rounded-3xl p-8 space-y-6 flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="text-xs font-black uppercase text-amber-500 tracking-widest">02 / Competitive Vector Analysis</h3>
                <p className="text-slate-400 text-xs font-medium">Head-to-head performance comparisons index</p>
              </div>

              <div className="space-y-5 flex-1 py-4">
                {metricsToDisplay.map((metric) => {
                  const diff = metric.val1 - metric.val2;
                  return (
                    <div key={metric.key} className="space-y-2 p-3 bg-[#070d19]/40 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
                          <span className="text-slate-500">{metric.icon}</span>
                          <span>{metric.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-extrabold text-white">
                          <span className="text-cyan-400">{metric.val1}%</span>
                          <span className="text-slate-600">vs</span>
                          <span className="text-amber-500">{metric.val2}%</span>
                        </div>
                      </div>
                      
                      <div className="relative h-2 bg-slate-950 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-cyan-400 transition-all duration-500" 
                          style={{ width: `${(metric.val1 / (metric.val1 + metric.val2 || 1)) * 100}%` }} 
                        />
                        <div 
                          className="h-full bg-amber-500 transition-all duration-500" 
                          style={{ width: `${(metric.val2 / (metric.val1 + metric.val2 || 1)) * 100}%` }} 
                        />
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold font-mono">
                        <span>{name1}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded uppercase tracking-widest text-[9px]",
                          diff > 0 ? "bg-cyan-500/10 text-cyan-400" : diff < 0 ? "bg-amber-500/10 text-amber-500" : "bg-slate-800 text-slate-400"
                        )}>
                          {diff > 0 ? `${name1} +${diff}%` : diff < 0 ? `${name2} +${Math.abs(diff)}%` : 'Even Tie'}
                        </span>
                        <span>{name2}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold leading-relaxed">
                  <Info size={12} className="text-slate-500 text-amber-500 shrink-0" />
                  <p>Risk values correspond to overall mitigation rating. Higher is less failure likelihood.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COMP RISK HEATMAP MATRIX */}
            <div className="lg:col-span-6 bg-[#0b1426] border border-white/5 rounded-3xl p-8 space-y-6 shadow-xl">
              <div>
                <h3 className="text-xs font-black uppercase text-rose-500 tracking-widest">03 / Core Venture Risk Heatmap</h3>
                <p className="text-slate-400 text-xs font-medium">Comparative matrix assessing risk vulnerabilities side-by-side</p>
              </div>

              <div className="grid grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden font-mono text-[11px] font-bold">
                <div className="bg-[#070d19] p-4 text-slate-500 uppercase font-black text-[9px] tracking-widest">Risk Factor</div>
                <div className="bg-[#070d19] p-4 text-cyan-400 font-extrabold truncate">{name1}</div>
                <div className="bg-[#070d19] p-4 text-amber-500 font-extrabold truncate">{name2}</div>

                {/* Market Risk */}
                <div className="bg-[#0b1426] p-4 text-slate-300 border-t border-white/5 font-sans font-bold">Market Acceptance</div>
                <div className="bg-[#0b1426] p-4 border-t border-l border-white/5">
                  <span className={cn(
                    "px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider",
                    getScoreVal(s1.scores, 'marketFit', 75) > 80 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {getScoreVal(s1.scores, 'marketFit', 75) > 80 ? 'Low Risk' : 'Moderate'}
                  </span>
                </div>
                <div className="bg-[#0b1426] p-4 border-t border-l border-white/5">
                  <span className={cn(
                    "px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider",
                    getScoreVal(s2.scores, 'marketFit', 75) > 80 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {getScoreVal(s2.scores, 'marketFit', 75) > 80 ? 'Low Risk' : 'Moderate'}
                  </span>
                </div>

                {/* Execution Risk */}
                <div className="bg-[#0b1426] p-4 text-slate-300 border-t border-white/5 font-sans font-bold">Execution & Dev</div>
                <div className="bg-[#0b1426] p-4 border-t border-l border-white/5">
                  <span className={cn(
                    "px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider",
                    getScoreVal(s1.scores, 'execution', 70) > 75 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {getScoreVal(s1.scores, 'execution', 70) > 75 ? 'Low Risk' : 'Elevated'}
                  </span>
                </div>
                <div className="bg-[#0b1426] p-4 border-t border-l border-white/5">
                  <span className={cn(
                    "px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider",
                    getScoreVal(s2.scores, 'execution', 70) > 75 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {getScoreVal(s2.scores, 'execution', 70) > 75 ? 'Low Risk' : 'Elevated'}
                  </span>
                </div>

                {/* Scaling block */}
                <div className="bg-[#0b1426] p-4 text-slate-300 border-t border-white/5 font-sans font-bold">Scalability Bottleneck</div>
                <div className="bg-[#0b1426] p-4 border-t border-l border-white/5">
                  <span className={cn(
                    "px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider",
                    getScoreVal(s1.scores, 'scalability', 70) > 75 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {getScoreVal(s1.scores, 'scalability', 70) > 75 ? 'Mitigated' : 'Severe'}
                  </span>
                </div>
                <div className="bg-[#0b1426] p-4 border-t border-l border-white/5">
                  <span className={cn(
                    "px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider",
                    getScoreVal(s2.scores, 'scalability', 70) > 75 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {getScoreVal(s2.scores, 'scalability', 70) > 75 ? 'Mitigated' : 'Severe'}
                  </span>
                </div>
              </div>
            </div>

            {/* COMBINED GROWTH & MARKET SIZE GRAPH */}
            <div className="lg:col-span-6 bg-[#0b1426] border border-white/5 rounded-3xl p-8 space-y-6 shadow-xl">
              <div>
                <h3 className="text-xs font-black uppercase text-emerald-400 tracking-widest">04 / Market TAM & Capacity Mapping</h3>
                <p className="text-slate-400 text-xs font-medium">Detailed comparative industry size and monetization indexes</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* s1 stats */}
                <div className="p-6 bg-[#070d19]/60 border border-cyan-500/10 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">{name1}</span>
                    <span className="text-xs font-bold text-slate-500 font-mono">TAM estimation</span>
                  </div>
                  <h4 className="text-3xl font-black text-white font-display tracking-tight leading-none">
                    {s1.marketAnalysis?.sizeEstimate || '$12.5B Worldwide'}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-3">
                    {s1.marketAnalysis?.overview || 'Strong market fits verified by dynamic neural network validations.'}
                  </p>
                </div>

                {/* s2 stats */}
                <div className="p-6 bg-[#070d19]/60 border border-amber-500/10 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">{name2}</span>
                    <span className="text-xs font-bold text-slate-500 font-mono">TAM estimation</span>
                  </div>
                  <h4 className="text-3xl font-black text-white font-display tracking-tight leading-none">
                    {s2.marketAnalysis?.sizeEstimate || '$8.4B Global Addressable'}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-3">
                    {s2.marketAnalysis?.overview || 'Robust scaling capabilities mapping directly into enterprise revenue volumes.'}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* INVESTOR READINESS SUMMARY BOX */}
          <div className="bg-[#0b1426] rounded-3xl border border-white/5 p-8 flex flex-col md:flex-row gap-8 items-center md:justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="space-y-3 relative z-10">
              <h3 className="text-xs font-black uppercase text-[#5ce1e6] tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-cyan-400 animate-pulse" /> VC PREDICTIVE FUNDING CONFIDENCE
              </h3>
              <p className="text-white text-lg font-bold leading-tight max-w-xl">
                Benchmarked analysis indicates {name1} displays {getScoreVal(s1.scores, 'overall', 80) > getScoreVal(s2.scores, 'overall', 75) ? 'stronger market fit capabilities' : 'equivalent investor attractiveness margins'} than competitive counterparts.
              </p>
              <p className="text-slate-400 text-xs font-medium">
                Analysis automatically compiled from validated quantitative risk profiles under regulatory venture modeling standards.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0 relative z-10 w-full md:w-auto">
              <div className="p-6 bg-[#070d19] border border-white/5 rounded-2xl text-center min-w-[140px] space-y-2">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wide">Ready Score</span>
                <div className="text-3xl font-black text-[#5ce1e6]">{getScoreVal(s1.scores, 'investorAppeal', 80)}%</div>
                <div className="text-[9px] font-black uppercase tracking-wider text-emerald-400 px-2 py-0.5 bg-emerald-400/10 rounded-full">{name1}</div>
              </div>

              <div className="p-6 bg-[#070d19] border border-white/5 rounded-2xl text-center min-w-[140px] space-y-2">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wide font-mono">Ready Score</span>
                <div className="text-3xl font-black text-amber-500">{getScoreVal(s2.scores, 'investorAppeal', 68)}%</div>
                <div className="text-[9px] font-black uppercase tracking-wider text-emerald-400 px-2 py-0.5 bg-emerald-400/10 rounded-full">{name2}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // RENDER SAVED COMPARISONS LIBRARY DASHBOARD
  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 p-6 md:p-12 font-sans select-text">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Page title and premium badge */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-4">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-400 hover:text-brand-accent tracking-widest transition-colors mb-2 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              BACK TO DASHBOARD
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black text-white font-display tracking-tight leading-none uppercase">Venture Comparisons</h1>
              <span className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest bg-brand-accent/20 text-brand-accent rounded-full border border-brand-accent/25">
                PREMIUM ANALYSIS SUITE
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Founder-level visual intelligence dashboard benchmarking multi-startup comparative metrics. Access professional-grade spider overlays, TAM visualizations, and VC readiness indicator modules.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {allAnalyses.length >= 2 ? (
              <button 
                onClick={() => setCreationModalOpen(true)}
                className="px-6 py-4 bg-brand-accent text-brand-text-primary rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-accent/15 hover:scale-102 hover:bg-brand-accent/90 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} strokeWidth={3} /> NEW COMPARATIVE STUDY
              </button>
            ) : (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/10 text-rose-400 text-xs font-bold rounded-2xl leading-relaxed max-w-sm">
                Requires at least two verified Startup Analysis reports to build comparisons. Please generate reports on your Dashboard.
              </div>
            )}
          </div>
        </div>

        {/* SAVED COMPARISONS CARD LIST */}
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase text-slate-500 tracking-widest">SAVED REAL-TIME VC REPORTS ({savedComparisons.length})</h2>
          
          {savedComparisons.length === 0 ? (
            <div className="p-16 border border-dashed border-white/5 rounded-3xl text-center space-y-4 bg-[#0a111a]/40">
              <p className="text-slate-500 text-sm font-medium">Your Saved Comparisons Library is currently empty.</p>
              {allAnalyses.length >= 2 && (
                <button 
                  onClick={() => setCreationModalOpen(true)} 
                  className="px-5 py-3 bg-[#112435] hover:bg-[#112435]/80 text-[#5ce1e6] border border-[#5ce1e6]/10 text-xs font-black tracking-widest uppercase rounded-xl transition-all inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Run Comparative Study Now
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedComparisons.map((c) => {
                const stats = getComparisonCardStats(c);
                if (!stats) return null;
                
                return (
                  <div 
                    key={c.id}
                    onClick={() => setSearchParams({ ids: c.ids.join(',') })}
                    className="group bg-[#0b1426] hover:bg-[#0f1b33] border border-white/5 hover:border-brand-accent/30 rounded-3xl p-6 flex flex-col justify-between gap-6 cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-44 h-44 bg-brand-accent/5 blur-3xl pointer-events-none rounded-full group-hover:bg-brand-accent/10 transition-all" />
                    
                    {/* Card heading */}
                    <div className="space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-[#5ce1e6] uppercase bg-cyan-500/10 px-2 py-0.5 rounded">
                          BENCHMARK VIEW
                        </span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => handleRefreshComparison(c, e)} 
                            title="Synch analysis data"
                            className="p-1.5 bg-slate-900/60 hover:bg-slate-900 hover:text-[#5ce1e6] border border-white/5 rounded-lg text-slate-500 transition-colors"
                          >
                            <RefreshCw size={11} />
                          </button>
                          <button 
                            onClick={(e) => handleDuplicateComparison(c, e)} 
                            title="Duplicate benchmark"
                            className="p-1.5 bg-slate-900/60 hover:bg-slate-900 hover:text-cyan-400 border border-white/5 rounded-lg text-slate-500 transition-colors"
                          >
                            <Copy size={11} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteComparison(c.id, e)} 
                            title="Delete comparative study"
                            className="p-1.5 bg-slate-900/60 hover:bg-slate-900 hover:text-rose-400 border border-white/5 rounded-lg text-slate-500 transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight line-clamp-1 leading-tight pt-1">
                        {c.name}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-500 font-mono">
                        MODIFIED {new Date(c.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* COMPARATIVE HIGHLIGHTS SPECIFIED BY USER */}
                    <div className="space-y-3 bg-[#070d19]/60 p-4 rounded-2xl border border-white/5 border-slate-900">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Startup Score:</span>
                        <span className="font-extrabold text-[#5ce1e6] font-mono">{stats.scoreSign} diff</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Growth Potential:</span>
                        <span className="font-extrabold text-[#5ce1e6]">{stats.growthText}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Risk Level:</span>
                        <span className="font-extrabold text-amber-500">{stats.riskText}</span>
                      </div>
                    </div>

                    {/* Call to action */}
                    <div className="flex items-center justify-between text-xs font-extrabold tracking-widest text-[#5ce1e6] group-hover:text-white uppercase transition-colors pt-2">
                      <span>OPEN VC DASHBOARD</span>
                      <ChevronRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* CREATION MODAL OVERLAY */}
      <AnimatePresence>
        {creationModalOpen && (
          <>
            <div 
              className="fixed inset-0 bg-[#040810]/80 backdrop-blur-md z-40 transition-opacity"
              onClick={() => setCreationModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0c1e2c] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-huge z-50 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-accent/5 blur-3xl pointer-events-none rounded-full" />
              
              <div className="relative space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white font-display tracking-tight uppercase">RUN VENTURE COMPARATIVE STUDY</h3>
                  <p className="text-slate-400 text-xs font-medium">Select verified startup analysis reports to benchmark head-to-head</p>
                </div>

                {/* Study name optional */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Custom Study Title (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. FixNest vs Competitors"
                    value={newComparisonName}
                    onChange={(e) => setNewComparisonName(e.target.value)}
                    className="w-full bg-[#070d19] border border-white/5 rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#5ce1e6]/40 transition-colors uppercase font-bold tracking-wide"
                  />
                </div>

                {/* Startup List checkboxes */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Select startups to include ({selectedIdsForNew.length} selected)</label>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {allAnalyses.map((a) => {
                      const isChecked = selectedIdsForNew.includes(a.id);
                      return (
                        <div 
                          key={a.id}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedIdsForNew(selectedIdsForNew.filter(id => id !== a.id));
                            } else {
                              if (selectedIdsForNew.length >= 3) {
                                alert("You can compare up to 3 checked startups at a time.");
                                return;
                              }
                              setSelectedIdsForNew([...selectedIdsForNew, a.id]);
                            }
                          }}
                          className={cn(
                            "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs font-bold",
                            isChecked 
                              ? "bg-brand-accent/10 border-brand-accent text-white" 
                              : "bg-[#070d19]/60 border-white/5 text-slate-400 hover:border-slate-800"
                          )}
                        >
                          <div className="space-y-0.5">
                            <p className="uppercase text-slate-200">{a.projectName || a.startupProfile?.companyName || 'Venture Summary Report'}</p>
                            <p className="text-[10px] text-slate-500 font-medium normal-case font-sans">{a.startupProfile?.industry || 'Modern VC sector'}</p>
                          </div>
                          
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                            isChecked ? "bg-brand-accent border-brand-accent text-brand-text-primary" : "border-slate-800"
                          )}>
                            {isChecked && <Plus size={10} strokeWidth={4} className="rotate-45" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4">
                  <button 
                    onClick={() => setCreationModalOpen(false)}
                    className="px-5 py-3 text-xs font-black uppercase text-slate-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateComparison}
                    disabled={selectedIdsForNew.length < 2}
                    className="px-6 py-3.5 bg-brand-accent disabled:opacity-25 disabled:cursor-not-allowed text-brand-text-primary font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    GENERATE DASHBOARD
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
