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
            <span className="inline-block text-xs md:text-sm font-black tracking-[0.8em] text-brand-accent uppercase mb-8 opacity-80">
              Venture Analysis Protocol
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-brand-text-primary mb-10 tracking-tight leading-[1.05] font-display max-w-5xl mx-auto">
              Built for founders making <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-text-primary via-brand-text-primary to-brand-accent/60">
                consequential decisions.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-xs md:text-sm text-brand-text-secondary leading-relaxed font-medium mb-12 opacity-90">
              DecisionLab is a venture analysis and strategic insights platform designed for startups, 
              founders, and institutional operators who demand disciplined execution and absolute clarity.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/analyze">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-10 py-5 bg-brand-accent text-brand-bg font-black uppercase tracking-[0.15em] text-sm rounded-full shadow-[0_0_30px_rgba(93,169,255,0.3)] hover:shadow-[0_0_50px_rgba(93,169,255,0.5)] transition-all duration-300"
                >
                  Start Analysis
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
              <span className="text-xs font-black tracking-[0.8em] text-brand-accent uppercase mb-6 block opacity-70">
                The Philosophy
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-brand-text-primary mb-8 tracking-tight font-display leading-[1.15]">
                Why current execution <br /> is fragmented.
              </h2>
              <div className="space-y-6 text-sm text-brand-text-secondary leading-[1.8] font-medium opacity-90">
                <p>
                  Most startups fail not because of a lack of ideas, but because of a lack of structural clarity. 
                  In the early stages, every decision is a critical path variable that either reinforces the 
                  foundation or introduces systemic risk.
                </p>
                <p>
                  Fragmented decision-making lead to "execution drift"—where daily operations lose alignment 
                  with the core value hypothesis. DecisionLab exists to bridge the gap between abstract 
                  vision and institutional-grade output.
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
                  { label: "Execution Logic", value: "88%", icon: Zap },
                  { label: "Market Fit", value: "High", icon: Target },
                  { label: "Risk Mitigation", value: "Verified", icon: Shield },
                  { label: "Capital Eficiency", value: "Auto", icon: BarChart3 }
                ].map((stat, i) => (
                  <div key={i} className="p-8 rounded-3xl bg-brand-bg/50 border border-white/5">
                    <stat.icon className="w-6 h-6 text-brand-accent mb-4 opacity-70" />
                    <div className="text-2xl font-black text-brand-text-primary mb-1">{stat.value}</div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-text-secondary opacity-60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. WHAT DECISIONLAB DOES */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-xs font-black tracking-[0.8em] text-brand-accent uppercase mb-6 block opacity-70">
              Capabilities
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-brand-text-primary mb-6 tracking-tight font-display">
              Modular Analysis.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Venture Analysis",
                desc: "Multidimensional appraisal of core business logic, evaluating competitive advantage and unit economics.",
                icon: BarChart3,
                color: "brand-accent"
              },
              {
                title: "Strategic Mapping",
                desc: "Interactive roadmaps that synchronize milestones with market windows and capital requirements.",
                icon: Target,
                color: "brand-purple"
              },
              {
                title: "Market Validation",
                desc: "Real-time extraction of market signals to confirm or invalidate growth hypotheses.",
                icon: Search,
                color: "brand-cyan"
              },
              {
                title: "Tactical Execution",
                desc: "Translating high-level strategy into discrete, high-leverage execution units for the entire team.",
                icon: Zap,
                color: "brand-emerald"
              },
              {
                title: "Investor Preparation",
                desc: "Structuring venture data to withstand institutional-grade due diligence and investor scrutiny.",
                icon: Shield,
                color: "brand-amber"
              },
              {
                title: "Risk Exposure Systems",
                desc: "Mapping systemic vulnerabilities before they manifest as critical execution bottlenecks.",
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
                <h3 className="text-sm font-black text-brand-text-primary uppercase mb-4 tracking-tight">
                  {module.title}
                </h3>
                <p className="text-brand-text-secondary leading-relaxed font-medium opacity-80">
                  {module.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (Workflow) */}
      <section className="py-24 px-6 bg-brand-section/30 overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent -translate-y-1/2 hidden lg:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10">
            {[
              { label: "Ingest", desc: "Seed data collection" },
              { label: "Synthesize", desc: "Cross-modular processing" },
              { label: "Visualize", desc: "High-density reporting" },
              { label: "Blueprint", desc: "Execution structuring" },
              { label: "Refine", desc: "Iterative alignment" },
              { label: "Deploy", desc: "Market entry ready" }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center lg:items-start lg:text-left"
              >
                <div className="w-10 h-10 rounded-full bg-brand-bg border-2 border-brand-accent/40 flex items-center justify-center mb-6 z-20 shadow-[0_0_20px_rgba(93,169,255,0.2)]">
                  <span className="text-xs font-black text-brand-accent">{i + 1}</span>
                </div>
                <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-widest mb-2">
                  {step.label}
                </h4>
                <p className="text-xs font-medium text-brand-text-secondary opacity-60">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FOUNDING VISION (Manifesto) */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="w-16 h-1 w-2.5 bg-brand-accent mx-auto rounded-full opacity-50" />
            <h2 className="text-5xl md:text-7xl font-black text-brand-text-primary tracking-tighter leading-tight font-display italic">
              "Tactics without strategy is the noise before defeat."
            </h2>
            <div className="max-w-2xl mx-auto space-y-8 text-sm md:text-2xl text-brand-text-secondary font-medium italic opacity-80 leading-relaxed">
              <p>
                DecisionLab was founded on a singular conviction: that disciplined founders deserve 
                institutional-grade tools. We believe that clarity is the ultimate competitive advantage.
              </p>
              <p>
                Execution is not just about moving fast—it's about moving in the correct direction 
                with surgical precision.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. CLOSING CTA */}
      <section className="py-24 px-6 border-t border-brand-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="p-16 md:p-24 rounded-[4rem] bg-brand-section/80 border border-brand-border/60 relative overflow-hidden text-center group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(93,169,255,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-brand-text-primary mb-12 tracking-tight group-hover:translate-y-[-4px] transition-transform duration-500">
                Validate before <br className="md:hidden" /> you scale.
              </h2>
              <Link to="/analyze">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 py-6 bg-brand-accent text-brand-bg font-black uppercase tracking-[0.2em] text-sm rounded-full shadow-huge hover:shadow-[0_0_60px_rgba(93,169,255,0.4)] transition-all duration-300"
                >
                  Enter the Command Center
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
