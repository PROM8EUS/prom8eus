#!/usr/bin/env node

/**
 * Intensives Training-System mit erweiterten Variationen
 * 
 * Features:
 * - 200+ verschiedene Stellenanzeigen-Variationen
 * - Erweiterte Aufgaben-Erkennung
 * - Detaillierte Branchen-Analyse
 * - Kontinuierliche Verbesserung
 */

import { TrainingSystem } from './auto-training-system';
import { AlgorithmImprover } from './algorithm-improver';
import * as fs from 'fs';
import * as path from 'path';

interface IntensiveTrainingConfig {
  maxIterations: number;
  targetScore: number;
  testsPerIteration: number;
  maxImprovementsPerIteration: number;
  saveResults: boolean;
  deleteAfterTest: boolean;
  verbose: boolean;
  focusAreas: ('task_extraction' | 'industry_detection' | 'qualification_filtering')[];
}

interface IntensiveTrainingResult {
  iteration: number;
  beforeScore: number;
  afterScore: number;
  taskAccuracy: number;
  industryAccuracy: number;
  improvements: number;
  totalTime: number;
  detailedAnalysis: any;
}

class IntensiveTrainingSystem {
  private trainingSystem = new TrainingSystem();
  private improver = new AlgorithmImprover();
  private resultsDir = path.join(process.cwd(), 'scripts', 'intensive-training-results');
  
