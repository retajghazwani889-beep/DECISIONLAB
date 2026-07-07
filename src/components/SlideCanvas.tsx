import React, { useRef, useState, useEffect, CSSProperties } from 'react';
import { DeckTheme, resolveTheme } from '../lib/deckThemes';

// Read-only "presenter view" of a single deck slide. Renders the slide's saved
// `elements` at their exact positions on a 1280x720 stage, scaled to fit the
// container — the same layout the founder built in the Pitch Deck Architect,
// using the same theme they picked (passed via `templateName`). This mirrors
// the Architect's static/export renderer, minus editing.
const CANVAS_W = 1280;
const CANVAS_H = 720;

interface SlideCanvasProps {
  slide: any;
  /** The deck's saved theme name (activeTheme.name) so backgrounds/fonts match. */
  templateName?: string;
  /** 'width' scales to container width (inline). 'contain' fits inside both
   *  width and height (full-screen presenter). */
  fit?: 'width' | 'contain';
}

function fitKpiFontSize(value: string, boxW: number): number {
  const len = (value || '').length;
  // Rough char-width model for a bold display font at 32px (~18px/char).
  // Scale down until the estimated text width fits inside the padded box.
  const usable = Math.max(40, boxW - 24);
  let size = 32;
  while (size > 12 && len * size * 0.58 > usable) {
    size -= 1;
  }
  return size;
}

export default function SlideCanvas({ slide, templateName, fit = 'width' }: SlideCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const theme: DeckTheme = resolveTheme(templateName);

  useEffect(() => {
    const measure = () => {
      const el = wrapRef.current;
      if (!el) return;
      const w = el.clientWidth || 0;
      const h = el.clientHeight || 0;
      if (w <= 0) return;
      const byW = w / CANVAS_W;
      const next = fit === 'contain' && h > 0
        ? Math.min(byW, h / CANVAS_H)   // fit inside both dimensions
        : Math.min(1, byW);              // inline: fit width, never upscale
      if (next > 0) setScale(next);
    };
    measure();
    const t1 = setTimeout(measure, 60);
    const t2 = setTimeout(measure, 250);
    let ro: ResizeObserver | null = null;
    if (wrapRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure());
      ro.observe(wrapRef.current);
    }
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [slide, fit]);

  const elements: any[] = Array.isArray(slide?.elements) ? slide.elements : [];
  const sorted = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const containMode = fit === 'contain';
  return (
    <div
      ref={wrapRef}
      className={containMode ? 'relative w-full h-full flex items-center justify-center overflow-hidden' : 'relative w-full overflow-hidden rounded-2xl'}
      style={containMode ? undefined : { height: CANVAS_H * scale }}
    >
      <div
        style={{
          width: `${CANVAS_W}px`,
          height: `${CANVAS_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: containMode ? 'center center' : 'top left',
          position: containMode ? 'relative' : 'absolute',
          top: containMode ? undefined : 0,
          left: containMode ? undefined : 0,
          flexShrink: 0,
          overflow: 'hidden',
          borderRadius: containMode ? '12px' : undefined,
          background: slide?.bg || theme.bg,
          backgroundImage: slide?.bgGradient || (theme as any).gradient || undefined,
        }}
      >
        {sorted.map((el) => {
          const style: CSSProperties = {
            position: 'absolute',
            left: `${el.x}px`,
            top: `${el.y}px`,
            width: `${el.w}px`,
            height: `${el.h}px`,
            zIndex: el.zIndex || 5,
            opacity: el.opacity !== undefined ? el.opacity : 1,
            boxSizing: 'border-box',
          };

          if (el.type === 'text' || el.type === 'title') {
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  fontFamily: el.fontFamily || theme.fontBody,
                  fontSize: `${el.fontSize || 16}px`,
                  fontWeight: el.fontWeight || 400,
                  color: el.color || theme.text,
                  textAlign: el.align || 'left',
                  fontStyle: el.fontStyle || 'normal',
                  textDecoration: el.textDecoration || 'none',
                  lineHeight: el.lineHeight || 1.4,
                  padding: '6px',
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-word',
                }}
              >
                {el.content}
              </div>
            );
          }

          if (el.type === 'kpi') {
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  backgroundColor: el.bg || theme.surfaceStrong,
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: theme.fontMono,
                      fontSize: '9px',
                      fontWeight: '900',
                      color: theme.text,
                      opacity: 0.35,
                      letterSpacing: '1px',
                    }}
                  >
                    {(el.label || '').toUpperCase()}
                  </span>
                  <div
                    style={{
                      fontFamily: theme.fontDisplay,
                      fontSize: `${fitKpiFontSize(String(el.value ?? ''), el.w)}px`,
                      fontWeight: theme.headlineWeight || 800,
                      color: el.accent || theme.accent,
                      marginTop: '2px',
                      lineHeight: 1.05,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {el.value}
                  </div>
                </div>
                {el.sublabel && (
                  <div style={{ fontFamily: theme.fontBody, fontSize: '11px', color: theme.text, opacity: 0.5, marginTop: '4px' }}>
                    {el.sublabel}
                  </div>
                )}
              </div>
            );
          }

          if (el.type === 'shape') {
            return (
              <div key={el.id} style={style}>
                {el.shape === 'line' ? (
                  <div style={{ width: '100%', height: '100%', backgroundColor: el.fill || theme.accent, borderRadius: '999px' }} />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: el.fill || theme.surfaceStrong,
                      borderRadius: el.shape === 'circle' ? '999px' : `${el.borderRadius || 0}px`,
                      border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke || 'transparent'}` : undefined,
                    }}
                  />
                )}
              </div>
            );
          }

          if (el.type === 'image') {
            return (
              <div key={el.id} style={{ ...style, overflow: 'hidden', borderRadius: `${el.borderRadius || 0}px` }}>
                <img
                  src={el.src}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: el.objectFit || 'cover', display: 'block' }}
                />
              </div>
            );
          }

          if (el.type === 'team') {
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  backgroundColor: el.bg || theme.surface,
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div style={{ width: '64px', height: '64px', borderRadius: '999px', backgroundColor: theme.surfaceStrong, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.fontDisplay, fontWeight: 900, fontSize: '22px', color: theme.accent, marginBottom: '12px' }}>
                    {(el.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: theme.fontDisplay, fontWeight: 800, fontSize: '15px', color: el.textColor || theme.text }}>{el.name}</div>
                  <div style={{ fontFamily: theme.fontMono || 'monospace', fontSize: '9px', fontWeight: 700, color: theme.accent, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>{el.role}</div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace', textAlign: 'center' }}>
                    <span style={{ opacity: 0.4 }}>EXP:</span>{' '}
                    <span style={{ fontWeight: 'bold', color: '#cbd5e1' }}>{el.yearsExp || '10+ Years'}</span>
                  </div>
                  <div style={{ backgroundColor: 'rgba(16,185,129,0.05)', padding: '8px', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace', textAlign: 'center', color: '#10b981' }}>
                    {el.achievement || 'Expertise Validated'}
                  </div>
                </div>
              </div>
            );
          }

          // mockup / chart: these need heavy Architect-only renderers (MockupSVG,
          // ChartRenderer). Rather than pull those in, show a clean themed
          // placeholder so the slide still reads as a designed block.
          if (el.type === 'mockup' || el.type === 'chart') {
            return (
              <div
                key={el.id}
                style={{
                  ...style,
                  backgroundColor: theme.surfaceStrong,
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.muted,
                  fontFamily: theme.fontBody,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {el.type === 'chart' ? 'Chart' : 'Product Mockup'}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
