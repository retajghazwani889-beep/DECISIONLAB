import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Play, Maximize2, Minimize2 } from 'lucide-react';
import { PitchDeck } from '../types';
import { PitchDeckSlide } from './PitchDeckSlides';
import { cn } from '../lib/utils';

interface PresentationModeProps {
  deck: PitchDeck;
  onClose: () => void;
  companyName: string;
}

export default function PresentationMode({ deck, onClose, companyName }: PresentationModeProps) {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setIndex(p => Math.min(deck.slides.length - 1, p + 1));
      if (e.key === 'ArrowLeft') setIndex(p => Math.max(0, p - 1));
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col h-screen">
      {/* Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[110] opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white">
            <X size={24} />
          </button>
          <div className="h-8 w-px bg-white/10" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">
            {deck.projectName} <span className="text-brand-accent mx-2">•</span> {index + 1} / {deck.slides.length}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={toggleFullscreen} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white">
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Main Slide Container */}
      <div className="flex-1 flex items-center justify-center p-12 overflow-hidden bg-black select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full flex items-center justify-center"
          >
            <div className="scale-[0.8] lg:scale-[1] transition-transform duration-700">
              <PitchDeckSlide 
                slide={deck.slides[index]} 
                index={index} 
                companyName={companyName}
                template={deck.template}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute inset-y-0 left-0 flex items-center p-8 opacity-0 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIndex(p => Math.max(0, p - 1))}
          className={cn(
            "p-6 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all",
            index === 0 && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronLeft size={32} />
        </button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center p-8 opacity-0 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIndex(p => Math.min(deck.slides.length - 1, p + 1))}
          className={cn(
            "p-6 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all",
            index === deck.slides.length - 1 && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
        <motion.div 
          className="h-full bg-brand-accent shadow-[0_0_10px_rgba(93,169,255,0.5)]"
          initial={false}
          animate={{ width: `${((index + 1) / deck.slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
