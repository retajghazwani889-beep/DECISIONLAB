import React from 'react';
import { motion } from 'motion/react';
import { 
  Rocket, 
  Shield, 
  Target, 
  BarChart3, 
  Search, 
  Zap, 
  ArrowRight, 
  ChevronRight,
  Globe,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-accent/5 blur-[160px] rounded-full -mr-96 -mt-96 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-purple/5 blur-[140px] rounded-full -ml-40 -mb-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block text-[10px] md:text-[12px] font-black tracking-[0.8em] text-[#5da9ff] uppercase mb-8 drop-shadow-[0_0_10px_rgba(93,169,255,0.45)]">
              About Us
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-brand-text-primary mb-10 tracking-tight leading-[1.05] font-display max-w-5xl mx-auto">
              Streamline your startup journey <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-text-primary via-brand-text-primary to-brand-accent/60 font-medium" style={{ fontFamily: 'system-ui' }}>
                From idea to investment
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl md:text-2xl text-slate-200 leading-relaxed font-medium mb-12 opacity-95 tracking-[0.02em]">
              Validate smarter. Build faster. Raise capital with confidence. Every insight, strategy, and investor-ready document you need to turn an idea into a fundable startup.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/analyze">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 bg-brand-accent text-brand-bg font-black uppercase tracking-[0.15em] text-sm rounded-full shadow-[0_0_30px_rgba(93,169,255,0.3)] hover:shadow-[0_0_50px_rgba(93,169,255,0.5)] transition-all duration-300"
                >
                  Start Now
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PLATFORM PHILOSOPHY */}
      <section className="py-24 px-6 border-y border-white/5 bg-brand-section/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-[10px] font-black tracking-[0.8em] text-[#5da9ff] uppercase mb-6 block drop-shadow-[0_0_10px_rgba(93,169,255,0.45)]">
                About Us
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-brand-text-primary mb-8 tracking-tight font-display leading-[1.15]">
                Why DecisionLab <br /> exists
              </h2>
              <div className="space-y-6 text-xl text-slate-200 leading-[1.8] font-medium opacity-95 tracking-[0.02em]">
                <p>
                  Founders shouldn't have to switch between countless tools to build one company.
                </p>
                <p>
                  DecisionLab unifies startup validation, market research, strategy, fundraising, and pitch creation in one workspace.
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-[3.5rem] bg-brand-card/40 border border-brand-border/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent pointer-events-none" />
              <div className="grid grid-cols-2 gap-6 relative z-10">
                {[
                  { label: "Execution", value: "88%", icon: Zap },
                  { label: "Market Match", value: "High", icon: Target },
                  { label: "Risk Safety", value: "Verified", icon: Shield },
                  { label: "Capital Efficiency", value: "Auto", icon: BarChart3 }
                ].map((stat, i) => (
                  <div key={i} className="p-8 rounded-3xl bg-brand-bg/50 border border-white/5">
                    <stat.icon className="w-6 h-6 text-brand-accent mb-4 opacity-70" />
                    <div className="text-2xl font-black text-brand-text-primary mb-1">{stat.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-secondary opacity-60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. WHAT DECISIONLAB DOES */}
      <section className="py-24 px-6 bg-[#102434]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[10px] font-black tracking-[0.8em] text-[#5da9ff] uppercase mb-6 block drop-shadow-[0_0_10px_rgba(93,169,255,0.45)]">
              Capabilities
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight font-display text-center uppercase">
              What we do
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Business Review",
                desc: "Check your logic and market fit",
                icon: BarChart3,
                color: "brand-accent"
              },
              {
                title: "Goal Planning",
                desc: "Roadmaps that link goals with growth",
                icon: Target,
                color: "brand-purple"
              },
              {
                title: "Market Facts",
                desc: "Real-world data to prove your plan",
                icon: Search,
                color: "brand-cyan"
              },
              {
                title: "Team Focus",
                desc: "Turn plans into tasks for your team",
                icon: Zap,
                color: "brand-emerald"
              },
              {
                title: "Investor Prep",
                desc: "Get your data ready for meeting VC",
                icon: Shield,
                color: "brand-amber"
              },
              {
                title: "Risk Review",
                desc: "Find weak spots before they hit",
                icon: Rocket,
                color: "brand-coral"
              }
            ].map((module, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="p-10 rounded-[2.5rem] bg-brand-section/50 border border-brand-border/40 relative group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-${module.color}/10 flex items-center justify-center mb-8 border border-${module.color}/20 group-hover:scale-110 transition-transform duration-500`}>
                  <module.icon className={`w-6 h-6 text-${module.color}`} />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase mb-4 tracking-tight">
                  {module.title}
                </h3>
                <p className="text-base md:text-lg font-medium text-white leading-relaxed tracking-[0.02em] opacity-100">
                  {module.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (Workflow) */}
      <section className="py-24 px-6 bg-[#102434] overflow-hidden relative border-y border-white/5">
        {/* Subtle grid pattern and technical constellations */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5da9ff" strokeWidth="0.5" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#roadGrid)" />
            <circle cx="15%" cy="30%" r="1.5" fill="#5da9ff" opacity="0.6" />
            <circle cx="85%" cy="25%" r="1" fill="#5da9ff" opacity="0.4" />
            <circle cx="45%" cy="80%" r="2" fill="#5da9ff" opacity="0.5" />
            <circle cx="65%" cy="70%" r="1" fill="#5da9ff" opacity="0.3" />
            <line x1="15%" y1="30%" x2="45%" y2="80%" stroke="#5da9ff" strokeWidth="0.5" opacity="0.1" />
            <line x1="85%" y1="25%" x2="65%" y2="70%" stroke="#5da9ff" strokeWidth="0.5" opacity="0.08" />
          </svg>
        </div>

        {/* Founding vision quote + workflow label — same block as the journey wave */}
        <div className="max-w-5xl mx-auto text-center relative z-10 pt-12 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-10"
          >
            <h2 className="text-5xl md:text-7xl font-black text-brand-text-primary tracking-tighter leading-tight font-display italic">
              "Ideas are everywhere — great decisions are rare"
            </h2>
            <p className="text-base md:text-xl font-black text-[#5da9ff] uppercase tracking-[0.35em] drop-shadow-[0_0_12px_rgba(93,169,255,0.45)]">
              DecisionLab's Workflow
            </p>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto relative min-h-[520px]">
          {/* Futuristic Data Stream connecting steps on desktop */}
          <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 1200 320" 
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <style>{`
                @keyframes dataPulse {
                  to {
                    stroke-dashoffset: -100;
                  }
                }
                .animate-data-stream {
                  animation: dataPulse 4s linear infinite;
                }
              `}</style>
              
              {[
                { d: "M 100,165 C 200,165 200,60 300,60", id: 0 },
                { d: "M 300,60 C 400,60 400,270 500,270", id: 1 },
                { d: "M 500,270 C 600,270 600,60 700,60", id: 2 },
                { d: "M 700,60 C 800,60 800,270 900,270", id: 3 },
                { d: "M 900,270 C 1000,270 1000,165 1100,165", id: 4 }
              ].map((segment, pathIdx) => {
                // Segment is active if stream has passed this connection
                const isSegmentActive = pathIdx < activeStep;
                return (
                  <g key={segment.id}>
                    {/* Underlying blur glow for active pathway */}
                    <path
                      d={segment.d}
                      fill="none"
                      stroke={isSegmentActive ? "#5da9ff" : "#1e4761"}
                      strokeWidth={isSegmentActive ? 12 : 2}
                      className="transition-all duration-700 opacity-20"
                      style={{
                        filter: isSegmentActive ? "blur(8px)" : "none"
                      }}
                    />
                    {/* Base pathway line */}
                    <path
                      d={segment.d}
                      fill="none"
                      stroke={isSegmentActive ? "#5da9ff" : "#1e4761"}
                      strokeWidth={1.5}
                      className="transition-all duration-700"
                      opacity={isSegmentActive ? 1 : 0.25}
                    />
                    {/* Moving pulse overlay */}
                    {isSegmentActive && (
                      <path
                        d={segment.d}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={2}
                        strokeDasharray="15 80"
                        className="animate-data-stream"
                        opacity="0.8"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Steps Content Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-12 relative z-10 pt-16">
            {[
              { label: "SUBMIT", desc: "Share your startup" },
              { label: "ANALYZE", desc: "Evaluate your potential" },
              { label: "VALIDATE", desc: "Confirm market fit" },
              { label: "RISK MITIGATION", desc: "Reduce business risks" },
              { label: "BUSINESS READINESS", desc: "Prepare for investment" },
              { label: "SCALE", desc: "Scale with confidence" }
            ].map((step, i) => {
              const isStepActive = i === activeStep;
              const offsetClass = 
                i === 0 ? "lg:pt-24" :
                i === 1 ? "lg:pt-2" :
                i === 2 ? "lg:pt-48" :
                i === 3 ? "lg:pt-2" :
                i === 4 ? "lg:pt-48" :
                "lg:pt-24";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onMouseEnter={() => setActiveStep(i)}
                  onClick={() => setActiveStep(i)}
                  className={`flex flex-col items-center text-center lg:items-center relative transition-all duration-500 cursor-pointer select-none group/step ${offsetClass}`}
                >
                  {/* 3D glass-morphic sphere container */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center relative z-20 transition-all duration-500 mb-6 ${
                    isStepActive 
                      ? "bg-gradient-to-b from-[#102434]/50 to-[#102434]/80 backdrop-blur-xl border-2 border-[#5da9ff] shadow-[0_0_25px_rgba(93,169,255,0.45),inset_0_4px_12px_rgba(255,255,255,0.08),inset_0_-4px_12px_rgba(93,169,255,0.15)] scale-110" 
                      : "bg-gradient-to-b from-[#102434]/20 to-[#102434]/40 backdrop-blur-sm border border-[#1e4761]/40 scale-100 group-hover/step:border-[#5da9ff]/40"
                  }`}>
                    {/* Pulsing core / Custom vision glow inside */}
                    <div className={`w-4 h-4 rounded-full transition-all duration-500 flex items-center justify-center ${
                      isStepActive 
                        ? "bg-[#5da9ff] animate-pulse shadow-[0_0_20px_rgba(93,169,255,1)]" 
                        : "bg-[#1e4761]/60"
                    }`}>
                      {isStepActive && (
                        <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-30 pointer-events-none" />
                      )}
                    </div>
                  </div>

                  {/* Step Title & Subtext */}
                  <div className="relative z-10 px-2 lg:h-[180px]">
                    <span className="text-[10px] font-bold font-mono text-[#5da9ff]/80 block mb-1 tracking-wider uppercase">
                      PHASE 0{i + 1}
                    </span>
                    <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-3 leading-tight">
                      {step.label}
                    </h4>
                    <p className="text-sm md:text-base font-medium text-white opacity-95 leading-snug tracking-[0.02em] max-w-[170px] mx-auto uppercase">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Caption under the journey wave */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10 mt-28 text-center max-w-2xl mx-auto text-2xl md:text-3xl text-slate-200 font-medium italic opacity-95 leading-relaxed tracking-[0.02em]"
          >
            DecisionLab empowers founders to build with clarity, confidence, and purpose
          </motion.p>
        </div>
      </section>

      {/* (Founding vision quote moved above the workflow wave) */}

      {/* 6. CLOSING CTA */}
      <section className="py-24 px-6 border-t border-brand-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="p-16 md:p-24 rounded-[4rem] bg-brand-section/80 border border-brand-border/60 relative overflow-hidden text-center group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(93,169,255,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-brand-text-primary mb-12 tracking-tight group-hover:translate-y-[-4px] transition-transform duration-500">
                Validate before <br className="md:hidden" /> you scale
              </h2>
              <Link to="/analyze">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 py-6 bg-brand-accent text-brand-bg font-black uppercase tracking-[0.2em] text-sm rounded-full shadow-huge hover:shadow-[0_0_60px_rgba(93,169,255,0.4)] transition-all duration-300"
                >
                  Enter the Dashboard
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;