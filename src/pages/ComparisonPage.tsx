import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AnalysisReport } from '../types';
import { motion } from 'motion/react';
import { 
  ArrowLeft, BarChart3, TrendingUp, Rocket, ShieldAlert, 
  Zap, Target, Lock, Shield, CheckCircle2 
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function ComparisonPage() {
  const [searchParams] = useSearchParams();
  const [analyses, setAnalyses] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const ids = searchParams.get('ids')?.split(',') || [];

  useEffect(() => {
    if (ids.length > 0) {
      fetchAnalyses();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAnalyses = async () => {
    try {
      const q = query(collection(db, 'analyses'), where('__name__', 'in', ids));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalysisReport));
      setAnalyses(data);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'analyses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-black mb-4">No analyses found for comparison</h2>
        <Link to="/dashboard" className="text-primary-600 font-bold hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1F3446] p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-3 text-base font-bold text-brand-text-secondary hover:text-brand-accent transition-colors mb-8 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-brand-text-primary uppercase font-display tracking-tight leading-none mb-8">Compare Venture Analysis</h1>
        </div>

        <div className="overflow-x-auto pb-12">
          <div className="min-w-[800px] grid grid-cols-[200px_1fr_1fr_1fr] gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            {/* Rows Header Column */}
            <div className="contents">
              <div className="bg-[#162A3A] p-10 font-black uppercase text-xs tracking-widest text-brand-text-secondary/60">Metric</div>
              {analyses.map(a => (
                <div key={a.id} className="bg-[#162A3A] p-10 border-l border-white/5">
                  <h3 className="font-black text-brand-text-primary line-clamp-2 text-xs mb-4 leading-tight">{a.ideaDescription}</h3>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-1.5 bg-brand-accent/20 text-brand-accent rounded-full text-xs font-black uppercase tracking-widest">
                      Score: {typeof a.scores?.investorAppeal === 'object' ? (a.scores as any).investorAppeal.score : (a.scores as any)?.investorAppeal || '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Market Fit */}
            <div className="contents text-base">
              <div className="bg-[#1F3446] p-8 font-black uppercase tracking-widest flex items-center gap-3 text-emerald-400 border-t border-white/5">
                <TrendingUp size={20} /> Market Fit
              </div>
              {analyses.map(a => {
                const metric = (a.scores as any)?.marketFit;
                const score = typeof metric === 'object' ? metric.score : metric;
                return (
                  <div key={a.id} className="bg-[#1F3446] p-8 border-t border-l border-white/5">
                    <div className="font-black text-2xl mb-4 text-emerald-400">{score || 0}%</div>
                    <p className="text-brand-text-secondary text-sm leading-relaxed opacity-80">{a.marketAnalysis?.overview || a.growthPotential?.revenue}</p>
                  </div>
                );
              })}
            </div>

            {/* Scalability */}
            <div className="contents text-base">
              <div className="bg-[#1F3446] p-8 font-black uppercase tracking-widest flex items-center gap-3 text-brand-accent border-t border-white/5">
                <Rocket size={20} /> Scalability
              </div>
              {analyses.map(a => {
                const metric = (a.scores as any)?.scalability;
                const score = typeof metric === 'object' ? metric.score : metric;
                return (
                  <div key={a.id} className="bg-[#1F3446] p-8 border-t border-l border-white/5">
                    <div className="font-black text-2xl mb-4 text-brand-accent">{score || 0}%</div>
                    <p className="text-brand-text-secondary text-sm leading-relaxed opacity-80">{a.growthPotential?.scaling}</p>
                  </div>
                );
              })}
            </div>

            {/* Risk */}
            <div className="contents text-base">
              <div className="bg-[#1F3446] p-8 font-black uppercase tracking-widest flex items-center gap-3 text-rose-400 border-t border-white/5">
                <ShieldAlert size={20} /> Execution
              </div>
              {analyses.map(a => {
                const metric = (a.scores as any)?.execution || (a.scores as any)?.executionReadiness;
                const score = typeof metric === 'object' ? metric.score : metric;
                return (
                  <div key={a.id} className="bg-[#1F3446] p-8 border-t border-l border-white/5">
                    <div className="font-black text-2xl mb-4 text-rose-400">{score || 0}%</div>
                    <p className="text-brand-text-secondary text-sm leading-relaxed capitalize opacity-80">{a.riskMatrix?.execution?.note || 'Moderate'}</p>
                  </div>
                );
              })}
            </div>

            {/* Market Readiness */}
            <div className="contents text-base">
              <div className="bg-[#1F3446] p-8 font-black uppercase tracking-widest flex items-center gap-3 text-indigo-400 border-t border-white/5">
                <Target size={20} /> Market Size
              </div>
              {analyses.map(a => (
                <div key={a.id} className="bg-[#1F3446] p-8 border-t border-l border-white/5">
                  <div className="font-black text-sm text-indigo-400 mb-4">{a.marketAnalysis?.sizeEstimate}</div>
                  <p className="text-brand-text-secondary text-sm leading-relaxed line-clamp-3 opacity-80">{a.marketAnalysis?.overview}</p>
                </div>
              ))}
            </div>

            {/* Final Verdict */}
            <div className="contents text-base">
              <div className="bg-[#1F3446] p-8 font-black uppercase tracking-widest flex items-center gap-3 text-brand-accent border-t border-white/5">
                <CheckCircle2 size={20} /> Verdict
              </div>
              {analyses.map(a => (
                <div key={a.id} className="bg-[#1F3446] p-8 border-t border-l border-white/5">
                  <div className={cn(
                    "font-black text-xs px-4 py-1.5 rounded-full w-fit mb-5 uppercase tracking-widest",
                    (typeof a.finalVerdict === 'object' ? a.finalVerdict?.status : a.finalVerdict)?.includes('Strong') ? "bg-emerald-500/20 text-emerald-400" :
                    (typeof a.finalVerdict === 'object' ? a.finalVerdict?.status : a.finalVerdict)?.includes('Moderate') ? "bg-amber-500/20 text-amber-400" :
                    "bg-rose-500/20 text-rose-400"
                  )}>
                    {typeof a.finalVerdict === 'object' ? a.finalVerdict?.status : (a.finalVerdict || 'Pending')}
                  </div>
                  <Link 
                    to={`/analysis/${a.id}`}
                    className="text-sm font-black text-brand-accent hover:underline flex items-center gap-2 uppercase tracking-widest group"
                  >
                    View Analysis <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
