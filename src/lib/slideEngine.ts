import { PitchDeckSlide, SlideElement } from '../types';
import PptxGenJS from "pptxgenjs";

/**
 * Intelligent Layout Engine v3.0
 * Converts a basic slide data structure into a set of balanced, editorial elements.
 */
export const deriveElementsFromLayout = (slide: PitchDeckSlide, template: string = 'Clean Investor'): SlideElement[] => {
  const elements: SlideElement[] = [];
  const layout = slide.layout || 'split';
  
  // Theme-based style properties
  const isDark = ['Clean Investor', 'Dark Executive', 'Luxury Black'].includes(template);
  const textColor = isDark ? '#FFFFFF' : '#1E293B';
  const accentColor = slide.colorAccent || '#5DA9FF';
  const fontFamily = ['Executive Corporate', 'Elegant Editorial'].includes(template) ? 'Georgia, serif' : 'Inter, sans-serif';

  // 1. Title Element (Premium Heading)
  elements.push({
    id: `el-${slide.id}-title`,
    type: 'title',
    content: slide.title.toUpperCase(),
    x: layout === 'centered' ? 5 : 5,
    y: 8,
    w: layout === 'centered' ? 90 : 85,
    h: 12,
    fontSize: 32, // Adjusted scale relative to coordinate engine mapping
    fontWeight: '900',
    fontFamily,
    color: textColor,
    textAlign: layout === 'centered' ? 'center' : 'left',
    zIndex: 10
  });

  // 2. Decorative Line
  elements.push({
    id: `el-${slide.id}-line`,
    type: 'shape',
    content: 'line',
    x: layout === 'centered' ? 45 : 5,
    y: 20,
    w: layout === 'centered' ? 10 : 15,
    h: 0.5,
    color: accentColor,
    zIndex: 5
  });

  // 3. Main Narrative (Intelligent Auto-Scaling)
  const contentWidth = layout === 'centered' ? 80 : 45;
  const contentFontSize = calculateFitFontSize(slide.content, contentWidth * 12.8, 30 * 7.2, 16);

  elements.push({
    id: `el-${slide.id}-content`,
    type: 'text',
    content: slide.content,
    x: layout === 'centered' ? 10 : 5,
    y: 28,
    w: contentWidth,
    h: 25,
    fontSize: contentFontSize,
    fontWeight: '500',
    fontFamily,
    color: textColor,
    textAlign: layout === 'centered' ? 'center' : 'left',
    opacity: 0.9,
    zIndex: 5
  });

  // 4. Points/Bullets (Grid vs List)
  const maxPoints = 5;
  (slide.points || []).slice(0, maxPoints).forEach((point, i) => {
    // Clear custom clean layout matching to separate point boundaries cleanly
    const formattedText = point.startsWith('•') ? point : `• ${point}`;
    elements.push({
      id: `el-${slide.id}-point-${i}`,
      type: 'point',
      content: formattedText,
      x: layout === 'centered' ? 15 : 5,
      y: (layout === 'centered' ? 55 : 56) + (i * 6),
      w: layout === 'centered' ? 70 : 44,
      h: 5,
      fontSize: 13,
      fontWeight: '400',
      fontFamily,
      color: textColor,
      textAlign: layout === 'centered' ? 'center' : 'left',
      opacity: 0.8,
      zIndex: 5
    });
  });

  // 5. Image/Visual (Asymmetric Layouts)
  if (layout !== 'centered') {
     const imgX = layout === 'split' ? 55 : (layout === 'hero' ? 0 : 55);
     const imgY = layout === 'hero' ? 0 : 15;
     const imgW = layout === 'split' ? 40 : (layout === 'hero' ? 100 : 40);
     const imgH = layout === 'hero' ? 100 : 65;

     elements.push({
       id: `el-${slide.id}-image`,
       type: 'image',
       content: slide.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200',
       x: imgX,
       y: imgY,
       w: imgW,
       h: imgH,
       opacity: layout === 'hero' ? 0.4 : 1,
       zIndex: layout === 'hero' ? 1 : 5
     });

     // Floating data chip for images
     if (layout === 'split') {
        elements.push({
          id: `el-${slide.id}-chip`,
          type: 'text',
          content: 'CORE STRATEGY',
          x: 55,
          y: 11,
          w: 15,
          h: 4,
          fontSize: 9,
          fontWeight: '900',
          fontFamily,
          color: accentColor,
          textAlign: 'left',
          zIndex: 15
        });
     }
  }

  // 6. Metric Element (Premium Card Style)
  if (slide.metric) {
    elements.push({
      id: `el-${slide.id}-metric-label`,
      type: 'text',
      content: slide.metric.label.toUpperCase(),
      x: layout === 'centered' ? 40 : 55,
      y: 82,
      w: 35,
      h: 4,
      fontSize: 10,
      fontWeight: '900',
      fontFamily,
      color: textColor,
      opacity: 0.5,
      textAlign: layout === 'centered' ? 'center' : 'left',
      zIndex: 15
    });
    
    elements.push({
      id: `el-${slide.id}-metric-value`,
      type: 'text',
      content: slide.metric.value,
      x: layout === 'centered' ? 35 : 55,
      y: 85,
      w: 35,
      h: 10,
      fontSize: 32,
      fontWeight: '900',
      fontFamily,
      color: accentColor,
      textAlign: layout === 'centered' ? 'center' : 'left',
      zIndex: 15
    });
  }

  return elements;
};

