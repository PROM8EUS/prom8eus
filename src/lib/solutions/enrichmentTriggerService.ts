import { supabase } from '../supabase';
import { EnrichmentService } from './enrichmentService';
import { SolutionIndex, WorkflowIndex, AgentIndex } from './workflowIndexer';

export interface EnrichmentTrigger {
  id: string;
  solution_id: string;
  solution_type: 'workflow' | 'agent';
  trigger_type: 'first_import' | 'admin_refresh' | 'manual' | 'scheduled';
  enrichment_types: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface EnrichmentTriggerOptions {
  enrichmentTypes?: ('summary' | 'categories' | 'capabilities' | 'domains')[];
  priority?: number;
  scheduledAt?: Date;
  forceRefresh?: boolean;
}

export class EnrichmentTriggerService {
  private static readonly DEFAULT_ENRICHMENT_TYPES: ('summary' | 'categories' | 'capabilities' | 'domains')[] = 
    ['summary', 'categories', 'domains'];
  private static readonly AGENT_ENRICHMENT_TYPES: ('summary' | 'categories' | 'capabilities' | 'domains')[] = 
    ['summary', 'categories', 'capabilities', 'domains'];
  private static readonly MAX_CONCURRENT_PROCESSING = 5;
  private static readonly PROCESSING_TIMEOUT_MS = 300000; // 5 minutes

  /**
   * Create enrichment trigger for first import
   */
  static async triggerFirstImport(
    solution: SolutionIndex,
    options: EnrichmentTriggerOptions = {}
  ): Promise<string> {
    const enrichmentTypes = options.enrichmentTypes || 
      (solution.type === 'agent' ? this.AGENT_ENRICHMENT_TYPES : this.DEFAULT_ENRICHMENT_TYPES);

    try {
      const { data, error } = await supabase.rpc('create_enrichment_trigger', {
        p_solution_id: solution.id,
        p_solution_type: solution.type === 'workflow' ? 'workflow' : 'agent',
        p_trigger_type: 'first_import',
        p_enrichment_types: enrichmentTypes,
        p_priority: options.priority || 1,
        p_scheduled_at: options.scheduledAt?.toISOString() || null
      });

      if (error) {
        console.error('Error creating first import trigger:', error);
        throw new Error(`Failed to create first import trigger: ${error.message}`);
      }

      console.log(`Created first import trigger for ${solution.id}: ${data}`);
      return data;
    } catch (error) {
      console.error('Error in triggerFirstImport:', error);
      throw error;
    }
  }

  /**
   * Create enrichment trigger for admin refresh
   */
  static async triggerAdminRefresh(
    solution: SolutionIndex,
    options: EnrichmentTriggerOptions = {}
  ): Promise<string> {
    const enrichmentTypes = options.enrichmentTypes || 
      (solution.type === 'agent' ? this.AGENT_ENRICHMENT_TYPES : this.DEFAULT_ENRICHMENT_TYPES);

    try {
      const { data, error } = await supabase.rpc('create_enrichment_trigger', {
        p_solution_id: solution.id,
        p_solution_type: solution.type === 'workflow' ? 'workflow' : 'agent',
        p_trigger_type: 'admin_refresh',
        p_enrichment_types: enrichmentTypes,
        p_priority: options.priority || 2,
        p_scheduled_at: options.scheduledAt?.toISOString() || null
      });

      if (error) {
        console.error('Error creating admin refresh trigger:', error);
        throw new Error(`Failed to create admin refresh trigger: ${error.message}`);
      }

      console.log(`Created admin refresh trigger for ${solution.id}: ${data}`);
      return data;
    } catch (error) {
      console.error('Error in triggerAdminRefresh:', error);
      throw error;
    }
  }

  /**
   * Create manual enrichment trigger
   */
  static async triggerManual(
    solution: SolutionIndex,
    options: EnrichmentTriggerOptions = {}
  ): Promise<string> {
    const enrichmentTypes = options.enrichmentTypes || 
      (solution.type === 'agent' ? this.AGENT_ENRICHMENT_TYPES : this.DEFAULT_ENRICHMENT_TYPES);

    try {
      const { data, error } = await supabase.rpc('create_enrichment_trigger', {
        p_solution_id: solution.id,
        p_solution_type: solution.type === 'workflow' ? 'workflow' : 'agent',
        p_trigger_type: 'manual',
        p_enrichment_types: enrichmentTypes,
        p_priority: options.priority || 3,
        p_scheduled_at: options.scheduledAt?.toISOString() || null
      });

      if (error) {
        console.error('Error creating manual trigger:', error);
        throw new Error(`Failed to create manual trigger: ${error.message}`);
      }

      console.log(`Created manual trigger for ${solution.id}: ${data}`);
      return data;
    } catch (error) {
      console.error('Error in triggerManual:', error);
      throw error;
    }
  }

