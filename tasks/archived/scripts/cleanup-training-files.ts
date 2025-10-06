#!/usr/bin/env node

/**
 * Cleanup Script für Training-Dateien
 * 
 * Entfernt alte Training-Ergebnisse und Backup-Dateien
 */

import * as fs from 'fs';
import * as path from 'path';

interface CleanupConfig {
  keepTrainingFiles: number;
  keepIntensiveFiles: number;
  keepBackupsPerFile: number;
  verbose: boolean;
  dryRun: boolean;
}

class TrainingCleanup {
  private config: CleanupConfig;
  
  constructor(config: CleanupConfig) {
    this.config = config;
  }
  
  /**
   * Führt die Bereinigung durch
   */
  async runCleanup(): Promise<void> {
    console.log('🧹 TRAINING CLEANUP');
    console.log('===================');
    console.log(`Keep Training Files: ${this.config.keepTrainingFiles}`);
    console.log(`Keep Intensive Files: ${this.config.keepIntensiveFiles}`);
    console.log(`Keep Backups per File: ${this.config.keepBackupsPerFile}`);
    console.log(`Dry Run: ${this.config.dryRun ? 'Yes' : 'No'}`);
    console.log('');
    
    let totalCleaned = 0;
    
    // 1. Cleanup training results
    const trainingCleaned = await this.cleanupTrainingResults();
    totalCleaned += trainingCleaned;
    
    // 2. Cleanup intensive training results
    const intensiveCleaned = await this.cleanupIntensiveResults();
    totalCleaned += intensiveCleaned;
    
    // 3. Cleanup backup files
    const backupCleaned = await this.cleanupBackupFiles();
    totalCleaned += backupCleaned;
    
    // 4. Cleanup old reports
    const reportCleaned = await this.cleanupOldReports();
    totalCleaned += reportCleaned;
    
    console.log('\n🏁 CLEANUP COMPLETE');
    console.log('===================');
    console.log(`Total files cleaned: ${totalCleaned}`);
    
    if (this.config.dryRun) {
      console.log('⚠️  This was a dry run - no files were actually deleted');
    }
  }
  
  /**
   * Bereinigt normale Training-Ergebnisse
   */
  private async cleanupTrainingResults(): Promise<number> {
    const trainingResultsDir = path.join(process.cwd(), 'scripts', 'training-results');
    if (!fs.existsSync(trainingResultsDir)) {
      return 0;
    }
    
    const files = fs.readdirSync(trainingResultsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({ 
        name: f, 
        path: path.join(trainingResultsDir, f), 
        time: fs.statSync(path.join(trainingResultsDir, f)).mtime.getTime() 
      }))
      .sort((a, b) => b.time - a.time);
    
    const toDelete = files.slice(this.config.keepTrainingFiles);
    
    if (toDelete.length > 0) {
      console.log(`📁 Training Results: ${toDelete.length} files to clean`);
      
      toDelete.forEach(file => {
        if (this.config.verbose) {
          console.log(`  🗑️  ${file.name}`);
        }
        
        if (!this.config.dryRun) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    return toDelete.length;
  }
  
  /**
   * Bereinigt intensive Training-Ergebnisse
   */
  private async cleanupIntensiveResults(): Promise<number> {
    const intensiveResultsDir = path.join(process.cwd(), 'scripts', 'intensive-training-results');
    if (!fs.existsSync(intensiveResultsDir)) {
      return 0;
    }
    
    const files = fs.readdirSync(intensiveResultsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({ 
        name: f, 
        path: path.join(intensiveResultsDir, f), 
        time: fs.statSync(path.join(intensiveResultsDir, f)).mtime.getTime() 
      }))
      .sort((a, b) => b.time - a.time);
    
    const toDelete = files.slice(this.config.keepIntensiveFiles);
    
    if (toDelete.length > 0) {
      console.log(`📁 Intensive Results: ${toDelete.length} files to clean`);
      
      toDelete.forEach(file => {
        if (this.config.verbose) {
          console.log(`  🗑️  ${file.name}`);
        }
        
        if (!this.config.dryRun) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    return toDelete.length;
  }
  
  /**
   * Bereinigt Backup-Dateien
   */
  private async cleanupBackupFiles(): Promise<number> {
    const srcDir = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcDir)) {
      return 0;
    }
    
    const libDir = path.join(srcDir, 'lib');
    if (!fs.existsSync(libDir)) {
      return 0;
    }
    
    const backupFiles = fs.readdirSync(libDir)
      .filter(f => f.includes('.backup.'))
      .map(f => ({ 
        name: f, 
        path: path.join(libDir, f), 
        time: fs.statSync(path.join(libDir, f)).mtime.getTime() 
      }))
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
    
    let totalDeleted = 0;
    
    Object.entries(backupGroups).forEach(([baseName, group]) => {
      const toDelete = group.slice(this.config.keepBackupsPerFile);
      
      if (toDelete.length > 0) {
        if (this.config.verbose) {
          console.log(`📁 Backups for ${baseName}: ${toDelete.length} files to clean`);
        }
        
        toDelete.forEach(file => {
          if (this.config.verbose) {
            console.log(`  🗑️  ${file.name}`);
          }
          
          if (!this.config.dryRun) {
            fs.unlinkSync(file.path);
          }
        });
        
        totalDeleted += toDelete.length;
      }
    });
    
    return totalDeleted;
  }
  
  /**
   * Bereinigt alte Reports
   */
  private async cleanupOldReports(): Promise<number> {
    const reportsDir = path.join(process.cwd(), 'scripts');
    if (!fs.existsSync(reportsDir)) {
      return 0;
    }
    
    const reportFiles = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith('.md') && (f.includes('report') || f.includes('performance')))
      .map(f => ({ 
        name: f, 
        path: path.join(reportsDir, f), 
        time: fs.statSync(path.join(reportsDir, f)).mtime.getTime() 
      }))
      .sort((a, b) => b.time - a.time);
    
    // Keep only last 5 reports
    const toDelete = reportFiles.slice(5);
    
    if (toDelete.length > 0) {
      console.log(`📁 Reports: ${toDelete.length} files to clean`);
      
      toDelete.forEach(file => {
        if (this.config.verbose) {
          console.log(`  🗑️  ${file.name}`);
        }
        
        if (!this.config.dryRun) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    return toDelete.length;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  const config: CleanupConfig = {
    keepTrainingFiles: parseInt(args[0]) || 10,
    keepIntensiveFiles: parseInt(args[1]) || 5,
    keepBackupsPerFile: parseInt(args[2]) || 3,
    verbose: args.includes('--verbose') || args.includes('-v'),
    dryRun: args.includes('--dry-run') || args.includes('-d')
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npm run cleanup [training] [intensive] [backups] [options]

Arguments:
  training    Keep last N training files (default: 10)
  intensive   Keep last N intensive files (default: 5)
  backups     Keep last N backups per file (default: 3)

Options:
  --verbose, -v    Verbose output
  --dry-run, -d    Show what would be deleted without actually deleting
  --help, -h       Show this help

Examples:
  npm run cleanup                    # Default cleanup
  npm run cleanup 5 3 2             # Keep 5 training, 3 intensive, 2 backups
  npm run cleanup --dry-run --verbose  # See what would be cleaned
`);
    process.exit(0);
  }
  
  const cleanup = new TrainingCleanup(config);
  
  try {
    await cleanup.runCleanup();
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Export für Programmnutzung
export { TrainingCleanup, CleanupConfig };

// CLI Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
