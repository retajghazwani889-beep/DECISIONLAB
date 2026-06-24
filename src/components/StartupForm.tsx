import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { Upload, ArrowRight, Sparkles, FileText, Info, Target, BarChart3, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { safeLocalStorage as localStorage } from '../lib/storage';

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
  const navigate = useNavigate();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || loading) return;

    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 500);
    setLoading(true);
    try {
      if (!user) {
        localStorage.setItem('pending_analysis_idea', idea);
        onOpenAccess();
        return;
      }
      // Navigate to analyze page with state
      navigate('/analyze', { state: { idea } });
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
              <h3 className="text-3xl font-black text-brand-text-primary uppercase tracking-tighter font-display">Start Now</h3>
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
                type="button"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onClick={() => alert("Upload feature requires Premium Access. Try basic analysis first!")}
              />
              <div className="h-full flex items-center justify-center gap-4 px-6 py-6 rounded-[2rem] border border-white/5 bg-brand-bg/50 hover:bg-brand-bg hover:border-brand-accent/40 transition-all duration-500">
                <FileText size={22} className="text-brand-text-muted transition-colors" />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-brand-text-primary uppercase tracking-tight">Pitch Decks</span>
                  <span className="text-[9px] font-bold text-brand-text-muted uppercase opacity-40">PDF / DOCX</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!idea.trim() || loading}
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
