import { PitchDeckSlide } from '../types';

const SLIDE_IMAGE_BANK: Record<string, Record<string, string>> = {
  cybersecurity: {
    cover: '1550751827-4bd374c3f58b', team: '1573164713988-8665fc963095',
    problem: '1526374965328-7f61d4dc18c5', solution: '1518770660439-4636190af475',
    product: '1551434678-e076c223a692', market: '1551288049-bebda4e38f71',
    customer: '1573164713988-8665fc963095', business: '1556761175-5973dc0f32e7',
    competition: '1563013544-824ae1b704d3', traction: '1551033406-611cf9a28f67',
    growth: '1460925895917-afdab827c52f', risks: '1563013544-824ae1b704d3',
    invest: '1554224155-6726b3ff858f', roadmap: '1454165804606-c3d57bc86b40',
    closing: '1550751827-4bd374c3f58b',
  },
  food: {
    cover: '1517248135467-4c7edcad34c4', team: '1543007630-9710e4a00a20',
    problem: '1546069901-ba9599a7e63c', solution: '1466637574441-749b8f19452f',
    product: '1565299624946-b28f40a0ae38', market: '1414235077428-338989a2e8c0',
    customer: '1543007630-9710e4a00a20', business: '1559339352-11d035aa65de',
    competition: '1555396273-367ea4eb4db5', traction: '1414235077428-338989a2e8c0',
    growth: '1556742049-0cfed4f6a45d', risks: '1556909114-f6e7ad7d3136',
    invest: '1554224155-6726b3ff858f', roadmap: '1454165804606-c3d57bc86b40',
    closing: '1517248135467-4c7edcad34c4',
  },
  fintech: {
    cover: '1556742049-0cfed4f6a45d', team: '1573164713988-8665fc963095',
    problem: '1563013544-824ae1b704d3', solution: '1559526324-4b87b5e36e44',
    product: '1551288049-bebda4e38f71', market: '1554224155-6726b3ff858f',
    customer: '1573164713988-8665fc963095', business: '1559526324-4b87b5e36e44',
    competition: '1554224155-6726b3ff858f', traction: '1551288049-bebda4e38f71',
    growth: '1460925895917-afdab827c52f', risks: '1563013544-824ae1b704d3',
    invest: '1554224155-6726b3ff858f', roadmap: '1454165804606-c3d57bc86b40',
    closing: '1551288049-bebda4e38f71',
  },
  healthcare: {
    cover: '1576091160550-2173dba999ef', team: '1576765608535-5f04d1e3f289',
    problem: '1551076805-e1869033e561', solution: '1582719478250-c89cae4dc85b',
    product: '1576091160399-112ba8d25d1d', market: '1559757148-5c350d0d3c56',
    customer: '1576765608535-5f04d1e3f289', business: '1576091160550-2173dba999ef',
    competition: '1551076805-e1869033e561', traction: '1576091160399-112ba8d25d1d',
    growth: '1559757148-5c350d0d3c56', risks: '1576765608535-5f04d1e3f289',
    invest: '1554224155-6726b3ff858f', roadmap: '1454165804606-c3d57bc86b40',
    closing: '1576091160550-2173dba999ef',
  },
  general: {
    cover: '1551434678-e076c223a692', team: '1573164713988-8665fc963095',
    problem: '1551434678-e076c223a692', solution: '1556761175-5973dc0f32e7',
    product: '1551288049-bebda4e38f71', market: '1551434678-e076c223a692',
    customer: '1556761175-5973dc0f32e7', business: '1551288049-bebda4e38f71',
    competition: '1551434678-e076c223a692', traction: '1551288049-bebda4e38f71',
    growth: '1460925895917-afdab827c52f', risks: '1551434678-e076c223a692',
    invest: '1554224155-6726b3ff858f', roadmap: '1454165804606-c3d57bc86b40',
    closing: '1551288049-bebda4e38f71',
  },
};

function resolveIndustry(industry: string): keyof typeof SLIDE_IMAGE_BANK {
  const i = (industry || '').toLowerCase();
  if (i.includes('cyber') || i.includes('security')) return 'cybersecurity';
  if (i.includes('food') || i.includes('restaurant') || i.includes('gastronomy')) return 'food';
  if (i.includes('fintech') || i.includes('finance') || i.includes('payment') || i.includes('bank')) return 'fintech';
  if (i.includes('health') || i.includes('medical') || i.includes('clinic')) return 'healthcare';
  return 'general';
}

