import { supabase } from '../supabase';

export interface AgentSource {
  id: string;
  name: string;
  type: 'huggingface' | 'crewai' | 'github' | 'custom';
  base_url: string;
  api_endpoint?: string;
  health_endpoint?: string;
  expected_data_size_min?: number;
  expected_data_size_max?: number;
  timeout_ms: number;
  retry_attempts: number;
  backoff_multiplier: number;
  max_backoff_ms: number;
  enabled: boolean;
  last_health_check?: string;
  last_successful_check?: string;
  consecutive_failures: number;
  health_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  created_at: string;
  updated_at: string;
}

export interface HealthCheckResult {
  source_id: string;
  source_name: string;
  source_type: string;
  status: 'success' | 'warning' | 'error';
  response_time_ms: number;
  data_size?: number;
  data_size_status?: 'normal' | 'too_small' | 'too_large' | 'unknown';
  error_message?: string;
  warning_message?: string;
  http_status_code?: number;
  headers?: Record<string, string>;
  timestamp: string;
}

export interface HealthCheckConfig {
  timeout_ms: number;
  retry_attempts: number;
  backoff_multiplier: number;
  max_backoff_ms: number;
  data_size_tolerance_percent: number;
  health_check_interval_ms: number;
  max_consecutive_failures: number;
}

export class AgentSourceHealthService {
  private static readonly DEFAULT_CONFIG: HealthCheckConfig = {
    timeout_ms: 10000,
    retry_attempts: 3,
    backoff_multiplier: 2,
    max_backoff_ms: 30000,
    data_size_tolerance_percent: 20,
    health_check_interval_ms: 300000, // 5 minutes
    max_consecutive_failures: 5
  };

  private static readonly HEALTH_CHECK_TABLE = 'agent_source_health_checks';
  private static readonly SOURCES_TABLE = 'agent_sources';

  /**
   * Initialize agent sources table with default sources
   */
  static async initializeAgentSources(): Promise<void> {
    try {
      const defaultSources: Omit<AgentSource, 'id' | 'created_at' | 'updated_at'>[] = [
        {
          name: 'HuggingFace Spaces',
          type: 'huggingface',
          base_url: 'https://huggingface.co',
          api_endpoint: 'https://huggingface.co/api/spaces',
          health_endpoint: 'https://huggingface.co/api/spaces?limit=1',
          expected_data_size_min: 1000,
          expected_data_size_max: 100000,
          timeout_ms: 15000,
          retry_attempts: 3,
          backoff_multiplier: 2,
          max_backoff_ms: 30000,
          enabled: true,
          consecutive_failures: 0,
          health_status: 'unknown'
        },
        {
          name: 'CrewAI Examples',
          type: 'crewai',
          base_url: 'https://github.com',
          api_endpoint: 'https://api.github.com/repos/joaomdmoura/crewAI-examples',
          health_endpoint: 'https://api.github.com/repos/joaomdmoura/crewAI-examples',
          expected_data_size_min: 500,
          expected_data_size_max: 50000,
          timeout_ms: 10000,
          retry_attempts: 3,
          backoff_multiplier: 2,
          max_backoff_ms: 30000,
          enabled: true,
          consecutive_failures: 0,
          health_status: 'unknown'
        },
        {
          name: 'GitHub Agent Repositories',
          type: 'github',
          base_url: 'https://github.com',
          api_endpoint: 'https://api.github.com/search/repositories',
          health_endpoint: 'https://api.github.com/search/repositories?q=AI+agent&per_page=1',
          expected_data_size_min: 1000,
          expected_data_size_max: 100000,
          timeout_ms: 10000,
          retry_attempts: 3,
          backoff_multiplier: 2,
          max_backoff_ms: 30000,
          enabled: true,
          consecutive_failures: 0,
          health_status: 'unknown'
        }
      ];

      for (const source of defaultSources) {
        const { error } = await supabase
          .from(this.SOURCES_TABLE)
          .upsert({
            ...source,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'name'
          });

        if (error) {
          console.error(`Error initializing agent source ${source.name}:`, error);
        }
      }

      console.log('Agent sources initialized successfully');
    } catch (error) {
      console.error('Error initializing agent sources:', error);
    }
  }

