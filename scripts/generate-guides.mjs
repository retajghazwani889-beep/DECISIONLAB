#!/usr/bin/env node
// Programmatic SEO: generates public/guides/<slug>/index.html for every
// topic below, using the exact HTML/CSS template of the original
// public/guides/validate-startup-idea/index.html guide page. Runs at the
// start of `npm run build` so the guide pages always match GUIDE_TOPICS.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://decisionlabhub.com";

// Resolved lazily inside main() — not at module scope — because server.ts
// imports GUIDE_TOPICS from this file too, and when server.ts is bundled to
// CommonJS for production, `import.meta.url` is unavailable/empty and would
// throw if touched at import time.
function getOutRoot() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.join(__dirname, "..", "public", "guides");
}

/**
 * @typedef {{ h3: string; p: string }} GuideStep
 * @typedef {{ q: string; a: string }} GuideFaq
 * @typedef {{
 *   slug: string; title: string; metaDescription: string; h1: string;
 *   intro: string; steps: GuideStep[]; faqs: GuideFaq[];
 * }} GuideTopic
 */

/** @type {GuideTopic[]} */
export const GUIDE_TOPICS = [
  {
    slug: "how-to-make-a-pitch-deck",
    title: "How to Make a Pitch Deck for Investors",
    h1: "How to Make a Pitch Deck for Investors",
    metaDescription:
      "A clear, step-by-step guide to building a startup pitch deck that gets investor meetings — the exact slide order, what goes on each slide, and the mistakes that get decks rejected.",
    intro:
      "A pitch deck has one job: earn the next meeting. It's not meant to answer every question — it's meant to make an investor lean in and want to talk. Here's exactly what goes on each slide, in order.",
    steps: [
      { h3: "Title", p: "Company name, a one-line description of what you do and for whom, and your contact info. If a stranger can't tell what you do from this line, rewrite it." },
      { h3: "Problem", p: "The painful, specific problem you solve. Make the investor feel it. Vague problems get vague interest." },
      { h3: "Solution", p: "How you solve it, simply. Show the outcome for the customer, not a feature list." },
      { h3: "Product", p: "A few screenshots or a short demo flow. Show, don't tell — let them see it working." },
      { h3: "Market size", p: "How big this can get. Be honest and bottom-up: number of customers × what they'd pay, not a giant top-down number nobody believes." },
      { h3: "Business model", p: "How you make money — pricing, and who pays. Investors need to see a path to real revenue." },
      { h3: "Traction", p: "Your strongest evidence: users, revenue, growth, waitlist, pilots. Even early signal beats a great-sounding plan with none." },
      { h3: "Competition", p: "Who else solves this, and why you win. Never claim you have no competitors — show why you're clearly better on what buyers care about." },
      { h3: "Go-to-market", p: "How you'll reach customers repeatably. Distribution is where most startups actually die, so investors look hard here." },
      { h3: "Team", p: "Why you're the right people to build this. Relevant experience and unfair advantages matter more than headcount." },
      { h3: "The ask", p: "How much you're raising, and what it gets you — the milestones this round funds. End with a clear next step." },
    ],
    faqs: [
      { q: "How many slides should a pitch deck have?", a: "Aim for 10 to 12 slides for a first investor meeting. The goal is to earn the next conversation, not to answer every question in the deck." },
      { q: "What should be on the first slide of a pitch deck?", a: "A title slide with your company name, a one-line description of what you do, and your contact details." },
      { q: "What is the most important slide in a pitch deck?", a: "The problem and the traction slides. Investors back founders solving a painful, real problem who can show early evidence the solution is working." },
    ],
  },
  {
    slug: "how-to-find-investors-for-a-startup",
    title: "How to Find Investors for Your Startup",
    h1: "How to Find Investors for Your Startup",
    metaDescription:
      "A practical guide to finding the right startup investors — how to build a target list, get warm introductions, and avoid wasting months emailing the wrong people.",
    intro:
      "Most founders raise money by emailing everyone they can find and hoping something sticks. It's slow and it shows. Finding the right investors is a targeting problem first, an outreach problem second.",
    steps: [
      { h3: "Know what stage you're actually at", p: "Pre-seed, seed, and Series A investors write very different checks and want to see very different evidence. Pitching a Series A fund with no revenue wastes both your time — check what stage each fund actually writes for before reaching out." },
      { h3: "Build a target list, not a spray list", p: "Find 20-30 investors who've funded companies in your space, stage, and geography before. A short, relevant list beats a long generic one — relevant investors reply more and understand your pitch faster." },
      { h3: "Get warm intros over cold email", p: "A short intro from a founder, mutual connection, or accelerator gets read; cold email mostly doesn't. Ask people in your network — even a weak connection — to make the intro rather than cc'ing you and stepping back." },
      { h3: "Research each investor before reaching out", p: "Read what they've written, check their recent investments, and reference something real in your message. It signals you did the work and aren't blasting a list." },
      { h3: "Lead with traction and the ask, not backstory", p: "Investors skim. Put your strongest evidence and what you're raising near the top of any email or deck — the founder story earns its place after they're already interested." },
      { h3: "Treat the first meeting as a filter, not a close", p: "Nobody wires money after one call. The goal of meeting one is a clear next step: a second meeting, a data request, or an honest no. Ask for it directly." },
      { h3: "Keep a simple pipeline", p: "Track who you've contacted, what stage they're at, and the next action. Fundraising drags on when follow-ups get lost — a spreadsheet is enough." },
    ],
    faqs: [
      { q: "How many investors should I contact when fundraising?", a: "Plan for 30-50 relevant investors at your stage. Expect most to pass — a 10-20% meeting rate from a well-targeted list is normal, not a sign something's wrong." },
      { q: "What's the difference between angel investors and VCs?", a: "Angels invest their own money, usually smaller checks, faster decisions. VCs invest a fund's money, usually larger checks, more process and diligence, and expect a path to a much bigger outcome." },
      { q: "Do I need a pitch deck before emailing investors?", a: "Yes — even a short one. It shows you can explain the business clearly and gives them something concrete to react to or forward internally." },
    ],
  },
  {
    slug: "how-to-write-a-one-line-startup-pitch",
    title: "How to Write a One-Line Startup Pitch",
    h1: "How to Write a One-Line Startup Pitch",
    metaDescription:
      "How to write a one-line startup pitch that actually lands — a simple formula, real examples, and the mistakes that make people's eyes glaze over.",
    intro:
      "If someone asks what your startup does and it takes you thirty seconds to answer, that's the problem — not their attention span. A good one-liner forces clarity you'll need for everything else: the deck, the landing page, the elevator ride.",
    steps: [
      { h3: "Name who it's for, specifically", p: "\"Everyone\" is not a customer. Name the actual person — their role, situation, or context — so the sentence has someone real attached to it." },
      { h3: "Name the problem in plain words", p: "Describe the pain the way your customer would describe it, not the way a strategy deck would. If it sounds like jargon, a stranger won't feel it." },
      { h3: "Say what you do, not how you built it", p: "\"We use AI to optimize workflows\" describes the technology. \"We cut invoice processing from a week to a day\" describes the outcome. Lead with the outcome." },
      { h3: "Use the formula, then edit it down", p: "Start with: \"[Product] helps [specific customer] [achieve outcome] by [how, in a few words].\" Write it, then cut every word that isn't doing work." },
      { h3: "Cut every qualifier", p: "\"Kind of like,\" \"a platform for,\" \"innovative,\" \"next-generation\" — these soften the sentence without adding information. Delete them and see if it still makes sense; it usually reads better." },
      { h3: "Test it on a stranger", p: "Say it to someone outside your industry. If they can repeat back what you do in their own words, it works. If they ask \"wait, so what do you actually do?\", it doesn't yet." },
    ],
    faqs: [
      { q: "What's the difference between a tagline and a one-line pitch?", a: "A tagline is brand voice — memorable, sometimes abstract. A one-line pitch has to be understood immediately by someone who's never heard of you, with no context." },
      { q: "How long should a one-line pitch be?", a: "One sentence, ideally under 20 words. If you need two sentences to explain it, the first one probably isn't doing its job yet." },
      { q: "Should my one-liner mention the market size?", a: "No — that's a pitch deck slide, not a one-liner. The one-liner's only job is making a stranger understand what you do and for whom." },
    ],
  },
  {
    slug: "how-to-do-market-research-for-a-startup",
    title: "How to Do Market Research for a Startup",
    h1: "How to Do Market Research for a Startup",
    metaDescription:
      "A founder's guide to market research that's actually useful — how to size a market, find real customer evidence, and avoid research that just confirms what you already believe.",
    intro:
      "Market research has a bad reputation among founders because most of it is either a 200-page report nobody reads or a survey that just confirms what you already wanted to hear. Useful market research is smaller, faster, and aimed at changing your mind if you're wrong.",
    steps: [
      { h3: "Define who you're researching, not just what", p: "\"The market for productivity tools\" is too broad to research. \"Solo consultants who currently track hours in spreadsheets\" is specific enough to actually go find and talk to." },
      { h3: "Find where they already talk about this problem", p: "Forums, subreddits, review sites, and support tickets for adjacent tools are full of people describing their frustration in their own words — free, unfiltered research most founders skip." },
      { h3: "Read reviews of tools they already use", p: "One-star and three-star reviews of competing or adjacent products tell you exactly what's missing and what people are willing to pay to fix. It's some of the highest-signal research available." },
      { h3: "Run 5-10 short customer conversations", p: "Ask about their current process and what they've tried, not whether they'd use your product. What people did in the past predicts behavior far better than what they say they'd do." },
      { h3: "Size the market bottom-up", p: "Estimate the number of realistic customers and what they'd pay, then multiply. It's less impressive than a huge top-down number, but it's the one investors and you can actually trust." },
      { h3: "Write down what would change your mind", p: "Before you start, decide what result would make you doubt the idea. Research only sharpens decisions when you're willing to let it say no." },
    ],
    faqs: [
      { q: "What's the difference between primary and secondary research?", a: "Primary research is evidence you gather yourself — interviews, surveys, usage data. Secondary research is evidence that already exists — reports, articles, competitor reviews. Good validation uses both, primary first." },
      { q: "How much market research should I do before building anything?", a: "Enough to answer: is the problem real, is the market big enough, and can I reach these customers. That's usually a few days of focused work, not weeks." },
      { q: "Are there free tools for startup market research?", a: "Yes — search trend tools, forum and review sites, and direct customer conversations cost nothing but time and cover most of what early-stage research needs." },
    ],
  },
  {
    slug: "how-to-analyze-startup-competitors",
    title: "How to Analyze Your Startup Competitors",
    h1: "How to Analyze Your Startup Competitors",
    metaDescription:
      "How to analyze startup competitors properly — direct, indirect, and DIY alternatives, what to look for in their pricing and reviews, and how to find the gap you can own.",
    intro:
      "\"We have no competitors\" is almost always wrong — it usually means the founder hasn't looked hard enough. Every problem worth solving already has someone solving it badly, including with a spreadsheet. Competitor analysis is about finding exactly where they're weak.",
    steps: [
      { h3: "List direct, indirect, and DIY competitors", p: "Direct competitors solve the same problem the same way. Indirect competitors solve it differently. DIY competitors are the spreadsheet, the manual process, or \"doing nothing\" — often the real competition in early markets." },
      { h3: "Use the product yourself", p: "Sign up, click through, try to complete the task a real customer would. Reading a features page tells you what they claim; using it tells you what's actually true." },
      { h3: "Read their reviews and support forums", p: "Complaints reveal exactly where the gap is. If the same frustration shows up repeatedly across reviews, that's a specific, validated opportunity — not a guess." },
      { h3: "Map pricing and positioning", p: "Note what each competitor charges, who they target, and how they describe themselves. This shows you where the market is crowded and where it's open." },
      { h3: "Find the gap you can own", p: "Look for a dimension buyers care about where every competitor is weak — speed, price, simplicity, a specific use case. Being different only matters if it's different on something people will pay for." },
      { h3: "Recheck quarterly", p: "Competitors ship features and change pricing. A competitive analysis from a year ago is a snapshot of a market that's already moved." },
    ],
    faqs: [
      { q: "What if I genuinely can't find any competitors?", a: "Look again — check for indirect competitors and manual workarounds, not just companies using the same category label. A total absence of any alternative usually means there's no demand yet, not that you're first." },
      { q: "How many competitors should I track closely?", a: "Three to five is usually enough: your closest direct competitors plus the strongest indirect or DIY alternative. Tracking more than that adds noise without adding insight." },
      { q: "Should I worry more about direct or indirect competitors?", a: "Early on, indirect competitors and DIY workarounds often matter more — that's who you're actually replacing. Direct competitors matter more once you're fighting for the same buyer at the same moment." },
    ],
  },
  {
    slug: "startup-swot-analysis",
    title: "How to Do a SWOT Analysis for a Startup",
    h1: "How to Do a SWOT Analysis for a Startup",
    metaDescription:
      "A practical guide to running a SWOT analysis for a startup — what belongs in each quadrant, how to avoid a generic list, and how to turn it into real decisions.",
    intro:
      "A SWOT analysis is often done badly: a rushed four-box list that says nothing specific and changes nothing. Done well, it's a fast way to separate what you control from what you don't, and to force honesty about your weak spots before an investor points them out.",
    steps: [
      { h3: "Strengths: what you control and do well", p: "Team experience, proprietary tech, existing traction, unique access — anything genuinely inside your control that gives you an edge. Be specific; \"passionate team\" isn't a strength an investor can evaluate." },
      { h3: "Weaknesses: what you control and don't do well", p: "Gaps in the team, unproven distribution, thin margins, dependency on one person or partner. This is the section founders soften the most — don't. Naming it is what lets you fix it." },
      { h3: "Opportunities: external factors working in your favor", p: "Market growth, a competitor's misstep, a regulatory shift, a new channel opening up. These exist whether or not you act on them — the SWOT just makes them visible." },
      { h3: "Threats: external factors working against you", p: "New entrants, platform dependency, a shrinking market, a well-funded competitor. Unlike weaknesses, you can't fix these directly — you can only prepare for them." },
      { h3: "Pressure-test every item with \"so what\"", p: "For each point, ask what it actually changes about your plan. An item that doesn't affect a decision doesn't belong on the list — it's just noise." },
      { h3: "Turn it into three actions", p: "A SWOT that ends as a static document is wasted effort. Pick the biggest weakness to fix, the biggest opportunity to chase, and the biggest threat to prepare for — and assign each one an owner and a deadline." },
    ],
    faqs: [
      { q: "How is a SWOT analysis different from a risk analysis?", a: "A SWOT is broader — it covers internal strengths and weaknesses alongside external factors. A risk analysis focuses specifically on what could go wrong and how severe it would be." },
      { q: "Who should be involved in a startup's SWOT analysis?", a: "Founders and any core team members with a different vantage point — sales sees different threats than engineering does. A SWOT written by one person alone tends to miss blind spots." },
      { q: "How often should a startup redo its SWOT analysis?", a: "Roughly every quarter, or immediately after a major shift — a new competitor, a funding round, or a big product change. A SWOT from a year ago rarely still reflects reality." },
    ],
  },
  {
    slug: "how-to-price-a-startup-product",
    title: "How to Price Your Startup Product",
    h1: "How to Price Your Startup Product",
    metaDescription:
      "How to price a startup product with confidence — pricing by value instead of cost, choosing a model, and avoiding the underpricing mistake almost every early founder makes.",
    intro:
      "Almost every early-stage founder underprices. It feels safer, but it attracts the wrong customers, funds the business poorly, and is painfully hard to fix later. Pricing isn't a finishing touch — it's a decision that shapes who buys and how the business survives.",
    steps: [
      { h3: "Price the value, not the cost", p: "\"Cost plus a margin\" ignores what the outcome is actually worth to the customer. If your product saves someone $10,000 a year, pricing it at $50 a month leaves value on the table and signals it isn't worth much." },
      { h3: "Find your willingness-to-pay ceiling", p: "Ask prospective customers directly what they currently spend solving this problem, and what a real fix would be worth. Their current spend is a far more reliable anchor than a guess." },
      { h3: "Pick a pricing model that matches how value is delivered", p: "Per-seat suits collaborative tools, usage-based suits infrastructure, flat-fee suits simple outcomes. The wrong model can make a good product feel expensive or unpredictable even at a fair price." },
      { h3: "Start higher than feels comfortable", p: "It's far easier to discount for an early customer than to raise prices on everyone later. A price that makes you slightly uncomfortable is usually closer to correct than one that feels safe." },
      { h3: "Make pricing simple to explain", p: "If you can't state your price and what it includes in one sentence, buyers will hesitate — confusion kills deals faster than a high number does." },
      { h3: "Revisit pricing at every funding stage", p: "What you charge at launch, once you have traction, and once you have proof of ROI should be three different numbers. Treat pricing as a decision you keep making, not one you make once." },
    ],
    faqs: [
      { q: "Should I ever price lower than my competitors?", a: "Only deliberately, as a strategy to win a specific segment fast — not by default. Being the cheapest option usually attracts the most price-sensitive, least loyal customers." },
      { q: "How do I raise prices on existing customers without losing them?", a: "Grandfather existing customers at their current rate for a set period, give advance notice, and lead with the added value they're getting — not just the new number." },
      { q: "Should I offer a free trial or a freemium plan?", a: "A free trial suits products with a fast time-to-value that need a short push to convert. Freemium suits products with network effects or long-term habit-building, and needs a real budget to sustain." },
    ],
  },
  {
    slug: "signs-a-startup-idea-will-fail",
    title: "7 Signs a Startup Idea Will Fail",
    h1: "7 Signs a Startup Idea Will Fail",
    metaDescription:
      "Seven warning signs a startup idea is likely to fail before you build it — from weak demand to broken unit economics — so you can catch them early instead of the hard way.",
    intro:
      "Most startups don't fail because of bad execution on a good idea — they fail because the idea had a fatal flaw from day one that nobody stopped to check for. Here are the seven warning signs worth taking seriously before you build.",
    steps: [
      { h3: "No one has the problem badly enough to pay", p: "\"That would be nice to have\" is not demand. If people describe the problem as a mild annoyance rather than something they've already spent time or money trying to fix, the willingness to pay usually isn't there either." },
      { h3: "You can't name your first 10 customers", p: "If you can't point to specific people or companies who'd buy on day one, you don't have a customer — you have a hypothesis. Vague targeting is one of the clearest early failure signals." },
      { h3: "The market is shrinking or stagnant", p: "A shrinking market makes even great execution fight a current that never stops pulling backward. Check the trend before falling for the idea, not after." },
      { h3: "Distribution depends entirely on someone else's goodwill", p: "If growth requires a single platform's algorithm, a single partner's approval, or one influencer's attention, the business doesn't control its own future — it's a rented one." },
      { h3: "The unit economics don't work even in the best case", p: "If it costs more to acquire and serve a customer than that customer is ever likely to pay, no amount of scale fixes it — scale just makes the losses bigger, faster." },
      { h3: "You're the only one excited about it", p: "If early conversations get polite nods instead of real questions, follow-up interest, or \"when can I use this,\" that flat reaction is data — don't explain it away as people not getting it yet." },
      { h3: "There are no competitors, and no one's found a way to make money here", p: "A crowded space usually means real demand. A completely empty one more often means people already tried and it didn't work — check which one it is before assuming you're first." },
    ],
    faqs: [
      { q: "Does having competitors mean my startup idea will fail?", a: "No — the opposite is often true. Competitors are evidence of real demand. The risk is being undifferentiated in a crowded market, not the competition existing at all." },
      { q: "Can a startup idea recover after showing one of these signs?", a: "Often, yes — most of these are fixable with a sharper customer, a different distribution channel, or a repriced model. The danger is ignoring the sign and building for months before addressing it." },
      { q: "What's the fastest way to check for these signs before building?", a: "Talk to real prospective customers, check the actual unit economics on paper, and honestly assess how the product would reach its first 100 users — all before writing production code." },
    ],
  },
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function jsonLdEscape(str) {
  return JSON.stringify(str).slice(1, -1);
}

/** @param {GuideTopic} topic */
function renderGuideHtml(topic) {
  const { slug, title, metaDescription, h1, intro, steps, faqs } = topic;
  const url = `${SITE_URL}/guides/${slug}/`;
  const ogImage = `${SITE_URL}/og-image.png`;
  const keywords = Array.from(
    new Set([title.toLowerCase(), slug.split("-").join(" "), `${title.toLowerCase()} guide`, "decisionlab"])
  ).join(", ");

  const stepsHtml = steps
    .map(
      (s, i) =>
        `  <div class="step"><div class="n">${i + 1}</div><div><h3>${s.h3}</h3><p>${s.p}</p></div></div>`
    )
    .join("\n");

  const faqHtml = faqs
    .map((f) => `  <h3>${f.q}</h3>\n  <p>${f.a}</p>`)
    .join("\n");

  const faqJsonLd = faqs
    .map(
      (f) =>
        `    {"@type":"Question","name":"${jsonLdEscape(f.q)}","acceptedAnswer":{"@type":"Answer","text":"${jsonLdEscape(f.a)}"}}`
    )
    .join(",\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)} | DecisionLab</title>
<meta name="description" content="${escapeHtml(metaDescription)}" />
<meta name="keywords" content="${escapeHtml(keywords)}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(metaDescription)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${ogImage}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
<meta name="twitter:image" content="${ogImage}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${jsonLdEscape(title)}",
  "description": "${jsonLdEscape(metaDescription)}",
  "author": { "@type": "Organization", "name": "DecisionLab" },
  "publisher": { "@type": "Organization", "name": "DecisionLab", "url": "${SITE_URL}/" },
  "mainEntityOfPage": "${url}",
  "image": "${ogImage}"
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
${faqJsonLd}
  ]
}
</script>
<style>
  :root{--bg:#102434;--surface:#152d3f;--ink:#ebf1f5;--muted:#94a9b2;--accent:#5DA9FF;--line:rgba(255,255,255,.08)}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ink);font-family:"Inter",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
  .wrap{max-width:760px;margin:0 auto;padding:0 20px}
  header.top{border-bottom:1px solid var(--line)}
  .nav{max-width:760px;margin:0 auto;padding:18px 20px;display:flex;align-items:center;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:10px;font-family:"Sora",sans-serif;font-weight:800;font-size:19px;color:#fff;text-decoration:none}
  .badge{width:34px;height:34px;border-radius:9px;border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff;background:rgba(93,169,255,.08);letter-spacing:-1px}
  .brand .lab{color:var(--accent)}
  .nav a.cta{font-family:"Inter";font-size:13px;font-weight:700;background:var(--accent);color:#0a1520;padding:9px 16px;border-radius:10px;text-decoration:none}
  h1{font-family:"Sora",sans-serif;font-weight:800;font-size:clamp(30px,5vw,44px);line-height:1.12;letter-spacing:-.02em;margin:44px 0 14px;color:#fff}
  h2{font-family:"Sora",sans-serif;font-weight:700;font-size:clamp(22px,3.4vw,28px);margin:44px 0 12px;color:#fff;letter-spacing:-.01em}
  h3{font-family:"Sora",sans-serif;font-weight:600;font-size:19px;margin:28px 0 8px;color:#fff}
  p{margin:0 0 16px;color:#cdd8e0}
  .lede{font-size:19px;color:var(--muted);margin-bottom:8px}
  ul,ol{margin:0 0 18px;padding-left:22px}
  li{margin-bottom:9px;color:#cdd8e0}
  strong{color:#fff;font-weight:600}
  a{color:var(--accent)}
  .meta{color:var(--muted);font-size:13px;text-transform:uppercase;letter-spacing:.14em;font-weight:600;margin-top:36px}
  .cta-box{background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:14px;padding:24px;margin:34px 0}
  .cta-box h3{margin-top:0}
  .cta-box a{display:inline-block;margin-top:6px;background:var(--accent);color:#0a1520;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:11px;font-size:14px}
  .step{display:flex;gap:16px;padding:18px 0;border-top:1px solid var(--line)}
  .step .n{flex-shrink:0;width:34px;height:34px;border-radius:9px;background:rgba(93,169,255,.12);color:var(--accent);font-family:"Sora";font-weight:700;display:flex;align-items:center;justify-content:center}
  .step h3{margin:2px 0 4px}
  footer{border-top:1px solid var(--line);margin-top:56px;padding:28px 0 60px;color:var(--muted);font-size:13px}
  footer a{color:var(--muted)}
</style>
</head>
<body>
<header class="top">
  <div class="nav">
    <a class="brand" href="${SITE_URL}/"><span class="badge">DL</span>Decision<span class="lab">Lab</span></a>
    <a class="cta" href="${SITE_URL}/">Score my idea free</a>
  </div>
</header>
<main class="wrap">
  <p class="meta">Founder Guide</p>
  <h1>${h1}</h1>
  <p class="lede">${intro}</p>
  <div class="cta-box">
    <h3>Want the fast version?</h3>
    <p>Type your idea into DecisionLab and get a readiness score across market fit, execution, and investor appeal in about a minute — free, no credit card.</p>
    <a href="${SITE_URL}/">Score my idea free →</a>
  </div>
  <h2>Step-by-step</h2>
${stepsHtml}
  <h2>Turn this into a decision with DecisionLab</h2>
  <p>Reading about this is useful — testing it against real evidence is what actually changes the outcome. <a href="${SITE_URL}/">DecisionLab</a> scores your startup idea on market fit, execution, and investor appeal, and can generate a first-draft pitch deck automatically, so you find out fast whether it's worth building.</p>
  <div class="cta-box">
    <h3>Ready to find out if your idea is worth building?</h3>
    <p>Get your free readiness score now — no signup required to see it, and no credit card.</p>
    <a href="${SITE_URL}/">Score my idea free →</a>
  </div>
  <h2>Frequently asked questions</h2>
${faqHtml}
</main>
<footer>
  <div class="wrap">
    <p><a href="${SITE_URL}/">DecisionLab</a> — Analyze, validate &amp; grow your startup. &nbsp;·&nbsp; <a href="${SITE_URL}/pricing">Pricing</a> &nbsp;·&nbsp; <a href="${SITE_URL}/">Score your idea free</a></p>
  </div>
</footer>
</body>
</html>
`;
}

function main() {
  const outRoot = getOutRoot();
  for (const topic of GUIDE_TOPICS) {
    const dir = path.join(outRoot, topic.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), renderGuideHtml(topic), "utf-8");
    console.log(`Generated guides/${topic.slug}/index.html`);
  }
  console.log(`\nDone — ${GUIDE_TOPICS.length} guide pages generated.`);
}

// Only run when executed directly (`node scripts/generate-guides.mjs`),
// not when imported (e.g. by server.ts for the slug list).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
