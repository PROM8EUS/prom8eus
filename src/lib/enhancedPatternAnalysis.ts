// Enhanced Pattern Analysis with GPT Intelligence
import { PatternAnalyzer, TaskPattern, SubtaskPattern } from './patternAnalysis';

export interface EnhancedTaskPattern extends TaskPattern {
  gptInsights?: {
    reasoning: string;
    confidence: number;
    suggestedImprovements: string[];
    industryContext: string;
  };
}

export interface GPTAnalysisResult {
  patternId: string;
  confidence: number;
  reasoning: string;
  suggestedSubtasks: SubtaskPattern[];
  automationInsights: {
    highPotential: string[];
    mediumPotential: string[];
    lowPotential: string[];
  };
  industryRecommendations: string[];
}

// GPT-Enhanced Pattern Analysis
export class EnhancedPatternAnalyzer {
  
  // Analyze task with GPT intelligence
  static async analyzeTaskWithGPT(taskText: string, jobContext?: string): Promise<GPTAnalysisResult | null> {
    try {
      // First, use basic pattern matching
      const basicPattern = PatternAnalyzer.analyzeTask(taskText, jobContext);
      
      if (!basicPattern) {
        console.log('⚠️ No basic pattern found, using GPT for intelligent analysis');
        return await this.generateGPTAnalysis(taskText, jobContext);
      }
      
      // Enhance existing pattern with GPT insights
      const enhancedResult = await this.enhancePatternWithGPT(basicPattern, taskText, jobContext);
      
      return enhancedResult;
      
    } catch (error) {
      console.error('❌ GPT-enhanced analysis failed:', error);
      return null;
    }
  }
  
  // Enhance existing pattern with GPT insights
  private static async enhancePatternWithGPT(
    pattern: TaskPattern, 
    taskText: string, 
    jobContext?: string
  ): Promise<GPTAnalysisResult> {
    
    const prompt = this.buildEnhancementPrompt(pattern, taskText, jobContext);
    
    try {
      const gptResponse = await this.callGPT(prompt);
      const insights = this.parseGPTResponse(gptResponse);
      
      return {
        patternId: pattern.id,
        confidence: insights.confidence,
        reasoning: insights.reasoning,
        suggestedSubtasks: insights.suggestedSubtasks.length > 0 ? insights.suggestedSubtasks : pattern.subtasks,
        automationInsights: insights.automationInsights,
        industryRecommendations: insights.industryRecommendations
      };
      
    } catch (error) {
      console.error('❌ GPT enhancement failed, using basic pattern:', error);
      
      // Fallback to basic pattern
      return {
        patternId: pattern.id,
        confidence: 0.7,
        reasoning: `Basic pattern match: ${pattern.name}`,
        suggestedSubtasks: pattern.subtasks,
        automationInsights: {
          highPotential: pattern.subtasks.filter(s => s.automationPotential >= 0.8).map(s => s.title),
          mediumPotential: pattern.subtasks.filter(s => s.automationPotential >= 0.5 && s.automationPotential < 0.8).map(s => s.title),
          lowPotential: pattern.subtasks.filter(s => s.automationPotential < 0.5).map(s => s.title)
        },
        industryRecommendations: [`Use ${pattern.domain} best practices`]
      };
    }
  }
  
  // Generate GPT analysis for unknown tasks
  private static async generateGPTAnalysis(taskText: string, jobContext?: string): Promise<GPTAnalysisResult | null> {
    const prompt = this.buildAnalysisPrompt(taskText, jobContext);
    
    try {
      const gptResponse = await this.callGPT(prompt);
      const analysis = this.parseGPTResponse(gptResponse);
      
      return {
        patternId: 'gpt-generated',
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        suggestedSubtasks: analysis.suggestedSubtasks,
        automationInsights: analysis.automationInsights,
        industryRecommendations: analysis.industryRecommendations
      };
      
    } catch (error) {
      console.error('❌ GPT analysis failed:', error);
      return null;
    }
  }
  
  // Build prompt for pattern enhancement
  private static buildEnhancementPrompt(pattern: TaskPattern, taskText: string, jobContext?: string): string {
    return `Du bist ein Experte für Geschäftsprozessanalyse und Automatisierung.

ANALYSIERE diese Aufgabe basierend auf dem erkannten Pattern:

AUFGABE: "${taskText}"
JOB-KONTEXT: "${jobContext || 'Nicht verfügbar'}"
ERKANNTES PATTERN: ${pattern.name} (${pattern.domain})

PATTERN-DETAILS:
- Automatisierungspotenzial: ${pattern.automationPotential * 100}%
- Kategorie: ${pattern.category}
- Verwandte Systeme: ${pattern.relatedSystems.join(', ')}

AKTUELLE TEILAUFGABEN:
${pattern.subtasks.map(s => `- ${s.title} (${s.automationPotential * 100}% Automatisierung)`).join('\n')}

AUFTRAG:
1. Bewerte die Genauigkeit des Pattern-Matches (0-1)
2. Erkläre die Begründung für die Bewertung
3. Schlage Verbesserungen für die Teilaufgaben vor
4. Identifiziere Automatisierungspotenziale
5. Gib branchenspezifische Empfehlungen

ANTWORTE NUR MIT VALIDEM JSON:
{
  "confidence": 0.85,
  "reasoning": "Pattern passt gut, aber könnte spezifischer sein...",
  "suggestedSubtasks": [
    {
      "id": "enhanced-step-1",
      "title": "Verbesserte Teilaufgabe",
      "systems": ["System1", "System2"],
      "manualHoursShare": 0.25,
      "automationPotential": 0.85,
      "risks": ["Risiko1"],
      "assumptions": ["Annahme1"]
    }
  ],
  "automationInsights": {
    "highPotential": ["Aufgabe1", "Aufgabe2"],
    "mediumPotential": ["Aufgabe3"],
    "lowPotential": ["Aufgabe4"]
  },
  "industryRecommendations": ["Empfehlung1", "Empfehlung2"]
}`;
  }
  
