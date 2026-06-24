import React from 'react';
import { PitchDeckSlide, SlideElement } from '../types';

interface SlideCanvasProps {
  slide: PitchDeckSlide;
  elements: SlideElement[];
  theme: {
    background: string;
    text: string;
    accentColor: string;
  };
}

export function SlideCanvas({ slide, elements, theme }: SlideCanvasProps) {
  return (
    <div 
      className="w-full aspect-[16/9] relative overflow-hidden transition-all duration-300 select-none border border-slate-200/50 dark:border-slate-800/50 shadow-inner"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      {/* Dynamic Slide Element Overlay Layer */}
      {elements.map((el) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${el.x}%`,
          top: `${el.y}%`,
          width: `${el.w}%`,
          height: el.h ? `${el.h}%` : 'auto',
          zIndex: el.zIndex || 10,
          color: el.color || theme.text,
          textAlign: el.textAlign || 'left',
          opacity: el.opacity !== undefined ? el.opacity : 1,
          fontFamily: el.fontFamily || 'Inter, sans-serif',
        };

        switch (el.type) {
          case 'title':
            return (
              <div
                key={el.id}
                style={{ ...style, fontSize: el.fontSize ? `${el.fontSize * 1.1}px` : '1.8rem' }}
                className="font-black tracking-tight leading-tight uppercase transition-all duration-300"
              >
                {el.content}
              </div>
            );

          case 'text':
            return (
              <div
                key={el.id}
                style={{ ...style, fontSize: el.fontSize ? `${el.fontSize}px` : '0.9rem' }}
                className="font-medium leading-relaxed tracking-wide transition-all duration-300 whitespace-pre-line"
              >
                {el.content}
              </div>
            );

          case 'point':
            return (
              <div
                key={el.id}
                style={{ ...style, fontSize: el.fontSize ? `${el.fontSize}px` : '0.9rem' }}
                className="font-normal leading-relaxed tracking-wide flex items-center transition-all duration-300"
              >
                <span className="mr-2" style={{ color: theme.accentColor }}>•</span>
                {el.content}
              </div>
            );

          case 'image':
            return (
              <div
                key={el.id}
                style={style}
                className="overflow-hidden rounded-lg transition-all duration-300 shadow-md border border-slate-100/10"
              >
                <img
                  src={el.content}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            );

          case 'shape':
            if (el.content === 'line') {
              return (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.w}%`,
                    height: el.h ? `${el.h}%` : '3px',
                    backgroundColor: el.color || theme.accentColor,
                    zIndex: el.zIndex || 5,
                  }}
                  className="rounded-full transition-all duration-300"
                />
              );
            }
            return null;

          default:
            return (
              <div
                key={el.id}
                style={{ ...style, fontSize: el.fontSize ? `${el.fontSize}px` : '0.9rem' }}
                className="transition-all duration-300"
              >
                {el.content}
              </div>
            );
        }
      })}

      {/* Corporate watermark context */}
      <div 
        className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-[10px] font-bold tracking-widest uppercase opacity-25"
        style={{ color: theme.text }}
      >
        <span>DecisionLab Deck Architect</span>
        <span>Slide Outline</span>
      </div>
    </div>
  );
}
