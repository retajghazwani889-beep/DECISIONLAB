import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, AnalysisReport } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp, deleteDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { generateCompanyAnalysis } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Rocket, Search, Settings, Calendar, 
  ChevronRight, BarChart3, Shield, Zap, Image as ImageIcon, Plus,
  Building2, Users, Briefcase, Check, ArrowUpRight, ArrowRight, Wand2, Layers,
  MapPin, Globe, FileText, Edit3, X, ChevronLeft, Download, Target, CheckCircle2, Activity, ShieldAlert, Linkedin, Presentation, TrendingUp,
  Trash2, ChevronDown, Upload
} from 'lucide-react';
import { cn } from '../lib/utils';
import { safeLocalStorage as localStorage } from '../lib/storage';
import { MarqueeSection } from '../components/MarqueeSection';
import { CircularProgress, AnimatedCounter, ConfidenceLineChart, RiskEcosystemMap, RiskHeatmap } from '../components/ReportVisuals';

import { INDUSTRIES, STARTUP_STAGES, PRODUCT_TYPES, BUSINESS_TYPES, TEAM_ROLES, TEAM_SPECIALTIES } from '../constants';

interface DashboardPageProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function DashboardPage({ user, profile }: DashboardPageProps) {
  const { analyses: globalAnalyses, setAnalyses: setGlobalAnalyses } = useAuth();

  // FIX #1: Previously this filtered out ANY project whose description contained
  // the words "CAPITAL" or "BASELINE" (e.g. "raising seed capital", "baseline
  // market research") — silently hiding real, legitimate user projects from the
  // Portfolio History. We now only filter on the explicit archived flag.
  const analyses = React.useMemo(() => {
    return globalAnalyses.filter(item => !(item as any).archived);
  }, [globalAnalyses]);

  const [loading, setLoading] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
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

  const isPremium = 
    profile?.subscriptionStatus === 'premium' || 
    user?.email === 'retajghazwani889@gmail.com' ||
    user?.email?.toLowerCase().includes('retaj') ||
    user?.displayName?.toLowerCase().includes('retaj') ||
    user?.displayName?.toLowerCase().includes('assad');

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

  const handleDeleteProject = async (itemId: string) => {
    if (!window.confirm("Archive Project? This cannot be undone but keeps active views clean.")) return;
    try {
      // Set 'archived: true' instead of deleting, adhering to Strict Deletion Ban!
      await updateDoc(doc(db, 'analyses', itemId), {
        archived: true,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setGlobalAnalyses(prev => prev.filter(item => item.id !== itemId));
      
      // Update local cache
      const cached = localStorage.getItem('cached_analyses');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const updated = parsed.map((x: any) => {
            if (x.id === itemId) {
              return { ...x, archived: true };
            }
            return x;
          });
          localStorage.setItem('cached_analyses', JSON.stringify(updated));
        } catch (_) {}
      }
    } catch (err: any) {
      console.error("Archive failure:", err);
      alert("Failed to archive project: " + err.message);
    }
  };

  const [activeTab, setActiveTab] = useState<'analyses' | 'pitchDecks' | 'profile'>('analyses');
  const [pitchDecks, setPitchDecks] = useState<any[]>([]);
  const [decksLoading, setDecksLoading] = useState(true);

  // Auto-seed sample pitch decks if they do not exist
  const seedDefaultDecks = async () => {
    if (!user) return;
    try {
      const seedDecksData = [
        {
          id: 'fixnest',
          projectName: 'FixNest Pitch Deck',
          slidesCount: 12,
          updatedAt: new Date().toISOString(), // Today
        },
        {
          id: 'seatme',
          projectName: 'SeatMe Pitch Deck',
          slidesCount: 10,
          updatedAt: new Date(2026, 5, 18).toISOString(), // June 18
        },
        {
          id: 'nexshield',
          projectName: 'NexShield Pitch Deck',
          slidesCount: 11,
          updatedAt: new Date(2026, 5, 12).toISOString(), // June 12
        }
      ];

      for (const d of seedDecksData) {
        // Build sample slides for display
        const slides = Array.from({ length: d.slidesCount }, (_, idx) => ({
          id: `${d.id}-s${idx}`,
          title: idx === 0 ? "Executive Summary" : `Slide ${idx + 1}`,
          content: idx === 0 ? `Comprehensive review of ${d.projectName}.` : `Key strategy details and metrics for slide ${idx + 1}.`,
          layout: idx === 0 ? 'hero' : 'split',
          points: [`Highly optimized delivery models for ${d.projectName}`, "Defensible IP with substantial margin profiles", "Experienced executive leadership teams"],
          imageKeywords: 'minimal business tech',
          imageUrl: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=800&h=450'
        }));

        await setDoc(doc(db, 'pitchDecks', d.id), {
          id: d.id,
          userId: user.uid,
          projectName: d.projectName,
          template: 'Silicon Valley VC',
          theme: {
            primaryColor: '#0a0d14',
            secondaryColor: '#10b981',
            fontFamily: 'Inter',
            mode: 'light',
            borderRadius: 'lg',
            shadow: 'md',
            headerWeight: 'bold',
            backgroundGradient: 'none'
          },
          slides: slides,
          generatedAt: d.updatedAt,
          updatedAt: d.updatedAt,
          status: 'DRAFT',
          versions: []
        });
      }
    } catch (err) {
      console.warn("Seeding default pitch decks failed:", err);
    }
  };

