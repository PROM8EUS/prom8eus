/**
 * Localization Dictionary
 * Simple i18n setup for German/English translations
 */

export type Lang = "de" | "en";

export const DICT: Record<Lang, Record<string, string>> = {
  de: {
    headline: "Automatisierungspotenzial sofort erkennen",
    sub: "Fügen Sie Ihre Aufgabenbeschreibung oder Stellenanzeige ein – unsere KI zeigt Ihnen, welche Teile automatisierbar sind.",
    start: "Analyse starten",
    lang_switch: "EN"    // shows opposite language
  },
  en: {
    headline: "See your automation potential instantly", 
    sub: "Paste a task description or job posting — our AI highlights which parts are automatable.",
    start: "Start analysis",
    lang_switch: "DE"    // shows opposite language
  }
};

/**
 * Helper function to get translation
 */
export function t(lang: Lang, key: string): string {
  return DICT[lang]?.[key] || key;
}

/**
 * Helper function to get opposite language
 */
export function getOppositeLanguage(lang: Lang): Lang {
  return lang === "de" ? "en" : "de";
}

/**
 * Default language
 */
export const DEFAULT_LANG: Lang = "en";