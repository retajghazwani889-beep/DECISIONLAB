export interface DeckTheme {
  primaryColor: string;
  accentColor: string;
  text: string;
  borderColor: string;
  font: string;
  borderRadius: string;
  shadow: string;
  headerWeight: string;
  backgroundGradient: string;
}

export const DECK_THEMES: Record<string, DeckTheme> = {
  'Silicon Valley VC': {
    primaryColor: '#0A0E1A',
    accentColor: '#5DA9FF',
    text: '#E8EDF5',
    borderColor: 'rgba(93,169,255,0.15)',
    font: "'Inter', sans-serif",
    borderRadius: '16px',
    shadow: '0 8px 30px rgba(93,169,255,0.08)',
    headerWeight: '900',
    backgroundGradient: 'none'
  },
  'Startup Minimal': {
    primaryColor: '#FFFFFF',
    accentColor: '#171717',
    text: '#262626',
    borderColor: '#E5E5E5',
    font: "'Inter', sans-serif",
    borderRadius: '4px',
    shadow: '0 2px 8px rgba(0,0,0,0.04)',
    headerWeight: '800',
    backgroundGradient: 'none'
  },
  'Corporate Executive': {
    primaryColor: '#F7F8FA',
    accentColor: '#1E3A8A',
    text: '#1F2937',
    borderColor: '#D1D5DB',
    font: "'Inter', sans-serif",
    borderRadius: '6px',
    shadow: '0 4px 12px rgba(30,58,138,0.08)',
    headerWeight: '800',
    backgroundGradient: 'none'
  },
  'Fintech Modern': {
    primaryColor: '#0B1120',
    accentColor: '#22D3EE',
    text: '#E2E8F0',
    borderColor: 'rgba(34,211,238,0.18)',
    font: "'Inter', sans-serif",
    borderRadius: '20px',
    shadow: '0 8px 30px rgba(34,211,238,0.1)',
    headerWeight: '900',
    backgroundGradient: 'linear-gradient(135deg, #0B1120 0%, #111A2E 100%)'
  },
  'Healthcare Innovation': {
    primaryColor: '#F4FBF9',
    accentColor: '#0D9488',
    text: '#134E4A',
    borderColor: '#CCFBF1',
    font: "'Inter', sans-serif",
    borderRadius: '18px',
    shadow: '0 6px 20px rgba(13,148,136,0.08)',
    headerWeight: '800',
    backgroundGradient: 'none'
  },
  'Cybersecurity Command': {
    primaryColor: '#03070C',
    accentColor: '#10B981',
    text: '#94A3B8',
    borderColor: 'rgba(16,185,129,0.2)',
    font: "'JetBrains Mono', monospace",
    borderRadius: '8px',
    shadow: '0 0 24px rgba(16,185,129,0.12)',
    headerWeight: '900',
    backgroundGradient: 'none'
  },
  'Luxury Investor': {
    primaryColor: '#111111',
    accentColor: '#C5A059',
    text: '#F5F0E8',
    borderColor: 'rgba(197,160,89,0.25)',
    font: "'Playfair Display', serif",
    borderRadius: '2px',
    shadow: '0 8px 24px rgba(197,160,89,0.1)',
    headerWeight: '700',
    backgroundGradient: 'none'
  },
  'Dark Investor': {
    primaryColor: '#020617',
    accentColor: '#FBBF24',
    text: '#CBD5E1',
    borderColor: 'rgba(255,255,255,0.1)',
    font: "'Inter', sans-serif",
    borderRadius: '12px',
    shadow: '0 8px 28px rgba(0,0,0,0.4)',
    headerWeight: '900',
    backgroundGradient: 'none'
  },
  'Bright Modern': {
    primaryColor: '#FFFFFF',
    accentColor: '#4F46E5',
    text: '#0F172A',
    borderColor: '#CBD5E1',
    font: "'Inter', sans-serif",
    borderRadius: '24px',
    shadow: '0 8px 24px rgba(79,70,229,0.08)',
    headerWeight: '900',
    backgroundGradient: 'none'
  },
  'DecisionLab Signature': {
    primaryColor: '#08131D',
    accentColor: '#5DA9FF',
    text: '#E8EDF5',
    borderColor: 'rgba(93,169,255,0.12)',
    font: "'Inter', sans-serif",
    borderRadius: '28px',
    shadow: '0 12px 40px rgba(93,169,255,0.1)',
    headerWeight: '900',
    backgroundGradient: 'radial-gradient(circle at 20% 0%, rgba(93,169,255,0.06) 0%, transparent 60%)'
  }
};