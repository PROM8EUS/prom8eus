import { supabase } from '../supabase';
import { AgentSourceHealthService, AgentSource } from './agentSourceHealthService';

export interface UpdateSchedule {
  id: string;
  source_id: string;
  schedule_type: 'periodic' | 'on_demand' | 'health_based';
  interval_minutes: number;
  last_update?: string;
  next_update?: string;
  update_status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  update_duration_ms?: number;
  records_processed: number;
  records_added: number;
  records_updated: number;
  records_removed: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateResult {
  success: boolean;
  schedule_id: string;
  source_id: string;
  source_name: string;
  records_processed: number;
  records_added: number;
  records_updated: number;
  records_removed: number;
  duration_ms: number;
  error_message?: string;
}

export interface UpdateStatistics {
  total_updates: number;
  successful_updates: number;
  failed_updates: number;
  skipped_updates: number;
  total_records_processed: number;
  total_records_added: number;
  total_records_updated: number;
  total_records_removed: number;
  avg_duration_ms: number;
  sources_by_status: Record<string, number>;
  recent_failures: UpdateResult[];
}

export class IncrementalUpdateScheduler {
  private static readonly SCHEDULE_TABLE = 'agent_source_update_schedule';
  private static readonly MAX_CONCURRENT_UPDATES = 3;
  private static readonly UPDATE_TIMEOUT_MS = 300000; // 5 minutes
  private static readonly HEALTH_CHECK_THRESHOLD = 3; // consecutive failures before skipping

  /**
   * Initialize update schedules for all agent sources
   */
  static async initializeUpdateSchedules(): Promise<void> {
    try {
      const sources = await AgentSourceHealthService.getAgentSources();
      
      for (const source of sources) {
        await this.createUpdateSchedule(source);
      }

      console.log(`Initialized update schedules for ${sources.length} agent sources`);
    } catch (error) {
      console.error('Error initializing update schedules:', error);
    }
  }

  /**
   * Create update schedule for a source
   */
  static async createUpdateSchedule(
    source: AgentSource,
    scheduleType: 'periodic' | 'on_demand' | 'health_based' = 'periodic',
    intervalMinutes?: number
  ): Promise<string> {
    try {
      // Determine default interval based on source type
      const defaultInterval = this.getDefaultInterval(source.type);
      const interval = intervalMinutes || defaultInterval;

      const { data, error } = await supabase
        .from(this.SCHEDULE_TABLE)
        .insert({
          source_id: source.id,
          schedule_type: scheduleType,
          interval_minutes: interval,
          next_update: new Date(Date.now() + interval * 60 * 1000).toISOString(),
          update_status: 'pending',
          records_processed: 0,
          records_added: 0,
          records_updated: 0,
          records_removed: 0
        })
        .select('id')
        .single();

      if (error) {
        console.error(`Error creating update schedule for ${source.name}:`, error);
        throw new Error(`Failed to create update schedule: ${error.message}`);
      }

      console.log(`Created ${scheduleType} update schedule for ${source.name} (${interval}min interval)`);
      return data.id;
    } catch (error) {
      console.error('Error in createUpdateSchedule:', error);
      throw error;
    }
  }

  /**
   * Get default update interval for source type
   */
  private static getDefaultInterval(sourceType: string): number {
    const intervals = {
      'huggingface': 60,    // 1 hour
      'crewai': 120,        // 2 hours
      'github': 240,        // 4 hours
      'custom': 180         // 3 hours
    };

    return intervals[sourceType as keyof typeof intervals] || 180;
  }

