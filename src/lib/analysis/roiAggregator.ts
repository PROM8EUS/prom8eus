import { Task } from './taskClassifier';

export interface AnalysisResult {
  totalScore: number;
  ratio: {
    automatisierbar: number;
    mensch: number;
  };
  tasks: Task[];
  summary: string;
  recommendations: string[];
  originalText?: string;
}

/**
 * ROI Aggregator Service
 * Handles aggregation of analysis results, summary generation, and recommendations
 */
export class ROIAggregator {
  /**
   * Aggregate analysis results
   */
  aggregateResults(tasks: Task[], originalText: string): AnalysisResult {
    console.log('🔄 Aggregating analysis results...');
    
    // Calculate aggregated scores - make them consistent
    const totalTasks = tasks.length;
    const automatisierbareCount = tasks.filter(t => t.label === "Automatisierbar").length;
    const teilweiseCount = tasks.filter(t => t.label === "Teilweise Automatisierbar").length;
    const menschCount = tasks.filter(t => t.label === "Mensch").length;

    // Calculate the overall automation potential based on task scores (weighted average)
    const weightedScore = totalTasks > 0 ? tasks.reduce((sum, task) => sum + task.score, 0) / totalTasks : 0;
    
    // The ratio should reflect the overall automation potential, not just task counts
    const overallAutomationPotential = Math.round(weightedScore);
    
    // Berechne das tatsächliche Automatisierungspotenzial basierend auf den Task-Scores
    const totalAutomationScore = tasks.reduce((sum, task) => sum + task.score, 0);
    const maxPossibleScore = totalTasks * 100;
    const actualAutomationPotential = totalTasks > 0 ? Math.round((totalAutomationScore / maxPossibleScore) * 100) : 0;
    
    const ratio = {
      automatisierbar: actualAutomationPotential,
      mensch: 100 - actualAutomationPotential
    };
    
    // Ensure ratio values are valid numbers
    if (isNaN(ratio.automatisierbar)) ratio.automatisierbar = 0;
    if (isNaN(ratio.mensch)) ratio.mensch = 0;

    // Generate summary and recommendations
    const summary = this.generateSummary(overallAutomationPotential, totalTasks);
    const recommendations = this.generateRecommendations(tasks, overallAutomationPotential);

    console.log('✅ Enhanced analysis completed with', tasks.length, 'tasks');
    console.log('🔍 [ROIAggregator] Final tasks with subtasks:', tasks.map(t => ({
      text: t.text,
      subtasks: t.subtasks?.length || 0
    })));

    return {
      totalScore: overallAutomationPotential,
      ratio,
      tasks,
      summary,
      recommendations,
      originalText // Store original text for job title extraction
    };
  }

