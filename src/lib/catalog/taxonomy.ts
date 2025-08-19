/**
 * Taxonomy - Source of truth for task categories and automation tendencies
 */

export type Category = 
  | "Data Processing"
  | "Reporting & Analytics"
  | "Communication & Scheduling"
  | "Integration & DevOps"
  | "Quality & Security"
  | "Customer & Advisory"
  | "Creative & Strategy";

export const CATEGORIES: Category[] = [
  "Data Processing",
  "Reporting & Analytics", 
  "Communication & Scheduling",
  "Integration & DevOps",
  "Quality & Security",
  "Customer & Advisory",
  "Creative & Strategy"
];

export const AUTOMATION_TENDENCY: Record<Category, "Automatable" | "Human"> = {
  "Data Processing": "Automatable",
  "Reporting & Analytics": "Automatable", 
  "Communication & Scheduling": "Automatable",
  "Integration & DevOps": "Automatable",
  "Quality & Security": "Automatable",
  "Customer & Advisory": "Human",
  "Creative & Strategy": "Human"
};