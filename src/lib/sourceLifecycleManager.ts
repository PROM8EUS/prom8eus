/**
 * Source Lifecycle Management System
 * 
 * This module provides comprehensive lifecycle management for sources including
 * creation, configuration, deployment, monitoring, maintenance, and retirement.
 */

import { monitoringManager } from './monitoringSystem';
import { performanceLoggingManager } from './performanceLoggingSystem';
import { maintenanceProcedureManager } from './maintenanceProcedures';

export interface SourceLifecycle {
  id: string;
  sourceId: string;
  name: string;
  currentStage: LifecycleStage;
  stages: LifecycleStageRecord[];
  created: Date;
  updated: Date;
  createdBy: string;
  metadata: Record<string, any>;
}

export interface LifecycleStage {
  name: 'planning' | 'development' | 'testing' | 'staging' | 'production' | 'maintenance' | 'deprecation' | 'retirement';
  status: 'active' | 'completed' | 'failed' | 'skipped';
  startDate: Date;
  endDate?: Date;
  duration?: number; // days
  milestones: LifecycleMilestone[];
  requirements: string[];
  deliverables: string[];
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface LifecycleStageRecord {
  stage: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  duration?: number;
  notes: string[];
  issues: string[];
  approvals: ApprovalRecord[];
}

export interface LifecycleMilestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  dependencies: string[];
  deliverables: string[];
  acceptanceCriteria: string[];
}

export interface ApprovalRecord {
  id: string;
  approver: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  comments: string;
  timestamp: Date;
}

export interface LifecyclePolicy {
  id: string;
  name: string;
  description: string;
  stages: LifecycleStagePolicy[];
  requirements: PolicyRequirement[];
  approvals: ApprovalPolicy[];
  notifications: NotificationPolicy[];
}

export interface LifecycleStagePolicy {
  stage: string;
  duration: number; // days
  requirements: string[];
  deliverables: string[];
  approvalRequired: boolean;
  autoAdvance: boolean;
}

export interface PolicyRequirement {
  type: 'security' | 'performance' | 'compliance' | 'documentation' | 'testing';
  description: string;
  mandatory: boolean;
  validation: string;
}

export interface ApprovalPolicy {
  stage: string;
  approvers: string[];
  requiredApprovals: number;
  escalationTime: number; // hours
}

export interface NotificationPolicy {
  event: string;
  recipients: string[];
  channels: string[];
  template: string;
}

export interface LifecycleMetrics {
  sourceId: string;
  stage: string;
  metrics: {
    timeInStage: number; // days
    milestoneCompletion: number; // percentage
    requirementCompliance: number; // percentage
    approvalStatus: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  trends: {
    stageDuration: number[];
    milestoneProgress: number[];
    requirementCompliance: number[];
  };
}

export interface LifecycleReport {
  id: string;
  title: string;
  period: {
    start: Date;
    end: Date;
  };
  sources: string[];
  summary: {
    totalSources: number;
    byStage: Record<string, number>;
    averageStageDuration: Record<string, number>;
    complianceRate: number;
    riskLevels: Record<string, number>;
  };
  details: LifecycleMetrics[];
  recommendations: string[];
  actionItems: string[];
}

/**
 * Source Lifecycle Manager
 */
export class SourceLifecycleManager {
  private lifecycles: Map<string, SourceLifecycle> = new Map();
  private policies: Map<string, LifecyclePolicy> = new Map();
  private reports: LifecycleReport[] = [];

  constructor() {
    this.initializePolicies();
  }

