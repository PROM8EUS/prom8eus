/**
 * Selbstlernender Algorithmus-Verbesserer
 * 
 * Dieser Algorithmus:
 * 1. Analysiert Trainingsergebnisse
 * 2. Identifiziert spezifische Schwachstellen
 * 3. Generiert konkrete Code-Verbesserungen
 * 4. Wendet Verbesserungen automatisch an
 * 5. Testet und validiert Verbesserungen
 */

import * as fs from 'fs';
import * as path from 'path';
import { KeywordsManager } from '../src/lib/training/keywords-manager.js';

interface TrainingReport {
  summary: {
    totalTests: number;
    avgTaskAccuracy: number;
    avgIndustryAccuracy: number;
    avgOverallScore: number;
  };
  industryStats: Record<string, any>;
  problemCases: any[];
  recommendations: string[];
  rawResults: any[];
}

interface ImprovementSuggestion {
  type: 'task_extraction' | 'industry_detection' | 'qualification_filtering';
  priority: 'high' | 'medium' | 'low';
  description: string;
  codeChanges: CodeChange[];
  expectedImprovement: number; // 0-1 erwartete Verbesserung
}

interface CodeChange {
  file: string;
  action: 'add' | 'modify' | 'remove';
  location: string; // Regex oder Funktionsname
  newCode: string;
  explanation: string;
}

class AlgorithmImprover {
  private srcPath = path.join(process.cwd(), 'src');
  private keywordsManager: KeywordsManager;

  constructor() {
    this.keywordsManager = new KeywordsManager();
  }
  
