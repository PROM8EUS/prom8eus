#!/usr/bin/env node

/**
 * Vollständige Training-Pipeline für Stellenanzeigen-Analyse
 * 
 * Diese Pipeline:
 * 1. Führt Training-Zyklen durch
 * 2. Bewertet Ergebnisse
 * 3. Generiert Verbesserungsvorschläge
 * 4. Wendet Verbesserungen automatisch an
 * 5. Validiert Verbesserungen mit neuen Tests
 * 6. Wiederholt bis Ziel erreicht oder Max-Iterationen
 */

import { TrainingSystem } from './auto-training-system';
import { AlgorithmImprover } from './algorithm-improver';
import * as fs from 'fs';
import * as path from 'path';

interface PipelineConfig {
  maxIterations: number;
  targetScore: number;
  testsPerIteration: number;
  maxImprovementsPerIteration: number;
  saveResults: boolean;
  verbose: boolean;
}

interface PipelineResult {
  iteration: number;
  beforeScore: number;
  afterScore: number;
  improvements: number;
  totalTime: number;
  finalReport: any;
}

class TrainingPipeline {
  private trainingSystem = new TrainingSystem();
  private improver = new AlgorithmImprover();
  private resultsDir = path.join(process.cwd(), 'scripts', 'training-results');
  