  /**
   * Get all agent sources
   */
  static async getAgentSources(): Promise<AgentSource[]> {
    try {
      const { data, error } = await supabase
        .from(this.SOURCES_TABLE)
        .select('*')
        .eq('enabled', true)
        .order('name');

      if (error) {
        console.error('Error fetching agent sources:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAgentSources:', error);
      return [];
    }
  }

  /**
   * Perform health check on a single agent source
   */
  static async performHealthCheck(
    source: AgentSource,
    config: HealthCheckConfig = this.DEFAULT_CONFIG
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // Perform the health check with retry logic
      const result = await this.executeHealthCheckWithRetry(source, config);
      const responseTime = Date.now() - startTime;

      // Analyze data size if available
      let dataSizeStatus: 'normal' | 'too_small' | 'too_large' | 'unknown' = 'unknown';
      if (result.dataSize && source.expected_data_size_min && source.expected_data_size_max) {
        if (result.dataSize < source.expected_data_size_min) {
          dataSizeStatus = 'too_small';
        } else if (result.dataSize > source.expected_data_size_max) {
          dataSizeStatus = 'too_large';
        } else {
          dataSizeStatus = 'normal';
        }
      }

      // Determine overall status
      let status: 'success' | 'warning' | 'error' = 'success';
      let warningMessage: string | undefined;

      if (result.error) {
        status = 'error';
      } else if (dataSizeStatus === 'too_small' || dataSizeStatus === 'too_large') {
        status = 'warning';
        warningMessage = `Data size ${dataSizeStatus}: ${result.dataSize} bytes`;
      } else if (responseTime > config.timeout_ms * 0.8) {
        status = 'warning';
        warningMessage = `Slow response time: ${responseTime}ms`;
      }

      const healthResult: HealthCheckResult = {
        source_id: source.id,
        source_name: source.name,
        source_type: source.type,
        status,
        response_time_ms: responseTime,
        data_size: result.dataSize,
        data_size_status: dataSizeStatus,
        error_message: result.error,
        warning_message: warningMessage,
        http_status_code: result.statusCode,
        headers: result.headers,
        timestamp
      };

      // Log the health check result
      await this.logHealthCheckResult(healthResult);

      // Update source health status
      await this.updateSourceHealthStatus(source.id, status, result.error);

      return healthResult;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const healthResult: HealthCheckResult = {
        source_id: source.id,
        source_name: source.name,
        source_type: source.type,
        status: 'error',
        response_time_ms: responseTime,
        error_message: errorMessage,
        timestamp
      };

      // Log the health check result
      await this.logHealthCheckResult(healthResult);

      // Update source health status
      await this.updateSourceHealthStatus(source.id, 'error', errorMessage);

      return healthResult;
    }
  }

