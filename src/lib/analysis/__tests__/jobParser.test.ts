import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobParser } from '../jobParser';
import { mockOpenAIClient, mockIsOpenAIAvailable } from './mocks/openaiClient';

describe('JobParser', () => {
  let jobParser: JobParser;

  beforeEach(() => {
    jobParser = new JobParser();
    vi.clearAllMocks();
  });

  describe('parseJobDescription', () => {
    it('should successfully parse a job description', async () => {
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
      const result = await jobParser.parseJobDescription(jobText, 'en');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Develop React applications');
      expect(result[0].automationPotential).toBe(75);
      expect(result[0].subtasks).toHaveLength(1);
      expect(result[0].businessCase).toBeDefined();
      expect(mockOpenAIClient.analyzeJobDescription).toHaveBeenCalledWith(jobText, 'en');
    });

    it('should handle empty task response', async () => {
      // Arrange
      const jobText = 'Invalid job description';
      const mockResponse = { tasks: [] };

      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(jobParser.parseJobDescription(jobText, 'en'))
        .rejects.toThrow('AI-Analyse fehlgeschlagen - keine Aufgaben extrahiert');
    });

    it('should handle OpenAI API unavailable', async () => {
      // Arrange
      const jobText = 'Software Engineer';
      mockIsOpenAIAvailable.mockReturnValue(false);

      // Act & Assert
      await expect(jobParser.parseJobDescription(jobText, 'en'))
        .rejects.toThrow('OpenAI API nicht konfiguriert. Bitte API-Key in .env hinterlegen.');
    });

    it('should handle API errors with fallback', async () => {
      // Arrange
      const jobText = 'Software Engineer';
      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockRejectedValue(new Error('API Error'));

      // Act
      const result = await jobParser.parseJobDescription(jobText, 'en');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe(jobText);
      expect(result[0].automationPotential).toBe(50);
      expect(result[0].pattern).toBe('fallback');
    });

    it('should detect task categories correctly', async () => {
      // Arrange
      const jobText = 'HR Manager responsible for recruitment and employee management';
      const mockResponse = {
        tasks: [
          {
            text: 'Recruit new employees',
            automationPotential: 60,
            reasoning: 'Medium automation potential'
          }
        ]
      };

      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockResolvedValue(mockResponse);

      // Act
      const result = await jobParser.parseJobDescription(jobText, 'en');

      // Assert
      expect(result[0].category).toBe('Personalwesen');
    });

    it('should determine complexity based on task content', async () => {
      // Arrange
      const jobText = 'Software Engineer';
      const mockResponse = {
        tasks: [
          {
            text: 'Debug complex integration issues',
            automationPotential: 40,
            reasoning: 'Complex debugging task'
          }
        ]
      };

      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockResolvedValue(mockResponse);

      // Act
      const result = await jobParser.parseJobDescription(jobText, 'en');

      // Assert
      expect(result[0].complexity).toBe('high');
    });
  });
});
