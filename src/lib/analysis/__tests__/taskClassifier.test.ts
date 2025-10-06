import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskClassifier } from '../taskClassifier';

describe('TaskClassifier', () => {
  let taskClassifier: TaskClassifier;

  beforeEach(() => {
    taskClassifier = new TaskClassifier();
    vi.clearAllMocks();
  });

  describe('classifyTask', () => {
    it('should classify a highly automatable task', async () => {
      // Arrange
      const taskText = 'Process Excel spreadsheets and generate reports';
      const jobTitle = 'Data Analyst';

      // Act
      const result = await taskClassifier.classifyTask(taskText, jobTitle);

      // Assert
      expect(result.text).toBe(taskText);
      expect(result.score).toBeGreaterThan(70);
      expect(result.label).toBe('Automatisierbar');
      expect(result.category).toBe('analytical');
      expect(result.complexity).toBe('low');
      expect(result.automationTrend).toBe('increasing');
    });

    it('should classify a partially automatable task', async () => {
      // Arrange
      const taskText = 'Communicate with clients and present findings';
      const jobTitle = 'Marketing Manager';

      // Act
      const result = await taskClassifier.classifyTask(taskText, jobTitle);

      // Assert
      expect(result.text).toBe(taskText);
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.score).toBeLessThan(70);
      expect(result.label).toBe('Teilweise Automatisierbar');
      expect(result.category).toBe('communication');
    });

    it('should classify a human-centric task', async () => {
      // Arrange
      const taskText = 'Lead strategic planning sessions and make executive decisions';
      const jobTitle = 'CEO';

      // Act
      const result = await taskClassifier.classifyTask(taskText, jobTitle);

      // Assert
      expect(result.text).toBe(taskText);
      expect(result.score).toBeLessThan(30);
      expect(result.label).toBe('Mensch');
      expect(result.category).toBe('management');
      expect(result.complexity).toBe('high');
    });
  });

  describe('detectIndustry', () => {
    it('should detect tech industry', () => {
      // Arrange
      const text = 'Software Engineer with React and TypeScript experience';

      // Act
      const result = taskClassifier.detectIndustry(text);

      // Assert
      expect(result).toBe('tech');
    });

    it('should detect HR industry', () => {
      // Arrange
      const text = 'HR Manager responsible for recruitment and talent acquisition';

      // Act
      const result = taskClassifier.detectIndustry(text);

      // Assert
      expect(result).toBe('hr');
    });

    it('should detect finance industry', () => {
      // Arrange
      const text = 'Financial Controller with accounting and tax experience';

      // Act
      const result = taskClassifier.detectIndustry(text);

      // Assert
      expect(result).toBe('finance');
    });

    it('should detect marketing industry', () => {
      // Arrange
      const text = 'Marketing Manager for digital campaigns and social media';

      // Act
      const result = taskClassifier.detectIndustry(text);

      // Assert
      expect(result).toBe('marketing');
    });

    it('should return general for unknown industry', () => {
      // Arrange
      const text = 'General office work and administration';

      // Act
      const result = taskClassifier.detectIndustry(text);

      // Assert
      expect(result).toBe('general');
    });
  });

  describe('detectTaskCategory', () => {
    it('should detect administrative tasks', () => {
      // Arrange
      const taskText = 'Handle office administration and documentation';

      // Act
      const result = taskClassifier.detectTaskCategory(taskText);

      // Assert
      expect(result).toBe('administrative');
    });

    it('should detect technical tasks', () => {
      // Arrange
      const taskText = 'Develop software applications and integrate APIs';

      // Act
      const result = taskClassifier.detectTaskCategory(taskText);

      // Assert
      expect(result).toBe('technical');
    });

    it('should detect analytical tasks', () => {
      // Arrange
      const taskText = 'Analyze data and generate statistical reports';

      // Act
      const result = taskClassifier.detectTaskCategory(taskText);

      // Assert
      expect(result).toBe('analytical');
    });

    it('should detect creative tasks', () => {
      // Arrange
      const taskText = 'Create marketing content and design campaigns';

      // Act
      const result = taskClassifier.detectTaskCategory(taskText);

      // Assert
      expect(result).toBe('creative');
    });

    it('should detect management tasks', () => {
      // Arrange
      const taskText = 'Lead team meetings and make strategic decisions';

      // Act
      const result = taskClassifier.detectTaskCategory(taskText);

      // Assert
      expect(result).toBe('management');
    });

    it('should return general for unknown category', () => {
      // Arrange
      const taskText = 'Random task description';

      // Act
      const result = taskClassifier.detectTaskCategory(taskText);

      // Assert
      expect(result).toBe('general');
    });
  });

  describe('calculateAutomationPotential', () => {
    it('should calculate high automation potential for administrative tasks', () => {
      // Arrange
      const lowerText = 'process excel data and generate reports';
      const category = 'administrative';

      // Act
      const result = taskClassifier.calculateAutomationPotential(lowerText, category);

      // Assert
      expect(result).toBeGreaterThan(80);
    });

    it('should calculate low automation potential for creative tasks', () => {
      // Arrange
      const lowerText = 'create innovative marketing strategies';
      const category = 'creative';

      // Act
      const result = taskClassifier.calculateAutomationPotential(lowerText, category);

      // Assert
      expect(result).toBeLessThan(40);
    });

    it('should adjust score based on automation keywords', () => {
      // Arrange
      const lowerText = 'automatically process data using software systems';
      const category = 'general';

      // Act
      const result = taskClassifier.calculateAutomationPotential(lowerText, category);

      // Assert
      expect(result).toBeGreaterThan(50); // Should be boosted by automation keywords
    });

    it('should adjust score based on manual keywords', () => {
      // Arrange
      const lowerText = 'creative manual work requiring human decision making';
      const category = 'general';

      // Act
      const result = taskClassifier.calculateAutomationPotential(lowerText, category);

      // Assert
      expect(result).toBeLessThan(50); // Should be reduced by manual keywords
    });

    it('should return value between 0 and 100', () => {
      // Arrange
      const lowerText = 'test task';
      const category = 'general';

      // Act
      const result = taskClassifier.calculateAutomationPotential(lowerText, category);

      // Assert
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });
});
