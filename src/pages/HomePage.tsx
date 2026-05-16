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
      <section id="hero" className="relative pt-44 pb-32 px-4 overflow-hidden bg-brand-bg">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left relative z-10"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-6 px-8 py-4 rounded-2xl bg-brand-section border border-white/5 text-brand-accent text-sm font-black uppercase tracking-[0.4em] mb-16 shadow-2xl"
            >
              <div className="w-3 h-3 rounded-full bg-brand-accent animate-ping" />
              Institutional Grade Analysis
            </motion.div>
            
            <h1 className="text-6xl md:text-[104px] font-black tracking-[-0.04em] text-white mb-12 leading-[0.85] font-display uppercase">
              Would <span className="text-brand-accent text-glow">Investors</span> <br />
              Fund Your Venture?
            </h1>

            <p className="text-[19px] text-brand-text-primary max-w-3xl mb-16 leading-relaxed font-medium opacity-90">
              The most sophisticated venture analysis layer. Map your startup against institutional benchmarks used by the top 1% of VC partners.
            </p>

            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex -space-x-4">
                {[1, 12, 3, 24].map(i => (
                   <motion.img 
                    key={i} 
                    whileHover={{ scale: 1.1, zIndex: 10, rotate: 5 }}
                    src={`https://i.pravatar.cc/100?u=${i+10}`} 
                    className="w-14 h-14 rounded-2xl border-4 border-brand-bg shadow-2xl cursor-pointer" 
                   />
                ))}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-[#b1bfc8] font-black uppercase tracking-widest">Trusted by Pioneers</p>
                <div className="flex items-center gap-3">
                   <div className="flex text-brand-amber text-xs gap-1">
                      {[1, 2, 3, 4, 5].map(star => <span key={star}>★</span>)}
                   </div>
                   <span className="text-sm text-brand-text-muted font-black uppercase tracking-[0.2em] opacity-50">1,200+ Founding Teams</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50, rotateY: -10 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="relative z-10 perspective-1000"
          >
            <StartupForm user={user} profile={profile} onOpenAccess={onOpenAccess || (() => {})} />
          </motion.div>
        </div>
      </section>

      {/* Trust Bar (Premium Logo Wall feel) */}
      <section className="py-20 border-y border-white/5 relative bg-brand-section">
        <div className="max-w-7xl mx-auto px-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
           <div className="flex flex-wrap justify-center md:justify-between items-center gap-12 md:gap-16 text-[#fcfdfe]">
              {['SEQUOIA MODEL', 'VC APPROVED', 'INSTITUTIONAL GRADE', 'VENTURE READY'].map((t, idx) => (
                <span key={idx} className={cn("text-xs font-black tracking-[0.6em] uppercase hover:text-brand-accent cursor-default transition-colors", idx === 0 ? "text-[#fcebeb]" : "text-[#ebf7fd]")}>{t}</span>
              ))}
           </div>
        </div>
      </section>

      {/* How it Works / Cinematic Demo */}
      <section className="py-48 px-4 relative overflow-hidden bg-brand-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-brand-section border border-white/5 text-brand-accent text-xs font-black uppercase tracking-[0.4em] mb-12 shadow-2xl"
            >
              <Layers size={14} /> Strategic Pipeline
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-[-0.03em] mb-10 text-brand-text-primary uppercase font-display leading-[0.9]"
            >
              How DecisionLab <br />
              <span className="text-brand-accent">Synthesizes Capital.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-sm md:text-2xl text-brand-text-muted max-w-3xl mx-auto font-medium leading-relaxed opacity-80"
            >
              Experience the cinematic sequence of our proprietary venture analysis model. From raw data to institutional-grade conviction in seconds.
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

      {/* Strategic Workflow */}
      <section className="py-48 px-4 relative overflow-hidden bg-brand-bg">
        <div className="absolute inset-0 bg-brand-bg -z-10" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-32">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-brand-bg border border-white/5 text-brand-accent text-xs font-black uppercase tracking-[0.4em] mb-12"
            >
              Operational Excellence
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-[-0.03em] mb-10 text-brand-text-primary uppercase font-display leading-[0.9]"
            >
              The <span className="text-[#b7dbfc]">Decision</span> Engine
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-sm md:text-2xl text-[#d4dde2] max-w-3xl mx-auto font-medium leading-relaxed opacity-80"
            >
              We've automated the first 40 hours of institutional venture analysis, giving you the raw insights required to command any room.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { step: "01", title: "Ingestion", desc: "Data sync via mission brief or uploaded pitch documentation." },
              { step: "02", title: "Synthesize", desc: "Our neural layer maps your model against 5,000+ benchmarked ventures." },
              { step: "03", title: "Visualize", desc: "Explore multi-dimensional radar maps and interactive risk heatmaps." },
              { step: "04", title: "Blueprint", desc: "Generate Sequoia-tier slide narratives designed for partner level review." },
              { step: "05", title: "Refine", desc: "Interactive editor to tune metrics, traction models, and positioning." },
              { step: "06", title: "Deploy", desc: "Institutional grade export suite for PDF, PPTX, or dynamic links." }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative p-12 rounded-[3.5rem] bg-brand-card border border-white/5 hover:bg-brand-section transition-all duration-700 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                   <span className="text-8xl md:text-9xl font-black text-brand-text-primary leading-none tracking-tighter">{item.step}</span>
                </div>
                <div className="flex flex-col gap-10 relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-brand-section text-brand-accent flex items-center justify-center text-sm font-black shadow-huge border border-white/5 group-hover:bg-brand-accent group-hover:text-brand-text-primary transition-all duration-500">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-2xl md:text-3xl font-black text-brand-text-primary mb-6 uppercase tracking-[-0.02em] font-display leading-tight">{item.title}</h4>
                    <p className="text-brand-text-muted text-xs leading-relaxed font-medium opacity-70">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Signals Bar */}
      <section className="py-24 border-y border-white/5 bg-brand-section relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 items-center">
            {[
              { label: 'Analyses Run', value: '14,802', desc: 'Real-time throughput', color: 'text-[#dbe4ea]', size: 'lg:text-[89px]' },
              { label: 'Signal Accuracy', value: '98.4%', desc: 'Verified by exit data', color: 'text-[#e3e7e9]', size: 'lg:text-[88px]' },
              { label: 'Pitch Success', value: '3.2x', desc: 'Higher funding rate', color: 'text-[#cfdde6]', size: 'lg:text-[86px]' },
              { label: 'Risk Coverage', value: 'Global', desc: 'Multi-market mapping', color: 'text-[#deeaf1]', size: 'lg:text-[87px]' },
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="text-center md:text-left"
              >
                <p className={cn("text-5xl font-black text-brand-text-primary tracking-[-0.04em] mb-4 font-display uppercase leading-none", stat.size)}>
                  {stat.value}
                </p>
                <p className="text-sm font-black text-brand-accent uppercase tracking-[0.4em] mb-4">{stat.label}</p>
                <p className={cn("text-xs font-bold uppercase tracking-[0.2em] opacity-40", stat.color)}>{stat.desc}</p>
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
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-brand-bg border border-white/5 text-brand-accent text-xs font-black uppercase tracking-[0.4em] mb-12">
              Venture Network
            </div>
            <h2 className="text-6xl md:text-[8rem] font-black text-brand-text-primary mb-12 font-display tracking-[-0.04em] leading-[0.85]">
              MATCH <br />
              <span className="text-[#8cb5e4]">SQUARING.</span>
            </h2>
            <p className="text-sm md:text-2xl text-[#dfe8ed] font-medium max-w-3xl mx-auto leading-relaxed opacity-80">
              We've mapped the cognitive bias of 8,000+ top-tier partners. We don't list funds; we identify individual partners likely to lead your vision.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {[
              {
                type: 'Angels',
                title: 'High-Net Parners',
                desc: 'Exited founders and niche-experts looking for asymmetrical early-stage risk.',
                features: ['Operational Synergy', 'Zero-Loss Velocity', 'High-Trust Ingress'],
                color: 'text-brand-blue',
                bg: 'bg-brand-blue/10'
              },
              {
                type: 'VCs',
                title: 'Tier-1 Institutional',
                desc: 'Global venture capital firms focusing on defensible moats and extreme scalability.',
                features: ['Series-A Pipeline', 'Cross-Border Scale', 'Talent Magnetism'],
                color: 'text-brand-accent',
                bg: 'bg-brand-accent/20'
              },
              {
                type: 'Syndicates',
                title: 'Strategic Pools',
                desc: 'Domain-specific networks designed to provide horizontal market acceleration.',
                features: ['Rapid Diligence', 'Massive Signal Boost', 'Ecosystem Integrity'],
                color: 'text-brand-purple',
                bg: 'bg-brand-purple/10'
              }
            ].map((tier, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -15, scale: 1.02 }}
                className="relative p-12 rounded-[4rem] bg-brand-card border border-white/5 shadow-huge group/card"
              >
                <div className={cn("inline-flex items-center gap-4 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest mb-16", tier.bg, tier.color)}>
                   <div className={cn("w-2 h-2 rounded-full bg-current animate-pulse")} />
                   {tier.type}
                </div>
                <h3 className="text-4xl font-black text-brand-text-primary mb-8 font-display tracking-tight uppercase leading-none">{tier.title}</h3>
                <p className="text-brand-text-muted text-xs leading-relaxed mb-16 font-medium opacity-70">{tier.desc}</p>
                
                <ul className="space-y-8 mb-20">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-5 text-sm font-black text-brand-text-muted uppercase tracking-[0.2em] group/li">
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-brand-accent group-hover/li:bg-brand-accent transition-colors" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handleAction('targets', tier.title, tier.desc, tier.features)}
                  className="w-full py-8 bg-brand-section border border-white/5 rounded-[2.5rem] text-sm font-black uppercase tracking-[0.3em] hover:bg-brand-accent hover:text-brand-text-primary hover:shadow-2xl transition-all duration-500 active:scale-95 text-brand-text-primary"
                >
                  View Matrix Targets
                </button>
              </motion.div>
            ))}
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
              className="absolute inset-0 bg-brand-bg/95 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-brand-section rounded-[4rem] border border-white/10 shadow-huge overflow-hidden group"
            >
              <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="p-12 md:p-16 relative z-10">
                <div className="flex justify-between items-start mb-12">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-brand-bg border border-white/5 text-brand-accent text-xs font-black uppercase tracking-[0.3em]">
                    {activePreview.type === 'targets' ? 'Network Identification' : 'Analysis Protocol'}
                  </div>
                  <button 
                    onClick={() => setActivePreview(null)}
                    className="w-12 h-12 flex items-center justify-center bg-brand-bg hover:bg-white/5 rounded-2xl text-brand-text-muted transition-all active:scale-90"
                  >
                    <X size={24} />
                  </button>
                </div>

                <h3 className="text-5xl md:text-7xl font-black text-brand-text-primary mb-8 tracking-tighter uppercase font-display leading-none">
                  {activePreview.title}
                </h3>
                <p className="text-sm text-brand-text-muted font-medium leading-relaxed mb-16">
                  {activePreview.desc}
                </p>

                {activePreview.type === 'targets' && activePreview.items && (
                  <div className="space-y-6 mb-16">
                    <p className="text-xs font-black text-brand-text-muted uppercase tracking-[0.5em] mb-4 opacity-40">Sample High-Probability Partners</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activePreview.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-5 p-6 rounded-[2rem] bg-brand-bg/50 border border-white/5 hover:border-brand-accent/30 transition-all group/item">
                          <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent group-hover/item:bg-brand-accent group-hover/item:text-brand-text-primary transition-all">
                            <CheckCircle2 size={24} />
                          </div>
                          <span className="text-sm font-black text-brand-text-primary uppercase tracking-tight">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="p-10 bg-brand-accent/10 border border-brand-accent/20 rounded-[2.5rem] relative overflow-hidden">
                     <Zap size={48} className="absolute top-4 right-4 text-brand-accent opacity-10" />
                     <p className="text-xs font-black text-brand-accent uppercase tracking-widest mb-4">Verification Required</p>
                     <p className="text-sm font-bold text-brand-text-primary leading-relaxed">
                        To unlock full institutional mapping and performance analytics, initialize your venture brief.
                     </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setActivePreview(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-7 bg-brand-accent text-brand-text-primary font-black uppercase tracking-[0.3em] text-xs rounded-3xl shadow-huge hover:bg-brand-accent/90 transition-all active:scale-95 flex items-center justify-center gap-4"
                  >
                    Execute Briefing <ArrowRight size={24} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