  /**
   * Create scheduled enrichment trigger
   */
  static async triggerScheduled(
    solution: SolutionIndex,
    scheduledAt: Date,
    options: EnrichmentTriggerOptions = {}
  ): Promise<string> {
    const enrichmentTypes = options.enrichmentTypes || 
      (solution.type === 'agent' ? this.AGENT_ENRICHMENT_TYPES : this.DEFAULT_ENRICHMENT_TYPES);

    try {
      const { data, error } = await supabase.rpc('create_enrichment_trigger', {
        p_solution_id: solution.id,
        p_solution_type: solution.type === 'workflow' ? 'workflow' : 'agent',
        p_trigger_type: 'scheduled',
        p_enrichment_types: enrichmentTypes,
        p_priority: options.priority || 0,
        p_scheduled_at: scheduledAt.toISOString()
      });

      if (error) {
        console.error('Error creating scheduled trigger:', error);
        throw new Error(`Failed to create scheduled trigger: ${error.message}`);
      }

      console.log(`Created scheduled trigger for ${solution.id}: ${data}`);
      return data;
    } catch (error) {
      console.error('Error in triggerScheduled:', error);
      throw error;
    }
  }

  /**
   * Get pending enrichment triggers
   */
  static async getPendingTriggers(limit: number = 10): Promise<EnrichmentTrigger[]> {
    try {
      const { data, error } = await supabase.rpc('get_pending_enrichment_triggers', {
        p_limit: limit
      });

      if (error) {
        console.error('Error getting pending triggers:', error);
        throw new Error(`Failed to get pending triggers: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingTriggers:', error);
      throw error;
    }
  }

  /**
   * Update enrichment trigger status
   */
  static async updateTriggerStatus(
    triggerId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_enrichment_trigger_status', {
        p_trigger_id: triggerId,
        p_status: status,
        p_error_message: errorMessage || null
      });

      if (error) {
        console.error('Error updating trigger status:', error);
        throw new Error(`Failed to update trigger status: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateTriggerStatus:', error);
      throw error;
    }
  }

  /**
   * Process enrichment triggers
   */
  static async processTriggers(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Get pending triggers
      const pendingTriggers = await this.getPendingTriggers(this.MAX_CONCURRENT_PROCESSING);
      
      if (pendingTriggers.length === 0) {
        console.log('No pending enrichment triggers to process');
        return results;
      }

      console.log(`Processing ${pendingTriggers.length} enrichment triggers`);

      // Process triggers concurrently
      const processingPromises = pendingTriggers.map(trigger => 
        this.processTrigger(trigger)
      );

      const triggerResults = await Promise.allSettled(processingPromises);

      // Analyze results
      triggerResults.forEach((result, index) => {
        results.processed++;
        
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push(`Trigger ${pendingTriggers[index].id}: ${result.value.error}`);
          }
        } else {
          results.failed++;
          results.errors.push(`Trigger ${pendingTriggers[index].id}: ${result.reason}`);
        }
      });

      console.log(`Enrichment processing complete: ${results.successful} successful, ${results.failed} failed`);
      return results;

    } catch (error) {
      console.error('Error processing enrichment triggers:', error);
      results.errors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return results;
    }
  }

  /**
   * Process a single enrichment trigger
   */
  private static async processTrigger(trigger: EnrichmentTrigger): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Update status to processing
      await this.updateTriggerStatus(trigger.id, 'processing');

      // Get solution data
      const solution = await this.getSolutionData(trigger.solution_id, trigger.solution_type);
      if (!solution) {
        throw new Error(`Solution ${trigger.solution_id} not found`);
      }

      // Process each enrichment type
      const enrichmentResults = await EnrichmentService.batchEnrich(
        [solution],
        trigger.enrichment_types as any,
        true // Force refresh for admin triggers
      );

