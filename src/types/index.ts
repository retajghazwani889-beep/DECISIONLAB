export type SubscriptionTier = 'free' | 'founder' | 'growth' | 'premium';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string[];
  experience: number;
  background: string;
  linkedin?: string;
}

export interface UserProfile {
  uid: string;
  userId?: string;
  email: string;
  displayName: string | null;
  fullName?: string;
  photoURL: string | null;
  roleType?: 'Founder' | 'Investor' | 'Operator' | 'Analyst' | 'Builder' | 'Student';
  onboardingCompleted?: boolean;
  subscriptionStatus: SubscriptionTier;
  companyName?: string;
  startupName?: string;
  companyLogo?: string;
  companyDescription?: string;
  industry?: string;
  sectors?: string[];
  location?: string;
  businessType?: string;
  productType?: string;
  startupStage?: string;
  pitchSummary?: string;
  pitchDeckUrl?: string;
  pitchDeck?: PitchDeck;
  founderInfo?: string;
  teamMembers?: string;
  roleDescription?: string;
  teamStructure?: TeamMember[];
  companyAnalysis?: CompanyAnalysis;
  createdAt: any;
  updatedAt?: any;
}

export interface CompanyHealthScore {
  score: number;
  explanation: string;
}

export interface RiskFactor {
  explanation: string;
  note?: string;
  severity: 'Low' | 'Medium' | 'High';
  impact: number;
  likelihood: number;
  mitigation?: string;
}

export interface CompanyAnalysis {
  summary: string;
  scores: {
    ideaStrength: CompanyHealthScore;
    marketFit: CompanyHealthScore;
    execution: CompanyHealthScore;
    investorAppeal: CompanyHealthScore;
    scalability: CompanyHealthScore;
    competition: CompanyHealthScore;
  };
  keyInsights: string[];
  funding: {
    stage: string;
    readinessScore: number;
    gaps: string[];
    verdict: string;
  };
  investors: InvestorMatch[];
  traction: {
    analysis: string;
    nextSteps: string[];
    potential: string;
  };
  risks?: {
    market: RiskFactor;
    execution: RiskFactor;
    competitive?: RiskFactor;
    competition?: RiskFactor;
    financial: RiskFactor;
  };
  riskMatrix?: {
    market: RiskFactor;
    execution: RiskFactor;
    competition: RiskFactor;
    financial: RiskFactor;
  };
  businessPlan: {
    immediate: string;
    shortTerm: string;
    growthPhase: string;
    investorReadinessPlan: string;
  };
  finalVerdict: {
    status: 'Strong Investment Opportunity' | 'Moderate Potential' | 'High Risk' | 'Needs Pivot' | 'Not Investor Ready';
    description: string;
  };
  investorReadinessRouting: 'Not ready for VC' | 'Start with angels' | 'Apply to accelerators' | 'VC-ready';
  topInvestorTakeaway: string;
  generatedAt: any;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'chart' | 'metric' | 'title' | 'point' | 'table';
  content: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  rotation?: number;
  zIndex: number;
}

export interface PitchDeckSlide {
  id: string;
  title: string;
  content: string;
  points: string[];
  metric?: {
    label?: string;
    value: string;
  };
  visualType?: 'chart' | 'data' | 'image' | 'text';
  visualSuggestion?: string;
  imageKeywords?: string;
  imageUrl?: string;
  colorAccent?: string;
  layout?: 'split' | 'centered' | 'grid' | 'hero';
  layoutType?: string;
  elements?: SlideElement[];
}

// UPDATED: replaced the old 6 theme names with the 10 new ones
// that match DECK_THEMES in constants/deckThemes.ts
export type PitchDeckTemplate =
  | 'Silicon Valley VC'
  | 'Startup Minimal'
  | 'Corporate Executive'
  | 'Fintech Modern'
  | 'Healthcare Innovation'
  | 'Cybersecurity Command'
  | 'Luxury Investor'
  | 'Dark Investor'
  | 'Bright Modern'
  | 'DecisionLab Signature';

export interface PitchDeck {
  id: string;
  userId?: string;
  linkedAnalysisId?: string;
  projectName?: string;
  title?: string;
  slides: PitchDeckSlide[];
  template?: PitchDeckTemplate;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    mode: 'dark' | 'light';
    borderRadius: string;
    shadow: string;
    headerWeight: string;
    backgroundGradient: string;
  };
  generatedAt?: any;
  updatedAt?: any;
}

export interface AnalysisScores {
  overall?: number;
  ideaStrength: number | { score: number; explanation?: string };
  marketFit: number | { score: number; explanation?: string };
  execution: number | { score: number; explanation?: string };
  scalability: number | { score: number; explanation?: string };
  competition: number | { score: number; explanation?: string };
  investorAppeal: number | { score: number; explanation?: string };
}

export interface RiskEntry {
  impact: number;
  likelihood: number;
  note: string;
}

export interface RiskMatrix {
  market: RiskEntry;
  execution: RiskEntry;
  competition: RiskEntry;
  financial: RiskEntry;
}

export interface StrategicRoadmap {
  immediate: string[];
  oneToThreeMonths: string[];
  threeToSixMonths: string[];
  investorReadiness: string[];
}

export interface MarketAnalysis {
  overview: string;
  sizeEstimate: string;
  growthTrends: string;
  demandSignals: string;
}

export interface CompetitorAnalysis {
  mainCompetitors: string[];
  saturationLevel: string;
  marketGaps: string;
  competitiveAdvantages: string;
}

export interface RiskAnalysis {
  financial: string;
  execution: string;
  market: string;
  competition: string;
  failureProbability: string;
}

export interface GrowthPotential {
  scaling: string;
  revenue: string;
  revenueModel: string;
  investorAttractiveness: string;
}

export interface PitchReadiness {
  improvementSuggestions: string[];
  weaknessDetection: string[];
  readinessScore: number;
  suggestedStructure: string[];
  storyRefinement: string;
}

export interface RoadmapStep {
  step: string;
  description: string;
  timeframe: string;
}

export interface IntelligenceMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: any;
  modules?: any[];
}

export interface IntelligenceSession {
  sessionId: string;
  userId: string;
  title: string;
  messages: IntelligenceMessage[];
  createdAt: any;
  updatedAt: any;
}

export interface InvestorMatch {
  name: string;
  type: string;
  stage: string;
  focus: string;
  whyFit: string;
  suggestedPitch?: string;
  matchScore?: number;
  whatTheyLookFor?: string;
}

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AnalysisReport {
  id: string;
  userId: string;
  projectName?: string;
  ideaDescription: string;
  status: AnalysisStatus;
  scores?: AnalysisScores;
  marketAnalysis?: MarketAnalysis;
  competitorAnalysis?: CompetitorAnalysis;
  riskMatrix?: any;
  risks?: any;
  keyInsights?: string[];
  growthPotential?: GrowthPotential;
  pitchReadiness?: any;
  roadmap?: StrategicRoadmap;
  investorMatching?: InvestorMatch[];
  topInvestorTakeaway?: string;
  finalVerdict?: {
    status: 'Strong Investment Opportunity' | 'Moderate Potential' | 'High Risk' | 'Needs Pivot' | 'Not Investor Ready';
    description: string;
  };
  startupProfile?: {
    companyName: string;
    country: string;
    city: string;
    stage: string;
    industry: string;
    detailedSector: string;
    businessType: string;
    productType: string;
    elevatorPitch: string;
    businessDescription: string;
    founderBackground: string;
    teamSize: string;
    logo?: string;
  };
  createdAt: any;
  updatedAt?: any;
}