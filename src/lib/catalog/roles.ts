/**
 * Roles - Initial roles list (editable)
 */

export const ROLES = [
  "Software Engineer",
  "DevOps Engineer", 
  "Data Scientist",
  "Product Manager",
  "UX/UI Designer",
  "Sales Manager",
  "Marketing Manager",
  "Customer Support Specialist",
  "HR Manager",
  "Financial Accountant"
];

/**
 * Helper to easily extend the roles list
 */
export function addRoles(extra: string[]): string[] {
  return [...ROLES, ...extra];
}

/**
 * Get all unique roles (removes duplicates)
 */
export function getAllRoles(additionalRoles: string[] = []): string[] {
  const allRoles = [...ROLES, ...additionalRoles];
  return [...new Set(allRoles)];
}