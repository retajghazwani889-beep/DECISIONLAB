import pptxgen from "pptxgenjs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PitchDeck, PitchDeckSlide, PitchDeckTemplate } from "../types";

import { withOklchHtml2CanvasPatch } from "./utils";

// The editor canvas is 1280 x 720 pixels. A 16:9 PPTX slide is 10 x 5.625 inches.
// These factors convert editor pixels -> PPTX inches so elements land in the
// SAME place they appear on the canvas. (The previous code divided by 100 and
// treated pixels as percentages, which threw every element off the slide.)
const CANVAS_W = 1280;
const CANVAS_H = 720;
const SLIDE_W_IN = 10;
const SLIDE_H_IN = 5.625;
const PX_TO_IN_X = SLIDE_W_IN / CANVAS_W;   // ~0.0078125
const PX_TO_IN_Y = SLIDE_H_IN / CANVAS_H;   // ~0.0078125

// Per-theme base colors used as fallbacks when an element doesn't carry its own.
const THEME_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  'Silicon Valley VC':     { bg: '0A0F1E', text: 'F5F7FB', accent: '5B8DEF' },
  'Startup Minimal':       { bg: 'FAFAFA', text: '1A1A1A', accent: '111111' },
  'Corporate Executive':   { bg: '101A2C', text: 'E6EBF2', accent: '6F9BD1' },
  'Fintech Modern':        { bg: '071512', text: 'E9FBF4', accent: '2DD4A7' },
  'Healthcare Innovation': { bg: 'F4F9FC', text: '0E2A3F', accent: '1D7FB8' },
  'Cybersecurity Command': { bg: '06100B', text: 'D6F5E3', accent: '3DDC84' },
  'Luxury Investor':       { bg: '0C0A08', text: 'F6F1E7', accent: 'C2A878' },
  'Dark Investor':         { bg: '0D0D0F', text: 'F7F6F3', accent: 'E0A13C' },
  'Bright Modern':         { bg: 'F7F8FB', text: '11132A', accent: '5B54D6' },
  'DecisionLab Signature': { bg: '08131D', text: 'E8EDF5', accent: '5DA9FF' },
};

// Strip "#", drop any alpha hex (e.g. #5DA9FF80 -> 5DA9FF), and validate.
function cleanHex(input: string | undefined, fallback: string): string {
  if (!input) return fallback;
  let c = input.trim().replace('#', '');
  // Ignore rgba()/gradients/etc that pptxgenjs can't parse.
  if (!/^[0-9a-fA-F]{3,8}$/.test(c)) return fallback;
  if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
  if (c.length >= 6) return c.slice(0, 6).toUpperCase();
  return fallback;
}

