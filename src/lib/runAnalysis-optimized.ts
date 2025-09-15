/**
 * Optimized Analysis Engine
 * Integriert alle Token-Sparstrategien für maximale Effizienz
 */

import { optimizedOpenAIClient } from './openai-optimized';
import { CachedOpenAIClient } from './openai-cache';
import { batchOpenAIClient } from './openai-batch';
import { Task, AnalysisResult } from './runAnalysis';

// Erstelle einen gecachten Client
const cachedClient = new CachedOpenAIClient(optimizedOpenAIClient);

/**
 * OPTIMIERTE: Token-effiziente Analyse
 * Kombiniert Caching, Batch-Processing und kürzere Prompts
 */
export async function runOptimizedAnalysis(
  jobText: string, 
  lang: 'de' | 'en' = 'de'
): Promise<AnalysisResult> {
  console.log('🚀 Starting optimized analysis with token savings...');
  
  try {
    // Schritt 1: Job-Analyse mit Cache
    console.log('📊 Analyzing job description...');
    const jobAnalysis = await cachedClient.analyzeJobDescription(jobText, lang);
    
    if (!jobAnalysis.tasks || jobAnalysis.tasks.length === 0) {
      throw new Error('No tasks extracted from job description');
    }

    // Schritt 2: Batch-Verarbeitung für Task-Analyse
    console.log('🔍 Analyzing tasks in batch...');
    const taskTexts = jobAnalysis.tasks.map(task => task.text);
    const batchResults = await batchOpenAIClient.analyzeTasksBatch(
      taskTexts, 
      jobText, 
      lang
    );

    // Schritt 3: Kombiniere Ergebnisse
    const tasks: Task[] = jobAnalysis.tasks.map((jobTask, index) => {
      const batchResult = batchResults[index];
      return {
        text: jobTask.text,
        score: batchResult?.score || jobTask.automationPotential,
        label: mapLabel(batchResult?.label || 'Mensch', lang),
        signals: [jobTask.reasoning],
        category: jobTask.category,
        confidence: batchResult?.confidence || 0.8,
        automationRatio: batchResult?.score || jobTask.automationPotential,
        humanRatio: 100 - (batchResult?.score || jobTask.automationPotential),
        complexity: determineComplexity(batchResult?.score || jobTask.automationPotential),
        automationTrend: 'increasing' as const
      };
    });

    // Schritt 4: Berechne Gesamtscore
    const totalScore = tasks.reduce((sum, task) => sum + task.score, 0) / tasks.length;
    
    // Schritt 5: Berechne Verhältnisse
    const automatisierbarCount = tasks.filter(t => t.score >= 70).length;
    const menschCount = tasks.filter(t => t.score < 30).length;
    
    const ratio = {
      automatisierbar: Math.round((automatisierbarCount / tasks.length) * 100),
      mensch: Math.round((menschCount / tasks.length) * 100)
    };

    // Schritt 6: Generiere Empfehlungen (nur für hochautomatisierbare Tasks)
    const highAutomationTasks = tasks.filter(t => t.score >= 70);
    const recommendations = await generateRecommendations(highAutomationTasks, lang);

    console.log(`✅ Optimized analysis completed. Tasks: ${tasks.length}, Score: ${totalScore.toFixed(1)}`);

    return {
      totalScore: Math.round(totalScore),
      ratio,
      tasks,
      summary: jobAnalysis.summary,
      recommendations,
      originalText: jobText
    };

  } catch (error) {
    console.error('Optimized analysis failed:', error);
    throw error;
  }
}

/**
 * Generiert Empfehlungen nur für hochautomatisierbare Tasks
 * Token-Einsparung: Nur relevante Tasks werden verarbeitet
 */
async function generateRecommendations(
  highAutomationTasks: Task[], 
  lang: 'de' | 'en' = 'de'
): Promise<string[]> {
  if (highAutomationTasks.length === 0) {
    return lang === 'de' 
      ? ['Fokus auf menschliche Expertise und Kreativität']
      : ['Focus on human expertise and creativity'];
  }

  try {
    // Batch-Verarbeitung für Empfehlungen
    const taskTexts = highAutomationTasks.map(t => t.text);
    const batchResults = await batchOpenAIClient.generateSubtasksBatch(taskTexts, lang);
    
    const recommendations: string[] = [];
    
    batchResults.forEach((result, index) => {
      if (result.subtasks.length > 0) {
        const topSubtask = result.subtasks[0];
        recommendations.push(
          lang === 'de'
            ? `Automatisiere "${result.mainTask}": ${topSubtask.title} (${topSubtask.automationPotential}% automatisierbar)`
            : `Automate "${result.mainTask}": ${topSubtask.title} (${topSubtask.automationPotential}% automatable)`
        );
      }
    });

    return recommendations.slice(0, 5); // Begrenze auf 5 Empfehlungen
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    return lang === 'de' 
      ? ['Automatisierungspotenzial identifiziert - detaillierte Analyse empfohlen']
      : ['Automation potential identified - detailed analysis recommended'];
  }
}

/**
 * Mappt Labels zwischen Sprachen
 */
function mapLabel(label: string, lang: 'de' | 'en'): "Automatisierbar" | "Teilweise Automatisierbar" | "Mensch" {
  if (lang === 'de') {
    switch (label.toLowerCase()) {
      case 'automatisierbar':
      case 'automatable':
        return 'Automatisierbar';
      case 'teilweise automatisierbar':
      case 'partially automatable':
        return 'Teilweise Automatisierbar';
      default:
        return 'Mensch';
    }
  } else {
    switch (label.toLowerCase()) {
      case 'automatisierbar':
      case 'automatable':
        return 'Automatisierbar';
      case 'teilweise automatisierbar':
      case 'partially automatable':
        return 'Teilweise Automatisierbar';
      default:
        return 'Mensch';
    }
  }
}

/**
 * Bestimmt Komplexität basierend auf Score
 */
function determineComplexity(score: number): 'low' | 'medium' | 'high' {
  if (score >= 80) return 'low';
  if (score >= 50) return 'medium';
  return 'high';
}

/**
 * Token-Statistiken anzeigen
 */
export function getTokenStats(): { 
  cacheHits: number; 
  estimatedTokensSaved: number; 
  costSavings: number 
} {
  // TODO: Implementiere echte Statistiken
  return {
    cacheHits: 0,
    estimatedTokensSaved: 0,
    costSavings: 0
  };
}