  /**
   * Get pending updates
   */
  static async getPendingUpdates(limit: number = 10): Promise<UpdateSchedule[]> {
    try {
      const { data, error } = await supabase.rpc('get_pending_updates', {
        p_limit: limit
      });

      if (error) {
        console.error('Error getting pending updates:', error);
        throw new Error(`Failed to get pending updates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingUpdates:', error);
      throw error;
    }
  }

  /**
   * Process pending updates
   */
  static async processPendingUpdates(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    skipped: number;
    results: UpdateResult[];
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      results: [] as UpdateResult[]
    };

    try {
      // Get pending updates
      const pendingUpdates = await this.getPendingUpdates(this.MAX_CONCURRENT_UPDATES);
      
      if (pendingUpdates.length === 0) {
        console.log('No pending updates to process');
        return results;
      }

      console.log(`Processing ${pendingUpdates.length} pending updates`);

      // Process updates concurrently
      const processingPromises = pendingUpdates.map(update => 
        this.processUpdate(update)
      );

      const updateResults = await Promise.allSettled(processingPromises);

      // Analyze results
      updateResults.forEach((result, index) => {
        results.processed++;
        
        if (result.status === 'fulfilled') {
          results.results.push(result.value);
          
          if (result.value.success) {
            results.successful++;
          } else {
            results.failed++;
          }
        } else {
          results.failed++;
          results.results.push({
            success: false,
            schedule_id: pendingUpdates[index].id,
            source_id: pendingUpdates[index].source_id,
            source_name: pendingUpdates[index].source_name || 'Unknown',
            records_processed: 0,
            records_added: 0,
            records_updated: 0,
            records_removed: 0,
            duration_ms: 0,
            error_message: result.reason instanceof Error ? result.reason.message : 'Unknown error'
          });
        }
      });

      console.log(`Update processing complete: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`);
      return results;

    } catch (error) {
      console.error('Error processing pending updates:', error);
      return results;
    }
  }

  /**
   * Process a single update
   */
  private static async processUpdate(schedule: UpdateSchedule): Promise<UpdateResult> {
    const startTime = Date.now();

    try {
      // Check if source is healthy enough for updates
      const shouldSkip = await this.shouldSkipUpdate(schedule.source_id);
      if (shouldSkip) {
        await this.updateScheduleStatus(schedule.id, 'skipped', 0, 0, 0, 0, 'Source health check failed');
        
        return {
          success: false,
          schedule_id: schedule.id,
          source_id: schedule.source_id,
          source_name: schedule.source_name || 'Unknown',
          records_processed: 0,
          records_added: 0,
          records_updated: 0,
          records_removed: 0,
          duration_ms: Date.now() - startTime,
          error_message: 'Source health check failed'
        };
      }

      // Update status to running
      await this.updateScheduleStatus(schedule.id, 'running');

      // Perform the actual update
      const updateResult = await this.performSourceUpdate(schedule);
      const duration = Date.now() - startTime;

      // Update schedule status
      await this.updateScheduleStatus(
        schedule.id,
        updateResult.success ? 'completed' : 'failed',
        updateResult.records_processed,
        updateResult.records_added,
        updateResult.records_updated,
        updateResult.records_removed,
        updateResult.error_message
      );

      return {
        ...updateResult,
        schedule_id: schedule.id,
        duration_ms: duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update schedule status to failed
      await this.updateScheduleStatus(schedule.id, 'failed', 0, 0, 0, 0, errorMessage);
      
      return {
        success: false,
        schedule_id: schedule.id,
        source_id: schedule.source_id,
        source_name: schedule.source_name || 'Unknown',
        records_processed: 0,
        records_added: 0,
        records_updated: 0,
        records_removed: 0,
        duration_ms: duration,
        error_message: errorMessage
      };
    }
  }

  /**
   * Check if update should be skipped due to source health
   */
  private static async shouldSkipUpdate(sourceId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('agent_sources')
        .select('health_status, consecutive_failures')
        .eq('id', sourceId)
        .single();

      if (error) {
        console.error('Error checking source health:', error);
        return true; // Skip if we can't check health
      }

      // Skip if source is unhealthy or has too many consecutive failures
      return data.health_status === 'unhealthy' || 
             data.consecutive_failures >= this.HEALTH_CHECK_THRESHOLD;

    } catch (error) {
      console.error('Error in shouldSkipUpdate:', error);
      return true; // Skip on error
    }
  }

  /**
   * Perform the actual source update
   */
  private static async performSourceUpdate(schedule: UpdateSchedule): Promise<{
    success: boolean;
    source_id: string;
    source_name: string;
    records_processed: number;
    records_added: number;
    records_updated: number;
    records_removed: number;
    error_message?: string;
  }> {
    try {
      // Get source information
      const { data: source, error: sourceError } = await supabase
        .from('agent_sources')
        .select('*')
        .eq('id', schedule.source_id)
        .single();

      if (sourceError || !source) {
        throw new Error(`Source not found: ${schedule.source_id}`);
      }

      // Perform update based on source type
      let updateResult;
      switch (source.type) {
        case 'huggingface':
          updateResult = await this.updateHuggingFaceSource(source);
          break;
        case 'crewai':
          updateResult = await this.updateCrewAISource(source);
          break;
        case 'github':
          updateResult = await this.updateGitHubSource(source);
          break;
        default:
          updateResult = await this.updateCustomSource(source);
      }

      return {
        success: true,
        source_id: source.id,
        source_name: source.name,
        ...updateResult
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        source_id: schedule.source_id,
        source_name: schedule.source_name || 'Unknown',
        records_processed: 0,
        records_added: 0,
        records_updated: 0,
        records_removed: 0,
        error_message: errorMessage
      };
    }
  }

  /**
   * Update HuggingFace source
   */
  private static async updateHuggingFaceSource(source: AgentSource): Promise<{
    records_processed: number;
    records_added: number;
    records_updated: number;
    records_removed: number;
  }> {
    try {
      // Simulate HuggingFace API call
      const response = await fetch(source.api_endpoint || `${source.base_url}/api/spaces`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Prom8eus-Update/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const spaces = Array.isArray(data) ? data : (data.spaces || []);

      // Simulate processing results
      const recordsProcessed = spaces.length;
      const recordsAdded = Math.floor(recordsProcessed * 0.1); // 10% new
      const recordsUpdated = Math.floor(recordsProcessed * 0.05); // 5% updated
      const recordsRemoved = Math.floor(recordsProcessed * 0.02); // 2% removed

      console.log(`HuggingFace update: ${recordsProcessed} processed, ${recordsAdded} added, ${recordsUpdated} updated, ${recordsRemoved} removed`);

      return {
        records_processed: recordsProcessed,
        records_added: recordsAdded,
        records_updated: recordsUpdated,
        records_removed: recordsRemoved
      };

    } catch (error) {
      console.error('Error updating HuggingFace source:', error);
      throw error;
    }
  }

  /**
   * Update CrewAI source
   */
  private static async updateCrewAISource(source: AgentSource): Promise<{
    records_processed: number;
    records_added: number;
    records_updated: number;
    records_removed: number;
  }> {
    try {
      // Simulate CrewAI GitHub API call
      const response = await fetch(source.api_endpoint || `${source.base_url}/api/repos/joaomdmoura/crewAI-examples`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Prom8eus-Update/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`CrewAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Simulate processing results
      const recordsProcessed = 50; // Estimated number of examples
      const recordsAdded = Math.floor(recordsProcessed * 0.05); // 5% new
      const recordsUpdated = Math.floor(recordsProcessed * 0.1); // 10% updated
      const recordsRemoved = Math.floor(recordsProcessed * 0.01); // 1% removed

      console.log(`CrewAI update: ${recordsProcessed} processed, ${recordsAdded} added, ${recordsUpdated} updated, ${recordsRemoved} removed`);

      return {
        records_processed: recordsProcessed,
        records_added: recordsAdded,
        records_updated: recordsUpdated,
        records_removed: recordsRemoved
      };

    } catch (error) {
      console.error('Error updating CrewAI source:', error);
      throw error;
    }
  }

  /**
   * Update GitHub source
   */
  private static async updateGitHubSource(source: AgentSource): Promise<{
    records_processed: number;
    records_added: number;
    records_updated: number;
    records_removed: number;
  }> {
    try {
      // Simulate GitHub API call
      const response = await fetch(source.api_endpoint || `${source.base_url}/api/search/repositories?q=AI+agent`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Prom8eus-Update/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const repositories = data.items || [];

      // Simulate processing results
      const recordsProcessed = repositories.length;
      const recordsAdded = Math.floor(recordsProcessed * 0.15); // 15% new
      const recordsUpdated = Math.floor(recordsProcessed * 0.08); // 8% updated
      const recordsRemoved = Math.floor(recordsProcessed * 0.03); // 3% removed

      console.log(`GitHub update: ${recordsProcessed} processed, ${recordsAdded} added, ${recordsUpdated} updated, ${recordsRemoved} removed`);

      return {
        records_processed: recordsProcessed,
        records_added: recordsAdded,
        records_updated: recordsUpdated,
        records_removed: recordsRemoved
      };

    } catch (error) {
      console.error('Error updating GitHub source:', error);
      throw error;
    }
  }

  /**
   * Update custom source
   */
  private static async updateCustomSource(source: AgentSource): Promise<{
    records_processed: number;
    records_added: number;
    records_updated: number;
    records_removed: number;
  }> {
    try {
      // For custom sources, we'll simulate a basic update
      const recordsProcessed = 25;
      const recordsAdded = Math.floor(recordsProcessed * 0.08); // 8% new
      const recordsUpdated = Math.floor(recordsProcessed * 0.12); // 12% updated
      const recordsRemoved = Math.floor(recordsProcessed * 0.02); // 2% removed

      console.log(`Custom source update: ${recordsProcessed} processed, ${recordsAdded} added, ${recordsUpdated} updated, ${recordsRemoved} removed`);

      return {
        records_processed: recordsProcessed,
        records_added: recordsAdded,
        records_updated: recordsUpdated,
        records_removed: recordsRemoved
      };

    } catch (error) {
      console.error('Error updating custom source:', error);
      throw error;
    }
  }

  /**
   * Update schedule status
   */
  private static async updateScheduleStatus(
    scheduleId: string,
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped',
    recordsProcessed?: number,
    recordsAdded?: number,
    recordsUpdated?: number,
    recordsRemoved?: number,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_schedule_status', {
        p_schedule_id: scheduleId,
        p_status: status,
        p_records_processed: recordsProcessed || null,
        p_records_added: recordsAdded || null,
        p_records_updated: recordsUpdated || null,
        p_records_removed: recordsRemoved || null,
        p_error_message: errorMessage || null
      });

      if (error) {
        console.error('Error updating schedule status:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error in updateScheduleStatus:', error);
      return false;
    }
  }

  /**
   * Get update statistics
   */
  static async getUpdateStatistics(hoursBack: number = 24): Promise<UpdateStatistics> {
    try {
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from(this.SCHEDULE_TABLE)
        .select('*')
        .gte('updated_at', cutoffTime);

      if (error) {
        console.error('Error fetching update statistics:', error);
        return {
          total_updates: 0,
          successful_updates: 0,
          failed_updates: 0,
          skipped_updates: 0,
          total_records_processed: 0,
          total_records_added: 0,
          total_records_updated: 0,
          total_records_removed: 0,
          avg_duration_ms: 0,
          sources_by_status: {},
          recent_failures: []
        };
      }

      const updates = data || [];
      const successfulUpdates = updates.filter(u => u.update_status === 'completed');
      const failedUpdates = updates.filter(u => u.update_status === 'failed');
      const skippedUpdates = updates.filter(u => u.update_status === 'skipped');

      const sourcesByStatus = updates.reduce((acc, update) => {
        acc[update.update_status] = (acc[update.update_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalRecordsProcessed = updates.reduce((sum, update) => sum + (update.records_processed || 0), 0);
      const totalRecordsAdded = updates.reduce((sum, update) => sum + (update.records_added || 0), 0);
      const totalRecordsUpdated = updates.reduce((sum, update) => sum + (update.records_updated || 0), 0);
      const totalRecordsRemoved = updates.reduce((sum, update) => sum + (update.records_removed || 0), 0);

      const avgDuration = updates.length > 0 
        ? updates.reduce((sum, update) => sum + (update.update_duration_ms || 0), 0) / updates.length 
        : 0;

      const recentFailures = failedUpdates.slice(0, 10).map(update => ({
        success: false,
        schedule_id: update.id,
        source_id: update.source_id,
        source_name: 'Unknown', // Would need to join with sources table
        records_processed: update.records_processed || 0,
        records_added: update.records_added || 0,
        records_updated: update.records_updated || 0,
        records_removed: update.records_removed || 0,
        duration_ms: update.update_duration_ms || 0,
        error_message: update.error_message
      }));

      return {
        total_updates: updates.length,
        successful_updates: successfulUpdates.length,
        failed_updates: failedUpdates.length,
        skipped_updates: skippedUpdates.length,
        total_records_processed: totalRecordsProcessed,
        total_records_added: totalRecordsAdded,
        total_records_updated: totalRecordsUpdated,
        total_records_removed: totalRecordsRemoved,
        avg_duration_ms: avgDuration,
        sources_by_status: sourcesByStatus,
        recent_failures: recentFailures
      };

    } catch (error) {
      console.error('Error calculating update statistics:', error);
      return {
        total_updates: 0,
        successful_updates: 0,
        failed_updates: 0,
        skipped_updates: 0,
        total_records_processed: 0,
        total_records_added: 0,
        total_records_updated: 0,
        total_records_removed: 0,
        avg_duration_ms: 0,
        sources_by_status: {},
        recent_failures: []
      };
    }
  }

  /**
   * Schedule periodic update processing
   */
  static async schedulePeriodicUpdates(intervalMs: number = 300000): Promise<void> {
    console.log(`Scheduling periodic update processing every ${intervalMs}ms`);

    const processUpdates = async () => {
      try {
        console.log('Starting scheduled update processing...');
        const results = await this.processPendingUpdates();
        
        console.log(`Update processing results: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`);

        // Log summary statistics
        if (results.results.length > 0) {
          const totalRecords = results.results.reduce((sum, result) => 
            sum + result.records_processed, 0);
          console.log(`Total records processed: ${totalRecords}`);
        }

      } catch (error) {
        console.error('Error in scheduled update processing:', error);
      }
    };

    // Perform initial processing
    await processUpdates();

    // Schedule recurring processing
    setInterval(processUpdates, intervalMs);
  }

  /**
   * Clean up old update logs
   */
  static async cleanupOldUpdateLogs(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from(this.SCHEDULE_TABLE)
        .delete()
        .lt('updated_at', cutoffDate.toISOString())
        .in('update_status', ['completed', 'failed', 'skipped'])
        .select('id');

      if (error) {
        console.error('Error cleaning up old update logs:', error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`Cleaned up ${deletedCount} old update logs`);
      return deletedCount;

    } catch (error) {
      console.error('Error in cleanupOldUpdateLogs:', error);
      return 0;
    }
  }
}
