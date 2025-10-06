import { describe, it, expect, beforeEach } from 'vitest';
import { ROIAggregator } from '../roiAggregator';
import { Task } from '../taskClassifier';

describe('ROIAggregator', () => {
  let roiAggregator: ROIAggregator;

  beforeEach(() => {
    roiAggregator = new ROIAggregator();
  });

  describe('aggregateResults', () => {
    it('should aggregate results with high automation potential', () => {
      // Arrange
      const tasks: Task[] = [
        {
          text: 'Process Excel data',
          score: 85,
          label: 'Automatisierbar',
          signals: ['High automation potential'],
          aiTools: ['excel-ai'],
          industry: 'finance',
          category: 'administrative',
          confidence: 0.9,
          automationRatio: 85,
          humanRatio: 15,
          complexity: 'low',
          automationTrend: 'increasing'
        },
        {
          text: 'Generate reports',
          score: 80,
          label: 'Automatisierbar',
          signals: ['Report generation'],
          aiTools: ['power-bi-ai'],
          industry: 'finance',
          category: 'analytical',
          confidence: 0.8,
          automationRatio: 80,
          humanRatio: 20,
          complexity: 'medium',
          automationTrend: 'increasing'
        }
      ];
      const originalText = 'Financial Analyst job description';

      // Act
      const result = roiAggregator.aggregateResults(tasks, originalText);

      // Assert
      expect(result.totalScore).toBe(82); // Average of 85 and 80
      expect(result.ratio.automatisierbar).toBe(82);
      expect(result.ratio.mensch).toBe(18);
      expect(result.tasks).toHaveLength(2);
      expect(result.summary).toContain('82% Automatisierungspotenzial');
      expect(result.recommendations).toContain('Hohes Automatisierungspotenzial');
      expect(result.originalText).toBe(originalText);
    });

    it('should aggregate results with mixed automation potential', () => {
      // Arrange
      const tasks: Task[] = [
        {
          text: 'Process data',
          score: 70,
          label: 'Automatisierbar',
          signals: ['Data processing'],
          aiTools: ['excel-ai'],
          industry: 'tech',
          category: 'technical',
          confidence: 0.8,
          automationRatio: 70,
          humanRatio: 30,
          complexity: 'medium',
          automationTrend: 'increasing'
        },
        {
          text: 'Client communication',
          score: 30,
          label: 'Teilweise Automatisierbar',
          signals: ['Human interaction needed'],
          aiTools: ['chatgpt'],
          industry: 'tech',
          category: 'communication',
          confidence: 0.6,
          automationRatio: 30,
          humanRatio: 70,
          complexity: 'high',
          automationTrend: 'stable'
        }
      ];
      const originalText = 'Tech Support job description';

      // Act
      const result = roiAggregator.aggregateResults(tasks, originalText);

      // Assert
      expect(result.totalScore).toBe(50); // Average of 70 and 30
      expect(result.ratio.automatisierbar).toBe(50);
      expect(result.ratio.mensch).toBe(50);
      expect(result.recommendations).toContain('Mittleres Automatisierungspotenzial');
    });

    it('should handle empty tasks array', () => {
      // Arrange
      const tasks: Task[] = [];
      const originalText = 'Empty job description';

      // Act
      const result = roiAggregator.aggregateResults(tasks, originalText);

      // Assert
      expect(result.totalScore).toBe(0);
      expect(result.ratio.automatisierbar).toBe(0);
      expect(result.ratio.mensch).toBe(100);
      expect(result.tasks).toHaveLength(0);
    });

    it('should handle tasks with NaN scores', () => {
      // Arrange
      const tasks: Task[] = [
        {
          text: 'Invalid task',
          score: NaN,
          label: 'Mensch',
          signals: ['Invalid data'],
          aiTools: [],
          industry: 'general',
          category: 'general',
          confidence: 0.1,
          automationRatio: NaN,
          humanRatio: NaN,
          complexity: 'high',
          automationTrend: 'stable'
        }
      ];
      const originalText = 'Invalid job description';

      // Act
      const result = roiAggregator.aggregateResults(tasks, originalText);

      // Assert
      expect(result.ratio.automatisierbar).toBe(0);
      expect(result.ratio.mensch).toBe(100);
    });
  });

  describe('generateSummary', () => {
    it('should generate summary for high automation potential', () => {
      // Act
      const result = roiAggregator.generateSummary(85, 5, 'de');

      // Assert
      expect(result).toContain('hohes Automatisierungspotenzial');
      expect(result).toContain('85%');
      expect(result).toContain('5 Aufgaben');
    });

    it('should generate summary for medium automation potential', () => {
      // Act
      const result = roiAggregator.generateSummary(60, 3, 'de');

      // Assert
      expect(result).toContain('60% Automatisierungspotenzial');
      expect(result).toContain('3 Aufgaben');
    });

    it('should generate summary for low automation potential', () => {
      // Act
      const result = roiAggregator.generateSummary(25, 2, 'de');

      // Assert
      expect(result).toContain('niedriges Automatisierungspotenzial');
      expect(result).toContain('25%');
    });

    it('should generate English summary', () => {
      // Act
      const result = roiAggregator.generateSummary(75, 4, 'en');

      // Assert
      expect(result).toContain('high automation potential');
      expect(result).toContain('75%');
      expect(result).toContain('4 identified tasks');
    });

    it('should handle zero tasks', () => {
      // Act
      const result = roiAggregator.generateSummary(0, 0, 'de');

      // Assert
      expect(result).toContain('keine spezifischen Aufgaben');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for high automation potential', () => {
      // Arrange
      const tasks: Task[] = [
        {
          text: 'Process data',
          score: 85,
          label: 'Automatisierbar',
          signals: ['Data processing'],
          aiTools: ['excel-ai', 'power-bi-ai'],
          industry: 'finance',
          category: 'analytical',
          confidence: 0.9,
          automationRatio: 85,
          humanRatio: 15,
          complexity: 'low',
          automationTrend: 'increasing'
        }
      ];

      // Act
      const result = roiAggregator.generateRecommendations(tasks, 85);

      // Assert
      expect(result).toContain('Hohes Automatisierungspotenzial');
      expect(result).toContain('Excel AI');
      expect(result).toContain('Power BI AI');
      expect(result).toContain('Claude für Risikoanalysen');
    });

    it('should generate recommendations for medium automation potential', () => {
      // Arrange
      const tasks: Task[] = [
        {
          text: 'Mixed tasks',
          score: 50,
          label: 'Teilweise Automatisierbar',
          signals: ['Mixed automation'],
          aiTools: ['chatgpt'],
          industry: 'general',
          category: 'general',
          confidence: 0.6,
          automationRatio: 50,
          humanRatio: 50,
          complexity: 'medium',
          automationTrend: 'stable'
        }
      ];

      // Act
      const result = roiAggregator.generateRecommendations(tasks, 50);

      // Assert
      expect(result).toContain('Mittleres Automatisierungspotenzial');
      expect(result).toContain('ChatGPT für allgemeine Aufgaben');
    });

    it('should generate recommendations for low automation potential', () => {
      // Arrange
      const tasks: Task[] = [
        {
          text: 'Creative work',
          score: 20,
          label: 'Mensch',
          signals: ['Creative tasks'],
          aiTools: [],
          industry: 'marketing',
          category: 'creative',
          confidence: 0.3,
          automationRatio: 20,
          humanRatio: 80,
          complexity: 'high',
          automationTrend: 'stable'
        }
      ];

      // Act
      const result = roiAggregator.generateRecommendations(tasks, 20);

      // Assert
      expect(result).toContain('Niedriges Automatisierungspotenzial');
      expect(result).toContain('Jasper für Content-Erstellung');
    });

    it('should limit recommendations to 8 items', () => {
      // Arrange
      const tasks: Task[] = Array.from({ length: 10 }, (_, i) => ({
        text: `Task ${i}`,
        score: 80,
        label: 'Automatisierbar' as const,
        signals: [`Signal ${i}`],
        aiTools: [`tool-${i}`],
        industry: 'tech',
        category: 'technical',
        confidence: 0.8,
        automationRatio: 80,
        humanRatio: 20,
        complexity: 'medium' as const,
        automationTrend: 'increasing' as const
      }));

      // Act
      const result = roiAggregator.generateRecommendations(tasks, 80);

      // Assert
      expect(result).toHaveLength(8);
    });
  });
});
