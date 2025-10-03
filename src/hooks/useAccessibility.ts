/**
 * Accessibility Hook
 * Provides accessibility utilities and WCAG 2.1 AA+ compliance helpers
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface AccessibilityOptions {
  announceChanges?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
  screenReaderSupport?: boolean;
}

interface FocusTrapOptions {
  initialFocus?: HTMLElement | null;
  returnFocus?: boolean;
  preventScroll?: boolean;
}

export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    announceChanges = true,
    focusManagement = true,
    keyboardNavigation = true,
    screenReaderSupport = true
  } = options;

  const announcerRef = useRef<HTMLElement | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Create live region for announcements
  useEffect(() => {
    if (announceChanges && !announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
        announcerRef.current = null;
      }
    };
  }, [announceChanges]);

  // Announce changes to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current && screenReaderSupport) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, 1000);
    }
  }, [screenReaderSupport]);

  // Focus management
  const focusElement = useCallback((element: HTMLElement | null, options: FocusOptions = {}) => {
    if (element && focusManagement) {
      element.focus(options);
    }
  }, [focusManagement]);

  const trapFocus = useCallback((container: HTMLElement, options: FocusTrapOptions = {}) => {
    if (!keyboardNavigation) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus initial element
    if (options.initialFocus) {
      options.initialFocus.focus();
    } else if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      
      if (options.returnFocus && document.activeElement) {
        (document.activeElement as HTMLElement).focus();
      }
    };
  }, [keyboardNavigation]);

  // Keyboard navigation helpers
  const handleArrowKeys = useCallback((
    event: KeyboardEvent,
    items: HTMLElement[],
    orientation: 'horizontal' | 'vertical' = 'horizontal'
  ) => {
    if (!keyboardNavigation) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    const isHorizontal = orientation === 'horizontal';

    switch (event.key) {
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    items[nextIndex]?.focus();
  }, [keyboardNavigation]);

  // ARIA helpers
  const setAriaExpanded = useCallback((element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', expanded.toString());
  }, []);

  const setAriaSelected = useCallback((element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', selected.toString());
  }, []);

  const setAriaPressed = useCallback((element: HTMLElement, pressed: boolean) => {
    element.setAttribute('aria-pressed', pressed.toString());
  }, []);

  const setAriaHidden = useCallback((element: HTMLElement, hidden: boolean) => {
    element.setAttribute('aria-hidden', hidden.toString());
  }, []);

  // Color contrast helpers
  const getContrastRatio = useCallback((color1: string, color2: string): number => {
    const getLuminance = (color: string): number => {
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;
      
      const [r, g, b] = rgb.map(c => {
        const val = parseInt(c) / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }, []);

  const isAccessibleContrast = useCallback((color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }, [getContrastRatio]);

  return {
    // State
    isReducedMotion,
    
    // Announcements
    announce,
    
    // Focus management
    focusElement,
    trapFocus,
    
    // Keyboard navigation
    handleArrowKeys,
    
    // ARIA helpers
    setAriaExpanded,
    setAriaSelected,
    setAriaPressed,
    setAriaHidden,
    
    // Color contrast
    getContrastRatio,
    isAccessibleContrast
  };
}

// Hook for managing focus within a component
export function useFocusManagement() {
  const focusHistoryRef = useRef<HTMLElement[]>([]);
  const containerRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      focusHistoryRef.current.push(document.activeElement);
    }
  }, []);

  const restoreFocus = useCallback(() => {
    const lastFocused = focusHistoryRef.current.pop();
    if (lastFocused) {
      lastFocused.focus();
    }
  }, []);

  const setContainer = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      const focusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      focusable?.focus();
    }
  }, []);

  const focusLast = useCallback(() => {
    if (containerRef.current) {
      const focusable = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const last = focusable[focusable.length - 1] as HTMLElement;
      last?.focus();
    }
  }, []);

  return {
    saveFocus,
    restoreFocus,
    setContainer,
    focusFirst,
    focusLast
  };
}

// Hook for keyboard shortcuts
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: {
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    preventDefault?: boolean;
  } = {}
) {
  const {
    ctrlKey = false,
    altKey = false,
    shiftKey = false,
    metaKey = false,
    preventDefault = true
  } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === key &&
        event.ctrlKey === ctrlKey &&
        event.altKey === altKey &&
        event.shiftKey === shiftKey &&
        event.metaKey === metaKey
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrlKey, altKey, shiftKey, metaKey, preventDefault]);
}
