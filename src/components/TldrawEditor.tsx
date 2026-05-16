import React, { useEffect, useState } from 'react';
import { Tldraw, Editor, createShapeId, TLShapeId } from 'tldraw';
import 'tldraw/tldraw.css';
import { PitchDeckSlide, SlideElement } from '../types';

interface TldrawEditorProps {
  slide: PitchDeckSlide;
  onUpdate: (updates: Partial<PitchDeckSlide>) => void;
  width?: number;
}

export const TldrawEditor: React.FC<TldrawEditorProps> = ({ slide, onUpdate, width = 1200 }) => {
  const [editor, setEditor] = useState<Editor | null>(null);

  // Height based on 16:9
  const height = width * (9 / 16);

  const handleMount = (editor: Editor) => {
    setEditor(editor);
    
    // Use setTimeout to ensure editor is fully ready before loading content
    setTimeout(() => {
      // Load snapshot if it exists
      if (slide.tldrawSnapshot) {
        try {
          editor.loadSnapshot(slide.tldrawSnapshot);
        } catch (err) {
          console.error("Failed to load tldraw snapshot:", err);
        }
      } else if (slide.elements && slide.elements.length > 0) {
        // Initial content setup from elements
        const shapesToCreate: any[] = [];
        
        slide.elements.forEach((el, index) => {
          const shapeId = createShapeId(`${el.id}-${index}`);
          
          if (el.type === 'image') {
            shapesToCreate.push({
              id: shapeId,
              type: 'image',
              x: (el.x / 100) * 1280,
              y: (el.y / 100) * 720,
              props: {
                w: (el.w / 100) * 1280,
                h: (el.h / 100) * 720,
                url: el.content || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200',
              },
            });
          } else {
            // Using 'text' shape as it's the most straightforward for content
            shapesToCreate.push({
              id: shapeId,
              type: 'text',
              x: (el.x / 100) * 1280,
              y: (el.y / 100) * 720,
              props: {
                text: el.content || '',
                w: (el.w / 100) * 1280 || 400,
                size: el.fontSize && el.fontSize > 40 ? 'l' : el.fontSize && el.fontSize > 20 ? 'm' : 's',
                font: el.fontFamily?.includes('serif') ? 'serif' : 'sans',
                textAlign: el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start',
                color: 'black'
              },
            });
          }
        });

        if (shapesToCreate.length > 0) {
          try {
            editor.createShapes(shapesToCreate);
          } catch (err) {
            console.error("Error creating shapes:", err);
          }
        }
      }
    }, 100);
  };

  // Sync editor changes back to the slide
  useEffect(() => {
    if (!editor) return;

    const sync = () => {
       try {
         const snapshot = editor.getSnapshot();
         
         // Map tldraw shapes back to SlideElements for PPTX export compatibility
         const shapes = editor.getCurrentPageShapes();
         if (!shapes || !Array.isArray(shapes)) return;

         const elements: SlideElement[] = shapes.map((shape: any) => {
            if (!shape || !shape.props) return null;

            const typeMap: Record<string, any> = {
              'image': 'image',
              'text': 'text',
              'geo': 'shape',
              'note': 'shape'
            };

            const p = shape.props as any;
            const content = p.text || p.richText || p.url || p.src || '';

            const base = {
              id: shape.id,
              type: (typeMap[shape.type] || 'shape') as any,
              content: typeof content === 'string' ? content : (content?.text || ''),
              x: (shape.x / 1280) * 100,
              y: (shape.y / 720) * 100,
              w: (p.w / 1280) * 100,
              h: (p.h / 720) * 100,
              zIndex: 10
            };
            
            if (shape.type === 'text' || shape.type === 'geo' || shape.type === 'note') {
               return {
                 ...base,
                 fontSize: p.size === 'l' ? 48 : p.size === 'm' ? 24 : 16,
                 textAlign: (p.align === 'middle' || p.textAlign === 'middle' ? 'center' : (p.align === 'end' || p.textAlign === 'end') ? 'right' : 'left') as any,
                 fontFamily: p.font === 'serif' ? 'Georgia' : 'Inter'
               };
            }
            return base as SlideElement;
         }).filter(Boolean) as SlideElement[];

         onUpdate({ 
           tldrawSnapshot: snapshot,
           elements
         });
       } catch (err) {
         console.error("Sync error:", err);
       }
    };

    const dispose = editor.store.listen(() => {
       sync();
    }, { source: 'user', scope: 'document' });

    return () => dispose();
  }, [editor, slide.id]); 

  return (
    <div 
      className="relative bg-[#102434] rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border border-white/5 mx-auto tldraw-container" 
      style={{ width, height }}
    >
      <Tldraw 
        key={slide.id}
        onMount={handleMount}
        persistenceKey={`decisionlab-slide-${slide.id}`}
      />
      
      {/* Premium Badge */}
      <div className="absolute top-4 right-20 z-[1000] pointer-events-none">
         <div className="px-3 py-1 bg-brand-accent/20 border border-brand-accent/40 rounded-full text-xs font-black text-brand-accent uppercase tracking-widest shadow-lg">
            Canvas Engine v3.0
         </div>
      </div>
      
      <style>{`
        .tldraw-container .tl-canvas {
          background-color: #08131D !important;
        }
        .tldraw-container .tl-ui {
          --tl-background: #102434;
          --tl-text: #FFFFFF;
          --tl-accent: #5DA9FF;
        }
      `}</style>
    </div>
  );
};
