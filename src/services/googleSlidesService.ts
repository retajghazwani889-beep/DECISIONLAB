// Google Workspace slides and drive helper functions
import { PitchDeck, PitchDeckSlide, SlideElement } from '../types';

export interface GoogleSlideBatchRequest {
  [key: string]: any;
}

// Convert absolute percentages to standard 16:9 Google Slides dimensions (720pt wide by 405pt high)
const convertX = (pct: number) => (pct / 100) * 720;
const convertY = (pct: number) => (pct / 100) * 405;
const convertW = (pct: number) => (pct / 100) * 720;
const convertH = (pct: number) => (pct / 100) * 405;

// Convert Hex colors (such as #1a73e8 or #020617) to RGB float fractions from 0.0 to 1.0 expected by Google Slides API
function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  let cleanHex = hex.trim().replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  const intVal = parseInt(cleanHex, 16);
  if (isNaN(intVal)) {
    return { red: 0.1, green: 0.1, blue: 0.1 };
  }
  const r = ((intVal >> 16) & 255) / 255;
  const g = ((intVal >> 8) & 255) / 255;
  const b = (intVal & 255) / 255;
  return { red: r, green: g, blue: b };
}

/**
 * Validates whether the image URL is a valid, externally reachable address for the Google Slides ingest proxy.
 */
function isValidGoogleSlidesUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const lowercase = url.toLowerCase();
  if (!lowercase.startsWith('http://') && !lowercase.startsWith('https://')) return false;
  if (
    lowercase.includes('localhost') || 
    lowercase.includes('127.0.0.1') || 
    lowercase.includes('.local') || 
    lowercase.includes('::1') || 
    lowercase.includes('sandbox')
  ) {
    return false;
  }
  try {
    const parsed = new URL(url);
    if (!parsed.hostname || parsed.hostname.indexOf('.') === -1) return false;
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Creates a blank Google Slides presentation inside the user's Google Drive.
 */
export async function createGoogleSlidesPresentation(
  accessToken: string,
  title: string
): Promise<{ presentationId: string; revisionId?: string; title: string; slides: any[] }> {
  const response = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Failed to create presentation: ${response.statusText} - ${errorDetails}`);
  }

  return response.json();
}

/**
 * Performs a series of batch updates (creating slides, adding elements, modifying layouts) in Google Slides.
 */
export async function batchUpdateGoogleSlides(
  accessToken: string,
  presentationId: string,
  requests: GoogleSlideBatchRequest[]
) {
  const response = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Failed to update presentation: ${response.statusText} - ${errorDetails}`);
  }

  return response.json();
}

/**
 * Saves a binary file (like PDF or PPTX) to Google Drive.
 */
