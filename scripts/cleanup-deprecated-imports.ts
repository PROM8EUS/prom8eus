#!/usr/bin/env tsx

/**
 * Script to clean up deprecated imports and update them to use the new unified schema
 * This script systematically updates all files to use the new interfaces
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface ImportUpdate {
  oldImport: string;
  newImport: string;
  description: string;
}

const IMPORT_UPDATES: ImportUpdate[] = [
  {
    oldImport: "from '@/lib/workflowIndexer'",
    newImport: "from '@/lib/schemas/workflowIndex'",
    description: "Update WorkflowIndex imports to use new schema"
  },
  {
    oldImport: "from './workflowIndexer'",
    newImport: "from './schemas/workflowIndex'",
    description: "Update relative WorkflowIndex imports"
  },
  {
    oldImport: "import { workflowIndexer } from '@/lib/workflowIndexer'",
    newImport: "import { unifiedWorkflowIndexer } from '@/lib/workflowIndexerUnified'",
    description: "Update workflowIndexer instance imports"
  },
  {
    oldImport: "import { WorkflowIndexer } from '@/lib/workflowIndexer'",
    newImport: "import { UnifiedWorkflowIndexer } from '@/lib/workflowIndexerUnified'",
    description: "Update WorkflowIndexer class imports"
  },
  {
    oldImport: "from '@/lib/n8nApi'",
    newImport: "from '@/lib/schemas/n8nWorkflow'",
    description: "Update N8nWorkflow imports to use new schema"
  },
  {
    oldImport: "import { n8nApi } from '@/lib/n8nApi'",
    newImport: "import { n8nApiUnified } from '@/lib/n8nApiUnified'",
    description: "Update n8nApi instance imports"
  },
  {
    oldImport: "import { N8nApi } from '@/lib/n8nApi'",
    newImport: "import { N8nApiUnified } from '@/lib/n8nApiUnified'",
    description: "Update N8nApi class imports"
  }
];

const DEPRECATED_FILES = [
  'src/lib/workflowIndexer.ts', // Keep for now, but mark as deprecated
  'src/lib/n8nApi.ts', // Keep for now, but mark as deprecated
  'src/lib/workflowIndexerRefactored.ts', // Can be removed
  'src/lib/n8nApiRefactored.ts', // Can be removed
  'src/lib/workflowCacheManager.ts', // Can be removed
  'src/lib/workflowDataProcessor.ts', // Can be removed
  'src/lib/n8nWorkflowParser.ts', // Can be removed
  'src/lib/n8nDataMapper.ts' // Can be removed
];

function getAllFiles(dir: string, extensions: string[] = ['.ts', '.tsx']): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, dist, .git, etc.
        if (!['node_modules', 'dist', '.git', '__tests__', 'test'].includes(item)) {
          traverse(fullPath);
        }
      } else if (stat.isFile() && extensions.includes(extname(fullPath))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function updateImportsInFile(filePath: string): { updated: boolean; changes: string[] } {
  const content = readFileSync(filePath, 'utf-8');
  let updatedContent = content;
  const changes: string[] = [];
  
  for (const update of IMPORT_UPDATES) {
    if (updatedContent.includes(update.oldImport)) {
      updatedContent = updatedContent.replace(
        new RegExp(update.oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        update.newImport
      );
      changes.push(`${update.description}: ${update.oldImport} -> ${update.newImport}`);
    }
  }
  
  if (changes.length > 0) {
    writeFileSync(filePath, updatedContent, 'utf-8');
    return { updated: true, changes };
  }
  
  return { updated: false, changes: [] };
}

function addDeprecationWarning(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  
  // Check if deprecation warning already exists
  if (content.includes('@deprecated') || content.includes('DEPRECATED')) {
    return;
  }
  
  const deprecationWarning = `/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use the new unified schema files instead:
 * - For WorkflowIndex: use @/lib/schemas/workflowIndex
 * - For N8nWorkflow: use @/lib/schemas/n8nWorkflow
 * - For WorkflowIndexer: use @/lib/workflowIndexerUnified
 * - For N8nApi: use @/lib/n8nApiUnified
 */

`;
  
  const updatedContent = deprecationWarning + content;
  writeFileSync(filePath, updatedContent, 'utf-8');
}

function main() {
  console.log('🧹 Starting cleanup of deprecated imports...\n');
  
  const srcDir = 'src';
  const files = getAllFiles(srcDir);
  
  let totalUpdated = 0;
  let totalChanges = 0;
  
  console.log(`📁 Found ${files.length} files to process\n`);
  
  // Update imports in all files
  for (const file of files) {
    const result = updateImportsInFile(file);
    if (result.updated) {
      totalUpdated++;
      totalChanges += result.changes.length;
      console.log(`✅ Updated: ${file}`);
      result.changes.forEach(change => {
        console.log(`   - ${change}`);
      });
      console.log('');
    }
  }
  
  // Add deprecation warnings to deprecated files
  console.log('⚠️  Adding deprecation warnings to deprecated files...\n');
  
  for (const deprecatedFile of DEPRECATED_FILES) {
    try {
      addDeprecationWarning(deprecatedFile);
      console.log(`⚠️  Added deprecation warning to: ${deprecatedFile}`);
    } catch (error) {
      console.log(`❌ Could not add deprecation warning to: ${deprecatedFile} (file may not exist)`);
    }
  }
  
  console.log('\n📊 Cleanup Summary:');
  console.log(`   - Files processed: ${files.length}`);
  console.log(`   - Files updated: ${totalUpdated}`);
  console.log(`   - Total changes: ${totalChanges}`);
  console.log(`   - Deprecation warnings added: ${DEPRECATED_FILES.length}`);
  
  console.log('\n✅ Import cleanup completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review the changes and test the application');
  console.log('   2. Remove deprecated files after confirming everything works');
  console.log('   3. Update any remaining manual imports');
}

// Run main function if this script is executed directly
main();

export { updateImportsInFile, addDeprecationWarning, IMPORT_UPDATES, DEPRECATED_FILES };
