import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalysisPipeline } from '../analysisPipeline';
import { mockOpenAIClient, mockIsOpenAIAvailable } from './mocks/openaiClient';

describe('AnalysisPipeline', () => {
  let pipeline: AnalysisPipeline;

  beforeEach(() => {
    pipeline = new AnalysisPipeline();
    vi.clearAllMocks();
  });

  describe('runAnalysis', () => {
    it('should run complete analysis pipeline successfully', async () => {
      // Arrange
      const jobText = 'Software Engineer with React and TypeScript experience';
      const mockResponse = {
        tasks: [
          {
            text: 'Develop React applications',
            automationPotential: 75,
            reasoning: 'High automation potential with AI tools',
            subtasks: [
              {
                id: '1',
                title: 'Code Review',
                description: 'Review code changes',
                automationPotential: 80,
                estimatedTime: 30,
                priority: 'high' as const,
                complexity: 'medium' as const,
                systems: ['GitHub'],
                risks: ['Quality issues'],
                opportunities: ['Faster reviews'],
                dependencies: ['CI/CD']
              }
            ],
            businessCase: {
              manualHours: 40,
              automatedHours: 10,
              automationPotential: 75,
              savedHours: 30,
              setupCostHours: 8,
              setupCostMoney: 800,
              roi: 275,
              paybackPeriodYears: 0.3,
              hourlyRateEmployee: 50,
              hourlyRateFreelancer: 80,
              employmentType: 'employee' as const,
              reasoning: 'High ROI due to automation'
            }
          }
        ]
      };

      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockResolvedValue(mockResponse);

      // Act
      const result = await pipeline.runAnalysis(jobText, 'en');

      // Assert
      expect(result.totalScore).toBe(75);
      expect(result.ratio.automatisierbar).toBe(75);
      expect(result.ratio.mensch).toBe(25);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].text).toBe('Develop React applications');
      expect(result.tasks[0].subtasks).toHaveLength(1);
      expect(result.tasks[0].businessCase).toBeDefined();
      expect(result.summary).toContain('75% Automatisierungspotenzial');
      expect(result.recommendations).toContain('Hohes Automatisierungspotenzial');
      expect(result.originalText).toBe(jobText);
    });

    it('should handle multiple tasks correctly', async () => {
      // Arrange
      const jobText = 'Full-stack Developer';
      const mockResponse = {
        tasks: [
          {
            text: 'Frontend development',
            automationPotential: 70,
            reasoning: 'Frontend automation',
            subtasks: [],
            businessCase: null
          },
          {
            text: 'Backend development',
            automationPotential: 80,
            reasoning: 'Backend automation',
            subtasks: [],
            businessCase: null
          },
          {
            text: 'Client communication',
            automationPotential: 30,
            reasoning: 'Human interaction needed',
            subtasks: [],
            businessCase: null
          }
        ]
      };

      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockResolvedValue(mockResponse);

      // Act
      const result = await pipeline.runAnalysis(jobText, 'en');

      // Assert
      expect(result.tasks).toHaveLength(3);
      expect(result.totalScore).toBe(60); // Average of 70, 80, 30
      expect(result.ratio.automatisierbar).toBe(60);
      expect(result.ratio.mensch).toBe(40);
    });

    it('should handle OpenAI API unavailable', async () => {
      // Arrange
      const jobText = 'Software Engineer';
      mockIsOpenAIAvailable.mockReturnValue(false);

      // Act & Assert
      await expect(pipeline.runAnalysis(jobText, 'en'))
        .rejects.toThrow('OpenAI API nicht konfiguriert. Bitte API-Key in .env hinterlegen.');
    });

    it('should handle API errors with clear error message', async () => {
      // Arrange
      const jobText = 'Software Engineer';
      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(pipeline.runAnalysis(jobText, 'en'))
        .rejects.toThrow('AI-Analyse fehlgeschlagen: Network error');
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const jobText = 'Software Engineer';
      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockRejectedValue('String error');

      // Act & Assert
      await expect(pipeline.runAnalysis(jobText, 'en'))
        .rejects.toThrow('AI-Analyse fehlgeschlagen: Unbekannter Fehler');
    });

    it('should use German language by default', async () => {
      // Arrange
      const jobText = 'Software Engineer';
      const mockResponse = {
        tasks: [
          {
            text: 'Entwickle React Anwendungen',
            automationPotential: 75,
            reasoning: 'Hohes Automatisierungspotenzial',
            subtasks: [],
            businessCase: null
          }
        ]
      };

      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockResolvedValue(mockResponse);

      // Act
      await pipeline.runAnalysis(jobText); // No lang parameter

      // Assert
      expect(mockOpenAIClient.analyzeJobDescription).toHaveBeenCalledWith(jobText, 'de');
    });

    it('should convert FastAnalysisResult to Task format correctly', async () => {
      // Arrange
      const jobText = 'Software Engineer';
      const mockResponse = {
        tasks: [
          {
            text: 'Develop applications',
            automationPotential: 75,
            reasoning: 'Development task',
            category: 'Software-Entwicklung',
            subtasks: [
              {
                id: '1',
                title: 'Code Review',
                description: 'Review code',
                automationPotential: 80,
                estimatedTime: 30,
                priority: 'high' as const,
                complexity: 'medium' as const,
                systems: ['GitHub'],
                risks: ['Quality'],
                opportunities: ['Speed'],
                dependencies: ['CI/CD']
              }
            ],
            businessCase: {
              manualHours: 40,
              automatedHours: 10,
              automationPotential: 75,
              savedHours: 30,
              setupCostHours: 8,
              setupCostMoney: 800,
              roi: 275,
              paybackPeriodYears: 0.3,
              hourlyRateEmployee: 50,
              hourlyRateFreelancer: 80,
              employmentType: 'employee' as const,
              reasoning: 'High ROI'
            }
          }
        ]
      };

      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockResolvedValue(mockResponse);

      // Act
      const result = await pipeline.runAnalysis(jobText, 'en');

      // Assert
      expect(result.tasks[0].text).toBe('Develop applications');
      expect(result.tasks[0].score).toBe(75);
      expect(result.tasks[0].label).toBe('Automatisierbar');
      expect(result.tasks[0].signals).toEqual(['Development task']);
      expect(result.tasks[0].aiTools).toContain('chatgpt');
      expect(result.tasks[0].industry).toBe('Software-Entwicklung');
      expect(result.tasks[0].category).toBe('Software-Entwicklung');
      expect(result.tasks[0].confidence).toBe(90);
      expect(result.tasks[0].automationRatio).toBe(75);
      expect(result.tasks[0].humanRatio).toBe(25);
      expect(result.tasks[0].complexity).toBe('medium');
      expect(result.tasks[0].automationTrend).toBe('stable');
      expect(result.tasks[0].subtasks).toHaveLength(1);
      expect(result.tasks[0].businessCase).toBeDefined();
    });
  });
});