export async function saveFileToGoogleDrive(
  accessToken: string,
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<{ id: string; name: string; mimeType: string }> {
  // First, create the file metadata
  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Failed to save file to Google Drive: ${response.statusText} - ${errorDetails}`);
  }

  return response.json();
}

/**
 * Formats a pitch deck's slides and elements into a unified series of Google Slides updates.
 */
export function compileGoogleSlidesRequests(
  deck: PitchDeck,
  activeTheme: any,
  defaultSlideId?: string | null
): { requests: GoogleSlideBatchRequest[]; defaultSlideIdToDelete: string | null } {
  const requests: GoogleSlideBatchRequest[] = [];
  
  deck.slides.forEach((slide, sIdx) => {
    let slideId = `slide_user_${sIdx}`;
    const isFirstSlideReused = sIdx === 0 && defaultSlideId;

    if (isFirstSlideReused && defaultSlideId) {
      slideId = defaultSlideId;
    } else {
      // 1. Create BLANK Slide
      requests.push({
        createSlide: {
          objectId: slideId,
          slideLayoutReference: {
            predefinedLayout: 'BLANK',
          },
        },
      });
    }

    // 2. Clear default fields or set slide background color matching the workspace theme
    requests.push({
      updatePageProperties: {
        objectId: slideId,
        fields: 'pageBackgroundFill',
        pageProperties: {
          pageBackgroundFill: {
            solidFill: {
              color: {
                rgbColor: hexToRgb(activeTheme.primaryColor),
              },
            },
          },
        },
      },
    });

    if (slide.elements) {
      slide.elements.forEach((el, elIdx) => {
        const elId = `${slideId}_el_${elIdx}`;
        const fontColor = el.color || activeTheme.text;

        // Coordinates check to prevent out of boundaries text elements
        const x = convertX(el.x);
        const y = convertY(el.y);
        const w = convertW(el.w);
        const h = convertH(el.h);

        if (el.type === 'title' || el.type === 'text' || el.type === 'metric' || el.type === 'point') {
          // A. Create shape text box
          requests.push({
            createShape: {
              objectId: elId,
              shapeType: 'TEXT_BOX',
              elementProperties: {
                pageObjectId: slideId,
                size: {
                  width: { magnitude: w, unit: 'PT' },
                  height: { magnitude: h, unit: 'PT' },
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: x,
                  translateY: y,
                  unit: 'PT',
                },
              },
            },
          });

          // B. Add the content texts inside the created shape textbox
          requests.push({
            insertText: {
              objectId: elId,
              text: el.content,
            },
          });

          // C. Set clean premium typography styling parameters based on user's exact specifications
          const isTitle = el.type === 'title';
          const isMetric = el.type === 'metric';
          const isPoint = el.type === 'point';
          
          let fontSizeMag = 14; // Default body size matches user spec of 14
          let isBold = false;

          if (isTitle) {
            // First slide is primary title presentation slide -> size 44. Subsequent slide headers -> size 28.
            fontSizeMag = sIdx === 0 ? 44 : 28;
            isBold = true;
          } else if (isMetric) {
            fontSizeMag = 18;
            isBold = true;
          } else if (isPoint) {
            fontSizeMag = 14;
            isBold = el.content.startsWith('•') || el.content.toUpperCase() === el.content;
          } else {
            fontSizeMag = el.fontSize ? el.fontSize * 0.8 : 14;
            isBold = el.fontSize ? el.fontSize > 24 : false;
          }

          // Premium High-Contrast Clean Charcoal default fallback if the color is extremely dark, or using selected theme text
          const finalRgbColor = fontColor === '#020617' || fontColor === '#000000' || fontColor === '#0b131e'
            ? { red: 0.05, green: 0.09, blue: 0.16 } // Clean Charcoal palette
            : hexToRgb(fontColor);

          requests.push({
            updateTextStyle: {
              objectId: elId,
              textRange: { type: 'ALL' },
              fields: 'fontSize,fontFamily,foregroundColor,bold',
              style: {
                fontSize: { magnitude: fontSizeMag, unit: 'PT' },
                fontFamily: 'Arial', // Arial ensures total native rendering compatibility inside Google Workspace
                foregroundColor: {
                  opaqueColor: {
                    rgbColor: finalRgbColor,
                  },
                },
                bold: isBold,
              },
            },
          });

          // D. Paragraph align mapping
          requests.push({
            updateParagraphStyle: {
              objectId: elId,
              textRange: { type: 'ALL' },
              fields: 'alignment',
              style: {
                alignment: el.textAlign === 'center' ? 'CENTER' : el.textAlign === 'right' ? 'END' : 'START',
              },
            },
          });
        } else if (el.type === 'image') {
          // Direct image placement via URL with strict validation to prevent Google ingest bad request errors
          const sanitizedUrl = isValidGoogleSlidesUrl(el.content) 
            ? el.content 
            : 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80';
          requests.push({
            createImage: {
              objectId: elId,
              url: sanitizedUrl,
              elementProperties: {
                pageObjectId: slideId,
                size: {
                  width: { magnitude: w, unit: 'PT' },
                  height: { magnitude: h, unit: 'PT' },
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: x,
                  translateY: y,
                  unit: 'PT',
                },
              },
            },
          });
        } else if (el.type === 'shape') {
          // Draw geometric accent boundaries like horizontal corporate division lines
          requests.push({
            createShape: {
              objectId: elId,
              shapeType: el.content === 'circle' ? 'ELLIPSE' : 'RECTANGLE',
              elementProperties: {
                pageObjectId: slideId,
                size: {
                  width: { magnitude: w, unit: 'PT' },
                  height: { magnitude: h, unit: 'PT' },
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: x,
                  translateY: y,
                  unit: 'PT',
                },
              },
            },
          });

          requests.push({
            updateShapeProperties: {
              objectId: elId,
              fields: 'shapeBackgroundFill',
              shapeProperties: {
                shapeBackgroundFill: {
                  solidFill: {
                    color: {
                      rgbColor: hexToRgb(fontColor || activeTheme.accentColor),
                    },
                  },
                },
              },
            },
          });
        } else if (el.type === 'table') {
          // Render elegant tables using basic grid systems in Slides API
          const rows = el.content.split(/\r?\n|\\\\n/);
          const headerRow = rows.find(r => r.startsWith('Header / Columns:')) || rows[0] || '';
          const cols = headerRow ? headerRow.replace('Header / Columns: ', '').split(' | ') : ['Feature', 'Value'];
          const dataRows = rows.filter(r => !r.startsWith('Header / Columns:') && r.trim() !== '').map(r => r.split(' | '));
          
          const totalRows = dataRows.length + 1;
          const totalCols = cols.length;

          if (totalRows > 0 && totalCols > 0) {
            requests.push({
              createTable: {
                objectId: elId,
                rows: totalRows,
                columns: totalCols,
                elementProperties: {
                  pageObjectId: slideId,
                  size: {
                    width: { magnitude: w, unit: 'PT' },
                    height: { magnitude: h, unit: 'PT' },
                  },
                  transform: {
                    scaleX: 1,
                    scaleY: 1,
                    translateX: x,
                    translateY: y,
                    unit: 'PT',
                  },
                },
              },
            });

            // Populate header cells
            cols.forEach((colName, cIdx) => {
              requests.push({
                insertText: {
                  objectId: elId,
                  cellLocation: { rowIndex: 0, columnIndex: cIdx },
                  text: colName,
                },
              });
            });

            // Populate data rows cells
            dataRows.forEach((row, rIdx) => {
              row.forEach((cellVal, cIdx) => {
                if (cIdx < totalCols) {
                  requests.push({
                    insertText: {
                      objectId: elId,
                      cellLocation: { rowIndex: rIdx + 1, columnIndex: cIdx },
                      text: cellVal,
                    },
                  });
                }
              });
            });
          }
        }
      });
    }
  });

  return { requests, defaultSlideIdToDelete: null };
}
