#!/usr/bin/env ts-node

/**
 * Job Task Catalog Generator
 * 
 * Generates comprehensive task catalogs for various job roles using OpenAI GPT-5.
 * 
 * Usage:
 *   tsx scripts/generate-catalog.ts
 *   node --loader ts-node/esm scripts/generate-catalog.ts
 * 
 * Requirements:
 *   - OPENAI_API_KEY environment variable
 *   - ts-node or tsx installed
 * 
 * Output:
 *   - /catalog/{roleSlug}.json - Individual role catalogs
 *   - /catalog/index.json - Master index of all catalogs
 * 
 * How to extend:
 *   - Edit /src/lib/catalog/roles.ts to add new roles
 *   - Or call addRoles(["Solution Architect"]) in this script
 * 
 * How to consume in app:
 *   - Import a file from /catalog/*.json
 *   - Use catalog.items for matching/scoring tasks
 */

import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { ROLES } from '../src/lib/catalog/roles';
import { CATEGORIES } from '../src/lib/catalog/taxonomy';
import type { Catalog, CatalogTask, CatalogIndex } from '../src/lib/catalog/schema';
import { validateCatalog } from '../src/lib/catalog/schema';
import { slugify, safeJson, dedupeById, normalizeTask, mergeTasks } from '../src/lib/catalog/utils';

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a precise catalog builder for job tasks. Return ONLY valid JSON matching the provided schema. Avoid duplicates and vague items. Use imperative titles. Keep each description to one sentence. Classify into the provided categories and infer defaultAutomation as 'Automatable' for operational/technical repeatable tasks and 'Human' for judgment-heavy, creative, advisory or leadership tasks.`;

const USER_PROMPT_TEMPLATE = (role: string) => `
ROLE: ${role}

TAXONOMY:
• Data Processing
• Reporting & Analytics
• Communication & Scheduling
• Integration & DevOps
• Quality & Security
• Customer & Advisory
• Creative & Strategy

Produce an array of 18–30 task objects with fields:
{ title, description, category, tags }

Rules:
• title: imperative, 3–7 words (e.g., "Build CI/CD pipeline")
• description: one concise sentence
• category: one of the taxonomy values
• tags: up to 5 lowercased keywords
• do not include ids or defaultAutomation; those are derived

Output: JSON array only.
`;

/**
 * Ensures the catalog directory exists
 */
async function ensureCatalogDir(): Promise<string> {
  const catalogDir = path.join(process.cwd(), 'catalog');
  try {
    await fs.access(catalogDir);
  } catch {
    await fs.mkdir(catalogDir, { recursive: true });
    console.log(`📁 Created catalog directory: ${catalogDir}`);
  }
  return catalogDir;
}

/**
 * Generates tasks for a specific role using OpenAI GPT-5
 */
async function generateTasksForRole(role: string, retryCount = 0): Promise<CatalogTask[]> {
  const maxRetries = 2;
  
  try {
    console.log(`🤖 Generating tasks for: ${role} (attempt ${retryCount + 1})`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-2025-08-07',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: USER_PROMPT_TEMPLATE(role) }
      ],
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Parse the JSON response
    const parsed = safeJson<any>(content);
    if (!parsed) {
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Extract tasks array (handle different response formats)
    let rawTasks: any[];
    if (Array.isArray(parsed)) {
      rawTasks = parsed;
    } else if (parsed.tasks && Array.isArray(parsed.tasks)) {
      rawTasks = parsed.tasks;
    } else if (parsed.items && Array.isArray(parsed.items)) {
      rawTasks = parsed.items;
    } else {
      // Try to find the first array property
      const arrayProp = Object.values(parsed).find(val => Array.isArray(val));
      if (arrayProp) {
        rawTasks = arrayProp as any[];
      } else {
        throw new Error('No task array found in response');
      }
    }

    // Validate and normalize tasks
    const tasks: CatalogTask[] = [];
    for (const rawTask of rawTasks) {
      try {
        if (!rawTask.title || !rawTask.description || !rawTask.category) {
          console.warn(`⚠️  Skipping incomplete task: ${JSON.stringify(rawTask)}`);
          continue;
        }

        if (!CATEGORIES.includes(rawTask.category)) {
          console.warn(`⚠️  Skipping task with invalid category: ${rawTask.category}`);
          continue;
        }

        const normalizedTask = normalizeTask({
          title: rawTask.title,
          description: rawTask.description,
          category: rawTask.category,
          tags: rawTask.tags || []
        });

        tasks.push(normalizedTask);
      } catch (error) {
        console.warn(`⚠️  Error normalizing task: ${error}`);
      }
    }

    // Deduplicate by ID
    const uniqueTasks = dedupeById(tasks);
    
    if (uniqueTasks.length === 0) {
      throw new Error('No valid tasks generated');
    }

    console.log(`✅ Generated ${uniqueTasks.length} tasks for ${role}`);
    return uniqueTasks;

  } catch (error) {
    console.error(`❌ Error generating tasks for ${role}:`, error);
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying ${retryCount + 1}/${maxRetries} for ${role}`);
      await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
      return generateTasksForRole(role, retryCount + 1);
    }
    
    console.error(`❌ All retry attempts failed for ${role}`);
    return [];
  }
}

