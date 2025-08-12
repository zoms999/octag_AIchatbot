'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { FontSizeManager, FontSizeLevel, keyboardShortcutsUtils } from '@/lib/accessibility';

interface AccessibilityContextType {
  fontSize: FontSizeLevel;
  setFontSize: (level: FontSizeLevel) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  prefersReducedMotion: boolean;
  keyboardShortcutsEnabled: boolean;
  setKeyboardShortcutsEnabled: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [fontSize, setFontSizeState] = useState<FontSizeLevel>('normal');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabledState] = useState(true);

  const fontSizeManager = FontSizeManager.getInstance();

  useEffect(() => {
    // Initialize font size
    setFontSizeState(fontSizeManager.getCurrentLevel());

    // Initialize high contrast
    setIsHighContrast(document.documentElement.classList.contains('high-contrast'));

    // Initialize reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(reducedMotionQuery.matches);

    // Initialize keyboard shortcuts
    keyboardShortcutsUtils.initialize();

    // Event listeners
    const handleFontSizeChange = (event: CustomEvent) => {
      setFontSizeState(event.detail.level);
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    const handleToggleHighContrast = () => {
      setIsHighContrast(document.documentElement.classList.contains('high-contrast'));
    };

    const handleIncreaseFontSize = () => {
      fontSizeManager.increaseFontSize();
    };

    const handleDecreaseFontSize = () => {
      fontSizeManager.decreaseFontSize();
    };

    const handleResetFontSize = () => {
      fontSizeManager.resetFontSize();
    };

    // Add event listeners
    window.addEventListener('fontSizeChanged', handleFontSizeChange as EventListener);
    window.addEventListener('toggleHighContrast', handleToggleHighContrast);
    window.addEventListener('increaseFontSize', handleIncreaseFontSize);
    window.addEventListener('decreaseFontSize', handleDecreaseFontSize);
    window.addEventListener('resetFontSize', handleResetFontSize);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      window.removeEventListener('fontSizeChanged', handleFontSizeChange as EventListener);
      window.removeEventListener('toggleHighContrast', handleToggleHighContrast);
      window.removeEventListener('increaseFontSize', handleIncreaseFontSize);
      window.removeEventListener('decreaseFontSize', handleDecreaseFontSize);
      window.removeEventListener('resetFontSize', handleResetFontSize);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, [fontSizeManager]);

  const setFontSize = (level: FontSizeLevel) => {
    fontSizeManager.setFontSize(level);
  };

  const increaseFontSize = () => {
    fontSizeManager.increaseFontSize();
  };

  const decreaseFontSize = () => {
    fontSizeManager.decreaseFontSize();
  };

  const resetFontSize = () => {
    fontSizeManager.resetFontSize();
  };

  const toggleHighContrast = () => {
    const { highContrastUtils } = require('@/lib/accessibility');
    highContrastUtils.toggleHighContrast();
    setIsHighContrast(document.documentElement.classList.contains('high-contrast'));
  };

  const setKeyboardShortcutsEnabled = (enabled: boolean) => {
    setKeyboardShortcutsEnabledState(enabled);
    keyboardShortcutsUtils.getManager().setEnabled(enabled);
  };

  const value: AccessibilityContextType = {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    isHighContrast,
    toggleHighContrast,
    prefersReducedMotion,
    keyboardShortcutsEnabled,
    setKeyboardShortcutsEnabled
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}