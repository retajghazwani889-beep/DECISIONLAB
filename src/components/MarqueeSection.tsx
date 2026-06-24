import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface MarqueeSectionProps {
  items: string[];
  direction?: 'left' | 'right';
  className?: string;
}

export function MarqueeSection({ items, direction = 'left', className }: MarqueeSectionProps) {
  return (
    <div className={cn("relative overflow-hidden w-full py-12 border-y border-white/5 bg-brand-bg", className)}>
      <motion.div
        className="flex gap-16 whitespace-nowrap"
        animate={{ x: direction === 'left' ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((item, idx) => (
          <span
            key={idx}
            className="text-sm font-black uppercase tracking-[0.3em] text-brand-text-muted hover:text-brand-accent transition-colors cursor-default"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