/**
 * Utility to calculate auto-fit font size
 */
export const calculateFitFontSize = (text: string, containerW: number, containerH: number, baseSize: number): number => {
  if (!text) return baseSize;
  const area = containerW * containerH;
  const charCount = text.length;
  
  const idealSize = Math.sqrt(area / (charCount * 0.6));
  return Math.min(baseSize, Math.max(11, idealSize));
};

/**
 * Generates and downloads a real PPTX presentation using the dynamic slide elements matrix map
 */
export async function generatePitchDeck(
  projectName: string, 
  slidesArray: PitchDeckSlide[], 
  selectedTheme: string
) {
  const pptx = new PptxGenJS();

  // Establish real 16:9 widescreen context template guidelines
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "DecisionLab";
  pptx.company = "DecisionLab";
  pptx.subject = projectName;
  pptx.title = `${projectName} Pitch Deck`;

  // Standard width mappings: 13.33 inches x 7.5 inches for widescreen setups
  const SLIDE_WIDTH = 13.33;
  const SLIDE_HEIGHT = 7.5;

  const themes: any = {
    cleanInvestor: { bg: "FFFFFF", text: "111111", accent: "3B82F6" },
    darkExecutive: { bg: "071C2B", text: "FFFFFF", accent: "60A5FA" },
    editorialVC: { bg: "F5F5F0", text: "111111", accent: "0F172A" },
  };

  const currentTheme = themes[selectedTheme] || themes.cleanInvestor;

  // Compile individual elements on structural iterations loop dynamically
  slidesArray.forEach((slideData) => {
    const pptxSlide = pptx.addSlide();
    pptxSlide.background = { color: currentTheme.bg };

    // Derive active elements blueprint coordinates
    const elements = deriveElementsFromLayout(slideData, selectedTheme);

    elements.forEach((el) => {
      // Scale standard viewport numbers directly into exact inches coordinates 
      const xInches = (el.x / 100) * SLIDE_WIDTH;
      const yInches = (el.y / 100) * SLIDE_HEIGHT;
      const wInches = (el.w / 100) * SLIDE_WIDTH;
      const hInches = el.h ? (el.h / 100) * SLIDE_HEIGHT : 0.5;

      if (el.type === 'title' || el.type === 'text' || el.type === 'point') {
        pptxSlide.addText(el.content, {
          x: xInches,
          y: yInches,
          w: wInches,
          h: hInches,
          fontFace: el.fontFamily?.split(',')[0] || "Arial",
          fontSize: el.fontSize || 14,
          bold: el.fontWeight ? parseInt(el.fontWeight) >= 700 : false,
          color: el.color?.replace('#', '') || currentTheme.text,
          align: el.textAlign || 'left',
          valign: 'top',
        });
      } 
      else if (el.type === 'image') {
        pptxSlide.addImage({
          path: el.content,
          x: xInches,
          y: yInches,
          w: wInches,
          h: hInches,
        });
      } 
      else if (el.type === 'shape' && el.content === 'line') {
        pptxSlide.addShape(pptx.ShapeType.rect, {
          x: xInches,
          y: yInches,
          w: wInches,
          h: hInches > 0.05 ? hInches : 0.04,
          fill: { color: el.color?.replace('#', '') || currentTheme.accent }
        });
      }
    });
  });

  // Compile and export to desktop filesystem immediately
  await pptx.writeFile({
    fileName: `${projectName.toLowerCase().replace(/\s+/g, '-')}-pitchdeck.pptx`,
  });
}