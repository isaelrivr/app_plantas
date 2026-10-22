/**
 * Utilidades para cálculo de luminancia relativa y ratio de contraste según W3C WCAG 2.1.
 * - https://www.w3.org/WAI/GL/wiki/Relative_luminance
 * - https://www.w3.org/TR/WCAG21/#contrast-minimum
 */

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function sRgbToLinear(c8bit: number): number {
  const c = c8bit / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hexColor: string): number {
  const { r, g, b } = parseHexColor(hexColor);
  const rLin = sRgbToLinear(r);
  const gLin = sRgbToLinear(g);
  const bLin = sRgbToLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calcula el ratio de contraste entre dos colores Hex (ej: #FFFFFF y #1B5E20).
 * Devuelve un número (ej: 4.5 para 4.5:1).
 */
export function getContrastRatio(color1Hex: string, color2Hex: string): number {
  const l1 = getRelativeLuminance(color1Hex);
  const l2 = getRelativeLuminance(color2Hex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Simula la mezcla alfa de un color translúcido sobre un fondo sólido para
 * evaluar contraste real sobre superficies translúcidas.
 */
export function blendRgbaOverHex(
  fg: { r: number; g: number; b: number; a: number },
  bgHex: string
): string {
  const bg = parseHexColor(bgHex);
  const r = Math.round(fg.r * fg.a + bg.r * (1 - fg.a));
  const g = Math.round(fg.g * fg.a + bg.g * (1 - fg.a));
  const b = Math.round(fg.b * fg.a + bg.b * (1 - fg.a));
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Parsea cadenas como 'rgba(0, 0, 0, 0.55)' o 'rgb(255, 255, 255)'.
 */
export function parseRgba(rgbaStr: string): { r: number; g: number; b: number; a: number } {
  const match = rgbaStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (!match) {
    throw new Error(`Invalid rgba string: ${rgbaStr}`);
  }
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1.0,
  };
}

/**
 * Criterios de conformidad WCAG 2.1 Nivel AA:
 * - Texto normal (< 18pt o < 14pt bold): ratio >= 4.5:1
 * - Texto grande (>= 18pt o >= 14pt bold): ratio >= 3.0:1
 * - Componentes de interfaz gráfica e íconos: ratio >= 3.0:1
 */
export const WCAG_MIN_TEXT_RATIO = 4.5;
export const WCAG_MIN_UI_ICON_RATIO = 3.0;

export function meetsWcagText(ratio: number): boolean {
  return ratio >= WCAG_MIN_TEXT_RATIO;
}

export function meetsWcagIcon(ratio: number): boolean {
  return ratio >= WCAG_MIN_UI_ICON_RATIO;
}

