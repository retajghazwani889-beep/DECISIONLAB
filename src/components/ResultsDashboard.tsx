import { AnalysisReport, UserProfile } from '../types';
import FounderTimeline from './FounderTimeline';
import TeamLabPanel from './TeamLabPanel';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Zap, Download, Target, Shield, MapPin, Briefcase, Activity, 
  ChevronRight, X, Edit3, CheckCircle2, Globe, Rocket, Info, ShieldAlert,
  Wand2, Image as ImageIcon, Loader2, BarChart3, PieChart, TrendingUp,
  Layers, Presentation, FileText, LayoutGrid, ShieldCheck, Building2, Handshake, User, Users} from 'lucide-react';
import { cn, withOklchHtml2CanvasPatch } from '../lib/utils';
import { StartupScoreRadar, RiskEcosystemMap, StrategicExpansionJourney, InvestorRelationshipNetwork, RiskHeatmap } from './ReportVisuals';
import { doc, updateDoc, serverTimestamp, getDoc, query, collection, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateCompanyAnalysis } from '../services/geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { INDUSTRIES, STARTUP_STAGES, PRODUCT_TYPES, BUSINESS_TYPES } from '../constants';
import InvestorPlaybookView from './InvestorPlaybookView';
import { hasAccess } from '../lib/tiers';

const extractIdeaSnippet = (ideaDescription: string): string => {
  if (!ideaDescription) return '';
  const cleaned = ideaDescription.trim().replace(/\s+/g, ' ');
  const words = cleaned.split(' ').slice(0, 10).join(' ');
  return words.replace(/\.$/, '');
};

const generateInvestorMatches = (
  country: string,
  city: string,
  industry: string,
  businessType: string,
  stage: string,
  vScore: number,
  ideaDescription: string = ''
) => {
  const cleanCountry = (country || 'Bahrain').trim().toLowerCase();
  const cleanCity = (city || 'Manama').trim();
  const cleanIndustry = (industry || 'Technology').trim();
  const cleanModel = (businessType || 'B2B').trim();
  const cleanStage = (stage || 'Idea Stage').trim();
  const ideaSnippet = extractIdeaSnippet(ideaDescription);
  const ideaPhrase = ideaSnippet ? ` Specifically drawn to the "${ideaSnippet}" concept.` : '';

  const pool: any[] = [];
  const stripPeriods = (s: string) => s.replace(/\./g, '');

  if (cleanCountry.includes('bahrain')) {
    pool.push(
      {
        id: 'bh_angel_1',
        name: 'Tenmou Angels Network',
        type: 'Angel Investor',
        category: 'angels',
        checkSize: '$50K–$150K',
        industryFocus: `${cleanIndustry} Segment`,
        stageFocus: 'Pre-Seed & Seed Focus',
        country: 'Bahrain',
        region: 'Manama Bahrain',
        matchScore: Math.min(100, Math.round(vScore + 10)),
        thesis: `Bahrain first business angels network backing high-caliber founders leveraging ${cleanModel} to capture regional GCC growth opportunities with your high startup score of ${vScore}%.${ideaPhrase}`,
        pitchAdvice: `Demonstrate commercial viability in Bahrain first then show a clear scale model for Eastern Province Saudi and the wider GCC`
      },
      {
        id: 'bh_acc_1',
        name: 'Hope Ventures',
        type: 'Accelerator & Fund',
        category: 'accelerators',
        checkSize: '$100K–$250K',
        industryFocus: `${cleanIndustry} Founders`,
        stageFocus: 'Idea to MVP Stage',
        country: 'Bahrain',
        region: 'GCC Region',
        matchScore: Math.min(100, Math.round(vScore + 12)),
        thesis: `Dynamic investor co-matching capital with regional angels to scale promising ${cleanIndustry} innovations presenting strong metrics of ${vScore}% concept strength.${ideaPhrase}`,
        pitchAdvice: `Pitch with high passion and articulate how hope and regional support can unlock expansion paths across Saudi Arabia`
      },
      {
        id: 'bh_family_1',
        name: 'Osool Generational Partners',
        type: 'Family Office',
        category: 'family',
        checkSize: '$500K–$1500K',
        industryFocus: `Enterprise Software & ${cleanIndustry}`,
        stageFocus: 'Late Seed to Series A',
        country: 'Bahrain',
        region: 'Bahrain & US Markets',
        matchScore: Math.min(100, Math.round(vScore + 5)),
        thesis: `Managing institutional and private generational capital targeting high-yield ${cleanModel} models with robust protective margins against competitor erosion.${ideaPhrase}`,
        pitchAdvice: `Focus on cash flow projections unit economics and detailed legal structuring in Bahrain`
      },
      {
        id: 'bh_vc_1',
        name: 'Al Waha Fund of Funds',
        type: 'Venture Capital',
        category: 'vcs',
        checkSize: '$1M–$5M',
        industryFocus: `${cleanIndustry} & FinTech`,
        stageFocus: 'Seed to Growth',
        country: 'Bahrain',
        region: 'GCC and Jordan Focus',
        matchScore: Math.min(100, Math.round(vScore + 7)),
        thesis: `Strategic capital booster supporting funds and leading startups that build local digital talent in the ${cleanIndustry} space.${ideaPhrase}`,
        pitchAdvice: `Highlight structural defensibility and local Job creation indexes in Bahrain`
      },
      {
        id: 'ksa_vc_1',
        name: 'STV Capital Spark',
        type: 'Venture Capital',
        category: 'vcs',
        checkSize: '$500K–$2M',
        industryFocus: `Tech Scale & ${cleanIndustry}`,
        stageFocus: 'Seed to Series A',
        country: 'Saudi Arabia',
        region: 'GCC Regional Expansion',
        matchScore: Math.min(100, Math.round(vScore + 6)),
        thesis: `The largest venture capital fund in the GCC backing ambitious regional founders who are scaling to Saudi Arabia with a high startup score of ${vScore}%.${ideaPhrase}`,
        pitchAdvice: `Show strict regional market adoption metrics and deep alignment with digital priorities`
      },
      {
        id: 'global_acc_1',
        name: 'Flat6Labs Manama Hub',
        type: 'Accelerator',
        category: 'accelerators',
        checkSize: '$100K–$150K',
        industryFocus: `General Tech & ${cleanIndustry}`,
        stageFocus: 'Idea Stage & Prototype',
        country: 'Bahrain',
        region: 'GCC Network',
        matchScore: Math.min(100, Math.round(vScore + 8)),
        thesis: `Leading regional startup program and seed fund running localized cohorts to catalyze tech execution and network growth.${ideaPhrase}`,
        pitchAdvice: `Ensure prototype is interactive and share user feedback surveys showcasing competitive advantage`
      }
    );
  } else if (cleanCountry.includes('saudi') || cleanCountry.includes('ksa')) {
    pool.push(
      {
        id: 'sa_vc_1',
        name: 'Shorooq Partners Riyadh',
        type: 'Venture Capital',
        category: 'vcs',
        checkSize: '$500K–$2.5M',
        industryFocus: `${cleanIndustry} Innovations`,
        stageFocus: 'Seed to Series A',
        country: 'Saudi Arabia',
        region: 'Riyadh Saudi Arabia',
        matchScore: Math.min(100, Math.round(vScore + 11)),
        thesis: `Backing top tier early stage founders building next generation ${cleanModel} platforms across the Middle East who exhibit a prime rating of ${vScore}%.${ideaPhrase}`,
        pitchAdvice: `Demonstrate a robust go-to-market model for corporate customers in Saudi Arabia and regional markets`
      },
      {
        id: 'sa_strat_1',
        name: 'Aramco Wa\'ed Ventures',
        type: 'Corporate Venture Capital',
        category: 'strategic',
        checkSize: '$1M–$5M',
        industryFocus: `Deep Tech & ${cleanIndustry}`,
        stageFocus: 'Seed to Series B',
        country: 'Saudi Arabia',
        region: 'Dhahran Saudi Arabia',
        matchScore: Math.min(100, Math.round(vScore + 13)),
        thesis: `Strategic capital from Wa'ed Ventures seeking breakthrough technologies in ${cleanIndustry} that enhance industrial workflow capabilities.${ideaPhrase}`,
        pitchAdvice: `Align your product pitch with Saudi Vision 2030 digital localization initiatives`
      },
      {
        id: 'sa_acc_1',
        name: 'Misk Accelerator',
        type: 'Accelerator',
        category: 'accelerators',
        checkSize: '$150K Funding',
        industryFocus: `${cleanIndustry} Cohorts`,
        stageFocus: 'Idea & Prototype Stage',
        country: 'Saudi Arabia',
        region: 'Riyadh Saudi Arabia',
        matchScore: Math.min(100, Math.round(vScore + 12)),
        thesis: `A premier cohort pairing non-dilutive and seed funding with elite global advisory mentors for high-potential startups showing ${vScore}% scores.${ideaPhrase}`,
        pitchAdvice: `Present a highly professional founder story with explicit focus on commercializing inside Saudi Arabia`
      },
      {
        id: 'sa_family_1',
        name: 'Al Rajhi Capital Partners',
        type: 'Family Office',
        category: 'family',
        checkSize: '$1M–$3M',
        industryFocus: `${cleanModel} Systems`,
        stageFocus: 'Late Seed through Series A',
        country: 'Saudi Arabia',
        region: 'Riyadh Saudi Arabia',
        matchScore: Math.min(100, Math.round(vScore + 9)),
        thesis: `Allocating generational private capital toward software platforms and ${cleanIndustry} systems showing strong compound margins and robust unit cashflows.${ideaPhrase}`,
        pitchAdvice: `Present a clean and highly structured equity table with clear financial allocation strategies`
      },
      {
        id: 'sa_vc_2',
        name: 'Sanabil 500 GCC',
        type: 'Venture Capital',
        category: 'vcs',
        checkSize: '$100K–$300K',
        industryFocus: `Scale & ${cleanIndustry}`,
        stageFocus: 'Pre-Seed and Seed Focus',
        country: 'Saudi Arabia',
        region: 'GCC Regional Markets',
        matchScore: Math.min(100, Math.round(vScore + 8)),
        thesis: `Early-stage acceleration funding powered by Sanabil and 500 Global for high-velocity software ideas focused on rapid user expansion.${ideaPhrase}`,
        pitchAdvice: `Focus on consumer activation rates or rapid traction metrics demonstrating natural viral scale`
      },
      {
        id: 'sa_family_2',
        name: 'Olayan Investment Group',
        type: 'Family Office',
        category: 'family',
        checkSize: '$1M–$4M',
        industryFocus: `Diversified Tech`,
        stageFocus: 'Seed to Late Stage',
        country: 'Saudi Arabia',
        region: 'Global & GCC Focus',
        matchScore: Math.min(100, Math.round(vScore + 5)),
        thesis: `Generational investment office investing globally in defense-oriented technologies and scalable software layouts with clear margins.${ideaPhrase}`,
        pitchAdvice: `Stress execution safety metrics and your defensive IP positioning`
      }
    );
  } else if (cleanCountry.includes('united states') || cleanCountry.includes('us') || cleanCountry.includes('usa')) {
    pool.push(
      {
        id: 'us_acc_1',
        name: 'Y Combinator',
        type: 'Accelerator',
        category: 'accelerators',
        checkSize: '$500K Standard',
        industryFocus: `Software & ${cleanIndustry}`,
        stageFocus: 'Idea & Prototype Stage',
        country: 'United States',
        region: 'San Francisco California',
        matchScore: Math.min(100, Math.round(vScore + 12)),
        thesis: `Premier global accelerator providing top-tier brand acceleration equity capital and massive user networks for scalable ${cleanModel} architectures.${ideaPhrase}`,
        pitchAdvice: `Avoid marketing jargon and present your core technical metrics and immediate user growth in user-understandable terms`
      },
      {
        id: 'us_vc_1',
        name: 'Sequoia Capital Seed',
        type: 'Venture Capital',
        category: 'vcs',
        checkSize: '$500K–$2M',
        industryFocus: `Outlier ${cleanIndustry}`,
        stageFocus: 'Pre-Seed and Seed Focus',
        country: 'United States',
        region: 'Menlo Park California',
        matchScore: Math.min(100, Math.round(vScore + 10)),
        thesis: `Elite venture institution seeking outlier founders who are pushing boundaries in ${cleanIndustry} and SaaS platforms with a high score of ${vScore}%.${ideaPhrase}`,
        pitchAdvice: `Present an extremely compelling market size estimate and a highly technical team profile`
      },
      {
        id: 'us_angel_1',
        name: 'SV Angel Network',
        type: 'Angel Investor',
        category: 'angels',
        checkSize: '$100K–$250K',
        industryFocus: `${cleanModel} Software`,
        stageFocus: 'Seed Stage Specialist',
        country: 'United States',
        region: 'Silicon Valley California',
        matchScore: Math.min(100, Math.round(vScore + 9)),
        thesis: `Pioneering early stage angel vehicle supporting scalable tech startups leveraging AI and advanced database modules.${ideaPhrase}`,
        pitchAdvice: `Focus on product prototype elegance and high-frequency user engagement indicators`
      },
      {
        id: 'us_vc_2',
        name: 'First Round Capital',
        type: 'Venture Capital',
        category: 'vcs',
        checkSize: '$500K–$1.5M',
        industryFocus: `${cleanIndustry} & B2B`,
        stageFocus: 'Seed Stage Specialist',
        country: 'United States',
        region: 'New York & San Francisco',
        matchScore: Math.min(100, Math.round(vScore + 8)),
        thesis: `Dedicated seed-stage venture fund helping founders build and launch early version software products with supportive operator networks.${ideaPhrase}`,
        pitchAdvice: `Demonstrate some crisp and validated answers to immediate market gaps and launch planning phases`
      },
      {
        id: 'us_acc_2',
        name: 'Techstars Worldwide',
        type: 'Accelerator',
        category: 'accelerators',
        checkSize: '$120K Standard',
        industryFocus: `General Tech Innovation`,
        stageFocus: 'MVP & Early Growth',
        country: 'United States',
        region: 'Boulder Colorado',
        matchScore: Math.min(100, Math.round(vScore + 7)),
        thesis: `Massive worldwide mentorship and financing platform for tech founders look to build solid distribution and scaling structures.${ideaPhrase}`,
        pitchAdvice: `Highlight clear execution focus and user acquisition feedback loops`
      },
      {
        id: 'us_family_1',
        name: 'Bessemer Venture Partners',
        type: 'Venture Capital',
        category: 'vcs',
        checkSize: '$1M–$5M',
        industryFocus: `SaaS & Enterprise Tech`,
        stageFocus: 'Seed to Late Stage',
        country: 'United States',
        region: 'Boston Massachusetts',
        matchScore: Math.min(100, Math.round(vScore + 5)),
        thesis: `World-class institutional asset allocator with a focus on backing leading SaaS and marketplace ventures with strong margins.${ideaPhrase}`,
        pitchAdvice: `Present your exact scalability scores and long-term retention goals`
      }
    );
  } else {
    pool.push(
      {
        id: 'glb_acc_1',
        name: 'Flat6Labs Global Hub',
        type: 'Accelerator',
        category: 'accelerators',
        checkSize: '$100K–$150K',
        industryFocus: `${cleanIndustry} Cohort`,
        stageFocus: 'Idea to MVP',
        country: 'Global Network',
        region: 'GCC & Emerging Markets',
        matchScore: Math.min(100, Math.round(vScore + 9)),
        thesis: `Supporting global founders leveraging tech innovation to solve significant market gaps in the GCC and regional arenas.${ideaPhrase}`,
        pitchAdvice: `Demonstrate local adaptation of your tech stack and localized user capture targets`
      },
      {
        id: 'glb_vc_1',
        name: '500 Tech Fund',
        type: 'Venture Capital',
        category: 'vcs',
        checkSize: '$150K–$500K',
        industryFocus: `${cleanIndustry} Software`,
        stageFocus: 'Seed to Series A',
        country: 'Global Network',
        region: 'Silicon Valley & Regional',
        matchScore: Math.min(100, Math.round(vScore + 10)),
        thesis: `A highly active seed investor backing fast-scaling startups across the globe presenting exceptional concept scores of ${vScore}%.${ideaPhrase}`,
        pitchAdvice: `Provide user activity charts or visual verification of prototype usability`
      },
      {
        id: 'glb_angel_1',
        name: 'Sarah Jenkins VC Angel',
        type: 'Angel Investor',
        category: 'angels',
        checkSize: '$50K–$150K',
        industryFocus: `SaaS & ${cleanIndustry}`,
        stageFocus: 'Idea and Pre-Seed Focus',
        country: 'Global Network',
        region: 'Global Markets',
        matchScore: Math.min(100, Math.round(vScore + 6)),
        thesis: `Backing elite technical founders in B2B and consumer tech who are seeking early product-market validation.${ideaPhrase}`,
        pitchAdvice: `Highlight technical execution credentials and early product adoption rates`
      },
      {
        id: 'glb_strat_1',
        name: 'Bayanat Corporate Venture',
        type: 'Strategic Capital',
        category: 'strategic',
        checkSize: '$500K–$2M',
        industryFocus: `Automated Systems`,
        stageFocus: 'MVP & Expansion',
        country: 'Global Network',
        region: 'Middle East & Global',
        matchScore: Math.min(100, Math.round(vScore + 8)),
        thesis: `Providing premium commercial distribution networks and strategic capital for software systems streamlining industrial operations.${ideaPhrase}`,
        pitchAdvice: `Acknowledge technical integration requirements and show compatibility with scale networks`
      }
    );
  }

  return pool.map(item => ({
    ...item,
    name: stripPeriods(item.name),
    type: stripPeriods(item.type),
    industryFocus: stripPeriods(item.industryFocus),
    stageFocus: stripPeriods(item.stageFocus),
    country: stripPeriods(item.country),
    region: stripPeriods(item.region),
    thesis: stripPeriods(item.thesis),
    pitchAdvice: stripPeriods(item.pitchAdvice),
  }));
};

