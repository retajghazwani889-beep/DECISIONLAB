// Shared deck design systems — extracted verbatim from the Pitch Deck Architect
// so the investor SlideCanvas renders a submitted deck with the same theme
// (colors, gradients, fonts) the founder selected.

export interface DeckTheme {
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

export const THEMES: Record<string, DeckTheme> = {

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

export function resolveTheme(nameOrKey?: string): DeckTheme {
  if (!nameOrKey) return THEMES.siliconValley;
  if ((THEMES as any)[nameOrKey]) return (THEMES as any)[nameOrKey];
  const byName = Object.values(THEMES).find((t: any) => t.name === nameOrKey);
  return (byName as DeckTheme) || THEMES.siliconValley;
}