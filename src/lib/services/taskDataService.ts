/**
 * Task Data Service - Server-side data fetching
 * Replaces client-side AI generation with server-provided data
 */

import { DynamicSubtask, UnifiedWorkflow } from '@/lib/types';
import { analysisCacheService } from './analysisCacheService';

export interface TaskDataResponse {
  subtasks: DynamicSubtask[];
  workflows: UnifiedWorkflow[];
  insights: any[];
  businessCase: {
    automationRatio: number;
    manualHours: number;
    automatedHours: number;
    estimatedSavings: number;
  };
}

export interface WorkflowRequest {
  taskId: string;
  subtaskId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Task Data Service
 * Handles fetching task-related data from server/edge layers
 */
export class TaskDataService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch complete task data including subtasks, workflows, and insights
   */
  async fetchTaskData(taskId: string): Promise<TaskDataResponse> {
    try {
      console.log('🔄 [TaskDataService] Fetching task data for:', taskId);
      
      // Check cache first
      const cachedData = await analysisCacheService.getCachedAnalysisResults(taskId);
      if (cachedData) {
        console.log('✅ [TaskDataService] Using cached task data');
        return cachedData;
      }
      
      // TODO: Replace with actual server API call
      // const response = await fetch(`${this.baseUrl}/tasks/${taskId}/data`);
      // if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // const data = await response.json();
      
      // Mock response for now
      const data = this.getMockTaskData(taskId);
      
      // Cache the result
      await analysisCacheService.cacheAnalysisResults(taskId, data);
      
      return data;
    } catch (error) {
      console.error('❌ [TaskDataService] Failed to fetch task data:', error);
      throw error;
    }
  }

  /**
   * Fetch workflows for a specific subtask
   */
  async fetchWorkflowsForSubtask(request: WorkflowRequest): Promise<UnifiedWorkflow[]> {
    try {
      console.log('🔄 [TaskDataService] Fetching workflows for subtask:', request.subtaskId);
      
      // Check cache first
      const cacheKey = request.subtaskId ? `${request.taskId}:${request.subtaskId}` : request.taskId;
      const cachedWorkflows = await analysisCacheService.getCachedWorkflows(request.taskId, request.subtaskId || null);
      if (cachedWorkflows) {
        console.log('✅ [TaskDataService] Using cached workflows');
        return cachedWorkflows;
      }
      
      // TODO: Replace with actual server API call
      // const response = await fetch(`${this.baseUrl}/workflows`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(request)
      // });
      // if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // const workflows = await response.json();
      
      // Mock response for now
      const workflows = this.getMockWorkflows(request);
      
      // Cache the result
      await analysisCacheService.cacheWorkflows(request.taskId, request.subtaskId || null, workflows);
      
      return workflows;
    } catch (error) {
      console.error('❌ [TaskDataService] Failed to fetch workflows:', error);
      throw error;
    }
  }

  /**
   * Fetch all workflows for a task
   */
  async fetchAllWorkflows(taskId: string, limit: number = 10, offset: number = 0): Promise<UnifiedWorkflow[]> {
    try {
      console.log('🔄 [TaskDataService] Fetching all workflows for task:', taskId);
      
      // Check cache first (for all workflows)
      const cachedWorkflows = await analysisCacheService.getCachedWorkflows(taskId, null);
      if (cachedWorkflows && offset === 0) {
        console.log('✅ [TaskDataService] Using cached all workflows');
        return cachedWorkflows.slice(0, limit);
      }
      
      // TODO: Replace with actual server API call
      // const response = await fetch(`${this.baseUrl}/tasks/${taskId}/workflows?limit=${limit}&offset=${offset}`);
      // if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // const workflows = await response.json();
      
      // Mock response for now
      const workflows = this.getMockWorkflows({ taskId, limit, offset });
      
      // Cache the result (only for first page)
      if (offset === 0) {
        await analysisCacheService.cacheWorkflows(taskId, null, workflows);
      }
      
      return workflows;
    } catch (error) {
      console.error('❌ [TaskDataService] Failed to fetch all workflows:', error);
      throw error;
    }
  }

  /**
   * Fetch insights and trends for a task
   */
  async fetchInsights(taskId: string): Promise<any[]> {
    try {
      console.log('🔄 [TaskDataService] Fetching insights for task:', taskId);
      
      // Check cache first
      const cachedInsights = await analysisCacheService.getCachedInsights(taskId);
      if (cachedInsights) {
        console.log('✅ [TaskDataService] Using cached insights');
        return cachedInsights;
      }
      
      // TODO: Replace with actual server API call
      // const response = await fetch(`${this.baseUrl}/tasks/${taskId}/insights`);
      // if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // const insights = await response.json();
      
      // Mock response for now
      const insights = this.getMockInsights(taskId);
      
      // Cache the result
      await analysisCacheService.cacheInsights(taskId, insights);
      
      return insights;
    } catch (error) {
      console.error('❌ [TaskDataService] Failed to fetch insights:', error);
      throw error;
    }
  }

