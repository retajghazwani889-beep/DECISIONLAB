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

// Custom tooltip for the radar chart — shows the same explanation text the
// old orbit-card "Analysis Node" popups showed, but anchored to the real
// pentagon/hexagon shape instead of a separate fixed-distance visualization.
const RadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-brand-section/95 backdrop-blur-2xl border border-brand-border/40 rounded-3xl shadow-huge p-6 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-black uppercase tracking-widest text-brand-text-primary">{point.metric}</span>
        <span className="text-lg font-black text-brand-accent font-mono">{point.value}%</span>
      </div>
      <p className="text-xs text-brand-text-secondary leading-relaxed font-medium">
        {point.explanation || `Our study suggests ${point.value >= 60 ? 'strong' : 'variable'} position in ${point.metric.toLowerCase()}.`}
      </p>
    </div>
  );
};

// Real radar/pentagon chart. The polygon shape is determined by the actual
// score data (each axis point sits closer/farther from center based on its
// score) — which is what produces a recognizable pentagon/hexagon silhouette.
// This is the single "Startup Score" visualization — hover any vertex for the
// same per-metric explanation the old orbit cards showed.
export const StartupScoreRadar = ({ scores }: { scores: any }) => {
  const getMetric = (key: string, altKey?: string) => {
    const val = scores?.[key] ?? (altKey ? scores?.[altKey] : undefined);
    if (val === undefined || val === null) return { value: 0, explanation: '' };
    if (typeof val === 'number') return { value: val, explanation: '' };
    if (typeof val === 'object' && typeof val.score === 'number') return { value: val.score, explanation: val.explanation || '' };
    return { value: 0, explanation: '' };
  };

  const data = [
    { metric: 'Idea Strength', ...getMetric('ideaStrength') },
    { metric: 'Market Fit', ...getMetric('marketFit') },
    { metric: 'Execution', ...getMetric('execution', 'executionReadiness') },
    { metric: 'Scalability', ...getMetric('scalability') },
    { metric: 'Competition', ...getMetric('competition', 'competitiveAdvantage') },
    { metric: 'Investor Appeal', ...getMetric('investorAppeal', 'investorAttractiveness') },
  ];

  return (
    <div className="w-full h-[520px] md:h-[640px] bg-brand-section/40 rounded-[3rem] border border-brand-border/20 p-6 md:p-10">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--color-brand-border)" strokeOpacity={0.25} />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#e2e8f0', fontSize: 14, fontWeight: 700 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="value"
            stroke="var(--color-brand-accent)"
            fill="var(--color-brand-accent)"
            fillOpacity={0.25}
            strokeWidth={3}
            dot={{ r: 5, fill: 'var(--color-brand-accent)', stroke: 'var(--color-brand-bg)', strokeWidth: 2, cursor: 'pointer' }}
            activeDot={{ r: 7, fill: 'var(--color-brand-accent)', cursor: 'pointer' }}
          />
          <RechartsTooltip content={<RadarTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RiskHeatmap = ({ risks }: { risks: any }) => {
  if (!risks) return null;

  // Explicit hex colors so red / amber / green always render reliably on the
  // deployed build (the old code used var(--color-brand-*) CSS variables that
  // sometimes don't resolve in production, which made the colors look wrong).
  const RISK_RED = '#ff6b6b';
  const RISK_AMBER = '#f59e0b';
  const RISK_GREEN = '#22c55e';

  const severityHex = (severity: string) =>
    severity === 'High' ? RISK_RED :
    severity === 'Medium' ? RISK_AMBER :
    RISK_GREEN;

  const riskItems = [
    { id: 'Market', data: risks.market || risks.Market },
    { id: 'Execution', data: risks.execution || risks.Execution },
    { id: 'Competitive', data: risks.competitive || risks.competition || risks.Competitive || risks.Competition },
    { id: 'Financial', data: risks.financial || risks.Financial },
  ].filter(item => item.data);

  return (
    <div className="relative w-full aspect-square md:aspect-video bg-brand-bg/30 rounded-[3rem] p-8 pl-28 pb-16 border border-white/5 shadow-inner overflow-visible">
      {/* Vertical axis labels — horizontal full words (no rotation, no narrow
          column) so "HIGH IMPACT" / "LOW IMPACT" read normally instead of
          breaking one letter per line. */}
      <div className="absolute left-0 top-0 h-full w-28 flex flex-col justify-between py-10 pl-4 pr-3 pointer-events-none">
        <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest opacity-50 leading-tight text-right">High Impact</span>
        <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest opacity-50 leading-tight text-right">Low Impact</span>
      </div>

      {/* Horizontal axis labels — full words along the bottom. */}
      <div className="absolute left-28 right-8 bottom-0 h-14 flex justify-between items-center px-2 pointer-events-none">
        <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest opacity-50">Less Likely</span>
        <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest opacity-50">More Likely</span>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute inset-4 grid grid-cols-5 grid-rows-5 gap-1 opacity-20 pointer-events-none">
          {[...Array(25)].map((_, i) => {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const intensity = (4 - row + col) / 8;
            return (
              <div 
                key={i} 
                className="rounded-sm" 
                style={{ 
                  backgroundColor: intensity > 0.7 ? RISK_RED : 
                                   intensity > 0.4 ? RISK_AMBER : 
                                   RISK_GREEN,
                  opacity: intensity + 0.1
                }} 
              />
            );
          })}
        </div>

        <div className="absolute inset-4">
          {riskItems.map((item, idx) => {
            // Normalize to 1–10 scale in case Gemini returned 0–100
            const impact = item.data.impact > 10 ? item.data.impact / 10 : item.data.impact;
            const likelihood = item.data.likelihood > 10 ? item.data.likelihood / 10 : item.data.likelihood;

            const left = ((likelihood - 1) / 9) * 100;
            const top = 100 - ((impact - 1) / 9) * 100;

            const dotHex = severityHex(item.data.severity);

            const shadowColor = item.data.severity === 'High' ? 'rgba(255,107,107,0.5)' : 
                                item.data.severity === 'Medium' ? 'rgba(245,158,11,0.4)' : 
                                'rgba(34,197,94,0.3)';

            const flipBelow = top < 30;

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
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: idx * 0.5 }}
                    className="absolute -inset-4 rounded-full blur-[2px]"
                    style={{ backgroundColor: dotHex }}
                  />
                  
                  <div 
                    className="w-4 h-4 md:w-6 md:h-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all group-hover/point:scale-125"
                    style={{ backgroundColor: dotHex, boxShadow: `0 0 15px ${shadowColor}` }}
                  >
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap top-full mt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-primary px-2 py-0.5 rounded-md bg-brand-section/80 backdrop-blur-md opacity-0 group-hover/point:opacity-100 transition-opacity">
                      {item.id}
                    </p>
                  </div>

                  <div className={cn(
                    "absolute left-1/2 -translate-x-1/2 w-64 p-6 rounded-[2rem] bg-brand-section border border-white/10 shadow-huge opacity-0 group-hover/point:opacity-100 transition-all pointer-events-none z-[100]",
                    flipBelow
                      ? "top-full mt-4 translate-y-[-8px] group-hover/point:translate-y-0"
                      : "bottom-full mb-4 translate-y-2 group-hover/point:translate-y-0"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-tight">{item.id} Risk</h4>
                      <span className="text-[10px] font-black uppercase" style={{ color: dotHex }}>{item.data.severity}</span>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest opacity-40 mb-1">Impact</p>
                        <p className="text-xl font-black text-brand-text-primary italic tracking-tighter">{impact}/10</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest opacity-40 mb-1">Likelihood</p>
                        <p className="text-xl font-black text-brand-text-primary italic tracking-tighter">{likelihood}/10</p>
                      </div>
                    </div>
                    <p className="text-xs text-brand-text-secondary leading-relaxed font-medium line-clamp-4">
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
    { id: 'Competition', aliases: ['competition', 'Competition', 'competitive', 'Competitive'], label: 'Competition', icon: <Swords size={20} />, angle: 180 },
    { id: 'Market', aliases: ['market', 'Market'], label: 'Market', icon: <Globe size={20} />, angle: -90 },
    { id: 'Execution', aliases: ['execution', 'Execution'], label: 'Execution', icon: <Activity size={20} />, angle: 0 },
    { id: 'Financial', aliases: ['financial', 'Financial'], label: 'Financial', icon: <DollarSign size={20} />, angle: 90 },
  ];

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNode(nodeId);
    setSelectedNode(nodeId);
    if (nodeId) {
      setIsProcessing(true);
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const getRiskStyles = (score: number) => {
    if (score >= 60) return { color: "text-brand-coral", bg: "bg-brand-coral/10", border: "border-brand-coral/20", fill: "fill-brand-coral", glow: "rgba(255,107,107,0.3)" };
    if (score >= 30) return { color: "text-brand-amber", bg: "bg-brand-amber/10", border: "border-brand-amber/20", fill: "fill-brand-amber", glow: "rgba(245,158,11,0.2)" };
    return { color: "text-brand-emerald", bg: "bg-brand-emerald/10", border: "border-brand-emerald/20", fill: "fill-brand-emerald", glow: "rgba(34,197,94,0.1)" };
  };

  return (
    <div className="relative w-full select-none bg-brand-bg rounded-[4rem] border border-brand-border/10 shadow-huge overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#08131D]" />
        
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

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(93,169,255,0.05)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-bg/20 to-brand-bg" />
      </div>

      <div 
        className="relative z-10 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-10 box-border transition-all duration-500"
      >
        {riskCategories.map((m, i) => {
          const riskKey = Object.keys(risks).find(k => 
            m.id === k || (m.aliases && m.aliases.includes(k)) || k.toLowerCase() === m.id.toLowerCase()
          );
          const riskData = riskKey ? risks[riskKey] : null;
          if (!riskData) return null;

          // Normalize: Gemini sometimes returns 0–100 instead of 1–10
          const normImpact = riskData.impact > 10 ? riskData.impact / 10 : riskData.impact;
          const normLikelihood = riskData.likelihood > 10 ? riskData.likelihood / 10 : riskData.likelihood;
          const score = Math.round(normImpact * normLikelihood);
          const style = getRiskStyles(score);
          const isSelected = selectedNode === m.id;

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onMouseEnter={() => handleNodeHover(m.id)}
              onMouseLeave={() => handleNodeHover(null)}
              className={cn(
                "relative rounded-3xl backdrop-blur-3xl border flex flex-col items-center justify-between text-center transition-all duration-500 shadow-huge group/node cursor-pointer p-6 md:p-8 min-h-[180px] md:min-h-[220px] h-full",
                isSelected || hoveredNode === m.id 
                  ? "bg-brand-section border-brand-accent/60 scale-[1.03] shadow-[0_0_40px_rgba(93,169,255,0.15)]" 
                  : "bg-[#102434]/40 border-white/5 hover:border-white/10"
              )}
            >
              <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-white/10 group-hover/node:border-brand-accent/30 transition-colors" />
              <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-white/10 group-hover/node:border-brand-accent/30 transition-colors" />

              <div className={cn(
                "rounded-2xl bg-brand-bg border border-white/5 transition-all duration-500 mb-5 p-4", 
                (isSelected || hoveredNode === m.id) && "scale-115", 
                style.color, 
                style.bg
              )}>
                {React.cloneElement(m.icon as React.ReactElement, { size: 24 } as any)}
              </div>

              <p className="font-black uppercase tracking-widest text-brand-text-primary opacity-85 font-sans leading-none text-sm mb-5 whitespace-nowrap">
                {m.label}
              </p>

              <div className="flex items-center justify-center gap-1 font-display">
                <span className={cn(
                  "font-black italic tracking-tighter tabular-nums leading-none text-3xl md:text-4xl", 
                  style.color
                )}>
                  <AnimatedCounter value={score} />
                </span>
                <span className="text-[12px] font-bold text-brand-text-muted opacity-30 italic font-display">
                  /100
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedNode && (
          <motion.div
            key={selectedNode}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="relative z-10 w-full border-t border-brand-border/10 overflow-hidden"
            onMouseEnter={() => handleNodeHover(selectedNode)}
            onMouseLeave={() => handleNodeHover(null)}
          >
            <div className="p-8 md:p-10 flex flex-col gap-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-brand-border/10">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-huge transition-all duration-700",
                    getRiskStyles(risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood || 0).bg,
                    getRiskStyles(risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood || 0).border,
                    getRiskStyles(risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood || 0).color
                  )}>
                     <motion.div
                      animate={{ scale: [1, 1.15, 1], rotate: [0, 5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                     >
                       {React.cloneElement(riskCategories.find(c => c.id === selectedNode)?.icon as React.ReactElement, { size: 26 } as any)}
                     </motion.div>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-xl md:text-2xl font-black text-brand-text-primary uppercase tracking-tight leading-none">{selectedNode} Analysis</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={cn("w-5 h-2 rounded-full transition-all duration-1000", i < 4 ? "bg-brand-accent/60 shadow-[0_0_15px_rgba(93,169,255,0.4)]" : "bg-brand-accent/10")} />
                        ))}
                      </div>
                      <p className="text-[11px] font-black text-brand-accent uppercase tracking-[0.4em] italic leading-none">Confidence Rating: 94%</p>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest opacity-50">Hover a card to explore</div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                <div className="lg:col-span-7 space-y-6">
                  
                  <div className="p-6 rounded-3xl bg-brand-bg/80 border border-brand-border/20 relative overflow-hidden group/memo shadow-huge">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/memo:opacity-20 transition-opacity duration-1000 transform group-hover/memo:rotate-12">
                       <AlertTriangle size={100} className={getRiskStyles(risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood || 0).color} />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                       <div className={cn("w-3 h-3 rounded-full shadow-huge", getRiskStyles(risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood || 0).fill)} />
                       <h5 className="text-[11px] font-black uppercase tracking-[0.6em] text-brand-accent leading-none">Notes</h5>
                    </div>
                    <p className="text-base md:text-lg text-brand-text-primary leading-relaxed font-semibold italic opacity-95 tracking-tight group-hover/memo:text-white transition-colors duration-500">
                      "{risks[selectedNode.toLowerCase()]?.explanation || risks[selectedNode.toLowerCase()]?.note}"
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20 shadow-glow">
                          <Zap size={18} className="text-brand-blue" />
                        </div>
                        <h5 className="text-sm font-black uppercase tracking-[0.4em] text-brand-text-primary leading-none">Fix</h5>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-brand-accent/5 border border-brand-accent/20 shadow-inner group/shield relative overflow-hidden">
                       <div className="absolute inset-0 bg-brand-accent/[0.03] opacity-0 group-hover/shield:opacity-100 transition-opacity duration-700" />
                       <p className="text-sm text-brand-text-secondary leading-relaxed font-medium tracking-tight relative z-10 opacity-90 group-hover/shield:text-brand-text-primary transition-colors">
                          {risks[selectedNode.toLowerCase()]?.mitigation || `Systematic ${selectedNode.toLowerCase()} safeguards initialized. Data-driven diversification recommended to stabilize ${risks[selectedNode.toLowerCase()]?.impact * risks[selectedNode.toLowerCase()]?.likelihood}% exposure across high-velocity growth channels.`}
                       </p>
                       
                       <div className="mt-6 pt-4 border-t border-brand-border/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black text-brand-text-muted uppercase tracking-[0.5em] leading-none">Fix Rating</span>
                            <span className="text-base font-black text-brand-accent uppercase tracking-widest italic leading-none">85% Safety</span>
                          </div>
                          <div className="h-3 w-full bg-brand-accent/10 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: "85%" }}
                              transition={{ duration: 2, delay: 0.3, type: "spring" }}
                              className="h-full bg-brand-accent/60 rounded-full shadow-glow"
                            />
                          </div>
                       </div>
                    </div>
                  </div>

                </div>

                <div className="lg:col-span-5 space-y-6">
                  
                  <div className="p-6 rounded-3xl bg-brand-bg/60 border border-brand-border/20 flex items-center justify-between gap-6 shadow-inner">
                     <div className="flex-1 h-14 flex items-end gap-1.5 opacity-90">
                       {[...Array(20)].map((_, i) => (
                         <motion.div 
                           key={i} 
                           animate={{ height: [20, 50, 30, 56, 25, 42, 20] }}
                           transition={{ duration: 2.0 + Math.random() * 1.5, repeat: Infinity, delay: i * 0.08 }}
                           className="flex-1 bg-brand-accent/30 rounded-full hover:bg-brand-accent/60 transition-colors" 
                         />
                       ))}
                     </div>
                     <div className="text-right pl-4 border-l border-brand-border/10 flex items-center justify-center min-h-[56px]">
                        {(() => {
                          const r = risks[selectedNode.toLowerCase()];
                          const ni = r?.impact > 10 ? r.impact / 10 : (r?.impact || 0);
                          const nl = r?.likelihood > 10 ? r.likelihood / 10 : (r?.likelihood || 0);
                          const s = Math.round(ni * nl);
                          return <p className={cn("text-3xl md:text-4xl font-black italic tracking-tighter tabular-nums leading-none", getRiskStyles(s).color)}>{s}%</p>;
                        })()}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 rounded-2xl bg-brand-card/40 border border-brand-border/10 hover:border-brand-accent/30 transition-all group/stat hover:scale-[1.02] duration-500">
                        <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.3em] mb-2 group-hover/stat:text-brand-accent transition-colors leading-none">Impact Radius</p>
                        <div className="flex items-baseline gap-2">
                           <p className="text-3xl md:text-4xl font-black text-brand-text-primary italic tracking-tighter tabular-nums leading-none">{(() => { const v = risks[selectedNode.toLowerCase()]?.impact; return v > 10 ? (v/10).toFixed(1) : v; })()}</p>
                           <span className="text-xs font-black text-brand-text-muted opacity-30 leading-none">/ 10</span>
                        </div>
                     </div>
                     <div className="p-5 rounded-2xl bg-brand-card/40 border border-brand-border/10 hover:border-brand-accent/30 transition-all group/stat hover:scale-[1.02] duration-500">
                        <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.3em] mb-2 group-hover/stat:text-brand-accent transition-colors leading-none">Probability</p>
                        <div className="flex items-baseline gap-2">
                           <p className="text-3xl md:text-4xl font-black text-brand-text-primary italic tracking-tighter tabular-nums leading-none">{(() => { const v = risks[selectedNode.toLowerCase()]?.likelihood; return v > 10 ? (v/10).toFixed(1) : v; })()}</p>
                           <span className="text-xs font-black text-brand-text-muted opacity-30 leading-none">/ 10</span>
                        </div>
                     </div>
                  </div>

                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
            className="text-xl font-black text-brand-text-primary"
          >
            {score}/100
          </motion.span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-brand-text-secondary mb-1">{label}</p>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 bg-brand-section border border-brand-border/10 p-5 rounded-2xl shadow-huge z-20 pointer-events-none">
          <p className="text-base leading-relaxed text-brand-text-secondary font-medium">{explanation}</p>
        </div>
      </div>
    </div>
  );
};

export const StrategicExpansionJourney = ({ roadmap }: { roadmap: any }) => {
  const [activeStep, setActiveStep] = useState<number | null>(0);

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
      items: roadmap?.growthStage?.length ? roadmap.growthStage : roadmap?.sixToTwelveMonths?.length ? roadmap.sixToTwelveMonths : ['Expand into new segments and regions', 'Make sales and onboarding repeatable', 'Grow the team to support scale'], 
      icon: <TrendingUp size={20} />, 
      title: 'Expansion Phase',
      desc: 'Elite operational compounding.'
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
    <div 
      className="relative w-full overflow-visible select-none"
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh', 
        padding: '40px 0' 
      }}
    >
      <div className="absolute top-4 bottom-4 w-5 pointer-events-none" style={{ left: '50%', transform: 'translateX(-50%)' }}>
        <div className="absolute inset-0 bg-transparent border-l border-dashed border-white/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-accent/5 via-brand-accent/40 to-brand-purple/10 w-[2px]" />
        
        <motion.div 
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-[3px] h-16 bg-gradient-to-b from-transparent via-brand-accent to-transparent shadow-[0_0_8px_rgba(93,169,255,0.4)]"
        />
      </div>

      <div className="relative w-full max-w-5xl mx-auto px-4 md:px-12 mt-12 z-10">
        <div className="relative flex flex-col items-center w-full">
          {steps.map((step, idx) => {
            const isLeft = idx % 2 === 0;
            const isActive = activeStep === idx;

            return (
              <div 
                key={step.id} 
                className="flex flex-col md:grid md:grid-cols-11 items-center w-full relative group mb-[60px]"
              >
                <div className={cn(
                  "w-full flex justify-end md:col-span-5 transition-all duration-500 pb-4 md:pb-0",
                  isLeft ? "md:justify-end text-right pr-0 md:pr-10" : "md:opacity-20 group-hover:opacity-100 md:order-last pl-0 md:pl-10 text-left"
                )}>
                  {isLeft ? (
                    <motion.div 
                      onClick={() => setActiveStep(isActive ? null : idx)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={cn(
                        "p-6 rounded-3xl backdrop-blur-xl border flex flex-col gap-3 transition-all duration-500 cursor-pointer w-full max-w-md ml-auto",
                        isActive 
                          ? "bg-brand-section/90 border-brand-accent/50 shadow-[0_0_30px_rgba(93,169,255,0.15)]" 
                          : "bg-brand-card/45 border-white/5 hover:border-white/15 hover:bg-brand-card/85"
                      )}
                    >
                      <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent italic leading-none">
                        <span>Milestone {idx + 1}</span>
                      </div>
                      <h4 className="text-lg md:text-xl font-black text-brand-text-primary uppercase tracking-tight leading-tight">{step.label}</h4>
                      <p className="text-[11px] font-black text-brand-text-muted uppercase tracking-wider leading-none">{step.title}</p>
                      <p className="text-xs md:text-sm text-brand-text-secondary leading-relaxed opacity-90 max-w-sm ml-auto">
                        "{step.desc}"
                      </p>

                      <AnimatePresence>
                        {isActive && step.items.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-white/5 space-y-2.5 text-right overflow-hidden"
                          >
                            <p className="text-[9px] font-black text-brand-accent uppercase tracking-[0.4em] mb-2">Strategic Focus Units</p>
                            {step.items.map((item: string, i: number) => (
                              <div key={i} className="flex gap-2.5 items-center justify-end text-xs font-bold text-brand-text-muted">
                                <span>{item}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0 shadow-glow animate-pulse" />
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : null}
                </div>

                <div className="flex md:col-span-1 justify-center z-20 my-4 md:my-0">
                  <motion.div 
                    onClick={() => setActiveStep(isActive ? null : idx)}
                    whileHover={{ scale: 1.15 }}
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border-2 shadow-huge transition-all duration-500 cursor-pointer relative",
                      isActive 
                        ? "bg-brand-section border-brand-accent text-brand-accent shadow-[0_0_20px_rgba(93,169,255,0.4)]" 
                        : "bg-brand-bg/95 border-white/15 text-brand-text-muted hover:border-brand-accent/45"
                    )}
                  >
                    <div className={cn("transition-all duration-500", isActive ? "scale-110" : "opacity-60")}>
                      {step.icon}
                    </div>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: [0.15, 0.4, 0.15], scale: [1, 1.4, 1] }}
                          exit={{ opacity: 0, scale: 2 }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute inset-0 rounded-2xl bg-brand-accent/30 blur-md pointer-events-none"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                <div className={cn(
                  "w-full flex md:col-span-5 transition-all duration-500",
                  !isLeft ? "md:justify-start text-left pl-0 md:pl-10" : "md:opacity-20 group-hover:opacity-100 md:order-first pr-0 md:pr-10 text-right"
                )}>
                  {!isLeft ? (
                    <motion.div 
                      onClick={() => setActiveStep(isActive ? null : idx)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={cn(
                        "p-6 rounded-3xl backdrop-blur-xl border flex flex-col gap-3 transition-all duration-500 text-left cursor-pointer w-full max-w-md mr-auto md:ml-0",
                        isActive 
                          ? "bg-brand-section/90 border-brand-accent/50 shadow-[0_0_30px_rgba(93,169,255,0.15)]" 
                          : "bg-brand-card/45 border-white/5 hover:border-white/15 hover:bg-brand-card/85"
                      )}
                    >
                      <div className="flex items-center justify-start gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent italic leading-none">
                        <span>Milestone {idx + 1}</span>
                      </div>
                      <h4 className="text-lg md:text-xl font-black text-brand-text-primary uppercase tracking-tight leading-tight">{step.label}</h4>
                      <p className="text-[11px] font-black text-brand-text-muted uppercase tracking-wider leading-none">{step.title}</p>
                      <p className="text-xs md:text-sm text-brand-text-secondary leading-relaxed opacity-90 max-w-sm">
                        "{step.desc}"
                      </p>

                      <AnimatePresence>
                        {isActive && step.items.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-white/5 space-y-2.5 text-left overflow-hidden"
                          >
                            <p className="text-[9px] font-black text-brand-accent uppercase tracking-[0.4em] mb-2">Strategic Focus Units</p>
                            {step.items.map((item: string, i: number) => (
                              <div key={i} className="flex gap-2.5 items-center text-xs font-bold text-brand-text-muted">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0 shadow-glow animate-pulse" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12 md:mt-24 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
         <div className="flex items-center gap-4">
            <div className="flex gap-1">
               {[...Array(5)].map((_, i) => <div key={i} className="w-4 h-1 rounded-full bg-brand-accent/20" />)}
            </div>
            <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.3em]">Expansion Velocity: Stable</span>
         </div>
         <div className="flex items-center gap-3">
            <Info size={12} />
            <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.3em]">Founders Journey Analysis Engine</span>
         </div>
      </div>
    </div>
  );
};

export const AnimatedCounter = ({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#08131D]" />
        {[20, 35, 50].map((r, i) => (
          <div 
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-brand-accent/5 rounded-full"
            style={{ width: `${r * 2}%`, height: `${r * 2}%` }}
          />
        ))}
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 2px, transparent 0)', backgroundSize: '40px 40px' }} 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/5 blur-[120px] rounded-full animate-pulse" />
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {investors.map((_, idx) => {
          const angle = (idx * (360 / investors.length)) - 90;
          const radius = 35;
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
            <span className="text-[10px] md:text-xs font-black text-brand-text-primary uppercase tracking-tight leading-tight block break-words px-1">
              {startupName || 'Venture'}
            </span>
            <div className="mt-2 flex items-center justify-center gap-1">
               <div className="w-1 h-1 rounded-full bg-brand-accent animate-ping" />
               <span className="text-[6px] md:text-[8px] font-black text-brand-accent uppercase tracking-[0.2em]">Core</span>
            </div>
          </div>
        </motion.div>
        
        <div className="absolute -inset-8 border border-brand-accent/5 rounded-full animate-spin-slow pointer-events-none" />
      </div>

      {investors.map((inv, idx) => {
        const angle = (idx * (360 / investors.length)) - 90;
        const radius = 35;
        const x = 50 + Math.cos((angle * Math.PI) / 180) * radius;
        const y = 50 + Math.sin((angle * Math.PI) / 180) * radius;
        const isHovered = hoveredIdx === idx;
        const matchScore = inv.matchScore ?? Math.min(99, 75 + (idx * 2));

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

              <div className="absolute bottom-1.5 inset-x-0 text-center">
                 <span className={cn(
                    "text-[8px] font-black tracking-widest leading-none transition-colors",
                    isHovered ? "text-brand-accent" : "text-brand-text-muted opacity-40 font-bold"
                 )}>
                    {matchScore}%
                 </span>
              </div>
            </div>

            <div className={cn(
              "mt-3 text-center whitespace-nowrap transition-all duration-500",
              isHovered ? "opacity-100 translate-y-1" : "opacity-30 scale-95"
            )}>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-text-primary">{inv.name}</p>
              {isHovered && <div className="w-4 h-0.5 bg-brand-accent mx-auto mt-1 rounded-full" />}
            </div>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: y < 50 ? -30 : 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: y < 50 ? -20 : 20 }}
                  transition={{ type: "spring", damping: 20, stiffness: 150 }}
                  className={cn(
                    "absolute w-80 md:w-[540px] p-8 md:p-10 rounded-[3rem] bg-brand-section/98 backdrop-blur-[50px] border border-brand-accent/30 shadow-huge pointer-events-auto z-[1000] text-left max-h-[80vh] overflow-y-auto custom-scrollbar",
                    y < 50 ? "top-full mt-10" : "bottom-full mb-10",
                    x < 40 ? "left-0" : x > 60 ? "right-0" : "left-1/2 -translate-x-1/2"
                  )}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.6em] mb-2 opacity-80">Compatibility Pathway</span>
                        <h4 className="text-xl font-black text-brand-text-primary uppercase tracking-tight">{inv.name}</h4>
                      </div>
                      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 font-black text-lg">
                        {matchScore}%
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5">
                           <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.5em] mb-2">Investor Type</p>
                           <p className="text-sm font-bold text-brand-text-primary uppercase tracking-tight">{inv.type}</p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5">
                           <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.5em] mb-2">Target Stage</p>
                           <p className="text-sm font-bold text-brand-text-primary uppercase tracking-tight">{inv.stage}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-black text-brand-text-muted uppercase tracking-[0.5em] mb-5">Strategic Rationale</p>
                        <p className="text-base md:text-lg text-brand-text-secondary leading-[1.9] font-medium italic opacity-95">
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

                  <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                    <Target size={40} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

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