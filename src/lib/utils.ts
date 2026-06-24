import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert OKLCH components to Linear sRGB and then standard sRGB
export function oklchToRgb(l: number, c: number, h: number, alpha: string | number = 1): string {
  // h is in degrees, convert to radians
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // OKLab to LMS
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  // Cube LMS
  const l_cube = l_ * l_ * l_;
  const m_cube = m_ * m_ * m_;
  const s_cube = s_ * s_ * s_;

  // LMS to Linear sRGB
  const rL = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  const gL = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  const bL = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

  // Gamma correction function
  const gamma = (val: number) => {
    if (val <= 0.0031308) {
      return 12.92 * val;
    }
    return 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
  };

  const red = Math.max(0, Math.min(255, Math.round(gamma(rL) * 255)));
  const green = Math.max(0, Math.min(255, Math.round(gamma(gL) * 255)));
  const blue = Math.max(0, Math.min(255, Math.round(gamma(bL) * 255)));

  if (alpha !== undefined && alpha !== null && alpha !== '') {
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
  return `rgb(${red}, ${green}, ${blue})`;
}

// Parse oklch values found inside CSS strings and substitute with standard rgb formulas
export function parseAndConvertOklch(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;

  // Matches oklch(L C H) or oklch(L C H / A) structures (handles spaces)
  const oklchRegex = /oklch\(\s*([\d\.]+%?)\s+([\d\.]+)\s+([\d\.]+)(?:\s*\/\s*([\d\.]+%?))?\s*\)/gi;
  // Matches oklch(L, C, H) or oklch(L, C, H, A) structures (handles commas)
  const oklchCommaRegex = /oklch\(\s*([\d\.]+%?)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)(?:\s*,\s*([\d\.]+%?))?\s*\)/gi;

  const replacer = (_match: string, lStr: string, cStr: string, hStr: string, aStr?: string) => {
    const l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
    const c = parseFloat(cStr);
    const h = parseFloat(hStr);
    let a: string | number = 1;
    if (aStr) {
      a = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
    }
    return oklchToRgb(l, c, h, a);
  };

  let result = colorStr.replace(oklchRegex, replacer);
  result = result.replace(oklchCommaRegex, replacer);
  return result;
}

// Wrap operations (like html2canvas rendering) in a safe layout window patch
export function withOklchHtml2CanvasPatch<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof window === 'undefined') return fn();

  const originalGetComputedStyle = window.getComputedStyle;

  const patchedGetComputedStyle = function (elt: Element, pseudoElt?: string | null) {
    const style = originalGetComputedStyle.call(window, elt, pseudoElt);
    
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === 'getPropertyValue') {
          return function(key: string) {
            const val = target.getPropertyValue(key);
            return parseAndConvertOklch(val);
          };
        }
        
        const value = Reflect.get(target, prop);
        if (typeof value === 'string') {
          return parseAndConvertOklch(value);
        }
        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      }
    }) as CSSStyleDeclaration;
  };

  // Re-define window getComputedStyle
  window.getComputedStyle = patchedGetComputedStyle as any;

  return fn().finally(() => {
    // Restore clean standard styles
    window.getComputedStyle = originalGetComputedStyle;
  });
}