// PowerPoint can't render arbitrary SVG art, so the industry "mockup" graphic
// is drawn as a simple branded placeholder panel instead. Everything else
// (text, KPIs, shapes, charts, team cards) becomes native, editable objects.
export const exportToPPTX = async (deck: PitchDeck, companyName: string) => {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "DL_16x9", width: SLIDE_W_IN, height: SLIDE_H_IN });
  pptx.layout = "DL_16x9";
  pptx.author = "DecisionLab";
  pptx.company = companyName;
  pptx.title = `${companyName} - Venture Presentation`;

  const template = deck.template || 'Silicon Valley VC';
  const theme = THEME_COLORS[template] || THEME_COLORS['Silicon Valley VC'];

  for (const slide of deck.slides) {
    const pptSlide = pptx.addSlide();
    pptSlide.background = { color: theme.bg };

    const els = (slide.elements || []).slice().sort(
      (a: any, b: any) => (a.zIndex || 0) - (b.zIndex || 0)
    );

    for (const el of els as any[]) {
      const x = (el.x || 0) * PX_TO_IN_X;
      const y = (el.y || 0) * PX_TO_IN_Y;
      const w = (el.w || 0) * PX_TO_IN_X;
      const h = (el.h || 0) * PX_TO_IN_Y;
      const accent = cleanHex(el.accent, theme.accent);

      try {
        if (el.type === 'text') {
          pptSlide.addText(String(el.content ?? ''), {
            x, y, w, h,
            fontSize: el.fontSize ? Math.max(6, Math.round(el.fontSize * 0.75)) : 14,
            color: cleanHex(el.color, theme.text),
            align: (el.align || 'left'),
            bold: Number(el.fontWeight) >= 700,
            italic: el.fontStyle === 'italic',
            underline: el.textDecoration === 'underline' ? { style: 'sng' } : undefined,
            valign: 'top',
            fontFace: el.fontFamily && String(el.fontFamily).toLowerCase().includes('serif') ? 'Georgia' : 'Arial',
            charSpacing: el.letterSpacing ? Math.round(el.letterSpacing) : undefined,
            fill: el.background ? { color: cleanHex(el.background, theme.bg) } : undefined,
          });

        } else if (el.type === 'kpi') {
          // Card background
          pptSlide.addShape(pptx.ShapeType.roundRect, {
            x, y, w, h, rectRadius: 0.08,
            fill: { color: cleanHex(el.bg, theme.accent), transparency: 88 },
            line: { color: accent, width: 0.5, transparency: 70 },
          });
          // Label (top) + big value (below)
          pptSlide.addText(String(el.label || '').toUpperCase(), {
            x: x + 0.12, y: y + 0.08, w: w - 0.24, h: 0.25,
            fontSize: 8, color: cleanHex(el.textColor, theme.text), bold: true, charSpacing: 1, valign: 'top',
          });
          pptSlide.addText(String(el.value ?? ''), {
            x: x + 0.12, y: y + 0.3, w: w - 0.24, h: h - 0.4,
            fontSize: 22, color: accent, bold: true, valign: 'top',
          });
          if (el.sublabel) {
            pptSlide.addText(String(el.sublabel), {
              x: x + 0.12, y: y + h - 0.32, w: w - 0.24, h: 0.28,
              fontSize: 8, color: cleanHex(el.textColor, theme.text), valign: 'bottom',
            });
          }

        } else if (el.type === 'shape') {
          const isCircle = el.shape === 'circle';
          const isLine = el.shape === 'line';
          pptSlide.addShape(isCircle ? pptx.ShapeType.ellipse : pptx.ShapeType.rect, {
            x, y, w, h: isLine ? Math.max(h, 0.02) : h,
            fill: { color: cleanHex(el.fill, accent) },
            line: el.stroke ? { color: cleanHex(el.stroke, accent), width: el.strokeWidth || 1 } : { type: 'none' },
          });

        } else if (el.type === 'team') {
          pptSlide.addShape(pptx.ShapeType.roundRect, {
            x, y, w, h, rectRadius: 0.08,
            fill: { color: cleanHex(el.bg, theme.accent), transparency: 90 },
            line: { color: accent, width: 0.5, transparency: 70 },
          });
          pptSlide.addText(String(el.name || 'Founder'), {
            x: x + 0.1, y: y + 0.2, w: w - 0.2, h: 0.4,
            fontSize: 13, bold: true, color: cleanHex(el.textColor, theme.text), align: 'center',
          });
          pptSlide.addText(String(el.role || '').toUpperCase(), {
            x: x + 0.1, y: y + 0.6, w: w - 0.2, h: 0.3,
            fontSize: 8, bold: true, color: accent, align: 'center', charSpacing: 1,
          });
          if (el.bio) {
            pptSlide.addText(String(el.bio), {
              x: x + 0.1, y: y + 0.95, w: w - 0.2, h: h - 1.1,
              fontSize: 9, color: cleanHex(el.textColor, theme.text), align: 'center', valign: 'top',
            });
          }

        } else if (el.type === 'chart') {
          const data = Array.isArray(el.data) ? el.data : [];
          if (data.length > 0) {
            const chartData = [{
              name: 'Series 1',
              labels: data.map((d: any) => String(d.label)),
              values: data.map((d: any) => Number(d.value) || 0),
            }];
            const ct = el.chartType === 'line' || el.chartType === 'area'
              ? pptx.ChartType.line
              : el.chartType === 'donut'
              ? pptx.ChartType.doughnut
              : pptx.ChartType.bar;
            pptSlide.addChart(ct, chartData, {
              x, y, w, h,
              chartColors: [accent],
              showLegend: false,
              showValue: false,
              showTitle: false,
            });
          }

        } else if (el.type === 'mockup' || el.type === 'image') {
          const src = el.src;
          if (src && typeof src === 'string' && src.startsWith('http')) {
            pptSlide.addImage({ path: src, x, y, w, h, sizing: { type: 'cover', w, h } });
          } else if (src && typeof src === 'string' && src.startsWith('data:')) {
            // Inline base64 image (storage fallback) — embed via data string.
            pptSlide.addImage({ data: src, x, y, w, h, sizing: { type: 'cover', w, h } });
          } else {
            // Branded placeholder panel for the SVG product mockup.
            pptSlide.addShape(pptx.ShapeType.roundRect, {
              x, y, w, h, rectRadius: 0.1,
              fill: { color: accent, transparency: 90 },
              line: { color: accent, width: 0.75, transparency: 60 },
            });
            pptSlide.addText(String(el.startupName || companyName || 'Product'), {
              x, y, w, h, align: 'center', valign: 'middle',
              fontSize: 16, bold: true, color: accent,
            });
          }
        }
      } catch (e) {
        // Never let one bad element abort the whole export.
        console.warn('Skipped an element during PPTX export:', el.type, e);
      }
    }
  }

  await pptx.writeFile({
    fileName: `${(deck.projectName || companyName).replace(/\s+/g, '_')}_Strategic_Deck.pptx`,
  });
};

export const exportToPDF = async (deckId: string, projectName: string) => {
  const container = document.getElementById(deckId);
  if (!container) return;

  const slides = container.querySelectorAll('[id^="pitch-slide-"]');
  const pdf = new jsPDF("landscape", "px", [1280, 720]);

  await withOklchHtml2CanvasPatch(async () => {
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i] as HTMLElement;
      const canvas = await html2canvas(slide, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedWin = clonedDoc.defaultView;
          if (clonedWin) {
            clonedWin.getComputedStyle = window.getComputedStyle;
          }
        }
      });

      const imgData = canvas.toDataURL("image/png");
      if (i > 0) pdf.addPage([1280, 720], "landscape");
      pdf.addImage(imgData, "PNG", 0, 0, 1280, 720);
    }
  });

  pdf.save(`${projectName.replace(/\s+/g, '_')}_Strategic_Deck.pdf`);
};