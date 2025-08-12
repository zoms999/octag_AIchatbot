/**
 * React hooks for accessibility features
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  FocusTrap,
  focusUtils,
  liveRegionManager,
  ariaUtils,
  FontSizeManager,
  FontSizeLevel,
  highContrastUtils,
  keyboardShortcutsUtils,
  KeyboardShortcut
} from '@/lib/accessibility';

/**
 * Hook for managing focus traps in modals and overlays
 */
export function useFocusTrap(isActive: boolean = false) {
  const containerRef = useRef<HTMLElement>(null);
  const focusTrapRef = useRef<FocusTrap | null>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      focusTrapRef.current = new FocusTrap(containerRef.current);
      focusTrapRef.current.activate();
    }

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
        focusTrapRef.current = null;
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing focus restoration
 */
export function useFocusRestore() {
  const restoreFocusRef = useRef<(() => void) | null>(null);

  const saveFocus = useCallback(() => {
    restoreFocusRef.current = focusUtils.saveFocus();
  }, []);

  const restoreFocus = useCallback(() => {
    if (restoreFocusRef.current) {
      restoreFocusRef.current();
      restoreFocusRef.current = null;
    }
  }, []);

  return { saveFocus, restoreFocus };
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    liveRegionManager.announce(message, priority);
  }, []);

  const announceStatus = useCallback((status: string) => {
    liveRegionManager.announceStatus(status);
  }, []);

  const announceError = useCallback((error: string) => {
    liveRegionManager.announceError(error);
  }, []);

  const announceSuccess = useCallback((message: string) => {
    liveRegionManager.announceSuccess(message);
  }, []);

  const announceLoading = useCallback((message?: string) => {
    liveRegionManager.announceLoading(message);
  }, []);

  return {
    announce,
    announceStatus,
    announceError,
    announceSuccess,
    announceLoading
  };
}

/**
 * Hook for ARIA attributes management
 */
export function useAriaAttributes(elementRef: React.RefObject<HTMLElement>) {
  const setAttributes = useCallback((attributes: Record<string, string | boolean | number>) => {
    if (elementRef.current) {
      ariaUtils.setAttributes(elementRef.current, attributes);
    }
  }, [elementRef]);

  const setLabel = useCallback((label: string) => {
    if (elementRef.current) {
      ariaUtils.setLabel(elementRef.current, label);
    }
  }, [elementRef]);

  const setDescribedBy = useCallback((descriptionId: string) => {
    if (elementRef.current) {
      ariaUtils.setDescribedBy(elementRef.current, descriptionId);
    }
  }, [elementRef]);

  const setExpanded = useCallback((expanded: boolean) => {
    if (elementRef.current) {
      ariaUtils.setExpanded(elementRef.current, expanded);
    }
  }, [elementRef]);

  const setSelected = useCallback((selected: boolean) => {
    if (elementRef.current) {
      ariaUtils.setSelected(elementRef.current, selected);
    }
  }, [elementRef]);

  const setBusy = useCallback((busy: boolean) => {
    if (elementRef.current) {
      ariaUtils.setBusy(elementRef.current, busy);
    }
  }, [elementRef]);

  return {
    setAttributes,
    setLabel,
    setDescribedBy,
    setExpanded,
    setSelected,
    setBusy
  };
}

/**
 * Hook for font size management
 */
export function useFontSize() {
  const [currentLevel, setCurrentLevel] = useState<FontSizeLevel>('normal');
  const manager = FontSizeManager.getInstance();

  useEffect(() => {
    setCurrentLevel(manager.getCurrentLevel());

    const handleFontSizeChange = (event: CustomEvent) => {
      setCurrentLevel(event.detail.level);
    };

    window.addEventListener('fontSizeChanged', handleFontSizeChange as EventListener);

    return () => {
      window.removeEventListener('fontSizeChanged', handleFontSizeChange as EventListener);
    };
  }, [manager]);

  const setFontSize = useCallback((level: FontSizeLevel) => {
    manager.setFontSize(level);
  }, [manager]);

  const increaseFontSize = useCallback(() => {
    manager.increaseFontSize();
  }, [manager]);

  const decreaseFontSize = useCallback(() => {
    manager.decreaseFontSize();
  }, [manager]);

  const resetFontSize = useCallback(() => {
    manager.resetFontSize();
  }, [manager]);

  return {
    currentLevel,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    availableLevels: manager.getAvailableLevels()
  };
}

/**
 * Hook for high contrast mode
 */
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    setIsHighContrast(document.documentElement.classList.contains('high-contrast'));

    const handleToggle = () => {
      highContrastUtils.toggleHighContrast();
      setIsHighContrast(document.documentElement.classList.contains('high-contrast'));
    };

    window.addEventListener('toggleHighContrast', handleToggle);

    return () => {
      window.removeEventListener('toggleHighContrast', handleToggle);
    };
  }, []);

  const toggleHighContrast = useCallback(() => {
    highContrastUtils.toggleHighContrast();
    setIsHighContrast(document.documentElement.classList.contains('high-contrast'));
  }, []);

  return {
    isHighContrast,
    toggleHighContrast
  };
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts?: KeyboardShortcut[]) {
  const [registeredShortcuts, setRegisteredShortcuts] = useState<KeyboardShortcut[]>([]);

  useEffect(() => {
    const manager = keyboardShortcutsUtils.getManager();

    // Register provided shortcuts
    if (shortcuts) {
      shortcuts.forEach(shortcut => {
        manager.register(shortcut);
      });
      setRegisteredShortcuts(shortcuts);
    }

    // Cleanup on unmount
    return () => {
      if (shortcuts) {
        shortcuts.forEach(shortcut => {
          manager.unregister(shortcut.id);
        });
      }
    };
  }, [shortcuts]);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    keyboardShortcutsUtils.register(shortcut);
    setRegisteredShortcuts(prev => [...prev, shortcut]);
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    keyboardShortcutsUtils.unregister(id);
    setRegisteredShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    registeredShortcuts,
    registerShortcut,
    unregisterShortcut,
    allShortcuts: keyboardShortcutsUtils.getShortcutsByCategory()
  };
}

/**
 * Hook for keyboard navigation within a container
 */
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    circular?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
  } = {}
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { handleKeyboardNavigation } = require('@/lib/accessibility/keyboardNavigation');
      handleKeyboardNavigation(event, container, options);
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, options]);
}

/**
 * Hook for managing reduced motion preferences
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for managing color scheme preferences
 */
export function useColorScheme() {
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setPrefersDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersDark;
}

/**
 * Hook for skip links functionality
 */
export function useSkipLinks() {
  const skipToContent = useCallback(() => {
    const mainContent = document.querySelector('main, [role="main"], #main-content');
    if (mainContent) {
      (mainContent as HTMLElement).focus();
      (mainContent as HTMLElement).scrollIntoView();
    }
  }, []);

  const skipToNavigation = useCallback(() => {
    const navigation = document.querySelector('nav, [role="navigation"], #navigation');
    if (navigation) {
      (navigation as HTMLElement).focus();
      (navigation as HTMLElement).scrollIntoView();
    }
  }, []);

  return {
    skipToContent,
    skipToNavigation
  };
}