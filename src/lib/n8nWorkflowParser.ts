/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use the new unified schema files instead:
 * - For WorkflowIndex: use @/lib/schemas/workflowIndex
 * - For N8nWorkflow: use @/lib/schemas/n8nWorkflow
 * - For WorkflowIndexer: use @/lib/workflowIndexerUnified
 * - For N8nApi: use @/lib/n8nApiUnified
 */

/**
 * N8N Workflow Parser
 * 
 * Handles parsing and validation of n8n workflow data
 */

import { N8nWorkflow, N8nWorkflowFile, N8nWorkflowMetadata } from './schemas/n8nWorkflow';

export class N8nWorkflowParser {
  /**
   * Parse workflow file content and extract metadata
   */
  static parseWorkflowFile(content: string, file: N8nWorkflowFile): N8nWorkflow | null {
    try {
      const workflowData = JSON.parse(content);
      
      // Extract basic information
      const name = this.extractWorkflowName(workflowData, file.name);
      const description = this.extractDescription(workflowData);
      const category = this.extractCategory(file.path);
      const difficulty = this.extractDifficulty(workflowData);
      const estimatedTime = this.extractEstimatedTime(workflowData);
      const estimatedCost = this.extractEstimatedCost(workflowData);
      const nodes = this.countNodes(workflowData);
      const connections = this.countConnections(workflowData);
      const triggerType = this.extractTriggerType(workflowData);
      const integrations = this.extractIntegrations(workflowData);
      const author = this.extractAuthor(workflowData);

      const workflow: N8nWorkflow = {
        id: this.generateWorkflowId(file.path),
        name,
        description,
        category,
        difficulty,
        estimatedTime,
        estimatedCost,
        nodes,
        connections,
        downloads: 0, // Default value
        rating: 0, // Default value
        createdAt: new Date().toISOString(),
        url: file.html_url,
        jsonUrl: file.download_url,
        active: true,
        triggerType,
        integrations,
        author
      };

      return workflow;
    } catch (error) {
      console.warn(`Failed to parse workflow file ${file.name}:`, error);
      return null;
    }
  }

  /**
   * Parse multiple workflow files
   */
  static parseWorkflowFiles(files: N8nWorkflowFile[]): N8nWorkflow[] {
    const workflows: N8nWorkflow[] = [];

    for (const file of files) {
      try {
        // For now, we'll create a basic workflow structure
        // In a real implementation, you would fetch the file content
        const workflow = this.createWorkflowFromFile(file);
        if (workflow) {
          workflows.push(workflow);
        }
      } catch (error) {
        console.warn(`Failed to process workflow file ${file.name}:`, error);
      }
    }

    return workflows;
  }

  /**
   * Validate workflow data
   */
  static validateWorkflow(workflow: any): workflow is N8nWorkflow {
    return (
      workflow &&
      typeof workflow.id === 'string' &&
      typeof workflow.name === 'string' &&
      typeof workflow.description === 'string' &&
      typeof workflow.category === 'string' &&
      ['Easy', 'Medium', 'Hard'].includes(workflow.difficulty) &&
      typeof workflow.estimatedTime === 'string' &&
      typeof workflow.estimatedCost === 'string' &&
      typeof workflow.nodes === 'number' &&
      typeof workflow.connections === 'number' &&
      typeof workflow.downloads === 'number' &&
      typeof workflow.rating === 'number' &&
      typeof workflow.createdAt === 'string' &&
      typeof workflow.url === 'string' &&
      typeof workflow.jsonUrl === 'string' &&
      typeof workflow.active === 'boolean' &&
      typeof workflow.triggerType === 'string' &&
      Array.isArray(workflow.integrations)
    );
  }

  /**
   * Extract workflow name from data or filename
   */
  private static extractWorkflowName(workflowData: any, filename: string): string {
    if (workflowData?.name) {
      return workflowData.name;
    }
    if (workflowData?.meta?.name) {
      return workflowData.meta.name;
    }
    // Fallback to filename without extension
    return filename.replace(/\.json$/, '').replace(/[-_]/g, ' ');
  }

  /**
   * Extract description from workflow data
   */
  private static extractDescription(workflowData: any): string {
    if (workflowData?.description) {
      return workflowData.description;
    }
    if (workflowData?.meta?.description) {
      return workflowData.meta.description;
    }
    return 'No description available';
  }

  /**
   * Extract category from file path
   */
  private static extractCategory(filePath: string): string {
    const pathParts = filePath.split('/');
    if (pathParts.length >= 3) {
      return pathParts[2]; // workflows/category/filename.json
    }
    return 'General';
  }