function img(industry: string, topic: string): string {
  const cat = resolveIndustry(industry);
  const bank = SLIDE_IMAGE_BANK[cat];
  const id = bank[topic] || bank.cover || SLIDE_IMAGE_BANK.general.cover;
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=800&h=450`;
}

export function getTargetSlideCountRange(stage: string): { min: number; max: number } {
  const s = (stage || '').toLowerCase();
  if (s.includes('idea')) return { min: 8, max: 10 };
  if (s.includes('pre-seed') || s.includes('preseed')) return { min: 10, max: 12 };
  if (s.includes('seed')) return { min: 12, max: 15 };
  return { min: 13, max: 15 };
}

export function buildSlidesFromAnalysis(
  analysis: any,
  accentColor: string
): { projectName: string; slides: PitchDeckSlide[] } {
  const profile  = analysis?.startupProfile || {};
  const name     = profile.companyName || 'Your Venture';
  const industry = profile.industry || 'Technology';
  const stage    = profile.stage || profile.fundingStage || 'Idea Stage';
  const country  = profile.country || '';
  const idea     = analysis?.ideaDescription || profile.businessDescription || '';
  const pitch    = profile.elevatorPitch || '';

  const scores = analysis?.scores || {};
  const sc = (k: string): number => {
    const v = scores[k];
    return typeof v === 'number' ? v : (v?.score ?? 0);
  };
  const overall   = scores.overall ?? sc('ideaStrength') ?? 85;
  const appeal    = sc('investorAppeal');
  const fit       = sc('marketFit');
  const scale     = sc('scalability');
  const exec      = sc('execution');
  const comp      = sc('competition');

  const market   = analysis?.marketAnalysis     || {};
  const rival    = analysis?.competitorAnalysis || {};
  const riskData = analysis?.riskMatrix         || analysis?.risks || {};
  const rm       = analysis?.roadmap            || {};
  const investors = Array.isArray(analysis?.investorMatching) ? analysis.investorMatching : [];
  const verdict  = analysis?.finalVerdict;
  const grow     = analysis?.growthPotential    || {};
  const teamData = analysis?.team || analysis?.founders || [];

  const mk = (
    id: string,
    topic: string,
    title: string,
    content: string,
    points: string[],
    metric?: { label: string; value: string }
  ): PitchDeckSlide => ({
    id: `${analysis.id || 'deck'}-${id}`,
    title, content: content || '',
    layout: 'split',
    points: points.filter(Boolean).slice(0, 4),
    metric,
    visualSuggestion: `${topic} visual`,
    imageKeywords: `${industry} ${topic}`,
    imageUrl: img(industry, topic),
    colorAccent: accentColor,
  });

  const slides: PitchDeckSlide[] = [];

  // 1. COVER
  slides.push(mk('cover', 'cover', name,
    pitch || idea.slice(0, 120) || `${industry} venture at ${stage}`,
    [`${industry}${country ? ' · ' + country : ''}`, stage, verdict?.status || 'Investor Ready'],
    { label: 'STARTUP SCORE', value: `${overall}%` }
  ));

  // 2. TEAM — real data or auto-generated placeholders
  const founders = Array.isArray(teamData) && teamData.length > 0
    ? teamData
    : [
        { name: 'Founder Name', role: 'Chief Executive Officer', expertise: 'Vision & Strategy', experience: '10+ years' },
        { name: 'Co-Founder', role: 'Chief Technology Officer', expertise: 'Product & Engineering', experience: '8+ years' },
        { name: 'Advisor', role: 'Industry Advisor', expertise: 'Domain Expertise', experience: '15+ years' },
      ];
  slides.push({
    id: `${analysis.id || 'deck'}-team`,
    title: 'Our Team',
    content: `The people building ${name}`,
    layout: 'split',
    points: founders.slice(0, 3).map((m: any) =>
      `${m.name || 'Founder'} | ${m.role || 'Founder'} | ${m.expertise || m.background || 'Domain Expert'} | ${m.experience || '10+ years'}`
    ),
    metric: undefined,
    visualSuggestion: 'Founder cards',
    imageKeywords: `${industry} team founders professionals`,
    imageUrl: img(industry, 'team'),
    colorAccent: accentColor,
  });

  // 3. PROBLEM
  slides.push(mk('problem', 'problem', 'The Problem',
    rival.marketGaps || 'Existing solutions are costly, slow, and leave a clear gap',
    [
      market.demandSignals || 'Strong unmet demand confirmed across target segments',
      rival.saturationLevel ? `Market density: ${rival.saturationLevel}` : 'Fragmented legacy alternatives fail to deliver',
      'Customers actively pay for inferior workarounds today',
    ]
  ));

  // 4. SOLUTION
  slides.push(mk('solution', 'solution', 'Our Solution',
    pitch || idea || 'A precisely targeted solution built for this exact gap',
    [
      rival.competitiveAdvantages || 'Clear differentiated advantage vs all incumbents',
      `Built as ${profile.businessType || 'B2B'} ${profile.productType || 'platform'}`,
      `Idea Strength: ${sc('ideaStrength')}%`,
    ]
  ));

  // 5. PRODUCT OVERVIEW
  slides.push(mk('product', 'product', 'Product Overview',
    pitch || idea || 'A focused product experience built for the target user',
    [
      `Stage: ${stage}`,
      `Team size: ${profile.teamSize || '2–5 people'}`,
      `Type: ${profile.productType || 'SaaS Platform'}`,
      `Execution score: ${exec}%`,
    ]
  ));

  // 6. MARKET OPPORTUNITY
  if (market.overview || market.sizeEstimate) {
    slides.push(mk('market', 'market', 'Market Opportunity',
      market.overview || 'Large, rapidly growing addressable market',
      [
        `TAM: ${market.sizeEstimate || 'Validated in full report'}`,
        `Growth: ${market.growthTrends || 'Accelerating demand'}`,
        `Market Fit: ${fit}%`,
      ],
      { label: 'MARKET SIZE', value: market.sizeEstimate || 'Global' }
    ));
  }

  // 7. TARGET CUSTOMER
  slides.push(mk('customer', 'customer', 'Target Customer',
    market.demandSignals || `Primary market: ${country || 'Target region'}`,
    [
      `Segment: ${profile.businessType || 'B2B Enterprise'}`,
      `Geography: ${country || 'GCC / MENA / Global'}`,
      market.demandSignals || 'Validated buyer demand confirmed in pilots',
    ]
  ));

  // 8. BUSINESS MODEL
  slides.push(mk('business', 'business', 'Business Model',
    grow.revenueModel || profile.businessDescription || 'Scalable recurring revenue model',
    [
      `Revenue: ${grow.revenueModel || profile.businessType || 'SaaS subscription'}`,
      `Product: ${profile.productType || 'Platform as a Service'}`,
      `Investor Appeal: ${appeal}%`,
    ]
  ));

  // 9. COMPETITIVE ADVANTAGE
  if (rival.competitiveAdvantages || (rival.mainCompetitors?.length ?? 0) > 0) {
    slides.push(mk('competition', 'competition', 'Competitive Advantage',
      rival.competitiveAdvantages || 'Structurally defensible position with clear moat',
      [
        `vs. ${rival.mainCompetitors?.slice(0, 2).join(', ') || 'Legacy incumbents'}`,
        `Saturation: ${rival.saturationLevel || 'Moderate'}`,
        `Competition Score: ${comp}%`,
      ]
    ));
  }

  // 10. VALIDATION & TRACTION (only if score is strong or verdict exists)
  if (overall > 70 || verdict) {
    slides.push(mk('traction', 'traction', 'Validation & Traction',
      analysis?.topInvestorTakeaway || 'Data-backed validation across all investor dimensions',
      [
        `Overall Startup Score: ${overall}%`,
        `Scalability: ${scale}%  ·  Execution: ${exec}%`,
        verdict?.status || 'Strong investment thesis confirmed',
      ],
      { label: 'STARTUP SCORE', value: `${overall}%` }
    ));
  }

  // 11. GROWTH OPPORTUNITIES
  if (grow.scaling || rm.oneToThreeMonths) {
    slides.push(mk('growth', 'growth', 'Growth Opportunities',
      grow.scaling || 'Multiple high-value expansion vectors identified',
      [
        grow.scaling || 'Clear horizontal expansion pathway',
        ...(rm.oneToThreeMonths || ['Near-term market capture milestones']).slice(0, 1),
        grow.revenue || 'Multiple revenue expansion levers',
      ]
    ));
  }

  // 12. RISKS & MITIGATION
  const riskPoints = Object.entries(riskData).slice(0, 3).map(([k, v]: any) =>
    `${k}: ${v.mitigation || v.explanation || 'Actively managed'}`
  );
  if (riskPoints.length > 0) {
    slides.push(mk('risks', 'risks', 'Risks & Mitigation',
      'Key risks identified with concrete mitigation strategies in place',
      riskPoints
    ));
  }

  // 13. WHY INVEST
  slides.push(mk('invest', 'invest', 'Why Invest Now',
    verdict?.description || `${name} represents a validated ${stage} opportunity`,
    [
      `Startup Score: ${overall}% — ${verdict?.status || 'Strong opportunity'}`,
      `Investor Appeal: ${appeal}%  ·  Scalability: ${scale}%`,
      investors.length > 0
        ? `${investors.length} matched investor profiles identified`
        : 'Aligned with active investor mandates',
    ],
    { label: 'INVESTOR READINESS', value: `${appeal || overall}%` }
  ));

  // 14. ROADMAP
  const rmPoints = [
    ...(rm.immediate            || ['Immediate: MVP completion and initial pilots']).slice(0, 1),
    ...(rm.oneToThreeMonths     || ['3 months: first paying customers secured']).slice(0, 1),
    ...(rm.threeToSixMonths     || ['6 months: market expansion and scale']).slice(0, 1),
    ...(rm.investorReadiness    || ['12 months: institutional funding ready']).slice(0, 1),
  ];
  slides.push(mk('roadmap', 'roadmap', 'Roadmap',
    'Phased execution plan with clear milestones and funding triggers',
    rmPoints
  ));

  // 15. CLOSING
  slides.push(mk('closing', 'closing', name,
    pitch || `${name} — built on data, ready to scale`,
    [verdict?.status || 'Investor Ready', `Startup Score: ${overall}%`, country ? `Based in ${country}` : 'Global opportunity'],
    { label: 'STARTUP SCORE', value: `${overall}%` }
  ));

  const limits = getTargetSlideCountRange(stage);
  return { projectName: name, slides: slides.slice(0, limits.max) };
}

export function getDefaultsForSlide(
  slide: PitchDeckSlide,
  theme: any,
  index: number,
  projectId: string = 'default'
): any[] {
  const accent = theme.accentColor;
  const text   = theme.text;
  const key    = slide.id.split('-').pop() || '';

  if (key === 'cover') return [
    { id: 'accent', type: 'shape',  content: 'line',        x: 8,  y: 15, w: 8,  h: 0.8, color: accent, zIndex: 5 },
    { id: 'title',  type: 'title',  content: slide.title,   x: 8,  y: 18, w: 50, h: 20, fontSize: 46, fontWeight: '900', color: accent, textAlign: 'left', zIndex: 10 },
    { id: 'sub',    type: 'text',   content: slide.content, x: 8,  y: 42, w: 48, h: 18, fontSize: 17, color: text, textAlign: 'left', zIndex: 10 },
    { id: 'metric', type: 'metric', content: `${slide.metric?.label || 'SCORE'}: ${slide.metric?.value || '85%'}`, x: 8, y: 63, w: 28, h: 14, fontSize: 13, color: accent, zIndex: 8 },
    { id: 'image',  type: 'image',  content: slide.imageUrl || '', x: 58, y: 10, w: 34, h: 78, zIndex: 6 },
  ];

  if (key === 'team') return [
    { id: 'title',  type: 'title', content: slide.title,   x: 8, y: 10, w: 84, h: 12, fontSize: 40, fontWeight: '800', color: text, textAlign: 'left', zIndex: 10 },
    { id: 'sub',    type: 'text',  content: slide.content, x: 8, y: 23, w: 84, h: 10, fontSize: 15, color: text, textAlign: 'left', zIndex: 10 },
    { id: 'points', type: 'point', content: (slide.points || []).join('\n'), x: 8, y: 36, w: 84, h: 52, fontSize: 13, color: text, zIndex: 10 },
  ];

  if (key === 'problem') return [
    { id: 'title',  type: 'title', content: slide.title,   x: 8,  y: 10, w: 84, h: 12, fontSize: 40, fontWeight: '800', color: text, textAlign: 'left', zIndex: 10 },
    { id: 'accent', type: 'shape', content: 'line',        x: 8,  y: 23, w: 10, h: 0.6, color: accent, zIndex: 5 },
    { id: 'sub',    type: 'text',  content: slide.content, x: 8,  y: 26, w: 42, h: 28, fontSize: 15, color: text, textAlign: 'left', zIndex: 10 },
    { id: 'points', type: 'point', content: (slide.points || []).join('\n'), x: 8, y: 56, w: 42, h: 34, fontSize: 13, color: text, zIndex: 10 },
    { id: 'image',  type: 'image', content: slide.imageUrl || '', x: 54, y: 18, w: 38, h: 70, zIndex: 6 },
  ];

  if (key === 'solution') return [
    { id: 'title',  type: 'title', content: slide.title,   x: 8,  y: 10, w: 84, h: 12, fontSize: 40, fontWeight: '800', color: text, textAlign: 'left', zIndex: 10 },
    { id: 'accent', type: 'shape', content: 'line',        x: 8,  y: 23, w: 10, h: 0.6, color: accent, zIndex: 5 },
    { id: 'sub',    type: 'text',  content: slide.content, x: 8,  y: 26, w: 42, h: 22, fontSize: 15, color: text, textAlign: 'left', zIndex: 10 },
    { id: 'points', type: 'point', content: (slide.points || []).join('\n'), x: 8, y: 50, w: 42, h: 40, fontSize: 13, color: text, zIndex: 10 },
    { id: 'image',  type: 'image', content: slide.imageUrl || '', x: 54, y: 18, w: 38, h: 70, zIndex: 6 },
  ];

  if (key === 'market') return [
    { id: 'title',  type: 'title',  content: slide.title,   x: 8, y: 10, w: 84, h: 12, fontSize: 40, fontWeight: '800', color: text, zIndex: 10 },
    { id: 'sub',    type: 'text',   content: slide.content, x: 8, y: 24, w: 40, h: 16, fontSize: 15, color: text, zIndex: 10 },
    { id: 'metric', type: 'metric', content: `${slide.metric?.label || 'MARKET'}: ${slide.metric?.value || 'Global'}`, x: 8, y: 43, w: 30, h: 14, fontSize: 13, color: accent, zIndex: 10 },
    { id: 'points', type: 'point',  content: (slide.points || []).join('\n'), x: 8, y: 60, w: 40, h: 30, fontSize: 12, color: text, zIndex: 10 },
    { id: 'chart',  type: 'chart',  content: `${slide.metric?.value || 'TAM'}|Market Sizing`, x: 52, y: 22, w: 42, h: 64, color: accent, zIndex: 10 },
  ];

  if (key === 'invest') return [
    { id: 'title',  type: 'title',  content: slide.title,   x: 8, y: 10, w: 84, h: 12, fontSize: 40, fontWeight: '800', color: text, zIndex: 10 },
    { id: 'metric', type: 'metric', content: `${slide.metric?.label || 'READINESS'}: ${slide.metric?.value || '85%'}`, x: 8, y: 26, w: 38, h: 56, fontSize: 14, color: accent, zIndex: 10 },
    { id: 'points', type: 'point',  content: (slide.points || []).join('\n'), x: 50, y: 26, w: 42, h: 56, fontSize: 13, color: text, zIndex: 10 },
  ];

  if (key === 'roadmap') return [
    { id: 'title',  type: 'title', content: slide.title,   x: 8, y: 10, w: 84, h: 12, fontSize: 40, fontWeight: '800', color: text, zIndex: 10 },
    { id: 'sub',    type: 'text',  content: slide.content, x: 8, y: 24, w: 84, h: 10, fontSize: 15, color: text, zIndex: 10 },
    { id: 'points', type: 'point', content: (slide.points || []).join('\n'), x: 8, y: 36, w: 84, h: 52, fontSize: 13, color: text, zIndex: 10 },
  ];

  if (key === 'closing') return [
    { id: 'title',  type: 'title', content: slide.title,   x: 8, y: 22, w: 60, h: 18, fontSize: 52, fontWeight: '900', color: accent, zIndex: 10 },
    { id: 'sub',    type: 'text',  content: slide.content, x: 8, y: 44, w: 50, h: 16, fontSize: 17, color: text, zIndex: 10 },
    { id: 'points', type: 'point', content: (slide.points || []).join('\n'), x: 8, y: 63, w: 50, h: 24, fontSize: 13, color: text, zIndex: 10 },
  ];

  // default
  return [
    { id: 'title',  type: 'title', content: slide.title,   x: 8, y: 10, w: 84, h: 12, fontSize: 40, fontWeight: '800', color: text, zIndex: 10 },
    { id: 'sub',    type: 'text',  content: slide.content, x: 8, y: 24, w: 84, h: 10, fontSize: 15, color: text, zIndex: 10 },
    { id: 'points', type: 'point', content: (slide.points || []).join('\n'), x: 8, y: 36, w: 84, h: 52, fontSize: 13, color: text, zIndex: 10 },
  ];
}

export function reapplyThemeToElements(
  slides: PitchDeckSlide[],
  oldTheme: any,
  newTheme: any
): PitchDeckSlide[] {
  return slides.map(slide => ({
    ...slide,
    colorAccent: newTheme.accentColor,
    elements: slide.elements?.map(el => ({
      ...el,
      color: el.color === oldTheme.accentColor ? newTheme.accentColor
           : el.color === oldTheme.text        ? newTheme.text
           : el.color,
    })),
  }));
}