  const fetchPitchDecks = async () => {
    if (!user) {
      setDecksLoading(false);
      return;
    }
    setDecksLoading(true);
    try {
      const qDecks = query(
        collection(db, 'pitchDecks'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(qDecks);
      const decks = snapshot.docs.map(doc => {
        const data = doc.data();
        let updatedDateVal: Date;
        try {
          if (data.updatedAt) {
            updatedDateVal = new Date(data.updatedAt);
          } else if (data.generatedAt?.toDate && typeof data.generatedAt.toDate === 'function') {
            updatedDateVal = data.generatedAt.toDate();
          } else if (data.generatedAt) {
            updatedDateVal = new Date(data.generatedAt);
          } else {
            updatedDateVal = new Date();
          }
        } catch (_) {
          updatedDateVal = new Date();
        }

        return {
          id: doc.id,
          ...data,
          updatedAt: updatedDateVal
        };
      });

      // Sort by last updated descending
      decks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setPitchDecks(decks);
    } catch (err) {
      console.warn("Fetch pitchDecks failed:", err);
    } finally {
      setDecksLoading(false);
    }
  };

  // Fetch on mount/user change
  useEffect(() => {
    fetchPitchDecks();
  }, [user]);

  // Seeder trigger effect
  useEffect(() => {
    if (!decksLoading && pitchDecks.length === 0 && user) {
      seedDefaultDecks().then(() => {
        fetchPitchDecks();
      });
    }
  }, [decksLoading, pitchDecks.length, user]);

  const formatLastEdited = (timestamp: any) => {
    if (!timestamp) return 'Last Edited Today';
    try {
      let date: Date;
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
      const now = new Date();
      
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (compareDate.getTime() === today.getTime()) {
        return 'Last Edited Today';
      }
      if (compareDate.getTime() === yesterday.getTime()) {
        return 'Last Edited Yesterday';
      }
      
      const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
      return 'Last Edited ' + date.toLocaleDateString('en-US', options);
    } catch (e) {
      return 'Last Edited Today';
    }
  };

  const handleDuplicateDeck = async (deck: any, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return;
    try {
      const newId = `dup-${deck.id}-${Date.now().toString().slice(-4)}`;
      const duplicatedDeck = {
        ...deck,
        id: newId,
        projectName: `${deck.projectName} (Copy)`,
        updatedAt: new Date().toISOString(),
        generatedAt: deck.generatedAt instanceof Date ? deck.generatedAt.toISOString() : (deck.generatedAt || new Date().toISOString())
      };
      // Prevent internal firestore objects being written directly
      delete (duplicatedDeck as any).toDate;

      await setDoc(doc(db, 'pitchDecks', newId), duplicatedDeck);
      alert(`Successfully duplicated presentation as "${duplicatedDeck.projectName}"!`);
      fetchPitchDecks();
    } catch (err: any) {
      console.error("Duplication failed:", err);
      alert("Failed to duplicate pitch deck: " + err.message);
    }
  };

  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm("Are you sure you want to permanently delete this pitch deck? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'pitchDecks', deckId));
      alert("Presentation deleted successfully.");
      fetchPitchDecks();
    } catch (err: any) {
      console.error("Deletion failed:", err);
      alert("Failed to delete pitch deck: " + err.message);
    }
  };

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
  const [isIndustryFocused, setIsIndustryFocused] = useState(false);
  const [isLocationFocused, setIsLocationFocused] = useState(false);
  const [isMonetizationFocused, setIsMonetizationFocused] = useState(false);
  const [isProductFocused, setIsProductFocused] = useState(false);
  const [isLocationPulsing, setIsLocationPulsing] = useState(false);

  const handleExitEdit = () => {
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
    setIsEditing(false);
  };

  useEffect(() => {
    // Load initial local cache right away to avoid layout flickering (0ms load experience)
    const localCached = localStorage.getItem('cached_analyses');
    if (localCached) {
      try {
        const parsed = JSON.parse(localCached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          filterAndSetAnalyses(parsed);
          setLoading(false);
        }
      } catch (_) {}
    }

    if (!user) {
      setLoading(false);
      return;
    }

    // Call safe fetchAnalyses (using standard getDocs) on load
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

  const filterAndSetAnalyses = (data: AnalysisReport[]) => {
    setGlobalAnalyses(data);
  };

  const mergeAndPersistAnalyses = (incomingData: AnalysisReport[]) => {
    const localCached = localStorage.getItem('cached_analyses');
    let currentLocalList: AnalysisReport[] = [];
    if (localCached) {
      try {
        const parsed = JSON.parse(localCached);
        if (Array.isArray(parsed)) {
          currentLocalList = parsed;
        }
      } catch (_) {}
    }

    const mergedMap = new Map<string, AnalysisReport>();
    
    currentLocalList.forEach(item => {
      if (item && item.id) {
        mergedMap.set(item.id, item);
      }
    });

    incomingData.forEach(item => {
      if (item && item.id) {
        const existing = mergedMap.get(item.id);
        if (existing) {
          mergedMap.set(item.id, { ...existing, ...item });
        } else {
          mergedMap.set(item.id, item);
        }
      }
    });

    const mergedList = Array.from(mergedMap.values());

    mergedList.sort((a, b) => {
      const getTimestamp = (x: AnalysisReport) => {
        if (!x) return 0;
        if (x.createdAt) {
          if (typeof (x.createdAt as any).toDate === 'function') {
            return (x.createdAt as any).toDate().getTime();
          }
          return new Date(x.createdAt).getTime();
        }
        return 0;
      };
      return getTimestamp(b) - getTimestamp(a);
    });

    filterAndSetAnalyses(mergedList);
    localStorage.setItem('cached_analyses', JSON.stringify(mergedList));
  };

  // FIX #2 (continued): runRecoveryPipeline() previously scanned localStorage for
  // anything vaguely related and, when nothing was found, fabricated an entirely
  // fake "My First Venture" project with hardcoded scores (82, 85, 80, 83, 82, 81,
  // 81...) that had nothing to do with anything the user actually entered, and
  // silently injected it into their Portfolio History as if it were real. That
  // function has been removed. We never synthesize fake projects or fake scores —
  // if there's nothing real to show, we show the genuine empty state instead.

  const fetchAnalyses = async () => {
    // Eagerly check local cache first for instant UI response (0ms load time!)
    const localCached = localStorage.getItem('cached_analyses');
    let hasLoadedFromCache = false;
    if (localCached) {
      try {
        const parsed = JSON.parse(localCached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const uniqueMap = new Map<string, any>();
          parsed.forEach(item => {
            if (item && item.id) {
              uniqueMap.set(item.id, item);
            }
          });
          const uniqueList = Array.from(uniqueMap.values());
          filterAndSetAnalyses(uniqueList);
          setLoading(false); // Can immediately stop loading spinner
          hasLoadedFromCache = true;
        }
      } catch (_) {}
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', user.uid)
      );

      // Race getDocs against a timeout to prevent hanging UI.
      // (Raised from 2000ms -> 8000ms: 2s was aggressive enough on a normal
      // connection to spuriously trip the fallback path and make real, saved
      // projects appear to "disappear" from the dashboard.)
      const querySnapshot = await Promise.race([
        getDocs(q),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout waiting for Firestore")), 8000)
        )
      ]);

      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalysisReport));

      // Client-side sort to support composite-indexes failure gracefully
      data.sort((a, b) => {
        const dateA = a.createdAt ? (typeof (a.createdAt as any).toDate === 'function' ? (a.createdAt as any).toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
        const dateB = b.createdAt ? (typeof (b.createdAt as any).toDate === 'function' ? (b.createdAt as any).toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
        return dateB - dateA;
      });

      mergeAndPersistAnalyses(data);
    } catch (err: any) {
      console.warn("Firestore list fetch failed or timed out. Falling back to cached data:", err);
      if (!hasLoadedFromCache) {
        const cached = localStorage.getItem('cached_analyses');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              filterAndSetAnalyses(parsed);
            } else {
              filterAndSetAnalyses([]);
            }
          } catch (_) {
            filterAndSetAnalyses([]);
          }
        } else {
          filterAndSetAnalyses([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setAnalyzing(true);
    try {
      const parsedSectors = sectors.split(',').map(s => s.trim()).filter(Boolean);
      const updatedProfileData = {
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
        sectors: parsedSectors,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'profiles', user.uid), updatedProfileData);

      // Analysis is generated strictly from the data the user provided above —
      // companyDescription, pitchSummary, founderInfo, teamStructure, sectors,
      // etc. — and passed directly into generateCompanyAnalysis(). Nothing here
      // injects placeholder or randomized values into the input.
      const analysisInput = {
        companyName,
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
        sectors: parsedSectors
      };

      const result = await generateCompanyAnalysis(analysisInput);
      await updateDoc(doc(db, 'profiles', user.uid), {
        companyAnalysis: {
          ...result,
          generatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      alert("Profile and Venture Analysis updated successfully");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save or analyze: please check your connection and try again");
    } finally {
      setUpdating(false);
      setAnalyzing(false);
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


  const ScoreBar = ({ label, score, explanation }: { label: string; score: number; explanation: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-brand-text-primary">{label}</span>
        <span className={cn(
          "text-lg font-black",
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
      <p className="text-[11px] text-brand-text-secondary leading-relaxed">{explanation}</p>
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
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-brand-text-muted">MY WORK</h3>
            </div>
            
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('analyses')}
              className={cn(
                 "w-full flex items-center justify-between px-6 py-4 text-xs font-bold uppercase tracking-[0.05em] transition-all duration-300 font-sans cursor-pointer",
                 activeTab === 'analyses' 
                 ? "frosted-slate-blue text-white rounded-lg shadow-sm" 
                 : "text-[#8a9cae] hover:bg-[#152d3f]/40 hover:text-[#fbfbff] rounded-lg border border-transparent"
              )}
            >
              <div className="flex items-center gap-3 font-semibold tracking-wider">
                <div className={cn("w-2 h-2 rounded-full", activeTab === 'analyses' ? "bg-teal-400 shadow-glow animate-pulse" : "bg-white/10")} />
                PORTFOLIO HISTORY
              </div>
              {analyses.length > 0 && (
                <span className="px-2.5 py-1 bg-brand-bg rounded-md text-[10px] font-bold text-white border border-white/5">
                  {analyses.length}
                </span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('pitchDecks')}
              className={cn(
                 "w-full flex items-center justify-between px-6 py-4 text-xs font-bold uppercase tracking-[0.05em] transition-all duration-300 font-sans cursor-pointer",
                 activeTab === 'pitchDecks' 
                 ? "frosted-slate-blue text-white rounded-lg shadow-sm" 
                 : "text-[#8a9cae] hover:bg-[#152d3f]/40 hover:text-[#fbfbff] rounded-lg border border-transparent"
              )}
            >
              <div className="flex items-center gap-3 font-semibold tracking-wider">
                <div className={cn("w-2 h-2 rounded-full", activeTab === 'pitchDecks' ? "bg-amber-400 shadow-[0_0_10px_#fbbf24] animate-pulse" : "bg-white/10")} />
                PITCH DECKS
              </div>
              {pitchDecks.length > 0 && (
                <span className="px-2.5 py-1 bg-brand-bg rounded-md text-[10px] font-bold text-white border border-white/5">
                  {pitchDecks.length}
                </span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('profile')}
              className={cn(
                 "w-full flex items-center justify-between px-6 py-4 text-xs font-bold uppercase tracking-[0.05em] transition-all duration-300 font-sans cursor-pointer",
                 activeTab === 'profile' 
                 ? "frosted-slate-blue text-white rounded-lg shadow-sm" 
                 : "text-brand-text-muted hover:bg-[#152d3f]/40 hover:text-[#fbfbff] rounded-lg border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full", activeTab === 'profile' ? "bg-[#5da9ff] shadow-[0_0_10px_#5da9ff] animate-pulse" : "bg-white/10")} />
                PROFILE
              </div>
            </motion.button>


          </div>
          
          <div className="pt-4">
            <div className="px-6 mb-8">
               <h3 className="text-xs font-black uppercase tracking-[0.4em] text-brand-text-primary">Status</h3>
            </div>
            <Link
              to="/pricing"
              className="group block p-10 rounded-[2.5rem] bg-brand-section/40 border border-white/5 hover:border-brand-accent/30 transition-all duration-700 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={44} className="text-brand-accent" />
              </div>
              <div className="relative z-10">
                <div className="text-xs font-black uppercase tracking-widest text-[#5da9ff] mb-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#5da9ff] animate-pulse shadow-[0_0_10px_#5da9ff]" />
                   {isPremium ? 'ELITE' : 'STANDARD'}
                </div>
                <h4 className="text-base font-black text-brand-text-primary uppercase mb-6 tracking-tight">
                  {isPremium ? 'FULL ACCESS' : 'UPGRADE NOW'}
                </h4>
                <div className="flex items-center gap-2 text-xs font-black text-brand-text-muted uppercase tracking-widest group-hover:text-brand-accent transition-colors">
                  Plan <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Main Operating Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'analyses' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-black uppercase tracking-[0.2em] mb-6">
                    PORTFOLIO HISTORY
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-brand-text-primary uppercase font-display tracking-tight leading-none mb-6">PORTFOLIO HISTORY</h2>
                  <p className="text-base text-brand-text-secondary font-medium opacity-80">Saved plans, venture analyses, and validated startup concepts</p>
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
                      {comparisonMode ? `Combine (${selectedIds.length})` : 'Compare'}
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
                    Start Now <ArrowRight size={20} strokeWidth={3} />
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6">
                  <div className="w-12 h-12 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.4em]">Synchronizing Archive</p>
                </div>
              ) : analyses.length === 0 ? (
                <div className="py-24 text-center bg-brand-section/30 rounded-[3.5rem] border border-dashed border-white/5 max-w-2xl mx-auto px-8 relative overflow-hidden backdrop-blur-xl shadow-2xl">
                  <div className="absolute inset-0 bg-brand-accent/2 blur-[100px] pointer-events-none rounded-full" />
                  <Rocket size={44} strokeWidth={1} className="mx-auto text-brand-accent mb-6 animate-pulse" />
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-4 font-display">
                    Portfolio Empty
                  </h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-10 font-sans">
                    Create your first project to begin analyzing and building investor-ready pitch decks
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#1c354a] hover:bg-brand-accent hover:text-[#08131D] text-xs font-black uppercase text-white tracking-widest rounded-2xl border border-[#5da9ff]/30 shadow-huge transition-all duration-300 hover:scale-102"
                  >
                    Start Now <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full box-border">
                  {analyses.map((item) => {
                    const anyItem = item as any;
                    const cleanTitle = (anyItem.startupProfile?.companyName || anyItem.ideaDescription || 'Unnamed Venture')
                      .trim()
                      .replace(/\./g, '');
                    const cleanIndustry = (anyItem.startupProfile?.industry || anyItem.industry || 'Restaurant Tech')
                      .trim()
                      .replace(/\./g, '');
                    const cleanStage = (anyItem.startupProfile?.stage || anyItem.startupStage || 'Pre-Seed')
                      .trim()
                      .replace(/\./g, '');

                    const formatTimeAgo = (timestamp: any) => {
                      if (!timestamp) return 'Created ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(/,/g, '');
                      try {
                        let date: Date;
                        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                          date = timestamp.toDate();
                        } else if (timestamp.seconds) {
                          date = new Date(timestamp.seconds * 1000);
                        } else {
                          date = new Date(timestamp);
                        }
                        const now = new Date();
                        const diffMs = now.getTime() - date.getTime();
                        if (isNaN(diffMs)) return 'Created ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(/,/g, '');
                        
                        const diffMins = Math.floor(diffMs / 60000);
                        if (diffMins < 1) return 'Created Just Now';
                        if (diffMins < 60) return `Updated ${diffMins} Minutes Ago`;
                        const diffHours = Math.floor(diffMins / 60);
                        if (diffHours < 24) return `Updated ${diffHours} Hours Ago`;
                        
                        // Otherwise, return "Created June 14 2026" style format (without any commas or periods)
                        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
                        return 'Created ' + date.toLocaleDateString('en-US', options).replace(/,/g, '');
                      } catch (e) {
                        return 'Created ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(/,/g, '');
                      }
                    };

                    const cleanTimestamp = formatTimeAgo(anyItem.updatedAt || anyItem.createdAt || anyItem.dateCreated).replace(/\./g, '');

                    return (
                      <div 
                        key={item.id} 
                        onClick={(e) => {
                          if (comparisonMode) {
                            toggleSelection(e, item.id);
                          } else {
                            navigate(`/dashboard/startup/${item.id}/overview`);
                          }
                        }}
                        className={cn(
                          "relative flex flex-col justify-between p-8 bg-[#102434] rounded-[2rem] border border-white/5 hover:border-brand-accent/40 bg-brand-card hover:bg-brand-card/90 transition-all duration-300 cursor-pointer min-h-[200px] h-full group",
                          comparisonMode && selectedIds.includes(item.id)
                            ? "border-brand-accent bg-[#1c354a]/60 shadow-huge"
                            : "shadow-xl"
                        )}
                      >
                        {comparisonMode && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelection(e, item.id);
                            }}
                            className={cn(
                              "absolute top-5 left-5 w-8 h-8 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all z-25",
                              selectedIds.includes(item.id)
                                ? "bg-brand-accent border-brand-accent text-brand-text-primary"
                                : "border-white/10 hover:border-brand-accent/50 bg-[#08131d]/80"
                            )}
                          >
                            {selectedIds.includes(item.id) && <Check size={16} strokeWidth={3} />}
                          </div>
                        )}

                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-4 flex-1 min-w-0">
                            {/* Project Name Attribute */}
                            <h4 className="text-xl font-black text-white uppercase tracking-tight truncate leading-none">
                              {cleanTitle}
                            </h4>
                            {/* Industry & Startup Stage Attributes */}
                            <div className="flex flex-wrap items-center gap-2">
                              {cleanIndustry && (
                                <span className="text-[9px] font-black uppercase text-brand-accent tracking-widest bg-brand-accent/5 px-3 py-1.5 rounded-xl border border-brand-accent/10 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                                  {cleanIndustry}
                                </span>
                              )}
                              {cleanStage && (
                                <span className="text-[9px] font-black uppercase text-[#5da9ff] tracking-widest bg-[#5da9ff]/5 px-3 py-1.5 rounded-xl border border-[#5da9ff]/10 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                                  {cleanStage}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action - Delete Project Trigger */}
                          {!comparisonMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteProject(item.id);
                              }}
                              className="p-3 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer block shrink-0 z-20"
                              title="Delete Project"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        {/* Last Updated Timestamp Attribute */}
                        <div className="pt-6 border-t border-white/5 text-[11px] text-slate-300 font-mono font-bold uppercase tracking-widest">
                          {cleanTimestamp}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pitchDecks' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-[0.2em] mb-6">
                    PITCH DECKS
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-brand-text-primary uppercase font-display tracking-tight leading-none mb-6">PITCH DECKS</h2>
                  <p className="text-base text-brand-text-secondary font-medium opacity-80">Pitch presentations generated by systemic architect flow or custom workspace configurations</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Link 
                    to="/pitch-deck" 
                    className="px-10 py-5 bg-brand-accent text-brand-text-primary text-sm font-black uppercase tracking-widest rounded-3xl hover:bg-brand-accent shadow-huge hover:scale-105 active:scale-95 transition-all flex items-center gap-4 animate-pulse hover:animate-none"
                  >
                    Open Architect <Presentation size={18} strokeWidth={3} />
                  </Link>
                </div>
              </div>

              {decksLoading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6">
                  <div className="w-12 h-12 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.4em]">Synchronizing Presentations</p>
                </div>
              ) : pitchDecks.length === 0 ? (
                <div className="py-24 text-center bg-brand-section/30 rounded-[3.5rem] border border-dashed border-white/5 max-w-2xl mx-auto px-8 relative overflow-hidden backdrop-blur-xl shadow-2xl">
                  <div className="absolute inset-0 bg-brand-accent/2 blur-[100px] pointer-events-none rounded-full" />
                  <Presentation size={44} strokeWidth={1} className="mx-auto text-brand-accent mb-6 animate-pulse" />
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-4 font-display">
                    Deck Workspace Empty
                  </h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-10 font-sans">
                    A secure workspace containing every generated and stored pitch presentation. Create your first startup report or open the architect directly.
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-[#1c354a] hover:bg-brand-accent hover:text-[#08131D] text-xs font-black uppercase text-white tracking-widest rounded-2xl border border-[#5da9ff]/30 shadow-huge transition-all duration-300 hover:scale-102"
                  >
                    Start Analysis <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full box-border">
                  {pitchDecks.map((deck) => {
                    const slideCount = deck.slides?.length || 0;
                    const cleanDate = formatLastEdited(deck.updatedAt);
                    const status = deck.status || 'DRAFT';

                    return (
                      <div 
                        key={deck.id}
                        className="relative flex flex-col justify-between p-8 bg-[#102434] rounded-[2rem] border border-white/5 bg-brand-card hover:bg-brand-card/95 hover:border-brand-accent/40 shadow-xl transition-all duration-300 min-h-[220px] h-full group overflow-hidden"
                      >
                        {/* Upper hover ambient glow overlay */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-3xl group-hover:bg-brand-accent/10 transition-colors pointer-events-none" />

                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-all duration-300">
                              <Presentation size={20} />
                            </div>
                            <span className="px-3 py-1 bg-white/5 rounded-xl border border-white/10 text-[10px] text-slate-300 font-bold whitespace-nowrap">
                              {slideCount} Slides
                            </span>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xl font-black text-white uppercase tracking-tight truncate leading-none">
                              {deck.projectName}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase bg-[#5da9ff]/10 text-[#5da9ff] border border-[#5da9ff]/20">
                                {status}
                              </span>
                              <span className="text-[11px] text-brand-text-secondary font-mono font-bold tracking-wider">
                                {cleanDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions Layer */}
                        <div className="pt-6 mt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/pitch-deck?projectId=${deck.id}`}
                              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-xl transition-all font-black text-xs cursor-pointer flex items-center gap-1.5"
                              title="Open in Architect Editor"
                            >
                              <Edit3 size={13} /> EDIT
                            </Link>

                            <button
                              onClick={(e) => handleDuplicateDeck(deck, e)}
                              className="p-2.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all cursor-pointer"
                              title="Duplicate Presentation"
                            >
                              <Layers size={14} />
                            </button>

                            <button
                              onClick={(e) => handleDeleteDeck(deck.id, e)}
                              className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                              title="Delete Presentation"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Export buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            <Link
                              to={`/pitch-deck?projectId=${deck.id}&action=export_pptx`}
                              className="px-2.5 py-2 bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white rounded-xl transition-all font-black text-[10px] flex items-center gap-1"
                              title="Export to presentation package (*.pptx)"
                            >
                              <Download size={11} /> PPTX
                            </Link>
                            <Link
                              to={`/pitch-deck?projectId=${deck.id}&action=export_pdf`}
                              className="px-2.5 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-all font-black text-[10px] flex items-center gap-1"
                              title="Export to compliance layout document (*.pdf)"
                            >
                              <FileText size={11} /> PDF
                            </Link>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-black uppercase tracking-[0.2em] mb-6">
                    About Us
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white uppercase font-display tracking-tight leading-none mb-6">PROFILE</h2>
                  <p className="text-[120%] text-white font-bold uppercase">PROFILE</p>
                </div>
                {isPremium && (
                  <button 
                    onClick={() => isEditing ? handleExitEdit() : setIsEditing(true)}
                    className={cn(
                      "flex items-center gap-3 px-8 py-4 rounded-[2rem] text-xs font-bold uppercase tracking-widest transition-all duration-500 shadow-huge",
                      isEditing 
                        ? "bg-[#102434] border border-white/10 text-white hover:bg-white/5" 
                        : "bg-brand-accent border border-brand-accent text-brand-text-primary hover:scale-105 active:scale-95"
                    )}
                  >
                    {isEditing ? (
                      <>
                        <X size={16} strokeWidth={3} /> EXIT EDIT
                      </>
                    ) : (
                      <>
                        <Edit3 size={16} strokeWidth={3} /> CONFIGURE PROFILE
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
                    <div className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-6">Premium</div>
                    <h3 className="text-4xl font-black text-brand-text-primary mb-6 uppercase tracking-tight font-display leading-tight">Elite Profile</h3>
                    <p className="text-brand-text-muted text-lg mb-10 max-w-xl font-medium leading-relaxed opacity-80">
                      Unlock full tracking, team tools, and premium data.
                    </p>
                    <Link to="/pricing" className="inline-flex items-center gap-4 px-12 py-6 bg-brand-accent text-brand-text-primary font-black uppercase tracking-widest text-sm rounded-3xl hover:bg-brand-accent shadow-huge hover:scale-105 active:scale-95 transition-all">
                      Upgrade Now <ArrowRight size={22} strokeWidth={3} />
                    </Link>
                  </div>
                </div>
              ) : isEditing ? (
                <form onSubmit={handleSaveAndAnalyze} className="space-y-12 max-w-5xl">
                  {/* Basic Info Section with Matte Background and Custom Interactive Inputs */}
                  <div className="bg-[#102434] p-12 rounded-[4rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] space-y-10 relative overflow-hidden">
                    <div className="flex items-center gap-5">
                       <div className="w-2 h-8 bg-[#5da9ff] rounded-full shadow-[0_0_15px_#5da9ff]" />
                       <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-white">Profile</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* COMPANY / STARTUP NAME */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-white px-2">COMPANY / STARTUP NAME</label>
                        <div className="relative group/field">
                          <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/field:text-[#5da9ff] transition-colors" size={20} />
                          <input
                            type="text"
                            className="w-full pl-16 pr-6 py-5 bg-[#102434] border border-white/20 rounded-2xl font-bold text-white placeholder:text-slate-500 placeholder:font-medium transition-all outline-none focus:border-[#5da9ff] focus:ring-4 focus:ring-[#5da9ff]/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)] focus:shadow-[0_0_20px_rgba(93,169,255,0.35)]"
                            style={{ fontSize: '115%', color: '#ffffff' }}
                            placeholder="Enter your company"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* LOGO URL OR UPLOAD LOGO (HYBRID) */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-white px-2">LOGO URL OR UPLOAD LOGO</label>
                        <div className="relative group/field">
                          <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/field:text-[#5da9ff] transition-colors" size={20} />
                          <input
                            type="text"
                            className="w-full pl-16 pr-44 py-5 bg-[#102434] border border-white/20 rounded-2xl font-bold text-white placeholder:text-slate-500 placeholder:font-medium transition-all outline-none focus:border-[#5da9ff] focus:ring-4 focus:ring-[#5da9ff]/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)] focus:shadow-[0_0_20px_rgba(93,169,255,0.35)]"
                            style={{ fontSize: '115%', color: '#ffffff' }}
                            placeholder="Enter logo link or choose file"
                            value={companyLogo.startsWith('data:') ? 'Local Image File Loaded' : companyLogo}
                            onChange={(e) => setCompanyLogo(e.target.value)}
                          />

                          {/* Interactive File Browser and Preview Elements */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {companyLogo && (
                              <div className="flex items-center gap-1.5 bg-[#152d3f] p-1 rounded-xl border border-[#5da9ff]/30">
                                <img 
                                  src={companyLogo} 
                                  alt="Logo" 
                                  className="w-7 h-7 rounded-lg object-contain bg-white/5" 
                                  referrerPolicy="no-referrer" 
                                />
                                <button
                                  type="button"
                                  onClick={() => setCompanyLogo('')}
                                  className="text-red-400 hover:text-red-300 text-xs font-bold px-1.5 hover:bg-white/5 rounded"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                            <label className="px-3 py-2 bg-[#152d3f] border border-[#5da9ff]/30 text-[#5da9ff] hover:bg-[#5da9ff]/15 rounded-xl text-2xs font-bold uppercase tracking-widest cursor-pointer transition-all select-none">
                              Upload
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      if (typeof reader.result === 'string') {
                                        setCompanyLogo(reader.result);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* INDUSTRY / BUSINESS TYPE (SEARCHABLE DROPDOWN) */}
                      <div className="space-y-3 relative">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-white px-2">INDUSTRY / BUSINESS TYPE</label>
                        <div className="relative group/field">
                          <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/field:text-[#5da9ff] transition-colors" size={20} />
                          <input
                            type="text"
                            className="w-full pl-16 pr-12 py-5 bg-[#102434] border border-white/20 rounded-2xl font-bold text-white placeholder:text-slate-500 placeholder:font-medium transition-all outline-none focus:border-[#5da9ff] focus:ring-4 focus:ring-[#5da9ff]/20 shadow-[0_0_20px_rgba(93,169,255,0.35)]"
                            style={{ fontSize: '115%', color: '#ffffff' }}
                            placeholder="Search or type industry"
                            value={industry}
                            onChange={(e) => {
                              setIndustry(e.target.value);
                              setIsIndustryFocused(true);
                            }}
                            onFocus={() => setIsIndustryFocused(true)}
                            onBlur={() => setTimeout(() => setIsIndustryFocused(false), 200)}
                          />
                          <ChevronDown 
                            size={16} 
                            className={cn(
                              "absolute right-6 top-1/2 -translate-y-1/2 text-white/30 transition-transform duration-300 pointer-events-none",
                              isIndustryFocused && "rotate-180 text-[#5da9ff]"
                            )} 
                          />
                        </div>

                        {/* Dropdown Options matching Fintech, Fashion, Healthcare, AI */}
                        {isIndustryFocused && (
                          <div className="absolute left-0 right-0 top-[105%] bg-[#102434] border border-[#5da9ff]/45 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                            {["Fintech", "Fashion", "Healthcare", "AI", "SaaS Platform", "E-commerce", "CleanTech", "EdTech", "Biotech", "Web3 Systems"]
                              .filter(item => !industry || item.toLowerCase().includes(industry.toLowerCase()))
                              .map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  className="w-full text-left px-6 py-4 text-white hover:bg-[#152d3f] hover:text-[#5da9ff] font-bold transition-colors border-b border-white/5 last:border-0"
                                  style={{ fontSize: '105%' }}
                                  onMouseDown={() => {
                                    setIndustry(item);
                                    setIsIndustryFocused(false);
                                  }}
                                >
                                  {item.toUpperCase()}
                                </button>
                              ))}
                            {["Fintech", "Fashion", "Healthcare", "AI", "SaaS Platform", "E-commerce", "CleanTech", "EdTech", "Biotech", "Web3 Systems"]
                              .filter(item => !industry || item.toLowerCase().includes(industry.toLowerCase())).length === 0 && (
                              <div className="px-6 py-4 text-white/40 text-xs uppercase tracking-widest text-center">
                                No industries matched
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* LOCATION (GEO-PREDICTIVE SUGGESTIONS) */}
                      <div className="space-y-3 relative">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-white px-2">LOCATION</label>
                        <div className="relative group/field">
                          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/field:text-[#5da9ff] transition-colors" size={20} />
                          <input
                            type="text"
                            className={cn(
                              "w-full pl-16 pr-6 py-5 bg-[#102434] border rounded-2xl font-bold text-white placeholder:text-slate-500 placeholder:font-medium transition-all outline-none",
                              isLocationPulsing
                                ? "border-[#5da9ff] ring-4 ring-[#5da9ff]/40 shadow-[0_0_25px_rgba(93,169,255,0.7)] animate-pulse"
                                : "border-white/20 focus:border-[#5da9ff] focus:ring-4 focus:ring-[#5da9ff]/20 shadow-[0_0_20px_rgba(93,169,255,0.35)]"
                            )}
                            style={{ fontSize: '115%', color: '#ffffff' }}
                            placeholder="e.g DUBAI UAE"
                            value={location}
                            onChange={(e) => {
                              setLocation(e.target.value.toUpperCase());
                              setIsLocationFocused(true);
                            }}
                            onFocus={() => setIsLocationFocused(true)}
                            onBlur={() => setTimeout(() => setIsLocationFocused(false), 200)}
                          />
                        </div>

                        {/* Geo-Predictive list of premium hub locations without full stops in ALL CAPS */}
                        {isLocationFocused && (
                          <div className="absolute left-0 right-0 top-[105%] bg-[#102434] border border-[#5da9ff]/45 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                            {[
                              "DUBAI UAE",
                              "RIYADH SAUDI ARABIA",
                              "ABU DHABI UAE",
                              "MANAMA BAHRAIN",
                              "AL KHOBAR SAUDI ARABIA",
                              "JEDDAH SAUDI ARABIA",
                              "DOHA QATAR",
                              "KUWAIT CITY KUWAIT",
                              "CAIRO EGYPT",
                              "SINGAPORE",
                              "NEW YORK USA",
                              "TOKYO JAPAN",
                              "BERLIN GERMANY",
                              "PARIS FRANCE",
                              "SAN FRANCISCO USA",
                              "LONDON UK",
                              "AMSTERDAM NETHERLANDS",
                              "TORONTO CANADA",
                              "MUMBAI INDIA",
                              "SYDNEY AUSTRALIA",
                              "SAO PAULO BRAZIL",
                              "SHANGHAI CHINA",
                              "HONG KONG",
                              "SEOUL SOUTH KOREA",
                              "AUSTIN USA",
                              "BOSTON USA",
                              "LOS ANGELES USA",
                              "CHICAGO USA",
                              "SEATTLE USA",
                              "STOCKHOLM SWEDEN",
                              "ZURICH SWITZERLAND",
                              "GENEVA SWITZERLAND",
                              "DUBLIN IRELAND",
                              "MUNICH GERMANY",
                              "FRANKFURT GERMANY",
                              "BARCELONA SPAIN",
                              "MADRID SPAIN"
                            ]
                              .filter(loc => !location || loc.toLowerCase().includes(location.toLowerCase()))
                              .map((loc) => (
                                <button
                                  key={loc}
                                  type="button"
                                  className="w-full text-left px-6 py-4 text-white hover:bg-[#1c354a] hover:text-[#5da9ff] hover:shadow-[0_0_15px_rgba(93,169,255,0.25)] font-bold transition-all border-b border-white/5 last:border-0 flex items-center gap-3.5 select-none"
                                  style={{ fontSize: '105%' }}
                                  onMouseDown={() => {
                                    setLocation(loc);
                                    setIsLocationFocused(false);
                                    setIsLocationPulsing(true);
                                    setTimeout(() => {
                                      setIsLocationPulsing(false);
                                    }, 1000);
                                  }}
                                >
                                  <MapPin size={14} className="text-[#5da9ff]/60" />
                                  <span className="whitespace-nowrap truncate">{loc}</span>
                                </button>
                              ))}

                            {/* MANUAL ENTRYOPTION AT THE BOTTOM */}
                            <button
                              type="button"
                              className="w-full text-left px-6 py-4 text-white hover:bg-[#1c354a] hover:text-[#5da9ff] hover:shadow-[0_0_15px_rgba(93,169,255,0.25)] font-bold transition-all flex items-center gap-3.5 select-none"
                              style={{ fontSize: '105%' }}
                              onMouseDown={() => {
                                setLocation("");
                                setIsLocationFocused(false);
                                setIsLocationPulsing(true);
                                setTimeout(() => {
                                  setIsLocationPulsing(false);
                                }, 1000);
                              }}
                            >
                              <MapPin size={14} className="text-[#5da9ff]/60" />
                              <span className="whitespace-nowrap truncate">OTHER (SPECIFY LOCATION)</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* BUSINESS STAGE (MULTI-CHOICE TABS) */}
                      <div className="md:col-span-2 space-y-6">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-white px-2">BUSINESS STAGE</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2 bg-[#102434] rounded-[2.5rem] border border-white/10">
                          {STARTUP_STAGES.map((stage) => (
                            <button
                              key={stage}
                              type="button"
                              onClick={() => setStartupStage(stage)}
                              className={cn(
                                "py-4 rounded-[1.5rem] text-xs font-bold uppercase tracking-widest transition-all duration-500 relative overflow-hidden group border",
                                startupStage === stage 
                                  ? "bg-[#254d74] border-[#5da9ff] text-white shadow-[0_0_20px_rgba(93,169,255,0.45)]" 
                                  : "bg-transparent border-transparent text-white/60 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <span className="relative z-10">{stage.toUpperCase().replace(/\./g, '')}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* BUSINESS DESCRIPTION (LARGE TEXTAREA BOX WITH CHARACTER LIMIT) */}
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <label className="text-xs font-bold uppercase tracking-[0.2em] text-white">BUSINESS DESCRIPTION</label>
                          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                            {companyDescription?.length || 0} / 500 characters
                          </span>
                        </div>
                        <div className="relative group/field">
                          <textarea
                            className="w-full px-8 py-6 bg-[#102434] border border-white/20 rounded-2xl font-bold h-40 text-white placeholder:text-slate-500 placeholder:font-medium transition-all outline-none focus:border-[#5da9ff] focus:ring-4 focus:ring-[#5da9ff]/20 shadow-[0_0_20px_rgba(93,169,255,0.35)] resize-none leading-relaxed"
                            style={{ fontSize: '115%', color: '#ffffff' }}
                            placeholder="Describe your startup business idea product or services in detail"
                            value={companyDescription}
                            maxLength={500}
                            onChange={(e) => setCompanyDescription(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Model Section */}
                  <div className="bg-[#102434] p-12 rounded-[4rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] space-y-10 relative overflow-hidden">
                    <div className="flex items-center gap-5">
                       <div className="w-2 h-8 bg-[#5da9ff] rounded-full shadow-[0_0_15px_#5da9ff]" />
                       <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-white" style={{ fontSize: '115%', color: '#ffffff' }}>REVENUE SYSTEM</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* REVENUE STREAM (SEARCHABLE DROPDOWN) */}
                      <div className="space-y-3 relative">
                        <label className="text-xs uppercase tracking-[0.2em] text-white px-2 font-medium" style={{ fontSize: '115%', color: '#ffffff' }}>REVENUE STREAM</label>
                        <div className="relative group/field">
                          <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/field:text-[#5da9ff] transition-colors" size={20} />
                          <input
                            type="text"
                            className="w-full pl-16 pr-12 py-5 bg-[#102434] border border-white/20 rounded-2xl font-bold text-white placeholder:text-slate-500 placeholder:font-medium transition-all outline-none focus:border-[#5da9ff] focus:ring-4 focus:ring-[#5da9ff]/20 shadow-[0_0_20px_rgba(93,169,255,0.35)]"
                            style={{ fontSize: '115%', color: '#ffffff' }}
                            placeholder="Choose revenue model or type custom style"
                            value={businessType}
                            onChange={(e) => {
                              setBusinessType(e.target.value as any);
                              setIsMonetizationFocused(true);
                            }}
                            onFocus={() => setIsMonetizationFocused(true)}
                            onBlur={() => setTimeout(() => setIsMonetizationFocused(false), 200)}
                          />
                          <ChevronDown 
                            size={16} 
                            className={cn(
                              "absolute right-6 top-1/2 -translate-y-1/2 text-white/30 transition-transform duration-300 pointer-events-none",
                              isMonetizationFocused && "rotate-180 text-[#5da9ff]"
                            )} 
                          />
                        </div>

                        {/* Dropdown Options for Monetization Engine */}
                        {isMonetizationFocused && (
                          <div className="absolute left-0 right-0 top-[105%] bg-[#102434] border border-[#5da9ff]/45 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                            {["B2B", "B2C", "Subscription", "Marketplace", "Freemium", "Commission", "Direct Sales", "Ad-supported", "Transaction fee"]
                              .filter(item => !businessType || item.toLowerCase().includes(businessType.toLowerCase()))
                              .map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  className="w-full text-left px-6 py-4 text-white hover:bg-[#152d3f] hover:text-[#5da9ff] font-bold transition-colors border-b border-white/5 last:border-0"
                                  style={{ fontSize: '105%' }}
                                  onMouseDown={() => {
                                    setBusinessType(item as any);
                                    setIsMonetizationFocused(false);
                                  }}
                                >
                                  {item.toUpperCase()}
                                </button>
                              ))}
                            {["B2B", "B2C", "Subscription", "Marketplace", "Freemium", "Commission", "Direct Sales", "Ad-supported", "Transaction fee"]
                              .filter(item => !businessType || item.toLowerCase().includes(businessType.toLowerCase())).length === 0 && (
                              <div className="px-6 py-4 text-white/40 text-xs uppercase tracking-widest text-center">
                                Use your typed model
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* PRODUCT ARCHITECTURE (SELECTABLE LIST DROPDOWN) */}
                      <div className="space-y-3 relative">
                        <label className="text-xs uppercase tracking-[0.2em] text-white px-2 font-medium" style={{ fontSize: '115%', color: '#ffffff' }}>PRODUCT ARCHITECTURE</label>
                        <div className="relative group/field">
                          <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/field:text-[#5da9ff] transition-colors" size={20} />
                          <input
                            type="text"
                            className="w-full pl-16 pr-12 py-5 bg-[#102434] border border-white/20 rounded-2xl font-bold text-white placeholder:text-slate-500 placeholder:font-medium transition-all outline-none focus:border-[#5da9ff] focus:ring-4 focus:ring-[#5da9ff]/20 shadow-[0_0_20px_rgba(93,169,255,0.35)]"
                            style={{ fontSize: '115%', color: '#ffffff' }}
                            placeholder="Choose product architecture or type custom style"
                            value={productType}
                            onChange={(e) => {
                              setProductType(e.target.value as any);
                              setIsProductFocused(true);
                            }}
                            onFocus={() => setIsProductFocused(true)}
                            onBlur={() => setTimeout(() => setIsProductFocused(false), 200)}
                          />
                          <ChevronDown 
                            size={16} 
                            className={cn(
                              "absolute right-6 top-1/2 -translate-y-1/2 text-white/30 transition-transform duration-300 pointer-events-none",
                              isProductFocused && "rotate-180 text-[#5da9ff]"
                            )} 
                          />
                        </div>

                        {/* Dropdown Options for Product Architecture */}
                        {isProductFocused && (
                          <div className="absolute left-0 right-0 top-[105%] bg-[#102434] border border-[#5da9ff]/45 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                            {["SaaS Platform", "Marketplace", "Service-Based", "Mobile App", "Hardware", "API Tool", "On-Premise Software", "E-commerce Platform"]
                              .filter(item => !productType || item.toLowerCase().includes(productType.toLowerCase()))
                              .map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  className="w-full text-left px-6 py-4 text-white hover:bg-[#152d3f] hover:text-[#5da9ff] font-bold transition-colors border-b border-white/5 last:border-0"
                                  style={{ fontSize: '105%' }}
                                  onMouseDown={() => {
                                    setProductType(item as any);
                                    setIsProductFocused(false);
                                  }}
                                >
                                  {item.toUpperCase()}
                                </button>
                              ))}
                            {["SaaS Platform", "Marketplace", "Service-Based", "Mobile App", "Hardware", "API Tool", "On-Premise Software", "E-commerce Platform"]
                              .filter(item => !productType || item.toLowerCase().includes(productType.toLowerCase())).length === 0 && (
                              <div className="px-6 py-4 text-white/40 text-xs uppercase tracking-widest text-center">
                                Use your typed structure
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* BRIEFING LINK (PITCH DECK) (ACTIVE URL INPUT) */}
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-xs uppercase tracking-[0.2em] text-white px-2 font-medium" style={{ fontSize: '115%', color: '#ffffff' }}>BRIEFING LINK (PITCH DECK)</label>
                        <div className="relative group/field">
                          <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/field:text-[#5da9ff] transition-colors" size={20} />
                          <input
                            type="url"
                            className="w-full pl-16 pr-6 py-5 bg-[#102434] border border-white/20 rounded-2xl font-bold text-white placeholder:text-slate-500 placeholder:font-medium transition-all outline-none focus:border-[#5da9ff] focus:ring-4 focus:ring-[#5da9ff]/20 shadow-[0_0_20px_rgba(93,169,255,0.35)]"
                            style={{ fontSize: '115%', color: '#ffffff' }}
                            placeholder="Enter briefing URL link"
                            value={pitchDeckUrl}
                            onChange={(e) => setPitchDeckUrl(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* EDITING CONTROLS inside the Economic Framework section */}
                    <div className="flex flex-wrap items-center justify-end gap-4 mt-6 pt-6 border-t border-white/5">
                      <button
                        type="button"
                        onClick={handleExitEdit}
                        className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-[#5da9ff] hover:bg-white/5 transition-all text-center select-none"
                      >
                        ABORT EDIT
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-3 rounded-full bg-[#5da9ff] hover:bg-[#5da9ff]/85 text-black text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(93,169,255,0.3)] transition-all text-center select-none"
                      >
                        SAVE & ANALYZE
                      </button>
                    </div>
                  </div>

                  {/* Deep Details Section */}
                  <div className="bg-[#102434] p-12 rounded-[4rem] border border-white/10 shadow-huge space-y-14 relative overflow-hidden">
                    <div className="flex items-center gap-5">
                       <div className="w-2 h-8 bg-brand-accent rounded-full shadow-glow" />
                       <h3 className="text-sm font-bold uppercase tracking-[0.4em] text-white">Our Plan</h3>
                    </div>
                    <div className="space-y-12">
                      <div className="space-y-5">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-white px-2">STORY (DETAILED)</label>
                        <textarea
                          className="w-full px-10 py-10 bg-[#102434] border border-white/20 rounded-[2.5rem] text-base font-bold h-64 focus:border-brand-accent/50 focus:ring-0 transition-all resize-none text-white outline-none leading-relaxed"
                          placeholder="Articulate your vision and competitive moats"
                          value={companyDescription}
                          onChange={(e) => setCompanyDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-5">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-white px-2">PITCH (ELEVATOR)</label>
                        <textarea
                          className="w-full px-10 py-10 bg-[#102434] border border-white/20 rounded-[2rem] text-base font-bold h-40 focus:border-brand-accent/50 focus:ring-0 transition-all resize-none text-white outline-none leading-relaxed"
                          placeholder="Synthesize your business into a high-impact thesis"
                          value={pitchSummary}
                          onChange={(e) => setPitchSummary(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-5">
                          <label className="text-xs font-bold uppercase tracking-[0.2em] text-white px-2">FOUNDER & EXPERIENCE</label>
                          <textarea
                            className="w-full px-10 py-10 bg-[#102434] border border-white/20 rounded-[2.5rem] text-base font-bold h-64 focus:border-brand-accent/50 focus:ring-0 transition-all resize-none text-white outline-none leading-relaxed"
                            placeholder="Who leads this venture? Detail their relevant experience and expertise"
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
                                  <label className="text-xs font-black uppercase text-brand-text-muted tracking-[0.2em] px-1">Role</label>
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
                                  className="w-full bg-brand-section/50 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-brand-text-muted focus:text-white focus:border-brand-accent/50 outline-none transition-all cursor-pointer"
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
                                <label className="text-[9px] font-black uppercase text-brand-text-muted tracking-[0.2em] px-1">Bio</label>
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
                              <p className="text-xl font-black text-brand-text-muted uppercase tracking-tighter mb-4">Leadership Missing</p>
                              <p className="text-base text-slate-300 max-w-xs mx-auto mb-10 font-medium tracking-[0.02em] opacity-95">No institutional personnel have been indexed for this venture</p>
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
                                className="px-8 py-4 bg-brand-accent text-brand-text-primary text-[10px] font-black uppercase tracking-widest rounded-3xl hover:bg-brand-accent shadow-huge hover:scale-105 active:scale-95 transition-all"
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

                  <div className="flex flex-wrap items-center justify-end gap-6 sticky bottom-10 z-20 bg-brand-bg/80 backdrop-blur-2xl p-6 rounded-[3rem] border border-white/10 shadow-huge">
                    <button
                      type="button"
                      onClick={handleExitEdit}
                      className="px-10 py-5 text-[#5da9ff] text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                    >
                      EXIT EDIT
                    </button>
                    <button
                      type="submit"
                      disabled={updating || analyzing}
                      className="px-12 py-5 bg-brand-accent text-brand-text-primary text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-brand-accent shadow-[0_0_20px_rgba(93,169,255,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-3"
                    >
                      {updating || analyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-brand-text-primary border-t-transparent rounded-full animate-spin" />
                          ANALYZING VENTURE...
                        </>
                      ) : (
                        "SAVE & ANALYZE"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-16 animate-in slide-in-from-bottom-6 duration-1000 pb-32">
                  {/* Company Identity Profile Header */}
                  <div className="relative bg-[#102434] rounded-[4rem] border border-white/5 overflow-hidden shadow-huge">
                    <div className="h-64 bg-[#102434] relative overflow-hidden">
                       <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                       <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-brand-purple/5" />
                       <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#102434] to-transparent" />
                    </div>
                    <div className="px-10 md:px-16 pb-16 relative">
                       {/* Identity Mark */}
                       <div className="absolute -top-24 left-10 md:left-16 w-48 h-48 bg-[#102434] rounded-[3rem] p-1 border-[12px] border-[#102434] shadow-huge flex items-center justify-center overflow-hidden">
                          {profile?.companyLogo ? (
                             <img src={profile.companyLogo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                             <div className="w-full h-full bg-[#102434] flex items-center justify-center text-brand-accent font-black text-6xl font-display italic">
                                {profile?.companyName ? profile.companyName.charAt(0).toUpperCase() : <Building2 size={72} className="opacity-10" />}
                             </div>
                          )}
                       </div>
                       
                       <div className="pt-28 flex flex-col md:flex-row md:items-end justify-between gap-12">
                          <div className="space-y-6 flex-1">
                             <div className="flex flex-wrap items-center gap-4">
                               <div className="flex flex-col gap-2">
                                 <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter font-display uppercase leading-none">{(profile?.companyName || 'COMPANY NAME').toUpperCase().replace(/\./g, '')}</h1>
                                 <p className="text-xs font-bold tracking-[0.25em] text-[#5da9ff] uppercase">VENTURE ANALYSIS</p>
                               </div>
                               <div className="px-4 py-1.5 bg-white/10 border border-white/20 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-full">
                                 {isPremium ? 'PREMIUM' : 'STANDARD'}
                               </div>
                             </div>
                             <p className="text-base md:text-lg text-white max-w-3xl leading-relaxed opacity-95 font-sans">
                               A detailed summary of the business strategy and growth plan
                             </p>
                             <div className="flex flex-wrap items-center gap-x-12 gap-y-4 pt-10 border-t border-white/5">
                                <span className="flex items-center gap-4 text-xs font-black text-white uppercase tracking-[0.2em]">
                                   <Briefcase size={20} className="text-[#5da9ff]/80" /> {(profile?.industry || 'PRIVATE').toUpperCase().replace(/\./g, '')}
                                </span>
                                <span className="flex items-center gap-4 text-xs font-black text-white uppercase tracking-[0.2em]">
                                   <MapPin size={20} className="text-[#5da9ff]/80" /> {(profile?.location || 'HIDDEN').toUpperCase().replace(/\./g, '')}
                                </span>
                                <div className="h-4 w-px bg-white/10 hidden md:block" />
                                <span className="flex items-center gap-4 text-xs font-black text-white uppercase tracking-[0.2em]">
                                   <Rocket size={20} className="text-[#5da9ff]" /> {(profile?.startupStage || 'EARLY STAGE').toUpperCase().replace(/\./g, '')}
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
                                  className="px-10 py-5 bg-[#102434] border border-white/10 text-white rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-white/5 transition-all shadow-huge"
                                >
                                   <FileText size={20} className="text-[#5da9ff]" /> PITCH DECK
                                </motion.a>
                             )}
                             <motion.button 
                               whileHover={{ scale: 1.02 }}
                               whileTap={{ scale: 0.98 }}
                               onClick={() => setIsEditing(true)}
                               className="px-10 py-5 bg-brand-accent border border-brand-accent text-white rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 shadow-huge hover:bg-brand-accent"
                             >
                                <Settings size={20} className="text-white" /> EDIT PROFILE
                             </motion.button>
                          </div>
                       </div>
                    </div>
                  </div>



                   {profile?.companyAnalysis && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                       {/* Print Only Title */}
                       <div className="hidden print:block mb-16 pt-16 border-t border-neutral-900">
                          <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 text-neutral-950">{profile.companyName}</h1>
                          <p className="text-2xl font-bold text-neutral-500 uppercase tracking-widest">Venture Analytics</p>
                       </div>

                       {/* 1. EXECUTIVE SUMMARY & INSIGHTS */}
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                       </div>

 

                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                       </div>

                      </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                       {/* Team Section */}
                       <section className="bg-brand-section p-10 rounded-[3rem] border border-brand-border/10 shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[100px] rounded-full pointer-events-none" />
                          <h3 className="text-xl font-black text-brand-text-primary mb-8 uppercase tracking-tight flex items-center gap-3">
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
                                       <h4 className="text-lg font-bold text-brand-text-primary group-hover:text-brand-accent transition-colors">
                                         {member.name || 'Unnamed Member'}
                                       </h4>
                                       <div className="flex items-center gap-2 mt-1">
                                         <span className="px-2 py-0.5 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[9px] font-black uppercase tracking-widest rounded-lg">
                                           {member.role}
                                         </span>
                                         <span className="text-[10px] font-bold text-brand-text-secondary">
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
                                   
                                   <p className="text-xs text-brand-text-secondary leading-relaxed line-clamp-3">
                                     {member.background}
                                   </p>
                                 </motion.div>
                               ))
                             ) : (
                               <div className="md:col-span-2 p-8 border border-dashed border-brand-border/20 rounded-3xl text-center">
                                 <p className="text-base text-slate-300 font-medium tracking-[0.02em] opacity-95 italic">No team members added to profile</p>
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
                              <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-4">Founder DNA</h4>
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
                             <div className="space-y-8">
                                <div className="flex justify-between items-end border-b border-brand-border/20 pb-4">
                                   <div>
                                      <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Status</p>
                                      <p className="font-black text-xl text-brand-text-primary">
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
                                      <li key={pIdx} className="flex gap-4 text-xl font-bold text-neutral-800">
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
                                      <p className="text-[10px] font-black uppercase mb-3 tracking-[0.3em] opacity-70">Strategic Proof Point</p>
                                      <div className="flex items-baseline gap-3">
                                         <span className="text-5xl font-black text-neutral-900">
                                            {slide.metric.value}
                                         </span>
                                         <span className="text-lg font-black opacity-60">
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
                                   <p className="text-neutral-600 text-xl font-medium leading-relaxed max-w-sm">
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
                               updateDoc(doc(db, 'profiles', user.uid), { 
                                 'pitchDeck.slides': newSlides,
                                 updatedAt: serverTimestamp()
                               });
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
                                       className="bg-transparent border-none focus:outline-none w-full text-xl font-bold text-neutral-900 placeholder:text-neutral-300"
                                       value={point}
                                       placeholder="Bullet point (6-10 words)..."
                                       onChange={(e) => {
                                         const newSlides = [...profile.pitchDeck!.slides];
                                         newSlides[currentSlide].points[idx] = e.target.value;
                                         updateDoc(doc(db, 'profiles', user.uid), { 
                                           'pitchDeck.slides': newSlides,
                                           updatedAt: serverTimestamp()
                                         });
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
                                 <p className="text-[11px] font-black uppercase mb-4 tracking-[0.4em] opacity-70">Strategic Proof Point</p>
                                 <div className="flex items-baseline gap-4">
                                    <span className="text-6xl font-black text-neutral-950">
                                       {currentSlideData.metric.value}
                                    </span>
                                    <span className="text-xl font-black opacity-60">
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
                                <p className="text-[11px] font-black uppercase text-brand-accent/60 mb-3 tracking-[0.25em]">Strategic Guardrail</p>
                                <p className="text-lg font-bold text-neutral-900 leading-relaxed">
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
                    <div className="text-[11px] font-black text-neutral-400 tracking-[0.5em] uppercase mb-3">
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
                        <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-1">Asset Portability</p>
                        <p className="text-sm text-neutral-400 font-medium tracking-[0.02em] opacity-95">Export optimized for 16:9 PDF format</p>
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