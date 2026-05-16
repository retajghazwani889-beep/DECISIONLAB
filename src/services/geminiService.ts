import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeStartupIdea(description: string, isPremium: boolean = false) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a Senior Venture Capital Analyst at a top-tier firm like Sequoia or Andreessen Horowitz.
    Your task is to evaluate a startup idea provided by a founder.
    Be strict, realistic, and objective. Do not give false hope.
    Use data-driven reasoning and standard VC evaluation frameworks (TAM/SOM/SAM, Moats, Risk Matrix).
    
    ### HYPER-PERSONALIZATION RULES:
    - ALWAYS reference the specific industry and stage in your explanations.
    - If the user provides a location, tailor market size and competition data to that region.
    - Avoid generic "business advice"; give specific "strategic instructions".
    - Every score MUST have a unique, context-aware explanation that mentions the specific problem being solved.
    
    If isPremium is true, provide a much deeper dive including investor matching and strategy roadmaps.
    If isPremium is false, provide a high-quality but concise overview.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      scores: {
        type: Type.OBJECT,
        properties: {
          ideaStrength: { 
            type: Type.OBJECT, 
            properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
            required: ["score", "explanation"]
          },
          marketFit: { 
            type: Type.OBJECT, 
            properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
            required: ["score", "explanation"]
          },
          execution: { 
            type: Type.OBJECT, 
            properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
            required: ["score", "explanation"]
          },
          scalability: { 
            type: Type.OBJECT, 
            properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
            required: ["score", "explanation"]
          },
          competition: { 
            type: Type.OBJECT, 
            properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
            required: ["score", "explanation"]
          },
          investorAppeal: { 
            type: Type.OBJECT, 
            properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
            required: ["score", "explanation"]
          }
        },
        required: ["ideaStrength", "marketFit", "execution", "scalability", "competition", "investorAppeal"]
      },
      startupProfile: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          country: { type: Type.STRING },
          city: { type: Type.STRING },
          stage: { type: Type.STRING },
          industry: { type: Type.STRING },
          detailedSector: { type: Type.STRING },
          businessType: { type: Type.STRING },
          productType: { type: Type.STRING },
          elevatorPitch: { type: Type.STRING },
          businessDescription: { type: Type.STRING },
          founderBackground: { type: Type.STRING },
          teamSize: { type: Type.STRING }
        },
        required: ["companyName", "country", "city", "stage", "industry", "detailedSector", "businessType", "productType", "elevatorPitch", "businessDescription", "founderBackground", "teamSize"]
      },
      marketAnalysis: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING },
          sizeEstimate: { type: Type.STRING },
          growthTrends: { type: Type.STRING },
          demandSignals: { type: Type.STRING }
        },
        required: ["overview", "sizeEstimate", "growthTrends", "demandSignals"]
      },
      competitorAnalysis: {
        type: Type.OBJECT,
        properties: {
          mainCompetitors: { type: Type.ARRAY, items: { type: Type.STRING } },
          saturationLevel: { type: Type.STRING },
          marketGaps: { type: Type.STRING },
          competitiveAdvantages: { type: Type.STRING }
        },
        required: ["mainCompetitors", "saturationLevel", "marketGaps", "competitiveAdvantages"]
      },
      riskMatrix: {
        type: Type.OBJECT,
        properties: {
          market: { 
            type: Type.OBJECT, 
            properties: { 
              impact: { type: Type.NUMBER }, 
              likelihood: { type: Type.NUMBER }, 
              explanation: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              mitigation: { type: Type.STRING }
            },
            required: ["impact", "likelihood", "explanation", "severity", "mitigation"]
          },
          execution: { 
            type: Type.OBJECT, 
            properties: { 
              impact: { type: Type.NUMBER }, 
              likelihood: { type: Type.NUMBER }, 
              explanation: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              mitigation: { type: Type.STRING }
            },
            required: ["impact", "likelihood", "explanation", "severity", "mitigation"]
          },
          competition: { 
            type: Type.OBJECT, 
            properties: { 
              impact: { type: Type.NUMBER }, 
              likelihood: { type: Type.NUMBER }, 
              explanation: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              mitigation: { type: Type.STRING }
            },
            required: ["impact", "likelihood", "explanation", "severity", "mitigation"]
          },
          financial: { 
            type: Type.OBJECT, 
            properties: { 
              impact: { type: Type.NUMBER }, 
              likelihood: { type: Type.NUMBER }, 
              explanation: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              mitigation: { type: Type.STRING }
            },
            required: ["impact", "likelihood", "explanation", "severity", "mitigation"]
          }
        },
        required: ["market", "execution", "competition", "financial"]
      },
      keyInsights: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        minItems: 3,
        maxItems: 5
      },
      growthPotential: {
        type: Type.OBJECT,
        properties: {
          scaling: { type: Type.STRING },
          revenue: { type: Type.STRING },
          revenueModel: { type: Type.STRING },
          investorAttractiveness: { type: Type.STRING }
        },
        required: ["scaling", "revenue", "revenueModel", "investorAttractiveness"]
      },
      pitchReadiness: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING },
          preview: { type: Type.STRING },
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                points: { type: Type.ARRAY, items: { type: Type.STRING } },
                metric: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ["label", "value"]
                },
                visualSuggestion: { type: Type.STRING },
                imageKeywords: { type: Type.STRING },
                colorAccent: { type: Type.STRING }
              },
              required: ["id", "title", "content", "points", "metric", "visualSuggestion", "imageKeywords", "colorAccent"]
            }
          }
        },
        required: ["status", "preview", "slides"]
      },
      roadmap: {
        type: Type.OBJECT,
        properties: {
          immediate: { type: Type.ARRAY, items: { type: Type.STRING } },
          oneToThreeMonths: { type: Type.ARRAY, items: { type: Type.STRING } },
          threeToSixMonths: { type: Type.ARRAY, items: { type: Type.STRING } },
          investorReadiness: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["immediate", "oneToThreeMonths", "threeToSixMonths", "investorReadiness"]
      },
      investorMatching: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            stage: { type: Type.STRING },
            focus: { type: Type.STRING },
            whyFit: { type: Type.STRING },
            matchScore: { type: Type.NUMBER }
          },
          required: ["name", "type", "stage", "focus", "whyFit", "matchScore"]
        }
      },
      topInvestorTakeaway: { type: Type.STRING },
      finalVerdict: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ["Strong Investment Opportunity", "Moderate Potential", "High Risk", "Needs Pivot", "Not Investor Ready"] },
          description: { type: Type.STRING }
        },
        required: ["status", "description"]
      }
    },
    required: ["scores", "startupProfile", "marketAnalysis", "competitorAnalysis", "riskMatrix", "keyInsights", "growthPotential", "pitchReadiness", "roadmap", "investorMatching", "finalVerdict"]
  };

  const prompt = `
    Analyze this NEW startup idea:
    "${description}"
    
    Treat this as a completely fresh session. Provide a comprehensive investor-level dashboard output.
    
    Level of detail: ${isPremium ? 'PREMIUM (Extensive deep dive)' : 'BASIC (Standard overview)'}
    
    OUTPUT STYLE:
    - Bullet points only indoors
    - Max 5-10 words per line
    - No paragraphs
    - No storytelling
    
    KEY INSIGHTS:
    - Provide 3-5 insights.
    - Format: "[Priority] Short Insight".
    - Priority must be High, Medium, or Low.
    - Max 8 words per insight.
    - Be sharp and opinionated.

    STRATEGIC ROADMAP:
    - Provide specific and measurable actions.
    - Use numbers, targets, and clear outcomes (e.g., "Get 50 beta users", "Sign 3 partners").
    - Avoid vague words like "improve" or "optimize".
    - Align with weak metrics and address biggest risks first.

    TOP INVESTOR TAKEAWAY:
    - One strong, definitive sentence summary of the investment case.
    
    METRIC RADAR:
    Generate scores (0-100) and a short 5-10 word explanation for: Idea Strength, Market Fit, Execution, Scalability, Competition, Investor Appeal.
    Format as: { score: number, explanation: string }
    
    RISK MATRIX:
    Impact (1-10), Likelihood (1-10), and a short note for: Market, Execution, Competition, Financial risks.
    
    PITCH DECK ARCHITECT:
    Generate a 12-slide structured narrative with cover, problem, solution, market, business model, competition, go-to-market, traction, financials, team, investment ask.
    Each slide should have 2-4 short bullets.
    
    STARTUP PROFILE:
    Suggest a complete company identity based on the idea.
    PREFERRED SELECTIONS (use these unless better match):
    - stage: Idea Stage, Research Phase, Prototype, MVP, Beta Launch, Early Traction, Revenue Generating, Seed Stage, Growth Stage, Scaling, Series A Ready, Established Business.
    - industry: Artificial Intelligence, Fintech, SaaS, Healthcare, HealthTech, EdTech, Cybersecurity, E-commerce, Marketplace, Logistics, FoodTech, PropTech, LegalTech, HRTech, ClimateTech, BioTech, Robotics, Gaming, Creator Economy, Social Platform, Productivity, Enterprise Software, Real Estate, TravelTech, Transportation, FashionTech, AgriTech, SportsTech, Media & Entertainment, Web3 / Blockchain, IoT, Manufacturing, Telecommunications, Consumer Electronics, Energy, Hospitality, GovernmentTech, Nonprofit / Social Impact.
    - productType: SaaS Platform, Mobile App, Web Platform, Marketplace Platform, Intelligent Tool, API, Enterprise Software, Consumer App, Hardware Device, Hardware + Software, Chrome Extension, Automation Tool, Analytics Platform, Developer Tool, E-learning Platform, Social Platform, IoT Product, Robotics System, Cloud Infrastructure, No-Code Platform.
    - teamSize: Solo, 2–5, 6–10, 10+
    - businessType: B2B, B2C, B2B2C, Marketplace, D2C
    
    Fields: companyName, country, city, stage, industry, detailedSector, businessType, productType, elevatorPitch, businessDescription, founderBackground, teamSize
  `;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    return JSON.parse(result.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export async function generateCompanyAnalysis(profile: any) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an elite startup analyst trained on venture capital evaluation, startup ecosystems, and real-world founder success patterns (YC, Sequoia, a16z, Crunchbase data, and startup benchmarks).
    Your job is to generate a COMPLETE investor-grade company profile based on the user’s input.
    
    ### INTERACTIVE FORMAT REQUIREMENT
    - All output must be designed as interactive UI blocks, not plain text.
    - BE SHORT AND PRECISE: Max 10-12 words per bullet/insight.
    - BE ACTIONABLE: No fluff, no "once upon a time", no general advice.
    - VC-STYLE: Analytical, scannable, and data-driven.
    - Think "Dashboard Components", not "Articles".

    ### KEY INSIGHTS RULES:
    - Format: "[Priority] Short Insight".
    - Priority: High, Medium, or Low.
    - Max 8 words per insight. Sharp and opinionated.

    ### STRATEGIC ROADMAP RULES:
    - Actions MUST be specific and measurable (e.g., "Get 50 beta users").
    - Use clear targets/numbers. No vague verbs.
    - Align with weak metrics/risks.

    ### TOP INVESTOR TAKEAWAY:
    - ONE strong sentence summarizing the core investment thesis.

    ### OUTPUT STRUCTURE
    1. METRIC RADAR: 0-100 scores for Idea, Market, Execution, Scalability, Competition, and Investor Appeal.
    2. RISK MATRIX: Impact (1-10) and Likelihood (1-10) for Market, Execution, Competition, and Financial risks.
    3. KEY INSIGHTS: 3-5 scannable, actionable cards.
    4. STRATEGIC ROADMAP: Structured into Immediate, 1-3 Months, 3-6 Months, and Investor Readiness.
    5. SUGGESTED INVESTORS: Specific matches with Name, Type, and Stage.
    6. PITCH DECK ARCHITECT: 12-slide structured narrative.

    ### HYPER-PERSONALIZATION & CONTEXT RULES:
    - NEVER use generic "Your startup" or "Founders should". Use the specific "Company Name" or "Founders of [Company Name]".
    - TIES ALL INSIGHTS to the specific Sector and City/Country provided.
    - If the stage is "MVP", the roadmap should focus on traction; if "Idea", focus on validation.
    - Be brutally honest about the competition saturation in the specific region provided.
  `;

  const healthScoreSchema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      explanation: { type: Type.STRING }
    },
    required: ["score", "explanation"]
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      scores: {
        type: Type.OBJECT,
        properties: {
          ideaStrength: healthScoreSchema,
          marketFit: healthScoreSchema,
          execution: healthScoreSchema,
          investorAppeal: healthScoreSchema,
          scalability: healthScoreSchema,
          competition: healthScoreSchema
        },
        required: ["ideaStrength", "marketFit", "execution", "investorAppeal", "scalability", "competition"]
      },
      funding: {
        type: Type.OBJECT,
        properties: {
          stage: { type: Type.STRING },
          readinessScore: { type: Type.NUMBER },
          gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
          verdict: { type: Type.STRING }
        },
        required: ["stage", "readinessScore", "gaps", "verdict"]
      },
      investorMatching: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            whyFit: { type: Type.STRING },
            stage: { type: Type.STRING },
            focus: { type: Type.STRING },
            suggestedPitch: { type: Type.STRING },
            whatTheyLookFor: { type: Type.STRING },
            matchScore: { type: Type.NUMBER }
          },
          required: ["name", "type", "whyFit", "stage", "focus", "suggestedPitch", "whatTheyLookFor", "matchScore"]
        }
      },
      traction: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          potential: { type: Type.STRING }
        },
        required: ["analysis", "nextSteps", "potential"]
      },
      riskMatrix: {
        type: Type.OBJECT,
        properties: {
          market: { 
            type: Type.OBJECT, 
            properties: { 
              explanation: { type: Type.STRING }, 
              severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              impact: { type: Type.NUMBER, description: "1-10" },
              likelihood: { type: Type.NUMBER, description: "1-10" },
              mitigation: { type: Type.STRING }
            }, 
            required: ["explanation", "severity", "impact", "likelihood", "mitigation"] 
          },
          execution: { 
            type: Type.OBJECT, 
            properties: { 
              explanation: { type: Type.STRING }, 
              severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              impact: { type: Type.NUMBER, description: "1-10" },
              likelihood: { type: Type.NUMBER, description: "1-10" },
              mitigation: { type: Type.STRING }
            }, 
            required: ["explanation", "severity", "impact", "likelihood", "mitigation"] 
          },
          competition: { 
            type: Type.OBJECT, 
            properties: { 
              explanation: { type: Type.STRING }, 
              severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              impact: { type: Type.NUMBER, description: "1-10" },
              likelihood: { type: Type.NUMBER, description: "1-10" },
              mitigation: { type: Type.STRING }
            }, 
            required: ["explanation", "severity", "impact", "likelihood", "mitigation"] 
          },
          financial: { 
            type: Type.OBJECT, 
            properties: { 
              explanation: { type: Type.STRING }, 
              severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              impact: { type: Type.NUMBER, description: "1-10" },
              likelihood: { type: Type.NUMBER, description: "1-10" },
              mitigation: { type: Type.STRING }
            }, 
            required: ["explanation", "severity", "impact", "likelihood", "mitigation"] 
          }
        },
        required: ["market", "execution", "competition", "financial"]
      },
      keyInsights: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        minItems: 3,
        maxItems: 5
      },
      roadmap: {
        type: Type.OBJECT,
        properties: {
          immediate: { type: Type.ARRAY, items: { type: Type.STRING } },
          oneToThreeMonths: { type: Type.ARRAY, items: { type: Type.STRING } },
          threeToSixMonths: { type: Type.ARRAY, items: { type: Type.STRING } },
          investorReadiness: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["immediate", "oneToThreeMonths", "threeToSixMonths", "investorReadiness"]
      },
      finalVerdict: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ["Strong Investment Opportunity", "Moderate Potential", "High Risk", "Needs Pivot", "Not Investor Ready"] },
          description: { type: Type.STRING }
        },
        required: ["status", "description"]
      },
      pitchDeckRecommendation: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ["Recommended: Generate Professional Pitch Deck", "Recommended: Improve idea before generating pitch deck"] },
          isStrongPotential: { type: Type.BOOLEAN }
        },
        required: ["status", "isStrongPotential"]
      },
      investorReadinessRouting: { 
        type: Type.STRING, 
        enum: ["Not ready for VC", "Start with angels", "Apply to accelerators", "VC-ready"] 
      },
      topInvestorTakeaway: { type: Type.STRING }
    },
    required: ["summary", "scores", "funding", "investorMatching", "traction", "riskMatrix", "keyInsights", "roadmap", "finalVerdict", "pitchDeckRecommendation", "investorReadinessRouting", "topInvestorTakeaway"]
  };

  const prompt = `
    Generate an investor-grade analysis for this startup:
    
    COMPANY DATA:
    - Name: ${profile.companyName}
    - Location: ${profile.city}, ${profile.country}
    - Stage: ${profile.stage}
    - Industry: ${profile.industry} (${profile.detailedSector})
    - Business: ${profile.businessType} | ${profile.productType}
    - Elevator Pitch: ${profile.elevatorPitch}
    - Business Description: ${profile.businessDescription}
    - Team: ${profile.founderBackground} | Size: ${profile.teamSize}
    - Team Structure: ${JSON.stringify(profile.teamStructure || [])}
    
    SPECIAL ANALYSIS DIRECTIVE (TEAM STRENGTH):
    - Heavily weight "Execution", "Investor Appeal", and "Operational Strength" based on the Team Structure.
    - If roles like CTO or Lead Engineer are missing for a tech product, increase "Execution Risk".
    - If specialties don't match the industry (e.g., no specialized tech expertise for a deep-tech startup), call it out as a high risk.
    - If the team is solo or missing structured background, decrease "Investor Appeal".
    - Be specific about "Gaps" in the funding section based on team composition.
    
    Analyze strictly based on VC success factors.
  `;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    return JSON.parse(result.text || '{}');
  } catch (error) {
    console.error("Gemini Company Analysis Error:", error);
    throw error;
  }
}

export async function generatePitchDeck(profile: any) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a world-class venture capital pitch deck designer.
    Your job is to create investor-ready pitch decks (Y Combinator/Sequoia standard) that are professionally structured, visually clean, and minimal.
    
    CRITICAL DESIGN RULES:
    - Exactly 12 slides in the specified sequence.
    - Max 5 high-impact bullet points per slide.
    - Minimal text, professional "SaaS" tone, no fluff.
    - Provide a "metric" box for every slide representing a key data point, market stat, or proof.
    - Focus on high business credibility and investor-ready language.
    - Design follows a logical flow: Problem → Solution → Market → Business Model.
  `;

  const slideSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      content: { type: Type.STRING, description: "One concise sentence summarizing the slide's core message." },
      points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 professional bullet points." },
      metric: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.STRING }
        },
        required: ["label", "value"]
      },
      visualType: { type: Type.STRING, enum: ["chart", "data", "image", "text"] },
      visualSuggestion: { type: Type.STRING, description: "Description of the ideal graphic/chart for this slide (e.g., 'Pie chart showing market segments')." },
      imageKeywords: { type: Type.STRING, description: "3-4 descriptive keywords for a high-quality background image." },
      colorAccent: { type: Type.STRING, description: "A hex color code that fits the slide's mood." },
      layout: { type: Type.STRING, enum: ["split", "centered", "grid", "hero"] }
    },
    required: ["id", "title", "content", "points", "metric", "visualType", "visualSuggestion", "imageKeywords", "colorAccent", "layout"]
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      slides: {
        type: Type.ARRAY,
        items: slideSchema
      }
    },
    required: ["slides"]
  };

  const prompt = `
    Generate a 12-slide high-impact ${profile.template || 'Institutional VC'} style minimalist pitch deck for:
    
    PROJECT NAME: ${profile.projectName || profile.companyName}
    
    COMPANY DATA:
    - Name: ${profile.companyName}
    - Industry: ${profile.industry}
    - Stage: ${profile.stage}
    - Description: ${profile.businessDescription}
    - Elevator Pitch: ${profile.elevatorPitch}
    - Team: ${profile.founderBackground} | Size: ${profile.teamSize}
    
    STRICT SEQUENCE (Exactly 12 slides):
    1. Hook/Cover
    2. Problem (The Catalyst)
    3. Solution (The Value Prop)
    4. Market (TAM/SAM/SOM)
    5. Product (The Secret Sauce)
    6. Business Model (Unit Economics)
    7. Competition (Defensibility)
    8. Traction (Momentum)
    9. Go-To-Market (Scale Engine)
    10. Team (Execution Capability)
    11. Financials (3-5 Year Projections)
    12. Investment Ask (Milestones)

    NARRATIVE STYLE:
    - If ${profile.template} is 'Institutional VC' → Professional, rigorous, data-centric.
    - If ${profile.template} is 'Founder Narrative' → Charismatic, mission-driven, vision-focused.
    - If ${profile.template} is 'Clean White Investor' → Essentialist, precise, high-clarity.
    - If ${profile.template} is 'Modern SaaS' → Efficiency-focused, growth-centric, metric-heavy.
    - If ${profile.template} is 'Executive Corporate' → Authoritative, board-ready, conservative.
    - If ${profile.template} is 'Fintech Editorial' → Sophisticated, analytical, boutique.
    - If ${profile.template} is 'Classic Pitch' → High-energy, startup-centric, bold.
    - If ${profile.template} is 'Gradient Modern' → Fluid, tech-forward, dynamic.
    - If ${profile.template} is 'Bold Presentation' → Direct, high-impact, brutalist.
    - If ${profile.template} is 'Elegant Editorial' → Luxurious, narrative-rich, refined.

    NO MENTIONS:
    - Do not mention AI, automated, or generated.
    - Act as a human venture partner.

    Ensure realistic business assumptions for the stage (${profile.stage}).
  `;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    return JSON.parse(result.text || '{}');
  } catch (error) {
    console.error("Gemini Pitch Deck Error:", error);
    throw error;
  }
}