  /**
   * Create new source lifecycle
   */
  createLifecycle(sourceId: string, name: string, createdBy: string, policyId?: string): SourceLifecycle {
    const policy = policyId ? this.policies.get(policyId) : this.getDefaultPolicy();
    
    const lifecycle: SourceLifecycle = {
      id: this.generateId(),
      sourceId,
      name,
      currentStage: {
        name: 'planning',
        status: 'active',
        startDate: new Date(),
        milestones: [],
        requirements: policy?.stages.find(s => s.stage === 'planning')?.requirements || [],
        deliverables: policy?.stages.find(s => s.stage === 'planning')?.deliverables || [],
        approvalRequired: policy?.stages.find(s => s.stage === 'planning')?.approvalRequired || false
      },
      stages: [],
      created: new Date(),
      updated: new Date(),
      createdBy,
      metadata: { policyId: policyId || 'default' }
    };

    this.lifecycles.set(lifecycle.id, lifecycle);
    return lifecycle;
  }

  /**
   * Advance source to next stage
   */
  advanceStage(lifecycleId: string, newStage: string, approvedBy?: string): void {
    const lifecycle = this.lifecycles.get(lifecycleId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found: ${lifecycleId}`);
    }

    // Complete current stage
    const currentStage = lifecycle.currentStage;
    currentStage.status = 'completed';
    currentStage.endDate = new Date();
    currentStage.duration = Math.ceil((currentStage.endDate.getTime() - currentStage.startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Record current stage
    lifecycle.stages.push({
      stage: currentStage.name,
      status: currentStage.status,
      startDate: currentStage.startDate,
      endDate: currentStage.endDate,
      duration: currentStage.duration,
      notes: [],
      issues: [],
      approvals: []
    });

    // Start new stage
    const policy = this.policies.get(lifecycle.metadata.policyId as string) || this.getDefaultPolicy();
    const stagePolicy = policy?.stages.find(s => s.stage === newStage);

    lifecycle.currentStage = {
      name: newStage as any,
      status: 'active',
      startDate: new Date(),
      milestones: [],
      requirements: stagePolicy?.requirements || [],
      deliverables: stagePolicy?.deliverables || [],
      approvalRequired: stagePolicy?.approvalRequired || false,
      approvedBy,
      approvedAt: approvedBy ? new Date() : undefined
    };

    lifecycle.updated = new Date();
  }

  /**
   * Add milestone to current stage
   */
  addMilestone(lifecycleId: string, milestone: Omit<LifecycleMilestone, 'id' | 'status'>): void {
    const lifecycle = this.lifecycles.get(lifecycleId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found: ${lifecycleId}`);
    }

    const newMilestone: LifecycleMilestone = {
      id: this.generateId(),
      status: 'pending',
      ...milestone
    };

    lifecycle.currentStage.milestones.push(newMilestone);
    lifecycle.updated = new Date();
  }