  // Build prompt for new task analysis
  private static buildAnalysisPrompt(taskText: string, jobContext?: string): string {
    return `Du bist ein Experte für Geschäftsprozessanalyse und Automatisierung.

ANALYSIERE diese unbekannte Aufgabe:

AUFGABE: "${taskText}"
JOB-KONTEXT: "${jobContext || 'Nicht verfügbar'}"

AUFTRAG:
1. Bestimme die Branche/Domain (customer-service, data-science, marketing, hr-management, accounting, software-development, sales, operations)
2. Bewerte das Automatisierungspotenzial (0-1)
3. Erstelle 4-6 spezifische Teilaufgaben
4. Identifiziere relevante Systeme und Tools
5. Gib Automatisierungsempfehlungen

ANTWORTE NUR MIT VALIDEM JSON:
{
  "confidence": 0.8,
  "reasoning": "Aufgabe gehört zur Domain X weil...",
  "suggestedSubtasks": [
    {
      "id": "step-1",
      "title": "Spezifische Teilaufgabe",
      "systems": ["Relevantes System"],
      "manualHoursShare": 0.25,
      "automationPotential": 0.85,
      "risks": ["Hauptrisiko"],
      "assumptions": ["Wichtige Annahme"]
    }
  ],
  "automationInsights": {
    "highPotential": ["Aufgabe mit hohem Potenzial"],
    "mediumPotential": ["Aufgabe mit mittlerem Potenzial"],
    "lowPotential": ["Aufgabe mit niedrigem Potenzial"]
  },
  "industryRecommendations": ["Branchenspezifische Empfehlung"]
}`;
  }
  
  // Call GPT API
  private static async callGPT(prompt: string): Promise<string> {
    // For now, simulate GPT response with intelligent fallback
    // In production, this would call OpenAI API
    
    console.log('🤖 Simulating GPT analysis...');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return intelligent simulated response based on prompt content
    if (prompt.includes('customer-service') || prompt.includes('kundenservice')) {
      return JSON.stringify({
        confidence: 0.9,
        reasoning: "Pattern passt perfekt für Kundenservice-Aufgaben",
        suggestedSubtasks: [
          {
            id: "enhanced-inquiry-handling",
            title: "Intelligente Anfragebearbeitung mit KI",
            systems: ["CRM", "AI Assistant", "Knowledge Base"],
            manualHoursShare: 0.15,
            automationPotential: 0.95,
            risks: ["KI-Fehler bei komplexen Anfragen"],
            assumptions: ["Gute Wissensbasis verfügbar"]
          }
        ],
        automationInsights: {
          highPotential: ["E-Mail-Bearbeitung", "Terminvereinbarung"],
          mediumPotential: ["Komplexe Beratung"],
          lowPotential: ["Eskalation"]
        },
        industryRecommendations: ["Implementiere Chatbot für 24/7 Support"]
      });
    }
    
    if (prompt.includes('data-science') || prompt.includes('datenanalyse')) {
      return JSON.stringify({
        confidence: 0.85,
        reasoning: "Pattern passt gut für Data Science Aufgaben",
        suggestedSubtasks: [
          {
            id: "enhanced-ml-pipeline",
            title: "Automatisierte ML-Pipeline",
            systems: ["ML Platform", "Data Pipeline", "Model Registry"],
            manualHoursShare: 0.20,
            automationPotential: 0.90,
            risks: ["Model Drift"],
            assumptions: ["Qualitätsdaten verfügbar"]
          }
        ],
        automationInsights: {
          highPotential: ["Datenvorverarbeitung", "Modell-Training"],
          mediumPotential: ["Feature Engineering"],
          lowPotential: ["Ergebnisinterpretation"]
        },
        industryRecommendations: ["Implementiere MLOps-Pipeline"]
      });
    }
    
    // Default response
    return JSON.stringify({
      confidence: 0.7,
      reasoning: "Standard-Analyse für unbekannte Aufgabe",
      suggestedSubtasks: [
        {
          id: "gpt-step-1",
          title: "Aufgabe analysieren und strukturieren",
          systems: ["Planning Tools", "Documentation"],
          manualHoursShare: 0.30,
          automationPotential: 0.60,
          risks: ["Unvollständige Analyse"],
          assumptions: ["Klare Anforderungen"]
        }
      ],
      automationInsights: {
        highPotential: ["Routine-Aufgaben"],
        mediumPotential: ["Semi-strukturierte Aufgaben"],
        lowPotential: ["Kreative Aufgaben"]
      },
      industryRecommendations: ["Führe Prozessanalyse durch"]
    });
  }
  
  // Parse GPT response
  private static parseGPTResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('❌ Failed to parse GPT response:', error);
      return {
        confidence: 0.5,
        reasoning: "Fehler beim Parsen der GPT-Antwort",
        suggestedSubtasks: [],
        automationInsights: { highPotential: [], mediumPotential: [], lowPotential: [] },
        industryRecommendations: []
      };
    }
  }
  
  // Get enhanced workflows based on GPT analysis
  static async getEnhancedWorkflows(taskText: string, gptAnalysis: GPTAnalysisResult): Promise<any[]> {
    // Use GPT insights to find better workflows
    const enhancedKeywords = [
      ...gptAnalysis.automationInsights.highPotential,
      ...gptAnalysis.automationInsights.mediumPotential,
      ...gptAnalysis.industryRecommendations
    ];
    
    // This would integrate with actual workflow APIs
    return [];
  }
}
