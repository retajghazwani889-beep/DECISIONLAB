import { PitchDeckSlide, SlideElement } from '../types';

/**
 * Intelligent Layout Engine v3.0
 * Converts a basic slide data structure into a set of balanced, editorial elements.
 */
export const deriveElementsFromLayout = (slide: PitchDeckSlide, template: string = 'Institutional VC'): SlideElement[] => {
  const elements: SlideElement[] = [];
  const layout = slide.layout || 'split';
  
  // Theme-based style properties
  const isDark = ['Institutional VC', 'Minimal Dark', 'Fintech Editorial', 'Classic Pitch', 'Gradient Modern'].includes(template);
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
    fontSize: 56,
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
  const contentFontSize = calculateFitFontSize(slide.content, contentWidth * 12.8, 30 * 7.2, 32);

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
  slide.points.slice(0, maxPoints).forEach((point, i) => {
    elements.push({
      id: `el-${slide.id}-point-${i}`,
      type: 'point',
      content: `• ${point}`,
      x: layout === 'centered' ? 15 : 6,
      y: (layout === 'centered' ? 55 : 58) + (i * 6),
      w: layout === 'centered' ? 70 : 44,
      h: 5,
      fontSize: 18,
      fontWeight: '400',
      fontFamily,
      color: textColor,
      textAlign: layout === 'centered' ? 'center' : 'left',
      opacity: 0.7,
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
          x: 58,
          y: 72,
          w: 15,
          h: 4,
          fontSize: 10,
          fontWeight: '900',
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
      y: layout === 'centered' ? 82 : 82,
      w: 20,
      h: 4,
      fontSize: 11,
      fontWeight: '900',
      color: textColor,
      opacity: 0.4,
      textAlign: layout === 'centered' ? 'center' : 'left',
      zIndex: 15
    });
    
    elements.push({
      id: `el-${slide.id}-metric-value`,
      type: 'text',
      content: slide.metric.value,
      x: layout === 'centered' ? 35 : 55,
      y: layout === 'centered' ? 86 : 86,
      w: 30,
      h: 10,
      fontSize: 48,
      fontWeight: '900',
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
  
  // Very rough heuristic for font sizing
  const idealSize = Math.sqrt(area / (charCount * 0.6));
  return Math.min(baseSize, Math.max(12, idealSize));
};
