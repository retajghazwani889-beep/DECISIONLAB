import React, { useMemo } from 'react';
import { cn } from '../lib/utils';
import { 
  LucideIcon, Target, TrendingUp, Users, Zap, Briefcase, Globe, Shield, Activity, 
  PieChart, Info, DollarSign, Lightbulb, MapPin, Box, Rocket, 
  ChevronRight, Quote
} from 'lucide-react';
import { PitchDeck, PitchDeckSlide as SlideType, PitchDeckTemplate } from '../types';

const slideIcons: LucideIcon[] = [
  Target, TrendingUp, Users, Zap, Briefcase, Globe, Shield, Activity, 
  PieChart, Info, DollarSign, Lightbulb, MapPin, Box, Rocket
];

interface SlideProps {
  slide: SlideType;
  index: number;
  companyName: string;
  isEditable?: boolean;
  onEdit?: (updates: Partial<SlideType>) => void;
  activeElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  theme?: PitchDeck['theme'];
  template?: PitchDeckTemplate;
}

const THEMES: Record<PitchDeckTemplate, any> = {
  'Institutional VC': {
    bg: 'bg-[#08131D]',
    text: 'text-white',
    accent: '#5DA9FF',
    font: 'font-sans',
    headerStyle: 'uppercase tracking-[0.4em] text-white/40',
    titleStyle: 'text-7xl font-black uppercase tracking-tighter leading-[0.95]',
    cardStyle: 'bg-white/5 border-white/10 rounded-[3rem]',
    accentOpacity: 'opacity-10',
    grid: true,
    overlay: 'bg-gradient-to-t from-[#08131D] via-transparent to-transparent'
  },
  'Executive Corporate': {
    bg: 'bg-[#f8fafc]',
    text: 'text-[#1e293b]',
    accent: '#0f172a',
    font: 'font-serif',
    headerStyle: 'uppercase tracking-[0.5em] text-slate-300 font-sans font-bold',
    titleStyle: 'text-6xl font-bold tracking-tight text-[#0f172a] leading-tight',
    cardStyle: 'bg-white border-slate-200 rounded-none shadow-sm',
    accentOpacity: 'opacity-5',
    grid: false,
    overlay: 'bg-gradient-to-t from-slate-100/80 to-transparent'
  },
  'Modern SaaS': {
    bg: 'bg-[#ffffff]',
    text: 'text-slate-900',
    accent: '#3b82f6',
    font: 'font-sans',
    headerStyle: 'uppercase tracking-widest text-slate-400 font-bold',
    titleStyle: 'text-6xl font-extrabold tracking-tight text-slate-900',
    cardStyle: 'bg-white border-slate-100 rounded-[2.5rem] shadow-2xl shadow-blue-500/5',
    accentOpacity: 'opacity-20',
    grid: true,
    overlay: 'bg-gradient-to-br from-blue-500/10 to-transparent'
  },
  'Minimal Dark': {
    bg: 'bg-black',
    text: 'text-white',
    accent: '#ffffff',
    font: 'font-mono',
    headerStyle: 'uppercase tracking-[0.6em] text-[#444] font-bold',
    titleStyle: 'text-8xl font-light tracking-tighter uppercase leading-[0.9]',
    cardStyle: 'bg-[#111] border-[#222] rounded-none',
    accentOpacity: 'opacity-5',
    grid: false,
    overlay: 'bg-black/40'
  },
  'Founder Narrative': {
    bg: 'bg-[#fdfcfb]',
    text: 'text-[#2d2a2e]',
    accent: '#FF6B6B',
    font: 'font-sans',
    headerStyle: 'uppercase tracking-[0.3em] text-[#e0dad5] font-black',
    titleStyle: 'text-7xl font-black tracking-tighter text-[#2d2a2e] leading-[0.9]',
    cardStyle: 'bg-[#fff] border-[#f0ebe6] rounded-[4rem] shadow-xl shadow-orange-500/5',
    accentOpacity: 'opacity-30',
    grid: false,
    overlay: 'bg-gradient-to-tr from-orange-500/5 to-transparent'
  },
  'Fintech Editorial': {
    bg: 'bg-[#0a0a0a]',
    text: 'text-[#e2e8f0]',
    accent: '#67E8F9',
    font: 'font-sans',
    headerStyle: 'uppercase tracking-[0.6em] text-[#333] font-black',
    titleStyle: 'text-7xl font-black italic tracking-tighter text-white leading-none',
    cardStyle: 'bg-[#1a1a1a] border-[#262626] rounded-[3rem]',
    accentOpacity: 'opacity-10',
    grid: true,
    overlay: 'bg-cyan-500/5'
  },
  'Clean White Investor': {
    bg: 'bg-white',
    text: 'text-neutral-900',
    accent: '#000000',
    font: 'font-sans',
    headerStyle: 'uppercase tracking-[0.8em] text-neutral-200 font-bold',
    titleStyle: 'text-6xl font-medium tracking-tight text-neutral-900',
    cardStyle: 'bg-neutral-50 border-neutral-100 rounded-none',
    accentOpacity: 'opacity-2',
    grid: false,
    overlay: 'bg-white/40'
  },
  'Classic Pitch': {
    bg: 'bg-[#0f172a]',
    text: 'text-white',
    accent: '#ef4444',
    font: 'font-sans',
    headerStyle: 'uppercase tracking-[0.4em] text-white/20 font-black',
    titleStyle: 'text-8xl font-black uppercase tracking-tighter text-white',
    cardStyle: 'bg-white/5 border-white/10 rounded-2xl',
    accentOpacity: 'opacity-20',
    grid: true,
    overlay: 'bg-red-500/5'
  },
  'Gradient Modern': {
    bg: 'bg-[#020617]',
    text: 'text-white',
    accent: '#8B5CF6',
    font: 'font-sans',
    headerStyle: 'uppercase tracking-[0.3em] text-purple-500/40 font-bold',
    titleStyle: 'text-7xl font-black tracking-tighter bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent',
    cardStyle: 'bg-white/5 border-white/10 rounded-[3.5rem] backdrop-blur-xl',
    accentOpacity: 'opacity-20',
    grid: false,
    overlay: 'bg-gradient-to-bl from-purple-500/10 to-transparent'
  },
  'Bold Presentation': {
    bg: 'bg-[#fcd34d]',
    text: 'text-black',
    accent: '#000000',
    font: 'font-sans',
    headerStyle: 'uppercase tracking-[0.4em] text-black/40 font-black',
    titleStyle: 'text-8xl font-black uppercase tracking-tighter leading-[0.85]',
    cardStyle: 'bg-white border-4 border-black rounded-none shadow-[12px_12px_0_0_#000]',
    accentOpacity: 'opacity-5',
    grid: true,
    overlay: 'bg-yellow-600/5'
  },
  'Elegant Editorial': {
    bg: 'bg-[#fafaf9]',
    text: 'text-[#1c1917]',
    accent: '#78716c',
    font: 'font-serif',
    headerStyle: 'uppercase tracking-[0.5em] text-[#d6d3d1] font-sans italic',
    titleStyle: 'text-7xl font-light tracking-tight text-[#1c1917] leading-tight',
    cardStyle: 'bg-white border-[#e7e5e4] rounded-none',
    accentOpacity: 'opacity-2',
    grid: false,
    overlay: 'bg-[#fafaf9]/80'
  }
};

