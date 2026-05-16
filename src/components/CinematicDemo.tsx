import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, 
  Search, 
  BarChart3, 
  ShieldAlert, 
  Users, 
  Download, 
  Zap,
  MousePointer2,
  CheckCircle2,
  ArrowRight,
  Layout,
  Activity,
  Settings2,
  Lock,
  Globe,
  Cpu
} from 'lucide-react';
import { cn } from '../lib/utils';

const DEMO_STEPS = [
  { id: 'ingestion', label: '01. Ingestion', icon: <FileUp size={18} /> },
  { id: 'synthesis', label: '02. Synthesis', icon: <Cpu size={18} /> },
  { id: 'visualization', label: '03. Visualize', icon: <BarChart3 size={18} /> },
  { id: 'blueprint', label: '04. Blueprint', icon: <Layout size={18} /> },
  { id: 'refinement', label: '05. Refine', icon: <Settings2 size={18} /> },
  { id: 'deployment', label: '06. Deploy', icon: <Lock size={18} /> }
];

export default function CinematicDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 100, y: 100 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % DEMO_STEPS.length);
    }, 4500); // 4.5 seconds per step

    return () => clearInterval(timer);
  }, []);

  // Cursor animation logic
  useEffect(() => {
    const step = DEMO_STEPS[currentStep].id;
    if (step === 'ingestion') setCursorPos({ x: 50, y: 70 });
    if (step === 'visualization') setCursorPos({ x: 80, y: 40 });
    if (step === 'refinement') setCursorPos({ x: 30, y: 55 });
    if (step === 'deployment') setCursorPos({ x: 90, y: 85 });
  }, [currentStep]);

  return (
    <div className="w-full h-[600px] bg-brand-bg border border-white/5 rounded-[4rem] overflow-hidden shadow-huge relative flex flex-col group/demo">
      {/* Neural Background Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {[...Array(20)].map((_, i) => (
          <motion.div 
            key={i}
            animate={{ 
              x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
              y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 5 + Math.random() * 10, repeat: Infinity }}
            className="absolute w-1 h-1 bg-brand-accent rounded-full"
          />
        ))}
      </div>

      {/* OS Header */}
      <div className="h-14 border-b border-white/5 bg-brand-section/50 backdrop-blur-md px-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-coral/40" />
            <div className="w-3 h-3 rounded-full bg-brand-amber/40" />
            <div className="w-3 h-3 rounded-full bg-brand-emerald/40" />
          </div>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
             <span className="text-xs font-black text-brand-text-muted uppercase tracking-[0.4em]">DecisionLab OS v4.2</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
           <div className="text-xs font-black text-brand-text-muted uppercase tracking-[0.2em] opacity-40">Session: 8827-X</div>
           <div className="text-xs font-black text-brand-emerald bg-brand-emerald/10 px-4 py-1.5 rounded-full border border-brand-emerald/20 uppercase tracking-[0.3em]">Institutional Secure</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden p-12">
        <AnimatePresence mode="wait">
          {/* STEP 1: INGESTION */}
          {DEMO_STEPS[currentStep].id === 'ingestion' && (
            <motion.div 
              key="ingestion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center p-12"
            >
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                 {/* Upload Zone */}
                 <motion.div 
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="w-[500px] aspect-[4/3] rounded-[4rem] border-2 border-dashed border-brand-accent/20 bg-brand-accent/[0.03] flex flex-col items-center justify-center gap-12 relative overflow-hidden shadow-huge"
                 >
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-accent/[0.05] to-transparent pointer-events-none" />
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="w-24 h-24 rounded-[2rem] bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shadow-glow"
                    >
                       <FileUp size={44} />
                    </motion.div>
                    <div className="text-center space-y-3">
                       <h4 className="text-3xl font-black text-brand-text-primary uppercase tracking-tight font-display">Ingest Mission Brief</h4>
                       <p className="text-sm font-medium text-brand-text-muted opacity-60">PDF / Pitch Deck / URL Scanning</p>
                    </div>
                    
                    {/* Scanning Line */}
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-[2px] bg-brand-accent shadow-[0_0_20px_var(--color-brand-accent)] opacity-40 z-10"
                    />
                 </motion.div>

                 {/* Side Metadata Traces */}
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 space-y-4">
                    {[1, 2, 3].map(i => (
                      <motion.div 
                        key={i} 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 0.3 }}
                        transition={{ delay: i * 0.2 }}
                        className="w-48 h-px bg-brand-accent/40"
                      />
                    ))}
                 </div>
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-4 text-right">
                    <p className="text-xs font-black text-brand-accent uppercase tracking-widest opacity-40 italic">Structural Parsing Active</p>
                    <p className="text-xs font-black text-brand-text-muted uppercase tracking-widest opacity-20">Ingestion Path: /dev/pitch_deck_01</p>
                 </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SYNTHESIS */}
          {DEMO_STEPS[currentStep].id === 'synthesis' && (
            <motion.div 
              key="synthesis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center p-12"
            >
              <div className="w-full h-full flex flex-col relative overflow-hidden">
                 <div className="flex items-center justify-between mb-12">
                    <div className="space-y-2">
                       <div className="flex items-center gap-3">
                          <Activity size={16} className="text-brand-accent" />
                          <p className="text-xs font-black text-brand-accent uppercase tracking-[0.6em]">Neural Synergy Synthesis</p>
                       </div>
                       <h4 className="text-5xl font-black text-brand-text-primary uppercase font-display leading-none">Mapping Venture Graph</h4>
                    </div>
                    <div className="text-right">
                       <p className="text-4xl font-black italic tracking-tighter text-brand-text-primary tabular-nums">1.42 Tb/s</p>
                       <p className="text-xs font-black text-brand-text-muted uppercase tracking-widest opacity-40 italic">Processing Velocity</p>
                    </div>
                 </div>

                 <div className="flex-1 grid grid-cols-6 gap-6">
                    {[...Array(24)].map((_, i) => (
                       <motion.div 
                         key={i}
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ 
                           opacity: [0.1, 0.4, 0.1],
                           scale: [1, 1.05, 1],
                           borderColor: Math.random() > 0.8 ? 'rgba(93,169,255,0.4)' : 'rgba(255,255,255,0.05)'
                         }}
                         transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: i * 0.05 }}
                         className="aspect-square bg-brand-card/20 rounded-3xl border border-white/5 flex items-center justify-center relative group"
                       >
                          {Math.random() > 0.8 && (
                            <motion.div 
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: Math.random() * 5 }}
                              className="w-1.5 h-1.5 rounded-full bg-brand-accent shadow-glow" 
                            />
                          )}
                       </motion.div>
                    ))}

                    {/* Connecting Neural Lines (SVG Overlay) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                       <motion.path 
                         d="M 100 100 Q 300 200 500 100 T 900 300"
                         stroke="var(--color-brand-accent)"
                         strokeWidth="1"
                         fill="none"
                         initial={{ pathLength: 0 }}
                         animate={{ pathLength: 1 }}
                         transition={{ duration: 3, repeat: Infinity }}
                       />
                       <motion.path 
                         d="M 50 400 Q 400 300 800 450"
                         stroke="var(--color-brand-accent)"
                         strokeWidth="1"
                         fill="none"
                         initial={{ pathLength: 0 }}
                         animate={{ pathLength: 1 }}
                         transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                       />
                    </svg>
                 </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: VISUALIZE */}
          {DEMO_STEPS[currentStep].id === 'visualization' && (
            <motion.div 
              key="visualization"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="absolute inset-0 flex p-16 gap-16"
            >
              <div className="flex-1 flex flex-col justify-center">
                 <div className="space-y-4 mb-16">
                    <h4 className="text-5xl font-black text-brand-text-primary uppercase font-display leading-[1.05] tracking-tight">Venture <br /> Visualization</h4>
                    <p className="text-sm text-brand-text-muted font-medium opacity-60">Synthesis of 42 critical performance vectors into institutional metrics.</p>
                 </div>

                 <div className="relative w-full aspect-square max-w-sm mx-auto">
                    {/* Custom SVG Radar */}
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                       <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                       <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                       <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                       <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                       <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                       
                       <motion.polygon 
                         points="50,15 80,40 70,75 30,75 20,40"
                         fill="var(--color-brand-accent)"
                         fillOpacity="0.1"
                         stroke="var(--color-brand-accent)"
                         strokeWidth="1"
                         initial={{ scale: 0, opacity: 0 }}
                         animate={{ scale: [1, 1.05, 1], opacity: 1 }}
                         transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                         className="origin-center"
                       />
                       
                       {/* Floating Data Points */}
                       {[
                         { x: 50, y: 15, l: 'Market' },
                         { x: 80, y: 40, l: 'Product' },
                         { x: 70, y: 75, l: 'Team' },
                         { x: 30, y: 75, l: 'Capital' },
                         { x: 20, y: 40, l: 'Moat' }
                       ].map((p, i) => (
                         <g key={i}>
                            <circle cx={p.x} cy={p.y} r="2" fill="var(--color-brand-accent)" />
                            <text x={p.x} y={p.y - 5} fontSize="3" fill="var(--color-brand-text-muted)" textAnchor="middle" className="uppercase font-black tracking-widest">{p.l}</text>
                         </g>
                       ))}
                    </svg>
                 </div>
              </div>

              <div className="w-[450px] space-y-8 flex flex-col justify-center">
                 <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: 'Signal Clarity', val: '99.2%' },
                      { label: 'Risk Factor', val: 'Low' },
                      { label: 'Alpha Cohort', val: 'Top 1%' },
                      { label: 'Defensibility', val: 'High' }
                    ].map((item, i) => (
                       <div key={i} className="p-6 rounded-3xl bg-brand-card border border-white/5 space-y-2">
                          <p className="text-xs font-black text-brand-text-muted uppercase tracking-widest">{item.label}</p>
                          <p className="text-sm font-black text-brand-text-primary italic tabular-nums">{item.val}</p>
                       </div>
                    ))}
                 </div>
                 
                 <div className="p-10 rounded-[3rem] bg-brand-accent/5 border border-brand-accent/20 flex items-center justify-between">
                    <div>
                       <p className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-2">Venture Score</p>
                       <p className="text-6xl font-black italic tracking-tighter text-brand-text-primary">88</p>
                    </div>
                    <div className="text-right">
                       <Zap size={32} className="text-brand-accent animate-pulse ml-auto mb-4" />
                       <p className="text-xs font-black text-brand-emerald bg-brand-emerald/10 px-4 py-2 rounded-full border border-brand-emerald/20 uppercase tracking-widest">Optimized</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: BLUEPRINT */}
          {DEMO_STEPS[currentStep].id === 'blueprint' && (
            <motion.div 
              key="blueprint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col p-16 gap-12"
            >
               <div className="flex items-end justify-between border-b border-white/5 pb-8 relative">
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
                        <p className="text-xs font-black text-brand-emerald uppercase tracking-[0.5em]">Strategic Architecture</p>
                     </div>
                     <h4 className="text-5xl font-black text-brand-text-primary uppercase font-display leading-none">Execution Blueprint</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-black text-brand-text-muted uppercase tracking-widest opacity-40">
                     <Globe size={14} /> Global Expansion Layer v.0.1
                  </div>
               </div>

               <div className="flex-1 relative">
                  {/* Decorative Blueprint Grid */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--color-brand-accent) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-brand-accent/20" />
                  
                  {/* SVG Drawing Routes */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                    <motion.path 
                      d="M 50 150 L 250 300 L 450 150 L 650 300 L 850 150"
                      stroke="var(--color-brand-accent)"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </svg>

                  <div className="grid grid-cols-4 h-full relative z-10">
                     {[
                       { stage: 'Seed Layer', date: 'PHASE 01', items: ['Node Deployment', 'Market Ingress'], color: 'text-brand-accent' },
                       { stage: 'Growth Node', date: 'PHASE 02', items: ['Partner Integration', 'Series A Liquidity'], color: 'text-brand-purple' },
                       { stage: 'Market Scale', date: 'PHASE 03', items: ['Global Expansion', 'IPO Runway'], color: 'text-brand-blue' },
                       { stage: 'Artifact Export', date: 'PHASE 04', items: ['Optimization', 'Exit Event'], color: 'text-brand-emerald' }
                     ].map((s, i) => (
                       <motion.div 
                         key={i} 
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: i * 0.2 }}
                         className="flex flex-col items-center justify-center p-6"
                       >
                          <div className={cn(
                            "w-16 h-16 rounded-[1.5rem] border flex items-center justify-center shadow-huge mb-10 transition-all duration-700 bg-brand-section",
                            i === currentStep % 4 ? "border-brand-accent scale-110" : "border-white/10"
                          )}>
                             <Zap size={24} className={cn("transition-colors", i === currentStep % 4 ? "text-brand-accent" : "text-brand-text-muted")} />
                          </div>
                          <div className="text-center space-y-3">
                             <p className={cn("text-xs font-black uppercase tracking-widest", s.color)}>{s.date}</p>
                             <h5 className="text-xs font-black text-brand-text-primary uppercase tracking-tight">{s.stage}</h5>
                             <div className="pt-6 flex flex-col gap-2">
                                {s.items.map((item, j) => (
                                  <div key={j} className="flex items-center gap-2">
                                     <div className="w-1 h-1 rounded-full bg-brand-accent/40" />
                                     <p className="text-xs font-bold text-brand-text-muted opacity-40 uppercase tracking-tighter">{item}</p>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </motion.div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}

          {/* STEP 5: REFINE */}
          {DEMO_STEPS[currentStep].id === 'refinement' && (
            <motion.div 
              key="refinement"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute inset-0 flex p-16 gap-12"
            >
               <div className="w-1/3 space-y-8">
                  <h4 className="text-3xl font-black text-brand-text-primary uppercase font-display leading-[1.1] mb-12">Institutional <br /> Refinement</h4>
                  <div className="space-y-6">
                     {[
                       { label: 'Risk Sensitivity', val: 45 },
                       { label: 'Market Concentration', val: 72 },
                       { label: 'Alpha Generation', val: 88 }
                     ].map((ctl, i) => (
                       <div key={i} className="space-y-3">
                          <div className="flex justify-between text-xs font-black text-brand-text-muted uppercase tracking-widest">
                             <span>{ctl.label}</span>
                             <span className="text-brand-accent">{ctl.val}%</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full relative">
                             <motion.div 
                               animate={{ left: `${ctl.val}%` }}
                               transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                               className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-brand-accent rounded-full shadow-glow border-2 border-brand-bg z-10" 
                             />
                             <div className="absolute inset-y-0 left-0 bg-brand-accent/20 rounded-full" style={{ width: `${ctl.val}%` }} />
                          </div>
                       </div>
                     ))}
                  </div>
                  
                  <div className="pt-12">
                     <div className="p-8 rounded-[2rem] bg-brand-accent/5 border border-brand-accent/20 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                           <ShieldAlert size={16} className="text-brand-accent" />
                           <p className="text-xs font-black text-brand-accent uppercase tracking-[0.4em]">Optimizing Mitigation</p>
                        </div>
                        <p className="text-sm text-brand-text-muted font-medium italic">"Latency signals neutralized via strategic pivot simulation."</p>
                     </div>
                  </div>
               </div>

               <div className="flex-1 bg-brand-section/40 rounded-[4rem] border border-white/5 p-12 overflow-hidden relative">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,var(--color-brand-accent)_0%,transparent_60%)]" />
                  <div className="relative h-full flex flex-col justify-center">
                     <p className="text-xs font-black text-brand-text-muted uppercase tracking-[0.6em] mb-4">Live Confidence Delta</p>
                     <div className="flex items-baseline gap-4 mb-12">
                        <motion.h4 
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-9xl font-black italic tracking-tighter text-brand-text-primary"
                        >
                           98.4
                        </motion.h4>
                        <span className="text-4xl font-black text-brand-emerald uppercase tracking-[-0.05em] tabular-nums">+1.2%</span>
                     </div>
                     
                     <div className="h-24 flex items-end gap-2 opacity-30">
                        {[...Array(20)].map((_, i) => (
                           <motion.div 
                             key={i}
                             animate={{ height: [20, Math.random() * 80 + 20, 30] }}
                             transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
                             className="flex-1 bg-brand-accent rounded-t-lg"
                           />
                        ))}
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* STEP 6: DEPLOY */}
          {DEMO_STEPS[currentStep].id === 'deployment' && (
            <motion.div 
              key="deployment"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
               <div className="text-center space-y-16 max-w-2xl">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                    className="w-48 h-48 rounded-[4rem] bg-brand-emerald/10 border-2 border-brand-emerald/20 flex items-center justify-center text-brand-emerald mx-auto relative shadow-huge"
                  >
                     <CheckCircle2 size={80} />
                     <motion.div 
                       animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                       transition={{ duration: 3, repeat: Infinity }}
                       className="absolute inset-0 rounded-[4rem] bg-brand-emerald/20"
                     />
                  </motion.div>

                  <div className="space-y-6">
                     <motion.h4 
                       initial={{ y: 20, opacity: 0 }}
                       animate={{ y: 0, opacity: 1 }}
                       transition={{ delay: 0.5 }}
                       className="text-7xl font-black text-brand-text-primary uppercase tracking-tight font-display leading-none"
                     >
                        Analysis Artifact <br /> Ready for Export
                     </motion.h4>
                     <motion.p 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 0.4 }}
                       transition={{ delay: 0.8 }}
                       className="text-xs font-black text-brand-text-muted uppercase tracking-[0.8em]"
                     >
                        Institutional Protocol Finalized
                     </motion.p>
                  </div>

                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="grid grid-cols-3 gap-6"
                  >
                     {[
                       { label: 'PDF Report', icon: <Download size={18} /> },
                       { label: 'Deck Export', icon: <FileUp size={18} /> },
                       { label: 'Partner Invite', icon: <ArrowRight size={18} /> }
                     ].map((btn, i) => (
                        <div key={i} className="px-8 py-6 rounded-3xl bg-brand-section border border-white/10 hover:border-brand-emerald/30 hover:bg-brand-emerald/5 transition-all cursor-pointer group/btn flex flex-col items-center gap-4">
                           <div className="text-brand-text-muted group-hover/btn:text-brand-emerald transition-colors">
                              {btn.icon}
                           </div>
                           <span className="text-xs font-black text-brand-text-primary uppercase tracking-widest">{btn.label}</span>
                        </div>
                     ))}
                  </motion.div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Cursor */}
        <motion.div 
          animate={{ x: cursorPos.x + '%', y: cursorPos.y + '%' }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute z-50 pointer-events-none"
        >
          <MousePointer2 className="text-brand-accent fill-brand-accent shadow-[0_0_15px_rgba(93,169,255,0.5)]" size={24} />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute -top-1 -left-1 w-8 h-8 rounded-full border-2 border-brand-accent/30"
          />
        </motion.div>
      </div>

      {/* OS Footer Steps Navigation */}
      <div className="h-28 border-t border-white/5 bg-brand-section/30 backdrop-blur-md px-12 flex items-center justify-between shrink-0">
        <div className="flex gap-4">
          {DEMO_STEPS.map((step, idx) => (
            <div 
              key={step.id}
              className={cn(
                "flex flex-col gap-3 group transition-all duration-500",
                currentStep === idx ? "w-64 opacity-100" : "w-16 opacity-30"
              )}
            >
              <div className="flex items-center gap-4">
                 <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                    currentStep === idx ? "bg-brand-accent text-brand-text-primary shadow-glow" : "bg-white/5 text-brand-text-muted"
                 )}>
                    {React.cloneElement(step.icon as React.ReactElement, { size: 16 } as any)}
                 </div>
                 {currentStep === idx && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-black text-brand-text-primary uppercase tracking-[0.2em] whitespace-nowrap"
                    >
                      {step.label}
                    </motion.span>
                 )}
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative">
                 {currentStep === idx && (
                    <motion.div 
                      key={currentStep}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 4.5, ease: "linear" }}
                      className="absolute inset-0 bg-brand-accent origin-left"
                    />
                 )}
              </div>
            </div>
          ))}
        </div>
        <div className="text-right">
           <p className="text-xs font-black text-brand-text-muted uppercase tracking-[0.4em] mb-2 opacity-40">Auto-Sequence</p>
           <div className="flex items-center gap-4">
              <div className="text-xs font-black text-brand-text-primary uppercase">Step {currentStep + 1} / {DEMO_STEPS.length}</div>
           </div>
        </div>
      </div>
    </div>
  );
}
