/**
 * Localization Dictionary
 * Simple i18n setup for German/English translations
 */

export type Lang = "de" | "en";

export const DICT: Record<Lang, Record<string, string>> = {
  de: {
    headline: "Automatisierungs­potenzial sofort erkennen",
    sub: "Fügen Sie Ihre Aufgabenbeschreibung oder Stellenanzeige ein – unsere KI zeigt Ihnen, welche Teile automatisierbar sind.",
    start: "Analyse starten",
    lang_switch: "EN",    // shows opposite language
    
    // Header
    about: "Über uns",
    contact: "Kontakt",
    
    // Landing page
    landing_automatable: "Automatisierbar",
    landing_human: "Mensch notwendig", 
    landing_automatable_desc: "Aufgaben können durch KI und Automatisierung übernommen werden",
    landing_human_desc: "Aufgaben erfordern menschliche Kreativität und Entscheidungsfindung",
    landing_ai_analysis: "KI-gestützte Analyse",
    landing_discover: "Entdecken Sie das Automatisierungspotenzial Ihrer Position",
    landing_desc: "Lassen Sie unsere KI Ihre Stellenbeschreibung oder Aufgabenliste analysieren und erfahren Sie, welche Tätigkeiten automatisiert werden können.",
    landing_start: "Eigene Analyse starten",
    landing_why_title: "Warum eine Automatisierungs-Analyse?",
    landing_precise: "Präzise Einschätzung",
    landing_precise_desc: "Erhalten Sie eine detaillierte Bewertung Ihrer Aufgaben",
    landing_efficiency: "Effizienz steigern", 
    landing_efficiency_desc: "Identifizieren Sie Potenziale für Prozessoptimierung",
    landing_future: "Zukunft gestalten",
    landing_future_desc: "Bereiten Sie sich auf die Arbeitswelt von morgen vor",
    
    // Task descriptions
    task_confidence: "Sicherheit",
    task_category_physical: "Körperlich",
    task_category_cognitive: "Kognitiv", 
    task_category_creative: "Kreativ",
    task_category_analytical: "Analytisch",
    task_category_administrative: "Administrativ",
    task_category_communication: "Kommunikation",
    task_category_technical: "Technisch",
    task_category_management: "Management",
    task_category_documentation: "Dokumentation",
    task_category_systems: "Systeme",
    task_category_interpersonal: "Zwischenmenschlich",
    task_category_dataprocessing: "Datenverarbeitung",
    task_category_routine: "Routine",
    task_category_leadership: "Führung",
    task_category_consultation: "Beratung",
    task_category_negotiation: "Verhandlung",
    task_category_complex: "Komplex",
    task_category_automatisierbar: "Automatisierbar",
    task_category_mensch: "Mensch erfordert",
    task_category_allgemein: "Allgemein",
    
    // History
    history_title: "Frühere Analysen",
    history_subtitle: "Klicken Sie auf eine Analyse, um sie erneut anzuzeigen",
    history_today: "Heute",
    history_yesterday: "Gestern", 
    history_tasks: "Aufgaben",
    history_delete: "Analyse löschen",
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
    analysis_error: "Ein unbekannter Fehler ist bei der Analyse aufgetreten",
    
    // Results page
    back: "Zurück",
    your_analysis: "Ihre Automatisierungs-Analyse",
    detailed_evaluation: "Detaillierte Auswertung Ihrer Aufgabenbeschreibung",
    share_landing: "Analyse teilen",
    learn_workflows: "Mehr über Workflows erfahren",
    coming_soon: "Demnächst verfügbar"
  },
  en: {
    headline: "See your automation potential instantly", 
    sub: "Paste a task description or job posting — our AI highlights which parts are automatable.",
    start: "Start analysis",
    lang_switch: "DE",    // shows opposite language
    
    // Header
    about: "About us",
    contact: "Contact",
    
    // Landing page
    landing_automatable: "Automatable",
    landing_human: "Human Required", 
    landing_automatable_desc: "Tasks can be handled by AI and automation",
    landing_human_desc: "Tasks require human creativity and decision-making",
    landing_ai_analysis: "AI-powered Analysis",
    landing_discover: "Discover Your Position's Automation Potential",
    landing_desc: "Let our AI analyze your job description or task list and learn which activities can be automated.",
    landing_start: "Start Your Own Analysis",
    landing_why_title: "Why an Automation Analysis?",
    landing_precise: "Precise Assessment",
    landing_precise_desc: "Get a detailed evaluation of your tasks",
    landing_efficiency: "Increase Efficiency", 
    landing_efficiency_desc: "Identify opportunities for process optimization",
    landing_future: "Shape the Future",
    landing_future_desc: "Prepare for tomorrow's work environment",
    
    // Task descriptions  
    task_confidence: "Confidence",
    task_category_physical: "Physical",
    task_category_cognitive: "Cognitive",
    task_category_creative: "Creative", 
    task_category_analytical: "Analytical",
    task_category_administrative: "Administrative",
    task_category_communication: "Communication",
    task_category_technical: "Technical",
    task_category_management: "Management",
    task_category_documentation: "Documentation",
    task_category_systems: "Systems",
    task_category_interpersonal: "Interpersonal",
    task_category_dataprocessing: "Data Processing",
    task_category_routine: "Routine",
    task_category_leadership: "Leadership",
    task_category_consultation: "Consultation",
    task_category_negotiation: "Negotiation",
    task_category_complex: "Complex",
    task_category_automatisierbar: "Automatable",
    task_category_mensch: "Human Required",
    task_category_allgemein: "General",
    
    // History
    history_title: "Previous Analyses",
    history_subtitle: "Click on an analysis to view it again",
    history_today: "Today",
    history_yesterday: "Yesterday",
    history_tasks: "tasks",
    history_delete: "Delete analysis",
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
    analysis_error: "An unknown error occurred during analysis",
    
    // Results page
    back: "Back",
    your_analysis: "Your Automation Analysis",
    detailed_evaluation: "Detailed evaluation of your task description",
    share_landing: "Share Analysis", 
    learn_workflows: "Learn More About Workflows",
    coming_soon: "Coming Soon"
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