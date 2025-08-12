/**
 * Keyboard navigation utilities for accessibility
 */

export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

export type KeyboardKey = typeof KEYBOARD_KEYS[keyof typeof KEYBOARD_KEYS];

/**
 * Check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ];

  return focusableSelectors.some(selector => element.matches(selector));
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
}

/**
 * Handle keyboard navigation within a container
 */
export function handleKeyboardNavigation(
  event: KeyboardEvent,
  container: HTMLElement,
  options: {
    circular?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
  } = {}
): boolean {
  const { circular = true, orientation = 'both' } = options;
  const focusableElements = getFocusableElements(container);
  
  if (focusableElements.length === 0) return false;

  const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
  let nextIndex = currentIndex;

  switch (event.key) {
    case KEYBOARD_KEYS.ARROW_DOWN:
      if (orientation === 'vertical' || orientation === 'both') {
        nextIndex = currentIndex + 1;
        if (nextIndex >= focusableElements.length) {
          nextIndex = circular ? 0 : focusableElements.length - 1;
        }
        event.preventDefault();
        return true;
      }
      break;

    case KEYBOARD_KEYS.ARROW_UP:
      if (orientation === 'vertical' || orientation === 'both') {
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = circular ? focusableElements.length - 1 : 0;
        }
        event.preventDefault();
        return true;
      }
      break;

    case KEYBOARD_KEYS.ARROW_RIGHT:
      if (orientation === 'horizontal' || orientation === 'both') {
        nextIndex = currentIndex + 1;
        if (nextIndex >= focusableElements.length) {
          nextIndex = circular ? 0 : focusableElements.length - 1;
        }
        event.preventDefault();
        return true;
      }
      break;

    case KEYBOARD_KEYS.ARROW_LEFT:
      if (orientation === 'horizontal' || orientation === 'both') {
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = circular ? focusableElements.length - 1 : 0;
        }
        event.preventDefault();
        return true;
      }
      break;

    case KEYBOARD_KEYS.HOME:
      nextIndex = 0;
      event.preventDefault();
      return true;

    case KEYBOARD_KEYS.END:
      nextIndex = focusableElements.length - 1;
      event.preventDefault();
      return true;

    default:
      return false;
  }

  if (nextIndex !== currentIndex) {
    focusableElements[nextIndex]?.focus();
  }

  return true;
}

/**
 * Create a roving tabindex manager for a group of elements
 */
export class RovingTabindexManager {
  private elements: HTMLElement[] = [];
  private currentIndex = 0;

  constructor(private container: HTMLElement) {
    this.updateElements();
    this.setupEventListeners();
  }

  private updateElements() {
    this.elements = getFocusableElements(this.container);
    this.updateTabindices();
  }

  private updateTabindices() {
    this.elements.forEach((element, index) => {
      element.tabIndex = index === this.currentIndex ? 0 : -1;
    });
  }

  private setupEventListeners() {
    this.container.addEventListener('keydown', this.handleKeydown.bind(this));
    this.container.addEventListener('focusin', this.handleFocusin.bind(this));
  }

  private handleKeydown(event: KeyboardEvent) {
    if (handleKeyboardNavigation(event, this.container)) {
      this.updateCurrentIndex();
    }
  }

  private handleFocusin(event: FocusEvent) {
    const target = event.target as HTMLElement;
    const index = this.elements.indexOf(target);
    if (index !== -1) {
      this.currentIndex = index;
      this.updateTabindices();
    }
  }

  private updateCurrentIndex() {
    const activeElement = document.activeElement as HTMLElement;
    const index = this.elements.indexOf(activeElement);
    if (index !== -1) {
      this.currentIndex = index;
      this.updateTabindices();
    }
  }

  public refresh() {
    this.updateElements();
  }

  public destroy() {
    this.container.removeEventListener('keydown', this.handleKeydown.bind(this));
    this.container.removeEventListener('focusin', this.handleFocusin.bind(this));
  }
}