  constructor(private config: PipelineConfig) {
    if (config.saveResults && !fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }
  
  /**
   * Startet die vollständige Training-Pipeline
   */
  async run(): Promise<PipelineResult[]> {
    console.log('🚀 Starting Training Pipeline');
    console.log('============================');
    console.log(`Max Iterations: ${this.config.maxIterations}`);
    console.log(`Target Score: ${Math.round(this.config.targetScore * 100)}%`);
    console.log(`Tests per Iteration: ${this.config.testsPerIteration}`);
    console.log('');
    
    const results: PipelineResult[] = [];
    let currentScore = 0;
    
    for (let iteration = 1; iteration <= this.config.maxIterations; iteration++) {
      console.log(`\n🔄 Iteration ${iteration}/${this.config.maxIterations}`);
      console.log('================================');
      
      const iterationStart = Date.now();
      
      try {
        // 1. Training durchführen
        console.log('📊 Running training cycle...');
        const report = await this.trainingSystem.runTrainingCycle(this.config.testsPerIteration);
        const beforeScore = report.summary.avgOverallScore;
        
        console.log(`Current Score: ${Math.round(beforeScore * 100)}%`);
        console.log(`Task Accuracy: ${Math.round(report.summary.avgTaskAccuracy * 100)}%`);
        console.log(`Industry Accuracy: ${Math.round(report.summary.avgIndustryAccuracy * 100)}%`);
        
        // 2. Ziel erreicht?
        if (beforeScore >= this.config.targetScore) {
          console.log(`🎯 Target score ${Math.round(this.config.targetScore * 100)}% reached!`);
          
          results.push({
            iteration,
            beforeScore,
            afterScore: beforeScore,
            improvements: 0,
            totalTime: Date.now() - iterationStart,
            finalReport: report
          });
          
          break;
        }
        
        // 3. Verbesserungen analysieren und anwenden
        console.log('🔧 Analyzing and applying improvements...');
        const suggestions = this.improver.analyzeAndImprove(report);
        
        if (suggestions.length === 0) {
          console.log('❌ No improvements found - pipeline complete');
          break;
        }
        
        console.log(`Found ${suggestions.length} improvement suggestions:`);
        suggestions.slice(0, 5).forEach((s, i) => {
          console.log(`  ${i + 1}. [${s.priority.toUpperCase()}] ${s.description} (Expected: +${Math.round(s.expectedImprovement * 100)}%)`);
        });
        
        // Wende Top-Verbesserungen an
        const topSuggestions = suggestions.slice(0, this.config.maxImprovementsPerIteration);
        const appliedImprovements = await this.improver.applyImprovements(topSuggestions);
        
        const successfulImprovements = appliedImprovements.filter(ai => ai.success);
        console.log(`✅ Applied ${successfulImprovements.length}/${topSuggestions.length} improvements`);
        
        // 4. Validierung mit neuen Tests
        let afterScore = beforeScore;
        if (successfulImprovements.length > 0) {
          console.log('🧪 Validating improvements...');
          const validationReport = await this.trainingSystem.runTrainingCycle(Math.floor(this.config.testsPerIteration / 2));
          afterScore = validationReport.summary.avgOverallScore;
          
          const improvement = afterScore - beforeScore;
          console.log(`Validation Score: ${Math.round(afterScore * 100)}% (${improvement >= 0 ? '+' : ''}${Math.round(improvement * 100)}%)`);
          
          if (improvement < 0) {
            console.log('⚠️  Score decreased - reverting changes...');
            await this.revertChanges(successfulImprovements);
            afterScore = beforeScore;
          }
        }
        
        // 5. Ergebnisse speichern
        const iterationResult: PipelineResult = {
          iteration,
          beforeScore,
          afterScore,
          improvements: successfulImprovements.length,
          totalTime: Date.now() - iterationStart,
          finalReport: report
        };
        
        results.push(iterationResult);
        
        if (this.config.saveResults) {
          await this.saveIterationResults(iteration, {
            config: this.config,
            report,
            suggestions,
            appliedImprovements,
            result: iterationResult
          });
          
          // Cleanup old files
          this.cleanupOldFiles();
        }
        
        currentScore = afterScore;
        
        console.log(`Iteration ${iteration} completed in ${Math.round(iterationResult.totalTime / 1000)}s`);
        
      } catch (error) {
        console.error(`❌ Error in iteration ${iteration}:`, error);
        break;
      }
    }
    
    // Final Summary
    console.log('\n🏁 Training Pipeline Complete');
    console.log('=============================');
    this.printFinalSummary(results);
    
    return results;
  }
  
  /**
   * Macht Änderungen rückgängig wenn sie die Performance verschlechtern
   */
  private async revertChanges(appliedImprovements: any[]): Promise<void> {
    for (const improvement of appliedImprovements) {
      for (const file of improvement.filesModified) {
        // Finde das neueste Backup
        const filePath = path.join(process.cwd(), file);
        const dir = path.dirname(filePath);
        const filename = path.basename(filePath);
        
        const backupFiles = fs.readdirSync(dir)
          .filter(f => f.startsWith(`${filename}.backup.`))
          .sort((a, b) => {
            const aTime = parseInt(a.split('.backup.')[1]);
            const bTime = parseInt(b.split('.backup.')[1]);
            return bTime - aTime; // Neueste zuerst
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
   * Bereinigt alte Dateien nach dem Training
   */
  private cleanupOldFiles(): void {
    try {
      // Cleanup training results (keep only last 10 iterations)
      if (fs.existsSync(this.resultsDir)) {
        const files = fs.readdirSync(this.resultsDir)
          .filter(f => f.endsWith('.json'))
          .map(f => ({ name: f, path: path.join(this.resultsDir, f), time: fs.statSync(path.join(this.resultsDir, f)).mtime.getTime() }))
          .sort((a, b) => b.time - a.time);
        
        // Keep only last 10 files
        if (files.length > 10) {
          files.slice(10).forEach(file => {
            fs.unlinkSync(file.path);
            console.log(`🗑️  Cleaned up old training file: ${file.name}`);
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
                console.log(`🗑️  Cleaned up old backup: ${file.name}`);
              });
            }
          });
        }
      }
      
      console.log('🧹 Cleanup completed');
      
    } catch (error) {
      console.warn('⚠️  Cleanup failed:', error);
    }
  }
  
  /**
   * Speichert Ergebnisse einer Iteration
   */
  private async saveIterationResults(iteration: number, data: any): Promise<void> {
    const filename = `iteration-${iteration.toString().padStart(3, '0')}-${Date.now()}.json`;
    const filepath = path.join(this.resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    if (this.config.verbose) {
      console.log(`💾 Saved results to ${filename}`);
    }
  }
  
  /**
   * Druckt finale Zusammenfassung
   */
  private printFinalSummary(results: PipelineResult[]): void {
    if (results.length === 0) return;
    
    const first = results[0];
    const last = results[results.length - 1];
    const totalImprovement = last.afterScore - first.beforeScore;
    const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
    const totalImprovements = results.reduce((sum, r) => sum + r.improvements, 0);
    
    console.log(`Iterations: ${results.length}`);
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
    
    // Top 3 Iterationen nach Verbesserung
    const sortedByImprovement = [...results]
      .map(r => ({...r, improvement: r.afterScore - r.beforeScore}))
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 3);
    
    console.log('\n🏆 Top Improvements:');
    sortedByImprovement.forEach((r, i) => {
      console.log(`  ${i + 1}. Iteration ${r.iteration}: +${Math.round(r.improvement * 100)}% (${r.improvements} changes)`);
    });
  }
  
  /**
   * Generiert Performance-Report
   */
  generatePerformanceReport(results: PipelineResult[]): string {
    const report = [
      '# Training Pipeline Performance Report',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      `- Total Iterations: ${results.length}`,
      `- Target Score: ${Math.round(this.config.targetScore * 100)}%`,
      `- Tests per Iteration: ${this.config.testsPerIteration}`,
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
        `- Target ${last.afterScore >= this.config.targetScore ? '✅ REACHED' : '❌ NOT REACHED'}`,
        ''
      );
      
      report.push('## Iteration Details');
      report.push('| Iteration | Before | After | Δ | Improvements | Time |');
      report.push('|-----------|--------|-------|---|-------------|------|');
      
      results.forEach(r => {
        const delta = r.afterScore - r.beforeScore;
        report.push(`| ${r.iteration} | ${Math.round(r.beforeScore * 100)}% | ${Math.round(r.afterScore * 100)}% | ${delta >= 0 ? '+' : ''}${Math.round(delta * 100)}% | ${r.improvements} | ${Math.round(r.totalTime / 1000)}s |`);
      });
    }
    
    return report.join('\n');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  const config: PipelineConfig = {
    maxIterations: parseInt(args[0]) || 5,
    targetScore: parseFloat(args[1]) || 0.85,
    testsPerIteration: parseInt(args[2]) || 30,
    maxImprovementsPerIteration: parseInt(args[3]) || 3,
    saveResults: args.includes('--save') || args.includes('-s'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npm run train [iterations] [target] [tests] [improvements] [options]

Arguments:
  iterations  Max iterations (default: 5)
  target      Target score 0-1 (default: 0.85)
  tests       Tests per iteration (default: 30)
  improvements Max improvements per iteration (default: 3)

Options:
  --save, -s     Save detailed results
  --verbose, -v  Verbose output
  --help, -h     Show this help

Examples:
  npm run train                    # Default settings
  npm run train 10 0.9 50 5        # 10 iterations, 90% target, 50 tests, 5 improvements
  npm run train 3 0.8 20 2 --save  # Save results to files
`);
    process.exit(0);
  }
  
  console.log('🧠 AI-Powered Training Pipeline for Job Analysis');
  console.log('================================================');
  
  const pipeline = new TrainingPipeline(config);
  
  try {
    const results = await pipeline.run();
    
    if (config.saveResults && results.length > 0) {
      const reportPath = path.join(process.cwd(), 'scripts', 'training-results', `performance-report-${Date.now()}.md`);
      const report = pipeline.generatePerformanceReport(results);
      fs.writeFileSync(reportPath, report);
      console.log(`\n📊 Performance report saved to: ${reportPath}`);
    }
    
    process.exit(results.length > 0 && results[results.length - 1].afterScore >= config.targetScore ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

// Export für Programmnutzung
export { TrainingPipeline, PipelineConfig, PipelineResult };

// CLI Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
