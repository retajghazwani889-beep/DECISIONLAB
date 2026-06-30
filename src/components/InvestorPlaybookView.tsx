import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Target, MapPin, Layers, Wallet, Copy, Check, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';

interface PlaybookSection {
  title: string;
  items: string[];
}

interface InvestorPlaybookViewProps {
  investor: any;
  sections: PlaybookSection[];
  companyName: string;
  score: number;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Clean, on-brand SVG illustrations (line-art, brand blue). No images, no AI —
// crisp at any size and consistent across every tab.
// ---------------------------------------------------------------------------
const ACCENT = '#5da9ff';
const SOFT = '#2c5680';
const WHITE = '#e8f1fb';

const PresenterArt = () => (
  <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <rect x="118" y="34" width="104" height="70" rx="8" stroke={ACCENT} strokeWidth="3" />
    <line x1="134" y1="58" x2="200" y2="58" stroke={SOFT} strokeWidth="4" strokeLinecap="round" />
    <line x1="134" y1="72" x2="186" y2="72" stroke={SOFT} strokeWidth="4" strokeLinecap="round" />
    <rect x="138" y="82" width="10" height="12" fill={ACCENT} opacity="0.5" />
    <rect x="154" y="76" width="10" height="18" fill={ACCENT} opacity="0.7" />
    <rect x="170" y="70" width="10" height="24" fill={ACCENT} />
    <circle cx="62" cy="58" r="15" stroke={ACCENT} strokeWidth="3" />
    <path d="M40 132 V108 C40 92 52 84 62 84 C72 84 84 92 84 108 V132" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
    <line x1="84" y1="100" x2="116" y2="78" stroke={WHITE} strokeWidth="3" strokeLinecap="round" />
    <circle cx="116" cy="78" r="4" fill={ACCENT} />
    <line x1="44" y1="150" x2="196" y2="150" stroke={SOFT} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const TalkingArt = () => (
  <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <circle cx="74" cy="70" r="18" stroke={ACCENT} strokeWidth="3" />
    <path d="M44 140 V112 C44 92 58 82 74 82 C90 82 104 92 104 112 V140" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
    <rect x="126" y="44" width="86" height="56" rx="14" stroke={ACCENT} strokeWidth="3" />
    <path d="M150 100 L142 118 L166 100 Z" fill={ACCENT} opacity="0.25" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" />
    <line x1="144" y1="66" x2="194" y2="66" stroke={WHITE} strokeWidth="4" strokeLinecap="round" />
    <line x1="144" y1="80" x2="180" y2="80" stroke={SOFT} strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const QuestionArt = () => (
  <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <rect x="30" y="40" width="96" height="66" rx="16" stroke={ACCENT} strokeWidth="3" />
    <path d="M58 106 L50 126 L78 106 Z" fill={ACCENT} opacity="0.25" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" />
    <path d="M64 64 C64 56 86 56 86 66 C86 74 76 74 76 82" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" />
    <circle cx="76" cy="92" r="2.5" fill={ACCENT} />
    <rect x="118" y="92" width="92" height="62" rx="16" stroke={SOFT} strokeWidth="3" />
    <path d="M186 154 L196 174 L168 154 Z" fill={SOFT} opacity="0.3" stroke={SOFT} strokeWidth="2" strokeLinejoin="round" />
    <line x1="136" y1="116" x2="192" y2="116" stroke={WHITE} strokeWidth="4" strokeLinecap="round" />
    <line x1="136" y1="132" x2="176" y2="132" stroke={SOFT} strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const EmphasizeArt = () => (
  <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <polyline points="44,150 92,110 124,128 192,64" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M192 64 L176 66 M192 64 L190 80" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" />
    <circle cx="92" cy="110" r="5" fill={ACCENT} />
    <circle cx="124" cy="128" r="5" fill={ACCENT} />
    <path d="M120 30 l5 11 l12 1 l-9 8 l3 12 l-11 -6 l-11 6 l3 -12 l-9 -8 l12 -1 Z" fill={ACCENT} opacity="0.85" />
    <line x1="44" y1="160" x2="196" y2="160" stroke={SOFT} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const AvoidArt = () => (
  <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <path d="M120 44 L196 162 H44 Z" stroke={ACCENT} strokeWidth="3" strokeLinejoin="round" fill={ACCENT} opacity="0.08" />
    <path d="M120 44 L196 162 H44 Z" stroke={ACCENT} strokeWidth="3" strokeLinejoin="round" fill="none" />
    <line x1="120" y1="92" x2="120" y2="124" stroke={ACCENT} strokeWidth="6" strokeLinecap="round" />
    <circle cx="120" cy="142" r="4" fill={ACCENT} />
  </svg>
);

const PrepArt = () => (
  <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <rect x="74" y="36" width="92" height="128" rx="10" stroke={ACCENT} strokeWidth="3" />
    <rect x="100" y="28" width="40" height="18" rx="6" stroke={ACCENT} strokeWidth="3" fill={ACCENT} opacity="0.15" />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <rect x="88" y={64 + i * 30} width="16" height="16" rx="4" stroke={ACCENT} strokeWidth="2.5" />
        <path d={`M91 ${72 + i * 30} l3 3 l5 -6`} stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="114" y1={72 + i * 30} x2="150" y2={72 + i * 30} stroke={SOFT} strokeWidth="4" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

const NegotiationArt = () => (
  <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <path d="M30 120 L78 104 L120 118" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M210 120 L162 104 L120 118" stroke={SOFT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="104" y="104" width="32" height="26" rx="7" fill={ACCENT} opacity="0.25" stroke={ACCENT} strokeWidth="3" />
    <circle cx="78" cy="92" r="12" stroke={ACCENT} strokeWidth="3" />
    <circle cx="162" cy="92" r="12" stroke={SOFT} strokeWidth="3" />
    <line x1="44" y1="150" x2="196" y2="150" stroke={SOFT} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const pickArt = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('approach')) return <TalkingArt />;
  if (t.includes('pitch structure')) return <PresenterArt />;
  if (t.includes('talking')) return <TalkingArt />;
  if (t.includes('question')) return <QuestionArt />;
  if (t.includes('emphasize')) return <EmphasizeArt />;
  if (t.includes('avoid')) return <AvoidArt />;
  if (t.includes('style')) return <PresenterArt />;
  if (t.includes('preparation')) return <PrepArt />;
  if (t.includes('negotiation')) return <NegotiationArt />;
  return <TalkingArt />;
};

const shortLabel = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('approach')) return 'Approach';
  if (t.includes('pitch structure')) return 'Pitch';
  if (t.includes('talking')) return 'Talking Points';
  if (t.includes('question')) return 'Questions';
  if (t.includes('emphasize')) return 'Emphasize';
  if (t.includes('avoid')) return 'Avoid';
  if (t.includes('style')) return 'Style';
  if (t.includes('preparation')) return 'Prep';
  if (t.includes('negotiation')) return 'Negotiation';
  return title;
};

export default function InvestorPlaybookView({ investor, sections, companyName, score, onBack }: InvestorPlaybookViewProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const active = sections[activeTab] || sections[0];

  // Plain-text version of the full playbook (used for copy + as a fallback).
  const playbookText = () => {
    let out = `INVESTOR PLAYBOOK\n${investor?.name || 'Investor'} (${investor?.type || 'Investor'})\nFor: ${companyName}  •  Match ${investor?.matchScore ?? score}%\n`;
    sections.forEach((sec) => {
      out += `\n${sec.title.toUpperCase()}\n`;
      sec.items.forEach((it) => { out += `- ${it}\n`; });
    });
    return out;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(playbookText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (rare) — no-op; the PDF button still works.
    }
  };

  // Build the PDF as real, selectable text (not a screenshot), so it is crisp
  // and reliable on every device.
  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxW = pageW - margin * 2;
    let y = margin;

    const write = (text: string, size: number, rgb: [number, number, number], gapAfter: number, bold = false) => {
      doc.setFontSize(size);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, maxW);
      lines.forEach((ln: string) => {
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(ln, margin, y);
        y += size + 4;
      });
      y += gapAfter;
    };

    write('INVESTOR PLAYBOOK', 10, [93, 169, 255], 4, true);
    write(investor?.name || 'Investor', 20, [17, 17, 17], 2, true);
    write(`${investor?.type || 'Investor'}   |   For ${companyName}   |   Match ${investor?.matchScore ?? score}%`, 10, [110, 110, 110], 14);

    sections.forEach((sec) => {
      write(sec.title.toUpperCase(), 12, [93, 169, 255], 4, true);
      sec.items.forEach((it) => write('•  ' + it, 11, [34, 34, 34], 2));
      y += 8;
    });

    const safe = (investor?.name || 'Investor').replace(/[^a-z0-9]/gi, '_');
    doc.save(`${safe}_Playbook.pdf`);
  };

  const meta = [
    { icon: <Layers size={14} />, label: 'Industry', value: investor?.industryFocus },
    { icon: <Target size={14} />, label: 'Stage', value: investor?.stageFocus },
    { icon: <Wallet size={14} />, label: 'Check', value: investor?.checkSize },
    { icon: <MapPin size={14} />, label: 'Region', value: investor?.region },
  ].filter((m) => m.value);

  return (
    <div className="fixed inset-0 z-[1500] bg-brand-bg text-brand-text-primary overflow-y-auto">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-brand-accent/5 blur-[160px] rounded-full pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-section border border-brand-border/30 text-brand-text-secondary hover:text-white hover:border-brand-accent/40 transition-all text-[11px] font-black uppercase tracking-widest active:scale-95"
          >
            <ChevronLeft size={16} /> Back to Investors
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-brand-section border border-brand-border/30 text-brand-text-secondary hover:text-white hover:border-brand-accent/40 transition-all text-[11px] font-black uppercase tracking-widest active:scale-95"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-brand-accent text-brand-text-primary shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all text-[11px] font-black uppercase tracking-widest active:scale-95"
            >
              <Download size={15} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Header card */}
        <div className="bg-brand-section border border-brand-border rounded-[2.5rem] p-8 sm:p-10 shadow-huge relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-accent/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] block mb-2">{investor?.type || 'Investor'}</span>
              <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight font-display leading-[1.05]">{investor?.name || 'Investor'}</h1>
              <p className="text-sm text-brand-text-secondary font-medium mt-3 max-w-xl leading-relaxed">
                A tailored playbook for pitching <span className="text-white font-bold">{companyName}</span> to this investor — what to say, what they'll ask, and how to close.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="px-6 py-4 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 text-center">
                <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mb-1">Match</div>
                <div className="text-2xl font-black text-[#5ce1e6] font-mono leading-none">{investor?.matchScore ?? score}%</div>
              </div>
              <div className="px-6 py-4 rounded-2xl bg-brand-card/40 border border-white/5 text-center">
                <div className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest mb-1">Score</div>
                <div className="text-2xl font-black text-brand-accent font-mono leading-none">{score}%</div>
              </div>
            </div>
          </div>

          {meta.length > 0 && (
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-8 border-t border-white/5">
              {meta.map((m, i) => (
                <div key={i} className="p-4 rounded-2xl bg-brand-bg/40 border border-white/5">
                  <div className="flex items-center gap-2 text-brand-accent mb-1.5">{m.icon}<span className="text-[9px] font-black uppercase tracking-widest text-brand-text-muted">{m.label}</span></div>
                  <div className="text-xs font-bold text-white uppercase tracking-tight leading-snug break-words">{m.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {sections.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={cn(
                "px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === i
                  ? "bg-brand-accent text-brand-text-primary shadow-lg shadow-brand-accent/20"
                  : "bg-brand-section text-brand-text-secondary hover:text-white border border-brand-border/20 hover:border-brand-border/50"
              )}
            >
              {shortLabel(s.title)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start"
          >
            {/* Illustration */}
            <div className="lg:col-span-2 bg-brand-section/60 border border-brand-border rounded-[2.5rem] p-10 flex flex-col items-center justify-center min-h-[280px]">
              <div className="w-full max-w-[260px]">{pickArt(active.title)}</div>
              <h3 className="text-sm font-black text-brand-accent uppercase tracking-widest mt-6 text-center">{active.title}</h3>
            </div>

            {/* Items */}
            <div className="lg:col-span-3 bg-brand-section/60 border border-brand-border rounded-[2.5rem] p-8 sm:p-10">
              <ul className="space-y-4">
                {active.items.map((it, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-brand-bg/40 border border-white/5 hover:border-brand-accent/30 transition-all"
                  >
                    <span className="w-7 h-7 shrink-0 rounded-lg bg-brand-accent/15 border border-brand-accent/25 text-brand-accent font-black text-xs flex items-center justify-center font-mono">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-200 font-medium leading-relaxed pt-0.5">{it}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer nav between tabs */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={() => setActiveTab((t) => Math.max(0, t - 1))}
            disabled={activeTab === 0}
            className="px-6 py-4 rounded-2xl bg-brand-section border border-brand-border/20 text-[10px] font-black uppercase tracking-widest text-brand-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest font-mono">{activeTab + 1} / {sections.length}</span>
          <button
            onClick={() => setActiveTab((t) => Math.min(sections.length - 1, t + 1))}
            disabled={activeTab === sections.length - 1}
            className="px-6 py-4 rounded-2xl bg-brand-accent text-brand-text-primary text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-accent/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}