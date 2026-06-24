import { PitchDeckSlide } from '../types';

export interface PredefinedProject {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  stage: string;
  description: string;
  elevatorPitch: string;
  slides: PitchDeckSlide[];
}

export const PREDEFINED_PROJECTS: PredefinedProject[] = [
  {
    id: 'nexshield',
    name: 'NexShield',
    tagline: 'Enterprise Threat Protection Portal',
    industry: 'Cybersecurity SaaS',
    stage: 'Seed Stage',
    description: 'Enterprise security proxy shielding cloud applications from unauthorized automated breaches and data leaks',
    elevatorPitch: 'Securing cloud infrastructures with lightweight edge proxy systems',
    slides: [
      {
        id: 'n1',
        title: 'NexShield Security',
        content: 'Enterprise Threat Control Suite and Cloud Data Armor',
        points: [
          'Edge network screening under two milliseconds delay',
          'Automated protection against malicious query injections',
          'Enterprise threat compliance reporting out of the box'
        ],
        metric: { label: 'Query Capacity', value: '4M/sec' },
        visualType: 'image',
        visualSuggestion: 'Structured secure modern hardware setup',
        imageKeywords: 'network server security firewall tech minimal',
        imageUrl: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=800&h=450',
        colorAccent: '#1a73e8',
        layout: 'hero'
      },
      {
        id: 'n2',
        title: 'The Core Vision',
        content: 'Securing cloud infrastructures transparently as global enterprise applications transition to distributed web resources',
        points: [
          'Continuous monitoring of database requests and critical integrations',
          'Compliance management for high-security financial transactions',
          'Decongesting raw edge pipelines to speed up queries'
        ],
        metric: { label: 'Protected Space', value: '18 Hubs' },
        visualType: 'text',
        visualSuggestion: 'Minimal key statement layout',
        imageKeywords: 'quote minimal text design screen',
        colorAccent: '#1a73e8',
        layout: 'centered'
      },
      {
        id: 'n3',
        title: 'Market Friction',
        content: 'Conventional firewalls slow down database responses while failing to identify modern scrapers and bot automation',
        points: [
          'High Latency: Legacy security checks introduce extensive response delays',
          'Static Infrastructure: Fixed threat rules fail against dynamic multi-region scripts',
          'Overhead Inflation: Security specialists lose crucial hours configuring false alerts'
        ],
        metric: { label: 'Vulnerability Rate', value: '82%' },
        visualType: 'data',
        visualSuggestion: 'High contrast challenge tiles',
        imageKeywords: 'empty elegant server room design minimal',
        colorAccent: '#1a73e8',
        layout: 'split'
      },
      {
        id: 'n4',
        title: 'The Solution Ecosystem',
        content: 'A dedicated secure screening hub that blocks bad traffic immediately while accelerating standard database queries',
        points: [
          'Visual Analytics: Clear dashboard tracking clean vs malicious query curves',
          'Automated Compliance: Standardized parameters protecting cloud records',
          'Simple Dashboard: Single dashboard monitoring active user requests'
        ],
        metric: { label: 'Defense Stability', value: '99.9%' },
        visualType: 'image',
        visualSuggestion: 'Modern server telemetry tracking',
        imageKeywords: 'dashboard web design minimal clean',
        imageUrl: 'https://images.unsplash.com/photo-1551214012-84f95e0602e5?auto=format&fit=crop&q=80&w=800&h=450',
        colorAccent: '#1a73e8',
        layout: 'grid'
      },
      {
        id: 'n5',
        title: 'Market Expansion',
        content: 'Global compliance and software protection demands rise as corporate security mandates for cloud networks tighten',
        points: [
          'Addressable Space: $14.2 Billion active market opportunity',
          'Market Expansion: Hitting 42% annual growth across enterprise web services',
          'Qualified Operators: Over 140,000 corporate setups requiring modernized shield layers'
        ],
        metric: { label: 'API Security Market Size', value: '$14.2B' },
        visualType: 'chart',
        visualSuggestion: 'Clean upward valuation line',
        imageKeywords: 'chart trends upward business tech',
        colorAccent: '#1a73e8',
        layout: 'split'
      },
      {
        id: 'n6',
        title: 'Defensible Advantage',
        content: 'Our core advantage is direct memory execution which lowers cloud computing costs compared to legacy systems',
        points: [
          'Edge Independence: Complete local inspection to avoid data extraction risk',
          'Innovative Design: Streamlined operations maximizing standard request velocities'
        ],
        metric: { label: 'Processing Lift', value: '10x' },
        visualType: 'text',
        visualSuggestion: 'High performance metrics',
        imageKeywords: 'performance graphs minimal design',
        colorAccent: '#1a73e8',
        layout: 'grid'
      },
      {
        id: 'n7',
        title: 'Comparative Matrix',
        content: 'Comparing operational capabilities and request latency against traditional security layers',
        points: [
          'Header / Columns: Feature | NexShield | Competitor Alpha | Competitor Beta',
          'Row 1: Under 2ms Latency | Yes | No (25ms) | No (40ms)',
          'Row 2: Automated Filtration | Yes | No (Static rules) | Partially',
          'Row 3: Full Audit Compatibility | Yes | Yes | No'
        ],
        metric: { label: 'Security Grade', value: 'AAA' },
        visualType: 'data',
        visualSuggestion: 'Comparative matrix grid',
        imageKeywords: 'matrix table details structured data',
        colorAccent: '#1a73e8',
        layout: 'grid'
      },
      {
        id: 'n8',
        title: 'Predictable Revenue Tiers',
        content: 'Simple tiered subscription models billing for monthly processed requests with high software margins',
        points: [
          'Standard Starter: $49 billed monthly for validated developer setups',
          'Advanced Business: $499 billed monthly for mid-market corporate frameworks',
          'Enterprise Premium: Flexible customized service level agreements for major operations'
        ],
        metric: { label: 'Gross Margin', value: '87%' },
        visualType: 'data',
        visualSuggestion: 'Pricing structures grid',
        imageKeywords: 'billing pricing tier invoice minimal',
        colorAccent: '#1a73e8',
        layout: 'split'
      },
      {
        id: 'n9',
        title: 'Strategic Roadmap',
        content: 'Key execution milestones planned to compress project onboarding cycles and claim market share',
        points: [
          'Phase One: Complete partner platform integrations and trial onboarding cycles',
          'Phase Two: Initiate edge marketplace assets on AWS GCP and Azure cloud platforms',
          'Phase Three: Scale active corporate deployments reaching targeted annual metrics'
        ],
        metric: { label: 'Roadmap Phases', value: '3 Steps' },
        visualType: 'data',
        visualSuggestion: 'Milestones horizontal path',
        imageKeywords: 'timeline dots connection path',
        colorAccent: '#1a73e8',
        layout: 'split'
      },
      {
        id: 'n10',
        title: 'Venture Ask & Capital Allocation',
        content: 'Raising Seed funding to scale core system features, onboard certified engineers, and accelerate corporate pipeline growth',
        points: [
          'Funding Target: Seeking $1.8M to expand developer operations and node coverage',
          'Core Focus: Directing resources onto software expansion and high-volume deployment',
          'Contact Details: partner@nexshield.co | info@nexshield.co'
        ],
        metric: { label: 'Capital Sought', value: '$1.8M' },
        visualType: 'image',
        visualSuggestion: 'Strategic partnership block',
        imageKeywords: 'cyber security clean connection geometric',
        imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800&h=450',
        colorAccent: '#1a73e8',
        layout: 'hero'
      }
    ]
  },
  {
    id: 'gotham-room',
    name: 'GothamRoom',
    tagline: 'Luxury Corporate Workspaces',
    industry: 'Commercial Real Estate SaaS',
    stage: 'Seed Stage',
    description: 'Bespoke hourly design workspaces and boardrooms curated for on-demand executive meetings and hybrid teams',
    elevatorPitch: 'Connecting corporate teams with premium executive spaces on-demand',
    slides: [
      {
        id: 'g1',
        title: 'GothamRoom Workspace',
        content: 'Bespoke On-Demand Meeting Suites and Corporate Sanctuaries',
        points: [
          'Frictionless reservations tailored for hybrid corporate teams',
          'Sophisticated office designs with high-fidelity corporate tools',
          'Direct space utility optimization for property landlords'
        ],
        metric: { label: 'Active Facilities', value: '45+ Hubs' },
        visualType: 'image',
        visualSuggestion: 'Luxury minimal meeting room design',
        imageKeywords: 'premium office space loft lounge minimal',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800&h=450',
        colorAccent: '#4f46e5',
        layout: 'hero'
      },
      {
        id: 'g2',
        title: 'Our Executive Mission',
        content: 'To establish inspiring work sanctuaries that maximize creative performance and corporate representation',
        points: [
          'Aggregating underutilized real estate margins into premium assets',
          'Eliminating complex leases with transparent hourly reservation paths',
          'Upgrading hybrid workspace efficiency for modern enterprises'
        ],
        metric: { label: 'Client Rating', value: '4.9★' },
        visualType: 'text',
        visualSuggestion: 'Key quote presentation layout',
        imageKeywords: 'quote minimal aesthetic clean text',
        colorAccent: '#4f46e5',
        layout: 'centered'
      },
      {
        id: 'g3',
        title: 'Market Friction',
        content: 'Conventional coworking spaces are noisy and cluttered, while traditional real estate leases are rigid and capital intensive',
        points: [
          'Cluttered Spaces: Open-bench plans create noise distractions that drop productivity',
          'Underutilized Assets: Commercial properties suffer high vacancy margins during key hours',
          'Friction Overhead: Growing teams waste hours finalizing space booking variables'
        ],
        metric: { label: 'Static Vacancies', value: '21%' },
        visualType: 'data',
        visualSuggestion: 'Three high contrast challenge cards',
        imageKeywords: 'commercial office empty building minimal',
        colorAccent: '#4f46e5',
        layout: 'split'
      },
      {
        id: 'g4',
        title: 'The Solution Ecosystem',
        content: 'An elegant private workspace marketplace matching hybrid corporate teams to premium equipped boardrooms instantly',
        points: [
          'Immediate Discovery: Direct access maps with sixty second space confirmations',
          'Prestige Assets: Premium private configurations engineered for critical meetings',
          'Landlord Yield: Monetizing empty space slots to return passive real estate value'
        ],
        metric: { label: 'Response Target', value: '60s' },
        visualType: 'image',
        visualSuggestion: 'Premium space booking portal mockup',
        imageKeywords: 'application screen smartphone clean software',
        imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800&h=450',
        colorAccent: '#4f46e5',
        layout: 'grid'
      },
      {
        id: 'g5',
        title: 'Market Expansion',
        content: 'Flexible corporate workspace demand expands rapidly as organizations improve static lease commitments',
        points: [
          'Total Addressable Market: $12.5 Billion target segment opportunity',
          'Expansion Track: Steady thirty-four percent growth in hourly corporate reservation slots',
          'Target Metros: Expanding active spaces within high-density business districts'
        ],
        metric: { label: 'Flexible Work Market Size', value: '$12.5B' },
        visualType: 'chart',
        visualSuggestion: 'Upward climbing expansion trajectory',
        imageKeywords: 'analytics trend climbing business metrics',
        colorAccent: '#4f46e5',
        layout: 'split'
      },
      {
        id: 'g6',
        title: 'Why This Idea Stands Out',
        content: 'Our asset-light model avoids costly commercial leases, allowing us to maintain high pricing flexibility',
        points: [
          'Low Capital Overhead: Real estate partners assume property maintenance variables',
          'High Cohort Retention: Client loyalty grows due to consistent luxury standardizations'
        ],
        metric: { label: 'Platform Margin', value: '72%' },
        visualType: 'text',
        visualSuggestion: 'Workspace operational health',
        imageKeywords: 'graphics performance horizontal layout',
        colorAccent: '#4f46e5',
        layout: 'grid'
      },
      {
        id: 'g7',
        title: 'Product Comparison',
        content: 'Comparing acoustic privacy and technical meeting setups against typical real estate solutions',
        points: [
          'Header / Columns: Attribute | GothamRoom | Traditional Offices | Cafes',
          'Row 1: Guaranteed Acoustic Privacy | Yes | Rare | No (High crowds)',
          'Row 2: Dedicated Video Suite Tools | Yes | Extra fee | No',
          'Row 3: Direct Hourly Checkout | Yes | No (Locked annuals) | No'
        ],
        metric: { label: 'Retention Multiplier', value: '3.5x' },
        visualType: 'data',
        visualSuggestion: 'Matrix comparisons grid',
        imageKeywords: 'data table sheet spreadsheet numbers',
        colorAccent: '#4f46e5',
        layout: 'grid'
      },
      {
        id: 'g8',
        title: 'Predictable Revenue Tiers',
        content: 'Earning transactional platform commissions paired with scalable recurring corporate seat subscriptions',
        points: [
          'Partner Transaction Cut: 25% booking fee shares calculated on reservation checkouts',
          'Medium Business Pass: $299 per seat monthly for hybrid executive configurations',
          'Corporate Custom Desk: Optimized contract tiers designed for enterprise fleets'
        ],
        metric: { label: 'ARR Target Year Three', value: '$12.8M' },
        visualType: 'data',
        visualSuggestion: 'Corporate plans grid',
        imageKeywords: 'revenue spreadsheet ledger finance',
        colorAccent: '#4f46e5',
        layout: 'split'
      },
      {
        id: 'g9',
        title: 'Strategic Roadmap',
        content: 'Careful operational stages planned to acquire premium property partnerships and launch metro markets',
        points: [
          'Phase One: Complete initial pilots in Chelsea and Soho hitting over eighty percent density',
          'Phase Two: Deliver keyless automated lock grids across partner buildings',
          'Phase Three: Launch unified dashboard portal tracking employee reservation metrics'
        ],
        metric: { label: 'Early Pipeline Volume', value: '$160K' },
        visualType: 'data',
        visualSuggestion: 'Milestones horizontal grid',
        imageKeywords: 'dots roadmap path corporate text minimal',
        colorAccent: '#4f46e5',
        layout: 'split'
      },
      {
        id: 'g10',
        title: 'Venture Ask & Resource Split',
        content: 'Seeking institutional seed capital to optimize platform features, secure property files, and conquer leading markets',
        points: [
          'Capital Target: Raising $1.5M to increase core software developers and sales teams',
          'Market Focus: Enhancing local site marketing pipelines and onboarding automation',
          'Contact details: invest@gothamroom.com | partner@gothamroom.com'
        ],
        metric: { label: 'Capital Sought', value: '$1.5M' },
        visualType: 'image',
        visualSuggestion: 'Venture capital ask layout',
        imageKeywords: 'deal handshake agreement design minimal',
        imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800&h=450',
        colorAccent: '#4f46e5',
        layout: 'hero'
      }
    ]
  },
  {
    id: 'seatme',
    name: 'SEATME',
    tagline: 'Dynamic Seating Yield Platform',
    industry: 'Hospitality Technology SaaS',
    stage: 'Prototype Stage',
    description: 'Dynamic reservation pricing and occupancy yield optimization software built for elite dining establishments',
    elevatorPitch: 'Maximizing restaurant occupancy and average guest checks with dynamic reservation grids',
    slides: [
      {
        id: 's1',
        title: 'SEATME AI Platform',
        content: 'Dynamic Seating Yield Analytics for Fine Dining Operators',
        points: [
          'Dynamic reservation rates optimized on current weather and local parameters',
          'Direct B2B point of sale link avoiding system replication',
          'Increases off-peak dinner reservations by thirty-four percent'
        ],
        metric: { label: 'Active Venues', value: '120+ Hubs' },
        visualType: 'image',
        visualSuggestion: 'Fine dining interior layout mockup',
        imageKeywords: 'luxury restaurant interiors dining table fine',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800&h=450',
        colorAccent: '#d97706',
        layout: 'hero'
      },
      {
        id: 's2',
        title: 'The Modern Yield Hook',
        content: 'Optimizing fine dining seating structures dynamically during slow slots while capturing premium weekend values',
        points: [
          'Adjusting weekday table bookings dynamically to capture maximum audience',
          'Reducing platform reservation scalping by protecting seats via smart checkouts',
          'Generating immediate customer returns using visual menus and table alerts'
        ],
        metric: { label: 'Average Revenue Raise', value: '+18%' },
        visualType: 'text',
        visualSuggestion: 'Key quote presentation layout',
        imageKeywords: 'gourmet plating presentation wine minimal',
        colorAccent: '#d97706',
        layout: 'centered'
      },
      {
        id: 's3',
        title: 'Market Friction',
        content: 'Static reservation calendars leave prime tables empty on midweek nights while third-party scalpers profit off peak slots',
        points: [
          'Midweek Vacancies: Prime venues leave thirty-five percent of midweek seats empty',
          'Client No-Shows: Unsecured bookings cost kitchens premium ingredient margins',
          'Secondary Exploitation: Freelance bookers hoard peak weekend reservations for resale arbitrage'
        ],
        metric: { label: 'Empty Midweek Space', value: '35%' },
        visualType: 'data',
        visualSuggestion: 'Three high contrast challenge blocks',
        imageKeywords: 'empty elegant restaurant table white minimal',
        colorAccent: '#d97706',
        layout: 'split'
      },
      {
        id: 's4',
        title: 'The Yield Ecosystem',
        content: 'A smart occupancy cockpit tracking real time local metrics to suggest and adjust dinner slot reservation prices',
        points: [
          'Pricing Calibration: Assesses weather patterns, holidays, and historic footfalls to balance seat values',
          'Peak Priority: Enables active bidding on prime tables to redirect value to the staff',
          'Frictional Sync: Fully integrates with major point of sale platforms'
        ],
        metric: { label: 'Weekday Lift Target', value: '+34%' },
        visualType: 'image',
        visualSuggestion: 'Restaurant yield screen mockup',
        imageKeywords: 'software kitchen chef tablet system POS',
        imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800&h=450',
        colorAccent: '#d97706',
        layout: 'grid'
      },
      {
        id: 's5',
        title: 'Market Opportunity',
        content: 'Culinary establishments actively seek dynamic SaaS solutions to balance escalating prime ingredient costs',
        points: [
          'Global Sector Market Size: $6.2 Billion active target workspace',
          'Qualified Market: Hitting over 380,000 fine dining setups in major culinary metros',
          'Platform Expansion: Solid growth rates in localized restaurant software segments'
        ],
        metric: { label: 'Food Technology Market Size', value: '$6.2B' },
        visualType: 'chart',
        visualSuggestion: 'Upward climbing growth layout',
        imageKeywords: 'restaurants fine dining growth chart data',
        colorAccent: '#d97706',
        layout: 'split'
      },
      {
        id: 's6',
        title: 'Algorithmic Advantages',
        content: 'Our core advantage is responsive reservation fee prorating that dynamically refines table transition cycles',
        points: [
          'Active Yield Pricing: Fully responsive reservation refinement vs simple scheduling templates',
          'Zero No-Shows: Securing dining commitments with smart authorization cuts'
        ],
        metric: { label: 'Slashed No-Shows', value: '<0.4%' },
        visualType: 'text',
        visualSuggestion: 'Core system metrics grids',
        imageKeywords: 'clean lines analytics interface metric',
        colorAccent: '#d97706',
        layout: 'grid'
      },
      {
        id: 's7',
        title: 'Product Comparison',
        content: 'Comparing reservation fee flexibility and client authorization setups against conventional concierges',
        points: [
          'Header / Columns: Feature | SEATME | Legacy Concierges | Telephone',
          'Row 1: Proactive Seat Fees | Yes | No (Passive calendar) | No',
          'Row 2: Premium Bidding Desk | Yes | No | No',
          'Row 3: No-Show Charge Protection | Yes | Partially | No'
        ],
        metric: { label: 'Average Check Growth', value: '+14%' },
        visualType: 'data',
        visualSuggestion: 'Comparisons matrix outline',
        imageKeywords: 'table spreadsheet structured rows analytics',
        colorAccent: '#d97706',
        layout: 'grid'
      },
      {
        id: 's8',
        title: 'Predictable Revenue Tiers',
        content: 'Earning software licensing revenue paired with active platform yield transactional commissions',
        points: [
          'Standard SaaS License: $199 steady monthly subscription fee per checked kitchen',
          'Yield Commission Split: Two percent transactional sharing fee calculated on dynamic revenue growth',
          'Enterprise Suite: Tailored pricing integrations supporting premium hotel restaurant networks'
        ],
        metric: { label: 'ARR Target Year Three', value: '$14.5M' },
        visualType: 'data',
        visualSuggestion: 'Tier layouts comparisons',
        imageKeywords: 'pricing plans ledger accounts financial',
        colorAccent: '#d97706',
        layout: 'split'
      },
      {
        id: 's9',
        title: 'Strategic Roadmap',
        content: 'Systematic expansion steps focusing on high-density dining districts to command localized trust',
        points: [
          'Phase One: Finalize trial onboarding with forty partner fine dining outlets',
          'Phase Two: Onboard direct point-of-sale integrations and billing connectors',
          'Phase Three: Expand US hospitality sales reaching targeted annual deployments'
        ],
        metric: { label: 'Total Diners Hosted', value: '2.4M' },
        visualType: 'data',
        visualSuggestion: 'Timeline roadmap layout',
        imageKeywords: 'dots roadmap path metrics connection',
        colorAccent: '#d97706',
        layout: 'split'
      },
      {
        id: 's10',
        title: 'Venture Ask & Capital Focus',
        content: 'Raising Seed funding to scale software features, secure hospitality sales relationships, and expand core network assets',
        points: [
          'Sought Funding Target: Raising $2.0M to secure key developers and launch marketing channels',
          'Product Scale: Accelerating checkout software adapters and compliance tracking systems',
          'Contact details: raise@seatme.io | partner@seatme.io'
        ],
        metric: { label: 'Requested Capital', value: '$2.0M' },
        visualType: 'image',
        visualSuggestion: 'Capital ask block',
        imageKeywords: 'handshake deal table restaurant warm gold',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800&h=450',
        colorAccent: '#d97706',
        layout: 'hero'
      }
    ]
  }
];

export const generateDefaultSlidesForProject = (projectId: string): PitchDeckSlide[] => {
  const match = PREDEFINED_PROJECTS.find(p => p.id === projectId);
  if (match) return match.slides;
  return [];
};
