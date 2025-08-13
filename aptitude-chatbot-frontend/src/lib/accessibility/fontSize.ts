/**
 * Font size adjustment utilities for accessibility
 */

export type FontSizeLevel = 'small' | 'normal' | 'large' | 'extra-large';

export interface FontSizeSettings {
  level: FontSizeLevel;
  scale: number;
  lineHeight: number;
}

/**
 * Font size manager for accessibility
 */
export class FontSizeManager {
  private static instance: FontSizeManager;
  private currentLevel: FontSizeLevel = 'normal';
  private storageKey = 'accessibility-font-size';

  private fontSizeSettings: Record<FontSizeLevel, FontSizeSettings> = {
    small: { level: 'small', scale: 0.875, lineHeight: 1.4 },
    normal: { level: 'normal', scale: 1, lineHeight: 1.5 },
    large: { level: 'large', scale: 1.125, lineHeight: 1.6 },
    'extra-large': { level: 'extra-large', scale: 1.25, lineHeight: 1.7 }
  };

  static getInstance(): FontSizeManager {
    if (!FontSizeManager.instance) {
      FontSizeManager.instance = new FontSizeManager();
    }
    return FontSizeManager.instance;
  }

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.loadSettings();
      this.applyFontSize();
    }
  }

  /**
   * Get current font size level
   */
  getCurrentLevel(): FontSizeLevel {
    return this.currentLevel;
  }

  /**
   * Set font size level
   */
  setFontSize(level: FontSizeLevel) {
    this.currentLevel = level;
    this.applyFontSize();
    this.saveSettings();
    this.notifyChange();
  }

  /**
   * Increase font size
   */
  increaseFontSize() {
    const levels: FontSizeLevel[] = ['small', 'normal', 'large', 'extra-large'];
    const currentIndex = levels.indexOf(this.currentLevel);
    const nextIndex = Math.min(currentIndex + 1, levels.length - 1);
    this.setFontSize(levels[nextIndex]);
  }

  /**
   * Decrease font size
   */
  decreaseFontSize() {
    const levels: FontSizeLevel[] = ['small', 'normal', 'large', 'extra-large'];
    const currentIndex = levels.indexOf(this.currentLevel);
    const nextIndex = Math.max(currentIndex - 1, 0);
    this.setFontSize(levels[nextIndex]);
  }

  /**
   * Reset to normal font size
   */
  resetFontSize() {
    this.setFontSize('normal');
  }

  /**
   * Apply font size to document
   */
  private applyFontSize() {
    if (typeof document === 'undefined') {
      return;
    }

    const settings = this.fontSizeSettings[this.currentLevel];
    const root = document.documentElement;

    // Remove existing font size classes
    root.classList.remove('font-size-small', 'font-size-normal', 'font-size-large', 'font-size-extra-large');
    
    // Add current font size class
    root.classList.add(`font-size-${settings.level}`);

    // Apply CSS custom properties
    root.style.setProperty('--font-size-scale', settings.scale.toString());
    root.style.setProperty('--line-height-scale', settings.lineHeight.toString());

    // Apply styles
    this.injectFontSizeStyles();
  }

  /**
   * Inject font size styles
   */
  private injectFontSizeStyles() {
    if (typeof document === 'undefined') {
      return;
    }

    const existingStyle = document.getElementById('accessibility-font-size-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'accessibility-font-size-styles';
    
    const settings = this.fontSizeSettings[this.currentLevel];
    
    style.textContent = `
      :root {
        --font-size-scale: ${settings.scale};
        --line-height-scale: ${settings.lineHeight};
      }
      
      .font-size-${settings.level} {
        font-size: calc(1rem * var(--font-size-scale)) !important;
        line-height: var(--line-height-scale) !important;
      }
      
      .font-size-${settings.level} h1 {
        font-size: calc(2.25rem * var(--font-size-scale)) !important;
        line-height: calc(2.5rem * var(--line-height-scale)) !important;
      }
      
      .font-size-${settings.level} h2 {
        font-size: calc(1.875rem * var(--font-size-scale)) !important;
        line-height: calc(2.25rem * var(--line-height-scale)) !important;
      }
      
      .font-size-${settings.level} h3 {
        font-size: calc(1.5rem * var(--font-size-scale)) !important;
        line-height: calc(2rem * var(--line-height-scale)) !important;
      }
      
      .font-size-${settings.level} h4 {
        font-size: calc(1.25rem * var(--font-size-scale)) !important;
        line-height: calc(1.75rem * var(--line-height-scale)) !important;
      }
      
      .font-size-${settings.level} h5 {
        font-size: calc(1.125rem * var(--font-size-scale)) !important;
        line-height: calc(1.75rem * var(--line-height-scale)) !important;
      }
      
      .font-size-${settings.level} h6 {
        font-size: calc(1rem * var(--font-size-scale)) !important;
        line-height: calc(1.5rem * var(--line-height-scale)) !important;
      }
      
      .font-size-${settings.level} p,
      .font-size-${settings.level} span,
      .font-size-${settings.level} div,
      .font-size-${settings.level} button,
      .font-size-${settings.level} input,
      .font-size-${settings.level} textarea,
      .font-size-${settings.level} select {
        font-size: calc(1rem * var(--font-size-scale)) !important;
        line-height: var(--line-height-scale) !important;
      }
      
      .font-size-${settings.level} .text-xs {
        font-size: calc(0.75rem * var(--font-size-scale)) !important;
      }
      
      .font-size-${settings.level} .text-sm {
        font-size: calc(0.875rem * var(--font-size-scale)) !important;
      }
      
      .font-size-${settings.level} .text-lg {
        font-size: calc(1.125rem * var(--font-size-scale)) !important;
      }
      
      .font-size-${settings.level} .text-xl {
        font-size: calc(1.25rem * var(--font-size-scale)) !important;
      }
      
      .font-size-${settings.level} .text-2xl {
        font-size: calc(1.5rem * var(--font-size-scale)) !important;
      }
      
      .font-size-${settings.level} .text-3xl {
        font-size: calc(1.875rem * var(--font-size-scale)) !important;
      }
      
      .font-size-${settings.level} .text-4xl {
        font-size: calc(2.25rem * var(--font-size-scale)) !important;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        level: this.currentLevel
      }));
    } catch (error) {
      console.warn('Failed to save font size settings:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.level && this.fontSizeSettings[settings.level as FontSizeLevel]) {
          this.currentLevel = settings.level;
        }
      }
    } catch (error) {
      console.warn('Failed to load font size settings:', error);
    }
  }

  /**
   * Notify about font size changes
   */
  private notifyChange() {
    if (typeof window === 'undefined') {
      return;
    }

    const event = new CustomEvent('fontSizeChanged', {
      detail: {
        level: this.currentLevel,
        settings: this.fontSizeSettings[this.currentLevel]
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get all available font size levels
   */
  getAvailableLevels(): FontSizeLevel[] {
    return Object.keys(this.fontSizeSettings) as FontSizeLevel[];
  }

  /**
   * Get settings for a specific level
   */
  getSettingsForLevel(level: FontSizeLevel): FontSizeSettings {
    return this.fontSizeSettings[level];
  }

  /**
   * Check if user prefers large text
   */
  static prefersLargeText(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

/**
 * Font size utilities
 */
export const fontSizeUtils = {
  /**
   * Get font size manager instance
   */
  getManager(): FontSizeManager {
    return FontSizeManager.getInstance();
  },

  /**
   * Initialize font size management
   */
  initialize() {
    const manager = FontSizeManager.getInstance();
    
    if (typeof window === 'undefined') {
      return manager;
    }
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', (e) => {
      if (e.matches && manager.getCurrentLevel() === 'normal') {
        manager.setFontSize('large');
      }
    });

    return manager;
  },

  /**
   * Create font size control component data
   */
  createControlData() {
    const manager = FontSizeManager.getInstance();
    
    return {
      currentLevel: manager.getCurrentLevel(),
      levels: manager.getAvailableLevels(),
      increase: () => manager.increaseFontSize(),
      decrease: () => manager.decreaseFontSize(),
      reset: () => manager.resetFontSize(),
      setLevel: (level: FontSizeLevel) => manager.setFontSize(level)
    };
  }
};