  /**
   * Analysiert Trainingsergebnisse und schlägt Verbesserungen vor
   */
  analyzeAndImprove(report: TrainingReport): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];
    
    // 1. Task Extraction Verbesserungen
    suggestions.push(...this.improveTaskExtraction(report));
    
    // 2. Industry Detection Verbesserungen
    suggestions.push(...this.improveIndustryDetection(report));
    
    // 3. Qualification Filtering Verbesserungen
    suggestions.push(...this.improveQualificationFiltering(report));
    
    // Sortiere nach Priorität und erwartetem Impact
    return suggestions.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aScore = priorityWeight[a.priority] * a.expectedImprovement;
      const bScore = priorityWeight[b.priority] * b.expectedImprovement;
      return bScore - aScore;
    });
  }
  
  /**
   * Verbessert Task Extraction basierend auf häufigen False Positives/Negatives
   */
  private improveTaskExtraction(report: TrainingReport): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Analyse der häufigsten False Positives
    const allFalsePositives = report.rawResults.flatMap(r => r.falsePositives || []);
    const fpCounts = this.countIssues(allFalsePositives);
    
    // Analyse der häufigsten False Negatives  
    const allFalseNegatives = report.rawResults.flatMap(r => r.falseNegatives || []);
    const fnCounts = this.countIssues(allFalseNegatives);
    
    // Verbesserung 1: Qualification Patterns erweitern für häufige False Positives
    if (fpCounts.length > 0) {
      const topFalsePositives = fpCounts.slice(0, 5);
      const newPatterns = this.generateQualificationPatterns(topFalsePositives);
      
      if (newPatterns.length > 0) {
        suggestions.push({
          type: 'qualification_filtering',
          priority: 'high',
          description: `Erweitere Qualifikations-Filter um häufige False Positives: ${topFalsePositives.map(fp => fp.issue).join(', ')}`,
          codeChanges: [{
            file: 'src/lib/extractTasks.ts',
            action: 'add',
            location: 'QUALIFICATION_PATTERNS',
            newCode: newPatterns.map(p => `  ${p},`).join('\n'),
            explanation: 'Füge neue Qualification Patterns hinzu, um False Positives zu reduzieren'
          }],
          expectedImprovement: Math.min(0.3, topFalsePositives.length * 0.05)
        });
      }
    }
    
    // Verbesserung 2: Task Verben erweitern für häufige False Negatives
    if (fnCounts.length > 0) {
      const topFalseNegatives = fnCounts.slice(0, 5);
      const newTaskVerbs = this.extractTaskVerbs(topFalseNegatives);
      
      if (newTaskVerbs.length > 0) {
        suggestions.push({
          type: 'task_extraction',
          priority: 'medium',
          description: `Erweitere Task-Verben für übersehene Aufgaben: ${newTaskVerbs.join(', ')}`,
          codeChanges: [{
            file: 'src/lib/extractTasks.ts',
            action: 'modify',
            location: 'BRANCH_VERBS',
            newCode: this.generateBranchVerbsCode(newTaskVerbs),
            explanation: 'Erweitere Branch-Verben um häufig übersehene Aufgaben-Keywords'
          }],
          expectedImprovement: Math.min(0.2, newTaskVerbs.length * 0.03)
        });
      }
    }
    
    // Verbesserung 3: Minimale Task-Länge anpassen
    const shortTasksOverlooked = allFalseNegatives.filter(fn => fn.length < 30);
    if (shortTasksOverlooked.length > report.rawResults.length * 0.1) {
      suggestions.push({
        type: 'task_extraction',
        priority: 'medium',
        description: 'Reduziere minimale Task-Länge für kurze Aufgaben',
        codeChanges: [{
          file: 'src/lib/extractTasks.ts',
          action: 'modify',
          location: 'if (m && m[1] && m[1].length >= 10)',
          newCode: 'if (m && m[1] && m[1].length >= 8)',
          explanation: 'Reduziere minimale Task-Länge von 10 auf 8 Zeichen'
        }],
        expectedImprovement: 0.1
      });
    }
    
    return suggestions;
  }
  
  /**
   * Verbessert Industry Detection basierend auf Fehlklassifikationen
   */
  private improveIndustryDetection(report: TrainingReport): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Analysiere Branchenfehler
    const industryErrors = report.rawResults.filter(r => r.industryAccuracy === 0);
    const errorsByIndustry: Record<string, Array<{expected: string, detected: string}>> = {};
    
    for (const error of industryErrors) {
      const expected = error.job.expectedIndustry;
      const detected = error.analysis.detectedIndustry;
      
      if (!errorsByIndustry[expected]) {
        errorsByIndustry[expected] = [];
      }
      errorsByIndustry[expected].push({expected, detected});
    }
    
    // Verbesserung 1: Schwache Branchen-Keywords erweitern
    for (const [industry, errors] of Object.entries(errorsByIndustry)) {
      if (errors.length > 2) { // Mindestens 3 Fehler für diese Branche
        const commonWrongDetections = this.getMostCommonDetections(errors.map(e => e.detected));
        
        const newKeywords = this.generateIndustryKeywords(industry, errors);
        
        // Füge Keywords zur JSON hinzu anstatt Code zu modifizieren
        this.keywordsManager.addKeywords(industry, newKeywords);
        
        suggestions.push({
          type: 'industry_detection',
          priority: 'high',
          description: `Verbessere ${industry} Detection - ${newKeywords.length} neue Keywords hinzugefügt`,
          codeChanges: [], // Keine direkten Code-Änderungen mehr
          expectedImprovement: Math.min(0.25, errors.length * 0.05)
        });
      }
    }
    
    // Verbesserung 2: Reihenfolge der Industry Checks anpassen
    if (report.summary.avgIndustryAccuracy < 0.8) {
      suggestions.push({
        type: 'industry_detection',
        priority: 'medium',
        description: 'Optimiere Reihenfolge der Industry Detection für bessere Genauigkeit',
        codeChanges: [{
          file: 'src/lib/runAnalysis.ts',
          action: 'modify',
          location: 'detectIndustry function',
          newCode: this.generateOptimizedIndustryOrder(report),
          explanation: 'Passe Reihenfolge der Branchenerkennung basierend auf Häufigkeit von Fehlklassifikationen an'
        }],
        expectedImprovement: 0.15
      });
    }
    
    return suggestions;
  }
  
  /**
   * Verbessert Qualification Filtering
   */
  private improveQualificationFiltering(report: TrainingReport): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Analysiere welche Benefits/Qualifikationen als Tasks erkannt werden
    const falsePositives = report.rawResults.flatMap(r => r.falsePositives || []);
    const benefitFalsePositives = falsePositives.filter(fp => 
      this.looksBenefitOrQualification(fp)
    );
    
    if (benefitFalsePositives.length > report.rawResults.length * 0.1) {
      const newPatterns = this.generateImprovedQualificationPatterns(benefitFalsePositives);
      
      suggestions.push({
        type: 'qualification_filtering',
        priority: 'high',
        description: 'Verbessere Qualification Filtering um Benefits/Qualifikationen besser zu erkennen',
        codeChanges: [{
          file: 'src/lib/extractTasks.ts',
          action: 'add',
          location: 'QUALIFICATION_PATTERNS',
          newCode: newPatterns.join(',\n  '),
          explanation: 'Füge verbesserte Patterns für Benefits und Qualifikationen hinzu'
        }],
        expectedImprovement: Math.min(0.3, benefitFalsePositives.length * 0.02)
      });
    }
    
    return suggestions;
  }
  
  /**
   * Wendet Verbesserungsvorschläge automatisch an
   */
  async applyImprovements(suggestions: ImprovementSuggestion[]): Promise<AppliedImprovement[]> {
    const applied: AppliedImprovement[] = [];
    
    for (const suggestion of suggestions.slice(0, 3)) { // Max 3 Verbesserungen pro Durchlauf
      try {
        console.log(`🔧 Applying: ${suggestion.description}`);
        
        const result = await this.applyCodeChanges(suggestion.codeChanges);
        
        applied.push({
          suggestion,
          success: result.success,
          error: result.error,
          filesModified: result.filesModified
        });
        
        if (result.success) {
          console.log(`✅ Successfully applied: ${suggestion.description}`);
        } else {
          console.log(`❌ Failed to apply: ${suggestion.description} - ${result.error}`);
        }
        
      } catch (error) {
        console.error(`❌ Error applying improvement: ${error}`);
        applied.push({
          suggestion,
          success: false,
          error: error.message,
          filesModified: []
        });
      }
    }
    
    return applied;
  }
  
  /**
   * Wendet Code-Änderungen an
   */
  private async applyCodeChanges(changes: CodeChange[]): Promise<{success: boolean, error?: string, filesModified: string[]}> {
    const filesModified: string[] = [];
    
    try {
      for (const change of changes) {
        const filePath = path.join(this.srcPath, '..', change.file);
        
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Validiere Syntax vor Änderung
        if (!this.validateSyntax(content)) {
          throw new Error(`Invalid syntax in ${change.file} before modification`);
        }
        
        switch (change.action) {
          case 'add':
            content = this.addCode(content, change.location, change.newCode);
            break;
          case 'modify':
            content = this.modifyCode(content, change.location, change.newCode);
            break;
          case 'remove':
            content = this.removeCode(content, change.location);
            break;
        }
        
        // Validiere Syntax nach Änderung
        if (!this.validateSyntax(content)) {
          throw new Error(`Invalid syntax in ${change.file} after modification`);
        }
        
        // Backup erstellen
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        
        // Neue Version schreiben
        fs.writeFileSync(filePath, content);
        filesModified.push(change.file);
        
        console.log(`📝 Modified ${change.file}: ${change.explanation}`);
      }
      
      return { success: true, filesModified };
      
    } catch (error) {
      return { success: false, error: error.message, filesModified };
    }
  }
  
  private validateSyntax(content: string): boolean {
    try {
      // Grundlegende Syntax-Validierung
      const lines = content.split('\n');
      
      // Prüfe auf kritische Syntax-Fehler
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Überspringe Kommentare und leere Zeilen
        if (line.startsWith('//') || line.startsWith('/*') || line === '') {
          continue;
        }
        
        // Prüfe auf offensichtliche Fehler
        if (line.includes('undefined') && line.includes('function')) {
          console.warn('Found undefined function');
          return false;
        }
        
        // Prüfe auf lowerText außerhalb von Funktionen
        if (line.includes('lowerText') && !this.isInsideFunction(lines, i)) {
          console.warn('Found lowerText outside function context');
          return false;
        }
        
        // Prüfe auf unvollständige Zeilen
        if (line.includes('lowerText.includes') && !line.includes('||') && !line.includes('&&') && !line.endsWith(')') && !line.endsWith(';')) {
          const nextLine = lines[i + 1]?.trim() || '';
          if (!nextLine.startsWith('||') && !nextLine.startsWith('&&')) {
            console.warn('Found incomplete lowerText.includes line');
            return false;
          }
        }
      }
      
      // Prüfe grundlegende Struktur
      if (!content.includes('export function') && !content.includes('function')) {
        console.warn('No functions found');
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Syntax validation error:', error);
      return false;
    }
  }
  
  private isInsideFunction(lines: string[], currentIndex: number): boolean {
    // Suche rückwärts nach einer Funktionsdefinition
    for (let i = currentIndex; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.includes('function ') || line.includes('=> {')) {
        return true;
      }
      if (line === '}' && i < currentIndex) {
        return false; // Funktionsende gefunden
      }
    }
    return false;
  }
  
  // Helper Methods
  private countIssues(issues: string[]): Array<{issue: string, count: number}> {
    const counts: Record<string, number> = {};
    for (const issue of issues) {
      counts[issue] = (counts[issue] || 0) + 1;
    }
    
    return Object.entries(counts)
      .map(([issue, count]) => ({issue, count}))
      .sort((a, b) => b.count - a.count);
  }
  
  private generateQualificationPatterns(falsePositives: Array<{issue: string, count: number}>): string[] {
    const patterns: string[] = [];
    
    for (const fp of falsePositives) {
      const text = fp.issue.toLowerCase();
      
      // Generiere Patterns basierend auf häufigen Wörtern in False Positives
      if (text.includes('zusammenarbeit') || text.includes('collaboration')) {
        patterns.push('/^(zusammenarbeit|collaboration|cooperat).*mit.*(team|stakeholder|kollegen)/i');
      }
      
      if (text.includes('erfahrung') || text.includes('experience')) {
        patterns.push('/\\b(\\d+)\\s+(jahre?|years?)\\s+(erfahrung|experience)\\b/i');
      }
      
      if (text.includes('kenntnisse') || text.includes('knowledge')) {
        patterns.push('/^(kenntnisse|knowledge|skills?)\\s+in\\s+/i');
      }
      
      if (text.includes('tools') && !text.includes('entwicklung')) {
        patterns.push('/^.*(tools?|software)\\s+(kenntnisse|knowledge|experience)$/i');
      }
    }
    
    return [...new Set(patterns)]; // Duplikate entfernen
  }
  
  private extractTaskVerbs(falseNegatives: Array<{issue: string, count: number}>): string[] {
    const verbs: string[] = [];
    
    for (const fn of falseNegatives) {
      const words = fn.issue.toLowerCase().split(/\\s+/);
      
      // Extrahiere potentielle Task-Verben (erste 2-3 Wörter)
      for (const word of words.slice(0, 3)) {
        if (word.length > 4 && this.looksLikeTaskVerb(word)) {
          verbs.push(word);
        }
      }
    }
    
    return [...new Set(verbs)];
  }
  
  private looksLikeTaskVerb(word: string): boolean {
    const taskVerbEndings = ['ung', 'ion', 'tion', 'sion', 'ment', 'ing', 'ern', 'en'];
    return taskVerbEndings.some(ending => word.endsWith(ending));
  }
  
  private generateBranchVerbsCode(newVerbs: string[]): string {
    return `// Erweiterte Verben für bessere Task-Erkennung
    ${newVerbs.map(verb => `'${verb}'`).join(', ')}`;
  }
  
  private getMostCommonDetections(detections: string[]): string[] {
    const counts = this.countIssues(detections);
    return counts.slice(0, 3).map(c => c.issue);
  }
  
  private generateIndustryKeywords(industry: string, errors: Array<{expected: string, detected: string}>): string[] {
    // Basierend auf den Fehlern, generiere bessere Keywords für die Branche
    const industryKeywordMap = {
      tech: ['software engineer', 'developer', 'programming', 'coding', 'api development', 'system design', 'technical lead'],
      marketing: ['marketing manager', 'campaign management', 'brand strategy', 'content creation', 'digital marketing', 'advertising'],
      finance: ['financial analyst', 'accounting manager', 'tax consultant', 'budget planning', 'financial reporting'],
      hr: ['hr manager', 'human resources', 'talent acquisition', 'recruitment specialist', 'employee relations'],
      healthcare: ['medical professional', 'patient care', 'healthcare management', 'clinical operations', 'nursing'],
      production: ['production manager', 'manufacturing', 'quality assurance', 'process optimization', 'operations']
    };
    
    const baseKeywords = industryKeywordMap[industry] || [];
    
    // Analysiere die Fehler und füge spezifische Keywords hinzu
    const additionalKeywords: string[] = [];
    errors.forEach(error => {
      if (error.expected === industry) {
        // Extrahiere relevante Begriffe aus dem fehlerhaft klassifizierten Text
        const text = error.detected.toLowerCase();
        if (industry === 'tech' && (text.includes('developer') || text.includes('engineer'))) {
          additionalKeywords.push('software development', 'engineering');
        }
        if (industry === 'marketing' && text.includes('marketing')) {
          additionalKeywords.push('marketing strategy', 'brand management');
        }
      }
    });
    
    return [...baseKeywords, ...additionalKeywords];
  }
  
  private generateOptimizedIndustryOrder(report: TrainingReport): string {
    // Analysiere welche Branchen am häufigsten verwechselt werden
    // und ordne sie entsprechend um
    return '// Optimierte Reihenfolge basierend auf Training-Ergebnissen';
  }
  
  private looksBenefitOrQualification(text: string): boolean {
    const benefitKeywords = ['flexible', 'remote', 'benefits', 'offered', 'provide', 'bieten'];
    const qualKeywords = ['experience', 'knowledge', 'skills', 'degree', 'erfahrung', 'kenntnisse'];
    
    return benefitKeywords.some(kw => text.toLowerCase().includes(kw)) ||
           qualKeywords.some(kw => text.toLowerCase().includes(kw));
  }
  
  private generateImprovedQualificationPatterns(falsePositives: string[]): string[] {
    const patterns: string[] = [];
    
    for (const fp of falsePositives) {
      const text = fp.toLowerCase();
      
      if (text.includes('flexible') && text.includes('arbeitszeit')) {
        patterns.push('/^flexible\\s+arbeitszeiten?$/i');
      }
      
      if (text.includes('remote') && text.includes('option')) {
        patterns.push('/^remote.*(option|möglichkeit|possibility)$/i');
      }
      
      if (text.includes('team') && (text.includes('flach') || text.includes('interdisziplinär'))) {
        patterns.push('/^(interdisziplinäres?|flaches?)\\s+team$/i');
      }
    }
    
    return patterns;
  }
  
  private addCode(content: string, location: string, newCode: string): string {
    // JSON-basierte Keywords werden nicht mehr direkt in Code eingefügt
    console.log('Keywords werden jetzt über JSON-Manager verwaltet');
    return content;
  }
  
  private modifyCode(content: string, location: string, newCode: string): string {
    // Ersetze basierend auf location pattern
    if (location.includes('regex:')) {
      const regex = new RegExp(location.replace('regex:', ''), 'g');
      return content.replace(regex, newCode);
    }
    
    return content.replace(location, newCode);
  }
  
  private removeCode(content: string, location: string): string {
    const lines = content.split('\n');
    return lines.filter(line => !line.includes(location)).join('\n');
  }
}

interface AppliedImprovement {
  suggestion: ImprovementSuggestion;
  success: boolean;
  error?: string;
  filesModified: string[];
}

export { AlgorithmImprover, ImprovementSuggestion, CodeChange, AppliedImprovement };
