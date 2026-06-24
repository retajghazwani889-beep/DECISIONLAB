import React, {
  useState, useEffect, useRef, useCallback, useMemo, CSSProperties,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Check, RotateCcw, RotateCw,
  Copy, Trash2, Plus, Download, Play, Loader2,
  Type, Image as ImageIcon, BarChart3, Square,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  AlertTriangle, ZoomIn, ZoomOut, PanelRight, PanelLeft,
  Palette, Underline, Upload, Move, Lock, Unlock,
  ChevronUp, ChevronDown, X, Maximize2, LayoutGrid,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const CANVAS_W = 1280;
const CANVAS_H = 720;

// ─────────────────────────────────────────────────────────────────────────────
// ELEMENT TYPES
// ─────────────────────────────────────────────────────────────────────────────
type ElementType = 'text' | 'image' | 'shape' | 'chart' | 'kpi' | 'mockup' | 'team';

interface BaseElement {
  id: string;
  type: ElementType;
  x: number; y: number; w: number; h: number;
  rotation?: number;
  locked?: boolean;
  opacity?: number;
  zIndex?: number;
}

interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 400 | 500 | 600 | 700 | 800 | 900;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  color: string;
  align: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  background?: string;
  borderRadius?: number;
  padding?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
}

interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  objectFit: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
  overlay?: string;
}

interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: 'rect' | 'circle' | 'line' | 'triangle';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
}

interface ChartElement extends BaseElement {
  type: 'chart';
  chartType: 'bar' | 'line' | 'donut' | 'area';
  data: Array<{ label: string; value: number }>;
  accent: string;
  textColor: string;
  bg: string;
}

interface KPIElement extends BaseElement {
  type: 'kpi';
  label: string;
  value: string;
  sublabel?: string;
  accent: string;
  textColor: string;
  bg: string;
}

interface MockupElement extends BaseElement {
  type: 'mockup';
  industry: string;
  accent: string;
  bg: string;
  textColor: string;
  screenshotUrl?: string;
  startupName?: string;
  borderRadius?: number;
}

interface TeamCardElement extends BaseElement {
  type: 'team';
  // Founder data
  name: string;
  role: string;
  bio: string;
  photo?: string;             // URL if available, blank = show initials
  linkedin?: string;
  previousCompany?: string;
  previousRole?: string;
  yearsExp?: string;
  achievement?: string;
  isPlaceholder?: boolean;    // if true, show "click to edit" prompts
  // Styling
  accent: string;
  textColor: string;
  bg: string;
  surface: string;
  surfaceStrong: string;
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  cardRadius: number;
  tagStyle: 'pill' | 'bar' | 'label';
  headlineWeight: 700 | 800 | 900;
}

type SlideElement = TextElement | ImageElement | ShapeElement | ChartElement | KPIElement | MockupElement | TeamCardElement;

