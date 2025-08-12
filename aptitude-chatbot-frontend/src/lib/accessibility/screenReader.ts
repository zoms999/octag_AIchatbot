/**
 * Screen reader utilities and ARIA helpers
 */

/**
 * Live region manager for screen reader announcements
 */
export class LiveRegionManager {
  private liveRegion: HTMLElement | null = null;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  constructor() {
    this.createLiveRegions();
  }

  private createLiveRegions() {
    // Create polite live region
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    this.politeRegion.id = 'live-region-polite';
    document.body.appendChild(this.politeRegion);

    // Create assertive live region
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    this.assertiveRegion.id = 'live-region-assertive';
    document.body.appendChild(this.assertiveRegion);
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    
    if (region) {
      // Clear the region first
      region.textContent = '';
      
      // Add the message after a brief delay to ensure it's announced
      setTimeout(() => {
        region.textContent = message;
      }, 100);

      // Clear the message after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  /**
   * Announce status updates
   */
  announceStatus(status: string) {
    this.announce(`상태: ${status}`, 'polite');
  }

  /**
   * Announce errors
   */
  announceError(error: string) {
    this.announce(`오류: ${error}`, 'assertive');
  }

  /**
   * Announce success messages
   */
  announceSuccess(message: string) {
    this.announce(`성공: ${message}`, 'polite');
  }

  /**
   * Announce loading states
   */
  announceLoading(message: string = '로딩 중...') {
    this.announce(message, 'polite');
  }

  /**
   * Clean up live regions
   */
  destroy() {
    if (this.politeRegion) {
      document.body.removeChild(this.politeRegion);
    }
    if (this.assertiveRegion) {
      document.body.removeChild(this.assertiveRegion);
    }
  }
}

/**
 * ARIA utilities
 */
export const ariaUtils = {
  /**
   * Set ARIA attributes on an element
   */
  setAttributes(element: HTMLElement, attributes: Record<string, string | boolean | number>) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith('aria-') || key.startsWith('role')) {
        element.setAttribute(key, String(value));
      }
    });
  },

  /**
   * Create ARIA label for an element
   */
  setLabel(element: HTMLElement, label: string) {
    element.setAttribute('aria-label', label);
  },

  /**
   * Set ARIA described by
   */
  setDescribedBy(element: HTMLElement, descriptionId: string) {
    element.setAttribute('aria-describedby', descriptionId);
  },

  /**
   * Set ARIA labelled by
   */
  setLabelledBy(element: HTMLElement, labelId: string) {
    element.setAttribute('aria-labelledby', labelId);
  },

  /**
   * Set expanded state for collapsible elements
   */
  setExpanded(element: HTMLElement, expanded: boolean) {
    element.setAttribute('aria-expanded', String(expanded));
  },

  /**
   * Set selected state for selectable elements
   */
  setSelected(element: HTMLElement, selected: boolean) {
    element.setAttribute('aria-selected', String(selected));
  },

  /**
   * Set checked state for checkable elements
   */
  setChecked(element: HTMLElement, checked: boolean | 'mixed') {
    element.setAttribute('aria-checked', String(checked));
  },

  /**
   * Set disabled state
   */
  setDisabled(element: HTMLElement, disabled: boolean) {
    element.setAttribute('aria-disabled', String(disabled));
  },

  /**
   * Set hidden state
   */
  setHidden(element: HTMLElement, hidden: boolean) {
    if (hidden) {
      element.setAttribute('aria-hidden', 'true');
    } else {
      element.removeAttribute('aria-hidden');
    }
  },

  /**
   * Set current state for navigation elements
   */
  setCurrent(element: HTMLElement, current: 'page' | 'step' | 'location' | 'date' | 'time' | boolean) {
    if (current === false) {
      element.removeAttribute('aria-current');
    } else {
      element.setAttribute('aria-current', String(current));
    }
  },

  /**
   * Set busy state for loading elements
   */
  setBusy(element: HTMLElement, busy: boolean) {
    element.setAttribute('aria-busy', String(busy));
  },

  /**
   * Set invalid state for form elements
   */
  setInvalid(element: HTMLElement, invalid: boolean) {
    element.setAttribute('aria-invalid', String(invalid));
  },

  /**
   * Set required state for form elements
   */
  setRequired(element: HTMLElement, required: boolean) {
    element.setAttribute('aria-required', String(required));
  }
};

/**
 * Screen reader text utilities
 */
export const screenReaderUtils = {
  /**
   * Create screen reader only text element
   */
  createSROnlyText(text: string): HTMLElement {
    const element = document.createElement('span');
    element.className = 'sr-only';
    element.textContent = text;
    return element;
  },

  /**
   * Add screen reader only text to an element
   */
  addSROnlyText(element: HTMLElement, text: string) {
    const srText = this.createSROnlyText(text);
    element.appendChild(srText);
  },

  /**
   * Format number for screen readers
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('ko-KR').format(num);
  },

  /**
   * Format date for screen readers
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  },

  /**
   * Format percentage for screen readers
   */
  formatPercentage(value: number): string {
    return `${value}퍼센트`;
  }
};

// Global live region manager instance
export const liveRegionManager = new LiveRegionManager();