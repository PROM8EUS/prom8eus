import { openaiClient, isOpenAIAvailable } from '../openai';
import { FastAnalysisResult } from '../types';

/**
 * Job Parser Service
 * Handles parsing and initial analysis of job descriptions
 */
export class JobParser {
  /**
   * Parse job description and extract main tasks
   */
  async parseJobDescription(jobText: string, lang: 'de' | 'en' = 'de'): Promise<FastAnalysisResult[]> {
    console.log('🤖 Starting job parsing...');
    
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API nicht konfiguriert. Bitte API-Key in .env hinterlegen.');
    }

    try {
      console.log('🚀 Starting complete AI analysis...');
      const completeAnalysis = await openaiClient.analyzeJobDescription(jobText, lang);
      
      // DEBUG: Log the complete AI response
      console.log('🔍 [DEBUG] Complete AI analysis response:', JSON.stringify(completeAnalysis, null, 2));
      
      if (!completeAnalysis.tasks || completeAnalysis.tasks.length === 0) {
        throw new Error('AI-Analyse fehlgeschlagen - keine Aufgaben extrahiert');
      }
      
      console.log('✅ Tasks extracted and analyzed:', completeAnalysis.tasks.length, 'tasks');
      const mainTasks = completeAnalysis.tasks;
      
      // Convert AI results to FastAnalysisResult format
      const results: FastAnalysisResult[] = [];
      
      for (let i = 0; i < mainTasks.length; i++) {
        const task = mainTasks[i];
        const taskText = typeof task === 'string' ? task : task.text;
        console.log(`📋 Processing main task ${i + 1}/${mainTasks.length}: ${taskText.slice(0, 50)}...`);
        
        // Generate varied complexity and trend based on task content
        const taskTextLower = taskText.toLowerCase();
        let complexity: 'low' | 'medium' | 'high';
        let automationTrend: 'increasing' | 'stable' | 'decreasing';
        let category = 'Allgemein';
        
        // Determine complexity based on task content
        if (taskTextLower.includes('debugging') || taskTextLower.includes('fehlerbehebung') || 
            taskTextLower.includes('integration') || taskTextLower.includes('optimierung') ||
            taskTextLower.includes('entwicklung') || taskTextLower.includes('programmierung')) {
          complexity = 'high';
        } else if (taskTextLower.includes('dokumentation') || taskTextLower.includes('testing') || 
                   taskTextLower.includes('review') || taskTextLower.includes('code-review')) {
          complexity = 'medium';
        } else if (completeAnalysis?.businessCase?.automationPotential >= 85) {
          complexity = 'low';
        } else if (completeAnalysis?.businessCase?.automationPotential >= 60) {
          complexity = 'medium';
        } else {
          complexity = 'high';
        }
        
        // Determine trend based on task type
        if (taskTextLower.includes('ai') || taskTextLower.includes('automatisierung') || 
            taskTextLower.includes('workflow') || taskTextLower.includes('machine learning')) {
          automationTrend = 'increasing';
        } else if (taskTextLower.includes('debugging') || taskTextLower.includes('fehlerbehebung') ||
                   taskTextLower.includes('support') || taskTextLower.includes('wartung') ||
                   taskTextLower.includes('pflege')) {
          automationTrend = 'stable';
        } else {
          automationTrend = 'increasing';
        }
        
        // Determine proper category based on job context and task content
        category = this.detectTaskCategory(taskText, jobText);
        
        // Convert to FastAnalysisResult format with PRE-GENERATED data
        const result: FastAnalysisResult = {
          text: taskText,
          automationPotential: task.automationPotential || 50,
          confidence: 90, // High confidence for single AI call
          category: task.category || category,
          pattern: 'ai-single-call-preloaded',
          reasoning: task.reasoning || 'Single AI call analysis completed',
          subtasks: task.subtasks || [], // Pre-generate subtasks
          solutions: { workflows: [], agents: [] }, // Skip solutions for speed
          businessCase: task.businessCase || null, // Pre-generate business case
          complexity: complexity,
          trend: automationTrend
        };
        
        results.push(result);
        console.log(`✅ Main task ${i + 1} completed (batch processed)`);
      }
      
      console.log(`🚀 ALL ${mainTasks.length} tasks analyzed in ONE AI call!`);
      console.log(`✅ Complete job analysis finished: ${results.length} main tasks processed`);
      return results;
      
    } catch (error) {
      console.error(`❌ Failed to analyze tasks in batch:`, error);
      
      // Fallback: create basic results for all tasks
      const fallbackResults: FastAnalysisResult[] = [];
      const mainTasks = [jobText]; // Use job text as single task
      for (let i = 0; i < mainTasks.length; i++) {
        const taskText = mainTasks[i];
        const fallbackResult: FastAnalysisResult = {
          text: taskText,
          automationPotential: 50,
          confidence: 30,
          category: 'general',
          pattern: 'fallback',
          reasoning: 'Fallback analysis due to AI error',
          subtasks: [],
          solutions: { workflows: [], agents: [] },
          businessCase: null,
          complexity: 'medium',
          trend: 'stable'
        };
        fallbackResults.push(fallbackResult);
      }
      
      console.log(`✅ Fallback analysis finished: ${fallbackResults.length} main tasks processed`);
      return fallbackResults;
    }
  }

  /**
   * Detect task category based on job context and task content
   */
  private detectTaskCategory(taskText: string, jobText: string): string {
    const taskTextLower = taskText.toLowerCase();
    const jobTextLower = jobText.toLowerCase();
    
    // HR/Management tasks
    if (jobTextLower.includes('hr') || jobTextLower.includes('personal') || jobTextLower.includes('manager')) {
      if (taskTextLower.includes('personal') || taskTextLower.includes('recruiting') || taskTextLower.includes('mitarbeiter')) {
        return 'Personalwesen';
      } else if (taskTextLower.includes('gehalt') || taskTextLower.includes('abrechnung') || taskTextLower.includes('benefits')) {
        return 'Verwaltung';
      } else if (taskTextLower.includes('führung') || taskTextLower.includes('gespräch') || taskTextLower.includes('führung')) {
        return 'Führung';
      } else if (taskTextLower.includes('schulung') || taskTextLower.includes('weiterbildung') || taskTextLower.includes('training')) {
        return 'Weiterbildung';
      } else if (taskTextLower.includes('vertrag') || taskTextLower.includes('compliance') || taskTextLower.includes('recht')) {
        return 'Recht & Compliance';
      } else {
        return 'Personalwesen';
      }
    }
    // Accounting/Finance tasks  
    else if (jobTextLower.includes('buchhalter') || jobTextLower.includes('finanz') || jobTextLower.includes('accounting')) {
      if (taskTextLower.includes('buchhaltung') || taskTextLower.includes('beleg') || taskTextLower.includes('kontierung')) {
        return 'Buchhaltung';
      } else if (taskTextLower.includes('abschluss') || taskTextLower.includes('monats') || taskTextLower.includes('jahres')) {
        return 'Reporting';
      } else if (taskTextLower.includes('steuer') || taskTextLower.includes('umsatzsteuer') || taskTextLower.includes('voranmeldung')) {
        return 'Steuerwesen';
      } else if (taskTextLower.includes('mahn') || taskTextLower.includes('zahlung') || taskTextLower.includes('verkehr')) {
        return 'Zahlungsverkehr';
      } else if (taskTextLower.includes('budget') || taskTextLower.includes('controlling') || taskTextLower.includes('planung')) {
        return 'Controlling';
      } else {
        return 'Finanzwesen';
      }
    }
    // Software Development tasks
    else if (jobTextLower.includes('entwickler') || jobTextLower.includes('programmierer') || jobTextLower.includes('software')) {
      if (taskTextLower.includes('entwicklung') || taskTextLower.includes('programmierung') || taskTextLower.includes('coding')) {
        return 'Software-Entwicklung';
      } else if (taskTextLower.includes('daten') || taskTextLower.includes('database') || taskTextLower.includes('datenbank')) {
        return 'Datenmanagement';
      } else if (taskTextLower.includes('api') || taskTextLower.includes('integration')) {
        return 'Integration';
      } else if (taskTextLower.includes('testing') || taskTextLower.includes('test')) {
        return 'Qualitätssicherung';
      } else if (taskTextLower.includes('dokumentation') || taskTextLower.includes('documentation')) {
        return 'Dokumentation';
      } else if (taskTextLower.includes('debugging') || taskTextLower.includes('fehlerbehebung')) {
        return 'Fehlerbehebung';
      } else {
        return 'Software-Entwicklung';
      }
    }
    // Default fallback
    else {
      return 'Allgemein';
    }
  }
}
