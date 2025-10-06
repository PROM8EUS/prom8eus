/**
 * Automatisches Training-System für Stellenanzeigen-Analyse
 * 
 * Dieses System:
 * 1. Generiert typische Stellenanzeigen verschiedener Branchen
 * 2. Analysiert sie mit dem aktuellen Algorithmus
 * 3. Bewertet die Ergebnisse automatisch
 * 4. Identifiziert Verbesserungspotentiale
 * 5. Schlägt konkrete Algorithmus-Verbesserungen vor
 */

import { extractTasks } from '../src/lib/extractTasks';
import { runAnalysis } from '../src/lib/runAnalysis';
import { detectIndustry } from '../src/lib/runAnalysis';

// Typische Stellenanzeigen-Templates für verschiedene Branchen
const JOB_TEMPLATES = {
  tech: {
    roles: [
      'Software Engineer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Data Scientist', 
      'UX/UI Designer', 'Product Manager', 'Full Stack Developer', 'Mobile Developer', 'QA Engineer',
      'System Administrator', 'Cloud Engineer', 'Machine Learning Engineer', 'AI Engineer', 'Blockchain Developer',
      'Game Developer', 'Embedded Systems Engineer', 'Security Engineer', 'Network Engineer', 'Database Administrator'
    ],
    taskPatterns: [
      'Entwicklung von {technology} Anwendungen',
      'Implementation von {feature} Features',
      'Code-Reviews und Qualitätssicherung',
      'Zusammenarbeit mit cross-funktionalen Teams',
      'Optimierung der Performance und Skalierbarkeit',
      'Dokumentation von Architektur und Prozessen',
      'Debugging und Fehlerbehebung',
      'Testing und Test-Automatisierung',
      'Entwicklung von {technology} APIs',
      'Implementierung von {feature} Microservices',
      'Datenbank-Design und -Optimierung',
      'CI/CD Pipeline Setup und Wartung',
      'Cloud-Infrastruktur Management',
      'Security-Implementierung und -Audits',
      'Code-Refactoring und Legacy-System Modernisierung',
      'Performance-Monitoring und -Optimierung',
      'Agile Entwicklung und Scrum-Prozesse',
      'Technische Architektur-Entscheidungen',
      'Mentoring von Junior-Entwicklern',
      'Integration von Third-Party Services'
    ],
          technologies: ['React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'Kubernetes', 'Docker', 'AWS', 'TypeScript', 'Go', 'Rust', 'PHP', 'C#', 'Scala', 'Kotlin', 'Swift', 'Flutter', 'React Native', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Elasticsearch', 'RabbitMQ', 'Apache Kafka', 'Terraform', 'Ansible', 'Jenkins', 'GitLab CI', 'GitHub Actions'],
      features: ['REST APIs', 'Microservices', 'UI Komponenten', 'Datenbank-Schemas', 'CI/CD Pipelines', 'Authentication Systems', 'Payment Gateways', 'Real-time Communication', 'Data Processing Pipelines', 'Machine Learning Models', 'Blockchain Smart Contracts', 'IoT Device Integration', 'Mobile App Features', 'Web Services', 'API Gateways', 'Load Balancing', 'Caching Systems', 'Monitoring Dashboards', 'Automated Testing', 'Deployment Automation']
  },
  
  marketing: {
    roles: [
      'Marketing Manager', 'Content Marketing Specialist', 'SEO Manager', 'Social Media Manager', 'Growth Hacker',
      'Digital Marketing Manager', 'Brand Manager', 'Marketing Director', 'Campaign Manager', 'Email Marketing Specialist',
      'PPC Specialist', 'Marketing Analyst', 'Product Marketing Manager', 'Event Marketing Manager', 'Influencer Marketing Manager',
      'Marketing Automation Specialist', 'Conversion Rate Optimizer', 'Marketing Operations Manager', 'Creative Director', 'Marketing Consultant'
    ],
    taskPatterns: [
      'Entwicklung von {campaign_type} Kampagnen',
      'Content-Erstellung für {platform}',
      'Analyse von Marketing-Metriken und KPIs',
      'Lead-Generierung und Conversion-Optimierung',
      'Brand Management und Markenpositionierung',
      'Marktforschung und Wettbewerbsanalyse',
      'Budget-Planung und ROI-Tracking',
      'Zusammenarbeit mit Agenturen und Dienstleistern'
    ],
    campaign_types: ['Email-Marketing', 'Social Media', 'Content Marketing', 'PPC', 'Influencer'],
    platforms: ['LinkedIn', 'Instagram', 'Facebook', 'TikTok', 'YouTube', 'Website', 'Blog']
  },
  
  finance: {
    roles: ['Buchhalter', 'Controller', 'Financial Analyst', 'Steuerberater', 'Treasury Manager'],
    taskPatterns: [
      'Führung der laufenden Buchhaltung',
      'Erstellung von {report_type}',
      'Überwachung von {process} Prozessen',
      'Compliance mit steuerlichen Vorschriften',
      'Monats- und Jahresabschlüsse',
      'Budgetplanung und Forecasting',
      'Kreditorenbuchhaltung und Zahlungsverkehr',
      'Zusammenarbeit mit Wirtschaftsprüfern'
    ],
    report_types: ['Monatsberichten', 'Quartalsanalysen', 'Jahresabschlüssen', 'KPI-Dashboards'],
    processes: ['Controlling', 'Kostenrechnung', 'Liquiditäts', 'Risikomanagement']
  },
  
  hr: {
    roles: ['HR Manager', 'Recruiter', 'HR Business Partner', 'Personalentwickler', 'Compensation & Benefits Specialist'],
    taskPatterns: [
      'Durchführung von {process} Prozessen',
      'Entwicklung von HR-Strategien',
      'Mitarbeiterbetreuung und -entwicklung',
      'Recruiting und Talent Acquisition',
      'Performance Management und Bewertungen',
      'Compliance mit Arbeitsrecht',
      'HR-Analytics und Reporting',
      'Change Management Initiativen'
    ],
    processes: ['Onboarding', 'Offboarding', 'Performance Review', 'Compensation Review']
  },
  
  healthcare: {
    roles: ['Krankenpfleger', 'Arzt', 'Physiotherapeut', 'Medizinische Fachangestellte', 'Pflegedienstleitung'],
    taskPatterns: [
      'Patientenbetreuung und -pflege',
      'Durchführung von {treatment} Behandlungen',
      'Dokumentation von Patientendaten',
      'Medikamentenverabreichung und -überwachung',
      'Zusammenarbeit mit interdisziplinären Teams',
      'Einhaltung von Hygienevorschriften',
      'Angehörigenberatung und -aufklärung',
      'Qualitätssicherung und Compliance'
    ],
    treatments: ['therapeutischen', 'diagnostischen', 'präventiven', 'rehabilitativen']
  },
  
  production: {
    roles: ['Produktionsleiter', 'Qualitätsingenieur', 'Lean Manager', 'Maintenance Techniker', 'Supply Chain Manager'],
    taskPatterns: [
      'Überwachung von {process} Prozessen',
      'Qualitätskontrolle und -sicherung',
      'Optimierung von Produktionsabläufen',
      'Wartung und Instandhaltung von Anlagen',
      'Koordination mit Lieferanten',
      'Sicherheitsmanagement und Compliance',
      'Lean Manufacturing Implementierung',
      'Produktionsplanung und -steuerung'
    ],
    processes: ['Fertigungs', 'Produktions', 'Logistik', 'Qualitäts']
  }
};

// Benefits-Templates (sollen NICHT als Aufgaben erkannt werden)
const BENEFITS_TEMPLATES = [
  'Flexible Arbeitszeiten und Home-Office Möglichkeiten',
  'Kreatives Arbeitsumfeld mit flachen Hierarchien',
  'Weiterbildungsmöglichkeiten und Konferenzbesuche',
  'Moderne Arbeitsplätze mit neuester Technologie',
  'Teamevents und gemeinsame Aktivitäten',
  'Betriebliche Altersvorsorge und Gesundheitsvorsorge',
  'Überdurchschnittliche Vergütung und Bonussystem',
  'Kantine mit subventionierten Mahlzeiten',
  'Firmenfitness und Gesundheitsprogramme',
  'Jobticket und Parkplätze'
];

// Qualifikations-Templates (sollen NICHT als Aufgaben erkannt werden)
const QUALIFICATION_TEMPLATES = [
  'Abgeschlossenes Studium in {field}',
  'Mindestens {years} Jahre Berufserfahrung',
  'Sehr gute Kenntnisse in {skill}',
  'Erfahrung mit {technology}',
  'Fließende Deutsch- und Englischkenntnisse',
  'Analytisches Denkvermögen und Problemlösungskompetenz',
  'Teamfähigkeit und Kommunikationsstärke',
  'Eigenverantwortliches Arbeiten und Zuverlässigkeit'
];

interface GeneratedJob {
  title: string;
  industry: string;
  tasks: string[];
  qualifications: string[];
  benefits: string[];
  fullText: string;
  expectedTaskCount: number;
  expectedIndustry: string;
}

interface AnalysisResult {
  detectedTasks: string[];
  detectedIndustry: string;
  taskCount: number;
  score: number;
}

interface EvaluationResult {
  job: GeneratedJob;
  analysis: AnalysisResult;
  taskAccuracy: number; // 0-1: Wie viele echte Aufgaben wurden erkannt?
  industryAccuracy: number; // 0-1: Wurde die richtige Branche erkannt?
  falsePositives: string[]; // Fälschlicherweise als Aufgaben erkannte Texte
  falseNegatives: string[]; // Übersehene echte Aufgaben
  overallScore: number; // 0-1: Gesamtbewertung
}

class JobGenerator {
  /**
   * Generiert eine typische Stellenanzeige für eine bestimmte Branche
   */
  generateJob(industry: keyof typeof JOB_TEMPLATES): GeneratedJob {
    const template = JOB_TEMPLATES[industry];
    const role = this.randomChoice(template.roles);
    
    // Generiere 4-8 echte Aufgaben
    const taskCount = 4 + Math.floor(Math.random() * 5);
    const tasks = this.generateTasks(template, taskCount);
    
    // Generiere 3-6 Qualifikationen
    const qualificationCount = 3 + Math.floor(Math.random() * 4);
    const qualifications = this.generateQualifications(qualificationCount);
    
    // Generiere 3-5 Benefits
    const benefitCount = 3 + Math.floor(Math.random() * 3);
    const benefits = this.randomSample(BENEFITS_TEMPLATES, benefitCount);
    
    const fullText = this.buildJobText(role, tasks, qualifications, benefits);
    
    return {
      title: role,
      industry,
      tasks,
      qualifications,
      benefits,
      fullText,
      expectedTaskCount: taskCount,
      expectedIndustry: industry
    };
  }
  
  private generateTasks(template: any, count: number): string[] {
    const tasks = [];
    const usedPatterns = new Set();
    
    for (let i = 0; i < count; i++) {
      let pattern;
      let attempts = 0;
      do {
        pattern = this.randomChoice(template.taskPatterns);
        attempts++;
      } while (usedPatterns.has(pattern) && attempts < 10);
      
      usedPatterns.add(pattern);
      
      // Ersetze Platzhalter in den Patterns
      let task = pattern;
      if (task.includes('{technology}') && template.technologies) {
        task = task.replace('{technology}', this.randomChoice(template.technologies));
      }
      if (task.includes('{feature}') && template.features) {
        task = task.replace('{feature}', this.randomChoice(template.features));
      }
      if (task.includes('{campaign_type}') && template.campaign_types) {
        task = task.replace('{campaign_type}', this.randomChoice(template.campaign_types));
      }
      if (task.includes('{platform}') && template.platforms) {
        task = task.replace('{platform}', this.randomChoice(template.platforms));
      }
      if (task.includes('{report_type}') && template.report_types) {
        task = task.replace('{report_type}', this.randomChoice(template.report_types));
      }
      if (task.includes('{process}') && template.processes) {
        task = task.replace('{process}', this.randomChoice(template.processes));
      }
      if (task.includes('{treatment}') && template.treatments) {
        task = task.replace('{treatment}', this.randomChoice(template.treatments));
      }
      
      tasks.push(task);
    }
    
    return tasks;
  }
  
  private generateQualifications(count: number): string[] {
    const qualifications = [];
    const fields = ['Informatik', 'Betriebswirtschaft', 'Marketing', 'Ingenieurwesen', 'Psychologie'];
    const skills = ['Excel', 'SAP', 'DATEV', 'Salesforce', 'Adobe Creative Suite'];
    const technologies = ['React', 'Python', 'Java', 'AWS', 'Kubernetes'];
    
    for (let i = 0; i < count; i++) {
      let qualification = this.randomChoice(QUALIFICATION_TEMPLATES);
      
      qualification = qualification
        .replace('{field}', this.randomChoice(fields))
        .replace('{years}', String(2 + Math.floor(Math.random() * 6)))
        .replace('{skill}', this.randomChoice(skills))
        .replace('{technology}', this.randomChoice(technologies));
      
      qualifications.push(qualification);
    }
    
    return qualifications;
  }
  
  private buildJobText(role: string, tasks: string[], qualifications: string[], benefits: string[]): string {
    const locations = ['Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt'];
    const workTypes = ['Vollzeit', 'Teilzeit', 'Vollzeit oder Teilzeit'];
    
    return `${role} (m/w/d)

Standort: ${this.randomChoice(locations)} / Remote möglich
Arbeitszeit: ${this.randomChoice(workTypes)}
Start: ab sofort

Deine Aufgaben
${tasks.map(task => `\t•\t${task}`).join('\n')}

Dein Profil
${qualifications.map(qual => `\t•\t${qual}`).join('\n')}

Was wir bieten
${benefits.map(benefit => `\t•\t${benefit}`).join('\n')}`;
  }
  
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  private randomSample<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

class AnalysisEvaluator {
  /**
   * Bewertet die Qualität einer Analyse
   */
  evaluate(job: GeneratedJob, analysis: AnalysisResult): EvaluationResult {
    // Task-Genauigkeit: Wie viele der erwarteten Aufgaben wurden erkannt?
    const detectedTasksLower = analysis.detectedTasks.map(t => t.toLowerCase());
    const expectedTasksLower = job.tasks.map(t => t.toLowerCase());
    
    let correctlyDetected = 0;
    const falseNegatives: string[] = [];
    
    for (const expectedTask of job.tasks) {
      const isDetected = detectedTasksLower.some(detected => 
        this.tasksSimilar(detected, expectedTask.toLowerCase())
      );
      if (isDetected) {
        correctlyDetected++;
      } else {
        falseNegatives.push(expectedTask);
      }
    }
    
    const taskAccuracy = job.expectedTaskCount > 0 ? correctlyDetected / job.expectedTaskCount : 0;
    
    // Branche-Genauigkeit
    const industryAccuracy = analysis.detectedIndustry === job.expectedIndustry ? 1 : 0;
    
    // False Positives: Wurden Benefits/Qualifikationen als Aufgaben erkannt?
    const falsePositives: string[] = [];
    const allNonTasks = [...job.qualifications, ...job.benefits].map(t => t.toLowerCase());
    
    for (const detectedTask of analysis.detectedTasks) {
      const isActualTask = expectedTasksLower.some(expected => 
        this.tasksSimilar(detectedTask.toLowerCase(), expected)
      );
      if (!isActualTask) {
        falsePositives.push(detectedTask);
      }
    }
    
    // Gesamtbewertung
    const falsePositivesPenalty = falsePositives.length * 0.1;
    const overallScore = Math.max(0, (taskAccuracy * 0.7 + industryAccuracy * 0.3) - falsePositivesPenalty);
    
    return {
      job,
      analysis,
      taskAccuracy,
      industryAccuracy,
      falsePositives,
      falseNegatives,
      overallScore
    };
  }
  
  private tasksSimilar(detected: string, expected: string): boolean {
    // Einfache Ähnlichkeitsprüfung basierend auf gemeinsamen Wörtern
    const detectedWords = detected.split(/\s+/).filter(w => w.length > 3);
    const expectedWords = expected.split(/\s+/).filter(w => w.length > 3);
    
    let commonWords = 0;
    for (const word of expectedWords) {
      if (detectedWords.some(dw => dw.includes(word) || word.includes(dw))) {
        commonWords++;
      }
    }
    
    return commonWords >= Math.min(2, expectedWords.length * 0.5);
  }
}

class TrainingSystem {
  private generator = new JobGenerator();
  private evaluator = new AnalysisEvaluator();
  
  /**
   * Führt einen Trainings-Durchlauf durch
   */
  async runTrainingCycle(iterations: number = 100): Promise<TrainingReport> {
    console.log(`🚀 Starting training cycle with ${iterations} iterations...`);
    
    const results: EvaluationResult[] = [];
    const industryResults: Record<string, EvaluationResult[]> = {};
    
    // Generiere und teste Stellenanzeigen für alle Branchen
    const industries = Object.keys(JOB_TEMPLATES) as (keyof typeof JOB_TEMPLATES)[];
    
    for (let i = 0; i < iterations; i++) {
      const industry = industries[i % industries.length];
      
      // Generiere Stellenanzeige
      const job = this.generator.generateJob(industry);
      
      // Analysiere mit aktuellem Algorithmus
      try {
        const extractedTasks = extractTasks(job.fullText);
        const analysisResult = runAnalysis(job.fullText, 'de');
        const detectedIndustry = detectIndustry(job.fullText);
        
        const analysis: AnalysisResult = {
          detectedTasks: extractedTasks.map(t => t.text),
          detectedIndustry,
          taskCount: extractedTasks.length,
          score: analysisResult.totalScore
        };
        
        // Bewerte Ergebnis
        const evaluation = this.evaluator.evaluate(job, analysis);
        results.push(evaluation);
        
        if (!industryResults[industry]) {
          industryResults[industry] = [];
        }
        industryResults[industry].push(evaluation);
        
        if (i % 10 === 0) {
          console.log(`✅ Completed ${i + 1}/${iterations} iterations`);
        }
        
      } catch (error) {
        console.error(`❌ Error analyzing job ${i + 1}:`, error);
      }
    }
    
    return this.generateReport(results, industryResults);
  }
  
  private generateReport(results: EvaluationResult[], industryResults: Record<string, EvaluationResult[]>): TrainingReport {
    const totalResults = results.length;
    const avgTaskAccuracy = results.reduce((sum, r) => sum + r.taskAccuracy, 0) / totalResults;
    const avgIndustryAccuracy = results.reduce((sum, r) => sum + r.industryAccuracy, 0) / totalResults;
    const avgOverallScore = results.reduce((sum, r) => sum + r.overallScore, 0) / totalResults;
    
    // Analyse nach Branche
    const industryStats: Record<string, any> = {};
    for (const [industry, results] of Object.entries(industryResults)) {
      const count = results.length;
      industryStats[industry] = {
        count,
        avgTaskAccuracy: results.reduce((sum, r) => sum + r.taskAccuracy, 0) / count,
        avgIndustryAccuracy: results.reduce((sum, r) => sum + r.industryAccuracy, 0) / count,
        avgOverallScore: results.reduce((sum, r) => sum + r.overallScore, 0) / count,
        commonFalsePositives: this.getMostCommonIssues(results.flatMap(r => r.falsePositives)),
        commonFalseNegatives: this.getMostCommonIssues(results.flatMap(r => r.falseNegatives))
      };
    }
    
    // Identifiziere Problemfälle
    const poorPerformers = results.filter(r => r.overallScore < 0.6);
    const commonIssues = this.identifyCommonIssues(results);
    
    return {
      summary: {
        totalTests: totalResults,
        avgTaskAccuracy,
        avgIndustryAccuracy,
        avgOverallScore
      },
      industryStats,
      problemCases: poorPerformers.slice(0, 10), // Top 10 Problemfälle
      recommendations: this.generateRecommendations(commonIssues, industryStats),
      rawResults: results
    };
  }
  
  private getMostCommonIssues(issues: string[]): Array<{issue: string, count: number}> {
    const counts: Record<string, number> = {};
    for (const issue of issues) {
      counts[issue] = (counts[issue] || 0) + 1;
    }
    
    return Object.entries(counts)
      .map(([issue, count]) => ({issue, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  
  private identifyCommonIssues(results: EvaluationResult[]): CommonIssues {
    const falsePositives = results.flatMap(r => r.falsePositives);
    const falseNegatives = results.flatMap(r => r.falseNegatives);
    const industryMisclassifications = results.filter(r => r.industryAccuracy === 0);
    
    return {
      mostCommonFalsePositives: this.getMostCommonIssues(falsePositives),
      mostCommonFalseNegatives: this.getMostCommonIssues(falseNegatives),
      industryMisclassificationRate: industryMisclassifications.length / results.length,
      problematicIndustries: this.getProblematicIndustries(results)
    };
  }
  
  private getProblematicIndustries(results: EvaluationResult[]): string[] {
    const industryScores: Record<string, number[]> = {};
    
    for (const result of results) {
      const industry = result.job.industry;
      if (!industryScores[industry]) {
        industryScores[industry] = [];
      }
      industryScores[industry].push(result.overallScore);
    }
    
    const problematic: string[] = [];
    for (const [industry, scores] of Object.entries(industryScores)) {
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      if (avgScore < 0.7) {
        problematic.push(industry);
      }
    }
    
    return problematic;
  }
  
  private generateRecommendations(issues: CommonIssues, industryStats: Record<string, any>): string[] {
    const recommendations: string[] = [];
    
    // Task Extraction Verbesserungen
    if (issues.mostCommonFalsePositives.length > 0) {
      recommendations.push(
        `🔧 TASK EXTRACTION: Häufige False Positives verbessern: ${issues.mostCommonFalsePositives.slice(0, 3).map(fp => fp.issue).join(', ')}`
      );
    }
    
    if (issues.mostCommonFalseNegatives.length > 0) {
      recommendations.push(
        `🔧 TASK EXTRACTION: Häufig übersehene Aufgaben erkennen: ${issues.mostCommonFalseNegatives.slice(0, 3).map(fn => fn.issue).join(', ')}`
      );
    }
    
    // Branchenerkennung Verbesserungen
    if (issues.industryMisclassificationRate > 0.2) {
      recommendations.push(
        `🔧 INDUSTRY DETECTION: Branchenerkennung verbessern (${Math.round(issues.industryMisclassificationRate * 100)}% Fehlerrate)`
      );
    }
    
    if (issues.problematicIndustries.length > 0) {
      recommendations.push(
        `🔧 INDUSTRY SPECIFIC: Problematische Branchen optimieren: ${issues.problematicIndustries.join(', ')}`
      );
    }
    
    // Branchenspezifische Empfehlungen
    for (const [industry, stats] of Object.entries(industryStats)) {
      if (stats.avgOverallScore < 0.7) {
        recommendations.push(
          `🔧 ${industry.toUpperCase()}: Score verbessern (${Math.round(stats.avgOverallScore * 100)}%) - Task Accuracy: ${Math.round(stats.avgTaskAccuracy * 100)}%, Industry Accuracy: ${Math.round(stats.avgIndustryAccuracy * 100)}%`
        );
      }
    }
    
    return recommendations;
  }
}

// Type Definitions
interface TrainingReport {
  summary: {
    totalTests: number;
    avgTaskAccuracy: number;
    avgIndustryAccuracy: number;
    avgOverallScore: number;
  };
  industryStats: Record<string, any>;
  problemCases: EvaluationResult[];
  recommendations: string[];
  rawResults: EvaluationResult[];
}

interface CommonIssues {
  mostCommonFalsePositives: Array<{issue: string, count: number}>;
  mostCommonFalseNegatives: Array<{issue: string, count: number}>;
  industryMisclassificationRate: number;
  problematicIndustries: string[];
}

// Export für CLI Nutzung
export { TrainingSystem, JobGenerator, AnalysisEvaluator };

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const system = new TrainingSystem();
  
  const iterations = process.argv[2] ? parseInt(process.argv[2]) : 30;
  
  system.runTrainingCycle(iterations).then(report => {
    console.log('\n🎯 TRAINING REPORT');
    console.log('==================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Avg Task Accuracy: ${Math.round(report.summary.avgTaskAccuracy * 100)}%`);
    console.log(`Avg Industry Accuracy: ${Math.round(report.summary.avgIndustryAccuracy * 100)}%`);
    console.log(`Avg Overall Score: ${Math.round(report.summary.avgOverallScore * 100)}%`);
    
    console.log('\n🔍 RECOMMENDATIONS');
    console.log('==================');
    report.recommendations.forEach(rec => console.log(rec));
    
    console.log('\n📊 INDUSTRY BREAKDOWN');
    console.log('=====================');
    for (const [industry, stats] of Object.entries(report.industryStats)) {
      console.log(`${industry}: ${Math.round(stats.avgOverallScore * 100)}% (Tasks: ${Math.round(stats.avgTaskAccuracy * 100)}%, Industry: ${Math.round(stats.avgIndustryAccuracy * 100)}%)`);
    }
    
    if (report.problemCases.length > 0) {
      console.log('\n❌ TOP PROBLEM CASES');
      console.log('====================');
      report.problemCases.slice(0, 5).forEach((case_, i) => {
        console.log(`${i + 1}. ${case_.job.title} (${case_.job.industry}) - Score: ${Math.round(case_.overallScore * 100)}%`);
        if (case_.falsePositives.length > 0) {
          console.log(`   False Positives: ${case_.falsePositives.slice(0, 2).join(', ')}`);
        }
        if (case_.falseNegatives.length > 0) {
          console.log(`   False Negatives: ${case_.falseNegatives.slice(0, 2).join(', ')}`);
        }
      });
    }
  }).catch(console.error);
}