export const sanitizeVocabulary = (text: any): string => {
  if (text === undefined || text === null) return '';
  let cleaned = String(text);

  const lowerTrimed = cleaned.trim().toLowerCase();
  
  if (lowerTrimed === "market analysis") return "Market Opportunity";
  if (lowerTrimed === "competitor & business model") return "Competition & Revenue";
  if (lowerTrimed === "estimated market size") return "Potential Market Size";
  if (lowerTrimed === "segment growth & signals" || lowerTrimed === "segment growth signals") return "Market Growth";
  if (lowerTrimed === "target market demand") return "Customer Demand";
  if (lowerTrimed === "proprietary advantage") return "Why This Idea Stands Out";
  if (lowerTrimed === "known competitors") return "Main Competitors";
  if (lowerTrimed === "identified gaps") return "Opportunity";
  if (lowerTrimed === "analysis") return "Startup Summary";
  if (lowerTrimed === "how good is my idea") return "Overall evaluation of your startup idea";

  cleaned = cleaned.replace(/venture logic/gi, 'business model');
  cleaned = cleaned.replace(/strategic/gi, 'key');
  cleaned = cleaned.replace(/optimizations/gi, 'improvements');
  cleaned = cleaned.replace(/optimization/gi, 'improvement');
  cleaned = cleaned.replace(/infrastructures/gi, 'platforms');
  cleaned = cleaned.replace(/infrastructure/gi, 'platform');
  cleaned = cleaned.replace(/proprietary/gi, 'unique');
  cleaned = cleaned.replace(/institutional/gi, 'professional');
  cleaned = cleaned.replace(/frameworks/gi, 'systems');
  cleaned = cleaned.replace(/framework/gi, 'system');
  cleaned = cleaned.replace(/monetizations/gi, 'revenues');
  cleaned = cleaned.replace(/monetization/gi, 'revenue');
  cleaned = cleaned.replace(/utilization/gi, 'use');
  cleaned = cleaned.replace(/utilize/gi, 'use');
  cleaned = cleaned.replace(/utilizing/gi, 'using');
  cleaned = cleaned.replace(/leverage/gi, 'use');
  cleaned = cleaned.replace(/leveraged/gi, 'used');
  cleaned = cleaned.replace(/leveraging/gi, 'using');

  cleaned = cleaned.replace(/\bTAM\b/g, 'Potential Market Size');
  cleaned = cleaned.replace(/\bSAM\b/g, 'Target Audience Size');
  cleaned = cleaned.replace(/\bSOM\b/g, 'Our Market Share');
  cleaned = cleaned.replace(/\bCAC\b/gi, 'customer cost');
  cleaned = cleaned.replace(/\bLTV\b/gi, 'customer value');
  cleaned = cleaned.replace(/churn rate/gi, 'lost customer rate');
  cleaned = cleaned.replace(/unit economics/gi, 'profits and costs');
  cleaned = cleaned.replace(/runway/gi, 'time left');
  cleaned = cleaned.replace(/burn rate/gi, 'spending speed');
  cleaned = cleaned.replace(/vertical integration/gi, 'full end-to-end control');

  if (cleaned.length < 50 && cleaned.endsWith('.')) {
    cleaned = cleaned.slice(0, -1);
  }

  return cleaned;
};

const summarizeToBullets = (text: any, max: number = 3): string[] => {
  const clean = sanitizeVocabulary(text);
  if (!clean) return [];

  const rough = clean
    .split(/(?<=[.?!])\s+|\s*,\s+(?=and\b|with\b|while\b|including\b)/i)
    .map(s => s.trim())
    .filter(Boolean);

  const bullets = rough.slice(0, max).map(s => {
    const words = s.split(/\s+/);
    const trimmed = words.length > 10 ? words.slice(0, 10).join(' ') : s;
    return trimmed.replace(/[.,;:]+$/, '');
  });

  return bullets;
};

const extractStatusWord = (text: any, fallback: string, pattern: RegExp = /low|medium|high|strong|moderate|weak/i): string => {
  if (!text) return fallback;
  const match = String(text).match(pattern);
  if (!match) return fallback;
  const word = match[0].toLowerCase();
  return word.charAt(0).toUpperCase() + word.slice(1);
};

const formatMarketSize = (text: any): string => {
  if (!text) return '—';
  const str = String(text);
  const match = str.match(/\$\s?([\d.,]+)\s?(billion|bn|b\b|million|mn|m\b|thousand|k\b)?/i);
  if (!match) return '—';
  const num = match[1];
  const unitRaw = (match[2] || '').toLowerCase();
  let unit = '';
  if (unitRaw.startsWith('b')) unit = 'B';
  else if (unitRaw.startsWith('m')) unit = 'M';
  else if (unitRaw.startsWith('k')) unit = 'K';
  else unit = 'B';
  return `$${num}${unit}`;
};

export const sanitizeInsightText = (text: any): string => {
  const clean = sanitizeVocabulary(text);
  if (!clean) return '';
  
  const sentences = clean.split(/(?<=[.?!])\s+/).filter(Boolean);
  
  const simplifiedSentences = sentences.map(sentence => {
    let s = sentence.trim();
    s = s.replace(/,?\s+which\s+allows\s+us\s+to/gi, ' to');
    s = s.replace(/,?\s+which\s+means\s+that/gi, '. This means');
    s = s.replace(/,?\s+allowing\s+the\s+user\s+to/gi, ' to let you');
    s = s.replace(/,?\s+thereby\s+improving/gi, ' for better results');
    s = s.replace(/,?\s+using\s+our\s+custom/gi, ' with our');
    
    const words = s.split(/\s+/);
    if (words.length > 12) {
      const commaIndex = s.indexOf(',');
      if (commaIndex > 15 && commaIndex < 60) {
        s = s.substring(0, commaIndex).trim();
      } else {
        s = words.slice(0, 12).join(' ').trim();
      }
      s = s.replace(/[^a-zA-Z0-9 Saudi Riyadh Arabian Gulf % $ £ €]+$/, '');
      s += '.';
    }
    return s;
  });

  if (simplifiedSentences.length <= 2) {
    return simplifiedSentences.join(' ');
  }
  return simplifiedSentences.slice(0, 2).join(' ');
};

export const calculateFinalScore = (
  matrixMetrics: { metric1: number; metric2: number; metric3: number; metric4: number; metric5: number },
  countryFactor: number,
  ideaStrength: number,
  riskDeductions: number
): number => {
  const baseScore = 
    (matrixMetrics.metric1 * 0.20) + 
    (matrixMetrics.metric2 * 0.15) + 
    (matrixMetrics.metric3 * 0.15) + 
    (matrixMetrics.metric4 * 0.15) + 
    (matrixMetrics.metric5 * 0.15) + 
    (ideaStrength * 0.10) + 
    (countryFactor * 0.10);

  const finalCalculatedScore = baseScore - riskDeductions;
  return Math.min(100, Math.max(0, Math.round(finalCalculatedScore)));
};

export const getCalculatedVentureScore = (scores: any) => {
  if (!scores) return 85;
  const getVal = (key: string, altKey?: string) => {
    const val = scores[key] ?? (altKey ? scores[altKey] : undefined);
    if (val === undefined || val === null) return null;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && typeof val.score === 'number') return val.score;
    if (typeof val === 'string') {
      const parsed = parseInt(val, 15);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  };

  const idea = getVal('ideaStrength');
  const market = getVal('marketFit');
  const investor = getVal('investorAppeal', 'investorAttractiveness');
  const exec = getVal('execution', 'executionReadiness');
  const comp = getVal('competition', 'competitiveAdvantage');
  const scale = getVal('scalability');

  if (idea === null && market === null && investor === null && exec === null && comp === null) {
    return typeof scores.overall === 'number' ? scores.overall : 85;
  }

  const ideaScore = idea ?? 0;
  const marketScore = market ?? 0;
  const investorScore = investor ?? 0;
  const execScore = exec ?? 0;
  const compScore = comp ?? 0;
  const scaleScore = scale ?? 0;

  const matrixMetrics = {
    metric1: marketScore,
    metric2: execScore,
    metric3: investorScore,
    metric4: scaleScore,
    metric5: compScore
  };

  const countryFactor = marketScore;
  const riskDeductions = Math.max(0, Math.round((100 - compScore) * 0.08));

  return calculateFinalScore(matrixMetrics, countryFactor, ideaScore, riskDeductions);
};

