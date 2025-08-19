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
    lang_switch: "EN",    // shows opposite language
    
    // Header
    about: "Über uns",
    contact: "Kontakt",
    
    // Footer
    copyright: "Alle Rechte vorbehalten.",
    
    // MainContent
    placeholder: "URL oder Aufgabenbeschreibung hier einfügen …",
    url_detected: "URL erkannt",
    url_detected_hint: "URL erkannt – der Inhalt wird automatisch analysiert.",
    ai_hint: "KI-gestützte Analyse für klare Einblicke in Ihre Aufgaben.",
    show_debug: "Rohtext anzeigen (Debug)",
    tip: "Tipp:",
    
    // LoadingPage
    analysis_creating: "Ihre Analyse wird erstellt",
    please_wait: "Bitte warten",
    ai_analyzing: "Unsere KI analysiert Ihren Text und erstellt eine detaillierte Auswertung",
    
    // Contact page
    contact_title: "Kontakt",
    contact_subtitle: "Nehmen Sie Kontakt mit uns auf",
    address: "Adresse",
    phone: "Telefon",
    email: "E-Mail",
    city: "Köln",
    country: "Deutschland",
    phone_number: "0221 2592 7541",
    
    // Legal
    legal_notice: "Impressum",
    legal_title: "Impressum",
    
    // Error messages
    page_not_readable: "Die Seite konnte nicht automatisch gelesen werden",
    paste_manually: "Bitte fügen Sie den Stellentext manuell ein oder prüfen Sie den Debug-Modus.",
    paste_text_tip: "Kopieren Sie den Stellentext manuell von der Website und fügen Sie ihn direkt hier ein.",
    connection_error: "Verbindungsfehler: Die Analyse konnte nicht durchgeführt werden",
    analysis_error: "Ein unbekannter Fehler ist bei der Analyse aufgetreten"
  },
  en: {
    headline: "See your automation potential instantly", 
    sub: "Paste a task description or job posting — our AI highlights which parts are automatable.",
    start: "Start analysis",
    lang_switch: "DE",    // shows opposite language
    
    // Header
    about: "About us",
    contact: "Contact",
    
    // Footer
    copyright: "All rights reserved.",
    
    // MainContent
    placeholder: "Paste URL or task description here …",
    url_detected: "URL detected",
    url_detected_hint: "URL detected – content will be analyzed automatically.",
    ai_hint: "AI-powered analysis for clear insights into your tasks.",
    show_debug: "Show raw text (Debug)",
    tip: "Tip:",
    
    // LoadingPage
    analysis_creating: "Creating your analysis",
    please_wait: "Please wait",
    ai_analyzing: "Our AI is analyzing your text and creating a detailed evaluation",
    
    // Contact page
    contact_title: "Contact",
    contact_subtitle: "Get in touch with us",
    address: "Address",
    phone: "Phone",
    email: "Email",
    city: "Cologne",
    country: "Germany",
    phone_number: "+49 221 2592 7541",
    
    // Legal
    legal_notice: "Legal notice",
    legal_title: "Legal Notice",
    
    // Error messages
    page_not_readable: "The page could not be read automatically",
    paste_manually: "Please paste the job text manually or check debug mode.",
    paste_text_tip: "Copy the job text manually from the website and paste it directly here.",
    connection_error: "Connection error: Analysis could not be performed",
    analysis_error: "An unknown error occurred during analysis"
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