  /**
   * Execute health check with retry logic
   */
  private static async executeHealthCheckWithRetry(
    source: AgentSource,
    config: HealthCheckConfig
  ): Promise<{
    dataSize?: number;
    statusCode?: number;
    headers?: Record<string, string>;
    error?: string;
  }> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= config.retry_attempts; attempt++) {
      try {
        const result = await this.executeSingleHealthCheck(source, config);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt < config.retry_attempts) {
          const delay = Math.min(
            config.timeout_ms * Math.pow(config.backoff_multiplier, attempt - 1),
            config.max_backoff_ms
          );
          
          console.log(`Health check attempt ${attempt} failed for ${source.name}, retrying in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return { error: lastError };
  }

  /**
   * Execute a single health check
   */
  private static async executeSingleHealthCheck(
    source: AgentSource,
    config: HealthCheckConfig
  ): Promise<{
    dataSize?: number;
    statusCode?: number;
    headers?: Record<string, string>;
    error?: string;
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout_ms);

    try {
      const endpoint = source.health_endpoint || source.api_endpoint || source.base_url;
      
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Prom8eus-HealthCheck/1.0',
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // If HEAD request fails, try GET request
      if (!response.ok && response.status === 405) {
        const getResponse = await fetch(endpoint, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Prom8eus-HealthCheck/1.0',
            'Accept': 'application/json'
          }
        });

        const getHeaders: Record<string, string> = {};
        getResponse.headers.forEach((value, key) => {
          getHeaders[key] = value;
        });

        const dataSize = parseInt(getHeaders['content-length'] || '0');

        return {
          dataSize,
          statusCode: getResponse.status,
          headers: getHeaders,
          error: getResponse.ok ? undefined : `HTTP ${getResponse.status}: ${getResponse.statusText}`
        };
      }

      const dataSize = parseInt(headers['content-length'] || '0');

      return {
        dataSize,
        statusCode: response.status,
        headers,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${config.timeout_ms}ms`);
        }
        throw error;
      }
      
      throw new Error('Unknown error during health check');
    }
  }

  /**
   * Log health check result
   */
  private static async logHealthCheckResult(result: HealthCheckResult): Promise<void> {
    try {
      await supabase
        .from(this.HEALTH_CHECK_TABLE)
        .insert({
          source_id: result.source_id,
          source_name: result.source_name,
          source_type: result.source_type,
          status: result.status,
          response_time_ms: result.response_time_ms,
          data_size: result.data_size,
          data_size_status: result.data_size_status,
          error_message: result.error_message,
          warning_message: result.warning_message,
          http_status_code: result.http_status_code,
          headers: result.headers,
          timestamp: result.timestamp
        });
    } catch (error) {
      console.error('Error logging health check result:', error);
    }
  }

  /**
   * Update source health status
   */
  private static async updateSourceHealthStatus(
    sourceId: string,
    status: 'success' | 'warning' | 'error',
    errorMessage?: string
  ): Promise<void> {
    try {
      const healthStatus = status === 'success' ? 'healthy' : 
                          status === 'warning' ? 'degraded' : 'unhealthy';

      const updateData: any = {
        health_status: healthStatus,
        last_health_check: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (status === 'success') {
        updateData.last_successful_check = new Date().toISOString();
        updateData.consecutive_failures = 0;
      } else {
        // Get current consecutive failures and increment
        const { data: currentSource } = await supabase
          .from(this.SOURCES_TABLE)
          .select('consecutive_failures')
          .eq('id', sourceId)
          .single();

        updateData.consecutive_failures = (currentSource?.consecutive_failures || 0) + 1;
      }

      await supabase
        .from(this.SOURCES_TABLE)
        .update(updateData)
        .eq('id', sourceId);

    } catch (error) {
      console.error('Error updating source health status:', error);
    }
  }

  /**
   * Perform health checks on all agent sources
   */
  static async performAllHealthChecks(
    config: HealthCheckConfig = this.DEFAULT_CONFIG
  ): Promise<HealthCheckResult[]> {
    try {
      const sources = await this.getAgentSources();
      const results: HealthCheckResult[] = [];

      // Perform health checks concurrently (with limit)
      const concurrencyLimit = 5;
      const chunks = [];
      for (let i = 0; i < sources.length; i += concurrencyLimit) {
        chunks.push(sources.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const chunkResults = await Promise.allSettled(
          chunk.map(source => this.performHealthCheck(source, config))
        );

        chunkResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            // Create error result for failed health checks
            const source = chunk[index];
            results.push({
              source_id: source.id,
              source_name: source.name,
              source_type: source.type,
              status: 'error',
              response_time_ms: 0,
              error_message: result.reason instanceof Error ? result.reason.message : 'Unknown error',
              timestamp: new Date().toISOString()
            });
          }
        });
      }

      return results;
    } catch (error) {
      console.error('Error performing all health checks:', error);
      return [];
    }
  }

  /**
   * Get health check statistics
   */
  static async getHealthCheckStatistics(hoursBack: number = 24): Promise<{
    total_checks: number;
    successful_checks: number;
    warning_checks: number;
    failed_checks: number;
    avg_response_time_ms: number;
    sources_by_status: Record<string, number>;
    sources_by_type: Record<string, number>;
    recent_failures: HealthCheckResult[];
  }> {
    try {
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from(this.HEALTH_CHECK_TABLE)
        .select('*')
        .gte('timestamp', cutoffTime)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching health check statistics:', error);
        return {
          total_checks: 0,
          successful_checks: 0,
          warning_checks: 0,
          failed_checks: 0,
          avg_response_time_ms: 0,
          sources_by_status: {},
          sources_by_type: {},
          recent_failures: []
        };
      }

      const checks = data || [];
      const successfulChecks = checks.filter(c => c.status === 'success');
      const warningChecks = checks.filter(c => c.status === 'warning');
      const failedChecks = checks.filter(c => c.status === 'error');

      const sourcesByStatus = checks.reduce((acc, check) => {
        acc[check.status] = (acc[check.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const sourcesByType = checks.reduce((acc, check) => {
        acc[check.source_type] = (acc[check.source_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const avgResponseTime = checks.length > 0 
        ? checks.reduce((sum, check) => sum + check.response_time_ms, 0) / checks.length 
        : 0;

      const recentFailures = failedChecks.slice(0, 10);

      return {
        total_checks: checks.length,
        successful_checks: successfulChecks.length,
        warning_checks: warningChecks.length,
        failed_checks: failedChecks.length,
        avg_response_time_ms: avgResponseTime,
        sources_by_status: sourcesByStatus,
        sources_by_type: sourcesByType,
        recent_failures: recentFailures
      };

    } catch (error) {
      console.error('Error calculating health check statistics:', error);
      return {
        total_checks: 0,
        successful_checks: 0,
        warning_checks: 0,
        failed_checks: 0,
        avg_response_time_ms: 0,
        sources_by_status: {},
        sources_by_type: {},
        recent_failures: []
      };
    }
  }

  /**
   * Get unhealthy sources that need attention
   */
  static async getUnhealthySources(): Promise<AgentSource[]> {
    try {
      const { data, error } = await supabase
        .from(this.SOURCES_TABLE)
        .select('*')
        .in('health_status', ['unhealthy', 'degraded'])
        .order('consecutive_failures', { ascending: false });

      if (error) {
        console.error('Error fetching unhealthy sources:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUnhealthySources:', error);
      return [];
    }
  }

  /**
   * Schedule periodic health checks
   */
  static async schedulePeriodicHealthChecks(
    intervalMs: number = this.DEFAULT_CONFIG.health_check_interval_ms
  ): Promise<void> {
    console.log(`Scheduling periodic health checks every ${intervalMs}ms`);

    const performChecks = async () => {
      try {
        console.log('Starting scheduled health checks...');
        const results = await this.performAllHealthChecks();
        
        const successCount = results.filter(r => r.status === 'success').length;
        const warningCount = results.filter(r => r.status === 'warning').length;
        const errorCount = results.filter(r => r.status === 'error').length;

        console.log(`Health check results: ${successCount} success, ${warningCount} warnings, ${errorCount} errors`);

        // Check for sources that need attention
        const unhealthySources = await this.getUnhealthySources();
        if (unhealthySources.length > 0) {
          console.warn(`Found ${unhealthySources.length} unhealthy sources:`, 
            unhealthySources.map(s => `${s.name} (${s.health_status})`));
        }

      } catch (error) {
        console.error('Error in scheduled health checks:', error);
      }
    };

    // Perform initial check
    await performChecks();

    // Schedule recurring checks
    setInterval(performChecks, intervalMs);
  }

  /**
   * Clean up old health check logs
   */
  static async cleanupOldHealthChecks(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from(this.HEALTH_CHECK_TABLE)
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('Error cleaning up old health checks:', error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`Cleaned up ${deletedCount} old health check logs`);
      return deletedCount;

    } catch (error) {
      console.error('Error in cleanupOldHealthChecks:', error);
      return 0;
    }
  }
}