      // Check if any enrichments failed
      const failedEnrichments = enrichmentResults.filter(result => !result.success);
      if (failedEnrichments.length > 0) {
        const errorMessages = failedEnrichments.map(result => result.error).join('; ');
        throw new Error(`Enrichment failures: ${errorMessages}`);
      }

      // Update status to completed
      await this.updateTriggerStatus(trigger.id, 'completed');

      console.log(`Successfully processed trigger ${trigger.id} for ${trigger.solution_id}`);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update status to failed
      await this.updateTriggerStatus(trigger.id, 'failed', errorMessage);
      
      console.error(`Failed to process trigger ${trigger.id}:`, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get solution data from cache or database
   */
  private static async getSolutionData(
    solutionId: string,
    solutionType: 'workflow' | 'agent'
  ): Promise<SolutionIndex | null> {
    try {
      // Try to get from workflow cache first
      const { data: cacheData, error: cacheError } = await supabase
        .from('workflow_cache')
        .select('workflows')
        .eq('cache_type', solutionType)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!cacheError && cacheData?.workflows) {
        const workflows = Array.isArray(cacheData.workflows) ? cacheData.workflows : [];
        const solution = workflows.find((w: any) => w.id === solutionId);
        
        if (solution) {
          return solution as SolutionIndex;
        }
      }

      // Fallback: create a minimal solution object
      console.warn(`Solution ${solutionId} not found in cache, creating minimal object`);
      return {
        id: solutionId,
        source: 'unknown',
        title: `Solution ${solutionId}`,
        summary: 'No description available',
        link: '',
        type: solutionType,
        ...(solutionType === 'workflow' ? {
          category: 'other',
          integrations: [],
          complexity: 'Medium' as const
        } : {
          model: 'unknown',
          provider: 'unknown',
          capabilities: []
        })
      } as SolutionIndex;

    } catch (error) {
      console.error('Error getting solution data:', error);
      return null;
    }
  }

  /**
   * Get enrichment trigger statistics
   */
  static async getTriggerStatistics(): Promise<{
    total_triggers: number;
    pending_triggers: number;
    processing_triggers: number;
    completed_triggers: number;
    failed_triggers: number;
    triggers_by_type: Record<string, number>;
    triggers_by_status: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('enrichment_triggers')
        .select('*');

      if (error) {
        console.error('Error fetching trigger statistics:', error);
        return {
          total_triggers: 0,
          pending_triggers: 0,
          processing_triggers: 0,
          completed_triggers: 0,
          failed_triggers: 0,
          triggers_by_type: {},
          triggers_by_status: {}
        };
      }

      const stats = {
        total_triggers: data.length,
        pending_triggers: data.filter(t => t.status === 'pending').length,
        processing_triggers: data.filter(t => t.status === 'processing').length,
        completed_triggers: data.filter(t => t.status === 'completed').length,
        failed_triggers: data.filter(t => t.status === 'failed').length,
        triggers_by_type: data.reduce((acc, trigger) => {
          acc[trigger.trigger_type] = (acc[trigger.trigger_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        triggers_by_status: data.reduce((acc, trigger) => {
          acc[trigger.status] = (acc[trigger.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      console.error('Error calculating trigger statistics:', error);
      return {
        total_triggers: 0,
        pending_triggers: 0,
        processing_triggers: 0,
        completed_triggers: 0,
        failed_triggers: 0,
        triggers_by_type: {},
        triggers_by_status: {}
      };
    }
  }

  /**
   * Clean up old completed triggers
   */
  static async cleanupOldTriggers(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from('enrichment_triggers')
        .delete()
        .eq('status', 'completed')
        .lt('completed_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('Error cleaning up old triggers:', error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`Cleaned up ${deletedCount} old enrichment triggers`);
      return deletedCount;

    } catch (error) {
      console.error('Error in cleanupOldTriggers:', error);
      return 0;
    }
  }

  /**
   * Retry failed triggers
   */
  static async retryFailedTriggers(olderThanHours: number = 1): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

      const { data, error } = await supabase
        .from('enrichment_triggers')
        .update({ 
          status: 'pending',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('status', 'failed')
        .lt('updated_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('Error retrying failed triggers:', error);
        return 0;
      }

      const retriedCount = data?.length || 0;
      console.log(`Retried ${retriedCount} failed enrichment triggers`);
      return retriedCount;

    } catch (error) {
      console.error('Error in retryFailedTriggers:', error);
      return 0;
    }
  }
}