interface Slide {
  id: string;
  name: string;
  bg: string;
  bgGradient?: string;
  elements: SlideElement[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ORIGINAL TYPES (kept for Firestore mapping)
// ─────────────────────────────────────────────────────────────────────────────
interface DLFounder {
  name: string;
  role: string;
  background: string;
  photo?: string;         // URL to founder photo if available
  linkedin?: string;      // LinkedIn handle or URL
  previousCompany?: string;
  previousRole?: string;
  yearsExp?: string;
  achievement?: string;   // one standout achievement / credential
  isPlaceholder?: boolean;
}
interface DLCompetitor { name: string; weakness: string; ourEdge: string; }
interface DLAnalysis {
  id?: string; startupName: string; tagline: string; vision?: string; industry: string;
  country?: string; stage?: string; overallScore: number; investorReadinessScore: number;
  marketFitScore?: number; scalabilityScore?: number; executionScore?: number;
  founders: DLFounder[]; problemStatement?: string; problemInsights: string[];
  solutionStatement?: string; solutionInsights: string[]; uniqueValueProp?: string;
  productFeatures: string[]; productScreenshots?: string[];
  marketSizing: { tam: string; sam: string; som: string; growthRate: string; overview?: string };
  targetSegments: string[]; revenueStreams: string[]; pricingModel?: string;
  competitors: DLCompetitor[]; competitiveAdvantages?: string[];
  tractionPoints?: string[]; gtmStrategy?: string[]; growthTimeline: string[];
  fundingAsk?: string; fundingUse?: string[];
  revenueProjections?: Array<{ year: string; value: string }>;
  uploadedAssets?: string[]; finalVerdict?: string; investorTakeaway?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// THEMES — full design system: colors + typography + layout + cards + charts
// ─────────────────────────────────────────────────────────────────────────────
interface DeckTheme {
  id: string;
  name: string;
  label: string;          // display label in theme bar

  // Core palette
  bg: string;
  accent: string;
  text: string;
  muted: string;          // secondary text color
  surface: string;        // card background (hex with alpha or solid)
  surfaceStrong: string;  // stronger card / header panel
  border: string;         // card border color
  gradient?: string;      // slide bg gradient overlay

  // Typography
  fontDisplay: string;    // headline font-family
  fontBody: string;       // body / UI font-family
  fontMono: string;       // metric / mono font-family
  headlineWeight: 700 | 800 | 900;
  headlineCase: 'none' | 'uppercase';
  headlineTracking: number; // letter-spacing in px for headlines

  // Cards
  cardRadius: number;     // border-radius for content cards
  cardBorder: boolean;    // show border on cards
  cardShadow: boolean;    // add subtle shadow treatment to cards
  tagStyle: 'pill' | 'bar' | 'label'; // eyebrow / section tag style

  // Layout
  splitRatio: number;     // visual (right) panel width as fraction of canvas (0.45–0.55)
  headerStrip: boolean;   // use top header strip on content slides
  accentBarWidth: number; // px width of accent divider bar

  // Charts
  chartStyle: 'filled' | 'outlined' | 'minimal'; // chart fill style
  chartFontFamily: string;
}

const THEMES: Record<string, DeckTheme> = {

  // Deep navy + refined cobalt — the classic VC deck look (Sequoia/a16z register).
  siliconValley: {
    id: 'siliconValley', name: 'Silicon Valley VC', label: 'Silicon Valley',
    bg: '#0a0f1e', accent: '#5b8def', text: '#f5f7fb', muted: 'rgba(245,247,251,0.5)',
    surface: 'rgba(91,141,239,0.08)', surfaceStrong: 'rgba(91,141,239,0.14)',
    border: 'rgba(91,141,239,0.2)',
    gradient: 'radial-gradient(ellipse 70% 60% at 80% 18%, rgba(91,141,239,0.14) 0%, transparent 64%)',
    fontDisplay: "'Inter', sans-serif", fontBody: "'Inter', sans-serif", fontMono: "'JetBrains Mono','Fira Mono',monospace",
    headlineWeight: 800, headlineCase: 'none', headlineTracking: -1.5,
    cardRadius: 14, cardBorder: true, cardShadow: false, tagStyle: 'pill',
    splitRatio: 0.46, headerStrip: false, accentBarWidth: 48,
    chartStyle: 'filled', chartFontFamily: 'Inter',
  },

  // True minimalist — generous whitespace, one ink color, no panels. Y-Combinator feel.
  startupMinimal: {
    id: 'startupMinimal', name: 'Startup Minimal', label: 'Minimal',
    bg: '#fafafa', accent: '#111111', text: '#1a1a1a', muted: 'rgba(26,26,26,0.5)',
    surface: 'rgba(0,0,0,0.035)', surfaceStrong: 'rgba(0,0,0,0.06)',
    border: 'rgba(0,0,0,0.1)',
    gradient: undefined,
    fontDisplay: "'Helvetica Neue','Arial',sans-serif", fontBody: "'Helvetica Neue','Arial',sans-serif", fontMono: "'Courier New',monospace",
    headlineWeight: 700, headlineCase: 'none', headlineTracking: -1.5,
    cardRadius: 6, cardBorder: false, cardShadow: false, tagStyle: 'label',
    splitRatio: 0.42, headerStrip: false, accentBarWidth: 28,
    chartStyle: 'minimal', chartFontFamily: 'Helvetica Neue',
  },

  // Boardroom — slate navy, restrained steel-blue, serif headlines, wide header strip.
  corporateExec: {
    id: 'corporateExec', name: 'Corporate Executive', label: 'Corporate',
    bg: '#101a2c', accent: '#6f9bd1', text: '#e6ebf2', muted: 'rgba(230,235,242,0.5)',
    surface: 'rgba(111,155,209,0.07)', surfaceStrong: 'rgba(111,155,209,0.13)',
    border: 'rgba(111,155,209,0.18)',
    gradient: 'linear-gradient(135deg, rgba(111,155,209,0.07) 0%, transparent 58%)',
    fontDisplay: "'Georgia','Times New Roman',serif", fontBody: "'Georgia',serif", fontMono: "'Courier New',monospace",
    headlineWeight: 700, headlineCase: 'none', headlineTracking: -0.5,
    cardRadius: 4, cardBorder: true, cardShadow: false, tagStyle: 'bar',
    splitRatio: 0.5, headerStrip: true, accentBarWidth: 60,
    chartStyle: 'filled', chartFontFamily: 'Georgia',
  },

  // Fintech — near-black with a refined teal-emerald, not the neon green of before.
  fintechModern: {
    id: 'fintechModern', name: 'Fintech Modern', label: 'Fintech',
    bg: '#071512', accent: '#2dd4a7', text: '#e9fbf4', muted: 'rgba(233,251,244,0.5)',
    surface: 'rgba(45,212,167,0.08)', surfaceStrong: 'rgba(45,212,167,0.14)',
    border: 'rgba(45,212,167,0.2)',
    gradient: 'radial-gradient(ellipse 55% 50% at 82% 18%, rgba(45,212,167,0.12) 0%, transparent 60%)',
    fontDisplay: "'Inter',sans-serif", fontBody: "'Inter',sans-serif", fontMono: "'JetBrains Mono','Fira Mono',monospace",
    headlineWeight: 800, headlineCase: 'none', headlineTracking: -1.5,
    cardRadius: 12, cardBorder: true, cardShadow: false, tagStyle: 'pill',
    splitRatio: 0.48, headerStrip: false, accentBarWidth: 40,
    chartStyle: 'filled', chartFontFamily: 'Inter',
  },

  // Healthcare — clean light, calm clinical blue, soft rounded cards. Trust-first.
  healthcare: {
    id: 'healthcare', name: 'Healthcare Innovation', label: 'Healthcare',
    bg: '#f4f9fc', accent: '#1d7fb8', text: '#0e2a3f', muted: 'rgba(14,42,63,0.5)',
    surface: 'rgba(29,127,184,0.06)', surfaceStrong: 'rgba(29,127,184,0.12)',
    border: 'rgba(29,127,184,0.16)',
    gradient: 'linear-gradient(165deg, rgba(29,127,184,0.06) 0%, transparent 52%)',
    fontDisplay: "'Inter',sans-serif", fontBody: "'Inter',sans-serif", fontMono: "'Courier New',monospace",
    headlineWeight: 700, headlineCase: 'none', headlineTracking: -1,
    cardRadius: 18, cardBorder: false, cardShadow: true, tagStyle: 'pill',
    splitRatio: 0.52, headerStrip: true, accentBarWidth: 36,
    chartStyle: 'minimal', chartFontFamily: 'Inter',
  },

  // Cyber — near-black tactical, muted signal-green, mono type, tight bars.
  cybersecurity: {
    id: 'cybersecurity', name: 'Cybersecurity Command', label: 'Cyber',
    bg: '#06100b', accent: '#3ddc84', text: '#d6f5e3', muted: 'rgba(214,245,227,0.45)',
    surface: 'rgba(61,220,132,0.06)', surfaceStrong: 'rgba(61,220,132,0.12)',
    border: 'rgba(61,220,132,0.18)',
    gradient: 'radial-gradient(ellipse 50% 45% at 86% 12%, rgba(61,220,132,0.1) 0%, transparent 56%)',
    fontDisplay: "'Courier New','Lucida Console',monospace", fontBody: "'Courier New',monospace", fontMono: "'Courier New',monospace",
    headlineWeight: 900, headlineCase: 'uppercase', headlineTracking: 0.5,
    cardRadius: 3, cardBorder: true, cardShadow: false, tagStyle: 'bar',
    splitRatio: 0.54, headerStrip: true, accentBarWidth: 52,
    chartStyle: 'outlined', chartFontFamily: 'Courier New',
  },

  // Luxury — warm near-black, muted antique gold, Playfair serif, max whitespace.
  luxuryInvestor: {
    id: 'luxuryInvestor', name: 'Luxury Investor', label: 'Luxury',
    bg: '#0c0a08', accent: '#c2a878', text: '#f6f1e7', muted: 'rgba(246,241,231,0.45)',
    surface: 'rgba(194,168,120,0.06)', surfaceStrong: 'rgba(194,168,120,0.12)',
    border: 'rgba(194,168,120,0.18)',
    gradient: 'radial-gradient(ellipse 55% 45% at 62% 42%, rgba(194,168,120,0.08) 0%, transparent 64%)',
    fontDisplay: "'Playfair Display','Georgia',serif", fontBody: "'Georgia',serif", fontMono: "'Courier New',monospace",
    headlineWeight: 700, headlineCase: 'none', headlineTracking: -0.5,
    cardRadius: 2, cardBorder: true, cardShadow: false, tagStyle: 'label',
    splitRatio: 0.44, headerStrip: false, accentBarWidth: 72,
    chartStyle: 'minimal', chartFontFamily: 'Georgia',
  },

  // Dark Investor — pure charcoal, warm amber, no gradient. Confident and plain.
  darkInvestor: {
    id: 'darkInvestor', name: 'Dark Investor', label: 'Dark',
    bg: '#0d0d0f', accent: '#e0a13c', text: '#f7f6f3', muted: 'rgba(247,246,243,0.45)',
    surface: 'rgba(224,161,60,0.07)', surfaceStrong: 'rgba(224,161,60,0.13)',
    border: 'rgba(224,161,60,0.18)',
    gradient: undefined,
    fontDisplay: "'Inter',sans-serif", fontBody: "'Inter',sans-serif", fontMono: "'JetBrains Mono',monospace",
    headlineWeight: 800, headlineCase: 'none', headlineTracking: -1.5,
    cardRadius: 10, cardBorder: true, cardShadow: false, tagStyle: 'pill',
    splitRatio: 0.5, headerStrip: false, accentBarWidth: 44,
    chartStyle: 'filled', chartFontFamily: 'Inter',
  },

  // Bright Modern — soft off-white, refined indigo, rounded airy cards. Product-led.
  brightModern: {
    id: 'brightModern', name: 'Bright Modern', label: 'Bright',
    bg: '#f7f8fb', accent: '#5b54d6', text: '#11132a', muted: 'rgba(17,19,42,0.5)',
    surface: 'rgba(91,84,214,0.055)', surfaceStrong: 'rgba(91,84,214,0.11)',
    border: 'rgba(91,84,214,0.15)',
    gradient: 'radial-gradient(ellipse 60% 50% at 78% 16%, rgba(91,84,214,0.08) 0%, transparent 62%)',
    fontDisplay: "'Inter',sans-serif", fontBody: "'Inter',sans-serif", fontMono: "'JetBrains Mono',monospace",
    headlineWeight: 800, headlineCase: 'none', headlineTracking: -1.5,
    cardRadius: 18, cardBorder: false, cardShadow: true, tagStyle: 'pill',
    splitRatio: 0.56, headerStrip: true, accentBarWidth: 40,
    chartStyle: 'filled', chartFontFamily: 'Inter',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM PRODUCT VISUAL — looks like a real app screenshot, not an admin panel
// Each industry gets its own illustrative, presentation-quality layout
// ─────────────────────────────────────────────────────────────────────────────
const resolveIndustryKey = (industry: string): 'cybersecurity' | 'food' | 'fintech' | 'healthcare' | 'marketplace' | 'logistics' | 'general' => {
  const i = (industry || '').toLowerCase();
  if (i.includes('cyber') || i.includes('security')) return 'cybersecurity';
  if (i.includes('food') || i.includes('restaurant') || i.includes('gastronomy')) return 'food';
  if (i.includes('fintech') || i.includes('finance') || i.includes('payment') || i.includes('bank')) return 'fintech';
  if (i.includes('health') || i.includes('medical') || i.includes('clinic')) return 'healthcare';
  if (i.includes('market') || i.includes('ecom') || i.includes('shop') || i.includes('store')) return 'marketplace';
  if (i.includes('logistic') || i.includes('deliver') || i.includes('supply') || i.includes('cargo') || i.includes('fleet')) return 'logistics';
  return 'general';
};

const MockupSVG: React.FC<{ industry: string; accent: string; bg: string; text: string; name?: string }> = ({ industry, accent, bg, text, name }) => {
  const key = resolveIndustryKey(industry);

  // Shared decorative elements
  const GlowCircle = ({ cx, cy, r, a = 0.18 }: { cx: number; cy: number; r: number; a?: number }) => (
    <circle cx={cx} cy={cy} r={r} fill={accent} opacity={a}/>
  );
  const MetricBadge = ({ x, y, label, value, w = 130 }: { x: number; y: number; label: string; value: string; w?: number }) => (
    <g>
      <rect x={x} y={y} width={w} height={54} rx="10" fill={`${accent}15`} stroke={accent} strokeWidth="0.5" strokeOpacity="0.3"/>
      <text x={x+12} y={y+18} fill={text} fontSize="8" opacity="0.5" fontFamily="Inter,sans-serif">{label}</text>
      <text x={x+12} y={y+40} fill={accent} fontSize="20" fontWeight="900" fontFamily="Inter,sans-serif">{value}</text>
    </g>
  );
  const BarRow = ({ x, y, label, pct, w = 200 }: { x: number; y: number; label: string; pct: number; w?: number }) => (
    <g>
      <text x={x} y={y} fill={text} fontSize="9" opacity="0.55" fontFamily="Inter,sans-serif">{label}</text>
      <rect x={x} y={y+4} width={w} height="6" rx="3" fill={`${accent}18`}/>
      <rect x={x} y={y+4} width={Math.round(w * pct)} height="6" rx="3" fill={accent} opacity="0.8"/>
    </g>
  );

  if (key === 'fintech') return (
    <svg viewBox="0 0 560 380" className="w-full h-full" style={{ fontFamily: 'Inter,sans-serif' }}>
      <defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.12"/><stop offset="100%" stopColor={accent} stopOpacity="0.03"/></linearGradient></defs>
      <rect width="560" height="380" rx="16" fill="url(#fg)"/>
      <rect width="560" height="380" rx="16" fill={bg} opacity="0.82"/>
      <GlowCircle cx={480} cy={60} r={120} a={0.08}/>
      {/* Header */}
      <rect width="560" height="56" rx="16" fill={`${accent}10`}/>
      <circle cx="30" cy="28" r="14" fill={`${accent}25`}/>
      <text x="30" y="33" textAnchor="middle" fill={accent} fontSize="14" fontWeight="900">$</text>
      <text x="54" y="24" fill={text} fontSize="13" fontWeight="800" opacity="0.9">{name || 'FinanceOS'}</text>
      <text x="54" y="39" fill={text} fontSize="9" opacity="0.38">Banking & Payments Platform</text>
      <rect x="460" y="16" width="76" height="24" rx="12" fill={accent}/>
      <text x="498" y="31" textAnchor="middle" fill={bg} fontSize="9" fontWeight="900">LIVE DEMO</text>
      {/* Balance hero */}
      <rect x="20" y="72" width="240" height="88" rx="12" fill={`${accent}12`} stroke={accent} strokeWidth="0.8" strokeOpacity="0.3"/>
      <text x="36" y="97" fill={text} fontSize="9" opacity="0.45">TOTAL PORTFOLIO VALUE</text>
      <text x="36" y="130" fill={accent} fontSize="34" fontWeight="900">$2,481,930</text>
      <text x="36" y="148" fill="#22c55e" fontSize="9" fontWeight="700">▲ +18.4% this quarter</text>
      {/* Sub metrics */}
      <MetricBadge x={272} y={72} label="MONTHLY INCOME" value="$32.4K" w={128}/>
      <MetricBadge x={410} y={72} label="EXPENSES" value="$18.2K" w={128}/>
      {/* Chart */}
      <rect x="20" y="172" width="320" height="110" rx="12" fill={`${accent}07`}/>
      <text x="36" y="192" fill={text} fontSize="9" opacity="0.38">PORTFOLIO GROWTH</text>
      {[18,26,22,38,34,50,44,62,54,72,64,80].map((h, i) => (
        <g key={i}>
          <rect x={36+i*22} y={266-h} width="14" height={h} rx="3" fill={accent} opacity={0.15+i*0.07}/>
        </g>
      ))}
      <polyline points={`43,248 65,240 87,244 109,226 131,230 153,216 175,222 197,204 219,212 241,198 263,204 285,192`}
        fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
      {/* Transactions */}
      <rect x="352" y="172" width="188" height="110" rx="12" fill={`${accent}07`}/>
      <text x="368" y="192" fill={text} fontSize="9" opacity="0.38">RECENT TRANSACTIONS</text>
      {[{n:'Stripe payment',a:'+$8,400',c:'#22c55e'},{n:'AWS invoice',a:'-$2,140',c:'#ef4444'},{n:'Client retainer',a:'+$12,000',c:'#22c55e'},{n:'Payroll run',a:'-$24,000',c:'#ef4444'}].map((t,i)=>(
        <g key={i}>
          <circle cx="368" cy={212+i*22} r="7" fill={`${accent}20`}/>
          <text x="380" y={216+i*22} fill={text} fontSize="9" opacity="0.72">{t.n}</text>
          <text x="530" y={216+i*22} textAnchor="end" fill={t.c} fontSize="9" fontWeight="700">{t.a}</text>
        </g>
      ))}
      {/* Bottom row */}
      <rect x="20" y="294" width="520" height="64" rx="12" fill={`${accent}09`}/>
      <text x="36" y="314" fill={text} fontSize="9" opacity="0.35">ACCOUNTS</text>
      {['Business Checking','Savings Reserve','Investment','Tax Holding'].map((a,i)=>(
        <g key={i}>
          <rect x={36+i*128} y={320} width="116" height="26" rx="8" fill={`${accent}18`}/>
          <text x={44+i*128} y="336" fill={accent} fontSize="8.5" fontWeight="700">{a}</text>
        </g>
      ))}
    </svg>
  );

  if (key === 'healthcare') return (
    <svg viewBox="0 0 560 380" className="w-full h-full" style={{ fontFamily: 'Inter,sans-serif' }}>
      <rect width="560" height="380" rx="16" fill={bg} opacity="0.9"/>
      <GlowCircle cx={500} cy={80} r={140} a={0.07}/>
      <rect width="560" height="60" rx="16" fill={`${accent}0E`}/>
      <rect x="20" y="16" width="28" height="28" rx="8" fill={accent}/>
      <text x="34" y="34" textAnchor="middle" fill={bg} fontSize="16" fontWeight="900">+</text>
      <text x="58" y="27" fill={text} fontSize="13" fontWeight="800" opacity="0.9">{name || 'HealthOS'}</text>
      <text x="58" y="42" fill={text} fontSize="9" opacity="0.38">Patient Care Platform</text>
      <rect x="446" y="14" width="94" height="30" rx="15" fill={`${accent}18`} stroke={accent} strokeWidth="0.8"/>
      <circle cx="466" cy="29" r="5" fill="#22c55e"/>
      <text x="476" y="33" fill={accent} fontSize="9" fontWeight="700">LIVE SYSTEM</text>
      {/* Patient card */}
      <rect x="20" y="76" width="260" height="96" rx="14" fill={`${accent}0C`} stroke={accent} strokeWidth="0.6" strokeOpacity="0.25"/>
      <circle cx="54" cy="108" r="20" fill={`${accent}22`}/>
      <text x="54" y="114" textAnchor="middle" fill={accent} fontSize="18" fontWeight="900">S</text>
      <text x="82" y="100" fill={text} fontSize="14" fontWeight="800">Sarah Johnson, 34</text>
      <rect x="82" y="105" width="48" height="14" rx="7" fill={`${accent}25`}/>
      <text x="106" y="115" textAnchor="middle" fill={accent} fontSize="7.5" fontWeight="900">ACTIVE</text>
      <text x="82" y="134" fill={text} fontSize="9" opacity="0.45">Cardiology · Dr. Chen · Room 204</text>
      <text x="82" y="149" fill={accent} fontSize="9">Next: 10:30 AM check-in</text>
      {/* Vitals */}
      {[{l:'HEART RATE',v:'72',u:'bpm',c:'#ef4444'},{l:'BLOOD PRESS.',v:'118/78',u:'',c:accent},{l:'O₂ SAT.',v:'98',u:'%',c:'#22c55e'},{l:'TEMP',v:'98.4',u:'°F',c:'#f59e0b'}].map((vt,i)=>(
        <g key={i}>
          <rect x={292+i*66} y={76} width="58" height="96" rx="10" fill={`${vt.c}12`} stroke={vt.c} strokeWidth="0.5" strokeOpacity="0.35"/>
          <text x={321+i*66} y="99" textAnchor="middle" fill={text} fontSize="6.5" opacity="0.45">{vt.l}</text>
          <text x={321+i*66} y="130" textAnchor="middle" fill={vt.c} fontSize="20" fontWeight="900">{vt.v}</text>
          <text x={321+i*66} y="155" textAnchor="middle" fill={vt.c} fontSize="9" opacity="0.65">{vt.u}</text>
        </g>
      ))}
      {/* ECG */}
      <rect x="20" y="184" width="340" height="70" rx="12" fill={`${accent}07`}/>
      <text x="36" y="200" fill={text} fontSize="9" opacity="0.35">ECG MONITOR — LIVE</text>
      <polyline points="36,230 52,230 58,208 62,252 68,208 72,252 78,230 98,230 104,218 108,242 112,218 116,242 122,230 148,230 154,230 160,224 166,230 178,230 184,215 188,245 192,215 196,245 202,230 230,230 236,230 250,230"
        fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round"/>
      {/* Schedule */}
      <rect x="372" y="184" width="168" height="70" rx="12" fill={`${accent}07`}/>
      <text x="388" y="200" fill={text} fontSize="9" opacity="0.35">TODAY'S SCHEDULE</text>
      {[{t:'09:00',n:'Lab Results',s:'done'},{t:'10:30',n:'Dr. Chen',s:'next'},{t:'14:00',n:'Neurology',s:'later'}].map((sc,i)=>(
        <g key={i}>
          <rect x="388" y={208+i*16} width="140" height="13" rx="4" fill={sc.s==='next'?`${accent}22`:'transparent'}/>
          <text x="392" y={219+i*16} fill={sc.s==='next'?accent:text} fontSize="8.5" opacity={sc.s==='done'?0.35:0.8}>{sc.t} — {sc.n}</text>
        </g>
      ))}
      {/* Medications */}
      <rect x="20" y="266" width="520" height="88" rx="12" fill={`${accent}07`}/>
      <text x="36" y="284" fill={text} fontSize="9" opacity="0.35">MEDICATIONS & TREATMENTS</text>
      {['Metformin 500mg','Lisinopril 10mg','Atorvastatin 20mg','Aspirin 81mg'].map((m,i)=>(
        <g key={i}>
          <rect x={36+i*126} y={292} width="114" height="50" rx="10" fill={`${accent}14`} stroke={accent} strokeWidth="0.5" strokeOpacity="0.3"/>
          <text x={43+i*126} y="310" fill={accent} fontSize="8.5" fontWeight="700">{m.split(' ')[0]}</text>
          <text x={43+i*126} y="323" fill={text} fontSize="7.5" opacity="0.5">{m.split(' ').slice(1).join(' ')}</text>
          <text x={43+i*126} y="336" fill={text} fontSize="7" opacity="0.35">Daily · Morning</text>
        </g>
      ))}
    </svg>
  );

  if (key === 'cybersecurity') return (
    <svg viewBox="0 0 560 380" className="w-full h-full" style={{ fontFamily: 'Courier New,monospace' }}>
      <rect width="560" height="380" rx="16" fill={bg} opacity="0.97"/>
      <GlowCircle cx={280} cy={190} r={200} a={0.05}/>
      {/* Header terminal bar */}
      <rect width="560" height="42" rx="16" fill={`${accent}14`}/>
      <circle cx="20" cy="21" r="6" fill="#ef4444" opacity="0.7"/>
      <circle cx="36" cy="21" r="6" fill="#f59e0b" opacity="0.7"/>
      <circle cx="52" cy="21" r="6" fill="#22c55e" opacity="0.7"/>
      <text x="280" y="26" textAnchor="middle" fill={accent} fontSize="10" opacity="0.6">[ {name || 'NEXSHIELD'} SECURITY OPERATIONS CENTER — LIVE ]</text>
      <circle cx="540" cy="21" r="5" fill="#22c55e" opacity="0.9"/>
      <text x="528" y="25" textAnchor="end" fill="#22c55e" fontSize="8">LIVE</text>
      {/* Status strip */}
      <rect x="0" y="42" width="560" height="22" fill={`${accent}08`}/>
      {['THREATS BLOCKED: 4,289,112','LATENCY: 1.8ms','UPTIME: 99.98%','STATUS: NOMINAL'].map((s,i)=>(
        <text key={i} x={14+i*136} y="57" fill={accent} fontSize="8" opacity="0.65">{s}</text>
      ))}
      {/* Radar */}
      <rect x="14" y="72" width="164" height="172" rx="10" fill={`${accent}06`} stroke={accent} strokeWidth="0.4" strokeOpacity="0.2"/>
      <text x="24" y="88" fill={accent} fontSize="8" opacity="0.55">THREAT MAP</text>
      {[48,34,20].map((r,i)=>(
        <circle key={i} cx="96" cy="162" r={r} fill="none" stroke={accent} strokeWidth="0.5" strokeOpacity={0.1+i*0.12} strokeDasharray="3 3"/>
      ))}
      {[{x:72,y:142,c:'#ef4444'},{x:112,y:158,c:'#f59e0b'},{x:82,y:172,c:'#ef4444'},{x:103,y:144,c:'#22c55e'},{x:76,y:158,c:'#f59e0b'}].map((b,i)=>(
        <g key={i}><circle cx={b.x} cy={b.y} r="4" fill={b.c} opacity="0.9"/><circle cx={b.x} cy={b.y} r="9" fill={b.c} opacity="0.14"/></g>
      ))}
      <circle cx="96" cy="162" r="11" fill={accent} opacity="0.85"/>
      <text x="96" y="167" textAnchor="middle" fill={bg} fontSize="12">🛡</text>
      {/* Live feed */}
      <rect x="186" y="72" width="220" height="172" rx="10" fill={`${accent}06`} stroke={accent} strokeWidth="0.4" strokeOpacity="0.2"/>
      <text x="200" y="88" fill={accent} fontSize="8" opacity="0.55">LIVE THREAT FEED</text>
      {[{t:'00:00:01',m:'SQL injection blocked',c:'#ef4444',s:'HIGH'},{t:'00:00:03',m:'Port scan detected',c:'#f59e0b',s:'MED'},{t:'00:00:05',m:'Auth attempt failed',c:'#ef4444',s:'HIGH'},{t:'00:00:07',m:'XSS payload dropped',c:'#f59e0b',s:'MED'},{t:'00:00:09',m:'API rate limit hit',c:'#22c55e',s:'LOW'},{t:'00:00:11',m:'DDoS mitigated',c:'#ef4444',s:'HIGH'},{t:'00:00:14',m:'Token validated ok',c:'#22c55e',s:'OK'}].map((l,i)=>(
        <g key={i}>
          <text x="200" y={102+i*19} fill={text} fontSize="7" opacity="0.35">{l.t}</text>
          <text x="246" y={102+i*19} fill={text} fontSize="7.5" opacity="0.75">{l.m}</text>
          <rect x="376" y={92+i*19} width="22" height="12" rx="3" fill={`${l.c}28`}/>
          <text x="387" y={101+i*19} textAnchor="middle" fill={l.c} fontSize="6.5" fontWeight="900">{l.s}</text>
        </g>
      ))}
      {/* Metrics */}
      <rect x="414" y="72" width="132" height="172" rx="10" fill={`${accent}06`} stroke={accent} strokeWidth="0.4" strokeOpacity="0.2"/>
      <text x="428" y="88" fill={accent} fontSize="8" opacity="0.55">METRICS</text>
      {[{l:'BLOCKED',v:'4.2M',c:'#22c55e'},{l:'LATENCY',v:'1.8ms',c:accent},{l:'UPTIME',v:'99.98%',c:'#22c55e'},{l:'NODES',v:'2,847',c:accent}].map((m,i)=>(
        <g key={i}><text x="428" y={108+i*36} fill={text} fontSize="7" opacity="0.38">{m.l}</text><text x="428" y={126+i*36} fill={m.c} fontSize="18" fontWeight="900">{m.v}</text></g>
      ))}
      {/* Bottom terminal */}
      <rect x="14" y="254" width="532" height="32" rx="8" fill={`${accent}08`}/>
      <text x="24" y="273" fill={accent} fontSize="8">&gt; SYSTEM: All edge nodes nominal · Neural AI model v4.2 active · Last sync: 0.3s ago</text>
      <text x="538" y="273" textAnchor="end" fill="#22c55e" fontSize="8">●</text>
      {/* Score badges */}
      <rect x="14" y="296" width="530" height="64" rx="10" fill={`${accent}07`}/>
      {[{l:'THREAT SCORE',v:'2/10',c:'#22c55e'},{l:'COMPLIANCE',v:'SOC 2',c:accent},{l:'RESPONSE TIME',v:'< 50ms',c:accent},{l:'COVERAGE',v:'100%',c:'#22c55e'}].map((b,i)=>(
        <g key={i}>
          <text x={30+i*134} y="314" fill={text} fontSize="7.5" opacity="0.4">{b.l}</text>
          <text x={30+i*134} y="346" fill={b.c} fontSize="22" fontWeight="900">{b.v}</text>
        </g>
      ))}
    </svg>
  );

  if (key === 'marketplace') return (
    <svg viewBox="0 0 560 380" className="w-full h-full" style={{ fontFamily: 'Inter,sans-serif' }}>
      <rect width="560" height="380" rx="16" fill={bg} opacity="0.94"/>
      <GlowCircle cx={460} cy={100} r={160} a={0.07}/>
      <rect width="560" height="52" rx="16" fill={`${accent}0E`}/>
      <rect x="16" y="12" width="24" height="24" rx="6" fill={accent}/>
      <text x="28" y="28" textAnchor="middle" fill={bg} fontSize="14" fontWeight="900">M</text>
      <text x="50" y="23" fill={text} fontSize="12" fontWeight="800" opacity="0.9">{name || 'Marketplace'}</text>
      <rect x="108" y="14" width="200" height="26" rx="13" fill={`${accent}15`}/>
      <text x="148" y="30" fill={text} fontSize="9" opacity="0.4">🔍  Search products...</text>
      {['Buy','Sell','Messages','Orders'].map((n,i)=>(
        <text key={i} x={322+i*52} y="30" fill={i===0?accent:text} fontSize="9" opacity={i===0?1:0.45} fontWeight={i===0?'900':'400'}>{n}</text>
      ))}
      {[{n:'iPhone 15 Pro',p:'$899',s:'TechStore',r:'4.9',badge:'HOT',e:'📱'},{n:'Nike Air Max',p:'$180',s:'SneakerHub',r:'4.7',badge:'NEW',e:'👟'},{n:'Web Design',p:'$299',s:'Studio42',r:'5.0',badge:'TOP',e:'🎨'},{n:'MacBook M3',p:'$1,999',s:'AppleShop',r:'4.8',badge:'',e:'💻'},{n:'Templates',p:'$49',s:'DesignCo',r:'4.6',badge:'SALE',e:'🖼'},{n:'Analytics SaaS',p:'$299/mo',s:'DataFirm',r:'4.9',badge:'PRO',e:'📊'}].map((item,i)=>{
        const col=i%3; const row=Math.floor(i/3);
        return (
          <g key={i}>
            <rect x={16+col*180} y={64+row*148} width="168" height="136" rx="12" fill={`${accent}09`} stroke={`${accent}20`} strokeWidth="0.8"/>
            <rect x={16+col*180} y={64+row*148} width="168" height="76" rx="10" fill={`${accent}12`}/>
            <text x={100+col*180} y={110+row*148} textAnchor="middle" fontSize="32">{item.e}</text>
            {item.badge&&<><rect x={168+col*180} y={70+row*148} width="30" height="14" rx="4" fill={accent}/><text x={183+col*180} y={80+row*148} textAnchor="middle" fill={bg} fontSize="7" fontWeight="900">{item.badge}</text></>}
            <text x={26+col*180} y={156+row*148} fill={text} fontSize="10" fontWeight="800" opacity="0.88">{item.n}</text>
            <text x={26+col*180} y={170+row*148} fill={text} fontSize="8" opacity="0.4">{item.s} · ★{item.r}</text>
            <text x={172+col*180} y={156+row*148} textAnchor="end" fill={accent} fontSize="11" fontWeight="900">{item.p}</text>
          </g>
        );
      })}
      <rect x="0" y="360" width="560" height="20" rx="16" fill={`${accent}08`}/>
      {[{l:'GMV TODAY',v:'$2.4M'},{l:'SELLERS',v:'12,481'},{l:'ORDERS',v:'4,820'},{l:'RATING',v:'4.8★'}].map((m,i)=>(
        <g key={i}><text x={20+i*136} y="373" fill={text} fontSize="7" opacity="0.35">{m.l}: </text><text x={70+i*136} y="373" fill={accent} fontSize="7" fontWeight="900">{m.v}</text></g>
      ))}
    </svg>
  );

  if (key === 'logistics') return (
    <svg viewBox="0 0 560 380" className="w-full h-full" style={{ fontFamily: 'Inter,sans-serif' }}>
      <rect width="560" height="380" rx="16" fill={bg} opacity="0.95"/>
      <GlowCircle cx={440} cy={100} r={150} a={0.07}/>
      <rect width="560" height="52" rx="16" fill={`${accent}0E`}/>
      <rect x="16" y="12" width="28" height="28" rx="8" fill={accent}/>
      <text x="30" y="30" textAnchor="middle" fill={bg} fontSize="16">🚛</text>
      <text x="54" y="24" fill={text} fontSize="13" fontWeight="800">{name || 'LogisticsPro'}</text>
      <text x="54" y="38" fill={text} fontSize="9" opacity="0.38">Supply Chain Intelligence</text>
      <rect x="438" y="14" width="106" height="26" rx="13" fill={`${accent}18`} stroke={accent} strokeWidth="0.7"/>
      <circle cx="454" cy="27" r="4" fill="#22c55e" opacity="0.9"/>
      <text x="462" y="31" fill={accent} fontSize="9" fontWeight="700">TRACKING LIVE</text>
      {[{l:'IN TRANSIT',v:'1,284',c:accent},{l:'DELIVERED',v:'8,941',c:'#22c55e'},{l:'ON-TIME',v:'97.4%',c:'#22c55e'},{l:'DELAYED',v:'38',c:'#ef4444'}].map((k,i)=>(
        <g key={i}>
          <rect x={16+i*134} y={60} width="122" height="60" rx="10" fill={`${k.c}10`} stroke={k.c} strokeWidth="0.5" strokeOpacity="0.3"/>
          <text x={28+i*134} y="78" fill={text} fontSize="8" opacity="0.42">{k.l}</text>
          <text x={28+i*134} y="107" fill={k.c} fontSize="26" fontWeight="900">{k.v}</text>
        </g>
      ))}
      {[{id:'SH-48291',o:'Dubai',d:'Riyadh',s:'in transit',eta:'2h 14m',c:accent},{id:'SH-48290',o:'Bahrain',d:'Kuwait',s:'delivered',eta:'Done',c:'#22c55e'},{id:'SH-48289',o:'Jeddah',d:'Doha',s:'delayed',eta:'+1h 20m',c:'#ef4444'},{id:'SH-48288',o:'Abu Dhabi',d:'Muscat',s:'in transit',eta:'4h 02m',c:accent},{id:'SH-48287',o:'Cairo',d:'Amman',s:'loading',eta:'6h 30m',c:'#f59e0b'}].map((s,i)=>(
        <g key={i}>
          <rect x="16" y={132+i*36} width="332" height="30" rx="8" fill={i%2===0?`${accent}07`:'transparent'}/>
          <text x="28" y={151+i*36} fill={text} fontSize="8.5" opacity="0.55" fontFamily="monospace">{s.id}</text>
          <text x="110" y={151+i*36} fill={text} fontSize="9" opacity="0.82">{s.o} → {s.d}</text>
          <rect x="246" y={138+i*36} width="60" height="16" rx="5" fill={`${s.c}22`}/>
          <text x="276" y={149+i*36} textAnchor="middle" fill={s.c} fontSize="7.5" fontWeight="700">{s.s}</text>
          <text x="326" y={151+i*36} fill={s.c} fontSize="8.5" fontWeight="700">{s.eta}</text>
        </g>
      ))}
      {/* Route map visual */}
      <rect x="358" y="132" width="186" height="180" rx="10" fill={`${accent}08`}/>
      <text x="372" y="150" fill={text} fontSize="8" opacity="0.35">ROUTE MAP</text>
      {[{x:400,y:185,l:'DXB'},{x:450,y:200,l:'BAH'},{x:430,y:240,l:'RUH'},{x:500,y:215,l:'KWI'},{x:390,y:268,l:'JED'},{x:514,y:182,l:'MCT'}].map((c,i)=>(
        <g key={i}><circle cx={c.x} cy={c.y} r="6" fill={accent} opacity="0.8"/><circle cx={c.x} cy={c.y} r="12" fill={accent} opacity="0.1"/><text x={c.x} y={c.y+18} textAnchor="middle" fill={text} fontSize="7.5" opacity="0.5">{c.l}</text></g>
      ))}
      <line x1="400" y1="185" x2="450" y2="200" stroke={accent} strokeWidth="1.5" opacity="0.45" strokeDasharray="4 2"/>
      <line x1="450" y1="200" x2="500" y2="215" stroke={accent} strokeWidth="1.5" opacity="0.45" strokeDasharray="4 2"/>
      <line x1="400" y1="185" x2="430" y2="240" stroke="#f59e0b" strokeWidth="1.5" opacity="0.5" strokeDasharray="4 2"/>
      <rect x="16" y="318" width="528" height="48" rx="10" fill={`${accent}09`}/>
      {[{l:'REVENUE TODAY',v:'$284K'},{l:'SHIPMENTS',v:'1,284'},{l:'ON-TIME RATE',v:'97.4%'},{l:'COUNTRIES',v:'18'},{l:'VEHICLES',v:'342 active'}].map((m,i)=>(
        <g key={i}><text x={28+i*106} y="334" fill={text} fontSize="7.5" opacity="0.35">{m.l}</text><text x={28+i*106} y="354" fill={accent} fontSize="16" fontWeight="900">{m.v}</text></g>
      ))}
    </svg>
  );

  // Default: SaaS / generic
  return (
    <svg viewBox="0 0 560 380" className="w-full h-full" style={{ fontFamily: 'Inter,sans-serif' }}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.1"/><stop offset="100%" stopColor={accent} stopOpacity="0.03"/></linearGradient></defs>
      <rect width="560" height="380" rx="16" fill="url(#sg)"/>
      <rect width="560" height="380" rx="16" fill={bg} opacity="0.82"/>
      <GlowCircle cx={480} cy={80} r={140} a={0.09}/>
      {/* Header */}
      <rect width="560" height="54" rx="16" fill={`${accent}0E`}/>
      <rect x="16" y="13" width="28" height="28" rx="8" fill={accent}/>
      <text x="30" y="31" textAnchor="middle" fill={bg} fontSize="14" fontWeight="900">◆</text>
      <text x="54" y="25" fill={text} fontSize="13" fontWeight="800" opacity="0.92">{name || 'Platform'}</text>
      <text x="54" y="40" fill={text} fontSize="9" opacity="0.38">Analytics Dashboard</text>
      <rect x="430" y="15" width="112" height="26" rx="13" fill={accent}/>
      <text x="486" y="31" textAnchor="middle" fill={bg} fontSize="9" fontWeight="900">↑ +24% MoM</text>
      {/* Hero metric */}
      <rect x="16" y="62" width="188" height="92" rx="14" fill={`${accent}12`} stroke={accent} strokeWidth="0.7" strokeOpacity="0.3"/>
      <text x="32" y="84" fill={text} fontSize="9" opacity="0.45">ACTIVE USERS</text>
      <text x="32" y="124" fill={accent} fontSize="40" fontWeight="900">12,481</text>
      <text x="32" y="142" fill="#22c55e" fontSize="9" fontWeight="700">▲ +18.4% this month</text>
      <MetricBadge x={212} y={62} label="MRR" value="$84.2K" w={156}/>
      <MetricBadge x={376} y={62} label="CHURN RATE" value="1.2%" w={168}/>
      {/* Main chart */}
      <rect x="16" y="164" width="348" height="132" rx="12" fill={`${accent}07`}/>
      <text x="32" y="183" fill={text} fontSize="9" opacity="0.38">USER GROWTH · LAST 12 MONTHS</text>
      {[22,30,26,42,38,35,52,48,60,56,68,76].map((h,i)=>(
        <g key={i}>
          <rect x={32+i*24} y={278-h} width="16" height={h} rx="3" fill={accent} opacity={0.14+i*0.07}/>
        </g>
      ))}
      <polyline points={`40,256 64,248 88,252 112,236 136,240 160,244 184,228 208,232 232,216 256,220 280,204 304,196`}
        fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
      {[{x:40,y:256},{x:64,y:248},{x:88,y:252},{x:112,y:236},{x:136,y:240},{x:160,y:244},{x:184,y:228},{x:208,y:232},{x:232,y:216},{x:256,y:220},{x:280,y:204},{x:304,y:196}].map((p,i)=>(
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={accent}/>
      ))}
      {/* Feature usage */}
      <rect x="372" y="164" width="172" height="132" rx="12" fill={`${accent}07`}/>
      <text x="388" y="183" fill={text} fontSize="9" opacity="0.38">FEATURE USAGE</text>
      {[{f:'Automation',p:0.84},{f:'Analytics',p:0.71},{f:'Integrations',p:0.58},{f:'Reports',p:0.45}].map((f,i)=>(
        <g key={i}>
          <text x="388" y={205+i*26} fill={text} fontSize="9" opacity="0.62">{f.f}</text>
          <rect x="388" y={208+i*26} width={140*f.p} height="5" rx="2.5" fill={accent} opacity="0.65"/>
          <text x="528" y={213+i*26} textAnchor="end" fill={accent} fontSize="8.5" fontWeight="700">{Math.round(f.p*100)}%</text>
        </g>
      ))}
      {/* Activity feed */}
      <rect x="16" y="306" width="528" height="58" rx="12" fill={`${accent}07`}/>
      <text x="32" y="324" fill={text} fontSize="9" opacity="0.35">RECENT ACTIVITY</text>
      {['New enterprise client: Acme Corp signed  ·  2 min ago','Automation milestone: 1M workflows completed  ·  8 min ago','Revenue record: $12,000 MRR milestone reached  ·  1h ago'].map((ac,i)=>(
        <g key={i}><circle cx="32" cy={336+i*10} r="2.5" fill={accent} opacity="0.7"/><text x="40" y={339+i*10} fill={text} fontSize="8.5" opacity="0.62">{ac}</text></g>
      ))}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM CHART RENDERER — Keynote-quality, not admin-panel style
// ─────────────────────────────────────────────────────────────────────────────
const ChartRenderer: React.FC<{ el: ChartElement }> = ({ el }) => {
  const { chartType, data, accent, textColor, bg } = el;
  if (!data || data.length === 0) return null;
  const maxV = Math.max(...data.map(d => d.value), 1);
  const W = el.w; const H = el.h;
  const padL = 40; const padR = 20; const padT = 24; const padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  if (chartType === 'bar') {
    const gap = 8;
    const bw = Math.max(16, (chartW - gap * (data.length - 1)) / data.length);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <defs>
          <linearGradient id={`bg${accent.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.9"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0.35"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((f, i) => (
          <line key={i} x1={padL} y1={padT + chartH * (1 - f)} x2={padL + chartW} y2={padT + chartH * (1 - f)}
            stroke={textColor} strokeWidth="0.5" strokeOpacity="0.08"/>
        ))}
        {data.map((d, i) => {
          const bh = (d.value / maxV) * chartH;
          const bx = padL + i * (bw + gap);
          const by = padT + chartH - bh;
          return (
            <g key={i}>
              {/* Shadow */}
              <rect x={bx + 2} y={by + 2} width={bw} height={bh} rx="6" fill={accent} opacity="0.1"/>
              {/* Bar */}
              <rect x={bx} y={by} width={bw} height={bh} rx="6" fill={`url(#bg${accent.slice(1)})`}/>
              {/* Top highlight */}
              <rect x={bx} y={by} width={bw} height={Math.min(8, bh * 0.15)} rx="6" fill={accent} opacity="0.4"/>
              {/* Value label */}
              <text x={bx + bw / 2} y={by - 6} textAnchor="middle" fill={accent} fontSize="10" fontWeight="800" fontFamily="Inter,sans-serif">{d.value}</text>
              {/* Category label */}
              <text x={bx + bw / 2} y={padT + chartH + 18} textAnchor="middle" fill={textColor} fontSize="10" opacity="0.5" fontFamily="Inter,sans-serif">{d.label}</text>
            </g>
          );
        })}
        {/* Y axis */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke={textColor} strokeWidth="0.5" strokeOpacity="0.12"/>
      </svg>
    );
  }

  if (chartType === 'donut') {
    const total = data.reduce((s, d) => s + d.value, 0);
    const cx = W / 2; const cy = H / 2;
    const r = Math.min(cx, cy) - 28;
    const inner = r * 0.58;
    const colors = [accent, `${accent}CC`, `${accent}88`, `${accent}44`];
    let startAngle = -Math.PI / 2;
    const labelData: { x: number; y: number; label: string; value: number; color: string }[] = [];

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <defs>
          {data.map((_, i) => (
            <filter key={i} id={`ds${i}`}>
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={colors[i % colors.length]} floodOpacity="0.3"/>
            </filter>
          ))}
        </defs>
        {data.map((d, i) => {
          const angle = (d.value / total) * 2 * Math.PI;
          const midAngle = startAngle + angle / 2;
          const x1 = cx + r * Math.cos(startAngle); const y1 = cy + r * Math.sin(startAngle);
          startAngle += angle;
          const x2 = cx + r * Math.cos(startAngle); const y2 = cy + r * Math.sin(startAngle);
          const xi1 = cx + inner * Math.cos(startAngle - angle);
          const yi1 = cy + inner * Math.sin(startAngle - angle);
          const xi2 = cx + inner * Math.cos(startAngle);
          const yi2 = cy + inner * Math.sin(startAngle);
          const large = angle > Math.PI ? 1 : 0;
          const color = colors[i % colors.length];
          // Label position
          const lx = cx + (r + 22) * Math.cos(midAngle - angle / 2 + angle / 2);
          const ly = cy + (r + 22) * Math.sin(midAngle - angle / 2 + angle / 2);
          labelData.push({ x: lx, y: ly, label: d.label, value: d.value, color });
          return (
            <path key={i}
              d={`M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${xi2} ${yi2} A${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`}
              fill={color} filter={`url(#ds${i})`}/>
          );
        })}
        {/* Center text */}
        <circle cx={cx} cy={cy} r={inner - 4} fill={`${accent}08`}/>
        <text x={cx} y={cy - 8} textAnchor="middle" fill={accent} fontSize="28" fontWeight="900" fontFamily="Inter,sans-serif">{data[0]?.value}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={textColor} fontSize="10" opacity="0.5" fontFamily="Inter,sans-serif">{data[0]?.label}</text>
        {/* Legend */}
        {data.map((d, i) => (
          <g key={i}>
            <rect x={padL} y={H - 28 + i * 0} width={0} height={0}/>
          </g>
        ))}
      </svg>
    );
  }

  if (chartType === 'line' || chartType === 'area') {
    const pts = data.map((d, i) => ({
      x: padL + (i / Math.max(data.length - 1, 1)) * chartW,
      y: padT + chartH - (d.value / maxV) * chartH,
      d,
    }));
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L${pts[pts.length - 1].x} ${padT + chartH} L${pts[0].x} ${padT + chartH} Z`;
    const gradId = `ag${accent.slice(1, 7)}`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        {/* Grid */}
        {[0.25, 0.5, 0.75, 1].map((f, i) => (
          <line key={i} x1={padL} y1={padT + chartH * (1 - f)} x2={padL + chartW} y2={padT + chartH * (1 - f)}
            stroke={textColor} strokeWidth="0.5" strokeOpacity="0.07"/>
        ))}
        {chartType === 'area' && <path d={areaD} fill={`url(#${gradId})`}/>}
        <path d={pathD} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={bg || '#050e1a'}/>
            <circle cx={p.x} cy={p.y} r="3.5" fill={accent}/>
            <text x={p.x} y={padT + chartH + 18} textAnchor="middle" fill={textColor} fontSize="10" opacity="0.45" fontFamily="Inter,sans-serif">{p.d.label}</text>
            {i === pts.length - 1 && (
              <g>
                <rect x={p.x - 22} y={p.y - 26} width="44" height="18" rx="6" fill={accent}/>
                <text x={p.x} y={p.y - 13} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800" fontFamily="Inter,sans-serif">{p.d.value}</text>
              </g>
            )}
          </g>
        ))}
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke={textColor} strokeWidth="0.5" strokeOpacity="0.1"/>
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke={textColor} strokeWidth="0.5" strokeOpacity="0.1"/>
      </svg>
    );
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// RESIZE HANDLE
// ─────────────────────────────────────────────────────────────────────────────
type Handle = 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w';
const HANDLES: Handle[] = ['nw','n','ne','e','se','s','sw','w'];
const handlePos = (h: Handle, w: number, ht: number): { x: number; y: number } => {
  const m: Record<Handle, { x: number; y: number }> = {
    nw:{x:0,y:0}, n:{x:w/2,y:0}, ne:{x:w,y:0},
    e:{x:w,y:ht/2}, se:{x:w,y:ht}, s:{x:w/2,y:ht},
    sw:{x:0,y:ht}, w:{x:0,y:ht/2},
  };
  return m[h];
};
const handleCursor = (h: Handle): string => {
  const m: Record<Handle, string> = {
    nw:'nw-resize', n:'n-resize', ne:'ne-resize',
    e:'e-resize', se:'se-resize', s:'s-resize',
    sw:'sw-resize', w:'w-resize',
  };
  return m[h];
};

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE MAPPER (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function mapFirestore(raw: any): DLAnalysis {
  const p = raw?.startupProfile || {};
  const sc = raw?.scores || {};
  const mk = raw?.marketAnalysis || {};
  const rv = raw?.competitorAnalysis || {};
  const rm = raw?.roadmap || {};
  const gr = raw?.growthPotential || {};
  const pr = raw?.pitchReadiness || {};

  const gs = (k: string, alt?: string): number => {
    const v = sc[k] ?? (alt ? sc[alt] : undefined);
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && typeof v?.score === 'number') return v.score;
    if (typeof v === 'string') { const n = parseInt(v, 10); if (!isNaN(n)) return n; }
    return 0;
  };

  const overall   = sc.overall ?? gs('ideaStrength') ?? 85;
  const readiness = gs('investorAppeal', 'investorAttractiveness') || overall;

  const competitors: DLCompetitor[] = Array.isArray(rv.mainCompetitors)
    ? rv.mainCompetitors.slice(0, 4).map((c: string) => ({ name: c, weakness: rv.saturationLevel || 'Limited capabilities', ourEdge: rv.competitiveAdvantages || 'Superior solution' }))
    : [
        { name: 'Legacy alternatives', weakness: 'Fragmented and expensive', ourEdge: 'Unified modern platform' },
        { name: 'Generic tools', weakness: 'Not purpose-built', ourEdge: 'Industry-specific workflows' },
        { name: 'In-house build', weakness: '18+ months, high cost', ourEdge: 'Deploy in days, not years' },
      ];

  const roadmapPts = [
    ...(rm.immediate||[]).slice(0,1), ...(rm.oneToThreeMonths||[]).slice(0,1),
    ...(rm.threeToSixMonths||[]).slice(0,1), ...(rm.investorReadiness||[]).slice(0,1),
  ].filter(Boolean);

  const assets: string[] = [];
  if (p.logo) assets.push(p.logo);
  if (Array.isArray(raw.uploadedAssets)) assets.push(...raw.uploadedAssets);
  const verdict = typeof raw.finalVerdict === 'object' ? raw.finalVerdict?.description || raw.finalVerdict?.status : raw.finalVerdict;

  return {
    id: raw.id, startupName: (p.companyName || 'Your Venture').replace(/\./g,''),
    tagline: p.elevatorPitch || p.businessDescription?.slice(0,120) || '',
    vision: p.businessDescription || p.elevatorPitch || '',
    industry: p.industry || 'Technology', country: p.country || '', stage: p.stage || 'Seed Stage',
    overallScore: overall, investorReadinessScore: readiness,
    marketFitScore: gs('marketFit') || Math.max(0,overall-3),
    scalabilityScore: gs('scalability') || Math.min(99,overall+2),
    executionScore: gs('execution','executionReadiness') || overall,
    founders: Array.isArray(raw.team||raw.founders)&&(raw.team||raw.founders).length>0
      ? (raw.team||raw.founders).slice(0,4).map((f:any)=>({
          name: f.name||'Founder',
          role: f.role||f.title||'Co-Founder',
          background: f.background||f.expertise||f.bio||f.description||'Domain Expert',
          photo: f.photo||f.photoUrl||f.avatar||f.image||f.profilePhoto||'',
          linkedin: f.linkedin||f.linkedinUrl||f.linkedIn||'',
          previousCompany: f.previousCompany||f.pastCompany||f.company||'',
          previousRole: f.previousRole||f.pastRole||'',
          yearsExp: f.yearsExp||f.experience||f.years||'',
          achievement: f.achievement||f.highlight||f.credential||'',
        }))
      : [],
    problemStatement: rv.marketGaps || `The ${p.industry||'technology'} market is fragmented and underserved`,
    problemInsights: [rv.marketGaps, mk.demandSignals, rv.saturationLevel && `Competitive density: ${rv.saturationLevel}`].filter(Boolean) as string[],
    solutionStatement: rv.competitiveAdvantages || p.elevatorPitch || '',
    solutionInsights: [rv.competitiveAdvantages, gr.scaling, pr.improvementSuggestions?.[0]].filter(Boolean) as string[],
    uniqueValueProp: rv.competitiveAdvantages || p.elevatorPitch,
    productFeatures: Array.isArray(pr.suggestedStructure) ? pr.suggestedStructure
      : [`${p.stage||'Seed'} stage`, `${p.productType||'SaaS Platform'}`, `${p.teamSize||'2–5 people'} team`, `${p.businessType||'B2B'} model`],
    productScreenshots: assets.filter(u => u && (u.startsWith('http')||u.startsWith('blob'))).slice(0,3),
    marketSizing: { tam: mk.sizeEstimate||'$14B', sam:'32% of TAM', som:'8% initial target', growthRate: mk.growthTrends||'18% CAGR', overview: mk.overview },
    targetSegments: [p.businessType ? `${p.businessType} organizations` : 'Enterprise and mid-market', p.country ? `${p.country} and regional markets` : 'GCC, MENA, and global', mk.demandSignals || 'Validated buyer demand confirmed'],
    revenueStreams: [gr.revenueModel || `${p.businessType||'SaaS'} subscription`, `${p.productType||'Platform'} licensing`, 'Enterprise and custom tier'],
    pricingModel: p.productType, competitors, competitiveAdvantages: rv.competitiveAdvantages
      ? [rv.competitiveAdvantages, rv.marketGaps||'', gr.scaling||''].filter(Boolean)
      : ['First-mover in an underserved niche','Proprietary technology and network effects','Deep domain expertise and execution','Structurally ahead of all alternatives'],
    tractionPoints: [raw.topInvestorTakeaway, `${overall}% startup score — independently validated`, `${readiness}% investor readiness confirmed`].filter(Boolean),
    gtmStrategy: [`Direct sales to ${p.businessType||'enterprise'} clients`, `Channel partner network in ${p.country||'target region'}`, 'Product-led growth and freemium conversion', 'Strategic co-marketing partnerships'],
    growthTimeline: roadmapPts.length>0 ? roadmapPts : ['Now: MVP launch and first paying clients','Q2: 10 clients — $1M ARR milestone','Q3: Channel partner network launch','Q4: Series A raise and geographic expansion'],
    fundingAsk: raw.fundingAsk,
    fundingUse: raw.fundingUse||['40% — Product development','30% — Sales and marketing','20% — Team expansion','10% — Operations and reserve'],
    revenueProjections: gr.revenueModel ? [{ year:'Year 1', value: `${gr.revenueModel} — initial traction` },{ year:'Year 2', value: 'Channel growth — 5× revenue' },{ year:'Year 3', value: 'Market leadership — Series A scale' }] : [],
    uploadedAssets: assets, finalVerdict: verdict, investorTakeaway: raw.topInvestorTakeaway,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE COMPILER — builds element-based slides from analysis
// ─────────────────────────────────────────────────────────────────────────────
function uid(): string { return Math.random().toString(36).slice(2, 9); }

// Auto-shrink a KPI value's font so long values (e.g. "$28.5B global") never
// overflow their card. Returns a px font size that fits the box width.
function fitKpiFontSize(value: string, boxW: number): number {
  const len = (value || '').length;
  // Rough char-width model for a bold display font at 32px (~18px/char).
  // Scale down until the estimated text width fits inside the padded box.
  const usable = Math.max(40, boxW - 24);
  let size = 32;
  while (size > 12 && len * size * 0.58 > usable) {
    size -= 1;
  }
  return size;
}

function makeText(partial: Partial<TextElement> & { content: string }): TextElement {
  return {
    id: uid(), type: 'text', x: 0, y: 0, w: 400, h: 80,
    fontSize: 16, fontFamily: 'Inter', fontWeight: 400, color: '#ffffff',
    align: 'left', opacity: 1, zIndex: 1,
    ...partial,
  };
}

function makeKPI(partial: Partial<KPIElement> & { label: string; value: string; accent: string; textColor: string; bg: string }): KPIElement {
  return { id: uid(), type: 'kpi', x: 0, y: 0, w: 180, h: 90, opacity: 1, zIndex: 1, ...partial };
}

function makeMockup(partial: Partial<MockupElement> & { industry: string; accent: string; bg: string; textColor: string }): MockupElement {
  return { id: uid(), type: 'mockup', x: 0, y: 0, w: 560, h: 380, opacity: 1, zIndex: 1, ...partial };
}

function makeShape(partial: Partial<ShapeElement> & { shape: ShapeElement['shape']; fill: string }): ShapeElement {
  return { id: uid(), type: 'shape', x: 0, y: 0, w: 400, h: 4, opacity: 1, zIndex: 0, ...partial };
}

function makeImage(partial: Partial<ImageElement> & { src: string }): ImageElement {
  return { id: uid(), type: 'image', x: 0, y: 0, w: 360, h: 240, objectFit: 'cover', borderRadius: 12, opacity: 1, zIndex: 10, ...partial };
}

function makeChart(partial: Partial<ChartElement> & { data: ChartElement['data']; accent: string; textColor: string; bg: string }): ChartElement {
  return { id: uid(), type: 'chart', chartType: 'bar', x: 0, y: 0, w: 360, h: 200, opacity: 1, zIndex: 1, ...partial };
}

function makeTeamCard(partial: Partial<TeamCardElement> & Pick<TeamCardElement, 'name'|'role'|'bio'|'accent'|'textColor'|'bg'|'surface'|'surfaceStrong'|'fontDisplay'|'fontBody'|'fontMono'|'cardRadius'|'tagStyle'|'headlineWeight'>): TeamCardElement {
  return { id: uid(), type: 'team', x: 0, y: 0, w: 390, h: 564, opacity: 1, zIndex: 5, ...partial };
}

function compileSlides(a: DLAnalysis, theme: DeckTheme): Slide[] {
  const { accent, text, bg } = theme;
  const screenshot = a.productScreenshots?.[0] || '';

  // ── Theme-aware helpers ───────────────────────────────────────────────────

  // Eyebrow/section tag — adapts to theme tagStyle
  const tag = (label: string, x: number, y: number): TextElement => {
    if (theme.tagStyle === 'pill') {
      return makeText({ content: label.toUpperCase(), x, y, w: 240, h: 24, fontSize: 8,
        fontWeight: 900, color: accent, background: `${accent}1A`, borderRadius: 100,
        padding: 6, letterSpacing: 2, textTransform: 'uppercase', align: 'center',
        fontFamily: theme.fontBody, zIndex: 10 });
    }
    if (theme.tagStyle === 'bar') {
      return makeText({ content: '// ' + label.toUpperCase(), x, y, w: 300, h: 22, fontSize: 9,
        fontWeight: 900, color: accent, letterSpacing: 3, textTransform: 'uppercase',
        opacity: 0.85, fontFamily: theme.fontMono, zIndex: 10 });
    }
    // 'label' style (Minimal, Luxury)
    return makeText({ content: label.toUpperCase(), x, y, w: 280, h: 22, fontSize: 9,
      fontWeight: 700, color: text, opacity: 0.35, letterSpacing: 4,
      textTransform: 'uppercase', fontFamily: theme.fontBody, zIndex: 10 });
  };

  // Accent divider bar — width controlled by theme
  const accentBar = (x: number, y: number, w = theme.accentBarWidth): ShapeElement =>
    makeShape({ shape: 'rect', fill: accent, x, y, w, h: theme.tagStyle === 'bar' ? 1 : 3,
      borderRadius: theme.cardRadius < 8 ? 0 : 2, zIndex: 10 });

  // Section panel backgrounds
  const bgPanel = (x: number, y: number, w: number, h: number, alpha = '0A', radius = theme.cardRadius): ShapeElement =>
    makeShape({ shape: 'rect', fill: `${accent}${alpha}`, x, y, w, h, borderRadius: radius, zIndex: 3 });

  const bgPanelSolid = (x: number, y: number, w: number, h: number, color: string, radius = 0): ShapeElement =>
    makeShape({ shape: 'rect', fill: color, x, y, w, h, borderRadius: radius, zIndex: 2 });

  // Headline text — uses theme display font, weight, tracking
  const headline = (content: string, x: number, y: number, w: number, size = 56): TextElement =>
    makeText({ content, x, y, w, h: Math.ceil(size * 1.15 * 2), fontSize: size,
      fontWeight: theme.headlineWeight, fontFamily: theme.fontDisplay,
      color: text, lineHeight: 1.08,
      letterSpacing: size > 40 ? theme.headlineTracking : Math.max(theme.headlineTracking, -1),
      textTransform: theme.headlineCase, zIndex: 5 });

  // Subtitle / body text
  const sub = (content: string, x: number, y: number, w: number, size = 16): TextElement =>
    makeText({ content, x, y, w, h: 56, fontSize: size, color: text,
      fontFamily: theme.fontBody, opacity: 0.5, lineHeight: 1.65, zIndex: 5 });

  // Content card — radius, border driven by theme
  const card = (content: string, x: number, y: number, w: number, h: number, size = 13, strong = false): TextElement =>
    makeText({ content, x, y, w, h, fontSize: size, color: text,
      fontFamily: theme.fontBody, opacity: 0.88,
      background: strong ? theme.surfaceStrong : theme.surface,
      borderRadius: theme.cardRadius, padding: theme.cardRadius > 10 ? 20 : 16,
      lineHeight: 1.6, zIndex: 5 });

  // KPI card — adapts accent, bg, border from theme
  const kpi = (label: string, value: string, x: number, y: number, w = 186, h = 100, sublabel = ''): KPIElement =>
    makeKPI({ label, value, sublabel, accent, textColor: text,
      bg: theme.surface, x, y, w, h, zIndex: 6 });

  // Header strip element — shown only when theme.headerStrip = true
  const headerStrip = (h = 108): ShapeElement =>
    makeShape({ shape: 'rect', fill: theme.surfaceStrong, x: 0, y: 0, w: CANVAS_W, h,
      borderRadius: 0, zIndex: 3 });

  // Right visual panel background — width driven by theme.splitRatio
  const visualPanelX = Math.round(CANVAS_W * (1 - theme.splitRatio));
  const visualPanelW = CANVAS_W - visualPanelX;

  const rightPanel = (): ShapeElement =>
    makeShape({ shape: 'rect', fill: theme.surfaceStrong, x: visualPanelX, y: 0,
      w: visualPanelW, h: CANVAS_H, borderRadius: 0, zIndex: 2 });

  const rightPanelLine = (): ShapeElement =>
    makeShape({ shape: 'rect', fill: accent, x: visualPanelX - 2, y: 60, w: 2, h: 600,
      borderRadius: 0, opacity: 0.15, zIndex: 5 });

  // Left content width (for positioning text elements)
  const leftW = visualPanelX - 52;

  // ── Data defaults ─────────────────────────────────────────────────────────
  const hasRealFounders = a.founders.length > 0;
  const founders: DLFounder[] = hasRealFounders ? a.founders.slice(0, 4) : [
    {
      name: 'Your Name',
      role: 'CEO & Co-Founder',
      background: 'Click to edit — add your background, experience, and what drives you to solve this problem.',
      photo: '',
      linkedin: 'linkedin.com/in/yourname',
      previousCompany: 'Previous Company',
      previousRole: 'Previous Role',
      yearsExp: '10+',
      achievement: 'Key achievement or credential',
      isPlaceholder: true,
    } as DLFounder & { isPlaceholder: boolean },
    {
      name: 'Co-Founder',
      role: 'CTO',
      background: 'Click to edit — add technical background, notable projects, and engineering credentials.',
      photo: '',
      linkedin: 'linkedin.com/in/cofounder',
      previousCompany: 'Tech Company',
      previousRole: 'Senior Engineer',
      yearsExp: '8+',
      achievement: 'Built systems at scale',
    } as DLFounder,
    {
      name: 'Third Founder',
      role: 'CMO',
      background: 'Click to edit — add go-to-market experience, growth achievements, and domain expertise.',
      photo: '',
      linkedin: 'linkedin.com/in/thirdfounder',
      previousCompany: 'Growth Co.',
      previousRole: 'VP Growth',
      yearsExp: '7+',
      achievement: '0→$10M ARR',
    } as DLFounder,
  ];

  const gtmChannels = a.gtmStrategy || [
    'Direct enterprise sales via outbound and warm VC intros',
    'Channel partner network across target region',
    'Product-led growth with freemium conversion funnel',
    'Strategic co-marketing and media partnerships',
  ];

  const projections = a.revenueProjections && a.revenueProjections.length > 0 ? a.revenueProjections : [
    { year: 'Year 1', value: '$480K ARR — 40 paying clients, product-market fit locked' },
    { year: 'Year 2', value: '$2.4M ARR — 5× growth via channel partner launch' },
    { year: 'Year 3', value: '$9.6M ARR — Series A scale, market leadership' },
  ];

  const fundingUse = a.fundingUse || [
    '40% — Product & Engineering',
    '30% — Sales & Go-to-Market',
    '20% — Team & Hiring',
    '10% — Operations & Reserve',
  ];

  // ── 01 COVER ──────────────────────────────────────────────────────────────
  const coverSlide: Slide = {
    id: uid(), name: 'Cover', bg, bgGradient: theme.gradient,
    elements: [
      rightPanel(),
      rightPanelLine(),
      makeMockup({ industry: a.industry, accent, bg, textColor: text, screenshotUrl: screenshot,
        startupName: a.startupName, x: visualPanelX + 12, y: 24,
        w: visualPanelW - 24, h: CANVAS_H - 48, borderRadius: theme.cardRadius, zIndex: 4 }),
      // Left content
      tag('Investor Presentation · ' + (a.stage || 'Seed Stage'), 52, 88),
      makeText({ content: a.startupName, x: 52, y: 128, w: leftW + 20, h: 190,
        fontSize: Math.min(84, Math.max(60, 84 - a.startupName.length * 1.4)),
        fontWeight: theme.headlineWeight, fontFamily: theme.fontDisplay,
        color: text, lineHeight: 1.0, letterSpacing: theme.headlineTracking, zIndex: 5 }),
      accentBar(52, 328),
      makeText({ content: a.tagline || `Redefining the future of ${a.industry}`, x: 52, y: 342,
        w: leftW, h: 72, fontSize: 19, fontFamily: theme.fontBody,
        color: text, opacity: 0.52, lineHeight: 1.65, zIndex: 5 }),
      // 4-up KPI strip — wider boxes + taller so long values (e.g. "$28.5B")
      // have room; values also auto-shrink via fitKpiFontSize at render time.
      kpi('MARKET SIZE', a.marketSizing.tam, 52, 440, 170, 104),
      kpi('GROWTH', a.marketSizing.growthRate, 232, 440, 150, 104),
      kpi('STAGE', a.stage || 'Seed', 392, 440, 120, 104),
      kpi('INDUSTRY', a.industry.split(' ')[0], 522, 440, leftW - 474, 104),
      // Bottom strip
      bgPanelSolid(0, 662, visualPanelX, 58, theme.surfaceStrong, 0),
      makeText({ content: `${a.country || 'Global'} · ${a.industry} · CONFIDENTIAL`, x: 52, y: 682,
        w: 560, h: 22, fontSize: 8, fontWeight: 700, fontFamily: theme.fontMono,
        color: text, opacity: 0.22, letterSpacing: 3, textTransform: 'uppercase', zIndex: 6 }),
      makeText({ content: 'DECISIONLAB', x: 520, y: 682, w: 130, h: 22, fontSize: 8, fontWeight: 900,
        fontFamily: theme.fontMono, color: accent, opacity: 0.45,
        letterSpacing: 2, textTransform: 'uppercase', align: 'right', zIndex: 6 }),
    ],
  };

  // ── 02 PROBLEM ────────────────────────────────────────────────────────────
  const problemSlide: Slide = {
    id: uid(), name: 'Problem', bg, bgGradient: theme.gradient,
    elements: [
      theme.headerStrip ? headerStrip() : null,
      rightPanel(),
      rightPanelLine(),
      tag('02 · The Problem', 52, 44),
      headline('THE MARKET GAP', 52, 84, leftW, 44),
      accentBar(52, 152),
      makeText({ content: a.problemStatement || 'Market gaps have left a clear underserved segment.', x: 52, y: 180, w: leftW - 20, h: 120, fontSize: 18, color: text, fontFamily: theme.fontBody, opacity: 0.85, zIndex: 5 }),
      
      // Insights cards
      tag('VALIDATED MARKET GAPS', visualPanelX + 32, 44),
      ...(a.problemInsights || []).slice(0, 3).map((ins, i) => 
        card(ins, visualPanelX + 32, 100 + i * 180, visualPanelW - 64, 150, 14, i % 2 === 0)
      ),
    ].filter(Boolean) as SlideElement[],
  };

  // ── 03 SOLUTION ───────────────────────────────────────────────────────────
  const solutionSlide: Slide = {
    id: uid(), name: 'Solution', bg, bgGradient: theme.gradient,
    elements: [
      theme.headerStrip ? headerStrip() : null,
      rightPanel(),
      rightPanelLine(),
      tag('03 · Our Solution', 52, 44),
      headline('THE OPPORTUNITY IN FOCUS', 52, 84, leftW, 44),
      accentBar(52, 152),
      makeText({ content: a.solutionStatement || 'Our platform offers a unique competitive advantage.', x: 52, y: 180, w: leftW - 20, h: 120, fontSize: 18, color: text, fontFamily: theme.fontBody, opacity: 0.85, zIndex: 5 }),
      
      tag('PRODUCT INTERFACE', visualPanelX + 32, 44),
      makeMockup({ industry: a.industry, accent, bg, textColor: text, screenshotUrl: screenshot,
        startupName: a.startupName, x: visualPanelX + 24, y: 100,
        w: visualPanelW - 48, h: CANVAS_H - 160, borderRadius: theme.cardRadius, zIndex: 4 }),
    ].filter(Boolean) as SlideElement[],
  };

  // ── 04 PRODUCT FEATURES ────────────────────────────────────────────────────
  const productSlide: Slide = {
    id: uid(), name: 'Product', bg, bgGradient: theme.gradient,
    elements: [
      theme.headerStrip ? headerStrip() : null,
      rightPanel(),
      rightPanelLine(),
      tag('04 · Product Features', 52, 44),
      headline('CORE CAPABILITIES', 52, 84, leftW, 44),
      accentBar(52, 152),
      ...(a.productFeatures || []).slice(0, 3).map((feat, i) => 
        card(feat, 52, 180 + i * 136, leftW - 20, 116, 14, i % 2 === 0)
      ),
      
      tag('INTERACTIVE DEMO', visualPanelX + 32, 44),
      makeMockup({ industry: a.industry, accent, bg, textColor: text, screenshotUrl: screenshot,
        startupName: a.startupName, x: visualPanelX + 24, y: 100,
        w: visualPanelW - 48, h: CANVAS_H - 160, borderRadius: theme.cardRadius, zIndex: 4 }),
    ].filter(Boolean) as SlideElement[],
  };

  // ── 05 MARKET SIZING ───────────────────────────────────────────────────────
  const marketSlide: Slide = {
    id: uid(), name: 'Market Sizing', bg, bgGradient: theme.gradient,
    elements: [
      theme.headerStrip ? headerStrip() : null,
      rightPanel(),
      rightPanelLine(),
      tag('05 · Market Opportunity', 52, 44),
      headline('ADDRESSABLE OPPORTUNITY', 52, 84, leftW, 44),
      accentBar(52, 152),
      
      kpi('TAM (TOTAL)', a.marketSizing.tam, 52, 180, 240, 110, 'Total Addressable Market'),
      kpi('SAM (SERVICEABLE)', a.marketSizing.sam, 310, 180, 240, 110, 'Serviceable Obtainable'),
      kpi('SOM (TARGET)', a.marketSizing.som, 52, 310, 240, 110, 'Initial Target Segment'),
      kpi('CAGR (GROWTH RATE)', a.marketSizing.growthRate, 310, 310, 240, 110, 'Compound Annual Growth'),
      
      makeText({ content: a.marketSizing.overview || 'Expanding rapidly across all sub-segments and regions.', x: 52, y: 450, w: leftW - 20, h: 100, fontSize: 14, color: text, fontFamily: theme.fontBody, opacity: 0.6, zIndex: 5 }),
      
      tag('MARKET SHARE PROJECTION', visualPanelX + 32, 44),
      makeChart({
        x: visualPanelX + 32, y: 100, w: visualPanelW - 64, h: 320,
        chartType: 'donut',
        data: [
          { label: 'Our SOM', value: 8 },
          { label: 'SAM Unlocked', value: 32 },
          { label: 'Remaining TAM', value: 60 }
        ],
        accent, textColor: text, bg: theme.surfaceStrong,
      }),
    ].filter(Boolean) as SlideElement[],
  };

  // ── 06 GO-TO-MARKET ────────────────────────────────────────────────────────
  const gtmSlide: Slide = {
    id: uid(), name: 'Go-to-Market', bg, bgGradient: theme.gradient,
    elements: [
      theme.headerStrip ? headerStrip() : null,
      rightPanel(),
      rightPanelLine(),
      tag('06 · Target Segments', 52, 44),
      headline('GO-TO-MARKET STRATEGY', 52, 84, leftW, 44),
      accentBar(52, 152),
      ...(a.gtmStrategy || []).slice(0, 3).map((step, i) => 
        card(step, 52, 180 + i * 136, leftW - 20, 116, 14, i % 2 === 0)
      ),
      
      tag('TARGET AUDIENCE SEGMENTS', visualPanelX + 32, 44),
      ...(a.targetSegments || []).slice(0, 3).map((seg, i) => 
        card(seg, visualPanelX + 32, 100 + i * 180, visualPanelW - 64, 150, 14, i % 2 === 0)
      ),
    ].filter(Boolean) as SlideElement[],
  };

  // ── 07 BUSINESS MODEL ──────────────────────────────────────────────────────
  const businessSlide: Slide = {
    id: uid(), name: 'Business Model', bg, bgGradient: theme.gradient,
    elements: [
      theme.headerStrip ? headerStrip() : null,
      rightPanel(),
      rightPanelLine(),
      tag('07 · Revenue Generation', 52, 44),
      headline('REVENUE STREAMS & MONETIZATION', 52, 84, leftW, 44),
      accentBar(52, 152),
      ...(a.revenueStreams || []).slice(0, 3).map((stream, i) => 
        card(stream, 52, 180 + i * 136, leftW - 20, 116, 14, i % 2 === 0)
      ),
      
      tag('PRICING MODEL STRUCTURE', visualPanelX + 32, 44),
      card(a.pricingModel || 'Scalable recurring model offering exceptional LTV/CAC ratios.', visualPanelX + 32, 100, visualPanelW - 64, 160, 14, true),
      kpi('LTV : CAC', '3.8×', visualPanelX + 32, 280, 160, 90),
      kpi('PAYBACK PERIOD', '5 Months', visualPanelX + 210, 280, 160, 90),
    ].filter(Boolean) as SlideElement[],
  };

  // ── 08 COMPETITION ─────────────────────────────────────────────────────────
  const compSlide: Slide = {
    id: uid(), name: 'Competition', bg, bgGradient: theme.gradient,
    elements: [
      theme.headerStrip ? headerStrip() : null,
      rightPanel(),
      rightPanelLine(),
      tag('08 · Competitive Landscape', 52, 44),
      headline('OUR UNFAIR ADVANTAGES', 52, 84, leftW, 44),
      accentBar(52, 152),
      ...(a.competitiveAdvantages || []).slice(0, 3).map((adv, i) => 
        card(adv, 52, 180 + i * 136, leftW - 20, 116, 14, i % 2 === 0)
      ),
      
      tag('COMPETITOR ANALYSIS', visualPanelX + 32, 44),
      ...(a.competitors || []).slice(0, 3).map((comp, i) => 
        card(`${comp.name.toUpperCase()}\nWeakness: ${comp.weakness}\nOur Edge: ${comp.ourEdge}`, visualPanelX + 32, 100 + i * 180, visualPanelW - 64, 150, 13, i % 2 === 0)
      ),
    ].filter(Boolean) as SlideElement[],
  };

  // ── 09 TRACTION ────────────────────────────────────────────────────────────
  const tractionSlide: Slide = {
    id: uid(), name: 'Traction', bg, bgGradient: theme.gradient,
    elements: [
      theme.headerStrip ? headerStrip() : null,
      rightPanel(),
      rightPanelLine(),
      tag('09 · Validation & Traction', 52, 44),
      headline('KEY METRICS & PERFORMANCE', 52, 84, leftW, 44),
      accentBar(52, 152),
      
      kpi('STARTUP SCORE', `${a.overallScore}%`, 52, 180, 240, 110, 'Institutional Grade'),
      kpi('INVESTOR READY', `${a.investorReadinessScore}%`, 310, 180, 240, 110, 'Appeal Score'),
      kpi('MARKET FIT', `${a.marketFitScore}%`, 52, 310, 240, 110, 'Validated Demand'),
      kpi('SCALABILITY', `${a.scalabilityScore}%`, 310, 310, 240, 110, 'Scale Capacity'),
      
      tag('TRACTION HIGHLIGHTS', visualPanelX + 32, 44),
      ...(a.tractionPoints || []).slice(0, 3).map((trac, i) => 
        card(trac, visualPanelX + 32, 100 + i * 180, visualPanelW - 64, 150, 14, i % 2 === 0)
      ),
    ].filter(Boolean) as SlideElement[],
  };

  // ── 10 STRATEGIC ROADMAP ───────────────────────────────────────────────────
  const roadmapSlide: Slide = {
    id: uid(), name: 'Roadmap', bg, bgGradient: theme.gradient,
    elements: [
      theme.headerStrip ? headerStrip() : null,
      rightPanel(),
      rightPanelLine(),
      tag('10 · Future Growth', 52, 44),
      headline('STRATEGIC TIMELINE', 52, 84, leftW, 44),
      accentBar(52, 152),
      ...(a.growthTimeline || []).slice(0, 3).map((tl, i) => 
        card(tl, 52, 180 + i * 136, leftW - 20, 116, 14, i % 2 === 0)
      ),
      
      tag('GROWTH VELOCITY', visualPanelX + 32, 44),
      makeChart({
        x: visualPanelX + 32, y: 100, w: visualPanelW - 64, h: 320,
        chartType: 'area',
        data: [
          { label: 'Launch', value: 10 },
          { label: 'Q1', value: 30 },
          { label: 'Q2', value: 60 },
          { label: 'Q3', value: 120 }
        ],
        accent, textColor: text, bg: theme.surfaceStrong,
      }),
    ].filter(Boolean) as SlideElement[],
  };

  // ── 11 FOUNDING TEAM ───────────────────────────────────────────────────────
  const teamSlide: Slide = {
    id: uid(), name: 'Team', bg, bgGradient: theme.gradient,
    elements: [
      theme.headerStrip ? headerStrip() : null,
      rightPanel(),
      rightPanelLine(),
      tag('11 · The Founders', 52, 44),
      headline('FOUNDING TEAM EXPERTISE', 52, 84, leftW, 44),
      accentBar(52, 152),
      
      ...founders.slice(0, 3).map((f, i) => 
        makeTeamCard({
          name: f.name, role: f.role, bio: f.background,
          linkedin: f.linkedin, previousCompany: f.previousCompany, previousRole: f.previousRole,
          yearsExp: f.yearsExp, achievement: f.achievement, photo: f.photo,
          isPlaceholder: f.isPlaceholder,
          x: 52 + i * 192, y: 180, w: 180, h: 420,
          accent, textColor: text, bg: theme.surface, surface: theme.surface,
          surfaceStrong: theme.surfaceStrong, fontDisplay: theme.fontDisplay,
          fontBody: theme.fontBody, fontMono: theme.fontMono, cardRadius: theme.cardRadius,
          tagStyle: theme.tagStyle, headlineWeight: theme.headlineWeight,
        })
      ),
      
      tag('ADVISORS & SECTOR STRENGTH', visualPanelX + 32, 44),
      card('Our advisory board consists of venture leaders and key operators from target industry sectors.', visualPanelX + 32, 100, visualPanelW - 64, 180, 14, true),
      kpi('FOUNDING TEAM SIZE', '3 Founders', visualPanelX + 32, 300, 160, 90),
      kpi('TOTAL DIRECT EXPERIENCE', '20+ Years', visualPanelX + 210, 300, 160, 90),
    ].filter(Boolean) as SlideElement[],
  };

  // ── 12 FUNDING & FINANCIALS ────────────────────────────────────────────────
  const fundingSlide: Slide = {
    id: uid(), name: 'Financials', bg, bgGradient: theme.gradient,
    elements: [
      theme.headerStrip ? headerStrip() : null,
      rightPanel(),
      rightPanelLine(),
      tag('12 · Funding Ask & Use', 52, 44),
      headline('FUNDING ASK & ALLOCATION', 52, 84, leftW, 44),
      accentBar(52, 152),
      kpi('FUNDING TARGET', a.fundingAsk || '$1.5M', 52, 180, 240, 110, 'Equity Financing Round'),
      kpi('ALLOCATION TARGET', 'MVP & Sales', 310, 180, 240, 110, 'Core Growth Trajectory'),
      
      tag('USE OF CAPITAL', 52, 310),
      ...(fundingUse || []).slice(0, 3).map((use, i) => 
        card(use, 52, 340 + i * 86, leftW - 20, 72, 13, i % 2 === 0)
      ),

      tag('REVENUE PROJECTIONS', visualPanelX + 32, 44),
      ...(projections || []).slice(0, 3).map((proj, i) => 
        card(`${proj.year}: ${proj.value}`, visualPanelX + 32, 100 + i * 110, visualPanelW - 64, 90, 13, i % 2 === 0)
      ),
      card(a.finalVerdict || 'Strong potential for rapid scalability and capital efficiency.', visualPanelX + 32, 450, visualPanelW - 64, 180, 13, true),
    ].filter(Boolean) as SlideElement[],
  };

  return [
    coverSlide,
    problemSlide,
    solutionSlide,
    productSlide,
    marketSlide,
    gtmSlide,
    businessSlide,
    compSlide,
    tractionSlide,
    roadmapSlide,
    teamSlide,
    fundingSlide,
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENGINE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function PitchDeckArchitectEngine() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const projectId = searchParams.get('projectId');

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<DLAnalysis | null>(null);
  const [themeId, setThemeId] = useState<keyof typeof THEMES>('siliconValley');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const activeTheme = useMemo(() => THEMES[themeId], [themeId]);

  // Load analysis and initialize slides
  useEffect(() => {
    async function load() {
      if (!projectId) {
        setError('No project ID provided in URL parameters.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const docRef = doc(db, 'analyses', projectId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setError('Specified analysis project does not exist.');
          setLoading(false);
          return;
        }

        const mappedData = mapFirestore(docSnap.data());
        setAnalysis(mappedData);

        // Also fetch from pitchDecks if exists, to preserve user changes!
        const deckRef = doc(db, 'pitchDecks', projectId);
        const deckSnap = await getDoc(deckRef);

        let activeThemeKey: keyof typeof THEMES = 'siliconValley';
        if (deckSnap.exists()) {
          const dData = deckSnap.data();
          if (dData.template) {
            // Find theme key matching template string
            const foundKey = Object.keys(THEMES).find(
              k => THEMES[k as keyof typeof THEMES].name === dData.template
            ) as keyof typeof THEMES;
            if (foundKey) activeThemeKey = foundKey;
          }
        }
        setThemeId(activeThemeKey);

        const compiled = compileSlides(mappedData, THEMES[activeThemeKey]);

        // If saved slides exist in database, restore elements
        if (deckSnap.exists()) {
          const dData = deckSnap.data();
          if (Array.isArray(dData.slides)) {
            const restored = compiled.map(slide => {
              const matchedSaved = dData.slides.find((s: any) => s.id.split('-').pop() === slide.name.toLowerCase());
              if (matchedSaved && Array.isArray(matchedSaved.elements)) {
                return {
                  ...slide,
                  elements: matchedSaved.elements
                };
              }
              return slide;
            });
            setSlides(restored);
          } else {
            setSlides(compiled);
          }
        } else {
          setSlides(compiled);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error occurred while fetching presentation data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  // Handle canvas scaling
  useEffect(() => {
    function resize() {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const parentW = canvasRef.current.parentElement.clientWidth;
        const scale = Math.min(1, parentW / CANVAS_W);
        setCanvasScale(scale);
      }
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [loading]);

  const activeSlide = slides[activeSlideIndex];
  const selectedElement = useMemo(() => {
    if (!activeSlide || !selectedElementId) return null;
    return activeSlide.elements.find(el => el.id === selectedElementId) || null;
  }, [activeSlide, selectedElementId]);

  // Change theme and compile slides again with new theme styles
  const handleThemeChange = (newThemeId: keyof typeof THEMES) => {
    setThemeId(newThemeId);
    if (!analysis) return;
    const newTheme = THEMES[newThemeId];
    const newSlides = compileSlides(analysis, newTheme);
    
    // Preserve custom edited contents of text elements while switching theme styles
    const updated = slides.map((oldSlide, sIdx) => {
      const templateSlide = newSlides[sIdx];
      if (!templateSlide) return oldSlide;
      return {
        ...templateSlide,
        elements: templateSlide.elements.map(tempEl => {
          const oldEl = oldSlide.elements.find(el => el.id === tempEl.id);
          if (oldEl && oldEl.type === 'text') {
            return {
              ...tempEl,
              content: oldEl.content,
            };
          }
          return tempEl;
        })
      };
    });
    setSlides(updated);
  };

  // Edit text content
  const handleElementContentChange = (content: string) => {
    if (!selectedElementId || activeSlideIndex === -1) return;
    setSlides(prev => prev.map((slide, sIdx) => {
      if (sIdx !== activeSlideIndex) return slide;
      return {
        ...slide,
        elements: slide.elements.map(el => {
          if (el.id !== selectedElementId) return el;
          return { ...el, content };
        })
      };
    }));
  };

  // Edit helper styles (fontSize, color, bold)
  const handleElementStyleChange = (key: string, value: any) => {
    if (!selectedElementId || activeSlideIndex === -1) return;
    setSlides(prev => prev.map((slide, sIdx) => {
      if (sIdx !== activeSlideIndex) return slide;
      return {
        ...slide,
        elements: slide.elements.map(el => {
          if (el.id !== selectedElementId) return el;
          return { ...el, [key]: value };
        })
      };
    }));
  };

  // Reorder layer
  const handleElementLayerChange = (direction: 'front' | 'back') => {
    if (!selectedElementId || activeSlideIndex === -1) return;
    setSlides(prev => prev.map((slide, sIdx) => {
      if (sIdx !== activeSlideIndex) return slide;
      const sortedZ = [...slide.elements].map(el => el.zIndex || 0).sort((a, b) => a - b);
      const minZ = sortedZ[0] || 0;
      const maxZ = sortedZ[sortedZ.length - 1] || 0;
      return {
        ...slide,
        elements: slide.elements.map(el => {
          if (el.id !== selectedElementId) return el;
          return { ...el, zIndex: direction === 'front' ? maxZ + 1 : Math.max(0, minZ - 1) };
        })
      };
    }));
  };

  // Delete element
  const handleDeleteElement = () => {
    if (!selectedElementId || activeSlideIndex === -1) return;
    setSlides(prev => prev.map((slide, sIdx) => {
      if (sIdx !== activeSlideIndex) return slide;
      return {
        ...slide,
        elements: slide.elements.filter(el => el.id !== selectedElementId)
      };
    }));
    setSelectedElementId(null);
  };

  // ── SLIDE MANAGEMENT ──────────────────────────────────────────────────────
  // Add a new blank slide right after the currently active slide.
  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: uid(),
      name: 'New Slide',
      bg: activeTheme.bg,
      bgGradient: activeTheme.gradient,
      elements: [
        makeText({
          content: 'New Slide Title',
          x: 80, y: 80, w: 600, h: 90,
          fontSize: 44, fontWeight: activeTheme.headlineWeight,
          fontFamily: activeTheme.fontDisplay, color: activeTheme.text, zIndex: 5,
        }),
        makeText({
          content: 'Click any text to edit it. Use the toolbar to add shapes, change colors, and style this slide.',
          x: 80, y: 190, w: 600, h: 120,
          fontSize: 18, fontFamily: activeTheme.fontBody,
          color: activeTheme.text, opacity: 0.6, lineHeight: 1.6, zIndex: 5,
        }),
      ],
    };
    setSlides(prev => {
      const next = [...prev];
      next.splice(activeSlideIndex + 1, 0, newSlide);
      return next;
    });
    setActiveSlideIndex(activeSlideIndex + 1);
    setSelectedElementId(null);
  };

  // Delete the currently active slide (keep at least one slide).
  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) {
      alert('A presentation needs at least one slide.');
      return;
    }
    if (!confirm('Delete this slide? This cannot be undone unless you reload without saving.')) return;
    setSlides(prev => prev.filter((_, i) => i !== index));
    setActiveSlideIndex(prev => {
      if (index < prev) return prev - 1;
      if (index === prev) return Math.max(0, prev - 1);
      return prev;
    });
    setSelectedElementId(null);
  };

  // Move a slide up or down in the order.
  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= slides.length) return;
    setSlides(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setActiveSlideIndex(target);
    setSelectedElementId(null);
  };

  // ── ADD ELEMENTS ──────────────────────────────────────────────────────────
  // Insert a new element into the active slide and select it.
  const addElementToActiveSlide = (el: SlideElement) => {
    setSlides(prev => prev.map((slide, sIdx) => {
      if (sIdx !== activeSlideIndex) return slide;
      return { ...slide, elements: [...slide.elements, el] };
    }));
    setSelectedElementId(el.id);
  };

  const handleAddText = () => {
    addElementToActiveSlide(makeText({
      content: 'New text',
      x: 120, y: 120, w: 360, h: 80,
      fontSize: 28, fontWeight: 700,
      fontFamily: activeTheme.fontBody, color: activeTheme.text, zIndex: 20,
    }));
  };

  const handleAddShape = (shape: 'rect' | 'circle' | 'line') => {
    const base = { x: 200, y: 200, zIndex: 15, fill: activeTheme.accent };
    if (shape === 'line') {
      addElementToActiveSlide(makeShape({ ...base, shape: 'line', w: 300, h: 4 }));
    } else if (shape === 'circle') {
      addElementToActiveSlide(makeShape({ ...base, shape: 'circle', w: 160, h: 160 }));
    } else {
      addElementToActiveSlide(makeShape({ ...base, shape: 'rect', w: 240, h: 140, borderRadius: 12 }));
    }
  };

  // Read a file as a base64 data URL (used as fallback + for instant preview).
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Upload an image: try Firebase Storage (proper, scalable), fall back to
  // embedding a small base64 copy if Storage isn't available so the user is
  // never blocked. Returns a usable src string.
  const uploadImage = async (file: File): Promise<string> => {
    const dataUrl = await fileToDataUrl(file);
    try {
      const { getStorage, ref, uploadString, getDownloadURL } = await import('firebase/storage');
      const storage = getStorage();
      const path = `pitchDeckImages/${user?.uid || 'anon'}/${projectId || 'deck'}/${uid()}-${file.name.replace(/\s+/g, '_')}`;
      const sRef = ref(storage, path);
      await uploadString(sRef, dataUrl, 'data_url');
      return await getDownloadURL(sRef);
    } catch (e) {
      console.warn('Firebase Storage upload failed; embedding image inline instead.', e);
      // Fallback: only embed if reasonably small, to avoid Firestore 1MB doc limit.
      if (dataUrl.length > 900_000) {
        alert('This image is large and cloud storage is unavailable. Please use a smaller image (under ~700KB) or enable Firebase Storage.');
        throw new Error('Image too large for inline fallback');
      }
      return dataUrl;
    }
  };

  // Triggered by the hidden file input when a user picks an image.
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = ''; // reset so same file can be re-picked
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (PNG, JPG, etc.).');
      return;
    }
    try {
      setIsUploadingImage(true);
      const src = await uploadImage(file);
      addElementToActiveSlide(makeImage({ src, x: 180, y: 160, w: 380, h: 260 }));
    } catch (err: any) {
      console.error(err);
      if (!String(err?.message || '').includes('too large')) {
        alert('Could not add the image. Please try again.');
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save changes to Firestore
  const handleSaveDeck = async () => {
    if (!projectId || !analysis || !user) return;
    try {
      setIsSaving(true);
      const payloadSlides = slides.map(s => ({
        id: s.id,
        title: s.name,
        content: (s.elements.find(el => el.type === 'text' && el.id.includes('sub')) as TextElement | undefined)?.content || '',
        points: [],
        layout: 'split',
        imageUrl: (s.elements.find(el => el.type === 'image') as ImageElement | undefined)?.src || '',
        colorAccent: activeTheme.accent,
        elements: s.elements as any,
      }));

      // Set pitch deck back to firestore
      const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
      await setDoc(doc(db, 'pitchDecks', projectId), {
        id: projectId,
        userId: user.uid,
        projectName: analysis.startupName,
        title: `${analysis.startupName} Strategic Pitch Deck`,
        template: activeTheme.name,
        slides: payloadSlides,
        theme: {
          primaryColor: activeTheme.bg,
          secondaryColor: activeTheme.accent,
          fontFamily: activeTheme.fontDisplay,
          mode: 'dark',
          borderRadius: activeTheme.cardRadius,
          shadow: 'md',
          headerWeight: activeTheme.headlineWeight,
          backgroundGradient: activeTheme.gradient || 'none'
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Trigger success alert
      alert('Strategic pitch deck saved successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Error occurred while saving: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Export Slide deck
  const handleExport = async (format: 'pptx' | 'pdf') => {
    if (!analysis) return;
    try {
      setIsExporting(format);
      
      const payloadSlides = slides.map(s => ({
        id: s.id,
        title: s.name,
        content: (s.elements.find(el => el.type === 'text' && el.id.includes('sub')) as TextElement | undefined)?.content || '',
        points: [],
        layout: 'split' as const,
        imageUrl: (s.elements.find(el => el.type === 'image') as ImageElement | undefined)?.src || '',
        colorAccent: activeTheme.accent,
        elements: s.elements as any,
      }));

      const deck = {
        id: projectId || 'deck',
        projectName: analysis.startupName,
        slides: payloadSlides,
        template: activeTheme.name,
      };

      const presentationUtils = await import('../lib/presentationUtils');
      if (format === 'pptx') {
        await presentationUtils.exportToPPTX(deck as any, analysis.startupName);
      } else {
        await presentationUtils.exportToPDF('pitch-deck-export-container', analysis.startupName);
      }
    } catch (err: any) {
      console.error(err);
      alert('Export failed: ' + err.message);
    } finally {
      setIsExporting(null);
    }
  };

  // Category coach guidelines
  const getCoachAdvice = () => {
    if (!activeSlide) return 'Compile and structure your core investment narrative.';
    switch (activeSlide.name) {
      case 'Cover':
        return 'The cover establishes credibility instantly. Emphasize your Overall Startup Strength rating of ' + (analysis?.overallScore || '85') + '% as calculated by DecisionLab analytics.';
      case 'Problem':
        return 'Focus on real pain points. Quantified problems (gaps, saturation levels) make investors pay attention to your solution immediately.';
      case 'Solution':
        return 'Keep it simple. Describe how your technology addresses the exact problem. Use the product mockup panel on the right to anchor focus.';
      case 'Product':
        return 'Detail core capabilities cleanly. Each card lists a unique advantage. Maintain crisp fonts and highlight the structural moat.';
      case 'Market Sizing':
        return 'Ensure your TAM/SAM/SOM numbers align. Projections showing realistic scaling models build significant trust.';
      case 'Go-to-Market':
        return 'Your strategy must prove execution ability. Detail how you will target individual segments efficiently.';
      case 'Business Model':
        return 'Investors love high LTV:CAC ratios and short payback windows. Highlight recurring monetization pipelines.';
      case 'Competition':
        return 'Acknowledge all major competitors. Your clear edge proves structural defensive moats in active markets.';
      case 'Traction':
        return 'Traction cures all risk. This slide highlights overall scores generated by our deep evaluation metrics.';
      case 'Roadmap':
        return 'A clean strategic timeline reassures investors you will deploy seed funding in high-leverage milestones.';
      case 'Team':
        return 'Founders with previous sector-specific execution, corporate engineering experience, or scaling backgrounds win round checks.';
      case 'Financials':
        return 'Align the Ask with use-of-capital distributions. Ensure projections display strong capital efficiency.';
      default:
        return 'Align layout alignment, sizes, and colors to maintain editorial consistency across all presentation slides.';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center text-slate-300 font-sans">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-sm font-mono tracking-widest text-slate-500 uppercase">Compiling Investment Archetypes...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center text-slate-300 font-sans p-6">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Architect compilation failed</h2>
        <p className="text-sm text-slate-400 mb-6 text-center max-w-md">{error || 'Could not load strategic metadata'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition text-sm font-bold flex items-center gap-2 cursor-pointer"
        >
          <ChevronLeft size={16} /> RETURN TO DASHBOARD
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-[#e2e8f0] font-sans flex flex-col">
      {/* HEADER BAR */}
      <header className="h-16 border-b border-white/5 bg-[#0a0d16]/80 backdrop-blur-md px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-400 hover:text-[#e2e8f0] hover:bg-white/5 rounded-xl transition cursor-pointer"
            title="Return to Dashboard"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase flex items-center gap-2">
              <span>{analysis.startupName}</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-mono font-bold">PITCH ARCHITECT</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-tight mt-0.5">
              ANALYSIS ID: {projectId?.slice(0, 8).toUpperCase()} · SCENARIO EVALUATION
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-3">
          {/* THEME SELECTOR Swatches */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
            <Palette size={14} className="text-slate-400" />
            <select
              value={themeId}
              onChange={(e) => handleThemeChange(e.target.value as keyof typeof THEMES)}
              className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer pr-4 border-none"
            >
              {Object.keys(THEMES).map((key) => (
                <option key={key} value={key} className="bg-[#111625] text-slate-300">
                  {THEMES[key as keyof typeof THEMES].name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveDeck}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 disabled:opacity-50 disabled:pointer-events-none rounded-xl text-xs font-black tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} SAVE CHANGES
          </button>

          <button
            onClick={() => handleExport('pptx')}
            disabled={!!isExporting}
            className="px-4 py-2 bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white disabled:opacity-50 disabled:pointer-events-none rounded-xl text-xs font-black tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            {isExporting === 'pptx' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} PPTX
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={!!isExporting}
            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white disabled:opacity-50 disabled:pointer-events-none rounded-xl text-xs font-black tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            {isExporting === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} PDF
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: Slides List */}
        <aside className="w-64 border-r border-white/5 bg-[#090c14] flex flex-col shrink-0 z-20">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-slate-500 font-mono uppercase">PRESENTATION MATRIX</span>
            <span className="text-[10px] text-blue-400 bg-blue-500/10 font-mono px-2 py-0.5 rounded-full font-bold">{slides.length} SLIDES</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {slides.map((s, index) => {
              const isActive = index === activeSlideIndex;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSlideIndex(index);
                    setSelectedElementId(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
                      : 'hover:bg-white/5 border border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold opacity-40">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-black tracking-wide uppercase truncate">
                      {s.name}
                    </span>
                  </div>
                  {/* Per-slide controls: show on hover or when active */}
                  <div className={`flex items-center gap-0.5 shrink-0 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition`}>
                    <button
                      title="Move up"
                      onClick={(e) => { e.stopPropagation(); handleMoveSlide(index, 'up'); }}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none text-slate-400 hover:text-white cursor-pointer"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      title="Move down"
                      onClick={(e) => { e.stopPropagation(); handleMoveSlide(index, 'down'); }}
                      disabled={index === slides.length - 1}
                      className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none text-slate-400 hover:text-white cursor-pointer"
                    >
                      <ChevronDown size={13} />
                    </button>
                    <button
                      title="Delete slide"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSlide(index); }}
                      className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Add new slide */}
          <div className="p-3 border-t border-white/5">
            <button
              onClick={handleAddSlide}
              className="w-full py-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus size={14} /> Add Slide
            </button>
          </div>
        </aside>

        {/* MIDDLE STAGE: Canvas Viewport */}
        <main className="flex-1 bg-[#05070d] p-6 overflow-y-auto flex flex-col items-center justify-start z-10 space-y-4">
          <div className="w-full max-w-[1280px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">CANVAS INTERACTION: CLICK TO SELECT AND DIRECTLY EDIT</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (activeSlideIndex > 0) {
                    setActiveSlideIndex(activeSlideIndex - 1);
                    setSelectedElementId(null);
                  }
                }}
                disabled={activeSlideIndex === 0}
                className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-mono font-bold px-3 text-slate-400">
                {activeSlideIndex + 1} / {slides.length}
              </span>
              <button
                onClick={() => {
                  if (activeSlideIndex < slides.length - 1) {
                    setActiveSlideIndex(activeSlideIndex + 1);
                    setSelectedElementId(null);
                  }
                }}
                disabled={activeSlideIndex === slides.length - 1}
                className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="w-full max-w-[1280px] relative">
            <div
              style={{ height: `${CANVAS_H * canvasScale}px` }}
              className="w-full overflow-hidden rounded-2xl shadow-2xl border border-white/5 transition-all relative"
            >
              <div
                ref={canvasRef}
                style={{
                  width: `${CANVAS_W}px`,
                  height: `${CANVAS_H}px`,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: 'top left',
                  background: activeSlide?.bg || activeTheme.bg,
                  backgroundImage: activeSlide?.bgGradient || activeTheme.gradient,
                }}
                className="absolute inset-0 select-none overflow-hidden"
              >
                {/* Elements loop inside 1280x720 */}
                {activeSlide?.elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map((el) => {
                  const isSelected = el.id === selectedElementId;
                  const commonStyle: CSSProperties = {
                    position: 'absolute',
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.w}px`,
                    height: `${el.h}px`,
                    zIndex: el.zIndex || 5,
                    opacity: el.opacity !== undefined ? el.opacity : 1,
                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                    cursor: 'pointer',
                  };

                  if (el.type === 'text' || (el.type as string) === 'title') {
                    const textEl = el as TextElement;
                    return (
                      <div
                        key={el.id}
                        style={{ ...commonStyle, overflow: 'hidden' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(el.id);
                        }}
                        className={`p-1.5 rounded transition ${
                          isSelected ? 'outline-2 outline-dashed outline-blue-500/60 bg-blue-500/5' : 'hover:outline-1 hover:outline-dashed hover:outline-white/20'
                        }`}
                      >
                        <div
                          style={{
                            fontFamily: textEl.fontFamily || activeTheme.fontBody,
                            fontSize: `${textEl.fontSize || 16}px`,
                            fontWeight: textEl.fontWeight || 400,
                            color: textEl.color || activeTheme.text,
                            textAlign: textEl.align || 'left',
                            fontStyle: textEl.fontStyle || 'normal',
                            textDecoration: textEl.textDecoration || 'none',
                            lineHeight: textEl.lineHeight || 1.4,
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                          }}
                          className="whitespace-pre-wrap select-text cursor-text"
                        >
                          {textEl.content}
                        </div>
                      </div>
                    );
                  }

                  if (el.type === 'kpi') {
                    const kpiEl = el as KPIElement;
                    return (
                      <div
                        key={el.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(el.id);
                        }}
                        className={`rounded-xl transition p-4 border flex flex-col justify-between ${
                          isSelected ? 'outline-2 outline-dashed outline-blue-500/60 bg-blue-500/5' : 'hover:outline-1 hover:outline-dashed hover:outline-white/20'
                        }`}
                        style={{
                          ...commonStyle,
                          backgroundColor: kpiEl.bg || activeTheme.surfaceStrong,
                          borderColor: 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontFamily: activeTheme.fontMono,
                              fontSize: '9px',
                              fontWeight: '900',
                              color: activeTheme.text,
                              opacity: 0.35,
                              letterSpacing: '1px',
                            }}
                          >
                            {kpiEl.label.toUpperCase()}
                          </span>
                          <div
                            style={{
                              fontFamily: activeTheme.fontDisplay,
                              fontSize: `${fitKpiFontSize(String(kpiEl.value ?? ''), kpiEl.w)}px`,
                              fontWeight: activeTheme.headlineWeight,
                              color: activeTheme.accent,
                              marginTop: '2px',
                              lineHeight: 1.05,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {kpiEl.value}
                          </div>
                        </div>
                        {kpiEl.sublabel && (
                          <div
                            style={{
                              fontFamily: activeTheme.fontBody,
                              fontSize: '11px',
                              color: activeTheme.text,
                              opacity: 0.5,
                              lineHeight: 1.2,
                              marginTop: '4px',
                            }}
                          >
                            {kpiEl.sublabel}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (el.type === 'shape') {
                    const shEl = el as ShapeElement;
                    return (
                      <div
                        key={el.id}
                        style={commonStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(el.id);
                        }}
                        className={`transition ${
                          isSelected ? 'outline-2 outline-dashed outline-blue-500/60' : 'hover:outline-1 hover:outline-dashed hover:outline-white/20'
                        }`}
                      >
                        {shEl.shape === 'line' ? (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: shEl.fill || activeTheme.accent,
                              borderRadius: '999px',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: shEl.fill || activeTheme.surfaceStrong,
                              borderRadius: shEl.shape === 'circle' ? '999px' : `${shEl.borderRadius || 0}px`,
                              border: shEl.strokeWidth ? `${shEl.strokeWidth}px solid ${shEl.stroke || 'transparent'}` : undefined,
                            }}
                          />
                        )}
                      </div>
                    );
                  }

                  if (el.type === 'image') {
                    const imgEl = el as ImageElement;
                    return (
                      <div
                        key={el.id}
                        style={commonStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(el.id);
                        }}
                        className={`overflow-hidden transition ${
                          isSelected ? 'outline-2 outline-dashed outline-blue-500/60' : 'hover:outline-1 hover:outline-dashed hover:outline-white/20'
                        }`}
                      >
                        <img
                          src={imgEl.src}
                          alt=""
                          draggable={false}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: imgEl.objectFit || 'cover',
                            borderRadius: `${imgEl.borderRadius || 0}px`,
                            display: 'block',
                          }}
                        />
                      </div>
                    );
                  }

                  if (el.type === 'mockup') {
                    const mockEl = el as MockupElement;
                    return (
                      <div
                        key={el.id}
                        style={commonStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(el.id);
                        }}
                        className={`rounded-2xl overflow-hidden shadow-2xl transition border border-white/5 ${
                          isSelected ? 'outline-2 outline-dashed outline-blue-500/60 bg-blue-500/5' : 'hover:outline-1 hover:outline-dashed hover:outline-white/20'
                        }`}
                      >
                        <MockupSVG
                          industry={mockEl.industry}
                          accent={mockEl.accent}
                          bg={mockEl.bg}
                          text={mockEl.textColor}
                          name={mockEl.startupName}
                        />
                      </div>
                    );
                  }

                  if (el.type === 'chart') {
                    const chartEl = el as ChartElement;
                    return (
                      <div
                        key={el.id}
                        style={commonStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(el.id);
                        }}
                        className={`rounded-2xl transition overflow-hidden ${
                          isSelected ? 'outline-2 outline-dashed outline-blue-500/60 bg-blue-500/5' : 'hover:outline-1 hover:outline-dashed hover:outline-white/20'
                        }`}
                      >
                        <ChartRenderer el={chartEl} />
                      </div>
                    );
                  }

                  if (el.type === 'team') {
                    const teamEl = el as TeamCardElement;
                    return (
                      <div
                        key={el.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(el.id);
                        }}
                        className={`rounded-2xl overflow-hidden border border-white/5 p-4 flex flex-col justify-between transition ${
                          isSelected ? 'outline-2 outline-dashed outline-blue-500/60 bg-blue-500/5' : 'hover:outline-1 hover:outline-dashed hover:outline-white/20'
                        }`}
                        style={{
                          ...commonStyle,
                          backgroundColor: teamEl.bg || activeTheme.surface,
                        }}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '999px',
                              backgroundColor: activeTheme.surfaceStrong,
                              border: `2px solid ${activeTheme.accent}33`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: activeTheme.fontDisplay,
                              fontWeight: '900',
                              fontSize: '22px',
                              color: activeTheme.accent,
                              marginBottom: '12px',
                            }}
                          >
                            {teamEl.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div
                            style={{
                              fontFamily: activeTheme.fontDisplay,
                              fontSize: '15px',
                              fontWeight: '800',
                              color: activeTheme.text,
                            }}
                          >
                            {teamEl.name}
                          </div>
                          <div
                            style={{
                              fontFamily: activeTheme.fontMono,
                              fontSize: '9px',
                              fontWeight: '700',
                              color: activeTheme.accent,
                              marginTop: '2px',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                            }}
                          >
                            {teamEl.role}
                          </div>
                        </div>

                        <div className="mt-4 flex-1 flex flex-col justify-end space-y-2">
                          <div className="bg-white/2 p-2 rounded-lg text-[10px] font-mono text-center">
                            <span className="opacity-40">EXP:</span>{' '}
                            <span className="font-bold text-slate-300">
                              {teamEl.yearsExp || '10+ Years'}
                            </span>
                          </div>
                          <div className="bg-[#10b981]/5 p-2 rounded-lg text-[10px] font-mono text-center text-[#10b981]">
                            {teamEl.achievement || 'Expertise Validated'}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR: Editor & Investor Coach feedback */}
        <aside className="w-80 border-l border-white/5 bg-[#090c14] flex flex-col shrink-0 z-20">
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* ADD ELEMENTS TOOLBAR */}
            <div className="p-4 border-b border-white/5">
              <span className="text-[10px] font-black tracking-widest text-slate-500 font-mono uppercase">Add to slide</span>
              <div className="grid grid-cols-5 gap-2 mt-3">
                <button onClick={handleAddText} title="Add text"
                  className="py-2.5 bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 rounded-lg flex items-center justify-center transition cursor-pointer">
                  <Type size={16} />
                </button>
                <button onClick={() => handleAddShape('rect')} title="Add rectangle"
                  className="py-2.5 bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 rounded-lg flex items-center justify-center transition cursor-pointer">
                  <Square size={16} />
                </button>
                <button onClick={() => handleAddShape('circle')} title="Add circle"
                  className="py-2.5 bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 rounded-lg flex items-center justify-center transition cursor-pointer">
                  <span className="w-4 h-4 rounded-full border-2 border-current" />
                </button>
                <button onClick={() => handleAddShape('line')} title="Add line"
                  className="py-2.5 bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 rounded-lg flex items-center justify-center transition cursor-pointer">
                  <span className="w-4 h-0.5 bg-current" />
                </button>
                <button onClick={() => imageInputRef.current?.click()} title="Add image" disabled={isUploadingImage}
                  className="py-2.5 bg-white/5 hover:bg-blue-500/20 text-slate-300 hover:text-blue-300 disabled:opacity-50 rounded-lg flex items-center justify-center transition cursor-pointer">
                  {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                </button>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </div>

            {/* ELEMENT INSPECTOR */}
            <div className="p-4 border-b border-white/5">
              <span className="text-[10px] font-black tracking-widest text-slate-500 font-mono uppercase">ELEMENT INSPECTOR</span>
              
              {selectedElement ? (
                <div className="mt-4 space-y-4">
                  {/* TEXT EDIT */}
                  {(selectedElement.type === 'text' || (selectedElement.type as string) === 'title') && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">EDIT CONTENT</label>
                        <textarea
                          value={(selectedElement as TextElement).content}
                          onChange={(e) => handleElementContentChange(e.target.value)}
                          className="w-full mt-1.5 p-3 bg-white/5 border border-white/5 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50 resize-y min-h-[100px]"
                        />
                      </div>

                      {/* TEXT OPTIONS */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">FONT SIZE</label>
                          <input
                            type="number"
                            value={(selectedElement as TextElement).fontSize || 16}
                            onChange={(e) => handleElementStyleChange('fontSize', Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">FONT WEIGHT</label>
                          <select
                            value={(selectedElement as TextElement).fontWeight || 400}
                            onChange={(e) => handleElementStyleChange('fontWeight', Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                          >
                            <option value={400}>Regular</option>
                            <option value={500}>Medium</option>
                            <option value={600}>SemiBold</option>
                            <option value={700}>Bold</option>
                            <option value={800}>ExtraBold</option>
                            <option value={900}>Black</option>
                          </select>
                        </div>
                      </div>

                      {/* FONT FAMILY */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">FONT</label>
                        <select
                          value={(selectedElement as TextElement).fontFamily || activeTheme.fontBody}
                          onChange={(e) => handleElementStyleChange('fontFamily', e.target.value)}
                          className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                        >
                          <option value="'Inter', sans-serif">Inter (Sans)</option>
                          <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                          <option value="'Helvetica Neue','Arial',sans-serif">Helvetica</option>
                          <option value="'Georgia','Times New Roman',serif">Georgia (Serif)</option>
                          <option value="'Playfair Display','Georgia',serif">Playfair (Display Serif)</option>
                          <option value="'Courier New',monospace">Courier (Mono)</option>
                          <option value="'JetBrains Mono','Fira Mono',monospace">JetBrains Mono</option>
                        </select>
                      </div>

                      {/* TEXT ALIGN */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">ALIGNMENT</label>
                        <div className="flex items-center gap-1 mt-1.5 bg-white/5 p-1 rounded-lg">
                          {(['left', 'center', 'right'] as const).map((align) => {
                            const isAct = (selectedElement as TextElement).align === align;
                            return (
                              <button
                                key={align}
                                onClick={() => handleElementStyleChange('align', align)}
                                className={`flex-1 py-1.5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-200 transition cursor-pointer ${
                                  isAct ? 'bg-white/10 text-white font-bold' : ''
                                }`}
                              >
                                {align === 'left' && <AlignLeft size={13} />}
                                {align === 'center' && <AlignCenter size={13} />}
                                {align === 'right' && <AlignRight size={13} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* TEXT COLOR DOTS */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">COLOR ACCENT</label>
                        <div className="flex items-center gap-2 mt-1.5">
                          {[activeTheme.text, activeTheme.accent, '#f43f5e', '#10b981', '#fbbf24'].map((col) => {
                            const isSel = (selectedElement as TextElement).color === col;
                            return (
                              <button
                                key={col}
                                onClick={() => handleElementStyleChange('color', col)}
                                style={{ backgroundColor: col }}
                                className={`w-6 h-6 rounded-full border border-white/10 relative transition hover:scale-105 cursor-pointer`}
                              >
                                {isSel && (
                                  <div className="absolute inset-0 flex items-center justify-center text-slate-950 font-bold text-[10px]">
                                    ✓
                                  </div>
                                )}
                              </button>
                            );
                          })}
                          {/* Custom color */}
                          <label className="w-6 h-6 rounded-full border border-white/20 overflow-hidden cursor-pointer relative" title="Custom color">
                            <input
                              type="color"
                              value={(selectedElement as TextElement).color || '#ffffff'}
                              onChange={(e) => handleElementStyleChange('color', e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-300 bg-gradient-to-br from-rose-500 via-emerald-500 to-blue-500">+</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SHAPE STYLE */}
                  {selectedElement.type === 'shape' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Fill Color</label>
                        <div className="flex items-center gap-2 mt-1.5">
                          {[activeTheme.accent, activeTheme.text, '#f43f5e', '#10b981', '#fbbf24'].map((col) => (
                            <button
                              key={col}
                              onClick={() => handleElementStyleChange('fill', col)}
                              style={{ backgroundColor: col }}
                              className="w-6 h-6 rounded-full border border-white/10 transition hover:scale-105 cursor-pointer"
                            />
                          ))}
                          <label className="w-6 h-6 rounded-full border border-white/20 overflow-hidden cursor-pointer relative" title="Custom fill">
                            <input
                              type="color"
                              value={(selectedElement as ShapeElement).fill || '#ffffff'}
                              onChange={(e) => handleElementStyleChange('fill', e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-300 bg-gradient-to-br from-rose-500 via-emerald-500 to-blue-500">+</span>
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Width</label>
                          <input type="number"
                            value={Math.round((selectedElement as ShapeElement).w)}
                            onChange={(e) => handleElementStyleChange('w', Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Height</label>
                          <input type="number"
                            value={Math.round((selectedElement as ShapeElement).h)}
                            onChange={(e) => handleElementStyleChange('h', Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">X</label>
                          <input type="number"
                            value={Math.round((selectedElement as ShapeElement).x)}
                            onChange={(e) => handleElementStyleChange('x', Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Y</label>
                          <input type="number"
                            value={Math.round((selectedElement as ShapeElement).y)}
                            onChange={(e) => handleElementStyleChange('y', Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IMAGE STYLE */}
                  {selectedElement.type === 'image' && (
                    <div className="space-y-3">
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="w-full py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white disabled:opacity-50 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        {isUploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} REPLACE IMAGE
                      </button>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">FIT</label>
                        <select
                          value={(selectedElement as ImageElement).objectFit || 'cover'}
                          onChange={(e) => handleElementStyleChange('objectFit', e.target.value)}
                          className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                        >
                          <option value="cover">Cover (fill, may crop)</option>
                          <option value="contain">Contain (fit, no crop)</option>
                          <option value="fill">Stretch</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">CORNER RADIUS</label>
                        <input type="number"
                          value={Math.round((selectedElement as ImageElement).borderRadius || 0)}
                          onChange={(e) => handleElementStyleChange('borderRadius', Number(e.target.value))}
                          className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Width</label>
                          <input type="number"
                            value={Math.round((selectedElement as ImageElement).w)}
                            onChange={(e) => handleElementStyleChange('w', Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Height</label>
                          <input type="number"
                            value={Math.round((selectedElement as ImageElement).h)}
                            onChange={(e) => handleElementStyleChange('h', Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">X</label>
                          <input type="number"
                            value={Math.round((selectedElement as ImageElement).x)}
                            onChange={(e) => handleElementStyleChange('x', Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">Y</label>
                          <input type="number"
                            value={Math.round((selectedElement as ImageElement).y)}
                            onChange={(e) => handleElementStyleChange('y', Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LAYER & DELETE */}
                  <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleElementLayerChange('front')}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        BRING FRONT
                      </button>
                      <button
                        onClick={() => handleElementLayerChange('back')}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        SEND BACK
                      </button>
                    </div>
                    <button
                      onClick={handleDeleteElement}
                      className="w-full py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 size={13} /> REMOVE ELEMENT
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-3 font-mono leading-relaxed">
                  Select any visual element or text block on the presentation board to customize its properties.
                </p>
              )}
            </div>

            {/* INVESTOR COACH ADVICE */}
            <div className="p-4 flex-1">
              <span className="text-[10px] font-black tracking-widest text-slate-500 font-mono uppercase">INVESTOR READY COACH</span>
              <div className="mt-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Play size={14} className="text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-widest">
                      SLIDE STRATEGY TIP
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">
                      {getCoachAdvice()}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono font-bold text-slate-500">
                  <span>DECISIONLAB v3.0</span>
                  <span className="text-emerald-400">● SCORE VALIDATED</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Hidden export layout rendering target block container */}
      <div id="pitch-deck-export-container" className="fixed top-[-9999px] left-[-9999px] w-[1280px] h-[720px] pointer-events-none select-none overflow-hidden bg-[#070a13]" style={{ transform: 'none' }}>
        {slides.map((s, sIdx) => (
          <div
            key={s.id}
            id={`pitch-slide-${sIdx}`}
            style={{
              width: '1280px',
              height: '720px',
              position: 'relative',
              overflow: 'hidden',
              background: s.bg || activeTheme.bg,
              backgroundImage: s.bgGradient || activeTheme.gradient,
            }}
          >
            {s.elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map((el) => {
              const style: CSSProperties = {
                position: 'absolute',
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.w}px`,
                height: `${el.h}px`,
                zIndex: el.zIndex || 5,
                opacity: el.opacity !== undefined ? el.opacity : 1,
              };

              if (el.type === 'text' || (el.type as string) === 'title') {
                const textEl = el as TextElement;
                return (
                  <div
                    key={el.id}
                    style={{
                      ...style,
                      fontFamily: textEl.fontFamily || activeTheme.fontBody,
                      fontSize: `${textEl.fontSize || 16}px`,
                      fontWeight: textEl.fontWeight || 400,
                      color: textEl.color || activeTheme.text,
                      textAlign: textEl.align || 'left',
                      fontStyle: textEl.fontStyle || 'normal',
                      textDecoration: textEl.textDecoration || 'none',
                      lineHeight: textEl.lineHeight || 1.4,
                      padding: '6px',
                    }}
                  >
                    {textEl.content}
                  </div>
                );
              }

              if (el.type === 'kpi') {
                const kpiEl = el as KPIElement;
                return (
                  <div
                    key={el.id}
                    style={{
                      ...style,
                      backgroundColor: kpiEl.bg || activeTheme.surfaceStrong,
                      borderColor: 'rgba(255,255,255,0.04)',
                      borderWidth: '1px',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: activeTheme.fontMono, fontSize: '9px', fontWeight: '900', color: activeTheme.text, opacity: 0.35, letterSpacing: '1px' }}>
                        {kpiEl.label.toUpperCase()}
                      </span>
                      <div style={{ fontFamily: activeTheme.fontDisplay, fontSize: `${fitKpiFontSize(String(kpiEl.value ?? ''), kpiEl.w)}px`, fontWeight: activeTheme.headlineWeight, color: activeTheme.accent, marginTop: '2px', lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {kpiEl.value}
                      </div>
                    </div>
                    {kpiEl.sublabel && (
                      <div style={{ fontFamily: activeTheme.fontBody, fontSize: '11px', color: activeTheme.text, opacity: 0.5, marginTop: '4px' }}>
                        {kpiEl.sublabel}
                      </div>
                    )}
                  </div>
                );
              }

              if (el.type === 'shape') {
                const shEl = el as ShapeElement;
                return (
                  <div key={el.id} style={style}>
                    {shEl.shape === 'line' ? (
                      <div style={{ width: '100%', height: '100%', backgroundColor: shEl.fill || activeTheme.accent, borderRadius: '999px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', backgroundColor: shEl.fill || activeTheme.surfaceStrong, borderRadius: shEl.shape === 'circle' ? '999px' : `${shEl.borderRadius || 0}px`, border: shEl.strokeWidth ? `${shEl.strokeWidth}px solid ${shEl.stroke || 'transparent'}` : undefined }} />
                    )}
                  </div>
                );
              }

              if (el.type === 'image') {
                const imgEl = el as ImageElement;
                return (
                  <div key={el.id} style={{ ...style, overflow: 'hidden', borderRadius: `${imgEl.borderRadius || 0}px` }}>
                    <img
                      src={imgEl.src}
                      alt=""
                      crossOrigin="anonymous"
                      style={{ width: '100%', height: '100%', objectFit: imgEl.objectFit || 'cover', display: 'block' }}
                    />
                  </div>
                );
              }

              if (el.type === 'mockup') {
                const mockEl = el as MockupElement;
                return (
                  <div key={el.id} style={{ ...style, borderRadius: '16px', overflow: 'hidden' }}>
                    <MockupSVG
                      industry={mockEl.industry}
                      accent={mockEl.accent}
                      bg={mockEl.bg}
                      text={mockEl.textColor}
                      name={mockEl.startupName}
                    />
                  </div>
                );
              }

              if (el.type === 'chart') {
                const chartEl = el as ChartElement;
                return (
                  <div key={el.id} style={{ ...style, borderRadius: '16px', overflow: 'hidden' }}>
                    <ChartRenderer el={chartEl} />
                  </div>
                );
              }

              if (el.type === 'team') {
                const teamEl = el as TeamCardElement;
                return (
                  <div
                    key={el.id}
                    style={{
                      ...style,
                      backgroundColor: teamEl.bg || activeTheme.surface,
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div style={{ width: '64px', height: '64px', borderRadius: '999px', backgroundColor: activeTheme.surfaceStrong, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: activeTheme.fontDisplay, fontWeight: '900', fontSize: '22px', color: activeTheme.accent, marginBottom: '12px' }}>
                        {teamEl.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ fontFamily: activeTheme.fontDisplay, fontSize: '15px', fontWeight: '800', color: activeTheme.text }}>
                        {teamEl.name}
                      </div>
                      <div style={{ fontFamily: activeTheme.fontMono, fontSize: '9px', fontWeight: '700', color: activeTheme.accent, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {teamEl.role}
                      </div>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace', textAlign: 'center' }}>
                        <span style={{ opacity: 0.4 }}>EXP:</span>{' '}
                        <span style={{ fontWeight: 'bold', color: '#cbd5e1' }}>{teamEl.yearsExp || '10+ Years'}</span>
                      </div>
                      <div style={{ backgroundColor: 'rgba(16,185,129,0.05)', padding: '8px', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace', textAlign: 'center', color: '#10b981' }}>
                        {teamEl.achievement || 'Expertise Validated'}
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}