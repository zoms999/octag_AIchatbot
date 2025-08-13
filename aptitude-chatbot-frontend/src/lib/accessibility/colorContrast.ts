/**
 * Color contrast utilities for accessibility
 */

/**
 * Calculate relative luminance of a color
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG contrast requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  } else {
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  }
}

/**
 * Color contrast checker and validator
 */
export class ColorContrastChecker {
  private static instance: ColorContrastChecker;
  
  static getInstance(): ColorContrastChecker {
    if (!ColorContrastChecker.instance) {
      ColorContrastChecker.instance = new ColorContrastChecker();
    }
    return ColorContrastChecker.instance;
  }

  /**
   * Validate all text elements on the page for contrast
   */
  validatePageContrast(): Array<{
    element: HTMLElement;
    foreground: string;
    background: string;
    ratio: number;
    passes: boolean;
  }> {
    const results: Array<{
      element: HTMLElement;
      foreground: string;
      background: string;
      ratio: number;
      passes: boolean;
    }> = [];

    if (typeof document === 'undefined') {
      return [];
    }

    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label, input, textarea');
    
    textElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const styles = window.getComputedStyle(htmlElement);
      const foreground = this.rgbToHex(styles.color);
      const background = this.getBackgroundColor(htmlElement);
      
      if (foreground && background) {
        const ratio = getContrastRatio(foreground, background);
        const fontSize = parseFloat(styles.fontSize);
        const fontWeight = styles.fontWeight;
        const isLarge = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        
        results.push({
          element: htmlElement,
          foreground,
          background,
          ratio,
          passes: meetsContrastRequirement(foreground, background, 'AA', isLarge ? 'large' : 'normal')
        });
      }
    });

    return results;
  }

  /**
   * Get effective background color of an element
   */
  private getBackgroundColor(element: HTMLElement): string | null {
    if (typeof document === 'undefined') {
      return '#ffffff';
    }

    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      const styles = window.getComputedStyle(current);
      const bgColor = styles.backgroundColor;
      
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        return this.rgbToHex(bgColor);
      }
      
      current = current.parentElement;
    }
    
    // Default to white background
    return '#ffffff';
  }

  /**
   * Convert RGB color to hex
   */
  private rgbToHex(rgb: string): string | null {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return null;
    
    const [, r, g, b] = match;
    return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
  }

  /**
   * Generate accessible color palette
   */
  generateAccessibleColors(baseColor: string): {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  } {
    // This is a simplified implementation
    // In a real application, you'd want more sophisticated color generation
    return {
      primary: baseColor,
      secondary: this.adjustBrightness(baseColor, -20),
      accent: this.adjustHue(baseColor, 30),
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#212529',
      textSecondary: '#6c757d'
    };
  }

  /**
   * Adjust color brightness
   */
  private adjustBrightness(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const adjust = (color: number) => {
      const adjusted = Math.round(color * (100 + percent) / 100);
      return Math.max(0, Math.min(255, adjusted));
    };

    const r = adjust(rgb.r).toString(16).padStart(2, '0');
    const g = adjust(rgb.g).toString(16).padStart(2, '0');
    const b = adjust(rgb.b).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
  }

  /**
   * Adjust color hue
   */
  private adjustHue(hex: string, degrees: number): string {
    // Simplified hue adjustment - in practice you'd convert to HSL, adjust, and convert back
    return hex; // Placeholder implementation
  }
}

/**
 * High contrast mode utilities
 */
export const highContrastUtils = {
  /**
   * Check if high contrast mode is enabled
   */
  isHighContrastMode(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  /**
   * Apply high contrast styles
   */
  applyHighContrastStyles() {
    if (typeof document === 'undefined') {
      return;
    }

    const style = document.createElement('style');
    style.id = 'high-contrast-styles';
    style.textContent = `
      .high-contrast {
        --background: #000000 !important;
        --foreground: #ffffff !important;
        --primary: #ffffff !important;
        --primary-foreground: #000000 !important;
        --secondary: #333333 !important;
        --secondary-foreground: #ffffff !important;
        --muted: #333333 !important;
        --muted-foreground: #ffffff !important;
        --accent: #ffffff !important;
        --accent-foreground: #000000 !important;
        --destructive: #ff0000 !important;
        --destructive-foreground: #ffffff !important;
        --border: #ffffff !important;
        --input: #333333 !important;
        --ring: #ffffff !important;
      }
      
      .high-contrast * {
        border-color: #ffffff !important;
        outline-color: #ffffff !important;
      }
      
      .high-contrast img {
        filter: contrast(150%) brightness(150%) !important;
      }
    `;
    
    document.head.appendChild(style);
    document.documentElement.classList.add('high-contrast');
  },

  /**
   * Remove high contrast styles
   */
  removeHighContrastStyles() {
    if (typeof document === 'undefined') {
      return;
    }

    const style = document.getElementById('high-contrast-styles');
    if (style) {
      style.remove();
    }
    document.documentElement.classList.remove('high-contrast');
  },

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast() {
    if (typeof document === 'undefined') {
      return;
    }

    if (document.documentElement.classList.contains('high-contrast')) {
      this.removeHighContrastStyles();
    } else {
      this.applyHighContrastStyles();
    }
  }
};