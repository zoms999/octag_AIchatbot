/**
 * Focus management utilities for accessibility
 */

/**
 * Focus trap for modal dialogs and overlays
 */
export class FocusTrap {
  private focusableElements: HTMLElement[] = [];
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  constructor(private container: HTMLElement) {
    if (typeof document !== 'undefined') {
      this.previouslyFocusedElement = document.activeElement as HTMLElement;
      this.updateFocusableElements();
      this.setupEventListeners();
    }
  }

  private updateFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    this.focusableElements = Array.from(
      this.container.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];

    this.firstFocusableElement = this.focusableElements[0] || null;
    this.lastFocusableElement = 
      this.focusableElements[this.focusableElements.length - 1] || null;
  }

  private setupEventListeners() {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.handleKeydown);
    }
  }

  private handleKeydown = (event: KeyboardEvent) => {
    if (typeof document === 'undefined') return;
    if (event.key !== 'Tab') return;

    if (this.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault();
        this.lastFocusableElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault();
        this.firstFocusableElement?.focus();
      }
    }
  };

  public activate() {
    this.updateFocusableElements();
    if (this.firstFocusableElement) {
      this.firstFocusableElement.focus();
    }
  }

  public deactivate() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.handleKeydown);
    }
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
  }
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Set focus to an element with optional delay
   */
  setFocus(element: HTMLElement | null, delay = 0) {
    if (!element) return;

    if (delay > 0) {
      setTimeout(() => element.focus(), delay);
    } else {
      element.focus();
    }
  },

  /**
   * Save current focus and return a function to restore it
   */
  saveFocus(): () => void {
    if (typeof document === 'undefined') {
      return () => {};
    }
    const activeElement = document.activeElement as HTMLElement;
    return () => {
      if (activeElement && typeof activeElement.focus === 'function') {
        activeElement.focus();
      }
    };
  },

  /**
   * Find the next focusable element
   */
  findNextFocusable(current: HTMLElement, direction: 'forward' | 'backward' = 'forward'): HTMLElement | null {
    if (typeof document === 'undefined') {
      return null;
    }
    
    const focusableElements = Array.from(
      document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(current);
    if (currentIndex === -1) return null;

    const nextIndex = direction === 'forward' 
      ? (currentIndex + 1) % focusableElements.length
      : (currentIndex - 1 + focusableElements.length) % focusableElements.length;

    return focusableElements[nextIndex] || null;
  },

  /**
   * Check if an element is currently visible and focusable
   */
  isElementFocusable(element: HTMLElement): boolean {
    if (!element || typeof window === 'undefined') return false;

    // Check if element is hidden
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check if element is disabled
    if (element.hasAttribute('disabled')) {
      return false;
    }

    // Check tabindex
    const tabindex = element.getAttribute('tabindex');
    if (tabindex === '-1') {
      return false;
    }

    return true;
  },

  /**
   * Create a focus outline for better visibility
   */
  createFocusOutline(element: HTMLElement, options: {
    color?: string;
    width?: string;
    style?: string;
  } = {}) {
    const { color = '#005fcc', width = '2px', style = 'solid' } = options;
    
    element.style.outline = `${width} ${style} ${color}`;
    element.style.outlineOffset = '2px';
  },

  /**
   * Remove focus outline
   */
  removeFocusOutline(element: HTMLElement) {
    element.style.outline = '';
    element.style.outlineOffset = '';
  }
};