const recalculateVentureSuite = (profile: any) => {
  const companyName = (profile.companyName || 'Custom Venture').replace(/\./g, '');
  const industry = (profile.industry || 'Technology').replace(/\./g, '');
  const stage = (profile.stage || 'Idea Stage').replace(/\./g, '');
  const country = (profile.country || 'Bahrain').replace(/\./g, '');
  const city = (profile.city || 'Manama').replace(/\./g, '');
  const businessType = (profile.businessType || 'B2B').replace(/\./g, '');
  const ideaDescription = (profile.businessDescription || profile.elevatorPitch || '').replace(/\./g, '');

  const baseOverall = Math.min(98, Math.max(55, 78 + 
    (profile.elevatorPitch && profile.elevatorPitch.length > 20 ? 3 : 0) +
    (profile.businessDescription && profile.businessDescription.length > 50 ? 3 : 0) +
    (profile.founderBackground && profile.founderBackground.length > 20 ? 2 : 0) +
    (profile.teamSize !== 'Solo' ? 3 : 0) +
    (stage.includes('MVP') || stage.includes('Launch') ? 5 : 0)
  ));
  
  const ideaStrength = Math.min(99, Math.max(55, baseOverall + 2));
  const marketFit = Math.min(97, Math.max(52, baseOverall - 2));
  const execution = Math.min(98, Math.max(50, baseOverall + 1));
  const scalability = Math.min(99, Math.max(55, baseOverall + 3));
  const competition = Math.min(95, Math.max(45, baseOverall - 4));
  const investorAppeal = Math.min(98, Math.max(55, baseOverall - 1));

  const matrixMetrics = {
    metric1: marketFit,
    metric2: execution,
    metric3: investorAppeal,
    metric4: scalability,
    metric5: competition
  };
  const riskDeductions = Math.max(0, Math.round((100 - competition) * 0.08));
  const overall = calculateFinalScore(matrixMetrics, marketFit, ideaStrength, riskDeductions);

  const updatedScores = {
    overall: overall,
    ideaStrength: { score: ideaStrength, explanation: `Validating concept under ${industry} standard metrics` },
    marketFit: { score: marketFit, explanation: `Assessing demand indicators in target ${country} landscape` },
    execution: { score: execution, explanation: `Analyzing founder background and executing capacities` },
    investorAppeal: { score: investorAppeal, explanation: `Evaluating investor alignment with ${stage} funding metrics` },
    scalability: { score: scalability, explanation: `Checking scaling frameworks for proposed ${businessType} systems` },
    competition: { score: competition, explanation: `Assessing entry barriers and defensive advantages` }
  };

  const riskImpactBase = country.toLowerCase().includes('united states') ? 3 : 4;
  const riskMatrix = {
    market: {
      explanation: `Market penetration trends for ${industry} platforms inside ${country}`,
      severity: 'Medium' as any,
      impact: Math.min(10, Math.max(1, riskImpactBase + 2)),
      likelihood: Math.min(10, Math.max(1, riskImpactBase + 1)),
      mitigation: `Execute swift local user testing to build defense barrier channels`
    },
    execution: {
      explanation: `Operational delivery limits of ${businessType} systems during ${stage}`,
      severity: 'Medium' as any,
      impact: Math.min(10, Math.max(1, riskImpactBase + 1)),
      likelihood: Math.min(10, Math.max(1, riskImpactBase)),
      mitigation: `Establish clear milestone benchmarks and partner with agile developers`
    },
    competition: {
      explanation: `Competitive defense vectors inside ${city} against deep global alternatives`,
      severity: 'Medium' as any,
      impact: Math.min(10, Math.max(1, riskImpactBase + 3)),
      likelihood: Math.min(10, Math.max(1, riskImpactBase)),
      mitigation: `Focus on customized localized customer services to retain software user fidelity`
    },
    financial: {
      explanation: `Operational capital constraints during MVP launch iterations`,
      severity: 'High' as any,
      impact: Math.min(10, Math.max(1, riskImpactBase + 4)),
      likelihood: Math.min(10, Math.max(1, riskImpactBase + 2)),
      mitigation: `Monitor core burn metrics closely and conserve capital for strategic launches`
    }
  };

  // Investor matches are AI-only now; profile edits must NOT regenerate a
  // hard-coded list, so we no longer compute or return investorMatching here.

  const newSlides = [
    {
      id: 'slide_1',
      title: 'The Venture Vision',
      content: `${companyName} is a premier developer platform delivering innovation to the ${industry} space`,
      points: [
        `Directly targeting prime commercial markets in ${country} and globally`,
        `Propelled by unique operational tactics custom tailored for ${businessType}`,
        `Achieved exceptional startup score of ${overall}% from analytical indexes`
      ],
      visualType: 'text' as const,
      visualSuggestion: 'Minimal layouts featuring high contrast title scales',
      imageKeywords: 'workspace desktop team minimalist',
      colorAccent: '#3B82F6'
    },
    {
      id: 'slide_2',
      title: 'Current Gaps and System Solutions',
      content: `Pioneering structured improvements addressing market fragmentation inside ${city} and GCC regions`,
      points: [
        `Addressing key business hurdles within the wider ${industry} sector`,
        `Optimizing local traction metrics before starting global waterfall expansion projects`,
        `Providing modular workflow features ensuring rapid deployment`
      ],
      visualType: 'split' as const,
      visualSuggestion: 'Comparative dual grids dividing pain and automated solutions',
      imageKeywords: 'grid metrics software interface',
      colorAccent: '#60A5FA'
    }
  ];

  return {
    scores: updatedScores,
    riskMatrix: riskMatrix,
    pitchReadiness: {
      readinessScore: overall,
      improvementSuggestions: [
        `Clarify the core revenue stream for proposed clients in ${country}`,
        `Harness regional investor networks inside GCC to expand footprint`,
        `Enhance intellectual defense margins against alternative options`
      ],
      suggestedStructure: [
        `Core Market Ambition`,
        `The Operational Solution`,
        `Target Focus and Scalability`
      ],
      slides: newSlides
    },
    traction: {
      analysis: `Showing early positive indicator metrics for ${companyName} Concept validated via ${overall}% score`,
      nextSteps: [
        `Finalize interactive web prototypes to demo first client networks`,
        `Initiate meetings with highly rated angel matching partners`
      ],
      potential: `High capability scale expected with ${businessType} architecture`
    }
  };
};

// Builds a tailored "Investor Playbook" instantly from the existing analysis
// data (no AI call). Content adapts to the investor's type (angel / VC /
// accelerator / strategic / family office) and weaves in the user's real
// company name, score, market size, stage and check size.
const buildInvestorPlaybook = (investor: any, analysis: any, displayProfile: any) => {
  const company = (displayProfile?.companyName || 'your startup').replace(/\./g, '');
  const industry = (displayProfile?.industry || 'your sector').replace(/\./g, '');
  const stage = (displayProfile?.stage || 'your current stage').replace(/\./g, '');
  const market = formatMarketSize(analysis?.marketAnalysis?.sizeEstimate);
  const score = getCalculatedVentureScore(analysis?.scores);
  const investorName = (investor?.name || 'this investor').replace(/\./g, '');
  const region = (investor?.region || 'their region').replace(/\./g, '');
  const check = investor?.checkSize || 'their typical check size';

  // Find the strongest scored area to emphasize.
  const scoreObj = analysis?.scores || {};
  const getS = (k: string) => {
    const v = scoreObj[k];
    return typeof v === 'number' ? v : (v?.score ?? 0);
  };
  const ranked = [
    ['market demand', getS('marketFit')],
    ['the core idea', getS('ideaStrength')],
    ['execution capability', getS('execution')],
    ['scalability', getS('scalability')],
    ['investor appeal', getS('investorAppeal')],
  ].sort((a: any, b: any) => b[1] - a[1]);
  const topStrength = ranked[0][0];

  const category = (investor?.category || (investor?.type || '')).toString().toLowerCase();
  const isAngel = category.includes('angel');
  const isAccel = category.includes('accel') || category.includes('incubat');
  const isStrategic = category.includes('strateg') || category.includes('corporate');
  const isFamily = category.includes('family');

  // ---- How to approach them (outreach / first contact) ----
  let approach: string[];
  if (isAngel) approach = [
    `Angels back people first, so a warm, personal introduction from someone they trust beats any cold email.`,
    `Reach out briefly and personally: who you are, what ${company} does, and why you are emailing them specifically.`,
    `Reference something real about them — a company they backed or a talk they gave — so it is clearly not a mass email.`,
    `Keep it human and conversational; angels often decide on their conviction in the founder.`,
    `Ask for a short 20-minute call, not money up front, and be honest that the stage is early.`,
  ];
  else if (isAccel) approach = [
    `Apply through the official program and hit the deadline — most accelerators run on fixed cohort cycles.`,
    `In the application show momentum and coachability more than polish; they invest in trajectory.`,
    `Name the specific batch or program and explain why it fits ${company} right now at ${stage}.`,
    `Get a referral from a program alum if you can — it carries real weight in selection.`,
    `Have a working MVP or prototype to show, even if it is rough, and be clear what you want from the program beyond the check.`,
  ];
  else if (isStrategic) approach = [
    `Approach through their corporate-venture or partnerships team, or a warm intro from one of their portfolio companies.`,
    `Frame the first conversation around strategic fit — how ${company} helps them, not just that you need funding.`,
    `Lead with where you complement their products or reach their customers in ${industry}.`,
    `Be ready to discuss a commercial relationship (a pilot or integration) alongside the investment.`,
    `Expect a slower, more committee-driven process, and keep your IP and independence in mind from the first meeting.`,
  ];
  else if (isFamily) approach = [
    `Family offices move on trust, so a discreet introduction through a mutual, trusted contact is the way in.`,
    `Lead with stability, downside protection, and a credible path to profitability rather than hyper-growth.`,
    `Be patient and relationship-first; they often take longer and value long-term alignment.`,
    `Have clean financials and clear unit economics ready — they scrutinise the numbers closely.`,
    `Respect discretion; many prefer to stay low-profile, and be ready to discuss longer hold periods.`,
  ];
  else approach = [
    `Get a warm introduction — a referral from a founder they have backed or a fellow investor beats a cold email every time.`,
    `If cold, keep the first email to about five sentences: what ${company} does, your traction, the market, the ask, and one line on why now.`,
    `Lead with a metric or a sharp insight, not your life story — investors scan fast.`,
    `Attach a tight 10-12 slide deck, not a 30-page document, and make the ask specific.`,
    `Follow up once after about a week if you do not hear back; persistence is fine, pestering is not.`,
  ];

  // ---- Likely questions (with how to answer) ----
  let questions: string[];
  if (isAngel) questions = [
    `Why are you the right founder for this? Tell the story of your edge — experience, insight, or obsession with the problem.`,
    `Why now? Point to a real shift in technology, behaviour, or regulation that makes this the moment.`,
    `How far will this check take you? Show the runway it buys and what you will prove with it.`,
    `What does early traction look like? Share your most honest real numbers, not vanity metrics.`,
    `What is your commitment? Be clear you are all-in and how long your personal runway is.`,
  ];
  else if (isAccel) questions = [
    `Why an accelerator now? Show what you gain — network, mentors, focus — not just the money.`,
    `How coachable are you? Give a concrete example of feedback you took and acted on.`,
    `What will you achieve in the program? Name a specific goal for demo day.`,
    `What is your MVP and early feedback? Show the product and exactly what users said.`,
    `Where do you want to be by demo day? Give an ambitious but realistic target.`,
  ];
  else if (isStrategic) questions = [
    `How does this fit our priorities? Tie it directly to their products, customers, or strategy.`,
    `Could this integrate with us? Sketch a concrete integration or pilot.`,
    `What is the partnership upside? Show mutual value, not only your gain.`,
    `How defensible is the technology? Explain your moat and any IP clearly.`,
    `What would a commercial deal look like? Have a rough pilot or partnership shape ready.`,
  ];
  else if (isFamily) questions = [
    `How predictable is revenue? Show recurring or repeatable revenue and retention.`,
    `What is the downside protection? Explain what limits the loss if growth stalls.`,
    `What are the unit economics? Walk through margins, payback, and the path to profit.`,
    `How long until profitability? Give a realistic timeline, not a fantasy.`,
    `How is capital preserved? Show disciplined spending tied to milestones.`,
  ];
  else questions = [
    `How big is the market really? Give a credible top-down and bottom-up number and avoid wild claims.`,
    `What makes you different and defensible? Name the moat: technology, data, network, brand, or speed.`,
    `How will you acquire customers efficiently? Show your channels and rough cost-to-acquire versus value.`,
    `How will the funding be used? Break it into runway, key hires, and the milestones it unlocks.`,
    `What are the next 12 months? Give two or three concrete, measurable milestones.`,
  ];

  // ---- What to avoid ----
  let avoid: string[];
  if (isAngel) avoid = [
    `Overloading them with dense financial models — keep it human and clear.`,
    `Hiding personal risk or runway; angels value honesty over a perfect story.`,
    `Vague answers about your commitment to the company.`,
    `Over-promising on timelines you cannot realistically hit.`,
  ];
  else if (isAccel) avoid = [
    `Acting like you already know everything — coachability is the whole point.`,
    `Showing a finished product with no room left to iterate.`,
    `Dismissing the value of mentorship and the network.`,
    `Unclear or unrealistic goals for what you will achieve.`,
  ];
  else if (isStrategic) avoid = [
    `Ignoring how you fit into their ecosystem.`,
    `Positioning yourself purely as a competitor to them.`,
    `Being vague about the integration or partnership value.`,
    `Overstating your independence from their platform when you depend on it.`,
  ];
  else if (isFamily) avoid = [
    `Growth-at-all-costs framing; they prize stability and discipline.`,
    `Ignoring risk and capital preservation.`,
    `Unrealistic hockey-stick projections.`,
    `A weak margin or cash-flow story.`,
  ];
  else avoid = [
    `Inflated or unsupported market numbers — experienced investors spot it instantly.`,
    `Buzzwords with no substance behind them.`,
    `Dodging hard questions on competition; name competitors honestly.`,
    `A vague use of funds — always tie the money to milestones.`,
  ];

  // ---- Presentation style ----
  let style: string[];
  if (isAngel) style = [
    `Personal and story-driven — they are betting on you as much as the idea.`,
    `Lead with the founder and the vision, then bring in the numbers.`,
    `Keep it conversational, like talking to a smart, busy friend.`,
  ];
  else if (isAccel) style = [
    `Energetic and growth-minded — show momentum and hunger to learn.`,
    `Demonstrate that you iterate quickly on feedback.`,
    `Demo the product live if you possibly can.`,
  ];
  else if (isStrategic) style = [
    `Professional and partnership-focused throughout.`,
    `Frame everything around mutual strategic value.`,
    `Use concrete integration or customer examples, not abstractions.`,
  ];
  else if (isFamily) style = [
    `Measured, data-backed, and steady in tone.`,
    `Emphasise stability and discipline over hype.`,
    `Show that you think carefully about risk and the long term.`,
  ];
  else style = [
    `Sharp, structured, and metrics-driven — back every claim with a number.`,
    `Lead with market size and traction in the first two minutes.`,
    `Confident but not over-polished; substance earns more trust than slickness.`,
  ];

  // ---- Negotiation tips ----
  let negotiation: string[];
  if (isAngel) negotiation = [
    `Keep terms simple — a SAFE or convertible note is standard this early.`,
    `Be flexible on valuation for an angel who brings real network and help.`,
    `Value their mentorship and introductions, not just the size of the check.`,
    `Agree on follow-on expectations early so there are no surprises later.`,
  ];
  else if (isAccel) negotiation = [
    `Know the standard equity-for-program terms before you apply.`,
    `Weigh the network and demo-day exposure, not only the cash.`,
    `Clarify what post-program follow-on support actually looks like.`,
    `Do not over-negotiate a standardised cohort deal — it rarely moves.`,
  ];
  else if (isStrategic) negotiation = [
    `Protect your independence and your IP above all else.`,
    `Keep investment terms separate from any commercial or partnership terms.`,
    `Watch for exclusivity, right-of-first-refusal, or right-of-first-offer clauses.`,
    `Define a clear, bounded scope for the partnership.`,
  ];
  else if (isFamily) negotiation = [
    `Expect a heavy focus on downside protection and capital preservation.`,
    `Be ready to discuss longer hold periods and patient timelines.`,
    `Show clear, credible paths to profitability.`,
    `Align on realistic, steady milestones rather than moonshots.`,
  ];
  else negotiation = [
    `Anchor valuation with comparable recent rounds at your stage.`,
    `Do not over-optimise valuation over getting the right partner.`,
    `Understand the term sheet: liquidation preference, board seats, pro-rata, option pool.`,
    `Keep healthy competitive tension — talking to several investors strengthens your hand.`,
  ];

  return [
    { title: 'How to Approach Them', items: approach },
    {
      title: 'Recommended Pitch Structure',
      items: [
        `Open in one line: what ${company} does and for whom, so it is instantly clear.`,
        `Problem & solution: the specific pain you remove and how, in plain language.`,
        market !== '—'
          ? `Market opportunity: around ${market} and growing — show it is big and where you fit.`
          : `Market opportunity: show it is large, growing, and where you fit.`,
        `Business model: how you make money, your pricing, and your margins.`,
        `Traction & growth: your best proof — users, revenue, pilots, or signups.`,
        `The ask: how much you are raising (around ${check} for this investor) and exactly what it buys — runway, hires, milestones.`,
      ],
    },
    {
      title: 'Key Talking Points',
      items: [
        market !== '—'
          ? `Market potential: ${market} and growing, with clear room for a focused player.`
          : `Market potential: a large, growing market with room for a focused player.`,
        `Competitive advantage: what you do that others cannot easily copy.`,
        `Revenue model: how money comes in and why it scales profitably.`,
        `Scalability: how you grow without costs rising just as fast.`,
        `Founder strength: why you and your team are the ones to win this.`,
      ],
    },
    { title: 'Likely Investor Questions', items: questions },
    {
      title: 'What to Emphasize',
      items: [
        `Your strongest area: ${topStrength} — lead with it, it is where you score highest.`,
        `Strong, specific market demand — proof that people actually want this.`,
        `Customer validation — real users, feedback, pilots, or early revenue.`,
        `Revenue potential — a believable path to meaningful money.`,
        `A competitive moat — why your lead is defensible over time.`,
        `Execution capability — evidence you can actually ship and deliver.`,
      ],
    },
    { title: 'What to Avoid', items: avoid },
    { title: 'Presentation Style', items: style },
    {
      title: 'Meeting Preparation',
      items: [
        `Research ${investorName}: their focus, past deals, and public statements — then reference them in the meeting.`,
        `Prepare two versions: a tight 10-12 slide deck and a 2-minute verbal pitch.`,
        market !== '—'
          ? `Have your numbers ready: ${score}% startup score, ${market} market, traction, and unit economics.`
          : `Have your numbers ready: ${score}% startup score, market size, traction, and unit economics.`,
        `Write out answers to the likely questions above and rehearse them out loud.`,
        `Prepare two or three smart questions to ask them — it shows you are evaluating fit too.`,
        `Know your specific ask and your minimum acceptable terms before you walk in.`,
      ],
    },
    { title: 'Negotiation Tips', items: negotiation },
  ];
};

