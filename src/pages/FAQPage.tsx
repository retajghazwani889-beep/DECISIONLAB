import React, { useState } from 'react';
import { Rocket, Users, Handshake, Sparkles } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// FAQPage — grouped FAQ with accessible accordions.
//  · Sections: General · For Founders · For Team Members · For Investors
//  · One question open at a time across the whole page
//  · Smooth ~300ms height animation, + rotates into −
//  · Keyboard accessible (buttons) with proper ARIA attributes
// ─────────────────────────────────────────────────────────────────────────────

type QA = { q: string; a: string };
type Section = { id: string; icon: any; title: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    id: 'general',
    icon: Sparkles,
    title: 'General',
    items: [
      {
        q: 'What is DecisionLab?',
        a: 'DecisionLab is a platform that helps founders evaluate their startups, organize business information, strengthen investor readiness, and make more informed business decisions through a structured startup workspace.',
      },
      {
        q: 'Who is DecisionLab for?',
        a: 'DecisionLab is built for entrepreneurs, startup founders, investors, mentors, accelerators, and startup team members who want a better way to evaluate, manage, and grow startups.',
      },
      {
        q: 'How does DecisionLab work?',
        a: 'After creating your startup profile, DecisionLab analyzes key aspects of your business, provides detailed insights, identifies strengths and areas for improvement, and gives you access to tools that support startup growth.',
      },
      {
        q: 'Is DecisionLab free?',
        a: 'Yes. DecisionLab offers a free plan with essential features. Additional capabilities are available through premium plans.',
      },
      {
        q: 'Does DecisionLab guarantee funding?',
        a: 'No. DecisionLab helps founders prepare for fundraising and improve their startup, but investment decisions remain entirely with investors.',
      },
      {
        q: 'What makes DecisionLab different?',
        a: 'DecisionLab brings startup analysis, investor readiness, collaboration, investor discovery, and pitch deck creation together in one platform, reducing the need to switch between multiple tools throughout the startup journey.',
      },
      {
        q: "Can I use DecisionLab if my startup is only an idea?",
        a: "Absolutely. Whether you're validating an idea, building an MVP, or growing an existing startup, DecisionLab is designed to support founders at every stage.",
      },
    ],
  },
  {
    id: 'founders',
    icon: Rocket,
    title: 'For Founders',
    items: [
      {
        q: 'Is my startup information private?',
        a: 'Yes. Your startup information remains private and is never shared with investors, team members, or third parties unless you choose to do so.',
      },
      {
        q: 'Can I manage more than one startup?',
        a: 'Yes. You can create and manage multiple startup profiles from a single account.',
      },
      {
        q: 'How often can I update my startup?',
        a: 'You can update your startup profile whenever your business changes and generate new analyses to reflect your latest progress.',
      },
      {
        q: 'What is Investor Matching?',
        a: 'Investor Matching helps founders discover investors whose interests align with their startup based on factors such as industry, funding stage, and location.',
      },
      {
        q: 'How does the Pitch Deck Architect work?',
        a: 'The Pitch Deck Architect organizes the information from your startup profile into a structured presentation that you can customize before sharing with investors.',
      },
    ],
  },
  {
    id: 'team',
    icon: Users,
    title: 'For Team Members',
    items: [
      {
        q: 'Can multiple people work on the same startup?',
        a: 'Yes. Founders publish open positions for their startup, team members apply, and accepted applicants join the startup\'s team.',
      },
      {
        q: 'Can I join more than one startup team?',
        a: 'Yes. Team members can apply to positions at multiple startups and join every team that accepts them.',
      },
    ],
  },
  {
    id: 'investors',
    icon: Handshake,
    title: 'For Investors',
    items: [
      {
        q: 'Do investors see every startup on DecisionLab?',
        a: 'No. Investors only see startups that founders choose to make available or submit through the platform.',
      },
      {
        q: 'How are investor recommendations generated?',
        a: "Recommendations are based on the startup's profile, industry, funding stage, location, and other relevant characteristics to improve compatibility.",
      },
      {
        q: 'Can investors contact founders directly?',
        a: "If enabled by the founder or through the platform's communication features, investors can connect with founders directly after a successful match.",
      },
    ],
  },
];

export default function FAQPage() {
  // One open question across the entire page: "sectionId-index" or null.
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary px-6 py-20">
      <div className="mx-auto w-full max-w-[900px]">

        {/* ── Header ── */}
        <div className="text-center mb-16">
          <span className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] block mb-6">Help Center</span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight font-display leading-[0.95] mb-6">
            Frequently Asked <br className="hidden sm:block" /> Questions
          </h1>
          <p className="text-sm sm:text-base text-brand-text-secondary font-medium max-w-xl mx-auto leading-relaxed">
            Everything you need to know about DecisionLab — for founders, team members, and investors.
          </p>
        </div>

        {/* ── Sections ── */}
        <div className="space-y-12">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.id}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0">
                    <Icon size={18} />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-tight font-display">{section.title}</h2>
                </div>

                <div className="space-y-3">
                  {section.items.map((item, i) => {
                    const id = `${section.id}-${i}`;
                    const open = openId === id;
                    return (
                      <div
                        key={id}
                        className={`bg-brand-section border rounded-[1.75rem] overflow-hidden transition-colors duration-300 ${open ? 'border-brand-accent/40' : 'border-brand-border hover:border-brand-accent/25'}`}
                      >
                        <button
                          id={`faq-button-${id}`}
                          aria-expanded={open}
                          aria-controls={`faq-panel-${id}`}
                          onClick={() => setOpenId(open ? null : id)}
                          className="w-full flex items-center justify-between gap-5 px-6 sm:px-8 py-5 text-left group"
                        >
                          <span className="text-sm sm:text-base font-black uppercase tracking-tight text-brand-text-primary group-hover:text-brand-accent transition-colors duration-300">
                            {item.q}
                          </span>
                          {/* + that smoothly becomes − : vertical bar rotates away */}
                          <span aria-hidden="true" className="relative w-5 h-5 shrink-0">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-[2px] rounded-full bg-brand-accent" />
                            <span
                              className={`absolute left-1/2 top-0 -translate-x-1/2 h-5 w-[2px] rounded-full bg-brand-accent transition-all duration-300 ${open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}
                            />
                          </span>
                        </button>
                        <div
                          id={`faq-panel-${id}`}
                          role="region"
                          aria-labelledby={`faq-button-${id}`}
                          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                        >
                          <div className="overflow-hidden">
                            <p className="px-6 sm:px-8 pb-6 text-sm text-brand-text-secondary font-medium leading-relaxed">
                              {item.a}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* ── Still stuck ── */}
        <p className="text-center text-xs text-brand-text-muted font-medium mt-16">
          Didn't find your answer?{' '}
          <a href="/contact" className="text-brand-accent font-black hover:underline">Contact us</a> — we read everything.
        </p>
      </div>
    </div>
  );
}