/**
 * Loads an existing catalog or returns null if not found
 */
async function loadExistingCatalog(catalogDir: string, roleSlug: string): Promise<Catalog | null> {
  try {
    const filePath = path.join(catalogDir, `${roleSlug}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = safeJson<Catalog>(content);
    
    if (parsed) {
      const validation = validateCatalog(parsed);
      if (validation.ok) {
        return validation.value;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Generates or updates a catalog for a specific role
 */
async function generateCatalogForRole(catalogDir: string, role: string): Promise<Catalog | null> {
  const roleSlug = slugify(role);
  
  try {
    // Load existing catalog if it exists
    const existingCatalog = await loadExistingCatalog(catalogDir, roleSlug);
    
    // Generate new tasks
    const newTasks = await generateTasksForRole(role);
    if (newTasks.length === 0) {
      console.error(`❌ No tasks generated for ${role}, skipping`);
      return existingCatalog;
    }

    let finalTasks: CatalogTask[];
    let source: "gpt5" | "manual" | "mixed";
    let version: number;

    if (existingCatalog) {
      // Merge with existing tasks
      finalTasks = mergeTasks(existingCatalog.items, newTasks);
      source = existingCatalog.source === 'manual' ? 'mixed' : 'mixed';
      version = existingCatalog.version + 1;
      console.log(`🔄 Updated catalog for ${role} (${existingCatalog.items.length} → ${finalTasks.length} tasks)`);
    } else {
      // New catalog
      finalTasks = newTasks;
      source = 'gpt5';
      version = 1;
      console.log(`🆕 Created new catalog for ${role} (${finalTasks.length} tasks)`);
    }

    // Build catalog object
    const catalog: Catalog = {
      role,
      roleSlug,
      version,
      generatedAt: new Date().toISOString(),
      source,
      items: finalTasks
    };

    // Validate catalog
    const validation = validateCatalog(catalog);
    if (!validation.ok) {
      console.error(`❌ Validation failed for ${role}: ${validation.error}`);
      return existingCatalog;
    }

    // Write catalog file
    const filePath = path.join(catalogDir, `${roleSlug}.json`);
    await fs.writeFile(filePath, JSON.stringify(catalog, null, 2), 'utf-8');
    console.log(`💾 Saved catalog: ${filePath}`);

    return catalog;

  } catch (error) {
    console.error(`❌ Failed to generate catalog for ${role}:`, error);
    return null;
  }
}

/**
 * Updates the catalog index file
 */
async function updateCatalogIndex(catalogDir: string, catalogs: Catalog[]): Promise<void> {
  const index: CatalogIndex = {
    generatedAt: new Date().toISOString(),
    roles: catalogs.map(catalog => ({
      role: catalog.role,
      roleSlug: catalog.roleSlug,
      file: `${catalog.roleSlug}.json`,
      items: catalog.items.length,
      version: catalog.version
    }))
  };

  const indexPath = path.join(catalogDir, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`📋 Updated index: ${indexPath}`);
}

/**
 * Main function - generates catalogs for all roles
 */
async function main(): Promise<void> {
  try {
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    console.log('🚀 Job Task Catalog Generator');
    console.log('🔑 OpenAI API Key found');
    console.log(`📝 Generating catalogs for ${ROLES.length} roles...\n`);

    // Ensure catalog directory exists
    const catalogDir = await ensureCatalogDir();

    // Generate catalogs for all roles
    const catalogs: Catalog[] = [];
    
    for (const role of ROLES) {
      const catalog = await generateCatalogForRole(catalogDir, role);
      if (catalog) {
        catalogs.push(catalog);
      }
      
      // Rate limiting between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update index
    await updateCatalogIndex(catalogDir, catalogs);

    // Show statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Catalogs generated: ${catalogs.length}/${ROLES.length}`);
    console.log(`📁 Output directory: ${catalogDir}`);
    
    const totalTasks = catalogs.reduce((sum, cat) => sum + cat.items.length, 0);
    console.log(`📝 Total tasks: ${totalTasks}`);
    
    // Show per-role breakdown
    console.log('\n📋 Role breakdown:');
    catalogs.forEach(catalog => {
      console.log(`  ${catalog.role}: ${catalog.items.length} tasks (v${catalog.version})`);
    });

    console.log('\n🎉 Catalog generation completed successfully!');

  } catch (error) {
    console.error('\n❌ Critical error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as generateCatalogs };