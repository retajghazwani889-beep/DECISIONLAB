import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip 
} from 'recharts';
import { 
  ShieldAlert, CheckCircle2, Target, Lightbulb, Users, 
  Activity, TrendingUp, Swords, PieChart, Info, Zap,
  AlertTriangle, LayoutGrid, DollarSign, Globe, ShieldCheck,
  ChevronRight, BrainCircuit, X, Clock, Flame, Rocket
} from 'lucide-react';

export const RiskHeatmap = ({ risks }: { risks: any }) => {
  if (!risks) return null;

  const riskItems = [
    { id: 'Market', data: risks.market || risks.Market },
    { id: 'Execution', data: risks.execution || risks.Execution },
    { id: 'Competitive', data: risks.competitive || risks.competition || risks.Competitive || risks.Competition },
    { id: 'Financial', data: risks.financial || risks.Financial },
  ].filter(item => item.data);

  return (
    <div className="relative w-full aspect-square md:aspect-video bg-brand-bg/30 rounded-[3rem] p-8 border border-white/5 shadow-inner overflow-hidden">
      {/* Grid Labels */}
      <div className="absolute left-0 top-0 h-full w-12 flex flex-col justify-between py-12 px-2 pointer-events-none">
        <span className="text-xs font-black text-brand-text-muted uppercase vertical-text tracking-widest opacity-40">Latent Market Threats</span>
        <span className="text-xs font-black text-brand-text-muted uppercase vertical-text tracking-widest opacity-40">Surface Stability</span>
      </div>
      <div className="absolute left-0 bottom-0 w-full h-12 flex justify-between px-12 py-2 pointer-events-none">
        <span className="text-xs font-black text-brand-text-muted uppercase tracking-widest opacity-40">Low Frequency</span>
        <span className="text-xs font-black text-brand-text-muted uppercase tracking-widest opacity-40">Execution Bottlenecks</span>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        {/* Heatmap Grid Background */}
        <div className="absolute inset-4 grid grid-cols-5 grid-rows-5 gap-1 opacity-20 pointer-events-none">
          {[...Array(25)].map((_, i) => {
            const row = Math.floor(i / 5);
            const col = i % 5;
            // Rows are impact (indexed top-to-bottom, so 0 is high impact)
            // Cols are likelihood (indexed left-to-right, so 0 is low likelihood)
            // Distance from "Safe" (bottom-left) to "Danger" (top-right)
            const intensity = (4 - row + col) / 8;
            return (
              <div 
                key={i} 
                className="rounded-sm" 
                style={{ 
                  backgroundColor: intensity > 0.7 ? 'var(--color-brand-coral)' : 
                                   intensity > 0.4 ? 'var(--color-brand-amber)' : 
                                   'var(--color-brand-emerald)',
                  opacity: intensity + 0.1
                }} 
              />
            );
          })}
        </div>

        {/* Risk Points */}
        <div className="absolute inset-4">
          {riskItems.map((item, idx) => {
            const impact = item.data.impact; // 1-10
            const likelihood = item.data.likelihood; // 1-10
            
            // Map 1-10 to 0-100% position
            // Impact: 1 (bottom) -> 10 (top)
            // Likelihood: 1 (left) -> 10 (right)
            const left = ((likelihood - 1) / 9) * 100;
            const top = 100 - ((impact - 1) / 9) * 100;

            const severityColor = item.data.severity === 'High' ? 'text-brand-coral' : 
                                  item.data.severity === 'Medium' ? 'text-brand-amber' : 
                                  'text-brand-emerald';
            
            const shadowColor = item.data.severity === 'High' ? 'rgba(255,107,107,0.5)' : 
                                item.data.severity === 'Medium' ? 'rgba(245,158,11,0.4)' : 
                                'rgba(34,197,94,0.3)';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.1, type: "spring" }}
                className="absolute group/point cursor-help z-20"
                style={{ 
                  left: `${left}%`, 
                  top: `${top}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="relative">
                  {/* Point Pulse */}
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: idx * 0.5 }}
                    className={cn("absolute -inset-4 rounded-full blur-[2px]", severityColor.replace('text-', 'bg-'))}
                  />
                  
                  {/* The actual dot */}
                  <div 
                    className={cn(
                      "w-4 h-4 md:w-6 md:h-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all group-hover/point:scale-125",
                      severityColor.replace('text-', 'bg-')
                    )}
                    style={{ boxShadow: `0 0 15px ${shadowColor}` }}
                  >
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </div>

                  {/* Label */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
                    <p className="text-xs font-black uppercase tracking-widest text-brand-text-primary px-2 py-0.5 rounded-md bg-brand-section/80 backdrop-blur-md opacity-0 group-hover/point:opacity-100 transition-opacity">
                      {item.id}
                    </p>
                  </div>

                  {/* Tooltip Card */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-6 rounded-[2rem] bg-brand-section border border-white/10 shadow-huge opacity-0 group-hover/point:opacity-100 translate-y-2 group-hover/point:translate-y-0 transition-all pointer-events-none z-[100]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-tight">{item.id} Risk</h4>
                      <span className={cn("text-xs font-black uppercase", severityColor)}>{item.data.severity}</span>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <p className="text-sm font-black text-brand-text-muted uppercase tracking-widest opacity-40 mb-1">Impact</p>
                        <p className="text-sm font-black text-brand-text-primary italic tracking-tighter">{impact}/10</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-brand-text-muted uppercase tracking-widest opacity-40 mb-1">Likelihood</p>
                        <p className="text-sm font-black text-brand-text-primary italic tracking-tighter">{likelihood}/10</p>
                      </div>
                    </div>
                    <p className="text-sm text-brand-text-secondary leading-relaxed font-medium line-clamp-4">
                      {item.data.explanation || item.data.note}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


export const RiskEcosystemMap = ({ risks }: { risks: any }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!risks) return null;

  const riskCategories = [
    { id: 'Market', aliases: ['market', 'Market'], label: 'Market', icon: <Globe size={20} />, angle: -90 },
    { id: 'Execution', aliases: ['execution', 'Execution'], label: 'Execution', icon: <Activity size={20} />, angle: 0 },
    { id: 'Financial', aliases: ['financial', 'Financial'], label: 'Financial', icon: <DollarSign size={20} />, angle: 90 },
    { id: 'Competition', aliases: ['competition', 'Competition', 'competitive', 'Competitive'], label: 'Competition', icon: <Swords size={20} />, angle: 180 },
  ];

  const handleNodeClick = (nodeId: string) => {
    if (selectedNode === nodeId) {
      setSelectedNode(null);
      return;
    }
    
    setIsProcessing(true);
    setSelectedNode(nodeId);
    setTimeout(() => setIsProcessing(false), 800);
  };

  const getRiskStyles = (score: number) => {
    if (score >= 60) return { color: "text-brand-coral", bg: "bg-brand-coral/10", border: "border-brand-coral/20", fill: "fill-brand-coral", glow: "rgba(255,107,107,0.3)" };
    if (score >= 30) return { color: "text-brand-amber", bg: "bg-brand-amber/10", border: "border-brand-amber/20", fill: "fill-brand-amber", glow: "rgba(245,158,11,0.2)" };
    return { color: "text-brand-emerald", bg: "bg-brand-emerald/10", border: "border-brand-emerald/20", fill: "fill-brand-emerald", glow: "rgba(34,197,94,0.1)" };
  };

  return (
    <div className="relative w-full min-h-[700px] md:min-h-[900px] flex items-center justify-center p-4 md:p-12 select-none bg-brand-bg rounded-[4rem] overflow-visible border border-brand-border/10 shadow-huge">
      {/* 🧩 Tactical Infrastructure Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep Atmosphere */}
        <div className="absolute inset-0 bg-[#08131D]" />
        
        {/* Subtle Logic Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
            <pattern id="innerGrid" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M 12 0 L 0 0 0 12" fill="none" stroke="white" strokeWidth="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#innerGrid)" />
        </svg>

        {/* Layered Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(93,169,255,0.05)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-bg/20 to-brand-bg" />
      </div>

      {/* 📡 Animated Scan Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute rounded-full border border-brand-accent/5"
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{ 
              width: ["0%", "140%"], 
              height: ["0%", "140%"], 
              opacity: [0, 0.2, 0] 
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity, 
              delay: i * 5,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* ✨ Orbiting Strategic Particles & Micro-Nodes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => {
          const orbitRadius = 15 + (i * 7);
          const duration = 25 + (i * 10);
          const metrics = [
            { label: 'Growth', value: '+24%', color: 'text-brand-emerald' },
            { label: 'CAC', value: '$1.2k', color: 'text-brand-blue' },
            { label: 'Retention', value: '92%', color: 'text-brand-blue' },
            { label: 'Burn Rate', value: 'Low', color: 'text-brand-emerald' },
            { label: 'Funding', value: 'Seed+', color: 'text-brand-purple' },
            { label: 'Adoption', value: 'High', color: 'text-brand-blue' },
            { label: 'Timing', value: 'Prime', color: 'text-brand-amber' },
            { label: 'Network', value: 'Global', color: 'text-brand-blue' }
          ];
          const metric = metrics[i % metrics.length];
          
          return (
            <motion.div
              key={`orbit-particle-${i}`}
              className="absolute left-1/2 top-1/2"
              animate={{ rotate: 360 }}
              transition={{ duration, repeat: Infinity, ease: "linear" }}
              style={{ width: `${orbitRadius * 2}%`, height: `${orbitRadius * 2}%`, marginLeft: `-${orbitRadius}%`, marginTop: `-${orbitRadius}%` }}
            >
              {/* Particle Point */}
              <motion.div 
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, delay: i }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-accent/40 rounded-full blur-[0.5px]" 
              />
              
              {/* Strategic Micro Data Node */}
              {i % 3 === 0 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 flex flex-col items-center gap-1 opacity-20 hover:opacity-100 transition-opacity">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-2 py-1 bg-brand-section/40 backdrop-blur-md border border-white/5 rounded-md flex items-center gap-2 scale-75 transform-gpu shadow-2xl"
                  >
                    <div className="flex flex-col items-start leading-[1.1]">
                      <span className="text-xs font-black uppercase tracking-widest text-brand-text-muted opacity-60">
                        {metric.label}
                      </span>
                      <span className={cn("text-sm font-bold italic tracking-tight", metric.color)}>
                        {metric.value}
                      </span>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 🔗 Analysis Mapping Path System */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          <filter id="strategicGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Orbital Structure Paths (Precise Geometry) */}
        {[26, 32, 42].map((r, idx) => (
          <circle 
            key={`path-struct-${idx}`}
            cx="50%" cy="50%" r={`${r}%`} 
            fill="none" 
            stroke="var(--color-brand-accent)" 
            strokeOpacity={0.03 + (idx * 0.01)} 
            strokeWidth="0.5" 
            strokeDasharray={idx === 1 ? "2 12" : "1 4"}
          />
        ))}

        {riskCategories.map((m, idx) => {
          const x2 = 50 + Math.cos((m.angle * Math.PI) / 180) * 26;
          const y2 = 50 + Math.sin((m.angle * Math.PI) / 180) * 26;
          const isInteracting = hoveredNode === m.id || selectedNode === m.id;
          
          return (
            <g key={`conn-path-${m.id}`}>
              {/* Intelligent Signal Trace (Multi-layered) */}
              <motion.line
                x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`}
                stroke="var(--color-brand-accent)"
                strokeWidth={isInteracting ? "2" : "0.5"}
                strokeOpacity={isInteracting ? "0.3" : "0.06"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: idx * 0.1 }}
              />

              {/* Data Flow Pulse */}
              <motion.circle
                r="1.5"
                fill="var(--color-brand-accent)"
                filter="url(#strategicGlow)"
                animate={{
                  cx: ["50%", `${x2}%`],
                  cy: ["50%", `${y2}%`],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 3 + idx,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: idx * 0.8
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Venture Strategic Core Engine */}
      <motion.div 
        animate={{ 
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-20"
      >
        <div className="relative w-56 h-56 md:w-80 md:h-80 flex items-center justify-center">
          {/* Orbital Data Rings */}
          <motion.div 
            animate={{ rotate: 360, opacity: [0.1, 0.2, 0.1] }}
            transition={{ rotate: { duration: 30, repeat: Infinity, ease: "linear" }, opacity: { duration: 5, repeat: Infinity } }}
            className="absolute inset-0 rounded-full border border-brand-accent/20"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
            className="absolute inset-12 rounded-full border border-dashed border-brand-accent/10"
          />
          
          {/* Scanning Radar Line */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full pointer-events-none z-30 opacity-20"
            style={{
              background: 'conic-gradient(from 0deg, var(--color-brand-accent) 0%, transparent 15%, transparent 100%)'
            }}
          />

          {/* Core Atmospheric Glow Layer */}
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-brand-accent/10 blur-[80px]"
          />

          <div className="relative w-44 h-44 md:w-64 md:h-64 rounded-full bg-brand-section/90 backdrop-blur-[40px] border border-white/5 flex flex-col items-center justify-center shadow-huge group/core overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(93,169,255,0.05)_0%,transparent_70%)]" />
            
            {/* Inner Processing Animation */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-6 rounded-full border border-brand-accent/5 opacity-30"
            />

            <motion.div 
              animate={{ 
                y: [0, -4, 0],
                filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
              }}
              transition={{ duration: 5, repeat: Infinity }}
              className="bg-brand-accent/10 p-7 rounded-[2.5rem] mb-6 relative z-10 border border-brand-accent/10"
            >
              <BrainCircuit size={44} className="text-brand-blue" />
            </motion.div>
            
            <div className="text-center z-10">
              <span className="text-xs font-black text-brand-text-primary uppercase tracking-[0.7em] block mb-2">Venture</span>
              <div className="flex items-center justify-center gap-2 opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
                <span className="text-xs font-black text-brand-text-muted uppercase tracking-[0.6em]">Logic Center</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Orbital Nodes Matrix */}
      {riskCategories.map((m, i) => {
        const riskKey = Object.keys(risks).find(k => 
          m.id === k || (m.aliases && m.aliases.includes(k)) || k.toLowerCase() === m.id.toLowerCase()
        );
        const riskData = riskKey ? risks[riskKey] : null;
        if (!riskData) return null;

        const score = riskData.impact * riskData.likelihood;
        const style = getRiskStyles(score);
        
        const x = 50 + Math.cos((m.angle * Math.PI) / 180) * 26;
        const y = 50 + Math.sin((m.angle * Math.PI) / 180) * 26;
        const isSelected = selectedNode === m.id;

        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: isSelected ? 1.15 : 1,
              left: `${x}%`,
              top: `${y}%`,
            }}
            transition={{ duration: 1.2, delay: 0.5 + i * 0.1, type: "spring", damping: 15 }}
            style={{ position: 'absolute', transform: 'translate(-50%, -50%)' }}
            onMouseEnter={() => setHoveredNode(m.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => handleNodeClick(m.id)}
            className="group/node z-30 cursor-pointer"
          >
            <div className="relative">
              {/* Dynamic Tactical Aura */}
              <motion.div
                animate={{ 
                  scale: isSelected ? [1.1, 1.3, 1.1] : [1, 1.1, 1],
                  opacity: isSelected ? [0.4, 0.6, 0.4] : (hoveredNode === m.id ? [0.2, 0.4, 0.2] : 0)
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className={cn(
                  "absolute -inset-16 rounded-full blur-3xl transition-opacity",
                  style.bg
                )}
              />

              {/* Glass Analysis Node (Apple OS Style) */}
              <div className={cn(
                "relative w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] md:rounded-[3rem] backdrop-blur-[40px] border flex flex-col items-center justify-center transition-all duration-500 shadow-huge overflow-hidden",
                isSelected || hoveredNode === m.id 
                  ? "bg-brand-section border-brand-accent/60 scale-105 shadow-[0_0_40px_rgba(93,169,255,0.15)]" 
                  : "bg-[#102434]/50 border-white/5"
              )}>
                {/* Node Grid Accent */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '12px 12px' }} 
                />

                <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/5 via-transparent to-transparent opacity-0 group-hover/node:opacity-100 transition-opacity" />
                
                {/* Tactical Corner Markers */}
                <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-white/10 group-hover/node:border-brand-accent/30 transition-colors" />
                <div className="absolute bottom-4 right-4 w-3 h-3 border-b border-r border-white/10 group-hover/node:border-brand-accent/30 transition-colors" />

                <motion.div 
                  animate={{ y: hoveredNode === m.id ? -1 : 0 }}
                  className={cn("mb-4 transition-transform duration-500", (isSelected || hoveredNode === m.id) && "scale-110", style.color)}
                >
                  {React.cloneElement(m.icon as React.ReactElement, { size: 28 } as any)}
                </motion.div>
                
                <div className="text-center px-4 relative z-10 transition-transform duration-500 group-hover/node:translate-y-[-2px] font-display">
                  <p className="text-sm font-black uppercase tracking-[0.4em] text-brand-text-primary mb-4 opacity-70 leading-none font-display">{m.label}</p>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={cn("text-4xl md:text-5xl font-black italic tracking-tighter tabular-nums leading-none", style.color)}>
                      <AnimatedCounter value={score} />
                    </span>
                    <span className="text-xs font-bold text-brand-text-muted opacity-20 italic font-display">IX</span>
                  </div>
                </div>

                {/* Micro Scan Line */}
                <motion.div 
                  animate={{ y: ["-100%", "200%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent opacity-40"
                />
              </div>

              {/* Data Node Indicators (Tiny Metrics) */}
              <AnimatePresence>
                {(hoveredNode === m.id || isSelected) && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute -right-20 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none z-50"
                  >
                    <div className="px-3 py-1 rounded-lg bg-brand-bg/80 border border-white/5 backdrop-blur-xl shadow-2xl">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-brand-emerald animate-ping" />
                        <p className="text-xs font-black text-brand-emerald tracking-widest leading-none">SIGNAL ACTIVE</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-brand-bg/80 border border-white/5 backdrop-blur-xl shadow-2xl">
                      <p className="text-xs font-black text-brand-text-muted opacity-60 tracking-widest leading-none">RATIO: {score}%</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}

      {/* Progressive Reveal: Premium Side Analysis Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 100, filter: 'blur(10px)' }}
            transition={{ type: "spring", damping: 30, stiffness: 100 }}
            className="absolute top-0 right-0 h-full w-full md:w-[750px] bg-brand-section/98 backdrop-blur-[60px] border-l border-brand-border/40 z-[300] shadow-huge p-20 flex flex-col overflow-y-auto"
          >
            {/* Intel Flow Particle Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(93,169,255,0.3)_0%,transparent_50%)]" />

            <div className="flex items-center justify-between mb-24 relative z-10">
              <div className="flex items-center gap-12">
                <div className={cn(
                  "w-28 h-28 rounded-[3.5rem] flex items-center justify-center border-2 shadow-huge transition-all duration-700",
                  getRiskStyles(risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood || 0).bg,
                  getRiskStyles(risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood || 0).border,
                  getRiskStyles(risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood || 0).color
                )}>
                   <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                   >
                     {React.cloneElement(riskCategories.find(c => c.id === selectedNode)?.icon as React.ReactElement, { size: 48 } as any)}
                   </motion.div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-4xl md:text-5xl font-black text-brand-text-primary uppercase tracking-tight leading-none">{selectedNode} Analysis</h4>
                  <div className="flex items-center gap-6">
                    <div className="flex gap-2.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={cn("w-8 h-2.5 rounded-full transition-all duration-1000", i < 4 ? "bg-brand-accent/60 shadow-[0_0_15px_rgba(93,169,255,0.4)]" : "bg-brand-accent/10")} />
                      ))}
                    </div>
                    <p className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] italic leading-none">Institutional Confidence: 94%</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="w-16 h-16 rounded-full border border-brand-border/20 flex items-center justify-center hover:bg-brand-card hover:border-brand-accent/40 transition-all group relative overflow-hidden shrink-0"
              >
                <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <X size={32} className="text-brand-text-muted group-hover:text-brand-accent transition-colors relative z-10" />
              </button>
            </div>

            <div className="space-y-20 flex-1 relative z-10">
              {/* Strategic Signal Visualizer */}
              <div className="p-14 rounded-[5rem] bg-brand-bg/60 border border-brand-border/20 flex items-center justify-between gap-12 shadow-inner">
                 <div className="flex-1 space-y-8">
                    <p className="text-sm font-black text-brand-text-muted uppercase tracking-[0.6em] mb-2 leading-none">Live Analysis Stream</p>
                    <div className="h-24 flex items-end gap-3 opacity-80">
                      {[...Array(16)].map((_, i) => (
                        <motion.div 
                          key={i} 
                          animate={{ height: [40, 100, 55, 115, 60, 85, 40] }}
                          transition={{ duration: 2.5 + Math.random(), repeat: Infinity, delay: i * 0.1 }}
                          className="w-3.5 bg-brand-accent/30 rounded-full hover:bg-brand-accent/60 transition-colors" 
                        />
                      ))}
                    </div>
                 </div>
                 <div className="text-right space-y-1">
                    <p className="text-xs font-black text-brand-text-muted uppercase tracking-[0.4em] leading-none">Risk Intensity</p>
                    <p className={cn("text-4xl font-black italic tracking-tighter tabular-nums leading-none", getRiskStyles(risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood || 0).color)}>
                      {risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood}%
                    </p>
                 </div>
              </div>

              {/* Venture Analysis Commentary */}
              <div className="p-12 rounded-[5rem] bg-brand-bg/80 border border-brand-border/20 relative overflow-hidden group/memo shadow-huge">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover/memo:opacity-20 transition-opacity duration-1000 transform group-hover/memo:rotate-12">
                   <AlertTriangle size={150} className={getRiskStyles(risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood || 0).color} />
                </div>
                <div className="flex items-center gap-6 mb-10">
                   <div className={cn("w-4 h-4 rounded-full shadow-huge", getRiskStyles(risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood || 0).fill)} />
                   <h5 className="text-xs font-black uppercase tracking-[0.6em] text-brand-accent leading-none">Executive Synthesis</h5>
                </div>
                <p className="text-2xl md:text-3xl text-brand-text-primary leading-[1.7] font-bold italic opacity-95 tracking-tight group-hover/memo:text-white transition-colors duration-500">
                  "{risks[selectedNode.toLowerCase()]?.explanation || risks[selectedNode.toLowerCase()]?.note}"
                </p>
              </div>

              {/* Shield Mitigation Protocol */}
              <div className="space-y-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20 shadow-glow">
                      <Zap size={32} className="text-brand-blue" />
                    </div>
                    <h5 className="text-sm font-black uppercase tracking-[0.4em] text-brand-text-primary leading-none">Mitigation Framework</h5>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 bg-brand-emerald/10 border border-brand-emerald/20 rounded-full">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-pulse" />
                    <span className="text-xs font-black text-brand-emerald uppercase tracking-widest leading-none">Active Guard</span>
                  </div>
                </div>
                <div className="p-12 rounded-[5rem] bg-brand-accent/5 border border-brand-accent/20 shadow-inner group/shield relative overflow-hidden">
                   <div className="absolute inset-0 bg-brand-accent/[0.03] opacity-0 group-hover/shield:opacity-100 transition-opacity duration-700" />
                   <p className="text-2xl md:text-3xl text-brand-text-secondary leading-[1.9] font-medium tracking-tight relative z-10 opacity-90 group-hover/shield:text-brand-text-primary transition-colors">
                      {risks[selectedNode.toLowerCase()]?.mitigation || `Systematic institutional ${selectedNode.toLowerCase()} safeguards initialized. Data-driven strategic diversification recommended to stabilize ${risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood}% exposure across high-velocity growth channels.`}
                   </p>
                   
                   {/* Progress Meter */}
                   <div className="mt-16 pt-12 border-t border-brand-border/10">
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-sm font-black text-brand-text-muted uppercase tracking-[0.5em] leading-none">Strategic Readiness Score</span>
                        <span className="text-2xl font-black text-brand-accent uppercase tracking-widest italic leading-none">85%</span>
                      </div>
                      <div className="h-4.5 w-full bg-brand-accent/10 rounded-full overflow-hidden p-1 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "85%" }}
                          transition={{ duration: 2, delay: 0.8, type: "spring" }}
                          className="h-full bg-brand-accent/60 rounded-full shadow-glow"
                        />
                      </div>
                   </div>
                </div>
              </div>

              {/* Forensic Data Points */}
              <div className="grid grid-cols-2 gap-8 pb-12">
                 <div className="p-8 rounded-[3rem] bg-brand-card/40 border border-brand-border/10 hover:border-brand-accent/30 transition-all group/stat hover:scale-[1.02] duration-500">
                    <p className="text-xs font-black text-brand-text-muted uppercase tracking-[0.4em] mb-4 group-hover/stat:text-brand-accent transition-colors leading-none">Impact Radius</p>
                    <div className="flex items-baseline gap-3">
                       <p className="text-5xl md:text-6xl font-black text-brand-text-primary italic tracking-tighter tabular-nums leading-none">{risks[selectedNode.toLowerCase()]?.impact}</p>
                       <span className="text-sm font-black text-brand-text-muted opacity-30 leading-none">/ 10</span>
                    </div>
                 </div>
                 <div className="p-8 rounded-[3rem] bg-brand-card/40 border border-brand-border/10 hover:border-brand-accent/30 transition-all group/stat hover:scale-[1.02] duration-500">
                    <p className="text-xs font-black text-brand-text-muted uppercase tracking-[0.4em] mb-4 group-hover/stat:text-brand-accent transition-colors leading-none">Probability</p>
                    <div className="flex items-baseline gap-3">
                       <p className="text-5xl md:text-6xl font-black text-brand-text-primary italic tracking-tighter tabular-nums leading-none">{risks[selectedNode.toLowerCase()]?.likelihood}</p>
                       <span className="text-sm font-black text-brand-text-muted opacity-30 leading-none">/ 10</span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="mt-auto pt-12 border-t border-brand-border/10 flex items-center justify-between relative z-10 opacity-70">
               <div className="flex items-center gap-4">
                  <div className="flex space-x-1.5">
                    {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-brand-accent/40 rounded-full animate-pulse" style={{ animationDelay: `${i*250}ms` }} />)}
                  </div>
                  <span className="text-xs font-black text-brand-text-muted uppercase tracking-[0.4em] italic">Analysis ID: VX-ANL-{selectedNode?.slice(0, 3).toUpperCase()}-2026</span>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-xs font-black text-brand-emerald uppercase tracking-[0.2em]">Verified Secure</span>
                 <ShieldCheck size={22} className="text-brand-emerald/60" />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export const VCCommandCenter = ({ scores, finalVerdict, topInvestorTakeaway }: any) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const metrics = [
    { id: 'ideaStrength', label: 'Idea Strength', icon: <Lightbulb size={18} />, angle: -90 },
    { id: 'marketFit', label: 'Market Fit', icon: <Users size={18} />, angle: -30 },
    { id: 'execution', label: 'Execution', altId: 'executionReadiness', icon: <Activity size={18} />, angle: 30 },
    { id: 'scalability', label: 'Scalability', icon: <TrendingUp size={18} />, angle: 90 },
    { id: 'competition', label: 'Competition', altId: 'competitiveAdvantage', icon: <Swords size={18} />, angle: 150 },
    { id: 'investorAppeal', label: 'Investor Appeal', altId: 'investorAttractiveness', icon: <PieChart size={18} />, angle: 210 },
  ];

  const overallScore = scores?.overall || scores?.ideaStrength?.score || 0;

  const getScoreStyles = (val: number) => {
    if (val >= 80) return { color: "text-brand-emerald", bg: "bg-brand-emerald/10", border: "border-brand-emerald/20", fill: "fill-brand-emerald" };
    if (val >= 60) return { color: "text-brand-blue", bg: "bg-brand-blue/10", border: "border-brand-blue/20", fill: "fill-brand-blue" };
    if (val >= 40) return { color: "text-brand-amber", bg: "bg-brand-amber/10", border: "border-brand-amber/20", fill: "fill-brand-amber" };
    return { color: "text-brand-coral", bg: "bg-brand-coral/10", border: "border-brand-coral/20", fill: "fill-brand-coral" };
  };

  const centerStyle = getScoreStyles(overallScore);

  return (
    <div className="relative w-full aspect-[4/5] md:aspect-[4/3] flex items-center justify-center p-4 md:p-8 select-none">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-accent/[0.02] to-transparent pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-brand-accent/[0.01] rounded-full blur-[120px]" />
      </div>

      {/* SVG Connections Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand-accent)" stopOpacity="0.05" />
            <stop offset="50%" stopColor="var(--color-brand-accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--color-brand-accent)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {metrics.map((m, i) => {
          const radarRadius = 240;
          const x2 = 50 + Math.cos((m.angle * Math.PI) / 180) * 26;
          const y2 = 50 + Math.sin((m.angle * Math.PI) / 180) * 26;
          return (
            <motion.line
              key={`line-${i}`}
              x1="50%"
              y1="50%"
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="url(#lineGrad)"
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: i * 0.1 }}
            />
          );
        })}
        {/* Connecting lines between nodes */}
        {metrics.map((m, i) => {
          const next = metrics[(i + 1) % metrics.length];
          const x1 = 50 + Math.cos((m.angle * Math.PI) / 180) * 26;
          const y1 = 50 + Math.sin((m.angle * Math.PI) / 180) * 26;
          const x2 = 50 + Math.cos((next.angle * Math.PI) / 180) * 26;
          const y2 = 50 + Math.sin((next.angle * Math.PI) / 180) * 26;
          return (
            <motion.line
              key={`outer-line-${i}`}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="var(--color-brand-accent)"
              strokeOpacity="0.05"
              strokeWidth="1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            />
          );
        })}
      </svg>

      {/* Central Core */}
      <div className="relative z-20 flex flex-col items-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="relative"
        >
          {/* Main Score Circle */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-brand-section/40 backdrop-blur-3xl border border-brand-border/30 flex items-center justify-center shadow-huge group/center transition-transform duration-700 hover:scale-[1.02]">
            <div className="absolute inset-4 rounded-full border border-brand-accent/5" />
            <div className="absolute inset-8 rounded-full border border-brand-accent/5 animate-pulse" />
            
            {/* Animated Score Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <circle
                cx="50%"
                cy="50%"
                r="46%"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-brand-accent/10"
              />
              <motion.circle
                cx="50%"
                cy="50%"
                r="46%"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="289"
                initial={{ strokeDashoffset: 289 }}
                animate={{ strokeDashoffset: 289 - (overallScore / 100 * 289) }}
                transition={{ duration: 2, ease: "easeOut" }}
                className={cn("transition-all duration-700", centerStyle.color)}
              />
            </svg>

            <div className="text-center z-10 px-8">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-brand-text-muted mb-3">Venture Score</p>
              <div className="flex items-center justify-center gap-1">
                <span className={cn("text-5xl md:text-7xl font-black italic tracking-tighter tabular-nums", centerStyle.color)}>
                  {overallScore}
                </span>
                <span className="text-sm font-black text-brand-text-muted opacity-40">%</span>
              </div>
              <p className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest mt-4 max-w-[160px] mx-auto leading-relaxed opacity-60">
                {finalVerdict?.status || 'Assessing Opportunity'}
              </p>
            </div>

            {/* Hover Floating Stats */}
            <div className="absolute -bottom-12 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
               <div className="bg-brand-card/90 backdrop-blur-xl border border-brand-border/40 px-4 py-2 rounded-xl shadow-2xl">
                  <p className="text-sm font-black text-brand-text-primary uppercase tracking-widest text-center">Analyst Verdict</p>
                  <p className="text-xs text-brand-text-muted italic max-w-[200px] text-center mt-1 leading-relaxed">
                    "{finalVerdict?.description?.slice(0, 80)}..."
                  </p>
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Metric Nodes */}
      {metrics.map((m, i) => {
        const metricData = scores?.[m.id] ?? (m.altId ? scores?.[m.altId] : undefined);
        const score = typeof metricData === 'number' ? metricData : (metricData?.score || 0);
        const style = getScoreStyles(score);
        
        const x = 50 + Math.cos((m.angle * Math.PI) / 180) * 26;
        const y = 50 + Math.sin((m.angle * Math.PI) / 180) * 26;

        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: 1, 
              left: `${x}%`,
              top: `${y}%`,
            }}
            transition={{ duration: 1.2, delay: i * 0.1, type: "spring", damping: 15 }}
            style={{ position: 'absolute', transform: 'translate(-50%, -50%)' }}
            onMouseEnter={() => setHoveredNode(m.id)}
            onMouseLeave={() => setHoveredNode(null)}
            className="group/node z-30"
          >
            <div className="relative">
              {/* Connector Dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-1 h-1 rounded-full bg-brand-accent/20" />
              </div>

              {/* Node Card */}
              <motion.div
                whileHover={{ scale: 1.1, y: -5 }}
                className={cn(
                  "relative p-6 rounded-2xl bg-brand-card/80 backdrop-blur-xl border flex flex-col items-center gap-4 transition-all duration-500 shadow-2xl w-32 md:w-36",
                  hoveredNode === m.id ? "border-brand-accent/40 shadow-brand-accent/10" : "border-brand-border/20"
                )}
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", style.bg, style.border, style.color)}>
                  {m.icon}
                </div>
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-brand-text-primary mb-1 whitespace-nowrap opacity-80">
                    {m.label}
                  </p>
                  <div className="flex items-center justify-center gap-1 font-display">
                    <span className={cn("text-sm font-black italic tracking-tighter tabular-nums", style.color)}>
                      {score}
                    </span>
                    <span className="text-xs font-bold text-brand-text-muted opacity-30 font-display">%</span>
                  </div>
                </div>

                {/* Micro Score Ring */}
                <div className="absolute -inset-1 rounded-2xl border border-brand-accent/5 pointer-events-none group-hover/node:border-brand-accent/20 transition-all duration-700" />
              </motion.div>

              {/* Insight Tooltip */}
              {hoveredNode === m.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 w-80 md:w-96 p-8 bg-brand-section/95 backdrop-blur-2xl border border-brand-border/40 rounded-3xl shadow-huge z-[200] pointer-events-none"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={cn("w-2.5 h-2.5 rounded-full", style.fill)} />
                    <span className="text-sm font-black uppercase tracking-widest text-brand-text-primary">Analysis Node</span>
                  </div>
                  <p className="text-sm text-brand-text-secondary leading-relaxed font-bold">
                    {metricData?.explanation || `Institutional pulse suggests ${score >= 60 ? 'strong' : 'variable'} position in ${m.label.toLowerCase()}.`}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export const CircularProgress = ({ score, size = 120, strokeWidth = 8, label, explanation }: { score: number, size?: number, strokeWidth?: number, label: string, explanation: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getStrokeColor = (val: number) => {
    if (val >= 80) return "stroke-brand-emerald";
    if (val >= 60) return "stroke-brand-amber";
    return "stroke-brand-coral";
  };

  return (
    <div className="group relative flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-brand-text-primary/5"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={cn("transition-all duration-300", getStrokeColor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-black text-brand-text-primary"
          >
            {score}%
          </motion.span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-brand-text-secondary mb-1">{label}</p>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 bg-brand-section border border-brand-border/10 p-5 rounded-2xl shadow-huge z-20 pointer-events-none">
          <p className="text-sm leading-relaxed text-brand-text-secondary font-medium">{explanation}</p>
        </div>
      </div>
    </div>
  );
};





export const StrategicExpansionJourney = ({ roadmap }: { roadmap: any }) => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps = [
    { 
      id: 'validation', 
      label: 'Validation', 
      items: roadmap?.immediate || [], 
      icon: <Target size={20} />, 
      title: 'Structural Validation',
      desc: 'Ground-truth refinement of core value hypothesis.'
    },
    { 
      id: 'launch', 
      label: 'Launch', 
      items: roadmap?.oneToThreeMonths || [], 
      icon: <Rocket size={20} />, 
      title: 'Market Entry',
      desc: 'Alpha signal capture and initial sector penetration.'
    },
    { 
      id: 'traction', 
      label: 'Traction', 
      items: roadmap?.threeToSixMonths || [], 
      icon: <Activity size={20} />, 
      title: 'Velocity Build',
      desc: 'Scalable data acquisition and network effects initialization.'
    },
    { 
      id: 'scale', 
      label: 'Scale', 
      items: roadmap?.growthStage || [], 
      icon: <TrendingUp size={20} />, 
      title: 'Expansion Phase',
      desc: 'Institutional-grade operational compounding.'
    },
    { 
      id: 'readiness', 
      label: 'Ready', 
      items: roadmap?.investorReadiness || [], 
      icon: <ShieldCheck size={20} />, 
      title: 'Venture Maturity',
      desc: 'Strategic positioning for high-conviction capital.'
    },
  ];

  return (
    <div className="relative w-full py-32 md:py-64 px-12 md:px-24 select-none overflow-visible">
      {/* 🌌 Atmospheric Backdrop */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent opacity-40" />
      
      {/* 🛣️ The Expansion Path (SVG) */}
      <div className="relative max-w-7xl mx-auto h-[600px] md:h-[750px]">
        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 1000 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-brand-accent)" stopOpacity="0.05" />
              <stop offset="50%" stopColor="var(--color-brand-accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-brand-purple)" stopOpacity="0.2" />
            </linearGradient>
            <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Curved Path Base */}
          <motion.path
            d="M 50 400 Q 250 200, 500 400 T 950 400"
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />

          {/* Animated Signal Flow Particles */}
          {[...Array(3)].map((_, i) => (
            <motion.circle
              key={`pulse-${i}`}
              r="2"
              fill="var(--color-brand-accent)"
              initial={{ offsetDistance: "0%" }}
              animate={{ offsetDistance: "100%" }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "linear", 
                delay: i * 2 
              }}
              style={{
                offsetPath: "path('M 50 400 Q 250 200, 500 400 T 950 400')",
                filter: "drop-shadow(0 0 4px var(--color-brand-accent))"
              }}
            />
          ))}

          {/* Animated "Beam" Trail */}
          <motion.path
            d="M 50 400 Q 250 200, 500 400 T 950 400"
            fill="none"
            stroke="var(--color-brand-accent)"
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeDasharray="20 480"
            animate={{ strokeDashoffset: [-500, 500] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        {/* Milestone Nodes Layout */}
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none overflow-visible">
          {steps.map((step, idx) => {
            const isActive = hoveredStep === idx;
            // Simulated positions along the curve
            const positions = [
              { x: '15%', y: '66%' },
              { x: '32%', y: '45%' },
              { x: '50%', y: '66%' },
              { x: '68%', y: '87%' }, 
              { x: '85%', y: '66%' }
            ];

            return (
              <div 
                key={step.id}
                className={cn(
                  "absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-300",
                  isActive ? "z-[500]" : "z-10"
                )}
                style={{ 
                  left: positions[idx].x, 
                  top: positions[idx].y 
                }}
              >
                <div 
                  className="group relative flex flex-col items-center"
                  onMouseEnter={() => setHoveredStep(idx)}
                  onMouseLeave={() => setHoveredStep(null)}
                  onClick={() => setHoveredStep(hoveredStep === idx ? null : idx)}
                >
                  {/* Node Core */}
                  <motion.div
                    animate={{ 
                      scale: isActive ? 1.25 : 1,
                      borderColor: isActive ? 'var(--color-brand-accent)' : 'rgba(255,255,255,0.05)'
                    }}
                    className={cn(
                      "w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-brand-section/80 backdrop-blur-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-huge group-hover:bg-brand-card/90 cursor-pointer",
                      isActive && "shadow-[0_0_40px_rgba(93,169,255,0.2)]"
                    )}
                  >
                    <div className={cn(
                      "transition-all duration-500",
                      isActive ? "text-brand-accent scale-110" : "text-brand-text-muted opacity-40 group-hover:opacity-80"
                    )}>
                      {step.icon}
                    </div>

                    {/* Active State Glow */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 0.15, scale: 1.5 }}
                          exit={{ opacity: 0, scale: 2 }}
                          className="absolute inset-0 rounded-full bg-brand-accent blur-xl pointer-events-none"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Node Label (Always Visible) */}
                  <div className="absolute top-full mt-6 text-center whitespace-nowrap">
                    <p className={cn(
                      "text-xs font-black uppercase tracking-[0.4em] transition-all duration-500",
                      isActive ? "text-brand-accent translate-y-1 scale-105" : "text-brand-text-primary opacity-60"
                    )}>
                      {step.label}
                    </p>
                    <div className={cn(
                      "w-1 h-1 bg-brand-accent rounded-full mx-auto mt-2 transition-all duration-500 shadow-glow",
                      isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    )} />
                  </div>

                  {/* Expansion Journey Detail Card (Hover/Click) */}
                  <AnimatePresence>
                    {isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: idx <= 1 ? -30 : 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: idx <= 1 ? -20 : 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className={cn(
                      "absolute w-80 md:w-[640px] p-8 md:p-10 rounded-[3rem] bg-brand-section/98 backdrop-blur-[50px] border-2 border-brand-accent/20 shadow-huge pointer-events-auto z-[1000] text-left max-h-[80vh] overflow-y-auto custom-scrollbar",
                      // Smart Vertical Positioning: Only Launch (top node) pops down, others up
                      idx === 1 ? "top-full mt-12" : "bottom-full mb-12",
                      // Horizontal alignment
                      idx <= 1 ? "left-0 translate-x-0" : 
                      idx === steps.length - 1 ? "right-0 translate-x-0" : 
                      "left-1/2 -translate-x-1/2"
                    )}
                  >
                         <div className="relative z-10">
                             <div className="flex items-center gap-5 mb-8">
                               <div className="w-2.5 h-10 bg-brand-accent rounded-full shadow-[0_0_15px_rgba(93,169,255,0.4)]" />
                               <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-[0.1em] leading-none">{step.title}</h4>
                            </div>
                            <p className="text-sm md:text-sm text-brand-text-secondary leading-[1.9] font-bold italic mb-10 opacity-95">
                                "{step.desc}"
                            </p>
                            
                            <div className="space-y-8">
                               <div className="flex items-center justify-between">
                                 <p className="text-xs font-black text-brand-accent uppercase tracking-[0.6em] leading-none opacity-80">Strategic Focus Units</p>
                                 <div className="w-20 h-px bg-brand-accent/10" />
                               </div>
                               <div className="space-y-4">
                                  {step.items.length > 0 ? (
                                    step.items.map((item: string, i: number) => (
                                      <motion.div 
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        key={i} 
                                        className="flex gap-6 items-center group/item p-5 rounded-[2rem] bg-white/5 hover:bg-brand-accent/10 transition-all duration-300"
                                      >
                                        <div className="w-3 h-3 rounded-full bg-brand-accent shadow-[0_0_10px_rgba(93,169,255,0.5)] shrink-0" />
                                        <span className="text-xs font-bold text-brand-text-muted leading-tight group-hover/item:text-brand-text-primary transition-colors">
                                          {item}
                                        </span>
                                      </motion.div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-brand-text-muted italic opacity-50">Strategic data nodes pending analysis.</p>
                                  )}
                               </div>
                            </div>
                         </div>

                         {/* Side Accent Decor */}
                         <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                            {step.icon}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Narrative Legend Overlay */}
      <div className="mt-12 md:mt-24 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
         <div className="flex items-center gap-4">
            <div className="flex gap-1">
               {[...Array(5)].map((_, i) => <div key={i} className="w-4 h-1 rounded-full bg-brand-accent/20" />)}
            </div>
            <span className="text-sm font-black text-brand-text-muted uppercase tracking-[0.3em]">Expansion Velocity: Stable</span>
         </div>
         <div className="flex items-center gap-3">
            <Info size={12} />
            <span className="text-sm font-black text-brand-text-muted uppercase tracking-[0.3em]">Founders Journey Analysis Engine</span>
         </div>
      </div>
    </div>
  );
};


export const AnimatedCounter = ({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) => {


  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 1500;
    const increment = (end - start) / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

export const ConfidenceLineChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <XAxis 
        dataKey="stage" 
        axisLine={false} 
        tickLine={false} 
        tick={{ fill: 'var(--color-brand-accent)', fontSize: 10, fontWeight: 'black' }}
        dy={10}
      />
      <YAxis hide domain={[0, 100]} />
      <RechartsTooltip 
        contentStyle={{ backgroundColor: 'var(--color-brand-section)', border: '1px solid var(--color-brand-border)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
        itemStyle={{ color: 'var(--color-brand-accent)', fontWeight: 'bold' }}
        labelStyle={{ color: 'var(--color-brand-text-muted)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
      />
      <Line 
        type="monotone" 
        dataKey="value" 
        stroke="var(--color-brand-accent)" 
        strokeWidth={4} 
        dot={{ fill: 'var(--color-brand-accent)', r: 5, strokeWidth: 3, stroke: 'var(--color-brand-bg)' }}
        activeDot={{ r: 7, strokeWidth: 0, fill: 'var(--color-brand-accent)' }}
        animationDuration={2500}
      />
    </LineChart>
  </ResponsiveContainer>
);

export const InvestorRelationshipNetwork = ({ investors, startupName }: { investors: any[], startupName: string }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!investors || investors.length === 0) return null;

  return (
    <div className="relative w-full aspect-square md:aspect-[16/9] min-h-[500px] md:min-h-[700px] flex items-center justify-center p-4 select-none overflow-visible rounded-[4rem] bg-brand-bg/50 border border-brand-border/10">
      {/* 🌌 Cosmic Background Infrastructure */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#08131D]" />
        {/* Orbital Rings */}
        {[20, 35, 50].map((r, i) => (
          <div 
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-brand-accent/5 rounded-full"
            style={{ width: `${r * 2}%`, height: `${r * 2}%` }}
          />
        ))}
        {/* Logic Grid */}
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 2px, transparent 0)', backgroundSize: '40px 40px' }} 
        />
        {/* Atmospheric Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/5 blur-[120px] rounded-full animate-pulse" />
      </div>

      {/* 🔗 Connection Mapping System */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {investors.map((_, idx) => {
          const angle = (idx * (360 / investors.length)) - 90;
          const radius = 35; // Orbital radius in %
          const x2 = 50 + Math.cos((angle * Math.PI) / 180) * radius;
          const y2 = 50 + Math.sin((angle * Math.PI) / 180) * radius;
          const isHovered = hoveredIdx === idx;

          return (
            <g key={`connection-${idx}`}>
              <motion.line
                x1="50%" y1="50%" x2={`${x2}%`} y2={`${y2}%`}
                stroke="var(--color-brand-accent)"
                strokeWidth={isHovered ? "2.5" : "0.5"}
                strokeOpacity={isHovered ? "0.4" : "0.1"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: idx * 0.1 }}
                filter={isHovered ? "url(#lineGlow)" : "none"}
              />
              
              {/* Dynamic Signal Pulse */}
              <motion.circle
                r="1.5"
                fill="var(--color-brand-accent)"
                initial={{ cx: "50%", cy: "50%", opacity: 0 }}
                animate={{
                  cx: ["50%", `${x2}%`],
                  cy: ["50%", `${y2}%`],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: idx * 0.5
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* 🏗️ Strategic Core (Startup) */}
      <div className="relative z-20 group">
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            boxShadow: ["0 0 20px rgba(93,169,255,0.1)", "0 0 60px rgba(93,169,255,0.3)", "0 0 20px rgba(93,169,255,0.1)"]
          }}
          transition={{ duration: 6, repeat: Infinity }}
          className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-brand-section/90 backdrop-blur-3xl border-2 border-brand-accent/30 flex items-center justify-center p-6 shadow-huge relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-brand-accent/[0.03] animate-pulse" />
          <div className="relative z-10 text-center w-full">
            <span className="text-xs md:text-xs font-black text-brand-text-primary uppercase tracking-tight leading-tight block break-words px-1">
              {startupName || 'Venture'}
            </span>
            <div className="mt-2 flex items-center justify-center gap-1">
               <div className="w-1 h-1 rounded-full bg-brand-accent animate-ping" />
               <span className="text-[6px] md:text-[8px] font-black text-brand-accent uppercase tracking-[0.2em]">Core</span>
            </div>
          </div>
        </motion.div>
        
        {/* Core Narrative Trace */}
        <div className="absolute -inset-8 border border-brand-accent/5 rounded-full animate-spin-slow pointer-events-none" />
      </div>

      {/* 🚀 Investor Nodes Distribution */}
      {investors.map((inv, idx) => {
        const angle = (idx * (360 / investors.length)) - 90;
        const radius = 35;
        const x = 50 + Math.cos((angle * Math.PI) / 180) * radius;
        const y = 50 + Math.sin((angle * Math.PI) / 180) * radius;
        const isHovered = hoveredIdx === idx;
        const matchScore = 85 + (idx * 3);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: isHovered ? 1.15 : 1,
                left: `${x}%`,
                top: `${y}%`,
                zIndex: isHovered ? 500 : 10
              }}
              transition={{ type: "spring", damping: 15, stiffness: 100 }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
          >
            {/* Investor Node Glyph */}
            <div className={cn(
              "relative w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] md:rounded-[2.2rem] bg-brand-section/80 backdrop-blur-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-huge cursor-pointer group/node overflow-hidden",
              isHovered ? "border-brand-accent bg-brand-card/90" : "border-brand-border/10 hover:border-brand-accent/40"
            )}>
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 to-transparent opacity-0 group-hover/node:opacity-100 transition-opacity" />
              
              <div className={cn(
                "transition-all duration-500",
                isHovered ? "text-brand-accent scale-110" : "text-brand-text-muted opacity-60"
              )}>
                <Users size={24} />
              </div>

              {/* Match Percentage Indicator */}
              <div className="absolute bottom-1.5 inset-x-0 text-center">
                 <span className={cn(
                    "text-[8px] font-black tracking-widest leading-none transition-colors",
                    isHovered ? "text-brand-accent" : "text-brand-text-muted opacity-40 font-bold"
                 )}>
                    {matchScore}%
                 </span>
              </div>
            </div>

            {/* Micro-label (Always Visible but faded) */}
            <div className={cn(
              "mt-3 text-center whitespace-nowrap transition-all duration-500",
              isHovered ? "opacity-100 translate-y-1" : "opacity-30 scale-95"
            )}>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-brand-text-primary">{inv.name}</p>
              {isHovered && <div className="w-4 h-0.5 bg-brand-accent mx-auto mt-1 rounded-full" />}
            </div>

            {/* Analysis Detail Card (Hover/Click) */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: y < 50 ? -30 : 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: y < 50 ? -20 : 20 }}
                  transition={{ type: "spring", damping: 20, stiffness: 150 }}
                  className={cn(
                    "absolute w-80 md:w-[540px] p-8 md:p-10 rounded-[3rem] bg-brand-section/98 backdrop-blur-[50px] border border-brand-accent/30 shadow-huge pointer-events-auto z-[1000] text-left max-h-[80vh] overflow-y-auto custom-scrollbar",
                    // Smart Position Logic:
                    // 1. Flip vertically if in top half
                    y < 50 ? "top-full mt-10" : "bottom-full mb-10",
                    // 2. Adjust horizontal anchor based on quadrant
                    x < 40 ? "left-0" : x > 60 ? "right-0" : "left-1/2 -translate-x-1/2"
                  )}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-brand-accent uppercase tracking-[0.6em] mb-2 opacity-80">Compatibility Pathway</span>
                        <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-tight">{inv.name}</h4>
                      </div>
                      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 font-black text-xs">
                        {matchScore}%
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5">
                           <p className="text-sm font-black text-brand-text-muted uppercase tracking-[0.5em] mb-2">Investor Type</p>
                           <p className="text-sm font-bold text-brand-text-primary uppercase tracking-tight">{inv.type}</p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5">
                           <p className="text-sm font-black text-brand-text-muted uppercase tracking-[0.5em] mb-2">Target Stage</p>
                           <p className="text-sm font-bold text-brand-text-primary uppercase tracking-tight">{inv.stage}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-black text-brand-text-muted uppercase tracking-[0.5em] mb-5">Strategic Rationale</p>
                        <p className="text-sm md:text-sm text-brand-text-secondary leading-[1.9] font-medium italic opacity-95">
                          "{inv.whyFit}"
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-[8px] font-black text-brand-text-muted uppercase tracking-widest">Sector Alignment</span>
                           <span className="text-[8px] font-black text-brand-accent">Optimal</span>
                         </div>
                         <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: "94%" }}
                              className="h-full bg-brand-accent"
                            />
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Decor */}
                  <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                    <Target size={40} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Narrative Legend */}
      <div className="absolute bottom-8 left-12 flex items-center gap-6 opacity-40">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
            <span className="text-[8px] font-black text-brand-text-muted uppercase tracking-widest">Validated Connection</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-6 h-[0.5px] bg-brand-accent/40" />
            <span className="text-[8px] font-black text-brand-text-muted uppercase tracking-widest">Compatibility Path</span>
         </div>
      </div>
    </div>
  );
};