interface ResultsDashboardProps {
  analysis: AnalysisReport;
  profile: UserProfile | null;
  investorView?: boolean;
}

export default function ResultsDashboard({ analysis, profile, investorView = false }: ResultsDashboardProps) {
  const navigate = useNavigate();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(analysis);
  const [savedProjects, setSavedProjects] = useState<AnalysisReport[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const reportPrintRef = useRef<HTMLDivElement>(null);
  
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
  const [investorCategory, setInvestorCategory] = useState<'all' | 'angels' | 'vcs' | 'accelerators' | 'strategic' | 'family'>('all');
  const [expandedThesisId, setExpandedThesisId] = useState<string | null>(null);
  const [playbookInvestor, setPlaybookInvestor] = useState<any | null>(null);
  const [savingShare, setSavingShare] = useState(false);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') as any;
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'risk' | 'growth' | 'team' | 'investors' | 'reports' | 'architect'>(() => {
    if (initialTab && ['overview', 'analysis', 'risk', 'growth', 'investors', 'reports', 'architect'].includes(initialTab)) {
      return initialTab;
    }
    const path = window.location.pathname;
    if (path.endsWith('/overview')) return 'overview';
    if (path.endsWith('/analysis')) return 'analysis';
    if (path.endsWith('/risk')) return 'risk';
    if (path.endsWith('/growth')) return 'growth';
    if (path.endsWith('/investors')) return 'investors';
    if (path.endsWith('/reports') || path.endsWith('/report')) return 'reports';
    if (path.endsWith('/architect')) return 'architect';
    return 'overview';
  });

  // In investor view, lock the report to the Startup Overview only.
  const effectiveTab = investorView ? 'overview' : activeTab;

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'analysis', 'risk', 'growth', 'investors', 'reports', 'architect'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    const downloadParam = searchParams.get('download');
    if (downloadParam === 'true' && activeTab === 'reports') {
      const timer = setTimeout(() => {
        handleExportExecutiveReport();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    setCurrentAnalysis(analysis);
    setEditedProfile({
      ...defaultProfile,
      ...(analysis.startupProfile || {})
    });
    setEditedIdea(analysis.ideaDescription);
  }, [analysis]);

  const needsSyncRef = useRef<boolean>(false);
  const currentAnalysisRef = useRef<any>(currentAnalysis);

  useEffect(() => {
    currentAnalysisRef.current = currentAnalysis;
  }, [currentAnalysis]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (needsSyncRef.current) {
        needsSyncRef.current = false;
        const liveAnalysis = currentAnalysisRef.current;
        if (liveAnalysis && liveAnalysis.id) {
          console.log("Atomic flush: Performing non-blocking background save to database layer for", liveAnalysis.id);
          try {
            await updateDoc(doc(db, 'analyses', liveAnalysis.id), {
              ...liveAnalysis,
              updatedAt: serverTimestamp()
            });
            const cachedJson = localStorage.getItem('cached_analyses');
            if (cachedJson) {
              const list = JSON.parse(cachedJson) as any[];
              const idx = list.findIndex(item => item.id === liveAnalysis.id);
              if (idx > -1) {
                list[idx] = { ...list[idx], ...liveAnalysis, updatedAt: new Date().toISOString() };
                localStorage.setItem('cached_analyses', JSON.stringify(list));
                setSavedProjects(list);
              }
            }
          } catch (writeErr) {
            console.warn("Background auto-save sync warning:", writeErr);
          }
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isEditingProfile && autoSyncEnabled) {
      const recalculation = recalculateVentureSuite(editedProfile);
      
      const companyNameClean = (editedProfile.companyName || '').replace(/\./g, '');
      const industryClean = (editedProfile.industry || '').replace(/\./g, '');
      const descClean = (editedProfile.businessDescription || '').replace(/\./g, '');

      const updatedAnalysis = {
        ...currentAnalysis,
        startupProfile: {
          ...editedProfile,
          companyName: companyNameClean,
          industry: industryClean,
          businessDescription: descClean
        },
        scores: recalculation.scores as any,
        riskMatrix: recalculation.riskMatrix,
        pitchReadiness: recalculation.pitchReadiness,
        traction: recalculation.traction,
        overallScore: recalculation.scores.overall,
        analysisScore: recalculation.scores.overall,
        riskScore: Math.round(
          ((recalculation.riskMatrix.market.impact + recalculation.riskMatrix.market.likelihood) +
           (recalculation.riskMatrix.execution.impact + recalculation.riskMatrix.execution.likelihood) +
           (recalculation.riskMatrix.competition.impact + recalculation.riskMatrix.competition.likelihood) +
           (recalculation.riskMatrix.financial.impact + recalculation.riskMatrix.financial.likelihood)) * 2.5
        ),
        growthScore: recalculation.scores.scalability.score
      };

      setCurrentAnalysis(updatedAnalysis);
      needsSyncRef.current = true;
    }
  }, [editedProfile, isEditingProfile, autoSyncEnabled]);

  useEffect(() => {
    const loadSavedProjects = () => {
      try {
        const cached = localStorage.getItem('cached_analyses');
        if (cached) {
          const allAnalyses = JSON.parse(cached) as AnalysisReport[];
          setSavedProjects(allAnalyses);
        }
      } catch (err) {
        console.warn("Could not load saved projects:", err);
      }
    };
    loadSavedProjects();
  }, [currentAnalysis.id]);

  useEffect(() => {
    if (!db) return;
    const fetchSavedStartups = async () => {
      try {
        const q = query(
          collection(db, 'analyses'),
          where('userId', '==', profile?.uid || currentAnalysis.userId)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalysisReport));
        
        data.sort((a, b) => {
          const timeA = a.updatedAt ? (typeof (a.updatedAt as any).toDate === 'function' ? (a.updatedAt as any).toDate().getTime() : new Date(a.updatedAt).getTime()) : 0;
          const timeB = b.updatedAt ? (typeof (b.updatedAt as any).toDate === 'function' ? (b.updatedAt as any).toDate().getTime() : new Date(b.updatedAt).getTime()) : 0;
          return timeB - timeA;
        });

        if (data.length > 0) {
          setSavedProjects(data);
          localStorage.setItem('cached_analyses', JSON.stringify(data));
        }
      } catch (e) {
        console.warn("Background fetch of startup list failed:", e);
      }
    };
    fetchSavedStartups();
  }, [profile, currentAnalysis.id]);

  const updateLocalCache = (updatedItem: AnalysisReport) => {
    try {
      const cachedJson = localStorage.getItem('cached_analyses');
      let list: any[] = cachedJson ? JSON.parse(cachedJson) : [];
      if (!Array.isArray(list)) list = [];
      const idx = list.findIndex(item => item.id === updatedItem.id);
      
      const serializableItem = {
        ...updatedItem,
        updatedAt: new Date().toISOString()
      };

      if (idx > -1) {
        list[idx] = { ...list[idx], ...serializableItem };
      } else {
        list.push(serializableItem);
      }
      localStorage.setItem('cached_analyses', JSON.stringify(list));
      
      setSavedProjects(list);
    } catch (e) {
      console.warn("Could not write local storage cache:", e);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      const companyNameClean = (editedProfile.companyName || currentAnalysis.startupProfile?.companyName || '').replace(/\./g, '');
      const industryClean = (editedProfile.industry || currentAnalysis.startupProfile?.industry || '').replace(/\./g, '');
      const descClean = (editedProfile.businessDescription || currentAnalysis.startupProfile?.businessDescription || '').replace(/\./g, '');

      let updatedItem: any = {
        ...currentAnalysis,
        startupProfile: {
          ...editedProfile,
          companyName: companyNameClean,
          industry: industryClean,
          businessDescription: descClean
        }
      };

      if (autoSyncEnabled) {
        const recalculation = recalculateVentureSuite(editedProfile);
        
        updatedItem = {
          ...updatedItem,
          scores: recalculation.scores as any,
          riskMatrix: recalculation.riskMatrix,
            pitchReadiness: recalculation.pitchReadiness,
          traction: recalculation.traction,
          overallScore: recalculation.scores.overall,
          analysisScore: recalculation.scores.overall,
          riskScore: Math.round(
            ((recalculation.riskMatrix.market.impact + recalculation.riskMatrix.market.likelihood) +
             (recalculation.riskMatrix.execution.impact + recalculation.riskMatrix.execution.likelihood) +
             (recalculation.riskMatrix.competition.impact + recalculation.riskMatrix.competition.likelihood) +
             (recalculation.riskMatrix.financial.impact + recalculation.riskMatrix.financial.likelihood)) * 2.5
          ),
          growthScore: recalculation.scores.scalability.score
        };
      }

      await updateDoc(doc(db, 'analyses', currentAnalysis.id), {
        ...updatedItem,
        updatedAt: serverTimestamp()
      });

      setCurrentAnalysis(updatedItem);
      updateLocalCache(updatedItem);
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
      await updateDoc(doc(db, 'analyses', currentAnalysis.id), {
        startupProfile: editedProfile,
        ideaDescription: editedIdea,
        updatedAt: serverTimestamp()
      });

      const refinedResults = await generateCompanyAnalysis(editedProfile);

      const updateData = {
        ...refinedResults,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'analyses', currentAnalysis.id), updateData);
      
      const updatedItem = {
        ...currentAnalysis,
        ...refinedResults,
        startupProfile: editedProfile,
        ideaDescription: editedIdea
      };

      setCurrentAnalysis(updatedItem);
      updateLocalCache(updatedItem);

      setIsEditingProfile(false);
      setIsEditingIdea(false);
      alert("Analysis refined successfully!");
    } catch (err) {
      console.error("Refinement error:", err);
      alert("Failed to refine. Please check connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Used by the Pitch Deck Architect tab — captures slide elements only.
  const handleExportPDF = async () => {
    if (!currentAnalysis.pitchReadiness?.slides) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720]
      });

      await withOklchHtml2CanvasPatch(async () => {
        for (let i = 0; i < currentAnalysis.pitchReadiness.slides.length; i++) {
          const element = document.getElementById(`pitch-slide-${i}`);
          if (element) {
            const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#08131D'
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            
            if (i > 0) pdf.addPage([1280, 720], 'landscape');
            pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
          }
        }
      });

      pdf.save(`${displayProfile.companyName || 'Venture'}_Pitch_Deck.pdf`);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export pitch deck. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // FIX: previously used Tailwind color classes (text-neutral-900,
  // border-neutral-200, bg-white, etc.) inside the printable block. Tailwind
  // v4 compiles those into oklch() colors, and html2canvas cannot parse
  // oklch() — that's exactly why the export silently failed with an error.
  // The printable block below now sets every color via inline style with a
  // plain hex value, so html2canvas never encounters an oklch() value.
  const handleExportExecutiveReport = async () => {
    if (!reportPrintRef.current) return;
    setIsExporting(true);

    try {
      const node = reportPrintRef.current;
      const canvas = await withOklchHtml2CanvasPatch(async () => {
        return await html2canvas(node, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          windowWidth: node.scrollWidth || 800,
          windowHeight: node.scrollHeight || 1200,
        });
      });

      if (!canvas || !canvas.width || !canvas.height) {
        throw new Error("Canvas generation returned an empty or invalid canvas.");
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (!imgWidth || isNaN(imgWidth) || !imgHeight || isNaN(imgHeight)) {
        throw new Error("Computed image dimensions are invalid.");
      }

      let leftHeight = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      let isFirstPage = true;
      while (leftHeight > 0) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Render full image with a negative Y offset (position) on each subsequent page.
        // jsPDF auto-clips everything that lies outside the current page boundary.
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        
        leftHeight -= pageHeight;
        position -= pageHeight;
      }

      pdf.save(`${displayProfile.companyName || 'Venture'}_Executive_Report.pdf`);
    } catch (err) {
      console.error("Executive report export error:", err);
      alert("Failed to export report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const displayProfile = currentAnalysis.startupProfile || editedProfile;

  // ----- Investor-share consent --------------------------------------------
  // Asked once, right after the analysis loads and BEFORE the report shows.
  // Nothing about a founder ever reaches an investor unless they choose "Yes".
  // The choice is stored on the analysis; when it's undefined the gate shows.
  const handleShareChoice = async (choice: boolean) => {
    setSavingShare(true);
    const score = getCalculatedVentureScore(currentAnalysis.scores);
    const stage = (displayProfile.stage || '').toString();
    // Save the founder's own contact so matched investors can reach them.
    const founderName = (profile as any)?.fullName || (profile as any)?.displayName || '';
    const founderEmail = (profile as any)?.email || '';
    const updated: any = {
      ...currentAnalysis,
      sharedWithInvestors: choice,
      shareScore: score,
      shareStage: stage,
      shareFounderName: founderName,
      shareFounderEmail: founderEmail,
    };
    try {
      await updateDoc(doc(db, 'analyses', currentAnalysis.id), {
        sharedWithInvestors: choice,
        shareScore: score,
        shareStage: stage,
        shareFounderName: founderName,
        shareFounderEmail: founderEmail,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not save investor-share choice:', err);
    }
    setCurrentAnalysis(updated);
    updateLocalCache(updated);
    setSavingShare(false);
  };

  // The share gate appears only for Growth-tier founders whose analysis scored
  // 80% or higher and who haven't answered yet.
  const shareScoreNow = getCalculatedVentureScore(currentAnalysis.scores);
  if (!investorView && hasAccess(profile, 'growth') && shareScoreNow >= 80 && (currentAnalysis as any).sharedWithInvestors === undefined) {
    const previewScore = shareScoreNow;
    return (
      <div className="fixed inset-0 z-[1400] bg-brand-bg flex items-center justify-center p-6 overflow-y-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand-accent/5 blur-[140px] rounded-full pointer-events-none" />
        <div className="relative w-full max-w-lg bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10 shadow-huge text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
            <Handshake size={28} />
          </div>
          <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] block mb-3">Analysis Ready</span>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-4 leading-tight">
            Share with investors?
          </h2>
          <p className="text-sm text-slate-300 font-medium leading-relaxed mb-2">
            Your analysis for <span className="text-white font-bold">{(displayProfile.companyName || 'your startup').replace(/\./g, '')}</span> scored <span className="text-brand-accent font-black">{previewScore}%</span>.
          </p>
          <p className="text-sm text-brand-text-secondary font-medium leading-relaxed mb-8">
            Would you like verified investors on DecisionLab to be able to discover this startup and view your report? Only investors looking for your stage will see it. You choose once now, so pick what you're comfortable with.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleShareChoice(false)}
              disabled={savingShare}
              className="flex-1 px-6 py-4 rounded-2xl bg-brand-card border border-white/5 text-brand-text-secondary hover:text-white text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95"
            >
              No, keep it private
            </button>
            <button
              onClick={() => handleShareChoice(true)}
              disabled={savingShare}
              className="flex-1 px-6 py-4 rounded-2xl bg-brand-accent text-brand-text-primary text-[11px] font-black uppercase tracking-widest shadow-lg shadow-brand-accent/20 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              {savingShare ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Yes, share it
            </button>
          </div>
          <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest mt-6">This is a one-time choice for this analysis</p>
        </div>
      </div>
    );
  }

  // When an investor is selected, take over the screen with the full-page,
  // tabbed Investor Playbook (built instantly from this analysis).
  if (playbookInvestor) {
    return (
      <InvestorPlaybookView
        investor={playbookInvestor}
        sections={buildInvestorPlaybook(playbookInvestor, currentAnalysis, displayProfile)}
        companyName={(displayProfile.companyName || 'Your Startup').replace(/\./g, '')}
        score={getCalculatedVentureScore(currentAnalysis.scores)}
        onBack={() => setPlaybookInvestor(null)}
      />
    );
  }

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
    <MotionConfig transition={{ duration: 0 }}>
      <div className="space-y-16 max-w-7xl mx-auto pb-24 px-4 sm:px-6 lg:px-8 bg-brand-bg text-brand-text-primary">
      
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
              onClick={handleExportExecutiveReport}
              disabled={isExporting}
              className="px-10 py-6 bg-brand-accent text-brand-text-primary rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-105 hover:bg-brand-accent/90 transition-all flex items-center gap-3 w-full lg:w-auto justify-center shadow-brand-accent/20 active:scale-95 disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              {isExporting ? 'Generating...' : 'Download Project'}
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
              <div className="p-8 border-b border-brand-border/10 flex justify-between items-center bg-brand-card/50">
                <div>
                  <h3 className="text-xl font-black text-brand-text-primary uppercase tracking-tight">Your Profile</h3>
                  <p className="text-[10px] text-brand-text-secondary uppercase tracking-widest mt-1">Refine your data for more precise results</p>
                </div>
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="p-2 hover:bg-brand-hover rounded-full text-brand-text-secondary transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                <div className="flex items-center justify-between p-6 bg-brand-bg/40 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-brand-text-primary uppercase tracking-widest block">Core Synchronization Mode</label>
                    <p className="text-[10px] text-brand-text-secondary/50 uppercase tracking-widest">Toggle real-time recalculation of all scores and investments</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                      className={cn(
                        "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                        autoSyncEnabled 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold"
                          : "bg-red-500/10 border-red-500/30 text-red-400 font-extrabold"
                      )}
                    >
                      AUTO-SYNC {autoSyncEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

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
                              <label className="block text-[9px] font-black text-brand-text-secondary/50 uppercase tracking-[0.2em] mb-2">{field.label}</label>
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

              <div className="p-8 border-t border-brand-border/10 bg-brand-card/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 size={16} />
                  </div>
                  <p className="text-[12px] text-slate-300 font-medium tracking-[0.02em] opacity-95 max-w-[220px]">Changes are synced to our modeling engine in real-time</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 sm:flex-none px-6 py-4 border border-brand-border/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-text-secondary hover:bg-brand-hover transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={isSyncing}
                    className="flex-1 sm:flex-none px-6 py-4 bg-brand-card hover:bg-brand-hover text-white border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Quick Save & Sync
                  </button>
                  <button 
                    onClick={handleSyncAndReanalyze}
                    disabled={isSyncing}
                    className="flex-1 sm:flex-none px-6 py-4 bg-brand-accent text-brand-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {isSyncing ? (
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-brand-accent rounded-full animate-spin" />
                    ) : <Wand2 size={14} />}
                    Deep AI Refine
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. WORKSPACE SYSTEM - TWO COLUMN GRID */}
      <div className="grid grid-cols-1 gap-10 relative z-10 pt-4">
        

        {/* MAIN WORKSPACE (full width) */}
        <div className="space-y-12">

          <div id="command-center-tabs" className={cn("flex flex-wrap items-center justify-start gap-3 border-b border-white/5 pb-8 no-print relative z-10", investorView && "hidden")}>
        {[
          { id: 'overview', label: '01 / Startup Overview', icon: <LayoutGrid size={15} /> },
          { id: 'analysis', label: '02 / Key Insights', icon: <BarChart3 size={15} /> },
          { id: 'risk', label: '03 / Risks', icon: <ShieldAlert size={15} /> },
          { id: 'growth', label: '04 / Growth Opportunities', icon: <TrendingUp size={15} /> },
          { id: 'team', label: 'TeamLab', icon: <Users size={15} /> },
          { id: 'investors', label: '05 / Investors', icon: <Handshake size={15} /> },
          { id: 'reports', label: '06 / Reports', icon: <FileText size={15} /> },
          { id: 'architect', label: '07 / Pitch Deck Architect', icon: <Presentation size={15} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
              activeTab === tab.id
                ? "bg-brand-accent text-brand-text-primary shadow-xl shadow-brand-accent/20 border-b-2 border-brand-accent scale-102"
                : "bg-brand-section text-brand-text-secondary hover:text-white border border-brand-border/15 hover:border-brand-border/60"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={effectiveTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4 }}
          className="space-y-12 min-h-[500px]"
        >
          {/* ==================== 01 / OVERVIEW TAB ==================== */}
          {effectiveTab === 'overview' && investorView && (
            <div className="space-y-8">
              {/* ── Idea summary + score ─────────────────────────────────── */}
              <section className="bg-brand-section p-8 lg:p-12 rounded-[3rem] border border-brand-border shadow-huge">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                  <div className="min-w-0">
                    <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.35em] block mb-3">Investor Brief</span>
                    <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-4">
                      {(currentAnalysis.startupProfile?.companyName || 'This Venture').replace(/\./g, '')}
                    </h3>
                    <p className="text-base text-slate-200 font-medium leading-relaxed max-w-2xl">
                      {(currentAnalysis.startupProfile?.businessDescription || currentAnalysis.ideaDescription || currentAnalysis.marketAnalysis?.overview || 'A high-scoring venture opportunity.').replace(/\./g, '. ').trim()}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-5">
                      {currentAnalysis.startupProfile?.industry && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent bg-brand-accent/10 px-3 py-1.5 rounded-lg border border-brand-accent/20">{currentAnalysis.startupProfile.industry}</span>
                      )}
                      {currentAnalysis.startupProfile?.stage && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#5da9ff] bg-[#5da9ff]/10 px-3 py-1.5 rounded-lg border border-[#5da9ff]/20">{currentAnalysis.startupProfile.stage}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-center bg-[#0c1421] rounded-[2rem] border border-white/5 px-8 py-6">
                    <div className="text-5xl font-black text-brand-accent tabular-nums leading-none">{getCalculatedVentureScore(currentAnalysis.scores)}%</div>
                    <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.3em] mt-2">Venture Score</div>
                  </div>
                </div>
              </section>

              {/* ── Market + Competition side by side ─────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-brand-section p-8 rounded-[2.5rem] border border-brand-border">
                  <h4 className="text-lg font-black text-brand-text-primary uppercase tracking-tight font-display mb-5">Market Opportunity</h4>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-[#0c1421] rounded-2xl p-4 border border-white/5">
                      <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mb-1">Size</div>
                      <div className="text-base font-black text-white">{formatMarketSize(currentAnalysis.marketAnalysis?.sizeEstimate)}</div>
                    </div>
                    <div className="bg-[#0c1421] rounded-2xl p-4 border border-white/5">
                      <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mb-1">Demand</div>
                      <div className="text-base font-black text-[#5ce1e6]">{extractStatusWord(currentAnalysis.marketAnalysis?.demandSignals, 'Moderate')}</div>
                    </div>
                    <div className="bg-[#0c1421] rounded-2xl p-4 border border-white/5">
                      <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mb-1">Growth</div>
                      <div className="text-base font-black text-emerald-400">{extractStatusWord(currentAnalysis.marketAnalysis?.growthTrends, 'Steady')}</div>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-brand-text-secondary leading-relaxed">
                    {summarizeToBullets(currentAnalysis.marketAnalysis?.overview || 'Large active market with room for focused solutions', 3).map((b, i) => (
                      <li key={i} className="flex gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0" />{b}</li>
                    ))}
                  </ul>
                </section>

                <section className="bg-brand-section p-8 rounded-[2.5rem] border border-brand-border">
                  <h4 className="text-lg font-black text-brand-text-primary uppercase tracking-tight font-display mb-5">Competition &amp; Edge</h4>
                  <div className="bg-[#0c1421] rounded-2xl p-4 border border-white/5 mb-5 inline-block">
                    <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mb-1">Competition Level</div>
                    <div className="text-base font-black text-amber-400">{extractStatusWord(currentAnalysis.competitorAnalysis?.saturationLevel, 'Medium', /low|medium|high/i)}</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest mb-2">Market Gap</div>
                    <ul className="space-y-2 text-sm text-brand-text-secondary leading-relaxed">
                      {summarizeToBullets(currentAnalysis.competitorAnalysis?.marketGaps || 'No clear leader on trust and pricing', 2).map((b, i) => (
                        <li key={i} className="flex gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest mb-2">Their Edge</div>
                    <ul className="space-y-2 text-sm text-brand-text-secondary leading-relaxed">
                      {summarizeToBullets(currentAnalysis.competitorAnalysis?.competitiveAdvantages || 'Better customer experience', 2).map((b, i) => (
                        <li key={i} className="flex gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />{b}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>

              {/* ── Key Insights ─────────────────────────────────────────── */}
              {currentAnalysis.keyInsights && currentAnalysis.keyInsights.length > 0 && (
                <section className="bg-brand-section p-8 rounded-[2.5rem] border border-brand-border">
                  <h4 className="text-lg font-black text-brand-text-primary uppercase tracking-tight font-display mb-5">Key Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentAnalysis.keyInsights.map((insight: string, idx: number) => (
                      <div key={idx} className="bg-[#0c1421] rounded-2xl p-5 border border-white/5 flex gap-3">
                        <span className="text-[10px] font-black text-brand-accent tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                        <span className="text-sm text-brand-text-secondary font-medium leading-relaxed">{insight}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── SWOT ─────────────────────────────────────────────────── */}
              <section className="bg-brand-section p-8 lg:p-12 rounded-[3rem] border border-brand-border shadow-huge">
                <div className="mb-6">
                  <h4 className="text-xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-2">SWOT Analysis</h4>
                  <p className="text-sm text-brand-text-muted font-bold">Strengths, weaknesses, opportunities, and threats — with why each matters</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {([
                    { key: 'strengths', label: 'Strengths', letter: 'S', cls: 'bg-emerald-500/10 text-emerald-400' },
                    { key: 'weaknesses', label: 'Weaknesses', letter: 'W', cls: 'bg-rose-500/10 text-rose-400' },
                    { key: 'opportunities', label: 'Opportunities', letter: 'O', cls: 'bg-sky-500/10 text-sky-400' },
                    { key: 'threats', label: 'Threats', letter: 'T', cls: 'bg-amber-500/10 text-amber-400' },
                  ] as any[]).map((q) => {
                    const items = (currentAnalysis.swot?.[q.key]) || [];
                    return (
                      <div key={q.key} className="bg-[#0c1421] p-6 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs font-mono ${q.cls}`}>{q.letter}</div>
                          <h5 className="text-xs font-black text-slate-100 uppercase tracking-widest">{q.label}</h5>
                        </div>
                        {items.length > 0 ? (
                          <ul className="space-y-4">
                            {items.map((it: any, i: number) => (
                              <li key={i} className="pl-4 border-l-2 border-white/10">
                                <span className="block text-sm text-slate-100 font-black">{typeof it === 'string' ? it : it.point}</span>
                                {typeof it !== 'string' && it.why && (
                                  <span className="block mt-1 text-xs text-brand-text-muted font-medium leading-relaxed">{it.why}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-brand-text-muted font-medium">Not available for this analysis.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {effectiveTab === 'overview' && !investorView && (
            <div className="space-y-12">
              <section className="bg-brand-section p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-brand-accent/10 transition-all duration-1000" />
                <div className="relative">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
                    <div>
                      <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-3">Startup Overview</h3>
                      <p className="text-lg text-slate-300 font-medium tracking-[0.02em] opacity-95">Overall evaluation of your startup idea</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.3em] mb-2">Startup Score</h4>
                      <p className="text-4xl font-black text-brand-accent tabular-nums">
                        {getCalculatedVentureScore(currentAnalysis.scores)}%
                      </p>
                    </div>
                  </div>

                  {/* Single Startup Score visualization — real pentagon/hexagon
                      radar chart. Hover any vertex for the explanation. */}
                  <StartupScoreRadar scores={currentAnalysis.scores || {}} />

                  <div className="mt-12 p-8 bg-brand-card/30 border border-brand-border/20 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-brand-accent uppercase tracking-widest mb-4">Final Verdict</h4>
                      <p className="text-lg font-bold text-brand-text-primary leading-relaxed italic opacity-90">
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

              <section className="bg-brand-section/40 p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge relative">
                <h4 className="text-xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-6">Executive Summary</h4>
                <p className="text-base text-slate-300 leading-relaxed font-sans">{displayProfile.businessDescription || currentAnalysis.ideaDescription}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pt-10 border-t border-white/5">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-secondary/60">Selected Industry</span>
                    <p className="text-sm text-slate-200 font-bold">{displayProfile.industry || 'Enterprise SaaS'}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-secondary/60">Validated Venture Stage</span>
                    <p className="text-sm text-brand-accent font-black uppercase tracking-widest">{displayProfile.stage || 'Idea Stage'}</p>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
                  <h4 className="text-sm font-black text-brand-accent uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-brand-accent animate-pulse" />
                    01 Key Insights
                  </h4>
                  {currentAnalysis.keyInsights && currentAnalysis.keyInsights.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentAnalysis.keyInsights.map((insight: string, idx: number) => (
                        <div key={idx} className="bg-[#0b1320] border border-brand-border/10 p-5 rounded-xl flex items-start gap-4 hover:border-brand-accent/30 transition-all">
                          <span className="text-xs font-mono text-brand-accent font-black font-semibold">0{idx + 1}</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">{insight}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                      <div className="bg-[#0b1320] border border-brand-border/15 p-5 rounded-xl flex items-start gap-4 hover:border-brand-accent/30 transition-all text-xs">
                        <span className="text-xs font-mono text-brand-accent font-black">01</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">Defensive Concept Capability: Excellent foundational business logic with robust early stage proof elements.</p>
                      </div>
                      <div className="bg-[#0b1320] border border-brand-border/15 p-5 rounded-xl flex items-start gap-4 hover:border-brand-accent/30 transition-all text-xs">
                        <span className="text-xs font-mono text-brand-accent font-black">02</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">Strategic Market Signals: Initial target sectors demonstrate major expansion trends over standard VC benchmarks.</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ==================== 02 / STARTUP SUMMARY TAB ==================== */}
          {effectiveTab === 'analysis' && (
            <div className="space-y-12">
              <section className="bg-brand-section p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative">
                  <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-3">Key Insights</h3>
                  <p className="text-lg text-slate-300 font-medium tracking-[0.02em] opacity-95">Overall evaluation of your startup idea</p>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Market Opportunity card — compact, scannable, max 3 bullets */}
                <div className="bg-brand-section/80 p-7 rounded-[2rem] border border-brand-border shadow-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent rounded-lg flex items-center justify-center shrink-0">
                      <Globe size={16} />
                    </div>
                    <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-tight">Market Opportunity</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3.5 bg-brand-card/40 rounded-xl border border-white/5">
                      <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-wider mb-1">Market Size</p>
                      <p className="text-lg font-black text-white">{formatMarketSize(currentAnalysis.marketAnalysis?.sizeEstimate)}</p>
                    </div>
                    <div className="p-3.5 bg-brand-card/40 rounded-xl border border-white/5">
                      <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-wider mb-1">Demand</p>
                      <p className="text-lg font-black text-[#5ce1e6]">{extractStatusWord(currentAnalysis.marketAnalysis?.demandSignals, 'Moderate')}</p>
                    </div>
                    <div className="p-3.5 bg-brand-card/40 rounded-xl border border-white/5 col-span-2">
                      <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-wider mb-1">Growth</p>
                      <p className="text-lg font-black text-emerald-400">{extractStatusWord(currentAnalysis.marketAnalysis?.growthTrends, 'Steady')}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[9px] font-black text-brand-accent uppercase tracking-wider mb-2.5">Why It Matters</p>
                    <ul className="space-y-1.5">
                      {summarizeToBullets(currentAnalysis.marketAnalysis?.overview || 'Large active market with room for focused solutions', 3).map((bullet, i) => (
                        <li key={i} className="flex gap-2 text-xs text-slate-300 leading-snug">
                          <span className="text-brand-accent shrink-0">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Competition & Revenue card — compact, scannable, max 3 bullets */}
                <div className="bg-brand-section/80 p-7 rounded-[2rem] border border-brand-border shadow-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 bg-brand-coral/10 border border-brand-coral/20 text-brand-coral rounded-lg flex items-center justify-center shrink-0">
                      <Shield size={16} />
                    </div>
                    <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-tight">Competition & Revenue</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3.5 bg-brand-card/40 rounded-xl border border-white/5">
                      <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-wider mb-1">Competition</p>
                      <p className="text-lg font-black text-amber-400">{extractStatusWord(currentAnalysis.competitorAnalysis?.saturationLevel, 'Medium', /low|medium|high/i)}</p>
                    </div>
                    <div className="p-3.5 bg-brand-card/40 rounded-xl border border-white/5">
                      <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-wider mb-1">Revenue Potential</p>
                      <p className="text-lg font-black text-emerald-400">High</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-wider mb-2.5">Biggest Gap</p>
                      <ul className="space-y-1.5">
                        {summarizeToBullets(currentAnalysis.competitorAnalysis?.marketGaps || 'No clear leader on trust and pricing', 2).map((bullet, i) => (
                          <li key={i} className="flex gap-2 text-xs text-slate-300 leading-snug">
                            <span className="text-brand-coral shrink-0">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-brand-accent uppercase tracking-wider mb-2.5">Your Edge</p>
                      <ul className="space-y-1.5">
                        {summarizeToBullets(currentAnalysis.competitorAnalysis?.competitiveAdvantages || 'Better customer experience', 2).map((bullet, i) => (
                          <li key={i} className="flex gap-2 text-xs text-slate-300 leading-snug">
                            <span className="text-brand-accent shrink-0">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* SWOT Matrix Grid */}
              <div className="bg-brand-section/50 p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge space-y-8">
                <div>
                  <h4 className="text-xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-2">SWOT Analysis</h4>
                  <p className="text-sm text-brand-text-muted font-bold">A simple look at your strengths, weaknesses, opportunities, and threats</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* S */}
                  <div className="bg-[#0c1421] p-8 rounded-[2rem] border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs font-mono">S</div>
                      <h5 className="text-xs font-black text-slate-100 uppercase tracking-widest">Strengths</h5>
                    </div>
                    <ul className="space-y-4 text-xs text-brand-text-secondary leading-relaxed">
                      {(currentAnalysis.swot?.strengths && currentAnalysis.swot.strengths.length > 0) ? (
                        currentAnalysis.swot.strengths.map((it: any, i: number) => (
                          <li key={i} className="pl-4 border-l-2 border-white/10">
                            <span className="block text-slate-100 font-black">{typeof it === 'string' ? it : it.point}</span>
                            {typeof it !== 'string' && it.why && (
                              <span className="block mt-1 text-brand-text-muted font-medium">{it.why}</span>
                            )}
                          </li>
                        ))
                      ) : (
                        <>
                        <li>Strong core concept and defensible technology.</li>
                        <li>Validated execution under demanding conditions.</li>
                        </>
                      )}
                    </ul>
                  </div>
                  {/* W */}
                  <div className="bg-[#0c1421] p-8 rounded-[2rem] border border-brand-coral/10 hover:border-brand-coral/30 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-brand-coral/10 flex items-center justify-center text-brand-coral font-black text-xs font-mono">W</div>
                      <h5 className="text-xs font-black text-slate-100 uppercase tracking-widest">Weaknesses</h5>
                    </div>
                    <ul className="space-y-4 text-xs text-brand-text-secondary leading-relaxed">
                      {(currentAnalysis.swot?.weaknesses && currentAnalysis.swot.weaknesses.length > 0) ? (
                        currentAnalysis.swot.weaknesses.map((it: any, i: number) => (
                          <li key={i} className="pl-4 border-l-2 border-white/10">
                            <span className="block text-slate-100 font-black">{typeof it === 'string' ? it : it.point}</span>
                            {typeof it !== 'string' && it.why && (
                              <span className="block mt-1 text-brand-text-muted font-medium">{it.why}</span>
                            )}
                          </li>
                        ))
                      ) : (
                        <>
                        <li>Early operational stage with limited traction.</li>
                        <li>Requires capital to scale the team.</li>
                        </>
                      )}
                    </ul>
                  </div>
                  {/* O */}
                  <div className="bg-[#0c1421] p-8 rounded-[2rem] border border-brand-accent/10 hover:border-brand-accent/30 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent font-black text-xs font-mono">O</div>
                      <h5 className="text-xs font-black text-slate-100 uppercase tracking-widest">Opportunities</h5>
                    </div>
                    <ul className="space-y-4 text-xs text-brand-text-secondary leading-relaxed">
                      {(currentAnalysis.swot?.opportunities && currentAnalysis.swot.opportunities.length > 0) ? (
                        currentAnalysis.swot.opportunities.map((it: any, i: number) => (
                          <li key={i} className="pl-4 border-l-2 border-white/10">
                            <span className="block text-slate-100 font-black">{typeof it === 'string' ? it : it.point}</span>
                            {typeof it !== 'string' && it.why && (
                              <span className="block mt-1 text-brand-text-muted font-medium">{it.why}</span>
                            )}
                          </li>
                        ))
                      ) : (
                        <>
                        <li>Expansion into adjacent high-growth markets.</li>
                        <li>Partnerships and integrations to accelerate adoption.</li>
                        </>
                      )}
                    </ul>
                  </div>
                  {/* T */}
                  <div className="bg-[#0c1421] p-8 rounded-[2rem] border border-brand-amber/10 hover:border-brand-amber/30 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-brand-amber/10 flex items-center justify-center text-brand-amber font-black text-xs font-mono">T</div>
                      <h5 className="text-xs font-black text-slate-100 uppercase tracking-widest">Threats</h5>
                    </div>
                    <ul className="space-y-4 text-xs text-brand-text-secondary leading-relaxed">
                      {(currentAnalysis.swot?.threats && currentAnalysis.swot.threats.length > 0) ? (
                        currentAnalysis.swot.threats.map((it: any, i: number) => (
                          <li key={i} className="pl-4 border-l-2 border-white/10">
                            <span className="block text-slate-100 font-black">{typeof it === 'string' ? it : it.point}</span>
                            {typeof it !== 'string' && it.why && (
                              <span className="block mt-1 text-brand-text-muted font-medium">{it.why}</span>
                            )}
                          </li>
                        ))
                      ) : (
                        <>
                        <li>Incumbent pricing pressure on early market capture.</li>
                        <li>Regulatory and talent-availability risks.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Investor Readiness & Business Model Analysis */}
              <div className="bg-brand-section/40 p-10 rounded-[2.5rem] border border-brand-border/20 flex flex-col md:flex-row items-center gap-12 justify-between">
                <div>
                  <h4 className="text-lg font-black text-brand-text-primary uppercase tracking-tight font-display mb-2">Investor Readiness and Business Model</h4>
                  <p className="text-sm text-brand-text-muted font-bold leading-relaxed max-w-2xl">
                    Model: {displayProfile.businessType || 'B2B'} with {displayProfile.productType || 'SaaS Platform'}
                    <span className="block mt-1">Next step: {(currentAnalysis as any).investorReadinessRouting || 'Start with angels'}</span>
                  </p>
                </div>
                <div className="bg-[#0f1d2d] border border-white/5 rounded-2xl px-8 py-5 flex items-center gap-4 text-xs font-black font-mono">
                  <ShieldCheck className="text-emerald-400" />
                  <span className="uppercase tracking-widest text-[#5ce1e6]">STARTUP READY</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 03 / RISK CENTER TAB ==================== */}
          {effectiveTab === 'risk' && (
            <div className="space-y-12">
              <section className="bg-brand-section p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-coral/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-3">Risks</h3>
                      <p className="text-lg text-slate-300 font-medium tracking-[0.02em] opacity-95">What are the risks</p>
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
                      <div className="bg-brand-card/50 p-8 rounded-[2.5rem] border border-brand-border/20 shadow-inner">
                        <p className="text-lg font-bold text-brand-text-primary leading-relaxed opacity-70">
                          "{currentAnalysis.topInvestorTakeaway}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-brand-section/80 p-10 rounded-[2.5rem] border border-brand-border shadow-huge">
                <div className="flex items-center gap-4 mb-8">
                  <ShieldAlert className="text-brand-coral" size={24} />
                  <h4 className="text-xl font-black text-brand-text-primary uppercase tracking-tight">Things to Fix</h4>
                </div>
                <RiskHeatmap risks={currentAnalysis.riskMatrix || currentAnalysis.risks} />
              </section>
            </div>
          )}

          {/* ==================== 04 / GROWTH CENTER TAB ==================== */}
          {effectiveTab === 'growth' && (
            <div className="space-y-12">
              <section className="bg-brand-section p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 blur-[120px] rounded-full" />
                <div className="relative">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                      <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-3">Growth Opportunities</h3>
                      <p className="text-lg text-slate-300 font-medium tracking-[0.02em] opacity-95">How can it grow</p>
                    </div>
                    <div className="px-6 py-4 bg-brand-card/50 border border-brand-border rounded-2xl flex items-center gap-4 shadow-lg shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-ping" />
                      <span className="text-xs font-black text-brand-text-primary uppercase tracking-widest leading-none">Trajectory Locked</span>
                    </div>
                  </div>

                  <StrategicExpansionJourney roadmap={currentAnalysis.roadmap} />
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-brand-section/60 p-10 rounded-[2.5rem] border border-brand-border shadow-huge">
                  <h4 className="text-lg font-black text-brand-text-primary uppercase tracking-tight mb-4">Growth and Expansion Strategy</h4>
                  <p className="text-sm text-brand-text-secondary leading-relaxed font-medium">
                    {currentAnalysis.growthPotential?.scaling || 'Venture scalability focused on expanding node configurations across enterprise private database clusters.'}
                  </p>
                </div>
                <div className="bg-brand-section/60 p-10 rounded-[2.5rem] border border-brand-border shadow-huge">
                  <h4 className="text-lg font-black text-[#5ce1e6] uppercase tracking-tight mb-4">Revenue and Market Entry Opportunities</h4>
                  <p className="text-sm text-brand-text-secondary leading-relaxed font-medium">
                    {currentAnalysis.growthPotential?.revenue || 'Target monetization via multi-tiered SaaS subscription volume modules, launching early accelerator sandboxes.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 05 / INVESTOR MATCHING TAB ==================== */}
          {effectiveTab === 'team' && (
            <TeamLabPanel
              startupId={(currentAnalysis as any).id || ''}
              founderId={(currentAnalysis as any).userId || ''}
              startupName={currentAnalysis.startupProfile?.companyName || currentAnalysis.ideaDescription}
              industry={currentAnalysis.startupProfile?.industry}
              stage={currentAnalysis.startupProfile?.stage}
              canEdit={!investorView && (currentAnalysis as any).userId === ((profile as any)?.uid || (profile as any)?.userId)}
            />
          )}

          {effectiveTab === 'investors' && (() => {
            const ind = (currentAnalysis.startupProfile?.industry || 'Intelligent Systems').trim();
            const stage = (currentAnalysis.startupProfile?.stage || 'Idea Stage').trim();
            const region = (currentAnalysis.startupProfile?.country || 'GCC').trim();
            const model = (currentAnalysis.startupProfile?.businessType || 'B2B').trim();
            const vScore = getCalculatedVentureScore(currentAnalysis.scores);

            const realMatches = currentAnalysis.investorMatching;
            const matches = (Array.isArray(realMatches) && realMatches.length > 0)
              ? realMatches.map((m: any, idx: number) => ({
                  id: m.id || `investor_${idx}`,
                  name: (m.name || 'Unnamed Investor').replace(/\./g, ''),
                  type: m.type || 'Investor',
                  category: (m.type || '').toLowerCase().includes('angel') ? 'angels'
                    : (m.type || '').toLowerCase().includes('accelerat') ? 'accelerators'
                    : (m.type || '').toLowerCase().includes('family') ? 'family'
                    : (m.type || '').toLowerCase().includes('corporate') || (m.type || '').toLowerCase().includes('strategic') ? 'strategic'
                    : 'vcs',
                  industryFocus: m.focus || ind,
                  stageFocus: m.stage || stage,
                  checkSize: m.checkSize || '',
                  region: m.region || region,
                  matchScore: typeof m.matchScore === 'number' ? m.matchScore : vScore,
                  thesis: m.whyFit || m.suggestedPitch || '',
                  pitchAdvice: m.whatTheyLookFor || m.suggestedPitch || '',
                }))
              : [];

            const filteredMatches = investorCategory === 'all' 
              ? matches 
              : matches.filter(m => m.category === investorCategory);

            return (
              <div className="space-y-12">
                {/* Venture Capital Search Intelligence Summary Banner */}
                <section className="bg-brand-section p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-brand-accent/10 transition-all duration-1000" />
                  <div className="relative">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
                      <div>
                        <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] block mb-3">Investors</span>
                        <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display mb-3 font-semibold">Which investors fit my startup</h3>
                        <p className="text-base text-slate-300 font-medium tracking-[0.2px] max-w-2xl">
                          Matching you with people who fund your industry
                        </p>
                      </div>
                      <div className="flex items-center gap-4 bg-brand-card/45 border border-white/5 p-4 rounded-3xl shrink-0 self-start lg:self-auto">
                        <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent shrink-0">
                          <Handshake size={24} />
                        </div>
                        <div>
                          <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest leading-none mb-1.5">Capital Match Pool</div>
                          <div className="text-lg font-black text-white">{matches.length} Targets Found</div>
                        </div>
                      </div>
                    </div>

                    {/* Startup Profile Sync Credentials Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-brand-bg/40 rounded-[2rem] border border-white/5">
                      <div className="p-4 rounded-2xl bg-brand-card/20 space-y-1 border border-white/5">
                        <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-wider block">Target Industry</span>
                        <span className="text-xs font-bold text-white uppercase tracking-tight block truncate" title={ind}>{ind}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-brand-card/20 space-y-1 border border-white/5">
                        <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-wider block">Venture Stage</span>
                        <span className="text-xs font-bold text-[#5da9ff] uppercase tracking-tight block truncate" title={stage}>{stage}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-brand-card/20 space-y-1 border border-white/5">
                        <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-wider block">Target Region</span>
                        <span className="text-xs font-bold text-white uppercase tracking-tight block truncate" title={region}>{region}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-brand-card/20 space-y-1 border border-white/5">
                        <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-wider block">Service Model</span>
                        <span className="text-xs font-bold text-white uppercase tracking-tight block truncate" title={model}>{model}</span>
                      </div>
                      <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-brand-accent/10 space-y-1 border border-brand-accent/10">
                        <span className="text-[9px] font-black text-brand-accent uppercase tracking-wider block">Startup Strength Score</span>
                        <span className="text-xs font-black text-[#5ce1e6] uppercase tracking-tight block font-mono">{vScore}%</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Sub category filter tabs and results */}
                <div className="space-y-8">
                  <div className="flex flex-wrap items-center justify-start gap-2 bg-brand-bg/40 p-2 rounded-[2rem] border border-white/5 max-w-fit">
                    {[
                      { key: 'all', label: 'All Matches', icon: <LayoutGrid size={13} /> },
                      { key: 'angels', label: 'Potential Angels', icon: <User size={13} /> },
                      { key: 'vcs', label: 'Potential VCs', icon: <Building2 size={13} /> },
                      { key: 'accelerators', label: 'Accelerators & Incubators', icon: <Rocket size={13} /> },
                      { key: 'strategic', label: 'Strategic Capital', icon: <Target size={13} /> },
                      { key: 'family', label: 'Family Offices', icon: <Globe size={13} /> }
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => {
                          setInvestorCategory(btn.key as any);
                          setExpandedThesisId(null);
                        }}
                        className={cn(
                          "px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                          investorCategory === btn.key
                            ? "bg-brand-accent text-brand-text-primary shadow-lg"
                            : "bg-transparent text-brand-text-secondary hover:text-white hover:bg-brand-card/20"
                        )}
                      >
                        {btn.icon}
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Investor Cards Listing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full box-border">
                    {filteredMatches.length === 0 && (
                      <div className="col-span-full p-12 text-center bg-brand-section/60 border border-dashed border-white/10 rounded-[2.5rem]">
                        <Handshake size={40} className="text-brand-accent/40 mx-auto mb-4" />
                        <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-tight mb-2">No investor matches yet</h4>
                        <p className="text-xs text-brand-text-secondary font-medium max-w-md mx-auto leading-relaxed">
                          Investor matches are generated from your analysis. Edit your profile and run "Deep AI Refine" to generate investors aligned to your idea and stage.
                        </p>
                      </div>
                    )}
                    {filteredMatches.map((investor) => {
                      const isExpanded = expandedThesisId === investor.id;
                      return (
                        <div 
                          key={investor.id}
                          className="bg-brand-section border border-brand-border hover:border-brand-accent/40 rounded-[2.5rem] p-8 space-y-6 transition-all duration-300 flex flex-col justify-between group/card h-full"
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest block mb-1">{investor.type}</span>
                                <h4 className="text-lg font-black text-white uppercase tracking-tight">{investor.name}</h4>
                              </div>
                              <div className="px-3 py-2 rounded-xl bg-brand-accent/15 border border-brand-accent/20 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[8px] font-black text-brand-text-muted uppercase tracking-wider">Match</span>
                                <span className="text-sm font-black text-[#5ce1e6] font-mono leading-none mt-0.5">{investor.matchScore}%</span>
                              </div>
                            </div>

                            <div className="space-y-3.5 pt-3 border-t border-white/5">
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-wider block">Industry Segment</span>
                                <span className="text-white font-semibold block uppercase text-xs leading-snug break-words">{investor.industryFocus}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-wider block">Stage Scope</span>
                                <span className="text-white font-semibold block uppercase text-xs leading-snug break-words">{investor.stageFocus}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-wider block">Check Framework</span>
                                <span className="text-brand-accent font-black font-mono tracking-tight block uppercase text-xs leading-snug break-words">{investor.checkSize}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-wider block">Geographic Focus</span>
                                <span className="text-white font-semibold block uppercase text-xs leading-snug break-words">{investor.region}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-white/5">
                            <button
                              onClick={() => setPlaybookInvestor(investor)}
                              className="w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer bg-brand-accent/10 hover:bg-brand-accent text-brand-accent hover:text-brand-text-primary border border-brand-accent/20"
                            >
                              <span>Investor Playbook</span>
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ==================== 06 / REPORTS TAB ==================== */}
          {effectiveTab === 'reports' && (
            <div className="space-y-12">
              <section className="bg-brand-section p-10 lg:p-14 rounded-[3.5rem] border border-brand-border/20 shadow-huge text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-brand-accent/5 blur-[120px] rounded-full" />
                <div className="relative max-w-lg mx-auto space-y-8 py-8">
                  <FileText size={56} className="text-brand-accent mx-auto" strokeWidth={1} />
                  <div>
                    <h3 className="text-3xl font-black text-slate-100 uppercase tracking-tight font-display">Download & Export Reports</h3>
                    <p className="text-base text-slate-400 mt-2 font-medium">Compile the complete validated startup analytical dossier to present to institutional stakeholders and angels</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={handleExportExecutiveReport}
                      disabled={isExporting}
                      className="px-8 py-5 bg-brand-accent text-brand-text-primary rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-accent/20 flex items-center gap-3 w-full sm:w-auto justify-center active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {isExporting ? 'Generating Report...' : 'Download Executive PDF'}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-8 py-5 bg-brand-card text-brand-text-secondary border border-brand-border/20 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-hover active:scale-95 transition-all w-full sm:w-auto"
                    >
                      Print Layout Dossier
                    </button>
                  </div>
                  <div className="text-[10px] text-brand-text-muted font-bold font-mono tracking-widest uppercase">
                    PRODUCED BY DECISIONLAB • VALIDATED BY VC COMMAND HUB
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ==================== 07 / PITCH DECK ARCHITECT TAB ==================== */}
          {effectiveTab === 'architect' && (
            <div className="space-y-12">
              <section className="bg-brand-section p-10 lg:p-14 rounded-[3.5rem] border border-brand-border shadow-huge relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-brand-accent/10 transition-all duration-1000" />
                <div className="relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div>
                      <h3 className="text-3xl font-black text-slate-100 uppercase tracking-tight font-display mb-3">Pitch Deck Architect</h3>
                      <p className="text-lg text-slate-300 font-medium tracking-[0.02em] opacity-95">Integrated access to synchronize validated findings directly into editable vector slides</p>
                    </div>
                    <Link
                      to={`/pitch-deck?projectId=${currentAnalysis.id}`}
                      className="px-8 py-5 bg-brand-accent text-brand-text-primary rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 hover:bg-brand-accent/95 flex items-center gap-3 w-full md:w-auto justify-center shadow-brand-accent/20 active:scale-95 transition-all shrink-0 font-display"
                    >
                      <Presentation size={18} />
                      Launch Deck Editor
                    </Link>
                  </div>

                  {!investorView && <FounderTimeline analysis={currentAnalysis} scoreOverride={getCalculatedVentureScore(currentAnalysis.scores)} canEdit={true} />}
                  <div className="p-8 bg-brand-card/40 border border-brand-border/20 rounded-[2.5rem] space-y-6">
                    <h4 className="text-xs font-black text-[#5ce1e6] uppercase tracking-widest">Real-time Data Synchronization Metrics</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                      <div className="p-5 bg-[#0a1120] border border-slate-800 rounded-xl space-y-1">
                        <span className="text-brand-text-muted uppercase text-[9px] tracking-wider block font-black">Hypothesis Sync</span>
                        <p className="text-white font-bold truncate">{displayProfile.companyName || 'Validated Venture'}</p>
                      </div>
                      <div className="p-5 bg-[#0a1120] border border-slate-800 rounded-xl space-y-1">
                        <span className="text-brand-text-muted uppercase text-[9px] tracking-wider block font-black">Startup Score Sync</span>
                        <p className="text-emerald-400 font-bold">{(currentAnalysis.scores as any)?.overall || (currentAnalysis.scores as any)?.ideaStrength?.score || 85}% locked</p>
                      </div>
                      <div className="p-5 bg-[#0a1120] border border-slate-800 rounded-xl space-y-1">
                        <span className="text-brand-text-muted uppercase text-[9px] tracking-wider block font-black">SWOT Matrix Sync</span>
                        <p className="text-[#5ce1e6] font-bold">4 Categories bound</p>
                      </div>
                      <div className="p-5 bg-[#0a1120] border border-slate-800 rounded-xl space-y-1">
                        <span className="text-brand-text-muted uppercase text-[9px] tracking-wider block font-black">Expansion Journey</span>
                        <p className="text-white font-bold">{currentAnalysis.roadmap ? 'Linked roadmap active' : 'Default roadmap active'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-3 text-xs font-bold text-slate-400 pl-2 leading-relaxed">
                    <Info size={16} className="text-brand-accent animate-pulse shrink-0" />
                    <span>Content Standard: Prohibits generic copy-paste layouts. All 12 slides are derived from completed SWOT, Competitor, Risk and expansion findings.</span>
                  </div>
                </div>
              </section>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

        </div>
      </div>

      {/* Hidden printable Executive Report — captured by
          handleExportExecutiveReport. FIX: html2canvas cannot parse oklch()
          colors, which is what Tailwind v4's color utilities compile to in
          this project — every color below is now set via inline style with a
          plain hex value, so html2canvas never has to parse an oklch() value.
          Only non-color layout classes remain as Tailwind classes. */}
      <div
        ref={reportPrintRef}
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', backgroundColor: '#ffffff', color: '#171717' }}
        className="p-12 space-y-10 font-sans"
      >
        {/* Cover */}
        <div style={{ paddingBottom: '2rem', borderBottom: '2px solid #e5e5e5' }}>
          {/* DecisionLab logo on the exported report. Recolored for a white
              background: the nav version uses a white "L" and white "Decision"
              wordmark (built for the dark navbar) which would be invisible on
              white, so here the "L" and "Decision" are dark and only "Lab"
              stays blue. Solid stroke (not gradient) + no glow filters so the
              PDF engine (html2canvas) renders it reliably every time. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <svg width="46" height="46" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* OUTER D FRAME */}
              <path
                d="M 26 16 H 55 C 76 16 88 31 88 50 C 88 69 76 84 55 84 H 26 Z"
                stroke="#3B82F6"
                strokeWidth="11.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {/* INNER L — dark so it shows on the white report background */}
              <path
                d="M 47 12 V 52 H 93"
                stroke="#0F2540"
                strokeWidth="9.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div style={{ lineHeight: 1 }}>
              <span style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: '#171717' }}>
                Decision<span style={{ color: '#3B82F6' }}>Lab</span>
              </span>
              <p style={{ marginTop: '4px', color: '#93A4B5', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.4em', fontWeight: 500 }}>
                ANALYZE · VALIDATE · GROW
              </p>
            </div>
          </div>
          <p style={{ color: '#2563eb' }} className="text-xs font-black uppercase tracking-[0.3em] mb-2">Executive Report</p>
          <h1 style={{ color: '#171717' }} className="text-4xl font-black uppercase tracking-tight">{displayProfile.companyName || 'Startup Name'}</h1>
          <p style={{ color: '#737373' }} className="text-sm mt-2">{displayProfile.industry} • {displayProfile.city}, {displayProfile.country} • {displayProfile.stage}</p>
        </div>

        {/* Startup Score */}
        <div>
          <h2 style={{ color: '#171717' }} className="text-lg font-black uppercase tracking-tight mb-4">Startup Score</h2>
          <div className="flex items-center gap-6 mb-4">
            <div style={{ color: '#2563eb' }} className="text-5xl font-black">{getCalculatedVentureScore(currentAnalysis.scores)}%</div>
            <p style={{ color: '#404040' }} className="text-sm max-w-md">{typeof currentAnalysis.finalVerdict === 'object' ? currentAnalysis.finalVerdict.description : 'Analysis in progress'}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              ['Idea Strength', 'ideaStrength'], ['Market Fit', 'marketFit'], ['Execution', 'execution'],
              ['Scalability', 'scalability'], ['Competition', 'competition'], ['Investor Appeal', 'investorAppeal'],
            ].map(([label, key]) => {
              const val = (currentAnalysis.scores as any)?.[key];
              const score = typeof val === 'number' ? val : val?.score || 0;
              return (
                <div key={key} style={{ border: '1px solid #e5e5e5', borderRadius: '0.5rem', padding: '0.75rem' }}>
                  <p style={{ color: '#737373' }} className="text-[10px] font-black uppercase">{label}</p>
                  <p style={{ color: '#171717' }} className="text-xl font-black">{score}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <h2 style={{ color: '#171717' }} className="text-lg font-black uppercase tracking-tight mb-3">Executive Summary</h2>
          <p style={{ color: '#404040' }} className="text-sm leading-relaxed">{displayProfile.businessDescription || currentAnalysis.ideaDescription}</p>
        </div>

        {/* Market & Competition */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 style={{ color: '#171717' }} className="text-sm font-black uppercase tracking-tight mb-3">Market Opportunity</h3>
            <p style={{ color: '#525252' }} className="text-xs mb-2">Market Size: <strong style={{ color: '#171717' }}>{formatMarketSize(currentAnalysis.marketAnalysis?.sizeEstimate)}</strong></p>
            <p style={{ color: '#525252' }} className="text-xs mb-2">Demand: <strong style={{ color: '#171717' }}>{extractStatusWord(currentAnalysis.marketAnalysis?.demandSignals, 'Moderate')}</strong></p>
            <p style={{ color: '#525252' }} className="text-xs mb-2">Growth: <strong style={{ color: '#171717' }}>{extractStatusWord(currentAnalysis.marketAnalysis?.growthTrends, 'Steady')}</strong></p>
            <ul style={{ color: '#404040' }} className="text-xs mt-2 space-y-1">
              {summarizeToBullets(currentAnalysis.marketAnalysis?.overview, 3).map((b, i) => <li key={i}>• {b}</li>)}
            </ul>
          </div>
          <div>
            <h3 style={{ color: '#171717' }} className="text-sm font-black uppercase tracking-tight mb-3">Competition & Revenue</h3>
            <p style={{ color: '#525252' }} className="text-xs mb-2">Competition Level: <strong style={{ color: '#171717' }}>{extractStatusWord(currentAnalysis.competitorAnalysis?.saturationLevel, 'Medium')}</strong></p>
            <ul style={{ color: '#404040' }} className="text-xs mt-2 space-y-1">
              {summarizeToBullets(currentAnalysis.competitorAnalysis?.competitiveAdvantages, 2).map((b, i) => <li key={i}>• {b}</li>)}
            </ul>
          </div>
        </div>

        {/* Risks */}
        <div>
          <h2 style={{ color: '#171717' }} className="text-lg font-black uppercase tracking-tight mb-3">Risk Assessment</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(currentAnalysis.riskMatrix || {}).map(([key, val]: any) => (
              <div key={key} style={{ border: '1px solid #e5e5e5', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <p style={{ color: '#737373' }} className="text-[10px] font-black uppercase">{key}</p>
                <p style={{ color: '#404040' }} className="text-xs mt-1">{val.explanation || val.note}</p>
                <p style={{ color: '#737373' }} className="text-[10px] mt-1">Severity: {val.severity} • Impact {val.impact}/10 • Likelihood {val.likelihood}/10</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap — horizontal timeline scale: each duration sits on a
            scale line with its label on top and bullets underneath. All
            colors inline-hex so html2canvas renders the PDF reliably. */}
        <div>
          <h2 style={{ color: '#171717' }} className="text-lg font-black uppercase tracking-tight mb-4">Growth Roadmap</h2>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
            {[
              ['Immediate', currentAnalysis.roadmap?.immediate],
              ['1–3 Months', currentAnalysis.roadmap?.oneToThreeMonths],
              ['3–6 Months', currentAnalysis.roadmap?.threeToSixMonths],
              ['Investor Readiness', currentAnalysis.roadmap?.investorReadiness],
            ].map(([label, items]: any, idx: number, arr: any[]) => (
              <div key={label} style={{ flex: 1, minWidth: 0 }}>
                {/* scale line + node */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ width: '11px', height: '11px', borderRadius: '9999px', backgroundColor: '#2563eb', flexShrink: 0 }} />
                  <div style={{ flex: 1, height: '2px', backgroundColor: idx === arr.length - 1 ? 'transparent' : '#bfdbfe' }} />
                </div>
                {/* duration label on top */}
                <p style={{ color: '#2563eb', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</p>
                {/* bullets under the duration */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {(items || []).map((it: string, i: number) => (
                    <li key={i} style={{ color: '#404040', fontSize: '11px', lineHeight: 1.45, marginBottom: '6px', display: 'flex', gap: '6px' }}>
                      <span style={{ color: '#2563eb', flexShrink: 0 }}>•</span>
                      <span>{String(it).replace(/^[*•\-\s]+/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Investor Matches */}
        <div>
          <h2 style={{ color: '#171717' }} className="text-lg font-black uppercase tracking-tight mb-3">Investor Matches</h2>
          <div className="grid grid-cols-2 gap-4">
            {(currentAnalysis.investorMatching || []).slice(0, 8).map((inv: any, i: number) => (
              <div key={i} style={{ border: '1px solid #e5e5e5', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <p style={{ color: '#171717' }} className="text-xs font-black">{inv.name}</p>
                <p style={{ color: '#737373' }} className="text-[10px] uppercase">{inv.type} • Match {inv.matchScore}%</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e5e5e5', color: '#a3a3a3' }} className="pt-6 text-[10px] uppercase tracking-widest text-center">
          Produced by DecisionLab • Validated by VC Command Hub
        </div>
      </div>
    </div>
    </MotionConfig>
  );
}