  constructor(private config: IntensiveTrainingConfig) {
    if (config.saveResults && !fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }
  
  /**
   * Startet intensives Training mit erweiterten Variationen
   */
  async runIntensiveTraining(): Promise<IntensiveTrainingResult[]> {
    console.log('🧠 INTENSIVE TRAINING SYSTEM');
    console.log('============================');
    console.log(`Max Iterations: ${this.config.maxIterations}`);
    console.log(`Target Score: ${Math.round(this.config.targetScore * 100)}%`);
    console.log(`Tests per Iteration: ${this.config.testsPerIteration}`);
    console.log(`Focus Areas: ${this.config.focusAreas.join(', ')}`);
    console.log('');
    
    const results: IntensiveTrainingResult[] = [];
    let currentScore = 0;
    let consecutiveNoImprovement = 0;
    
    for (let iteration = 1; iteration <= this.config.maxIterations; iteration++) {
      console.log(`\n🔥 INTENSIVE ITERATION ${iteration}/${this.config.maxIterations}`);
      console.log('==========================================');
      
      const iterationStart = Date.now();
      
      try {
        // 1. Erweiterte Training-Daten generieren
        console.log('📊 Generating extended training data...');
        const report = await this.trainingSystem.runTrainingCycle(this.config.testsPerIteration);
        const beforeScore = report.summary.avgOverallScore;
        const taskAccuracy = report.summary.avgTaskAccuracy;
        const industryAccuracy = report.summary.avgIndustryAccuracy;
        
        console.log(`Current Score: ${Math.round(beforeScore * 100)}%`);
        console.log(`Task Accuracy: ${Math.round(taskAccuracy * 100)}%`);
        console.log(`Industry Accuracy: ${Math.round(industryAccuracy * 100)}%`);
        
        // 2. Detaillierte Analyse
        const detailedAnalysis = this.analyzeDetailedResults(report);
        this.printDetailedAnalysis(detailedAnalysis);
        
        // 3. Ziel erreicht?
        if (beforeScore >= this.config.targetScore) {
          console.log(`🎯 TARGET SCORE ${Math.round(this.config.targetScore * 100)}% REACHED!`);
          
          results.push({
            iteration,
            beforeScore,
            afterScore: beforeScore,
            taskAccuracy,
            industryAccuracy,
            improvements: 0,
            totalTime: Date.now() - iterationStart,
            detailedAnalysis
          });
          
          break;
        }
        
        // 4. Fokus-spezifische Verbesserungen
        console.log('🔧 Analyzing focus-specific improvements...');
        const suggestions = this.improver.analyzeAndImprove(report);
        const filteredSuggestions = this.filterSuggestionsByFocus(suggestions);
        
        if (filteredSuggestions.length === 0) {
          console.log('❌ No focus-specific improvements found');
          consecutiveNoImprovement++;
          
          if (consecutiveNoImprovement >= 3) {
            console.log('⚠️  No improvements for 3 consecutive iterations - stopping');
            break;
          }
        } else {
          consecutiveNoImprovement = 0;
        }
        
        console.log(`Found ${filteredSuggestions.length} focus-specific improvements:`);
        filteredSuggestions.slice(0, 5).forEach((s, i) => {
          console.log(`  ${i + 1}. [${s.priority.toUpperCase()}] ${s.description} (Expected: +${Math.round(s.expectedImprovement * 100)}%)`);
        });
        
        // 5. Verbesserungen anwenden
        let afterScore = beforeScore;
        let improvementsApplied = 0;
        
        if (filteredSuggestions.length > 0) {
          const topSuggestions = filteredSuggestions.slice(0, this.config.maxImprovementsPerIteration);
          const appliedImprovements = await this.improver.applyImprovements(topSuggestions);
          
          const successfulImprovements = appliedImprovements.filter(ai => ai.success);
          improvementsApplied = successfulImprovements.length;
          
          console.log(`✅ Applied ${improvementsApplied}/${topSuggestions.length} improvements`);
          
          // 6. Validierung mit erweiterten Tests
          if (successfulImprovements.length > 0) {
            console.log('🧪 Validating with extended tests...');
            const validationReport = await this.trainingSystem.runTrainingCycle(Math.floor(this.config.testsPerIteration * 0.8));
            afterScore = validationReport.summary.avgOverallScore;
            
            const improvement = afterScore - beforeScore;
            console.log(`Validation Score: ${Math.round(afterScore * 100)}% (${improvement >= 0 ? '+' : ''}${Math.round(improvement * 100)}%)`);
            
            if (improvement < 0) {
              console.log('⚠️  Score decreased - reverting changes...');
              await this.revertChanges(successfulImprovements);
              afterScore = beforeScore;
              improvementsApplied = 0;
            }
          }
        }
        
        // 7. Ergebnisse speichern
        const iterationResult: IntensiveTrainingResult = {
          iteration,
          beforeScore,
          afterScore,
          taskAccuracy,
          industryAccuracy,
          improvements: improvementsApplied,
          totalTime: Date.now() - iterationStart,
          detailedAnalysis
        };
        
        results.push(iterationResult);
        
        if (this.config.saveResults) {
          await this.saveIntensiveResults(iteration, {
            config: this.config,
            report,
            suggestions: filteredSuggestions,
            result: iterationResult
          });
          
          // Cleanup old files
          this.cleanupOldFiles();
        }
        
        // Delete immediately after test if requested
        if (this.config.deleteAfterTest) {
          this.deleteIterationFiles(iteration);
        }
        
        currentScore = afterScore;
        
        console.log(`🔥 Intensive Iteration ${iteration} completed in ${Math.round(iterationResult.totalTime / 1000)}s`);
        
      } catch (error) {
        console.error(`❌ Error in intensive iteration ${iteration}:`, error);
        break;
      }
    }
    
    // Final Summary
    console.log('\n🏁 INTENSIVE TRAINING COMPLETE');
    console.log('==============================');
    this.printIntensiveSummary(results);
    
    return results;
  }
  
  /**
   * Analysiert Ergebnisse detailliert
   */
  private analyzeDetailedResults(report: any): any {
    const analysis = {
      taskAnalysis: {
        totalTasks: 0,
        correctlyIdentified: 0,
        falsePositives: 0,
        falseNegatives: 0,
        commonFalsePositives: [],
        commonFalseNegatives: [],
        taskCategories: {}
      },
      industryAnalysis: {
        totalIndustries: 0,
        correctlyIdentified: 0,
        misclassifications: {},
        problematicIndustries: []
      },
      overallAnalysis: {
        scoreDistribution: {},
        improvementAreas: []
      }
    };
    
    // Task Analysis
    for (const result of report.rawResults) {
      analysis.taskAnalysis.totalTasks += result.job.expectedTaskCount;
      analysis.taskAnalysis.correctlyIdentified += result.taskAccuracy * result.job.expectedTaskCount;
      analysis.taskAnalysis.falsePositives += result.falsePositives.length;
      analysis.taskAnalysis.falseNegatives += result.falseNegatives.length;
      
      // Task Categories
      const industry = result.job.industry;
      if (!analysis.taskAnalysis.taskCategories[industry]) {
        analysis.taskAnalysis.taskCategories[industry] = {
          total: 0,
          correct: 0,
          accuracy: 0
        };
      }
      analysis.taskAnalysis.taskCategories[industry].total += result.job.expectedTaskCount;
      analysis.taskAnalysis.taskCategories[industry].correct += result.taskAccuracy * result.job.expectedTaskCount;
    }
    
    // Industry Analysis
    for (const result of report.rawResults) {
      analysis.industryAnalysis.totalIndustries++;
      if (result.industryAccuracy === 1) {
        analysis.industryAnalysis.correctlyIdentified++;
      } else {
        const expected = result.job.expectedIndustry;
        const detected = result.analysis.detectedIndustry;
        const key = `${expected}->${detected}`;
        analysis.industryAnalysis.misclassifications[key] = (analysis.industryAnalysis.misclassifications[key] || 0) + 1;
      }
    }
    
    // Common Issues
    const allFalsePositives = report.rawResults.flatMap(r => r.falsePositives);
    const allFalseNegatives = report.rawResults.flatMap(r => r.falseNegatives);
    
    analysis.taskAnalysis.commonFalsePositives = this.getMostCommon(allFalsePositives, 5);
    analysis.taskAnalysis.commonFalseNegatives = this.getMostCommon(allFalseNegatives, 5);
    
    return analysis;
  }
  
  /**
   * Druckt detaillierte Analyse
   */
  private printDetailedAnalysis(analysis: any): void {
    console.log('\n📊 DETAILED ANALYSIS');
    console.log('===================');
    
    // Task Analysis
    const taskAccuracy = analysis.taskAnalysis.totalTasks > 0 
      ? analysis.taskAnalysis.correctlyIdentified / analysis.taskAnalysis.totalTasks 
      : 0;
    
    console.log(`Task Recognition:`);
    console.log(`  Accuracy: ${Math.round(taskAccuracy * 100)}%`);
    console.log(`  False Positives: ${analysis.taskAnalysis.falsePositives}`);
    console.log(`  False Negatives: ${analysis.taskAnalysis.falseNegatives}`);
    
    if (analysis.taskAnalysis.commonFalsePositives.length > 0) {
      console.log(`  Common False Positives: ${analysis.taskAnalysis.commonFalsePositives.map(fp => fp.issue).join(', ')}`);
    }
    
    if (analysis.taskAnalysis.commonFalseNegatives.length > 0) {
      console.log(`  Common False Negatives: ${analysis.taskAnalysis.commonFalseNegatives.map(fn => fn.issue).join(', ')}`);
    }
    
    // Industry Analysis
    const industryAccuracy = analysis.industryAnalysis.totalIndustries > 0
      ? analysis.industryAnalysis.correctlyIdentified / analysis.industryAnalysis.totalIndustries
      : 0;
    
    console.log(`\nIndustry Recognition:`);
    console.log(`  Accuracy: ${Math.round(industryAccuracy * 100)}%`);
    
    if (Object.keys(analysis.industryAnalysis.misclassifications).length > 0) {
      console.log(`  Common Misclassifications:`);
      Object.entries(analysis.industryAnalysis.misclassifications)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .forEach(([misclassification, count]) => {
          console.log(`    ${misclassification}: ${count} times`);
        });
    }
  }
  
  /**
   * Filtert Verbesserungsvorschläge nach Fokus-Bereichen
   */
  private filterSuggestionsByFocus(suggestions: any[]): any[] {
    return suggestions.filter(suggestion => 
      this.config.focusAreas.includes(suggestion.type)
    );
  }
  
  /**
   * Macht Änderungen rückgängig
   */
  private async revertChanges(appliedImprovements: any[]): Promise<void> {
    for (const improvement of appliedImprovements) {
      for (const file of improvement.filesModified) {
        const filePath = path.join(process.cwd(), file);
        const dir = path.dirname(filePath);
        const filename = path.basename(filePath);
        
        const backupFiles = fs.readdirSync(dir)
          .filter(f => f.startsWith(`${filename}.backup.`))
          .sort((a, b) => {
            const aTime = parseInt(a.split('.backup.')[1]);
            const bTime = parseInt(b.split('.backup.')[1]);
            return bTime - aTime;
          });
        
        if (backupFiles.length > 0) {
          const latestBackup = path.join(dir, backupFiles[0]);
          fs.copyFileSync(latestBackup, filePath);
          console.log(`🔄 Reverted ${file}`);
        }
      }
    }
  }
  
  /**
   * Löscht Iterations-Dateien sofort nach dem Test
   */
  private deleteIterationFiles(iteration: number): void {
    try {
      // Delete intensive training file
      const intensiveResultsDir = path.join(process.cwd(), 'scripts', 'intensive-training-results');
      if (fs.existsSync(intensiveResultsDir)) {
        const files = fs.readdirSync(intensiveResultsDir)
          .filter(f => f.includes(`intensive-iteration-${iteration.toString().padStart(3, '0')}`));
        
        files.forEach(file => {
          const filepath = path.join(intensiveResultsDir, file);
          fs.unlinkSync(filepath);
          if (this.config.verbose) {
            console.log(`🗑️  Deleted iteration file: ${file}`);
          }
        });
      }
      
      // Delete training file
      const trainingResultsDir = path.join(process.cwd(), 'scripts', 'training-results');
      if (fs.existsSync(trainingResultsDir)) {
        const files = fs.readdirSync(trainingResultsDir)
          .filter(f => f.includes(`iteration-${iteration.toString().padStart(3, '0')}`));
        
        files.forEach(file => {
          const filepath = path.join(trainingResultsDir, file);
          fs.unlinkSync(filepath);
          if (this.config.verbose) {
            console.log(`🗑️  Deleted training file: ${file}`);
          }
        });
      }
      
    } catch (error) {
      console.warn('⚠️  Failed to delete iteration files:', error);
    }
  }
  
  /**
   * Speichert intensive Ergebnisse
   */
  private async saveIntensiveResults(iteration: number, data: any): Promise<void> {
    const filename = `intensive-iteration-${iteration.toString().padStart(3, '0')}-${Date.now()}.json`;
    const filepath = path.join(this.resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    if (this.config.verbose) {
      console.log(`💾 Saved intensive results to ${filename}`);
    }
    
    // Cleanup old files
    this.cleanupOldFiles();
  }
  
  /**
   * Bereinigt alte Dateien nach dem Training
   */
  private cleanupOldFiles(): void {
    try {
      // Cleanup training results (keep only last 10 iterations)
      const trainingResultsDir = path.join(process.cwd(), 'scripts', 'training-results');
      if (fs.existsSync(trainingResultsDir)) {
        const files = fs.readdirSync(trainingResultsDir)
          .filter(f => f.endsWith('.json'))
          .map(f => ({ name: f, path: path.join(trainingResultsDir, f), time: fs.statSync(path.join(trainingResultsDir, f)).mtime.getTime() }))
          .sort((a, b) => b.time - a.time);
        
        // Keep only last 10 files
        if (files.length > 10) {
          files.slice(10).forEach(file => {
            fs.unlinkSync(file.path);
            if (this.config.verbose) {
              console.log(`🗑️  Cleaned up old training file: ${file.name}`);
            }
          });
        }
      }
      
      // Cleanup intensive training results (keep only last 5 iterations)
      if (fs.existsSync(this.resultsDir)) {
        const files = fs.readdirSync(this.resultsDir)
          .filter(f => f.endsWith('.json'))
          .map(f => ({ name: f, path: path.join(this.resultsDir, f), time: fs.statSync(path.join(this.resultsDir, f)).mtime.getTime() }))
          .sort((a, b) => b.time - a.time);
        
        // Keep only last 5 files
        if (files.length > 5) {
          files.slice(5).forEach(file => {
            fs.unlinkSync(file.path);
            if (this.config.verbose) {
              console.log(`🗑️  Cleaned up old intensive file: ${file.name}`);
            }
          });
        }
      }
      
      // Cleanup backup files (keep only last 3 backups per file)
      const srcDir = path.join(process.cwd(), 'src');
      if (fs.existsSync(srcDir)) {
        const libDir = path.join(srcDir, 'lib');
        if (fs.existsSync(libDir)) {
          const backupFiles = fs.readdirSync(libDir)
            .filter(f => f.includes('.backup.'))
            .map(f => ({ name: f, path: path.join(libDir, f), time: fs.statSync(path.join(libDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);
          
          // Group by base filename
          const backupGroups: Record<string, typeof backupFiles> = {};
          backupFiles.forEach(file => {
            const baseName = file.name.split('.backup.')[0];
            if (!backupGroups[baseName]) {
              backupGroups[baseName] = [];
            }
            backupGroups[baseName].push(file);
          });
          
          // Keep only last 3 backups per file
          Object.values(backupGroups).forEach(group => {
            if (group.length > 3) {
              group.slice(3).forEach(file => {
                fs.unlinkSync(file.path);
                if (this.config.verbose) {
                  console.log(`🗑️  Cleaned up old backup: ${file.name}`);
                }
              });
            }
          });
        }
      }
      
      if (this.config.verbose) {
        console.log('🧹 Cleanup completed');
      }
      
    } catch (error) {
      console.warn('⚠️  Cleanup failed:', error);
    }
  }
  
  /**
   * Druckt intensive Zusammenfassung
   */
  private printIntensiveSummary(results: IntensiveTrainingResult[]): void {
    if (results.length === 0) return;
    
    const first = results[0];
    const last = results[results.length - 1];
    const totalImprovement = last.afterScore - first.beforeScore;
    const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
    const totalImprovements = results.reduce((sum, r) => sum + r.improvements, 0);
    
    console.log(`Intensive Iterations: ${results.length}`);
    console.log(`Initial Score: ${Math.round(first.beforeScore * 100)}%`);
    console.log(`Final Score: ${Math.round(last.afterScore * 100)}%`);
    console.log(`Total Improvement: ${totalImprovement >= 0 ? '+' : ''}${Math.round(totalImprovement * 100)}%`);
    console.log(`Total Improvements Applied: ${totalImprovements}`);
    console.log(`Total Time: ${Math.round(totalTime / 1000)}s`);
    
    if (last.afterScore >= this.config.targetScore) {
      console.log('🎯 TARGET REACHED! ');
    } else {
      console.log(`🎯 Target: ${Math.round(this.config.targetScore * 100)}% (${Math.round((this.config.targetScore - last.afterScore) * 100)}% remaining)`);
    }
    
    // Top 5 Verbesserungen
    const sortedByImprovement = [...results]
      .map(r => ({...r, improvement: r.afterScore - r.beforeScore}))
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5);
    
    console.log('\n🏆 Top 5 Improvements:');
    sortedByImprovement.forEach((r, i) => {
      console.log(`  ${i + 1}. Iteration ${r.iteration}: +${Math.round(r.improvement * 100)}% (${r.improvements} changes)`);
    });
  }
  
  /**
   * Hilfsfunktion für häufigste Elemente
   */
  private getMostCommon(items: string[], count: number): Array<{issue: string, count: number}> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item] = (counts[item] || 0) + 1;
    }
    
    return Object.entries(counts)
      .map(([issue, count]) => ({issue, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, count);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  const config: IntensiveTrainingConfig = {
    maxIterations: parseInt(args[0]) || 15,
    targetScore: parseFloat(args[1]) || 0.9,
    testsPerIteration: parseInt(args[2]) || 100,
    maxImprovementsPerIteration: parseInt(args[3]) || 5,
    saveResults: args.includes('--save') || args.includes('-s'),
    deleteAfterTest: args.includes('--delete-after') || args.includes('-d'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    focusAreas: ['task_extraction', 'industry_detection', 'qualification_filtering']
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npm run intensive [iterations] [target] [tests] [improvements] [options]

Arguments:
  iterations  Max iterations (default: 15)
  target      Target score 0-1 (default: 0.9)
  tests       Tests per iteration (default: 100)
  improvements Max improvements per iteration (default: 5)

Options:
  --save, -s           Save detailed results
  --delete-after, -d   Delete files immediately after each test
  --verbose, -v        Verbose output
  --help, -h           Show this help

Examples:
  npm run intensive                    # Default settings
  npm run intensive 20 0.95 150 8      # 20 iterations, 95% target, 150 tests, 8 improvements
  npm run intensive 10 0.85 80 3 --save  # Save results to files
  npm run intensive 5 0.9 50 3 --delete-after  # Delete files after each test
`);
    process.exit(0);
  }
  
  console.log('🧠 INTENSIVE TRAINING SYSTEM');
  console.log('============================');
  
  const intensiveSystem = new IntensiveTrainingSystem(config);
  
  try {
    const results = await intensiveSystem.runIntensiveTraining();
    
    if (config.saveResults && results.length > 0) {
      const reportPath = path.join(process.cwd(), 'scripts', 'intensive-training-results', `intensive-report-${Date.now()}.md`);
      const report = generateIntensiveReport(results, config);
      fs.writeFileSync(reportPath, report);
      console.log(`\n📊 Intensive report saved to: ${reportPath}`);
    }
    
    process.exit(results.length > 0 && results[results.length - 1].afterScore >= config.targetScore ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Intensive training failed:', error);
    process.exit(1);
  }
}

function generateIntensiveReport(results: IntensiveTrainingResult[], config: IntensiveTrainingConfig): string {
  const report = [
    '# Intensive Training Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Configuration',
    `- Max Iterations: ${config.maxIterations}`,
    `- Target Score: ${Math.round(config.targetScore * 100)}%`,
    `- Tests per Iteration: ${config.testsPerIteration}`,
    `- Focus Areas: ${config.focusAreas.join(', ')}`,
    ''
  ];
  
  if (results.length > 0) {
    const first = results[0];
    const last = results[results.length - 1];
    
    report.push(
      '## Results',
      `- Initial Score: ${Math.round(first.beforeScore * 100)}%`,
      `- Final Score: ${Math.round(last.afterScore * 100)}%`,
      `- Total Improvement: ${Math.round((last.afterScore - first.beforeScore) * 100)}%`,
      `- Target ${last.afterScore >= config.targetScore ? '✅ REACHED' : '❌ NOT REACHED'}`,
      ''
    );
    
    report.push('## Iteration Details');
    report.push('| Iteration | Score | Task Acc | Industry Acc | Improvements | Time |');
    report.push('|-----------|-------|----------|--------------|-------------|------|');
    
    results.forEach(r => {
      report.push(`| ${r.iteration} | ${Math.round(r.afterScore * 100)}% | ${Math.round(r.taskAccuracy * 100)}% | ${Math.round(r.industryAccuracy * 100)}% | ${r.improvements} | ${Math.round(r.totalTime / 1000)}s |`);
    });
  }
  
  return report.join('\n');
}

// Export für Programmnutzung
export { IntensiveTrainingSystem, IntensiveTrainingConfig, IntensiveTrainingResult };

// CLI Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
