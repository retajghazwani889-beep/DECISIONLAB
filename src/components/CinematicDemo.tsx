import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  FileUp,
  Search,
  BarChart3,
  Shield,
  Target,
  Database,
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
  Cpu,
  Pause,
  Play,
  Lightbulb,
  TrendingUp,
  FileText,
} from "lucide-react";
import { cn } from "../lib/utils";

const DEMO_STEPS = [
  { id: "ingestion", label: "Step 1: Upload", icon: <FileUp size={18} /> },
  { id: "synthesis", label: "Step 2: Study", icon: <Cpu size={18} /> },
  { id: "visualization", label: "Step 3: View", icon: <BarChart3 size={18} /> },
  { id: "blueprint", label: "Step 4: Map", icon: <Layout size={18} /> },
  { id: "refinement", label: "Step 5: Fix", icon: <Settings2 size={18} /> },
  { id: "deployment", label: "Step 6: Done", icon: <Lock size={18} /> },
];

export default function CinematicDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % DEMO_STEPS.length);
      }, 4500); // 4.5 seconds per step
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  return (
    <div className="w-[92%] max-w-[1200px] mx-auto h-[720px] bg-brand-bg border border-white/5 rounded-[4rem] overflow-hidden shadow-huge relative flex flex-col group/demo">
      {/* Neural Background Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
              y: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 5 + Math.random() * 10, repeat: Infinity }}
            className="absolute w-1 h-1 bg-brand-accent rounded-full"
          />
        ))}
      </div>

      {/* Demo Header */}
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
            <span className="text-[10px] font-medium text-brand-text-primary uppercase tracking-[0.4em] leading-[1.5] pt-2">
              How it works
            </span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-[10px] font-medium text-brand-text-muted uppercase tracking-[0.2em] opacity-40">
            Session: Active
          </div>
          <div className="text-[10px] font-medium text-brand-emerald bg-brand-emerald/10 px-4 py-1.5 rounded-full border border-brand-emerald/20 uppercase tracking-[0.3em]">
            Secure
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden p-12 pt-15">
        <AnimatePresence mode="wait">
          {/* STEP 1: UPLOAD */}
          {DEMO_STEPS[currentStep].id === "ingestion" && (
            <motion.div
              key="ingestion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center p-8 md:p-12"
            >
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                {/* Upload Zone */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full max-w-[580px] aspect-[4/3] rounded-[3rem] md:rounded-[4rem] border-2 border-dashed border-brand-accent/20 bg-brand-accent/[0.03] flex flex-col items-center justify-center gap-6 md:gap-12 relative overflow-hidden shadow-huge"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-brand-accent/[0.05] to-transparent pointer-events-none" />
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shadow-glow"
                  >
                    <FileUp size={40} className="w-8 h-8 md:w-10 md:h-10" />
                  </motion.div>
                  <div className="text-center space-y-3 px-6 h-auto">
                    <h4 className="text-xl md:text-2xl font-medium text-brand-text-primary uppercase tracking-[0.05em] font-display break-words pt-2 px-1 leading-[1.5] overflow-visible">
                      UPLOAD YOUR DECK
                    </h4>
                    <p className="text-sm md:text-base font-medium text-slate-300 tracking-[0.02em] opacity-95 leading-[1.6] px-1">
                      PDF / Pitch Deck / URL
                    </p>
                  </div>

                  {/* Scanning Line */}
                  <motion.div
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute left-0 right-0 h-[2px] bg-brand-accent shadow-[0_0_20px_var(--color-brand-accent)] opacity-40 z-10"
                  />
                </motion.div>

                {/* Side Metadata Traces */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 space-y-4">
                  {[1, 2, 3].map((i) => (
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
                  <p className="text-[12px] font-medium text-[#5da9ff] uppercase tracking-[0.02em] opacity-95 italic leading-[1.5] pt-2">
                    Reading your file
                  </p>
                  <p className="text-[12px] font-medium text-slate-300 uppercase tracking-[0.02em] opacity-90 leading-[1.5]">
                    Path: /dev/data_01
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SYNTHESIS */}
          {DEMO_STEPS[currentStep].id === "synthesis" && (
            <motion.div
              key="synthesis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center p-12"
            >
              <div className="w-full h-full flex flex-col relative overflow-hidden">
                <div className="flex items-start justify-between mb-8 w-full gap-8">
                  <div className="flex-1 space-y-1 h-auto min-w-0">
                    <div className="flex items-center gap-3 text-[#5da9ff]">
                      <Activity size={16} />
                      <p className="text-sm font-semibold uppercase tracking-[0.02em] leading-[1.5] pt-2 px-1">
                        STEP OVERVIEW
                      </p>
                    </div>
                    <h4 className="text-2xl md:text-3xl font-medium text-brand-text-primary uppercase font-display leading-[1.1] break-words pt-2 px-1 tracking-[0.05em] overflow-visible">
                      MAPPING YOUR IDEAS
                    </h4>
                    <p className="text-sm md:text-base text-slate-300 font-medium tracking-[0.02em] opacity-95 leading-[1.4] mt-1.5 px-1 max-w-2xl">
                      We map your startup against key business signals before
                      generating reports
                    </p>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 pb-4 overflow-y-auto">
                  {/* Inline CSS styling for telemetry pulse scanning and custom glows */}
                  <style>{`
                      @keyframes telemetryGlowPulse {
                        0%, 100% {
                          opacity: 0.7;
                          border-color: rgba(93, 169, 255, 0.12);
                          box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 10px rgba(93, 169, 255, 0.05);
                        }
                        50% {
                          opacity: 0.98;
                          border-color: rgba(93, 169, 255, 0.55);
                          box-shadow: 0 4px 24px rgba(0,0,0,0.6), 0 0 20px rgba(93, 169, 255, 0.22);
                        }
                      }
                      @keyframes telemetryGaugePulse {
                        0%, 100% {
                          opacity: 0.55;
                        }
                        50% {
                          opacity: 1;
                        }
                      }
                      .telemetry-card-glow {
                        animation: telemetryGlowPulse 3s infinite ease-in-out;
                      }
                      .telemetry-gauge-pulse {
                        animation: telemetryGaugePulse 2.4s infinite ease-in-out;
                      }
                      .glow-green {
                        filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.65));
                      }
                      .glow-blue {
                        filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.65));
                      }
                      .glow-orange {
                        filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.65));
                      }
                      .glow-crimson {
                        filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.65));
                      }
                    `}</style>

                  {[
                    {
                      id: "market-size",
                      name: "Market Size",
                      badge: "STRENGTH",
                      badgeStyle:
                        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                      percentage: 92,
                    },
                    {
                      id: "target-audience",
                      name: "Target Audience",
                      badge: "OPTIMAL",
                      badgeStyle:
                        "bg-blue-500/15 text-[#5DA9FF] border-blue-500/30",
                      percentage: 95,
                    },
                    {
                      id: "problem-strength",
                      name: "Problem Strength",
                      badge: "STRENGTH",
                      badgeStyle:
                        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                      percentage: 75,
                    },
                    {
                      id: "solution-value",
                      name: "Solution Value",
                      badge: "VALUE",
                      badgeStyle:
                        "bg-blue-500/15 text-[#5DA9FF] border-blue-500/30",
                      percentage: 70,
                    },
                    {
                      id: "competition",
                      name: "Competitors",
                      badge: "LOW",
                      badgeStyle:
                        "bg-amber-500/15 text-amber-400 border-amber-500/30",
                      percentage: 30,
                    },
                    {
                      id: "revenue-potential",
                      name: "Revenue Potential",
                      badge: "OPTIMAL",
                      badgeStyle:
                        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                      percentage: 85,
                    },
                    {
                      id: "growth-potential",
                      name: "Growth Potential",
                      badge: "GROWTH",
                      badgeStyle:
                        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                      percentage: 90,
                    },
                    {
                      id: "risk-score",
                      name: "Risk Score",
                      badge: "LOW",
                      badgeStyle:
                        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                      percentage: 15,
                    },
                    {
                      id: "investor-interest",
                      name: "Investor Interest",
                      badge: "OPTIMAL",
                      badgeStyle:
                        "bg-blue-500/15 text-blue-400 border-blue-500/30",
                      percentage: 94,
                    },
                    {
                      id: "scalability",
                      name: "Scalability",
                      badge: "STRENGTH",
                      badgeStyle:
                        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                      percentage: 92,
                    },
                  ].map((signal, i) => {
                    return (
                      <motion.div
                        key={signal.name}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.04 }}
                        className="rounded-2xl border p-4 flex flex-col items-center justify-between relative overflow-hidden group transition-all duration-300 telemetry-card-glow min-h-[195px] bg-[#0b1622]/40"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1B92FF]/5 via-transparent to-transparent pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity duration-300" />
                        <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-[#1B92FF]/5 rounded-full blur-xl pointer-events-none" />

                        <div className="w-full text-center relative z-10">
                          <h5 className="font-sans font-extrabold text-[10px] md:text-[11px] text-[#8fa0b0] tracking-[0.1em] leading-tight group-hover:text-white transition-colors uppercase">
                            {signal.name}
                          </h5>
                        </div>

                        <div className="relative w-full aspect-[1.8/1] flex items-center justify-center my-1 z-10 overflow-visible">
                          {signal.id === "market-size" && (
                            <svg
                              viewBox="0 0 100 65"
                              className="w-[105px] h-auto overflow-visible telemetry-gauge-pulse"
                            >
                              <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.03)"
                                strokeWidth="1"
                              />
                              <path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#132a3a"
                                strokeWidth="5"
                                strokeLinecap="round"
                              />
                              <motion.path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#10B981"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray="141"
                                initial={{ strokeDashoffset: 141 }}
                                animate={{
                                  strokeDashoffset:
                                    141 - (signal.percentage / 100) * 141,
                                }}
                                transition={{ duration: 1.8, ease: "easeOut" }}
                                className="glow-green"
                              />
                              {[0, 1, 2, 3, 4, 5, 6].map((tick) => {
                                const angle = -180 + tick * 30;
                                const x1 =
                                  50 + 26 * Math.cos((angle * Math.PI) / 180);
                                const y1 =
                                  50 + 26 * Math.sin((angle * Math.PI) / 180);
                                const x2 =
                                  50 + 30 * Math.cos((angle * Math.PI) / 180);
                                const y2 =
                                  50 + 30 * Math.sin((angle * Math.PI) / 180);
                                return (
                                  <line
                                    key={tick}
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="1"
                                  />
                                );
                              })}
                              <g
                                transform={`rotate(${-90 + (signal.percentage / 100) * 180} 50 50)`}
                              >
                                <line
                                  x1="50"
                                  y1="50"
                                  x2="50"
                                  y2="23"
                                  stroke="#ef4444"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="3.5"
                                  fill="#ef4444"
                                />
                                <circle cx="50" cy="50" r="1.2" fill="#fff" />
                              </g>
                              <text
                                x="50"
                                y="47"
                                textAnchor="middle"
                                className="fill-brand-text-primary font-mono font-black text-[10px] tracking-tight"
                              >
                                {signal.percentage}%
                              </text>
                            </svg>
                          )}

                          {signal.id === "target-audience" && (
                            <div className="flex flex-col items-center justify-center h-[55px] w-full relative overflow-visible">
                              <span className="font-mono font-black text-3xl md:text-4xl text-[#5DA9FF] tracking-widest leading-none drop-shadow-[0_0_8px_rgba(93,169,255,0.4)]">
                                10M
                              </span>
                              <div className="mt-1 flex flex-col items-center">
                                <span className="text-[7px] font-mono tracking-widest text-[#8fa0b0] uppercase opacity-75">
                                  MARKET REACH SECTOR
                                </span>
                                <span className="text-[6px] font-mono text-[#5DA9FF]/50 uppercase tracking-wider">
                                  SCAN: HIGH SPEED
                                </span>
                              </div>
                            </div>
                          )}

                          {signal.id === "problem-strength" && (
                            <svg
                              viewBox="0 0 100 65"
                              className="w-[105px] h-auto overflow-visible telemetry-gauge-pulse"
                            >
                              <path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#132a3a"
                                strokeWidth="5"
                                strokeLinecap="round"
                              />
                              <motion.path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#10B981"
                                strokeWidth="5.5"
                                strokeLinecap="round"
                                strokeDasharray="141"
                                initial={{ strokeDashoffset: 141 }}
                                animate={{
                                  strokeDashoffset:
                                    141 - (signal.percentage / 100) * 141,
                                }}
                                transition={{ duration: 1.8, ease: "easeOut" }}
                                className="glow-green"
                              />
                              <text
                                x="50"
                                y="45"
                                textAnchor="middle"
                                className="fill-brand-text-primary font-mono font-black text-xs"
                              >
                                {signal.percentage}%
                              </text>
                              <text
                                x="50"
                                y="55"
                                textAnchor="middle"
                                className="fill-brand-text-muted font-mono text-[7px] tracking-wider uppercase"
                              >
                                LOAD RAD
                              </text>
                            </svg>
                          )}

                          {signal.id === "solution-value" && (
                            <svg
                              viewBox="0 0 100 65"
                              className="w-[105px] h-auto overflow-visible telemetry-gauge-pulse"
                            >
                              <path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#132a3a"
                                strokeWidth="5"
                                strokeLinecap="round"
                              />
                              <motion.path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="5.5"
                                strokeLinecap="round"
                                strokeDasharray="141"
                                initial={{ strokeDashoffset: 141 }}
                                animate={{
                                  strokeDashoffset:
                                    141 - (signal.percentage / 100) * 141,
                                }}
                                transition={{ duration: 1.8, ease: "easeOut" }}
                                className="glow-blue"
                              />
                              <text
                                x="50"
                                y="42"
                                textAnchor="middle"
                                className="fill-brand-text-primary font-mono font-black text-xs"
                              >
                                70%
                              </text>
                              <text
                                x="50"
                                y="53"
                                textAnchor="middle"
                                className="fill-[#3b82f6] font-mono font-bold text-[8px] tracking-widest uppercase"
                              >
                                VALUE
                              </text>
                            </svg>
                          )}

                          {signal.id === "competition" && (
                            <div className="relative w-full h-[55px] flex items-center justify-center my-1 z-10 overflow-visible">
                              <div className="absolute w-[60px] h-[60px] rounded-full border border-brand-accent/10 flex items-center justify-center">
                                <div className="absolute w-[40px] h-[40px] rounded-full border border-brand-accent/5" />
                                <div className="absolute w-[20px] h-[20px] rounded-full border border-brand-accent/5" />
                                <div className="absolute top-0 bottom-0 w-px bg-brand-accent/5" />
                                <div className="absolute left-0 right-0 h-px bg-brand-accent/5" />
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-brand-accent/15 rounded-full"
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 3.5,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                />
                              </div>
                              <div className="relative flex items-end justify-center gap-1 h-[40px] w-full max-w-[80px] z-10 px-1 pt-1">
                                {[35, 65, 42, 85, 48, 70, 30].map(
                                  (height, barIdx) => (
                                    <div
                                      key={barIdx}
                                      className="flex-1 bg-brand-accent/10 rounded-sm w-[5px] h-full relative overflow-hidden"
                                    >
                                      <motion.div
                                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-400 to-[#FF6B6B]"
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{
                                          duration: 0.9 + barIdx * 0.1,
                                          repeat: Infinity,
                                          repeatType: "reverse",
                                          ease: "easeInOut",
                                        }}
                                      />
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                          {signal.id === "revenue-potential" && (
                            <svg
                              viewBox="0 0 100 65"
                              className="w-[105px] h-auto overflow-visible telemetry-gauge-pulse"
                            >
                              <path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#132a3a"
                                strokeWidth="5"
                                strokeLinecap="round"
                              />
                              <motion.path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="5.5"
                                strokeLinecap="round"
                                strokeDasharray="141"
                                initial={{ strokeDashoffset: 141 }}
                                animate={{
                                  strokeDashoffset:
                                    141 - (signal.percentage / 100) * 141,
                                }}
                                transition={{ duration: 1.8, ease: "easeOut" }}
                                className="glow-orange"
                              />
                              <text
                                x="50"
                                y="45"
                                textAnchor="middle"
                                className="fill-brand-text-primary font-mono font-black text-xs"
                              >
                                {signal.percentage}%
                              </text>
                              <text
                                x="50"
                                y="55"
                                textAnchor="middle"
                                className="fill-brand-text-muted font-mono text-[7px] tracking-wider uppercase"
                              >
                                ANNUAL CAP
                              </text>
                            </svg>
                          )}

                          {signal.id === "growth-potential" && (
                            <svg
                              viewBox="0 0 100 65"
                              className="w-[105px] h-auto overflow-visible telemetry-gauge-pulse"
                            >
                              <path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#132a3a"
                                strokeWidth="5"
                                strokeLinecap="round"
                              />
                              <motion.path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#10B981"
                                strokeWidth="5.5"
                                strokeLinecap="round"
                                strokeDasharray="141"
                                initial={{ strokeDashoffset: 141 }}
                                animate={{
                                  strokeDashoffset:
                                    141 - (signal.percentage / 100) * 141,
                                }}
                                transition={{ duration: 1.8, ease: "easeOut" }}
                                className="glow-green"
                              />
                              <text
                                x="50"
                                y="45"
                                textAnchor="middle"
                                className="fill-brand-text-primary font-mono font-black text-xs"
                              >
                                {signal.percentage}%
                              </text>
                              <text
                                x="50"
                                y="55"
                                textAnchor="middle"
                                className="fill-[#10B981] font-mono text-[7px] tracking-widest uppercase"
                              >
                                GROWTH HP
                              </text>
                            </svg>
                          )}

                          {signal.id === "risk-score" && (
                            <svg
                              viewBox="0 0 100 65"
                              className="w-[105px] h-auto overflow-visible telemetry-gauge-pulse"
                            >
                              <path
                                d="M 25 45 A 25 25 0 0 1 75 45"
                                fill="none"
                                stroke="#132a3a"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M 60 30 A 25 25 0 0 1 75 45"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="4"
                                strokeLinecap="round"
                              />
                              <text
                                x="18"
                                y="53"
                                className="fill-brand-text-muted font-mono text-[7px] font-bold"
                              >
                                MIN
                              </text>
                              <text
                                x="82"
                                y="53"
                                className="fill-brand-text-muted font-mono text-[7px] font-bold"
                              >
                                MAX
                              </text>

                              <g transform="rotate(-30 50 45)">
                                <line
                                  x1="50"
                                  y1="45"
                                  x2="50"
                                  y2="21"
                                  stroke="#ef4444"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <circle
                                  cx="50"
                                  cy="45"
                                  r="3.2"
                                  fill="#ef4444"
                                />
                                <circle cx="50" cy="45" r="1" fill="#fff" />
                              </g>
                              <text
                                x="50"
                                y="54"
                                textAnchor="middle"
                                className="fill-brand-text-primary font-mono text-[8.5px] font-bold uppercase tracking-wider"
                              >
                                SECURE
                              </text>
                            </svg>
                          )}

                          {signal.id === "investor-interest" && (
                            <svg
                              viewBox="0 0 100 65"
                              className="w-[105px] h-auto overflow-visible telemetry-gauge-pulse"
                            >
                              <path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#132a3a"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray="4 2"
                              />
                              <motion.path
                                d="M 20 50 A 30 30 0 1 1 80 50"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="5.5"
                                strokeLinecap="round"
                                strokeDasharray="141"
                                initial={{ strokeDashoffset: 141 }}
                                animate={{ strokeDashoffset: 141 - 105 }}
                                transition={{ duration: 1.8, ease: "easeOut" }}
                                className="glow-blue"
                              />
                              <text
                                x="50"
                                y="44"
                                textAnchor="middle"
                                className="fill-brand-text-primary font-mono font-black text-sm tracking-tight"
                              >
                                94%
                              </text>
                              <text
                                x="50"
                                y="54"
                                textAnchor="middle"
                                className="fill-[#3b82f6] font-mono text-[7px] tracking-widest uppercase"
                              >
                                MULTIPLIER
                              </text>
                            </svg>
                          )}

                          {signal.id === "scalability" && (
                            <div className="flex items-end justify-center gap-1.5 h-[50px] w-full px-2 pt-1 pb-1 relative z-10">
                              {[
                                {
                                  h: "25%",
                                  text: "S1",
                                  color: "from-[#1e293b] to-[#475569]",
                                },
                                {
                                  h: "45%",
                                  text: "S2",
                                  color: "from-[#1e1b4b] to-[#4f46e5]",
                                },
                                {
                                  h: "70%",
                                  text: "S3",
                                  color: "from-[#0f172a] to-[#2563eb]",
                                },
                                {
                                  h: "95%",
                                  text: "S4",
                                  color: "from-[#022c22] to-[#10b981]",
                                },
                              ].map((bar, barIdx) => (
                                <div
                                  key={barIdx}
                                  className="w-[18px] flex flex-col items-center"
                                >
                                  <div className="w-full relative h-[38px] bg-black/40 border border-white/5 rounded-t-sm overflow-hidden shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]">
                                    <motion.div
                                      className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${bar.color} rounded-t-sm`}
                                      initial={{ height: 0 }}
                                      animate={{ height: bar.h }}
                                      transition={{
                                        duration: 1.6,
                                        delay: barIdx * 0.15,
                                        ease: "easeOut",
                                      }}
                                    />
                                  </div>
                                  <span className="text-[7px] font-mono text-[#8fa0b0] opacity-70 mt-1">
                                    ${bar.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="w-full flex justify-center pb-0.5 relative z-10">
                          <div
                            className={cn(
                              "px-2.5 py-0.5 rounded-md text-[9px] font-mono tracking-[0.08em] uppercase font-bold border flex items-center gap-1 shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-300",
                              signal.badgeStyle,
                            )}
                          >
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
                            </span>
                            {signal.badge}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: VISUALIZE */}
          {DEMO_STEPS[currentStep].id === "visualization" && (
            <motion.div
              key="visualization"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="absolute inset-0 flex p-16 gap-16"
            >
              <div className="flex-1 flex flex-col justify-center h-auto">
                <div className="space-y-6 pt-12 mb-16 overflow-visible">
                  <h4 className="text-2xl md:text-4xl font-extrabold uppercase font-display leading-[1.3] tracking-[0.06em] pt-2 px-1 overflow-visible bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
                    REPORT DETAILS
                  </h4>
                  <p className="text-base md:text-[18px] text-slate-300 font-medium tracking-[0.02em] opacity-95 max-w-md leading-[1.6] px-1">
                    A complete, beautiful summary of your vital startup metrics
                  </p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center relative">
                  <div className="grid grid-cols-5 gap-6 md:gap-8 w-full max-w-3xl relative z-10">
                    {[
                      {
                        label: "MOAT",
                        icon: <Shield size={26} />,
                        score: 85,
                        color: "#10b981",
                      },
                      {
                        label: "CAPITAL",
                        icon: <Target size={26} />,
                        score: 79,
                        color: "#3b82f6",
                      },
                      {
                        label: "TEAM",
                        icon: <Users size={26} />,
                        score: 94,
                        color: "#8b5cf6",
                      },
                      {
                        label: "MARKET",
                        icon: <Globe size={26} />,
                        score: 88,
                        color: "#f59e0b",
                      },
                      {
                        label: "PRODUCT",
                        icon: <Database size={26} />,
                        score: 92,
                        color: "#10b981",
                      },
                    ].map((p, i) => {
                      const radius = 38;
                      const strokeWidth = 5;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = circumference * (1 - p.score / 100);

                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex flex-col items-center gap-4 w-full"
                        >
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#152d3f]/90 border border-white/5 flex items-center justify-center shadow-huge relative group hover:scale-105 transition-all duration-300">
                            {/* Circular progress ring */}
                            <svg
                              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                              viewBox="0 0 100 100"
                            >
                              <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                className="stroke-white/5 fill-none"
                                strokeWidth={strokeWidth}
                              />
                              <motion.circle
                                cx="50"
                                cy="50"
                                r={radius}
                                className="fill-none stroke-linecap-round"
                                stroke={p.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: strokeDashoffset }}
                                transition={{ duration: 1.5, delay: i * 0.1 + 0.3 }}
                                style={{ filter: `drop-shadow(0 0 6px ${p.color}80)` }}
                              />
                            </svg>
                            <div className="absolute inset-2 rounded-full bg-[#102434]/50 flex items-center justify-center text-teal-400 transition-colors group-hover:bg-[#102434]/20 z-10">
                              <div className="text-white/90 group-hover:text-white transition-all duration-300">
                                {p.icon}
                              </div>
                            </div>
                          </div>
                          <span className="font-semibold text-[16px] md:text-[19px] text-white uppercase tracking-[0.02em] text-center w-full block truncate select-none leading-none mt-2 whitespace-nowrap">
                            {p.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                  {/* Connection line */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-8 pointer-events-none" />
                </div>
              </div>

              <div className="w-[450px] space-y-8 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    {
                      label: "Signal Clarity",
                      val: "99.2%",
                      labelClass: "text-[15px] text-center",
                      valClass: "text-center",
                    },
                    {
                      label: "Risk Factor",
                      val: "Low",
                      labelClass: "text-[15px] text-center",
                      valClass: "text-[21px] text-center",
                    },
                    {
                      label: "Alpha Cohort",
                      val: "Top 1%",
                      labelClass: "text-[15px] text-center",
                      valClass: "text-center",
                    },
                    {
                      label: "Defensibility",
                      val: "High",
                      labelClass: "text-[15px] text-center",
                      valClass: "text-center",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-6 rounded-3xl bg-brand-card border border-white/5 space-y-2"
                    >
                      <p
                        className={cn(
                          "font-medium text-brand-text-muted uppercase tracking-[0.05em] leading-[1.5] pt-2",
                          item.labelClass,
                        )}
                      >
                        {item.label}
                      </p>
                      <p
                        className={cn(
                          "font-medium text-brand-text-primary italic tabular-nums leading-[1.5]",
                          item.valClass,
                        )}
                      >
                        {item.val}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-10 rounded-[3rem] bg-brand-accent/5 border border-brand-accent/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-brand-accent uppercase tracking-[0.1em] mb-2 leading-[1.5] pt-2">
                      Venture Score
                    </p>
                    <p className="text-5xl md:text-6xl font-medium italic tracking-tighter text-brand-text-primary leading-[1.5]">
                      88
                    </p>
                  </div>
                  <div className="text-right">
                    <Zap
                      size={32}
                      className="text-brand-accent animate-pulse ml-auto mb-4"
                    />
                    <p className="text-[10px] font-medium text-brand-emerald bg-brand-emerald/10 px-4 py-2 rounded-full border border-brand-emerald/20 uppercase tracking-[0.05em] leading-[1.5] pt-2">
                      Investor Ready
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: BLUEPRINT */}
          {DEMO_STEPS[currentStep].id === "blueprint" && (
            <motion.div
              key="blueprint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col p-16 gap-12"
            >
              <div className="flex items-end justify-between border-b border-white/5 pb-8 relative h-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-pulse" />
                    <p className="text-sm font-semibold text-brand-emerald uppercase tracking-[0.02em] leading-[1.5] pt-2 px-1">
                      Strategic Architecture
                    </p>
                  </div>
                  <h4 className="text-2xl md:text-3xl font-medium text-brand-text-primary uppercase font-display leading-[1.5] pt-2 px-1 tracking-[0.05em] overflow-visible">
                    Execution Blueprint
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold text-slate-300 uppercase tracking-[0.02em] opacity-95 leading-[1.5] pt-2">
                  <Globe size={14} /> Global Expansion Layer v.0.1
                </div>
              </div>

              <div className="flex-1 relative flex flex-col justify-center">
                {/* Continuous, glowing connecting line cutting through the base/center map */}
                <div className="absolute top-[38%] left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-emerald-500/20 via-emerald-400 to-teal-400/80 to-emerald-500/20 z-0 opacity-70" />

                {/* Animated pulse on the glowing line */}
                <div className="absolute top-[38%] left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-transparent via-teal-300 to-transparent z-0 opacity-100 animate-[pulse_2s_infinite]" />

                <div className="grid grid-cols-4 gap-6 w-full relative z-10 items-stretch">
                  {/* PHASE 01 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col h-full bg-[#0a141d]/85 hover:bg-[#0c1a26]/95 border border-white/5 hover:border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden group hover:shadow-[0_0_30px_rgba(16,185,129,0.08)] transition-all duration-500 flex-1 justify-between"
                  >
                    <div>
                      {/* Tag */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          PHASE 01
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      </div>

                      {/* Visual Asset Node */}
                      <div className="relative w-16 h-16 rounded-2xl bg-brand-card/80 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] mb-5 mx-auto group-hover:scale-110 transition-transform duration-300">
                        <Lightbulb className="w-8 h-8 text-emerald-400 animate-pulse" />
                        <div className="absolute -inset-1 bg-emerald-500/20 rounded-2xl filter blur opacity-30 animate-pulse" />
                      </div>

                      {/* Title & Description */}
                      <h5 className="text-sm font-extrabold text-white uppercase tracking-wider text-center mb-2">
                        START IDEA
                      </h5>
                      <p className="text-[13px] text-slate-300 font-medium tracking-[0.02em] text-center leading-[1.6] mb-4 opacity-95 min-h-[48px]">
                        Start with your business idea and identify the problem
                        you want to solve
                      </p>
                    </div>

                    {/* Bullet points */}
                    <div className="border-t border-white/5 pt-4 space-y-2 mt-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="text-emerald-400 mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-brand-text-primary leading-snug font-medium">
                          Define your startup idea
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="text-emerald-400 mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-brand-text-primary leading-snug font-medium">
                          Identify target users
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* PHASE 02 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col h-full bg-[#0a141d]/85 hover:bg-[#0c1a26]/95 border border-white/5 hover:border-teal-500/30 rounded-3xl p-6 relative overflow-hidden group hover:shadow-[0_0_30px_rgba(6,182,212,0.08)] transition-all duration-500 flex-1 justify-between"
                  >
                    <div>
                      {/* Tag */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.15em] bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                          PHASE 02
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 opacity-60" />
                      </div>

                      {/* High-fidelity micro dashboard or AI interlocking nodes */}
                      <div className="relative w-full h-16 bg-brand-card/90 border border-teal-500/20 rounded-2xl p-2.5 mb-5 flex items-center justify-between gap-2 overflow-hidden hover:border-teal-500/40 transition-colors">
                        <div className="flex-1 flex flex-col gap-1.5 justify-center">
                          <div className="h-1.5 w-3/4 bg-white/10 rounded" />
                          <div className="h-1.5 w-1/2 bg-white/5 rounded" />
                          <div className="flex gap-1 mt-1">
                            <div className="h-3 w-6 bg-teal-500/20 rounded flex items-center justify-center text-[7px] text-teal-300 font-bold border border-teal-500/30">
                              AI
                            </div>
                            <div className="h-3 w-8 bg-emerald-500/20 rounded flex items-center justify-center text-[7px] text-emerald-300 font-bold border border-emerald-500/30">
                              Moat
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-6 bg-emerald-500/40 rounded-sm" />
                            <div className="w-1.5 h-8 bg-teal-400/60 rounded-sm animate-pulse" />
                            <div className="w-1.5 h-5 bg-white/15 rounded-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h5 className="text-sm font-extrabold text-white uppercase tracking-wider text-center mb-2">
                        BUSINESS ANALYSIS
                      </h5>
                      <p className="text-[13px] text-slate-300 font-medium tracking-[0.02em] text-center leading-[1.6] mb-4 opacity-95 min-h-[48px]">
                        Analyze your startup and discover opportunities for
                        growth
                      </p>
                    </div>

                    {/* Bullet points */}
                    <div className="border-t border-white/5 pt-4 space-y-2 mt-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="text-teal-400 mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-brand-text-primary leading-snug font-medium">
                          Find competitors
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="text-teal-400 mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-brand-text-primary leading-snug font-medium">
                          Identify strengths and weaknesses
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* PHASE 03 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col h-full bg-[#0a141d]/85 hover:bg-[#0c1a26]/95 border border-white/5 hover:border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden group hover:shadow-[0_0_30px_rgba(16,185,129,0.08)] transition-all duration-500 flex-1 justify-between"
                  >
                    <div>
                      {/* Tag */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          PHASE 03
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-60" />
                      </div>

                      {/* Premium financial curve graph illustration */}
                      <div className="relative w-full h-16 bg-brand-card/90 border border-emerald-500/20 rounded-2xl p-2 mb-5 flex items-center justify-between gap-2 overflow-hidden hover:border-emerald-500/40 transition-colors">
                        <div className="flex-1 h-full flex flex-col justify-between py-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1">
                              <Users size={10} className="text-emerald-400" />
                              <span className="text-[8px] text-brand-text-muted font-mono leading-none font-medium">
                                MARKET SIZE $2.4B
                              </span>
                            </div>
                            <span className="text-[8px] text-emerald-400 font-semibold bg-emerald-500/10 px-1 rounded border border-emerald-500/20 leading-none">
                              +14% YoY
                            </span>
                          </div>
                          <svg
                            className="w-full h-5 mt-1"
                            viewBox="0 0 100 20"
                            fill="none"
                          >
                            <path
                              d="M 0 16 Q 20 12, 40 13 T 80 4 T 100 1"
                              stroke="url(#emerald-gradient-3)"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <circle cx="100" cy="1" r="2" fill="#10b981" />
                            <defs>
                              <linearGradient
                                id="emerald-gradient-3"
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="0"
                              >
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#10b981" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h5 className="text-sm font-extrabold text-white uppercase tracking-wider text-center mb-2">
                        MARKET POTENTIAL
                      </h5>
                      <p className="text-[13px] text-slate-300 font-medium tracking-[0.02em] text-center leading-[1.6] mb-4 opacity-95 min-h-[48px]">
                        Understand demand and measure your startup's growth
                        potential
                      </p>
                    </div>

                    {/* Bullet points */}
                    <div className="border-t border-white/5 pt-4 space-y-2 mt-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="text-emerald-400 mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-brand-text-primary leading-snug font-medium">
                          Market insights
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="text-emerald-400 mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-brand-text-primary leading-snug font-medium">
                          Growth opportunities
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* PHASE 04 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col h-full bg-[#0a141d]/85 hover:bg-[#0c1a26]/95 border border-white/5 hover:border-teal-500/30 rounded-3xl p-6 relative overflow-hidden group hover:shadow-[0_0_30px_rgba(6,182,212,0.08)] transition-all duration-500 flex-1 justify-between"
                  >
                    <div>
                      {/* Tag */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.15em] bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                          PHASE 04
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 opacity-60" />
                      </div>

                      {/* Glossy pitch deck document representation */}
                      <div className="relative w-full h-16 bg-brand-card/90 border border-teal-500/20 rounded-2xl p-2.5 mb-5 flex items-center justify-between gap-2 overflow-hidden hover:border-teal-500/40 transition-colors">
                        <div className="flex items-center gap-1">
                          <div className="w-7 h-9 bg-gradient-to-br from-neutral-800 to-black border border-white/10 rounded-md flex flex-col justify-between p-1 shadow-md relative group-hover:scale-105 transition-transform">
                            <div className="w-full h-1 bg-white/20 rounded-sm" />
                            <div className="space-y-0.5">
                              <div className="w-4 h-0.5 bg-emerald-400 rounded-sm" />
                              <div className="w-5 h-0.5 bg-white/10 rounded-sm" />
                            </div>
                            <div className="flex justify-end">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <CheckCircle2 size={5} className="text-white" />
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-0.5 ml-1">
                            <span className="text-[9px] text-white font-black leading-none">
                              PITCH_DEC_v2
                            </span>
                            <span className="text-[7px] text-brand-text-muted font-mono leading-none">
                              PPTX • 12 SLIDES
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <Download size={10} className="animate-bounce" />
                          </div>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h5 className="text-sm font-extrabold text-white uppercase tracking-wider text-center mb-2">
                        PITCH & EXPORT
                      </h5>
                      <p className="text-[13px] text-slate-300 font-medium tracking-[0.02em] text-center leading-[1.6] mb-4 opacity-95 min-h-[48px]">
                        Generate investor-ready reports and pitch materials
                      </p>
                    </div>

                    {/* Bullet points */}
                    <div className="border-t border-white/5 pt-4 space-y-2 mt-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="text-teal-400 mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-brand-text-primary leading-snug font-medium">
                          Download reports
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="text-teal-400 mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-brand-text-primary leading-snug font-medium">
                          Export pitch decks
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
          {/* STEP 5: REFINE */}
          {DEMO_STEPS[currentStep].id === "refinement" && (
            <motion.div
              key="refinement"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute inset-0 flex p-16 gap-12"
            >
              <div className="w-1/3 space-y-8 h-auto">
                <h4 className="text-xl md:text-2xl font-medium text-brand-text-primary uppercase font-display leading-[1.5] mb-12 pt-2 px-1 tracking-[0.05em] overflow-visible">
                  Refinement
                </h4>
                <div className="space-y-6">
                  {[
                    { label: "Risk Sensitivity", val: 45 },
                    { label: "Market Concentration", val: 72 },
                    { label: "Alpha Generation", val: 88 },
                  ].map((ctl, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between text-[12px] font-medium text-slate-300 uppercase tracking-[0.02em] leading-[1.5] pt-2">
                        <span>{ctl.label}</span>
                        <span className="text-[#5da9ff]">{ctl.val}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full relative">
                        <motion.div
                          animate={{ left: `${ctl.val}%` }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse",
                          }}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-brand-accent rounded-full shadow-glow border-2 border-brand-bg z-10"
                        />
                        <div
                          className="absolute inset-y-0 left-0 bg-brand-accent/20 rounded-full"
                          style={{ width: `${ctl.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-12">
                  <div className="p-8 rounded-[2rem] bg-brand-accent/5 border border-brand-accent/20 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={16} className="text-brand-accent" />
                      <p className="text-[10px] font-medium text-brand-accent uppercase tracking-[0.1em] leading-[1.5] pt-2">
                        Optimizing Mitigation
                      </p>
                    </div>
                    <p className="text-sm text-slate-300 font-medium italic tracking-[0.02em] leading-[1.6]">
                      "Latency signals neutralized via strategic pivot
                      simulation"
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-brand-section/40 rounded-[4rem] border border-white/5 p-12 overflow-hidden relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,var(--color-brand-accent)_0%,transparent_60%)]" />
                <div className="relative h-full flex flex-col justify-center">
                  <p className="text-[10px] font-medium text-brand-text-muted uppercase tracking-[0.1em] mb-4 leading-[1.5] pt-2">
                    Live Confidence Delta
                  </p>
                  <div className="flex items-baseline gap-4 mb-12">
                    <motion.h4
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-7xl md:text-8xl font-medium italic tracking-tighter text-brand-text-primary leading-[1.5] pt-2 overflow-visible"
                    >
                      98.4
                    </motion.h4>
                    <span className="text-3xl md:text-4xl font-medium text-brand-emerald uppercase tracking-[-0.05em] tabular-nums leading-[1.5] pt-2">
                      {" "}
                      +1.2%
                    </span>
                  </div>

                  <div className="h-24 flex items-end gap-2 opacity-30">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [20, Math.random() * 80 + 20, 30] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.05,
                        }}
                        className="flex-1 bg-brand-accent rounded-t-lg"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: DEPLOY */}
          {DEMO_STEPS[currentStep].id === "deployment" && (
            <motion.div
              key="deployment"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden"
            >
              <div className="text-center space-y-8 max-w-2xl w-full flex flex-col items-center justify-center py-4 md:py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, delay: 0.2 }}
                  className="w-28 h-28 rounded-3xl bg-brand-emerald/10 border-2 border-brand-emerald/20 flex items-center justify-center text-brand-emerald mx-auto relative shadow-huge shrink-0 animate-fade-in"
                >
                  <CheckCircle2 size={48} />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 rounded-3xl bg-brand-emerald/20"
                  />
                </motion.div>

                <div className="space-y-2 h-auto">
                  <motion.h4
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-3xl md:text-4xl font-semibold text-brand-text-primary uppercase tracking-[0.05em] font-display leading-[1.3] pt-1 px-1 overflow-visible"
                  >
                    Ready for <br /> Export
                  </motion.h4>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.95 }}
                    transition={{ delay: 0.8 }}
                    className="text-[12px] font-semibold text-slate-300 uppercase tracking-[0.02em] leading-[1.4] pt-1"
                  >
                    Analysis complete
                  </motion.p>
                </div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="grid grid-cols-3 gap-4 md:gap-6 w-full max-w-lg"
                >
                  {[
                    { label: "PDF Report", icon: <Download size={16} /> },
                    { label: "Deck Export", icon: <FileUp size={16} /> },
                    { label: "Partner Invite", icon: <ArrowRight size={16} /> },
                  ].map((btn, i) => (
                    <div
                      key={i}
                      className="px-6 py-4 rounded-2xl bg-brand-section border border-white/10 hover:border-brand-emerald/30 hover:bg-brand-emerald/5 transition-all cursor-pointer group/btn flex flex-col items-center justify-center gap-2"
                    >
                      <div className="text-brand-text-muted group-hover/btn:text-brand-emerald transition-colors">
                        {btn.icon}
                      </div>
                      <span className="text-[12px] font-medium text-brand-text-primary uppercase tracking-[0.02em] leading-[1.3] pt-1 px-1 text-center select-none">
                        {btn.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-28 border-t border-white/5 bg-brand-section/30 backdrop-blur-md px-6 md:px-12 flex items-center justify-center shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep(
                (prev) => (prev - 1 + DEMO_STEPS.length) % DEMO_STEPS.length,
              );
            }}
            className="w-10 h-10 rounded-xl bg-white/5 text-brand-text-primary flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-2xl bg-brand-accent text-brand-bg flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-glow"
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep((prev) => (prev + 1) % DEMO_STEPS.length);
            }}
            className="w-10 h-10 rounded-xl bg-white/5 text-brand-text-primary flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
          >
            <ChevronRight size={18} />
          </button>
          <div className="h-10 w-px bg-white/10 mx-2" />
          <div className="text-[13px] font-semibold text-brand-text-primary uppercase tracking-[0.02em] whitespace-nowrap leading-[1.5] pt-2">
            Step {currentStep + 1} of {DEMO_STEPS.length}
          </div>
        </div>
      </div>
    </div>
  );
}
