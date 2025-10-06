import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskClassifier } from '../taskClassifier';
import { ROIAggregator } from '../roiAggregator';

describe('Simple Analysis Tests', () => {
  let taskClassifier: TaskClassifier;
  let roiAggregator: ROIAggregator;

  beforeEach(() => {
    taskClassifier = new TaskClassifier();
    roiAggregator = new ROIAggregator();
    vi.clearAllMocks();
  });

  describe('TaskClassifier', () => {
    it('should detect tech industry', () => {
      const result = taskClassifier.detectIndustry('Software Engineer with React experience');
      expect(result).toBe('tech');
    });

    it('should detect HR industry', () => {
      const result = taskClassifier.detectIndustry('HR Manager responsible for recruitment');
      expect(result).toBe('hr');
    });

    it('should detect administrative tasks', () => {
      const result = taskClassifier.detectTaskCategory('Handle office administration and documentation');
      expect(result).toBe('administrative');
    });

    it('should detect technical tasks', () => {
      const result = taskClassifier.detectTaskCategory('Develop software applications and integrate APIs');
      expect(result).toBe('technical');
    });

    it('should calculate automation potential correctly', () => {
      const result = taskClassifier.calculateAutomationPotential('process excel data', 'administrative');
      expect(result).toBeGreaterThan(80);
    });
  });

  describe('ROIAggregator', () => {
    it('should generate summary correctly', () => {
      const result = roiAggregator.generateSummary(75, 3, 'de');
      expect(result).toContain('75% Automatisierungspotenzial');
      expect(result).toContain('3 Aufgaben');
    });

    it('should generate English summary', () => {
      const result = roiAggregator.generateSummary(60, 2, 'en');
      expect(result).toContain('60%');
      expect(result).toContain('2 identified tasks');
    });

    it('should handle zero tasks', () => {
      const result = roiAggregator.generateSummary(0, 0, 'de');
      expect(result).toContain('keine spezifischen Aufgaben');
    });
  });
});