  /**
   * Complete milestone
   */
  completeMilestone(lifecycleId: string, milestoneId: string): void {
    const lifecycle = this.lifecycles.get(lifecycleId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found: ${lifecycleId}`);
    }

    const milestone = lifecycle.currentStage.milestones.find(m => m.id === milestoneId);
    if (milestone) {
      milestone.status = 'completed';
      milestone.completedDate = new Date();
    }

    lifecycle.updated = new Date();
  }

  /**
   * Add approval to current stage
   */
  addApproval(lifecycleId: string, approver: string, role: string, status: 'approved' | 'rejected', comments: string): void {
    const lifecycle = this.lifecycles.get(lifecycleId);
    if (!lifecycle) {
      throw new Error(`Lifecycle not found: ${lifecycleId}`);
    }

    const approval: ApprovalRecord = {
      id: this.generateId(),
      approver,
      role,
      status,
      comments,
      timestamp: new Date()
    };

    // Add to current stage if it exists in stages array
    const currentStageRecord = lifecycle.stages.find(s => s.stage === lifecycle.currentStage.name);
    if (currentStageRecord) {
      currentStageRecord.approvals.push(approval);
    }

    lifecycle.updated = new Date();
  }

  /**
   * Get lifecycle by ID
   */
  getLifecycle(id: string): SourceLifecycle | null {
    return this.lifecycles.get(id) || null;
  }

  /**
   * Get lifecycle by source ID
   */
  getLifecycleBySourceId(sourceId: string): SourceLifecycle | null {
    return Array.from(this.lifecycles.values()).find(l => l.sourceId === sourceId) || null;
  }

  /**
   * Get all lifecycles
   */
  getAllLifecycles(): SourceLifecycle[] {
    return Array.from(this.lifecycles.values());
  }

  /**
   * Get lifecycles by stage
   */
  getLifecyclesByStage(stage: string): SourceLifecycle[] {
    return Array.from(this.lifecycles.values()).filter(l => l.currentStage.name === stage);
  }

  /**
   * Get lifecycle metrics
   */
  getLifecycleMetrics(lifecycleId: string): LifecycleMetrics | null {
    const lifecycle = this.lifecycles.get(lifecycleId);
    if (!lifecycle) {
      return null;
    }

    const currentStage = lifecycle.currentStage;
    const timeInStage = Math.ceil((new Date().getTime() - currentStage.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const completedMilestones = currentStage.milestones.filter(m => m.status === 'completed').length;
    const milestoneCompletion = currentStage.milestones.length > 0 ? 
      (completedMilestones / currentStage.milestones.length) * 100 : 100;

    const completedRequirements = currentStage.requirements.length; // Simplified
    const requirementCompliance = currentStage.requirements.length > 0 ? 
      (completedRequirements / currentStage.requirements.length) * 100 : 100;

    const approvalStatus = currentStage.approvalRequired ? 
      (currentStage.approvedBy ? 'approved' : 'pending') : 'not_required';

    const riskLevel = this.calculateRiskLevel(lifecycle);

    return {
      sourceId: lifecycle.sourceId,
      stage: currentStage.name,
      metrics: {
        timeInStage,
        milestoneCompletion,
        requirementCompliance,
        approvalStatus,
        riskLevel
      },
      trends: {
        stageDuration: lifecycle.stages.map(s => s.duration || 0),
        milestoneProgress: [milestoneCompletion],
        requirementCompliance: [requirementCompliance]
      }
    };
  }

  /**
   * Generate lifecycle report
   */
  generateReport(sources: string[], period: { start: Date; end: Date }): LifecycleReport {
    const sourceLifecycles = sources.map(sourceId => 
      this.getLifecycleBySourceId(sourceId)
    ).filter(l => l !== null) as SourceLifecycle[];

    const summary = {
      totalSources: sourceLifecycles.length,
      byStage: this.groupBy(sourceLifecycles.map(l => l.currentStage.name), 'stage'),
      averageStageDuration: this.calculateAverageStageDuration(sourceLifecycles),
      complianceRate: this.calculateComplianceRate(sourceLifecycles),
      riskLevels: this.calculateRiskLevels(sourceLifecycles)
    };

    const details = sourceLifecycles.map(l => this.getLifecycleMetrics(l.id)!).filter(m => m !== null);

    const report: LifecycleReport = {
      id: this.generateId(),
      title: `Lifecycle Report - ${period.start.toISOString().split('T')[0]} to ${period.end.toISOString().split('T')[0]}`,
      period,
      sources,
      summary,
      details,
      recommendations: this.generateRecommendations(sourceLifecycles),
      actionItems: this.generateActionItems(sourceLifecycles)
    };

    this.reports.push(report);
    return report;
  }

  /**
   * Get lifecycle policies
   */
  getPolicies(): LifecyclePolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get policy by ID
   */
  getPolicy(id: string): LifecyclePolicy | null {
    return this.policies.get(id) || null;
  }

  /**
   * Create lifecycle policy
   */
  createPolicy(policy: Omit<LifecyclePolicy, 'id'>): LifecyclePolicy {
    const newPolicy: LifecyclePolicy = {
      id: this.generateId(),
      ...policy
    };

    this.policies.set(newPolicy.id, newPolicy);
    return newPolicy;
  }

  /**
   * Get lifecycle reports
   */
  getReports(filters?: {
    sources?: string[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): LifecycleReport[] {
    let reports = [...this.reports];

    if (filters) {
      if (filters.sources) {
        reports = reports.filter(report => 
          filters.sources!.some(source => report.sources.includes(source))
        );
      }
      if (filters.startDate) {
        reports = reports.filter(report => report.period.start >= filters.startDate!);
      }
      if (filters.endDate) {
        reports = reports.filter(report => report.period.end <= filters.endDate!);
      }
      if (filters.limit) {
        reports = reports.slice(-filters.limit);
      }
    }

    return reports.sort((a, b) => b.period.start.getTime() - a.period.start.getTime());
  }

  /**
   * Get lifecycle statistics
   */
  getStatistics(): any {
    const lifecycles = Array.from(this.lifecycles.values());

    return {
      totalLifecycles: lifecycles.length,
      byStage: this.groupBy(lifecycles.map(l => l.currentStage.name), 'stage'),
      averageStageDuration: this.calculateAverageStageDuration(lifecycles),
      complianceRate: this.calculateComplianceRate(lifecycles),
      riskLevels: this.calculateRiskLevels(lifecycles),
      overdueMilestones: this.getOverdueMilestones(lifecycles),
      pendingApprovals: this.getPendingApprovals(lifecycles)
    };
  }

  /**
   * Private helper methods
   */
  private calculateRiskLevel(lifecycle: SourceLifecycle): 'low' | 'medium' | 'high' | 'critical' {
    const currentStage = lifecycle.currentStage;
    const timeInStage = Math.ceil((new Date().getTime() - currentStage.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check for overdue milestones
    const overdueMilestones = currentStage.milestones.filter(m => 
      m.status !== 'completed' && m.targetDate < new Date()
    );

    // Check for long stage duration
    const policy = this.policies.get(lifecycle.metadata.policyId as string) || this.getDefaultPolicy();
    const stagePolicy = policy?.stages.find(s => s.stage === currentStage.name);
    const isOverdue = stagePolicy && timeInStage > stagePolicy.duration;

    if (overdueMilestones.length > 2 || isOverdue) {
      return 'critical';
    } else if (overdueMilestones.length > 0 || timeInStage > (stagePolicy?.duration || 30) * 0.8) {
      return 'high';
    } else if (timeInStage > (stagePolicy?.duration || 30) * 0.6) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private groupBy(array: string[], key: string): Record<string, number> {
    return array.reduce((groups, item) => {
      groups[item] = (groups[item] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  private calculateAverageStageDuration(lifecycles: SourceLifecycle[]): Record<string, number> {
    const stageDurations: Record<string, number[]> = {};

    for (const lifecycle of lifecycles) {
      for (const stage of lifecycle.stages) {
        if (stage.duration) {
          if (!stageDurations[stage.stage]) {
            stageDurations[stage.stage] = [];
          }
          stageDurations[stage.stage].push(stage.duration);
        }
      }
    }

    const averages: Record<string, number> = {};
    for (const [stage, durations] of Object.entries(stageDurations)) {
      averages[stage] = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    }

    return averages;
  }

  private calculateComplianceRate(lifecycles: SourceLifecycle[]): number {
    if (lifecycles.length === 0) return 100;

    const totalRequirements = lifecycles.reduce((sum, l) => sum + l.currentStage.requirements.length, 0);
    const completedRequirements = lifecycles.reduce((sum, l) => {
      // Simplified: assume all requirements are completed
      return sum + l.currentStage.requirements.length;
    }, 0);

    return totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 100;
  }

  private calculateRiskLevels(lifecycles: SourceLifecycle[]): Record<string, number> {
    const riskLevels: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };

    for (const lifecycle of lifecycles) {
      const riskLevel = this.calculateRiskLevel(lifecycle);
      riskLevels[riskLevel]++;
    }

    return riskLevels;
  }

  private getOverdueMilestones(lifecycles: SourceLifecycle[]): number {
    let overdueCount = 0;

    for (const lifecycle of lifecycles) {
      const overdueMilestones = lifecycle.currentStage.milestones.filter(m => 
        m.status !== 'completed' && m.targetDate < new Date()
      );
      overdueCount += overdueMilestones.length;
    }

    return overdueCount;
  }

  private getPendingApprovals(lifecycles: SourceLifecycle[]): number {
    let pendingCount = 0;

    for (const lifecycle of lifecycles) {
      if (lifecycle.currentStage.approvalRequired && !lifecycle.currentStage.approvedBy) {
        pendingCount++;
      }
    }

    return pendingCount;
  }

  private generateRecommendations(lifecycles: SourceLifecycle[]): string[] {
    const recommendations: string[] = [];

    const overdueMilestones = this.getOverdueMilestones(lifecycles);
    if (overdueMilestones > 0) {
      recommendations.push(`Address ${overdueMilestones} overdue milestones across all lifecycles`);
    }

    const pendingApprovals = this.getPendingApprovals(lifecycles);
    if (pendingApprovals > 0) {
      recommendations.push(`Process ${pendingApprovals} pending approvals`);
    }

    const highRiskLifecycles = lifecycles.filter(l => this.calculateRiskLevel(l) === 'high' || this.calculateRiskLevel(l) === 'critical');
    if (highRiskLifecycles.length > 0) {
      recommendations.push(`Review ${highRiskLifecycles.length} high-risk lifecycles`);
    }

    return recommendations;
  }

  private generateActionItems(lifecycles: SourceLifecycle[]): string[] {
    const actionItems: string[] = [];

    actionItems.push('Review lifecycle policies and update as needed');
    actionItems.push('Implement automated milestone tracking');
    actionItems.push('Set up lifecycle monitoring and alerting');

    return actionItems;
  }

  private getDefaultPolicy(): LifecyclePolicy {
    return {
      id: 'default',
      name: 'Default Lifecycle Policy',
      description: 'Default lifecycle policy for source management',
      stages: [
        {
          stage: 'planning',
          duration: 7,
          requirements: ['Define requirements', 'Create design document'],
          deliverables: ['Requirements document', 'Design document'],
          approvalRequired: true,
          autoAdvance: false
        },
        {
          stage: 'development',
          duration: 14,
          requirements: ['Implement source integration', 'Create unit tests'],
          deliverables: ['Source code', 'Unit tests'],
          approvalRequired: true,
          autoAdvance: false
        },
        {
          stage: 'testing',
          duration: 7,
          requirements: ['Integration tests', 'Performance tests'],
          deliverables: ['Test results', 'Performance report'],
          approvalRequired: true,
          autoAdvance: false
        },
        {
          stage: 'staging',
          duration: 3,
          requirements: ['Staging deployment', 'User acceptance testing'],
          deliverables: ['Staging environment', 'UAT results'],
          approvalRequired: true,
          autoAdvance: false
        },
        {
          stage: 'production',
          duration: 365,
          requirements: ['Production deployment', 'Monitoring setup'],
          deliverables: ['Production environment', 'Monitoring dashboard'],
          approvalRequired: true,
          autoAdvance: false
        }
      ],
      requirements: [
        {
          type: 'security',
          description: 'Security review and approval',
          mandatory: true,
          validation: 'Security team approval'
        },
        {
          type: 'performance',
          description: 'Performance benchmarks met',
          mandatory: true,
          validation: 'Performance test results'
        }
      ],
      approvals: [
        {
          stage: 'planning',
          approvers: ['Product Manager', 'Technical Lead'],
          requiredApprovals: 2,
          escalationTime: 24
        }
      ],
      notifications: [
        {
          event: 'milestone_overdue',
          recipients: ['Project Manager', 'Technical Lead'],
          channels: ['email', 'slack'],
          template: 'Milestone {milestone} is overdue for source {source}'
        }
      ]
    };
  }

  private initializePolicies(): void {
    const defaultPolicy = this.getDefaultPolicy();
    this.policies.set(defaultPolicy.id, defaultPolicy);
  }

  private generateId(): string {
    return `lifecycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const sourceLifecycleManager = new SourceLifecycleManager();