/**
 * Intelligent Font Sizing Logic
 */
const getScaledFontSize = (text: string, baseSize: string, threshold = 150) => {
  if (!text) return baseSize;
  const length = text.length;
  if (length < 80) return baseSize;
  if (length < 150) return baseSize.replace('4xl', '3xl').replace('text-4xl', 'text-2xl');
  if (length < threshold) return 'text-sm';
  return 'text-xs';
};

export const PitchDeckSlide: React.FC<SlideProps> = ({ 
  slide, 
  index, 
  companyName, 
  isEditable = false, 
  onSelectElement,
  activeElementId,
  template = 'Institutional VC'
}) => {
  const currentTheme = THEMES[template] || THEMES['Institutional VC'];
  const Icon = slideIcons[index % slideIcons.length];
  const accentColor = slide.colorAccent || currentTheme.accent;
  
  const keywords = slide.imageKeywords ? slide.imageKeywords.split(',').map((k: string) => k.trim()).join(',') : 'business,startup,tech';
  const imageUrl = slide.imageUrl || `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop`;

  const layout = slide.layout || 'split';

  // Smart scaling for content
  const contentFontSize = useMemo(() => {
    return getScaledFontSize(slide.content, 'text-4xl');
  }, [slide.content]);

  const EditableElement = ({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) => {
    const isSelected = activeElementId === id;
    
    return (
      <div 
        className={cn(
          "relative group/edit pointer-events-auto transition-all",
          isEditable && "cursor-pointer hover:ring-2 hover:ring-brand-accent/50 rounded-lg p-1",
          isEditable && isSelected && "ring-2 ring-brand-accent",
          className
        )}
        onClick={(e) => {
          if (isEditable && onSelectElement) {
            e.stopPropagation();
            onSelectElement(id);
          }
        }}
      >
        {children}
        {isEditable && isSelected && (
          <div className="absolute -top-8 left-0 px-2 py-1 bg-brand-accent text-brand-bg text-xs font-black uppercase tracking-widest rounded shadow-lg whitespace-nowrap z-50">
            Editing {id.split('-').pop()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      id={`pitch-slide-${index}`}
      className={cn(
        "w-[1280px] h-[720px] overflow-hidden relative print:shadow-none print:m-0 flex flex-col shrink-0",
        currentTheme.bg,
        currentTheme.text,
        currentTheme.font
      )}
      style={{ borderLeft: `12px solid ${accentColor}`, pageBreakAfter: 'always' }}
      onClick={() => isEditable && onSelectElement && onSelectElement(null)}
    >
      {/* Background Decor and elements render */}
      {slide.elements && slide.elements.length > 0 ? (
        <div className="absolute inset-0 z-0">
           {slide.elements.map((el) => (
             <div 
               key={el.id}
               className="absolute overflow-hidden"
               style={{
                 left: `${el.x}%`,
                 top: `${el.y}%`,
                 width: `${el.w}%`,
                 height: `${el.h}%`,
                 zIndex: el.zIndex,
                 opacity: el.opacity ?? 1,
                 transform: `rotate(${el.rotation || 0}deg)`
               }}
             >
               {el.type === 'image' ? (
                 <img src={el.content} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                 <div 
                   style={{ 
                     fontSize: `${(el.fontSize || 16) * 1.5}px`, // Adjusted for 1280px view
                     textAlign: el.textAlign || 'left',
                     fontWeight: el.fontWeight || 'normal',
                     color: el.color || 'inherit',
                     fontFamily: el.fontFamily || 'inherit'
                   }}
                 >
                   {el.content}
                 </div>
               )}
             </div>
           ))}
        </div>
      ) : (
        <>
          {/* Background Decor */}
          <div className={cn("absolute inset-0 pointer-events-none print:hidden", currentTheme.accentOpacity)}>
            <div 
              className="absolute top-0 right-0 w-[800px] h-[800px] blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" 
              style={{ backgroundColor: `${accentColor}33` }}
            />
            <div 
              className="absolute bottom-0 left-0 w-[600px] h-[600px] blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" 
              style={{ backgroundColor: `${accentColor}1a` }}
            />
          </div>
        </>
      )}

      {/* Decorative Grid */}
      {currentTheme.grid && (
        <div className="absolute inset-0 opacity-[0.03] print:hidden" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 2px, transparent 0)', backgroundSize: '60px 60px' }} 
        />
      )}

      {/* Header */}
      <div className="relative z-10 p-16 pb-0 flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl"
              style={{ backgroundColor: accentColor }}
            >
              <Icon size={24} />
            </div>
            <span className={cn("text-sm font-black uppercase tracking-[0.4em]", currentTheme.headerStyle)}>Slide {index + 1}</span>
          </div>
          <EditableElement id={`slide-${index}-title`} className="inline-block">
            <h2 className={cn(currentTheme.titleStyle, "mb-4")}>
              {slide.title}
            </h2>
          </EditableElement>
          <div className="h-2 w-32 rounded-full" style={{ backgroundColor: accentColor }} />
        </div>
        <div className="text-right">
          <p className="text-2xl font-black opacity-30 uppercase tracking-[0.3em]">{companyName}</p>
          <p className="text-sm font-bold opacity-20 uppercase tracking-widest mt-2 underline decoration-brand-accent/30 decoration-2 underline-offset-8">Venture Suite</p>
        </div>
      </div>

      {/* Content Body - Varied Layouts */}
      <div className="relative z-10 flex-1 px-16 py-12 flex gap-20 overflow-hidden">
        {layout === 'split' && (
          <>
            <div className="w-[55%] flex flex-col justify-center">
              <EditableElement id={`slide-${index}-content`} className="mb-12">
                <div className="relative">
                  <Quote size={40} className="absolute -top-10 -left-6 opacity-10" style={{ color: accentColor }} />
                  <p className={cn(contentFontSize, "font-bold leading-tight opacity-90 italic relative z-10")}>
                    {slide.content}
                  </p>
                </div>
              </EditableElement>
              
              <EditableElement id={`slide-${index}-points`} className="space-y-6">
                {Array.isArray(slide.points) && slide.points.map((point: string, i: number) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div 
                      className="w-4 h-4 rounded-full mt-2 shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                      style={{ backgroundColor: accentColor }}
                    />
                    <p className="text-sm font-medium opacity-70 leading-snug">
                      {point}
                    </p>
                  </div>
                ))}
              </EditableElement>
            </div>

            <div className="w-[45%] flex flex-col justify-center items-center">
              <EditableElement id={`slide-${index}-image`} className="w-full">
                <div className={cn("w-full h-[360px] overflow-hidden border border-white/10 shadow-huge relative group", currentTheme.cardStyle)}>
                   <img 
                     src={imageUrl} 
                     alt="Visual" 
                     className="w-full h-full object-cover grayscale-[10%] group-hover:scale-105 transition-transform duration-1000" 
                     referrerPolicy="no-referrer"
                   />
                   <div className={cn("absolute inset-0 opacity-60", currentTheme.overlay)} />
                   <div className="absolute bottom-6 left-6 right-6">
                      <div className="p-6 bg-black/40 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-2xl">
                         <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: accentColor }}>Strategic Intelligence</p>
                         <p className="text-xs font-bold text-white/90 leading-tight">
                           {slide.visualSuggestion}
                         </p>
                      </div>
                   </div>
                </div>
              </EditableElement>
              
              {slide.metric && (
                <EditableElement id={`slide-${index}-metric`} className="mt-8 w-full">
                  <div className={cn("p-6 backdrop-blur-xl border border-white/5 flex items-center justify-between shadow-2xl relative overflow-hidden", currentTheme.cardStyle)}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="relative z-10">
                      <p className="text-xs font-black opacity-40 uppercase tracking-[0.3em] mb-2">Performance Data</p>
                      <p className="text-3xl font-black tracking-tight">{slide.metric.label}</p>
                    </div>
                    <div 
                      className="px-8 py-3 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl relative z-10"
                      style={{ backgroundColor: accentColor }}
                    >
                      {slide.metric.value}
                    </div>
                  </div>
                </EditableElement>
              )}
            </div>
          </>
        )}

        {layout === 'centered' && (
          <div className="w-full flex flex-col items-center justify-center text-center max-w-5xl mx-auto space-y-12">
            <EditableElement id={`slide-${index}-content`}>
              <h3 className={cn(contentFontSize, "font-black uppercase tracking-tighter")} style={{ color: accentColor }}>
                {slide.content}
              </h3>
            </EditableElement>
            
            <EditableElement id={`slide-${index}-points`} className="grid grid-cols-2 gap-8 w-full">
               {Array.isArray(slide.points) && slide.points.map((point: string, i: number) => (
                  <div key={i} className={cn("p-8 border border-white/10 relative overflow-hidden group", currentTheme.cardStyle)}>
                     <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-white/5 transition-colors" />
                     <p className="text-2xl font-bold opacity-80 leading-relaxed italic relative z-10">"{point}"</p>
                  </div>
               ))}
            </EditableElement>

            {slide.metric && (
              <EditableElement id={`slide-${index}-metric`} className="px-12 py-6 bg-brand-accent/5 border border-brand-accent/10 rounded-[3rem] inline-flex items-center gap-12 hover:scale-105 transition-transform">
                 <div className="text-left">
                   <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-60">Success Metric</p>
                   <p className="text-4xl font-black">{slide.metric.label}</p>
                 </div>
                 <p className="text-8xl font-black italic tracking-tighter" style={{ color: accentColor }}>{slide.metric.value}</p>
              </EditableElement>
            )}
          </div>
        )}

        {layout === 'hero' && (
          <div className="w-full h-full relative p-0 flex gap-12">
             <div className="w-2/3 relative">
               <EditableElement id={`slide-${index}-image`} className="h-full rounded-[4rem] overflow-hidden border border-white/10 shadow-huge group">
                  <img 
                    src={imageUrl} 
                    alt="Hero" 
                    className="w-full h-full object-cover grayscale-[10%]" 
                    referrerPolicy="no-referrer"
                  />
                  <div className={cn("absolute inset-0", currentTheme.overlay)} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  
                  <div className="absolute bottom-12 left-12 max-w-md">
                     <p className="text-xs font-black uppercase tracking-[0.4em] mb-4 text-white/60">Objective Focus</p>
                     <EditableElement id={`slide-${index}-content`}>
                       <h3 className="text-4xl font-black text-white leading-tight italic tracking-tighter">"{slide.content}"</h3>
                     </EditableElement>
                  </div>
               </EditableElement>
             </div>

             <div className="w-1/3 flex flex-col justify-center gap-8">
                <EditableElement id={`slide-${index}-points`} className="space-y-6">
                   {Array.isArray(slide.points) && slide.points.map((point: string, i: number) => (
                     <div key={i} className="flex items-center gap-4 text-xs font-bold opacity-70 group">
                        <ChevronRight size={18} style={{ color: accentColor }} className="group-hover:translate-x-1 transition-transform" />
                        {point}
                     </div>
                   ))}
                </EditableElement>
                
                {slide.metric && (
                  <EditableElement id={`slide-${index}-metric`}>
                    <div className={cn("p-6 border border-white/10 bg-white/5", currentTheme.cardStyle)}>
                       <p className="text-xs font-black uppercase tracking-widest mb-2 opacity-40">Target KPI</p>
                       <p className="text-2xl font-black mb-1">{slide.metric.label}</p>
                       <p className="text-5xl font-black italic tracking-tighter" style={{ color: accentColor }}>{slide.metric.value}</p>
                    </div>
                  </EditableElement>
                )}
             </div>
          </div>
        )}

        {layout === 'grid' && (
          <div className="w-full grid grid-cols-12 gap-10">
            <div className="col-span-7 flex flex-col gap-10">
               <EditableElement id={`slide-${index}-content`} className={cn("p-10 border border-white/5 relative overflow-hidden", currentTheme.cardStyle)}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 blur-3xl rounded-full" />
                  <p className="text-2xl font-black uppercase tracking-widest mb-4 opacity-40">Core Insight</p>
                  <p className={cn(contentFontSize, "font-bold opacity-90 leading-tight italic")}>"{slide.content}"</p>
               </EditableElement>

               <EditableElement id={`slide-${index}-points`} className="grid grid-cols-2 gap-6">
                  {Array.isArray(slide.points) && slide.points.slice(0, 4).map((point: string, i: number) => (
                    <div key={i} className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors">
                       <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                       <p className="text-xs font-bold opacity-80 leading-tight">{point}</p>
                    </div>
                  ))}
               </EditableElement>
            </div>

            <div className="col-span-5 flex flex-col gap-10">
               <EditableElement id={`slide-${index}-image`} className="flex-1">
                  <div className={cn("h-full min-h-[400px] overflow-hidden border border-white/5 relative shadow-huge group", currentTheme.cardStyle)}>
                    <img src={imageUrl} alt="Grid" className="w-full h-full object-cover grayscale-[10%]" referrerPolicy="no-referrer" />
                    <div className={cn("absolute inset-0 opacity-40", currentTheme.overlay)} />
                    
                    {slide.metric && (
                      <div className="absolute bottom-0 left-0 right-0 p-8 bg-black/40 backdrop-blur-3xl border-t border-white/10 flex items-center justify-between">
                         <div className="text-left">
                            <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">Growth Data</p>
                            <p className="text-sm font-black text-white uppercase">{slide.metric.label}</p>
                         </div>
                         <p className="text-5xl font-black italic tracking-tighter" style={{ color: accentColor }}>{slide.metric.value}</p>
                      </div>
                    )}
                  </div>
               </EditableElement>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 p-12 py-8 border-t border-white/5 flex justify-between items-center bg-white/[0.01]">
        <div className="flex items-center gap-4">
           <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
           <span className="text-sm font-black opacity-30 uppercase tracking-[0.4em] font-sans">Investment Memorandum</span>
        </div>
        <div>
           <span className="text-sm font-black opacity-20 uppercase tracking-widest">{companyName} Strategy & Valuation • 2026</span>
        </div>
      </div>
    </div>
  );
};
