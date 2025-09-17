import { WorkflowScoring, WorkflowScoringContext } from '../workflowScoring';
import { WorkflowIndex } from '../../workflowIndexer';

describe('WorkflowScoring', () => {
  let workflowScoring: WorkflowScoring;
  let mockWorkflow: WorkflowIndex;

  beforeEach(() => {
    workflowScoring = new WorkflowScoring();
    mockWorkflow = {
      id: 'test-workflow-1',
      source: 'github',
      title: 'Email Marketing Automation',
      summary: 'Automated email marketing workflow for customer engagement',
      link: 'https://github.com/example/email-marketing',
      category: 'Marketing & Sales',
      integrations: ['email', 'slack', 'hubspot'],
      complexity: 'Medium',
      triggerType: 'Webhook',
      tags: ['marketing', 'automation', 'email'],
      license: 'MIT',
      domains: ['Marketing & Advertising'],
      domain_confidences: [0.9],
      domain_origin: 'llm'
    };
  });

  describe('calculateWorkflowScore', () => {
    it('should calculate a score for a workflow without context', () => {
      const score = workflowScoring.calculateWorkflowScore(mockWorkflow);
      
      expect(score.workflowId).toBe('test-workflow-1');
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.categoryScore).toBeGreaterThanOrEqual(0);
      expect(score.categoryScore).toBeLessThanOrEqual(100);
      expect(score.serviceScore).toBeGreaterThanOrEqual(0);
      expect(score.serviceScore).toBeLessThanOrEqual(100);
      expect(score.triggerScore).toBeGreaterThanOrEqual(0);
      expect(score.triggerScore).toBeLessThanOrEqual(100);
      expect(score.complexityScore).toBeGreaterThanOrEqual(0);
      expect(score.complexityScore).toBeLessThanOrEqual(100);
      expect(score.integrationScore).toBeGreaterThanOrEqual(0);
      expect(score.integrationScore).toBeLessThanOrEqual(100);
      expect(score.reasoning).toBeInstanceOf(Array);
      expect(score.confidence).toBeGreaterThanOrEqual(0);
      expect(score.confidence).toBeLessThanOrEqual(100);
    });

    it('should calculate higher scores for matching context', () => {
      const context: WorkflowScoringContext = {
        userQuery: 'email marketing automation',
        businessDomain: 'Marketing',
        requiredIntegrations: ['email', 'hubspot'],
        preferredTriggerTypes: ['Webhook'],
        complexityPreference: 'Medium'
      };

      const score = workflowScoring.calculateWorkflowScore(mockWorkflow, context);
      
      // Should have higher scores due to context matching
      expect(score.categoryScore).toBeGreaterThan(70);
      expect(score.serviceScore).toBeGreaterThan(70);
      expect(score.triggerScore).toBeGreaterThan(70);
      expect(score.complexityScore).toBeGreaterThan(70);
      expect(score.overallScore).toBeGreaterThan(70);
    });

    it('should calculate lower scores for non-matching context', () => {
      const context: WorkflowScoringContext = {
        userQuery: 'data analysis python',
        businessDomain: 'Analytics',
        requiredIntegrations: ['python', 'jupyter'],
        preferredTriggerTypes: ['Schedule'],
        complexityPreference: 'High'
      };

      const score = workflowScoring.calculateWorkflowScore(mockWorkflow, context);
      
      // Should have lower scores due to context mismatch
      expect(score.categoryScore).toBeLessThan(60);
      expect(score.serviceScore).toBeLessThan(60);
      expect(score.triggerScore).toBeLessThan(60);
      expect(score.complexityScore).toBeLessThan(60);
      expect(score.overallScore).toBeLessThan(60);
    });

    it('should generate appropriate reasoning', () => {
      const context: WorkflowScoringContext = {
        userQuery: 'email marketing',
        businessDomain: 'Marketing'
      };

      const score = workflowScoring.calculateWorkflowScore(mockWorkflow, context);
      
      expect(score.reasoning).toBeInstanceOf(Array);
      expect(score.reasoning.length).toBeGreaterThan(0);
      expect(score.reasoning[0]).toContain(score.overallScore.toString());
    });

    it('should apply boost factors for high-quality matches', () => {
      const highQualityWorkflow: WorkflowIndex = {
        ...mockWorkflow,
        title: 'Advanced Email Marketing Automation Suite',
        summary: 'Comprehensive email marketing automation workflow with advanced segmentation, A/B testing, and analytics integration',
        integrations: ['email', 'slack', 'hubspot', 'analytics', 'crm'],
        complexity: 'High'
      };

      const context: WorkflowScoringContext = {
        userQuery: 'advanced email marketing automation',
        businessDomain: 'Marketing',
        requiredIntegrations: ['email', 'hubspot', 'analytics'],
        complexityPreference: 'High'
      };

      const score = workflowScoring.calculateWorkflowScore(highQualityWorkflow, context);
      
      // Should have high scores due to multiple matching factors
      expect(score.overallScore).toBeGreaterThan(80);
      expect(score.categoryScore).toBeGreaterThan(80);
      expect(score.serviceScore).toBeGreaterThan(80);
      expect(score.complexityScore).toBeGreaterThan(80);
    });

    it('should handle missing data gracefully', () => {
      const incompleteWorkflow: WorkflowIndex = {
        id: 'incomplete-workflow',
        source: 'github',
        title: 'Incomplete Workflow',
        summary: '',
        link: '#',
        category: 'Other',
        integrations: [],
        complexity: undefined,
        triggerType: undefined,
        tags: [],
        license: 'Unknown',
        domains: ['Other'],
        domain_confidences: [1.0],
        domain_origin: 'llm'
      };

      const score = workflowScoring.calculateWorkflowScore(incompleteWorkflow);
      
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.confidence).toBeLessThan(80); // Lower confidence for incomplete data
    });
  });

  describe('scoreBreakdown', () => {
    it('should provide detailed score breakdown', () => {
      const score = workflowScoring.calculateWorkflowScore(mockWorkflow);
      
      expect(score.scoreBreakdown).toBeDefined();
      expect(score.scoreBreakdown.categoryMatch).toBeGreaterThanOrEqual(0);
      expect(score.scoreBreakdown.categoryMatch).toBeLessThanOrEqual(100);
      expect(score.scoreBreakdown.serviceRelevance).toBeGreaterThanOrEqual(0);
      expect(score.scoreBreakdown.serviceRelevance).toBeLessThanOrEqual(100);
      expect(score.scoreBreakdown.triggerAlignment).toBeGreaterThanOrEqual(0);
      expect(score.scoreBreakdown.triggerAlignment).toBeLessThanOrEqual(100);
      expect(score.scoreBreakdown.complexityFit).toBeGreaterThanOrEqual(0);
      expect(score.scoreBreakdown.complexityFit).toBeLessThanOrEqual(100);
      expect(score.scoreBreakdown.integrationCoverage).toBeGreaterThanOrEqual(0);
      expect(score.scoreBreakdown.integrationCoverage).toBeLessThanOrEqual(100);
      expect(score.scoreBreakdown.dataQuality).toBeGreaterThanOrEqual(0);
      expect(score.scoreBreakdown.dataQuality).toBeLessThanOrEqual(100);
      expect(score.scoreBreakdown.popularity).toBeGreaterThanOrEqual(0);
      expect(score.scoreBreakdown.popularity).toBeLessThanOrEqual(100);
      expect(score.scoreBreakdown.recency).toBeGreaterThanOrEqual(0);
      expect(score.scoreBreakdown.recency).toBeLessThanOrEqual(100);
    });
  });
});
