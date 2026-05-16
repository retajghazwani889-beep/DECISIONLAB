import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
}

export default function Logo({ className, size = 32, showText = false, showTagline = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div 
        className="relative flex items-center justify-center overflow-hidden rounded-xl bg-brand-section border border-brand-accent/20 shadow-2xl transition-all duration-500 group-hover:scale-105"
        style={{ width: size * 1.5, height: size * 1.5 }}
      >
        <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Integrated D + L Monogram */}
          {/* Vertical Pillar (Shared) */}
          <rect x="8" y="8" width="4" height="24" rx="1" fill="currentColor" />
          
          {/* "D" Curve */}
          <path 
            d="M12 8H22C27.5228 8 32 12.4772 32 18C32 23.5228 27.5228 28 22 28H12V8Z" 
            fill="currentColor" 
            fillOpacity="0.15"
          />
          <path 
            d="M12 8H22C27.5228 8 32 12.4772 32 18C32 23.5228 27.5228 28 22 28H12" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round"
          />
          
          {/* "L" Horizontal Extension (Integrated into D's bottom) */}
          <path 
            d="M12 32H28" 
            stroke="var(--color-brand-accent)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
          />
          
          {/* Intersection Detail */}
          <circle cx="10" cy="32" r="2" fill="var(--color-brand-accent)" />
        </svg>
      </div>

      {(showText || showTagline) && (
        <div className="flex flex-col">
          {showText && (
            <span className="text-2xl tracking-tighter text-brand-text-primary font-display leading-none">
              <span className="font-black">Decision</span>
              <span className="font-medium text-brand-accent">Lab</span>
            </span>
          )}
          {showTagline && (
            <span className="text-sm font-black uppercase tracking-[0.4em] text-brand-text-secondary mt-1.5 opacity-60">
              Analyze. Validate. Grow.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