  /**
   * Generate summary
   */
  generateSummary(totalScore: number, taskCount: number, lang: 'de' | 'en' = 'de'): string {
    // Handle edge case of no tasks found
    if (taskCount === 0) {
      if (lang === 'en') {
        return 'No specific tasks could be identified in the provided text. Please provide a more detailed job description or task list for analysis.';
      } else {
        return 'Es konnten keine spezifischen Aufgaben im bereitgestellten Text identifiziert werden. Bitte geben Sie eine detailliertere Stellenbeschreibung oder Aufgabenliste für die Analyse an.';
      }
    }
    
    let summary: string;
    if (lang === 'en') {
      const scoreCategory = totalScore >= 75 ? 'high' : totalScore >= 50 ? 'medium' : 'low';
      summary = `Analysis of ${taskCount} identified tasks revealed ${scoreCategory} automation potential of ${totalScore}%.`;
    } else {
      const scoreCategory = totalScore >= 75 ? 'hoch' : totalScore >= 50 ? 'mittel' : 'niedrig';
      summary = `Analyse mit ${totalScore}% Automatisierungspotenzial für ${taskCount} Aufgaben`;
    }
    
    return summary;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(tasks: Task[], overallScore: number): string[] {
    const recommendations: string[] = [];
    
    // Branchenerkennung basierend auf den Aufgaben
    const industries = tasks.map(t => t.industry).filter(Boolean);
    const primaryIndustry = industries.length > 0 ? 
      industries.sort((a, b) => 
        industries.filter(v => v === a).length - 
        industries.filter(v => v === b).length
      ).pop() : 'general';

    // Sammle alle empfohlenen AI-Tools
    const allRecommendedTools = tasks
      .flatMap(t => t.aiTools || [])
      .filter((tool, index, arr) => arr.indexOf(tool) === index); // Deduplizieren

    // Allgemeine Empfehlungen basierend auf Score
    if (overallScore >= 70) {
      recommendations.push("Hohes Automatisierungspotenzial! Fokus auf AI-Tools und Workflow-Automatisierung.");
    } else if (overallScore >= 40) {
      recommendations.push("Mittleres Automatisierungspotenzial. Kombinieren Sie AI-Tools mit menschlicher Expertise.");
    } else {
      recommendations.push("Niedriges Automatisierungspotenzial. Fokus auf menschliche Fähigkeiten und AI-Unterstützung.");
    }

    // Branchenspezifische Empfehlungen
    const industryRecommendations = {
      tech: [
        "Implementieren Sie GitHub Copilot für Code-Vervollständigung",
        "Nutzen Sie Claude für Code-Reviews und Sicherheitsanalysen",
        "Verwenden Sie ChatGPT für Dokumentation und Debugging-Hilfe",
        "Integrieren Sie CI/CD-Pipelines mit AI-gestützter Qualitätskontrolle"
      ],
      healthcare: [
        "Etablieren Sie Notion AI für Patientendaten-Management",
        "Nutzen Sie Claude für klinische Entscheidungsunterstützung",
        "Implementieren Sie Microsoft Copilot für medizinische Berichte",
        "Verwenden Sie Perplexity für medizinische Recherche"
      ],
      finance: [
        "Integrieren Sie Excel AI für automatische Datenverarbeitung",
        "Nutzen Sie Power BI AI für Finanzdashboards",
        "Implementieren Sie Claude für Risikoanalysen",
        "Verwenden Sie Airtable AI für Workflow-Automatisierung"
      ],
      marketing: [
        "Etablieren Sie Jasper für Content-Erstellung",
        "Nutzen Sie Copy.ai für Conversion-optimierte Texte",
        "Implementieren Sie Canva AI für Visual Content",
        "Verwenden Sie Claude für Marktanalysen"
      ],
      hr: [
        "Integrieren Sie Notion AI für HR-Dokumentation",
        "Nutzen Sie Airtable AI für Bewerber-Management",
        "Implementieren Sie ChatGPT für Recruiting-Unterstützung",
        "Verwenden Sie Microsoft Copilot für Office-Aufgaben"
      ],
      production: [
        "Etablieren Sie Excel AI für Produktionsdaten",
        "Nutzen Sie Power BI AI für Performance-Monitoring",
        "Implementieren Sie Airtable AI für Lagerverwaltung",
        "Verwenden Sie Claude für Prozessoptimierung"
      ],
      education: [
        "Integrieren Sie Notion AI für Kurs-Management",
        "Nutzen Sie Obsidian AI für Forschungsnotizen",
        "Implementieren Sie ChatGPT für Unterrichtsvorbereitung",
        "Verwenden Sie Perplexity für Literaturrecherche"
      ],
      legal: [
        "Etablieren Sie Notion AI für Fall-Management",
        "Nutzen Sie Claude für Rechtsanalysen",
        "Implementieren Sie Perplexity für Rechtsrecherche",
        "Verwenden Sie ChatGPT für Vertragsentwürfe"
      ],
      general: [
        "Starten Sie mit ChatGPT für allgemeine Aufgaben",
        "Nutzen Sie Claude für detaillierte Analysen",
        "Implementieren Sie Microsoft Copilot für Office-Integration",
        "Verwenden Sie Notion AI für Dokumentation"
      ]
    };

    // Füge branchenspezifische Empfehlungen hinzu
    const industryRecs = industryRecommendations[primaryIndustry as keyof typeof industryRecommendations] || industryRecommendations.general;
    recommendations.push(...industryRecs.slice(0, 3));

    // AI-Tool-spezifische Empfehlungen
    if (allRecommendedTools.length > 0) {
      const topTools = allRecommendedTools.slice(0, 3);
      recommendations.push(`Empfohlene AI-Tools: ${topTools.join(', ')}`);
    }

    // Moderne Automatisierungstrends
    recommendations.push("Implementieren Sie schrittweise Automatisierung mit kontinuierlicher Evaluation");
    recommendations.push("Kombinieren Sie AI-Tools mit menschlicher Expertise für optimale Ergebnisse");
    recommendations.push("Fokussieren Sie sich auf repetitive, strukturierte Aufgaben für maximale Effizienz");

    return recommendations.slice(0, 8); // Begrenzen auf 8 Empfehlungen
  }
}
