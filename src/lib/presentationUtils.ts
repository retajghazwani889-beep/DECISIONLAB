import pptxgen from "pptxgenjs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PitchDeck, PitchDeckSlide, PitchDeckTemplate } from "../types";

const THEME_COLORS: Record<PitchDeckTemplate, { bg: string; text: string; accent: string }> = {
  'Institutional VC': { bg: '08131D', text: 'FFFFFF', accent: '5DA9FF' },
  'Executive Corporate': { bg: 'F8FAFC', text: '1E293B', accent: '0F172A' },
  'Modern SaaS': { bg: 'FFFFFF', text: '0F172A', accent: '3B82F6' },
  'Minimal Dark': { bg: '000000', text: 'FFFFFF', accent: 'FFFFFF' },
  'Founder Narrative': { bg: 'FDFCFB', text: '2D2A2E', accent: 'FF6B6B' },
  'Fintech Editorial': { bg: '0A0A0A', text: 'E2E8F0', accent: '67E8F9' },
  'Clean White Investor': { bg: 'FFFFFF', text: '171717', accent: '000000' },
  'Classic Pitch': { bg: '0F172A', text: 'FFFFFF', accent: 'EF4444' },
  'Gradient Modern': { bg: '020617', text: 'FFFFFF', accent: '8B5CF6' },
  'Bold Presentation': { bg: 'FCD34D', text: '000000', accent: '000000' },
  'Elegant Editorial': { bg: 'FAFAF9', text: '1C1917', accent: '78716C' }
};

export const exportToPPTX = async (deck: PitchDeck, companyName: string) => {
  const pptx = new pptxgen();
  
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "DecisionLab";
  pptx.company = companyName;
  pptx.title = `${companyName} - Venture Presentation`;

  const template = deck.template || 'Institutional VC';
  const colors = THEME_COLORS[template] || THEME_COLORS['Institutional VC'];

  // Add all slides
  for (const slide of deck.slides) {
    const pptSlide = pptx.addSlide();
    const accent = (slide.colorAccent || colors.accent).replace('#', '');
    pptSlide.background = { color: colors.bg };

    // Use Canvas Elements if available, otherwise fallback to auto-layout
    if (slide.elements && slide.elements.length > 0) {
       for (const el of slide.elements.sort((a,b) => a.zIndex - b.zIndex)) {
          const x = (el.x / 100) * 10;
          const y = (el.y / 100) * 5.625;
          const w = (el.w / 100) * 10;
          const h = (el.h / 100) * 5.625;
          
          if (el.type === 'image') {
            if (el.content) {
              pptSlide.addImage({
                path: el.content,
                x, y, w, h,
                sizing: { type: 'cover', w, h }
              });
            } else {
              pptSlide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: accent, alpha: 10 } });
            }
          } else if (el.type === 'shape') {
            pptSlide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: (el.color || accent).replace('#','') } });
          } else {
            pptSlide.addText(el.content, {
              x, y, w, h,
              fontSize: el.fontSize ? Math.round(el.fontSize * 0.7) : 18, // Scale down for PPTX coord space
              color: (el.color || colors.text).replace('#', ''),
              align: el.textAlign || 'left',
              bold: el.fontWeight === '900' || el.fontWeight === 'bold',
              italic: el.type === 'text' && el.opacity !== undefined && el.opacity < 1,
              valign: 'top',
              fontFace: el.fontFamily?.includes('serif') ? 'Georgia' : 'Arial'
            });
          }
       }
    } else {
      // Fallback Legacy Layout Logic
      const layout = slide.layout || 'split';
      pptSlide.addText(companyName.toUpperCase(), {
        x: 0.5, y: 0.3, w: '90%', fontSize: 9, bold: true, color: colors.text, charSpacing: 4
      });
      // ... (rest of old logic deleted as we enforce v3 elements in architect)
    }
  }

  await pptx.writeFile({ fileName: `${deck.projectName.replace(/\s+/g, '_')}_Strategic_Deck.pptx` });
};

export const exportToPDF = async (deckId: string, projectName: string) => {
  const container = document.getElementById(deckId);
  if (!container) return;

  const slides = container.querySelectorAll('[id^="pitch-slide-"]');
  const pdf = new jsPDF("landscape", "px", [1280, 720]);

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i] as HTMLElement;
    const canvas = await html2canvas(slide, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false
    });
    
    const imgData = canvas.toDataURL("image/png");
    if (i > 0) pdf.addPage([1280, 720], "landscape");
    pdf.addImage(imgData, "PNG", 0, 0, 1280, 720);
  }

  pdf.save(`${projectName.replace(/\s+/g, '_')}_Strategic_Deck.pdf`);
};