  /**
   * Extract difficulty from workflow data
   */
  private static extractDifficulty(workflowData: any): 'Easy' | 'Medium' | 'Hard' {
    if (workflowData?.meta?.difficulty) {
      const difficulty = workflowData.meta.difficulty.toLowerCase();
      if (difficulty.includes('easy') || difficulty.includes('simple')) return 'Easy';
      if (difficulty.includes('hard') || difficulty.includes('complex')) return 'Hard';
      return 'Medium';
    }
    
    // Estimate difficulty based on node count
    const nodeCount = this.countNodes(workflowData);
    if (nodeCount <= 5) return 'Easy';
    if (nodeCount <= 15) return 'Medium';
    return 'Hard';
  }

  /**
   * Extract estimated time from workflow data
   */
  private static extractEstimatedTime(workflowData: any): string {
    if (workflowData?.meta?.estimatedTime) {
      return workflowData.meta.estimatedTime;
    }
    
    // Estimate based on node count
    const nodeCount = this.countNodes(workflowData);
    if (nodeCount <= 5) return '15 min';
    if (nodeCount <= 10) return '30 min';
    if (nodeCount <= 20) return '1 h';
    return '2 h';
  }

  /**
   * Extract estimated cost from workflow data
   */
  private static extractEstimatedCost(workflowData: any): string {
    if (workflowData?.meta?.estimatedCost) {
      return workflowData.meta.estimatedCost;
    }
    
    // Estimate based on node count and complexity
    const nodeCount = this.countNodes(workflowData);
    const difficulty = this.extractDifficulty(workflowData);
    
    let baseCost = 0;
    if (difficulty === 'Easy') baseCost = 10;
    else if (difficulty === 'Medium') baseCost = 25;
    else baseCost = 50;
    
    const totalCost = baseCost + (nodeCount * 2);
    return `€${totalCost}`;
  }

  /**
   * Count nodes in workflow
   */
  private static countNodes(workflowData: any): number {
    if (workflowData?.nodes && Array.isArray(workflowData.nodes)) {
      return workflowData.nodes.length;
    }
    return 0;
  }

  /**
   * Count connections in workflow
   */
  private static countConnections(workflowData: any): number {
    if (workflowData?.connections && typeof workflowData.connections === 'object') {
      return Object.keys(workflowData.connections).length;
    }
    return 0;
  }

  /**
   * Extract trigger type from workflow data
   */
  private static extractTriggerType(workflowData: any): string {
    if (workflowData?.nodes && Array.isArray(workflowData.nodes)) {
      const triggerNode = workflowData.nodes.find((node: any) => 
        node.type && (
          node.type.includes('Trigger') || 
          node.type.includes('Webhook') ||
          node.type.includes('Schedule')
        )
      );
      
      if (triggerNode) {
        if (triggerNode.type.includes('Webhook')) return 'Webhook';
        if (triggerNode.type.includes('Schedule')) return 'Scheduled';
        return 'Manual';
      }
    }
    return 'Manual';
  }

  /**
   * Extract integrations from workflow data
   */
  private static extractIntegrations(workflowData: any): string[] {
    const integrations: string[] = [];
    
    if (workflowData?.nodes && Array.isArray(workflowData.nodes)) {
      for (const node of workflowData.nodes) {
        if (node.type && !node.type.includes('Trigger') && !node.type.includes('Function')) {
          const integration = node.type.split('.')[0];
          if (integration && !integrations.includes(integration)) {
            integrations.push(integration);
          }
        }
      }
    }
    
    return integrations;
  }

  /**
   * Extract author from workflow data
   */
  private static extractAuthor(workflowData: any): string | undefined {
    if (workflowData?.meta?.author) {
      return workflowData.meta.author;
    }
    return undefined;
  }

  /**
   * Generate unique workflow ID from file path
   */
  private static generateWorkflowId(filePath: string): string {
    return filePath.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  /**
   * Create workflow from file metadata (fallback method)
   */
  private static createWorkflowFromFile(file: N8nWorkflowFile): N8nWorkflow | null {
    try {
      const name = file.name.replace(/\.json$/, '').replace(/[-_]/g, ' ');
      const category = this.extractCategory(file.path);
      
      return {
        id: this.generateWorkflowId(file.path),
        name,
        description: `Workflow: ${name}`,
        category,
        difficulty: 'Medium',
        estimatedTime: '30 min',
        estimatedCost: '€25',
        nodes: 0,
        connections: 0,
        downloads: 0,
        rating: 0,
        createdAt: new Date().toISOString(),
        url: file.html_url,
        jsonUrl: file.download_url,
        active: true,
        triggerType: 'Manual',
        integrations: [],
        author: undefined
      };
    } catch (error) {
      console.warn(`Failed to create workflow from file ${file.name}:`, error);
      return null;
    }
  }
}
