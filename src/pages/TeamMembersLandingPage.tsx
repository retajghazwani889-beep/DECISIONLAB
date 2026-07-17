import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Handshake, ArrowRight, FileText, Bookmark,
  Briefcase, Rocket, Check,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TeamMembersLandingPage — the public "what DecisionLab does for team members"
// page. Mirrors the Investor Network page's role for investors: explains the
// value, shows how it works, and sends visitors into team-member signup.
// ─────────────────────────────────────────────────────────────────────────────

const ROLES = ['Co-Founder', 'Developer', 'Designer', 'Marketing', 'Sales', 'Operations', 'Finance', 'Advisor'];

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create Your Profile',
    body: 'Pick your role, list your skills, and upload your CV — founders see it with every application you send.',
  },
  {
    icon: Search,
    title: 'Browse Real Openings',
    body: 'Positions published by founders building validated startups — filtered by role, industry, and stage.',
  },
  {
    icon: Handshake,
    title: 'Apply & Connect',
    body: "One-click applications. When a founder accepts you, you get their contact details directly — and you're on the team.",
  },
];

const PERKS = [
  'Join startups from day one',
  'Your CV and profile sent automatically with every application',
  'Track every application and its status in one dashboard',
  'Save positions to come back to',
  'Direct founder contact when accepted — no middleman',
  'Completely free for team members',
];

export default function TeamMembersLandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">

      {/* ── Hero ── */}
      <section className="px-6 pt-24 pb-20 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-accent/[0.04] blur-[140px] rounded-full pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="w-16 h-16 mx-auto mb-8 rounded-3xl bg-[#5da9ff]/10 border border-[#5da9ff]/40 flex items-center justify-center text-[#5da9ff] shadow-[0_0_18px_rgba(93,169,255,0.35)]">
            <Users size={28} />
          </div>
          <span className="text-[11px] font-black text-[#5da9ff] uppercase tracking-[0.4em] block mb-6 drop-shadow-[0_0_10px_rgba(93,169,255,0.45)]">For Team Members</span>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight font-display leading-[0.95] mb-6">
            Join the startups <br className="hidden sm:block" /> building what's next
          </h1>
          <p className="text-base sm:text-lg text-brand-text-secondary font-medium max-w-xl mx-auto leading-relaxed mb-10">
            Founders on DecisionLab are validating real startups — and hiring developers, designers, marketers, and advisors to build them. Find your team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup/team')}
              className="w-full sm:w-auto px-10 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-huge shadow-brand-accent/20 flex items-center justify-center gap-2"
            >
              Join as Team Member <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-10 py-4 bg-brand-card border border-white/10 text-brand-text-primary text-[11px] font-black uppercase tracking-widest rounded-2xl hover:border-brand-accent/40 active:scale-95 transition-all"
            >
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest mb-5">Founders are looking for</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {ROLES.map((r) => (
              <span key={r} className="px-5 py-2.5 rounded-xl bg-brand-section border border-brand-border text-[11px] font-black uppercase tracking-wider text-brand-text-secondary">
                {r}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-20 bg-brand-section/40 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="bg-brand-card border border-white/5 rounded-[2rem] p-8 hover:border-brand-accent/40 transition-all">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0">
                      <Icon size={22} />
                    </div>
                    <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Step {i + 1}</span>
                  </div>
                  <h3 className="text-base font-black uppercase tracking-tight mb-3">{s.title}</h3>
                  <p className="text-sm text-brand-text-secondary font-medium leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Perks ── */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display text-center mb-10">Why join through DecisionLab</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PERKS.map((p) => (
              <div key={p} className="flex items-start gap-3 bg-brand-section border border-[#5da9ff]/30 rounded-2xl px-5 py-4 shadow-[0_0_14px_rgba(93,169,255,0.10)] hover:border-[#5da9ff]/60 hover:shadow-[0_0_22px_rgba(93,169,255,0.22)] transition-all">
                <Check size={15} className="text-[#5da9ff] shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-brand-text-secondary leading-relaxed">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto text-center bg-brand-section border border-brand-border rounded-[3rem] p-12">
          <Rocket size={32} className="mx-auto text-brand-accent mb-6" />
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-display mb-4">Ready to join a founder's team?</h2>
          <p className="text-sm text-brand-text-secondary font-medium mb-8 max-w-md mx-auto">Create your free team member account, build your profile, and start applying in minutes.</p>
          <button
            onClick={() => navigate('/signup/team')}
            className="px-12 py-4 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-huge shadow-brand-accent/20 inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}