import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { Upload, ArrowRight, Sparkles, FileText, Info, Target, BarChart3, Shield, X, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { track } from '../lib/analytics';

interface StartupFormProps {
  user: any;
  profile: UserProfile | null;
  onOpenAccess: () => void;
}

export default function StartupForm({ user, profile, onOpenAccess }: StartupFormProps) {
  const { signInWithGoogle } = useAuth();
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [deckText, setDeckText] = useState('');
  const [deckName, setDeckName] = useState('');
  const [parsingDeck, setParsingDeck] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Pull readable text out of an uploaded pitch deck so it can be fed into the
  // analysis. TXT and DOCX are read reliably; PDF uses pdf.js (loaded on demand).
  // Anything that fails is handled gracefully — we tell the user and let them
  // proceed with whatever they typed instead of breaking the page.
  const handleDeckFile = async (file: File) => {
    if (!file) return;
    setParsingDeck(true);
    setDeckName(file.name);
    try {
      const name = file.name.toLowerCase();
      let text = '';

      if (name.endsWith('.txt')) {
        text = await file.text();
      } else if (name.endsWith('.docx')) {
        const mammoth: any = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result?.value || '';
      } else if (name.endsWith('.pdf')) {
        const pdfjs: any = await import('pdfjs-dist');
        // Worker is loaded from a CDN matching the exact installed version,
        // which avoids bundler worker-path issues.
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const data = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data }).promise;
        const pages: string[] = [];
        const maxPages = Math.min(pdf.numPages, 30);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map((it: any) => it.str).join(' '));
        }
        text = pages.join('\n');
      } else {
        alert('Please upload a PDF, DOCX, or TXT file.');
        setDeckName('');
        return;
      }

      const cleaned = text.replace(/\s+/g, ' ').trim();
      if (!cleaned) {
        alert("We couldn't read any text from that file. If it's a scanned PDF (an image), try a text-based PDF, DOCX, or TXT instead. You can still run the analysis with your description.");
        setDeckName('');
        return;
      }
      // Cap at 12 000 chars — enough for a full pitch deck without overloading the prompt.
      setDeckText(cleaned.slice(0, 12000));
    } catch (err) {
      console.error('Pitch deck parsing failed:', err);
      alert("We couldn't read that file. DOCX and TXT work most reliably; for PDFs make sure it's text-based (not a scan). You can still run the analysis with your description.");
      setDeckName('');
      setDeckText('');
    } finally {
      setParsingDeck(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearDeck = () => {
    setDeckText('');
    setDeckName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!idea.trim() && !deckText) || loading || parsingDeck) return;

    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 500);
    setLoading(true);
    try {
      // Attach the extracted pitch-deck text to the description that gets
      // analyzed, so the deck genuinely informs the analysis.
      const combinedIdea = deckText
        ? `${idea.trim()}\n\n--- PITCH DECK CONTENT (from ${deckName}) ---\n${deckText}`.trim()
        : idea;

      if (!user) {
        localStorage.setItem('pending_analysis_idea', combinedIdea);
        track.ideaSubmitted();
        track.signupStarted('email');
        onOpenAccess();
        return;
      }
      track.ideaSubmitted();
      // Navigate to analyze page with state
      navigate('/analyze', { state: { idea: combinedIdea } });
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // User closed popup, just reset loading
        console.log("Auth cancelled by user");
      } else {
        console.error("Auth failed:", error);
        alert("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-brand-section text-brand-text-primary backdrop-blur-2xl rounded-[3rem] shadow-huge border border-brand-border p-10 md:p-14 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 blur-[120px] rounded-full -z-10 group-hover:bg-brand-accent/10 transition-colors duration-1000" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-brand-bg rounded-3xl flex items-center justify-center text-brand-accent border border-white/5 relative overflow-hidden group-hover:scale-105 transition-transform duration-500 shadow-2xl">
              <div className="absolute inset-0 bg-brand-accent/10 animate-pulse" />
              <Sparkles size={28} className="relative z-10" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tighter font-display">Validate My Idea</h3>
            </div>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-10 relative z-10">
          <div className="relative group/box">
            <div className="flex items-center justify-between mb-4 px-2">
                <label className="text-[11px] font-black text-[#d8f0ff] uppercase tracking-[0.2em] group-focus-within/box:text-brand-accent transition-colors">Description</label>
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">50 Chars recommended</span>
            </div>
            <textarea
              className="w-full h-56 px-8 py-8 bg-brand-bg/50 border border-brand-border rounded-[2.5rem] text-brand-text-primary placeholder:text-brand-text-muted/20 focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent focus:shadow-huge outline-none transition-all duration-500 overflow-hidden resize-none font-medium leading-relaxed shadow-inner"
              placeholder="E.g. We are building a bank for new markets. We use low costs to help users save more..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              maxLength={5000}
            />
            <div className="absolute bottom-8 right-8 flex items-center gap-3">
               <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (idea.length / 100) * 100)}%` }}
                    className="h-full bg-brand-accent"
                  />
               </div>
               <span className="text-[10px] text-brand-text-muted/50 font-black tracking-widest uppercase">
                 {idea.length}
               </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 relative group/upload">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDeckFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsingDeck}
                className="w-full h-full flex items-center justify-center gap-4 px-6 py-6 rounded-[2rem] border border-white/5 bg-brand-bg/50 hover:bg-brand-bg hover:border-brand-accent/40 transition-all duration-500 disabled:opacity-60"
              >
                {parsingDeck ? (
                  <Loader2 size={22} className="text-brand-accent animate-spin" />
                ) : deckName ? (
                  <FileText size={22} className="text-brand-accent transition-colors" />
                ) : (
                  <Upload size={22} className="text-brand-text-muted transition-colors" />
                )}
                <div className="flex flex-col items-start min-w-0">
                  {parsingDeck ? (
                    <span className="text-xs font-black text-brand-accent uppercase tracking-tight">Reading deck...</span>
                  ) : deckName ? (
                    <>
                      <span className="text-xs font-black text-brand-accent uppercase tracking-tight truncate max-w-[160px]">{deckName}</span>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase opacity-80">Added to analysis</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-black text-brand-text-primary uppercase tracking-tight">Pitch Decks</span>
                      <span className="text-[9px] font-bold text-brand-text-muted uppercase opacity-40">PDF / DOCX / TXT</span>
                    </>
                  )}
                </div>
              </button>
              {deckName && !parsingDeck && (
                <button
                  type="button"
                  onClick={clearDeck}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-brand-bg border border-white/10 text-brand-text-muted hover:text-rose-400 hover:border-rose-400/40 transition-all z-20"
                  title="Remove pitch deck"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={(!idea.trim() && !deckText) || loading || parsingDeck}
              className={cn(
                "md:col-span-7 inline-flex items-center justify-center gap-4 py-6 btn-premium-start disabled:opacity-40 text-white font-bold rounded-[2rem] shadow-2xl transition-all active:scale-95 group uppercase text-xs tracking-[0.05em] overflow-hidden relative"
              )}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
              <span className="relative z-10 flex items-center gap-4">
                {loading ? 'Just a second...' : 'Check Now'}
                <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" strokeWidth={3} />
              </span>
            </button>
          </div>
        </form>

        <div className="mt-14 pt-10 border-t border-white/5 flex flex-wrap items-center justify-center gap-12 relative z-10">
          {[
            { label: 'VC Check', icon: <Target size={16} />, color: 'text-brand-blue', size: 'text-[11px]' },
            { label: 'Market Facts', icon: <BarChart3 size={16} />, color: 'text-brand-emerald', size: 'text-[11px]' },
            { label: 'Risk Review', icon: <Shield size={16} />, color: 'text-brand-coral', size: 'text-[12px]' }
          ].map((tag, i) => (
             <div key={i} className={cn("flex items-center gap-3 font-black text-brand-text-muted uppercase tracking-[0.2em] group/tag", tag.size)}>
                <span className={cn("transition-transform group-hover/tag:scale-125 duration-500", tag.color)}>{tag.icon}</span>
                {tag.label}
             </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}