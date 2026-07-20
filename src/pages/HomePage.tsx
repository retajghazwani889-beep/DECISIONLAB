import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import StartupForm from '../components/StartupForm';
import { cn } from '../lib/utils';
import CinematicDemo from '../components/CinematicDemo';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  Rocket, 
  Target, 
  BarChart3, 
  Globe, 
  Play, 
  CheckCircle2, 
  X,
  ArrowRight,
  Zap,
  Layers
} from 'lucide-react';

interface HomePageProps {
  user: User | null;
  profile: UserProfile | null;
  onOpenAccess?: () => void;
}

export default function HomePage({ user, profile, onOpenAccess }: HomePageProps) {
  const [activePreview, setActivePreview] = useState<{
    type: 'targets' | 'capability';
    title: string;
    desc: string;
    items?: string[];
  } | null>(null);
  const navigate = useNavigate();

  const handleAction = (type: 'targets' | 'capability', title: string, desc: string, items?: string[]) => {
    if (!user) {
      setActivePreview({ type, title, desc, items });
    } else {
      // Just set the preview even if logged in, so they can see the strategic info
      setActivePreview({ type, title, desc, items });
    }
  };

  return (
    <div className="relative overflow-hidden bg-brand-bg text-brand-text-primary selection:bg-brand-accent/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-gradient-to-b from-brand-accent/[0.03] to-transparent" />
        <div className="absolute top-[20%] -right-[10%] w-[800px] h-[800px] bg-brand-accent/[0.02] blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] -left-[10%] w-[800px] h-[800px] bg-brand-accent/[0.02] blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)`, backgroundSize: '48px 48px' }} />
      </div>

      {/* Hero Section */}
      <section id="hero" className="relative pt-36 md:pt-64 pb-16 md:pb-32 px-6 md:px-10 overflow-hidden bg-brand-bg">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left relative z-10"
          >
            <h1 className="text-center text-5xl sm:text-7xl md:text-[85px] font-extrabold tracking-[-0.02em] text-white mb-12 md:mb-28 leading-[0.95] font-display uppercase max-w-4xl">
              Turn <span className="text-[#60A5FA] drop-shadow-[0_0_18px_rgba(96,165,250,0.55)]">Vision</span> <br className="hidden md:block" /> Into Reality
            </h1>

            <p className="text-lg md:text-xl text-brand-text-primary max-w-2xl mb-16 md:mb-32 leading-[1.7] font-medium opacity-90">
              Startup validation, team building, pitch decks, and investor matching — turning your ideas into plans investors trust
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50, rotateY: -10 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="relative z-10 perspective-1000"
          >
            {/* Logged-out visitors who submit an idea are sent to the signup
                role picker (Founder / Investor / Team Member) instead of the
                old access modal. Their idea is remembered and the analysis
                resumes automatically after they finish signing up. */}
            <StartupForm user={user} profile={profile} onOpenAccess={() => navigate('/signup')} />
          </motion.div>
        </div>
      </section>

      {/* How it Works / Cinematic Demo */}
      <section className="py-48 px-4 relative overflow-hidden bg-brand-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-brand-section border border-[#5da9ff]/30 text-[#5da9ff] text-xs font-black uppercase tracking-[0.4em] mb-12 shadow-2xl drop-shadow-[0_0_10px_rgba(93,169,255,0.35)]"
            >
              <Layers size={14} /> How it works
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-[-0.03em] mb-10 text-brand-text-primary uppercase font-display leading-[0.9]"
            >
              How we <br />
              <span className="text-brand-accent">help founders</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl text-brand-text-muted max-w-3xl mx-auto font-medium leading-relaxed opacity-80"
            >
              Your idea goes in. A clear plan comes out.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <CinematicDemo />
            
            {/* Ambient Background for Demo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-accent/[0.03] blur-[100px] -z-10 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Live Signals Bar */}
      <section className="py-24 border-y border-white/5 bg-brand-section relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap lg:flex-nowrap items-stretch justify-between gap-12 lg:gap-20">
            {[
              { label: 'Instant Analysis', value: '✓', desc: 'Reports in minutes', color: 'text-[#dbe4ea]', size: '50px' },
              { label: 'Clear Insights', value: '✓', desc: 'Easy to understand', color: 'text-[#e3e7e9]', size: '50px' },
              { label: 'Better Pitches', value: '✓', desc: 'Investor-ready decks', color: 'text-[#cfdde6]', size: '50px' },
              { label: 'Risk Checks', value: '✓', desc: 'Know your weak spots', color: 'text-[#deeaf1]', size: '50px' },
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col text-center md:text-left h-auto font-display min-w-[200px]"
              >
                <div className="flex flex-col justify-start gap-3">
                   <p className="text-xl md:text-2xl font-medium text-brand-accent uppercase tracking-[0.12em] leading-relaxed overflow-visible whitespace-nowrap">
                     {stat.label}
                   </p>
                   <p className={cn("text-base md:text-lg font-normal opacity-60 leading-relaxed tracking-[0.06em] px-1", stat.color)}>
                     {stat.desc}
                   </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investor Section */}
      <section className="py-48 px-4 bg-brand-bg relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-brand-accent/[0.03] blur-[180px] rounded-full -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-brand-bg border border-[#5da9ff]/30 text-[#5da9ff] text-xs font-black uppercase tracking-[0.4em] mb-12 drop-shadow-[0_0_10px_rgba(93,169,255,0.35)]">
              Venture Network
            </div>
            <h2 className="text-5xl sm:text-6xl md:text-[8rem] font-black text-brand-text-primary mb-12 font-display tracking-[-0.04em] leading-[0.85]">
              FOUNDER <br />
              <span className="text-[#8cb5e4]">MATCHING</span>
            </h2>
            <p className="text-xl md:text-2xl text-[#dfe8ed] font-medium max-w-3xl mx-auto leading-relaxed opacity-[0.95] tracking-[0.02em]">
              Get your startup investor-ready and understand which type of investor fits your stage and niche
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {[
              {
                type: 'ANGELS',
                title: 'ANGEL PARTNERS',
                desc: 'Experienced founders and experts who back startups at the earliest stage',
                features: ['HANDS-ON SUPPORT', 'FAST DECISIONS', 'TRUSTED INTROS']
              },
              {
                type: 'VCS',
                title: 'VC FIRMS',
                desc: 'Venture firms looking for startups that can grow big',
                features: ['SERIES-A FUNDING', 'GLOBAL REACH', 'TOP TALENT']
              },
              {
                type: 'SYNDICATES',
                title: 'STRATEGIC SYNDICATES',
                desc: 'Industry networks that help startups grow faster',
                features: ['QUICK REVIEWS', 'WIDER EXPOSURE', 'STRONG NETWORKS']
              }
            ].map((tier, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -15, scale: 1.02 }}
                className="relative p-12 rounded-[4rem] bg-brand-card border border-[#5da9ff]/15 shadow-huge group/card transition-all duration-300 hover:border-[#5da9ff]/35 hover:shadow-[0_0_20px_rgba(93,169,255,0.1)]"
              >
                <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest mb-16 bg-[#5da9ff]/10 text-[#5da9ff]">
                   <div className="w-2 h-2 rounded-full bg-[#5da9ff] animate-pulse" />
                   {tier.type}
                </div>
                <h3 className={`font-black text-white mb-8 font-display tracking-tight uppercase leading-none whitespace-nowrap ${idx === 2 ? 'text-[26px]' : 'text-2xl md:text-3xl'}`}>{tier.title}</h3>
                <p className="text-white text-[17px] leading-relaxed mb-12 font-medium opacity-100 tracking-[0.02em]">{tier.desc}</p>
                
                <ul className="space-y-6 mb-16">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-5 text-base md:text-lg font-medium text-white uppercase tracking-[0.02em] group/li whitespace-nowrap">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-[#5da9ff] bg-[#5da9ff]/20 group-hover/li:bg-[#5da9ff] transition-colors" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handleAction('targets', tier.title, tier.desc, tier.features)}
                  className="w-full py-8 bg-[#5da9ff]/10 hover:bg-[#5da9ff]/20 border border-[#5da9ff]/20 rounded-[2.5rem] text-sm font-semibold uppercase tracking-[0.3em] hover:shadow-glow transition-all duration-500 active:scale-95 text-white"
                >
                  LEARN MORE
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Network Section — after Founder Matching */}
      <section className="py-48 px-4 bg-brand-section relative overflow-hidden border-t border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-brand-accent/[0.03] blur-[160px] rounded-full -z-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-brand-bg border border-[#5da9ff]/30 text-[#5da9ff] text-xs font-black uppercase tracking-[0.4em] mb-12 drop-shadow-[0_0_10px_rgba(93,169,255,0.35)]">
              Team Network
            </div>
            <h2 className="text-5xl sm:text-6xl md:text-[8rem] font-black text-brand-text-primary mb-12 font-display tracking-[-0.04em] leading-[0.85]">
              TEAM <br />
              <span className="text-[#8cb5e4]">MATCHING</span>
            </h2>
            <p className="text-xl md:text-2xl text-[#dfe8ed] font-medium max-w-3xl mx-auto leading-relaxed opacity-[0.95] tracking-[0.02em]">
              Founders publish the roles they need — developers, designers, marketers, and advisors apply and join
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* ── Linking-members graphic ── */}
            <div className="relative mx-auto w-full max-w-[440px] aspect-square select-none">
              {/* Connector lines */}
              <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
                {[
                  [200, 200, 200, 52], [200, 200, 330, 118], [200, 200, 330, 282],
                  [200, 200, 200, 348], [200, 200, 70, 282], [200, 200, 70, 118],
                ].map(([x1, y1, x2, y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="rgba(93,169,255,0.25)" strokeWidth="1.5" strokeDasharray="4 5" />
                ))}
                {[[200, 52], [330, 118], [330, 282], [200, 348], [70, 282], [70, 118]].map(([cx, cy], i) => (
                  <circle key={'d' + i} cx={cx} cy={cy} r="3" fill="#5da9ff" opacity="0.7" />
                ))}
              </svg>

              {/* Center: the startup */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-[2rem] bg-brand-bg border border-brand-accent/40 shadow-huge shadow-brand-accent/10 flex flex-col items-center justify-center gap-1.5 animate-pulse">
                <Rocket size={26} className="text-brand-accent" />
                <span className="text-[8px] font-black uppercase tracking-widest text-brand-text-muted">Startup</span>
              </div>

              {/* Member nodes around it */}
              {[
                { role: 'Developer', initials: 'DV', top: '13%', left: '50%' },
                { role: 'Designer', initials: 'DS', top: '29.5%', left: '82.5%' },
                { role: 'Marketing', initials: 'MK', top: '70.5%', left: '82.5%' },
                { role: 'Advisor', initials: 'AD', top: '87%', left: '50%' },
                { role: 'Sales', initials: 'SL', top: '70.5%', left: '17.5%' },
                { role: 'Co-Founder', initials: 'CF', top: '29.5%', left: '17.5%' },
              ].map((m) => (
                <div key={m.role} style={{ top: m.top, left: m.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
                  <div className="w-14 h-14 rounded-2xl bg-brand-card border border-[#5da9ff]/50 flex items-center justify-center text-[#5da9ff] font-black text-sm shadow-[0_0_16px_rgba(93,169,255,0.35)] hover:border-[#5da9ff] hover:shadow-[0_0_24px_rgba(93,169,255,0.55)] hover:scale-110 transition-all">
                    {m.initials}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-brand-text-muted whitespace-nowrap">{m.role}</span>
                </div>
              ))}
            </div>

            {/* ── Copy + CTAs ── */}
            <div>
              <ul className="space-y-6 mb-12">
                {[
                  'Map the roles your startup needs, right inside your workspace',
                  'Team members share their profile, skills, and CV with you in one click',
                  'Add people to your team and manage everyone from one place',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-5 text-base md:text-lg font-medium text-white leading-relaxed">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-[#5da9ff] bg-[#5da9ff]/20 mt-2 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/team-members')}
                  className="px-10 py-5 bg-brand-accent text-brand-bg text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-huge shadow-brand-accent/20 flex items-center justify-center gap-2"
                >
                  <Users size={16} /> Join a Team
                </button>
                <button
                  onClick={() => navigate(user ? '/startups' : '/signup/founder')}
                  className="px-10 py-5 bg-brand-bg border border-[#5da9ff]/20 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:border-[#5da9ff]/50 active:scale-95 transition-all"
                >
                  Hire for My Startup
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Preview Modal for Logged-Out Users */}
      <AnimatePresence>
        {activePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePreview(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[760px] bg-brand-section rounded-2xl border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_24px_48px_-12px_rgba(0,0,0,0.8)] overflow-hidden group"
            >
              <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="p-8 md:p-10 relative z-10 flex flex-col gap-8">
                <div className="flex justify-between items-center">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-brand-bg border border-white/5 text-brand-accent text-[11px] font-black uppercase tracking-[0.3em]">
                    {activePreview.type === 'targets' ? 'Network Identification' : 'Analysis Protocol'}
                  </div>
                  <button 
                    onClick={() => setActivePreview(null)}
                    className="w-10 h-10 flex items-center justify-center bg-brand-bg hover:bg-white/5 rounded-xl text-brand-text-muted hover:text-white transition-all active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-3xl md:text-4xl font-extrabold text-brand-text-primary tracking-tight uppercase font-display leading-[1.15]">
                    {activePreview.title}
                  </h3>
                  <p className="text-base text-brand-text-primary leading-relaxed opacity-80 font-medium max-w-2xl">
                    {activePreview.desc}
                  </p>
                </div>

                {activePreview.type === 'targets' && activePreview.items && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.4em] opacity-50">Sample High-Probability Partners</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {activePreview.items.map((item, i) => (
                        <div key={i} className="flex flex-col justify-between items-start p-6 rounded-xl bg-brand-bg/65 border border-white/5 hover:border-brand-accent/30 hover:shadow-xl transition-all group/item min-h-[140px]">
                          <div className="w-12 h-12 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent group-hover/item:bg-brand-accent group-hover/item:text-brand-text-primary transition-all mb-4">
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <span className="text-sm font-black text-brand-text-primary uppercase tracking-wide leading-snug">{item}</span>
                            <p className="text-[12px] text-slate-300 font-medium tracking-[0.02em] mt-1 opacity-95 leading-normal">High-conviction venture validation activated</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch pt-4 border-t border-white/5">
                  <div className="p-5 bg-brand-accent/5 border border-brand-accent/10 rounded-xl relative overflow-hidden flex flex-col justify-center">
                     <Zap size={32} className="absolute top-4 right-4 text-brand-accent opacity-5" />
                     <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mb-1.5">Verification Required</p>
                     <p className="text-sm font-semibold text-slate-200 opacity-95 leading-relaxed tracking-[0.02em]">
                        To unlock full mapping and performance analytics, initialize your venture brief
                     </p>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <button 
                      onClick={() => {
                        setActivePreview(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-4 btn-premium-start text-white font-bold uppercase tracking-[0.05em] text-xs rounded-xl shadow-huge transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      Start Now <ArrowRight size={18} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}