/**
 * i18n Utilities
 * Language resolution and translation helpers
 */

import { DICT, type Lang } from './dict';

/**
 * Resolve language from URL search parameters
 * Checks for "lang" parameter and defaults to "de"
 */
export function resolveLang(param?: string): "de" | "en" {
  // If param is provided directly, validate it
  if (param) {
    return param === "en" ? "en" : "de";
  }

  // Check URL search parameters in browser environment
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    const langParam = searchParams.get('lang');
    return langParam === "en" ? "en" : "de";
  }

  // Default to German
  return "de";
}

/**
 * Get translation for given language and key
 * Returns the key itself if translation is not found
 */
export function t(lang: "de" | "en", key: string): string {
  return DICT[lang]?.[key] || key;
}

/**
 * Helper function to translate task categories
 */
export function translateCategory(lang: Lang, category?: string): string {
  if (!category) {
    return t(lang, 'task_category_general');
  }
  const categoryKey = `task_category_${category.toLowerCase()}`;
  return t(lang, categoryKey);
}