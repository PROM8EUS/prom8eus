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
    task_category_accounting: "Buchhaltung",
    task_category_budgetingplanning: "Budgetplanung",
    task_category_collaboration: "Zusammenarbeit",
    task_category_salesnegotiation: "Verkauf/Verhandlung",
    task_category_problemsolving: "Problemlösung",
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
    coming_soon: "Demnächst verfügbar",
    
    // About page
    about_page_title: "Über PROM8EUS",
    about_mission_text: "Bei PROM8EUS bringen wir Klarheit in eine entscheidende Frage: Sollte eine Aufgabe von Menschen oder Maschinen erledigt werden? Wir glauben, dass Automatisierung nicht nur ein Schlagwort ist – sie ist eine strategische Notwendigkeit für Unternehmen, die mit Fachkräftemangel, steigenden Kosten und der Nachfrage nach Effizienz konfrontiert sind.",
    about_what_we_do: "Was wir tun",
    about_what_we_do_text: "PROM8EUS ist eine Plattform, auf der Unternehmen Stellenbeschreibungen oder Aufgaben einreichen können. Unser System analysiert den Inhalt und liefert einen PROM8EUS Score – eine einzige, transparente Kennzahl, die zeigt, wie automatisierbar eine Rolle oder Aufgabe wirklich ist. Diese Bewertung hilft Organisationen bei der Entscheidung, ob sie in Automatisierungs-Workflows investieren oder die richtigen Mitarbeiter einstellen sollten.",
    about_human_centered: "Menschenzentriert",
    about_human_centered_desc: "Geringes Automatisierungspotenzial",
    about_mixed: "Gemischt",
    about_mixed_desc: "Automatisierung und menschliche Arbeit im Gleichgewicht",
    about_high_potential: "Hohes Automatisierungspotenzial", 
    about_high_potential_desc: "Maschinen können die meisten Bereiche übernehmen",
    about_how_it_works: "Wie es funktioniert",
    about_input: "Eingabe",
    about_input_desc: "Laden Sie eine Stellenbeschreibung hoch oder fügen Sie eine URL ein. Unser Parser extrahiert Aufgaben, Anforderungen und Verantwortlichkeiten.",
    about_analysis: "Analyse", 
    about_analysis_desc: "Mithilfe von Natural Language Processing (NLP) und strukturierten Regeln wird jede Aufgabe aufgeschlüsselt und in Kategorien wie Datenverarbeitung, Kommunikation, Qualität & Sicherheit, Strategie klassifiziert.",
    about_scoring: "Bewertung",
    about_scoring_desc: "Jede Aufgabe wird auf ihr Automatisierungspotenzial hin bewertet. Routinemäßige, sich wiederholende Arbeiten erhalten hohe Punkte, während kreative, zwischenmenschliche oder urteilsbasierte Aufgaben niedrig bewertet werden.",
    about_results: "Ergebnisse",
    about_results_desc: "Aufgaben werden zum PROM8EUS Score aggregiert und in einem übersichtlichen Dashboard angezeigt. Sie sehen sofort, welche Teile automatisiert werden können – und welche noch menschliche Expertise erfordern.",
    about_why_prom8eus: "Warum PROM8EUS?",
    about_transparent: "Transparenz",
    about_transparent_desc: "Keine Schlagwörter, nur eine klare Zahl, die Ihnen genau sagt, was Sie wissen müssen.",
    about_actionable: "Umsetzbarkeit",
    about_actionable_desc: "Wir zeigen nicht nur Potenzial auf, wir bieten Automatisierungs-Blaupausen und Recruiting-Optionen.",
    about_balanced: "Hybrides Denken", 
    about_balanced_desc: "Wir wissen, dass die Zukunft der Arbeit nicht Menschen gegen Maschinen bedeutet, sondern Menschen und Maschinen, die zusammenarbeiten.",
    about_story_quote: "Wie Prometheus das Feuer zur Menschheit brachte, liefert PROM8EUS das moderne Feuer der Automatisierung.",
    about_story_vision: "Unsere Vision ist es, Unternehmen mit Klarheit zu stärken: Maschine oder Mensch – was ist die richtige Wahl für jede Aufgabe?",
    about_cta_title: "Bereit, Ihr Automatisierungspotenzial zu entdecken?",
    about_cta_button: "Analyse starten",
    about_cta_desc: "Erhalten Sie Ihren PROM8EUS Score und treffen Sie fundierte Entscheidungen über Ihre Belegschaft."
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
    task_category_accounting: "Accounting",
    task_category_budgetingplanning: "Budget Planning", 
    task_category_collaboration: "Collaboration",
    task_category_salesnegotiation: "Sales/Negotiation", 
    task_category_problemsolving: "Problem Solving",
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
    coming_soon: "Coming Soon",
    
    // About page
    about_page_title: "About PROM8EUS",
    about_mission_text: "We bring clarity to a crucial question: Should a task be handled by humans or machines?",
    about_what_we_do: "What We Do",
    about_what_we_do_text: "PROM8EUS analyzes job descriptions and delivers a clear score showing how automatable each task really is.",
    about_human_centered: "Human-centered",
    about_human_centered_desc: "Little automation potential",
    about_mixed: "Mixed",
    about_mixed_desc: "Balance of both",
    about_high_potential: "High potential",
    about_high_potential_desc: "Machines can handle most",
    about_how_it_works: "How It Works",
    about_input: "Input",
    about_input_desc: "Upload a job description or paste text",
    about_analysis: "Analysis",
    about_analysis_desc: "AI breaks down tasks and categories", 
    about_scoring: "Scoring",
    about_scoring_desc: "Each task gets an automation score",
    about_results: "Results",
    about_results_desc: "Clear dashboard with actionable insights",
    about_why_prom8eus: "Why PROM8EUS?",
    about_transparent: "Transparent",
    about_transparent_desc: "Clear numbers, no buzzwords",
    about_actionable: "Actionable",
    about_actionable_desc: "Practical recommendations",
    about_balanced: "Balanced",
    about_balanced_desc: "Humans and machines together",
    about_story_quote: "Like Prometheus brought fire to mankind, PROM8EUS delivers the modern fire of automation.",
    about_story_vision: "Machine or human – what's the right choice for each task?",
    about_cta_title: "Ready to get your score?",
    about_cta_button: "Start Analysis"
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