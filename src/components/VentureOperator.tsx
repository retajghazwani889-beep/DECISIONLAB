import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Terminal, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  Globe, 
  BarChart3, 
  ArrowRight, 
  X, 
  Maximize2, 
  Send,
  Loader2,
  Lock,
  Compass,
  Trophy,
  AlertTriangle,
  Target,
  Plus,
  History,
  MessageSquare,
  Database
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  getDocs,
  setDoc
} from 'firebase/firestore';
import { IntelligenceMessage, IntelligenceSession } from '../types';

const VentureOperator: React.FC = () => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<IntelligenceMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<IntelligenceSession[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [bootStep, setBootStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const bootMessages = [
    "INITIALIZING VENTURE_OPERATOR_CORE 8.41",
    "ESTABLISHING SECURE_TUNNEL [A-TYPE]",
    "SYNCHRONIZING INSTITUTIONAL_DATA_NODES",
    "DECRYPTION_PROTOCOL: ACTIVE",
    "SIGNAL_STRENGTH: 100%",
    "SYSTEM_READY: STRATEGIC_OPERATOR_ONLINE"
  ];

  // Fetch user sessions
  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => ({
        ...doc.data(),
        sessionId: doc.id
      })) as IntelligenceSession[];
      setSessions(sessionData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Strategic Decision Operator online. I am synced with DecisionLab's venture analysis core. How can I assist with your executive decisioning today?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleOpen = () => {
    setIsBooting(true);
    setBootStep(0);
    setIsOpen(true);
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setBootStep(step);
      if (step >= bootMessages.length) {
        clearInterval(interval);
        setTimeout(() => setIsBooting(false), 300);
      }
    }, 150);
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([{
      role: 'assistant',
      content: "Session reset. Strategic Decision Operator ready for new inquiry.",
      timestamp: new Date()
    }]);
  };

  const loadSession = (session: IntelligenceSession) => {
    setCurrentSessionId(session.sessionId);
    setMessages(session.messages.map(m => ({
      ...m,
      timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : new Date(m.timestamp)
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    if (!user) {
      // In a real app we might open onboarding here
      // For now we'll just allow it but give a warning later
    }

    const userMessage: IntelligenceMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsProcessing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        You are the "Venture Operator" for DecisionLab. 
        CORE PROTOCOL: Respond with absolute executive brevity. No filler. No storytelling. No conversational pleasantries.
        
        STRUCTURE:
        1. [DIRECT_RESPONSE]: 1 concise sentence.
        2. [STRATEGIC_INSIGHT]: 1-2 sharp bullet points using institutional terminology.
        3. [RECOMMENDED_MOTION]: 1 high-leverage action.

        TONE: Institutional, sharp, confident, analytical.
        LANG: Venture-focused.
        
        System Context: DecisionLab venture analysis core.
        User Command: ${userMessage.content}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are an institutional venture analyst. Output must be structured as: Direct Answer, Strategic Insight, and Recommendation. Total brevity mandatory."
        }
      });

      const assistantMessage: IntelligenceMessage = {
        role: 'assistant',
        content: response.text || "I'm sorry, I encountered a signal disruption. Please re-state your inquiry.",
        timestamp: new Date(),
        modules: Math.random() > 0.6 ? [
            { type: 'meter', data: { value: Math.floor(Math.random() * 40) + 60, label: 'Execution Readiness' } }
        ] : undefined
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Persist to Firebase if user is logged in
      if (user) {
        if (!currentSessionId) {
          const docRef = await addDoc(collection(db, 'sessions'), {
            userId: user.uid,
            title: inputValue.slice(0, 40) + (inputValue.length > 40 ? '...' : ''),
            messages: finalMessages,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setCurrentSessionId(docRef.id);
        } else {
          await updateDoc(doc(db, 'sessions', currentSessionId), {
            messages: finalMessages,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Signal Error:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Error establishing analysis uplink. Please verify connectivity or system credentials.",
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            className="fixed bottom-10 right-10 z-[200] w-20 h-20 rounded-full bg-brand-bg md:w-24 md:h-24 p-[2px] shadow-[0_0_40px_rgba(93,169,255,0.3)] group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/20 via-brand-accent/5 to-transparent animate-pulse" />
            <div className="w-full h-full rounded-full bg-brand-bg flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-brand-hover transition-colors duration-500">
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(93,169,255,1)_0%,transparent_70%)] group-hover:opacity-40 transition-opacity" />
               <Zap className="w-8 h-8 text-brand-accent relative z-10 group-hover:scale-110 transition-transform duration-500" />
               <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-accent/80 mt-2 relative z-10">Operator</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-brand-bg/60 backdrop-blur-md pointer-events-auto"
            />

            <motion.div
              initial={{ height: 0, width: 0, opacity: 0 }}
              animate={{ height: '94vh', width: 'min(1400px, 98vw)', opacity: 1 }}
              exit={{ height: 0, width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-brand-section/95 backdrop-blur-[80px] rounded-[3.5rem] border border-brand-accent/20 shadow-huge overflow-hidden flex flex-col pointer-events-auto relative group"
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(93,169,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(93,169,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
              
              <div className="p-8 md:p-10 border-b border-brand-accent/10 flex items-center justify-between relative bg-brand-bg/20">
                <div className="flex items-center gap-6">
                  <div className="p-3 bg-brand-accent/10 border border-brand-accent/20 rounded-xl relative group-hover:glow-accent transition-all duration-500">
                    <Terminal className="w-6 h-6 text-brand-accent" />
                    <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-sm font-black text-brand-text-primary uppercase tracking-[0.2em] font-display flex items-center gap-4">
                      Strategic Decision Desk
                      <span className="px-3 py-1 rounded-md bg-brand-accent/10 text-xs text-brand-accent border border-brand-accent/20 animate-pulse">Live Uplink</span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                       <div className="flex items-center gap-2">
                          <Activity className="w-3 h-3 text-brand-accent/60" />
                          <span className="text-xs font-bold uppercase text-brand-text-secondary tracking-widest">Signal: Stable</span>
                       </div>
                       <div className="w-1 h-3 bg-white/10" />
                       <div className="flex items-center gap-2 text-emerald-500/80">
                          <Lock className="w-3 h-3" />
                          <span className="text-xs font-bold uppercase tracking-widest">{user ? `Authenticated: ${profile?.roleType || 'Venture Partner'}` : 'Guest Session'}</span>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={startNewSession}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-brand-accent/20 bg-brand-accent/5 text-xs font-black uppercase tracking-widest text-brand-accent hover:bg-brand-accent/10 transition-all"
                  >
                    <Plus className="w-4 h-4" /> New Session
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-4 rounded-full border border-white/5 hover:bg-white/5 text-brand-text-secondary hover:text-brand-coral transition-all duration-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isBooting && (
                  <motion.div
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-brand-bg flex flex-col items-center justify-center p-10 font-mono text-brand-accent"
                  >
                    <div className="w-full max-w-lg space-y-4">
                      {bootMessages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ 
                            opacity: bootStep >= i ? 1 : 0,
                            x: bootStep >= i ? 0 : -10
                          }}
                          className="flex items-center gap-4 text-xs tracking-widest"
                        >
                          <span className="text-brand-accent/40">[{i}]</span>
                          {msg}
                          {bootStep > i && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar space-y-12"
                >
                  <AnimatePresence mode="popLayout">
                    {messages.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn(
                          "flex flex-col max-w-[85%] relative",
                          m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                      >
                        <div className="flex items-center gap-3 mb-6 opacity-60">
                          <span className="text-sm font-black uppercase tracking-[0.3em]">
                            {m.role === 'assistant' ? 'Operator_Output' : 'Executive_Command'}
                          </span>
                        </div>

                        <div className={cn(
                          "p-10 md:p-12 rounded-[3rem] tracking-tight leading-[1.6]",
                          m.role === 'user' 
                            ? "bg-brand-accent text-brand-bg font-black text-sm shadow-[0_0_50px_rgba(93,169,255,0.25)]" 
                            : "bg-brand-card/60 border border-brand-accent/20 text-brand-text-primary text-sm backdrop-blur-xl whitespace-pre-wrap font-medium"
                        )}>
                          {m.content}

                          {m.role === 'assistant' && m.modules && m.modules.length > 0 && (
                            <div className="mt-10 grid grid-cols-1 gap-6">
                              {m.modules.map((mod, idx) => (
                                <div 
                                  key={idx}
                                  className="p-8 rounded-3xl bg-brand-bg/40 border border-brand-accent/20 backdrop-blur-md"
                                >
                                  {mod.type === 'meter' && (
                                    <div className="space-y-6">
                                      <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-4">
                                          <Target className="w-5 h-5 text-brand-accent" />
                                          <span className="text-sm font-black uppercase tracking-[0.3em] text-brand-accent/80">{mod.data.label}</span>
                                        </div>
                                        <span className="font-mono text-4xl text-brand-accent font-black tracking-tighter">{mod.data.value}%</span>
                                      </div>
                                      <div className="h-3 w-full bg-brand-bg rounded-full overflow-hidden border border-white/5">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${mod.data.value}%` }}
                                          transition={{ duration: 1.5, ease: "easeOut" }}
                                          className="h-full bg-brand-accent shadow-[0_0_25px_rgba(93,169,255,0.6)]"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-4 items-center p-8 bg-brand-card/20 rounded-3xl border border-white/5 max-w-sm"
                    >
                      <Loader2 className="w-5 h-5 text-brand-accent animate-spin" />
                      <div className="text-sm font-bold text-brand-text-secondary uppercase tracking-[0.2em] animate-pulse">
                        Uplink Active: Synthesizing Decision Logic...
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="hidden xl:flex w-[400px] border-l border-brand-accent/10 flex-col bg-brand-bg/20 p-10 space-y-10 overflow-y-auto custom-scrollbar">
                   <div>
                      <h3 className="text-sm font-black text-brand-accent uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                         <History className="w-4 h-4" />
                         Venture Session Archive
                      </h3>
                      {user ? (
                        <div className="space-y-4">
                          {sessions.length > 0 ? (
                            sessions.map((session) => (
                              <button
                                key={session.sessionId}
                                onClick={() => loadSession(session)}
                                className={cn(
                                  "w-full p-6 p-y-8 text-left rounded-[2rem] border transition-all group relative overflow-hidden",
                                  currentSessionId === session.sessionId 
                                    ? "bg-brand-accent/10 border-brand-accent/40" 
                                    : "bg-brand-card/20 border-white/5 hover:bg-white/5"
                                )}
                              >
                                <div className="text-xs font-black text-brand-text-primary mb-3 line-clamp-1 uppercase tracking-tight group-hover:text-brand-accent transition-colors">
                                  {session.title || "Untitled Session"}
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest opacity-60">
                                    {session.messages.length} Signals
                                  </div>
                                  <ArrowRight className={cn("w-4 h-4 transition-all", currentSessionId === session.sessionId ? "text-brand-accent opacity-100" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 cursor-pointer")} />
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-10 text-center border border-dashed border-white/10 rounded-[2rem]">
                              <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-4" />
                              <div className="text-xs font-black uppercase tracking-widest text-brand-text-secondary opacity-40">No Sessions Archived</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-10 rounded-[2.5rem] bg-brand-accent/5 border border-brand-accent/10 text-center">
                          <Lock className="w-10 h-10 text-brand-accent mx-auto mb-6 opacity-40" />
                          <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-tight mb-2">Vault Locked</h4>
                          <p className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest leading-relaxed opacity-60">
                            Initialize your account to persist strategic analysis sessions and access session memory.
                          </p>
                        </div>
                      )}
                   </div>

                   <div className="mt-auto p-10 rounded-[2.5rem] bg-brand-card/30 border border-brand-accent/10">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="p-3 bg-brand-accent/10 rounded-xl">
                            <Database className="w-5 h-5 text-brand-accent" />
                         </div>
                         <div>
                            <div className="text-sm font-black text-brand-text-primary uppercase tracking-tight">Venture Analysis</div>
                            <div className="text-xs font-bold text-brand-accent uppercase tracking-[0.2em] mt-1">Status: Operational</div>
                         </div>
                      </div>
                      <div className="space-y-3">
                         {[1, 2, 3].map(i => (
                           <div key={i} className="h-1 bg-brand-accent/10 rounded-full overflow-hidden">
                              <motion.div 
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2 + i, repeat: Infinity, ease: "linear" }}
                                className="w-1/3 h-full bg-brand-accent/30"
                              />
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-8 md:p-14 border-t border-brand-accent/10 bg-brand-bg/20">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
                  <div className="relative flex items-center bg-brand-card/60 backdrop-blur-3xl border border-brand-accent/30 rounded-[2.5rem] p-3 pr-5 shadow-huge">
                    <input 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Input strategic inquiry command..."
                      className="flex-1 bg-transparent border-none outline-none px-8 text-brand-text-primary placeholder:text-brand-text-muted font-black text-sm md:text-2xl"
                    />
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={isProcessing}
                      className={cn(
                          "flex items-center gap-4 px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all",
                          isProcessing 
                               ? "bg-white/5 text-brand-text-muted cursor-not-allowed" 
                               : "bg-brand-accent text-brand-bg shadow-huge shadow-brand-accent/20"
                      )}
                    >
                      {isProcessing ? "Processing" : "Execute"}
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>

                  <div className="mt-10 flex flex-wrap justify-center gap-5">
                      {[
                        "Explain Venture Analysis",
                        "Optimize execution model",
                        "Strategic risk audit",
                        "Capital readiness Review"
                      ].map((chip) => (
                        <motion.button
                          key={chip}
                          type="button"
                          onClick={() => setInputValue(chip)}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-8 py-4 rounded-2xl bg-brand-accent/5 border border-brand-accent/10 text-xs font-black uppercase tracking-[0.2em] text-brand-accent/70 hover:text-brand-accent hover:border-brand-accent/40 transition-all font-display"
                        >
                          {chip}
                        </motion.button>
                      ))}
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VentureOperator;
