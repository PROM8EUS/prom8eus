/**
 * Utils - Helper functions for catalog operations
 */

import type { CatalogTask } from './schema';
import type { Category } from './taxonomy';
import { AUTOMATION_TENDENCY } from './taxonomy';

/**
 * Converts a string to a URL-friendly slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Safely parses JSON string, returns null on error
 */
export function safeJson<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * Removes duplicate tasks by ID, keeping the first occurrence
 */
export function dedupeById(items: CatalogTask[]): CatalogTask[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

/**
 * Normalizes a partial task object into a complete CatalogTask
 */
export function normalizeTask(task: Partial<CatalogTask> & { title: string; description: string; category: Category }): CatalogTask {
  // Generate ID from title if not provided
  const id = task.id || slugify(task.title);
  
  // Normalize tags: lowercase, trim, limit to 5
  let tags = task.tags || [];
  tags = tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => tag.length > 0)
    .slice(0, 5);
  
  // Derive defaultAutomation from category if not provided
  const defaultAutomation = task.defaultAutomation || AUTOMATION_TENDENCY[task.category];
  
  return {
    id,
    title: task.title.trim(),
    description: task.description.trim(),
    category: task.category,
    tags,
    defaultAutomation
  };
}

/**
 * Merges two arrays of tasks, preferring newer tasks when IDs match
 */
export function mergeTasks(existing: CatalogTask[], incoming: CatalogTask[]): CatalogTask[] {
  const taskMap = new Map<string, CatalogTask>();
  
  // Add existing tasks
  existing.forEach(task => taskMap.set(task.id, task));
  
  // Overwrite with incoming tasks (prefer newer data)
  incoming.forEach(task => taskMap.set(task.id, task));
  
  return Array.from(taskMap.values());
}