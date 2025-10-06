import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runAnalysis } from '../../runAnalysis';
import { mockOpenAIClient, mockIsOpenAIAvailable } from './mocks/openaiClient';

describe('Analysis Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runAnalysis function', () => {
    it('should work end-to-end with the new pipeline', async () => {
      // Arrange
      const jobText = 'Senior Software Engineer with React, TypeScript, and Node.js experience. Responsible for developing web applications, code reviews, and mentoring junior developers.';
      const mockResponse = {
        tasks: [
          {
            text: 'Develop React web applications',
            automationPotential: 75,
            reasoning: 'High automation potential with AI coding tools',
            category: 'Software-Entwicklung',
            subtasks: [
              {
                id: '1',
                title: 'Code Implementation',
                description: 'Implement React components',
                automationPotential: 80,
                estimatedTime: 120,
                priority: 'high' as const,
                complexity: 'medium' as const,
                systems: ['VS Code', 'GitHub'],
                risks: ['Bugs', 'Performance issues'],
                opportunities: ['Faster development', 'Better code quality'],
                dependencies: ['Design system', 'API endpoints']
              },
              {
                id: '2',
                title: 'Testing',
                description: 'Write unit and integration tests',
                automationPotential: 70,
                estimatedTime: 60,
                priority: 'high' as const,
                complexity: 'medium' as const,
                systems: ['Jest', 'Cypress'],
                risks: ['Test coverage gaps'],
                opportunities: ['Automated testing'],
                dependencies: ['Test framework setup']
              }
            ],
            businessCase: {
              manualHours: 40,
              automatedHours: 12,
              automationPotential: 75,
              savedHours: 28,
              setupCostHours: 16,
              setupCostMoney: 1600,
              roi: 75,
              paybackPeriodYears: 0.6,
              hourlyRateEmployee: 60,
              hourlyRateFreelancer: 90,
              employmentType: 'employee' as const,
              reasoning: 'Significant time savings with AI-assisted development'
            }
          },
          {
            text: 'Conduct code reviews',
            automationPotential: 60,
            reasoning: 'AI can assist with code review but human judgment needed',
            category: 'Qualitätssicherung',
            subtasks: [
              {
                id: '3',
                title: 'Review Pull Requests',
                description: 'Review code changes for quality and standards',
                automationPotential: 65,
                estimatedTime: 30,
                priority: 'medium' as const,
                complexity: 'medium' as const,
                systems: ['GitHub', 'SonarQube'],
                risks: ['Missed issues'],
                opportunities: ['Consistent reviews'],
                dependencies: ['Code standards', 'Review guidelines']
              }
            ],
            businessCase: {
              manualHours: 20,
              automatedHours: 8,
              automationPotential: 60,
              savedHours: 12,
              setupCostHours: 8,
              setupCostMoney: 800,
              roi: 50,
              paybackPeriodYears: 0.7,
              hourlyRateEmployee: 60,
              hourlyRateFreelancer: 90,
              employmentType: 'employee' as const,
              reasoning: 'AI-assisted code review improves efficiency'
            }
          },
          {
            text: 'Mentor junior developers',
            automationPotential: 20,
            reasoning: 'Human interaction and personalized guidance required',
            category: 'Führung',
            subtasks: [
              {
                id: '4',
                title: 'One-on-one meetings',
                description: 'Regular mentoring sessions',
                automationPotential: 10,
                estimatedTime: 60,
                priority: 'medium' as const,
                complexity: 'high' as const,
                systems: ['Calendar', 'Video conferencing'],
                risks: ['Miscommunication'],
                opportunities: ['Skill development'],
                dependencies: ['Mentoring program']
              }
            ],
            businessCase: {
              manualHours: 20,
              automatedHours: 18,
              automationPotential: 20,
              savedHours: 2,
              setupCostHours: 4,
              setupCostMoney: 400,
              roi: -50,
              paybackPeriodYears: 2.0,
              hourlyRateEmployee: 60,
              hourlyRateFreelancer: 90,
              employmentType: 'employee' as const,
              reasoning: 'Limited automation potential for human mentoring'
            }
          }
        ]
      };

      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockResolvedValue(mockResponse);

      // Act
      const result = await runAnalysis(jobText, 'en');

      // Assert
      expect(result.totalScore).toBe(52); // Average of 75, 60, 20
      expect(result.ratio.automatisierbar).toBe(52);
      expect(result.ratio.mensch).toBe(48);
      expect(result.tasks).toHaveLength(3);
      
      // Check first task (high automation)
      expect(result.tasks[0].text).toBe('Develop React web applications');
      expect(result.tasks[0].score).toBe(75);
      expect(result.tasks[0].label).toBe('Automatisierbar');
      expect(result.tasks[0].subtasks).toHaveLength(2);
      expect(result.tasks[0].businessCase?.roi).toBe(75);
      
      // Check second task (medium automation)
      expect(result.tasks[1].text).toBe('Conduct code reviews');
      expect(result.tasks[1].score).toBe(60);
      expect(result.tasks[1].label).toBe('Teilweise Automatisierbar');
      expect(result.tasks[1].subtasks).toHaveLength(1);
      
      // Check third task (low automation)
      expect(result.tasks[2].text).toBe('Mentor junior developers');
      expect(result.tasks[2].score).toBe(20);
      expect(result.tasks[2].label).toBe('Mensch');
      expect(result.tasks[2].subtasks).toHaveLength(1);
      
      // Check summary and recommendations
      expect(result.summary).toContain('52% Automatisierungspotenzial');
      expect(result.summary).toContain('3 Aufgaben');
      expect(result.recommendations).toContain('Mittleres Automatisierungspotenzial');
      expect(result.recommendations).toContain('GitHub Copilot');
      expect(result.originalText).toBe(jobText);
    });

    it('should handle German language analysis', async () => {
      // Arrange
      const jobText = 'Software-Entwickler mit React und TypeScript Erfahrung';
      const mockResponse = {
        tasks: [
          {
            text: 'Entwickle React Anwendungen',
            automationPotential: 75,
            reasoning: 'Hohes Automatisierungspotenzial',
            category: 'Software-Entwicklung',
            subtasks: [],
            businessCase: null
          }
        ]
      };

      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockResolvedValue(mockResponse);

      // Act
      const result = await runAnalysis(jobText, 'de');

      // Assert
      expect(result.tasks[0].text).toBe('Entwickle React Anwendungen');
      expect(result.tasks[0].category).toBe('Software-Entwicklung');
      expect(mockOpenAIClient.analyzeJobDescription).toHaveBeenCalledWith(jobText, 'de');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const jobText = 'Software Engineer';
      mockIsOpenAIAvailable.mockReturnValue(true);
      mockOpenAIClient.analyzeJobDescription.mockRejectedValue(new Error('API rate limit exceeded'));

      // Act & Assert
      await expect(runAnalysis(jobText, 'en'))
        .rejects.toThrow('AI-Analyse fehlgeschlagen: API rate limit exceeded');
    });

    it('should provide helpful error messages for common issues', async () => {
      // Arrange
      const jobText = 'Software Engineer';
      mockIsOpenAIAvailable.mockReturnValue(false);

      // Act & Assert
      await expect(runAnalysis(jobText, 'en'))
        .rejects.toThrow('OpenAI API nicht konfiguriert. Bitte API-Key in .env hinterlegen.');
    });
  });
});
