// WCAG Color Contrast Utilities

/**
 * Convert hex color to RGB
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Calculate relative luminance of a color
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) return 1

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Check if color combination meets WCAG contrast requirements
 */
export function meetsWCAGContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background)

  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7
  } else {
    return size === 'large' ? ratio >= 3 : ratio >= 4.5
  }
}

/**
 * Get accessible color suggestions
 */
export function getAccessibleColor(
  baseColor: string,
  backgroundColor: string,
  level: 'AA' | 'AAA' = 'AA'
): string {
  if (meetsWCAGContrast(baseColor, backgroundColor, level)) {
    return baseColor
  }

  const baseRgb = hexToRgb(baseColor)
  const bgRgb = hexToRgb(backgroundColor)

  if (!baseRgb || !bgRgb) return baseColor

  // Try making the color darker or lighter
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b)
  const shouldDarken = bgLuminance > 0.5

  let adjustedColor = baseColor
  const step = shouldDarken ? -10 : 10

  for (let i = 0; i < 20; i++) {
    const newR = Math.max(0, Math.min(255, baseRgb.r + step * i))
    const newG = Math.max(0, Math.min(255, baseRgb.g + step * i))
    const newB = Math.max(0, Math.min(255, baseRgb.b + step * i))

    adjustedColor = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`

    if (meetsWCAGContrast(adjustedColor, backgroundColor, level)) {
      return adjustedColor
    }
  }

  // If we can't find an accessible version, return high contrast fallback
  return shouldDarken ? '#000000' : '#ffffff'
}

// Predefined accessible color combinations for our design system
export const accessibleColors = {
  // Primary combinations
  dentalTeal: {
    onWhite: '#2D7A7A', // Higher contrast version of #AECED3
    onDark: '#B8E6E6',
    onLight: '#1A5F5F',
  },
  dentalBlue: {
    onWhite: '#2D7A7A',
    onDark: '#B8E6E6',
    onLight: '#1A5F5F',
  },
  // Text colors
  text: {
    primary: '#1F2937', // gray-800
    secondary: '#4B5563', // gray-600
    muted: '#6B7280', // gray-500
    light: '#9CA3AF', // gray-400
  },
  // Status colors with good contrast
  status: {
    success: '#059669', // green-600
    warning: '#D97706', // amber-600
    error: '#DC2626', // red-600
    info: '#2563EB', // blue-600
  },
}