  /**
   * Generate workflows on server side (replaces client-side AI generation)
   */
  async generateWorkflows(request: {
    taskId: string;
    subtaskId?: string;
    count: number;
    context: 'overarching' | 'subtask-specific';
  }): Promise<UnifiedWorkflow[]> {
    try {
      console.log('🔄 [TaskDataService] Generating workflows on server:', request);
      
      // TODO: Replace with actual server API call
      // const response = await fetch(`${this.baseUrl}/workflows/generate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(request)
      // });
      // if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // return await response.json();
      
      // Mock response for now
      return this.getMockWorkflows(request);
    } catch (error) {
      console.error('❌ [TaskDataService] Failed to generate workflows:', error);
      throw error;
    }
  }

  /**
   * Generate subtasks on server side (replaces client-side AI generation)
   */
  async generateSubtasks(taskId: string, taskText: string, lang: 'de' | 'en' = 'de'): Promise<DynamicSubtask[]> {
    try {
      console.log('🔄 [TaskDataService] Generating subtasks on server:', taskId);
      
      // TODO: Replace with actual server API call
      // const response = await fetch(`${this.baseUrl}/tasks/${taskId}/subtasks/generate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ taskText, lang })
      // });
      // if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // return await response.json();
      
      // Mock response for now
      return this.getMockSubtasks(taskText, lang);
    } catch (error) {
      console.error('❌ [TaskDataService] Failed to generate subtasks:', error);
      throw error;
    }
  }

  // Mock data methods (to be replaced with real API calls)
  private getMockTaskData(taskId: string): TaskDataResponse {
    return {
      subtasks: this.getMockSubtasks('Mock task', 'de'),
      workflows: this.getMockWorkflows({ taskId }),
      insights: this.getMockInsights(taskId),
      businessCase: {
        automationRatio: 75,
        manualHours: 40,
        automatedHours: 10,
        estimatedSavings: 1800
      }
    };
  }

  private getMockSubtasks(taskText: string, lang: 'de' | 'en'): DynamicSubtask[] {
    return [
      {
        id: 'subtask-1',
        title: lang === 'de' ? 'Datenanalyse und -aufbereitung' : 'Data Analysis and Preparation',
        description: lang === 'de' ? 'Sammeln und strukturieren von Daten' : 'Collect and structure data',
        systems: ['Database', 'Analytics Tools'],
        aiTools: ['Data Processing', 'ETL Tools'],
        selectedTools: [],
        manualHoursShare: 0.3,
        automationPotential: 0.7,
        risks: [lang === 'de' ? 'Datenqualität' : 'Data Quality'],
        assumptions: [],
        kpis: [],
        qualityGates: []
      },
      {
        id: 'subtask-2',
        title: lang === 'de' ? 'Implementierung und Testing' : 'Implementation and Testing',
        description: lang === 'de' ? 'Entwicklung und Testen der Lösung' : 'Develop and test the solution',
        systems: ['Development Environment', 'Testing Tools'],
        aiTools: ['Code Generation', 'Test Automation'],
        selectedTools: [],
        manualHoursShare: 0.4,
        automationPotential: 0.6,
        risks: [lang === 'de' ? 'Technische Komplexität' : 'Technical Complexity'],
        assumptions: [],
        kpis: [],
        qualityGates: []
      }
    ];
  }

  private getMockWorkflows(request: any): UnifiedWorkflow[] {
    const count = request.count || request.limit || 3;
    const workflows: UnifiedWorkflow[] = [];
    
    for (let i = 0; i < count; i++) {
      workflows.push({
        id: `workflow-${i + 1}`,
        title: `Mock Workflow ${i + 1}`,
        description: `Generated workflow for ${request.subtaskId || 'main task'}`,
        automationPotential: 70 + (i * 5),
        complexity: i === 0 ? 'low' : i === 1 ? 'medium' : 'high',
        estimatedTime: `${2 + i} hours`,
        systems: ['System A', 'System B'],
        benefits: ['Benefit 1', 'Benefit 2'],
        steps: [
          {
            id: `step-${i}-1`,
            title: 'Step 1',
            description: 'First step',
            estimatedTime: 30,
            prerequisites: [],
            tools_required: ['Tool A']
          }
        ],
        metadata: {
          created: new Date(),
          version: '1.0',
          source: 'server-generated'
        }
      });
    }
    
    return workflows;
  }

  private getMockInsights(taskId: string): any[] {
    return [
      {
        id: 'insight-1',
        title: 'Automation Trend',
        description: 'Increasing automation potential in this domain',
        type: 'trend',
        confidence: 0.8
      },
      {
        id: 'insight-2',
        title: 'Market Analysis',
        description: 'Growing demand for automation solutions',
        type: 'market',
        confidence: 0.9
      }
    ];
  }
}

// Export singleton instance
export const taskDataService = new TaskDataService();
