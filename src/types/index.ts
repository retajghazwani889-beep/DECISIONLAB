// Central TypeScript Interfaces

export interface UserProfile {
  uid?: string;
  userId?: string;
  fullName?: string;
  displayName?: string;
  email?: string;
  photoURL?: string | null;
  subscriptionStatus?: string;
  startupName?: string;
  roleType?: string;
  accountType?: string;
  onboardingCompleted?: boolean;
  companyName?: string;
  industry?: string;
  stage?: string;
  country?: string;
  city?: string;
  businessType?: any;
  businessDescription?: string;
  elevatorPitch?: string;
  founderBackground?: string;
  teamSize?: string;
  productType?: any;
  fundingStage?: string;
  createdAt?: any;
  updatedAt?: any;

  // Additional dashboard profile fields
  founderInfo?: any;
  teamMembers?: any;
  location?: any;
  pitchDeckUrl?: any;
  sectors?: any;
  teamStructure?: any;
  companyLogo?: any;
  companyDescription?: any;
  startupStage?: any;
  pitchSummary?: any;
  pitchDeck?: any;
  companyAnalysis?: any;
}

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DLFounder {
  name: string;
  role: string;
  background: string;
  photo?: string;
  linkedin?: string;
  previousCompany?: string;
  previousRole?: string;
  yearsExp?: string;
  achievement?: string;
  isPlaceholder?: boolean;
}

export interface DLCompetitor {
  name: string;
  weakness: string;
  ourEdge: string;
}

export interface SlideElement {
  id: string;
  type: string;
  content?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize?: number;
  fontWeight?: any;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  align?: 'left' | 'center' | 'right' | 'justify';
  zIndex?: number;
  accent?: string;
  [key: string]: any;
}

export interface PitchDeckSlide {
  id: string;
  title: string;
  content: string;
  layout?: string;
  points?: string[];
  metric?: { label: string; value: string };
  visualSuggestion?: string;
  imageKeywords?: string;
  imageUrl?: string;
  colorAccent?: string;
  elements?: SlideElement[];
  [key: string]: any;
}

export interface PitchDeck {
  id?: string;
  template?: string;
  slides: PitchDeckSlide[];
  [key: string]: any;
}

export interface PitchDeckTemplate {
  id: string;
  name: string;
  label: string;
  bg: string;
  accent: string;
  text: string;
  muted: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  gradient?: string;
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  headlineWeight: number;
  headlineCase: string;
  headlineTracking: number;
  cardRadius: number;
  cardBorder: boolean;
  cardShadow: boolean;
  tagStyle: string;
  splitRatio: number;
  headerStrip: boolean;
  accentBarWidth: number;
  chartStyle: string;
  chartFontFamily: string;
  [key: string]: any;
}

export interface AnalysisReport {
  id: string;
  userId: string;
  projectName?: string;
  startupName?: string;
  tagline?: string;
  vision?: string;
  industry?: string;
  country?: string;
  stage?: string;
  overallScore?: number;
  investorReadinessScore?: number;
  marketFitScore?: number;
  scalabilityScore?: number;
  executionScore?: number;
  founders?: DLFounder[];
  problemStatement?: string;
  problemInsights?: string[];
  solutionStatement?: string;
  solutionInsights?: string[];
  uniqueValueProp?: string;
  productFeatures?: string[];
  productScreenshots?: string[];
  marketSizing?: {
    tam?: string;
    sam?: string;
    som?: string;
    growthRate?: string;
    overview?: string;
  };
  targetSegments?: string[];
  revenueStreams?: string[];
  pricingModel?: string;
  competitors?: DLCompetitor[];
  competitiveAdvantages?: string[];
  tractionPoints?: string[];
  gtmStrategy?: string[];
  growthTimeline?: string[];
  fundingAsk?: string;
  fundingUse?: string[];
  revenueProjections?: Array<{ year: string; value: string }>;
  uploadedAssets?: string[];
  finalVerdict?: any;
  investorTakeaway?: string;
  
  // Custom properties used in the code
  status?: AnalysisStatus;
  ideaDescription?: string;
  scores?: any;
  marketAnalysis?: {
    sizeEstimate?: string;
    demandSignals?: string;
    growthTrends?: string;
    overview?: string;
  };
  competitorAnalysis?: {
    saturationLevel?: string;
    marketGaps?: string;
    competitiveAdvantages?: string;
  };
  keyInsights?: string[];
  swot?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
  };
  startupProfile?: any;
  investorMatching?: any[];
  sharedWithInvestors?: boolean | string[];
  shareScore?: number;
  shareStage?: string;
  shareFounderName?: string;
  createdAt?: any;
  updatedAt?: any;

  // Extra report properties
  riskMatrix?: any;
  risks?: any;
  topInvestorTakeaway?: any;
  roadmap?: any;
  growthPotential?: any;
  pitchReadiness?: any;
}

export interface IntelligenceMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | any;
  modules?: Array<{
    type: string;
    data: any;
  }>;
}

export interface IntelligenceSession {
  id?: string;
  sessionId?: string;
  userId?: string;
  title?: string;
  messages: IntelligenceMessage[];
  createdAt?: any;
  updatedAt?: any;
}
