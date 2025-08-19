/**
 * Schema - TypeScript types and validation for catalog tasks
 */

import type { Category } from './taxonomy';
import { CATEGORIES } from './taxonomy';

export type CatalogTask = {
  id: string;                // stable slug, e.g. "build-ci-pipeline"
  title: string;             // short imperative, e.g. "Build CI/CD pipeline"
  description: string;       // 1 sentence
  category: Category;        // from taxonomy
  tags: string[];            // <= 5 lowercase tags
  defaultAutomation: "Automatable" | "Human";
};

export type Catalog = {
  role: string;              // e.g. "Software Engineer"
  roleSlug: string;          // "software-engineer"
  version: number;           // bump when regenerated
  generatedAt: string;       // ISO date
  source: "gpt5" | "manual" | "mixed";
  items: CatalogTask[];
};

export type CatalogIndex = {
  generatedAt: string;
  roles: {
    role: string;
    roleSlug: string;
    file: string;
    items: number;
    version: number;
  }[];
};

/**
 * Validates a catalog object against the schema
 */
export function validateCatalog(obj: any): { ok: true; value: Catalog } | { ok: false; error: string } {
  if (!obj || typeof obj !== 'object') {
    return { ok: false, error: 'Catalog must be an object' };
  }

  const { role, roleSlug, version, generatedAt, source, items } = obj;

  // Validate required fields
  if (typeof role !== 'string' || !role.trim()) {
    return { ok: false, error: 'role must be a non-empty string' };
  }

  if (typeof roleSlug !== 'string' || !roleSlug.trim()) {
    return { ok: false, error: 'roleSlug must be a non-empty string' };
  }

  if (typeof version !== 'number' || version < 1) {
    return { ok: false, error: 'version must be a positive number' };
  }

  if (typeof generatedAt !== 'string' || isNaN(Date.parse(generatedAt))) {
    return { ok: false, error: 'generatedAt must be a valid ISO date string' };
  }

  if (!['gpt5', 'manual', 'mixed'].includes(source)) {
    return { ok: false, error: 'source must be "gpt5", "manual", or "mixed"' };
  }

  if (!Array.isArray(items)) {
    return { ok: false, error: 'items must be an array' };
  }

  // Validate each task
  const seenIds = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    const task = items[i];
    const taskError = validateTask(task, i);
    if (taskError) {
      return { ok: false, error: `Task ${i}: ${taskError}` };
    }

    // Check for duplicate IDs
    if (seenIds.has(task.id)) {
      return { ok: false, error: `Duplicate task ID: ${task.id}` };
    }
    seenIds.add(task.id);
  }

  return { ok: true, value: obj as Catalog };
}

/**
 * Validates a single task
 */
function validateTask(task: any, index: number): string | null {
  if (!task || typeof task !== 'object') {
    return 'must be an object';
  }

  const { id, title, description, category, tags, defaultAutomation } = task;

  if (typeof id !== 'string' || !id.trim()) {
    return 'id must be a non-empty string';
  }

  if (typeof title !== 'string' || !title.trim()) {
    return 'title must be a non-empty string';
  }

  if (typeof description !== 'string' || !description.trim()) {
    return 'description must be a non-empty string';
  }

  if (!CATEGORIES.includes(category)) {
    return `category must be one of: ${CATEGORIES.join(', ')}`;
  }

  if (!Array.isArray(tags)) {
    return 'tags must be an array';
  }

  if (tags.length > 5) {
    return 'tags array must have at most 5 elements';
  }

  for (const tag of tags) {
    if (typeof tag !== 'string' || !tag.trim()) {
      return 'all tags must be non-empty strings';
    }
  }

  if (!['Automatable', 'Human'].includes(defaultAutomation)) {
    return 'defaultAutomation must be "Automatable" or "Human"';
  }

  return null;
}