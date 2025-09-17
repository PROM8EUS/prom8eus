import { supabase } from '../supabase';
import { StepExtractionService, ImplementationStep, StepExtractionResult, StepExtractionContext } from './stepExtraction';

export interface StoredImplementationStep {
  id: string;
  step_number: number;
  step_title: string;
  step_description: string;
  step_category: string;
  estimated_time?: string;
  difficulty_level?: string;
  prerequisites?: string[];
  tools_required?: string[];
  admin_validated: boolean;
  admin_notes?: string;
  admin_validated_by?: string;
  admin_validated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StepExtractionStats {
  total_solutions: number;
  solutions_with_steps: number;
  total_steps: number;
  validated_steps: number;
  pending_validation: number;
  extraction_cache_hits: number;
}

export class StepExtractionDatabaseService {
  /**
   * Extract and store implementation steps for a solution
   */
  static async extractAndStoreSteps(
    solutionId: string,
    solutionType: 'workflow' | 'agent',
    title: string,
    description: string,
    context: StepExtractionContext = {}
  ): Promise<StoredImplementationStep[]> {
    try {
      // Generate content hash for caching
      const contentHash = StepExtractionService.generateContentHash(
        title,
        description,
        solutionType,
        context.additional_context
      );

      // Check if we have cached extraction
      const cachedSteps = await this.getCachedSteps(contentHash);
      if (cachedSteps) {
        console.log(`Using cached steps for solution ${solutionId}`);
        return await this.storeStepsFromCache(solutionId, solutionType, cachedSteps);
      }

      // Extract steps using LLM
      console.log(`Extracting steps for solution ${solutionId} using LLM`);
      const extractionResult = await StepExtractionService.extractImplementationSteps(
        title,
        description,
        context
      );

      // Cache the extraction result
      await this.cacheExtractionResult(
        contentHash,
        solutionId,
        solutionType,
        extractionResult
      );

      // Store the steps in the database
      return await this.storeExtractedSteps(solutionId, solutionType, extractionResult.steps);
    } catch (error) {
      console.error(`Error extracting steps for solution ${solutionId}:`, error);
      
      // Fallback to default steps
      console.log(`Using fallback steps for solution ${solutionId}`);
      const fallbackSteps = StepExtractionService.getFallbackSteps(solutionType);
      return await this.storeExtractedSteps(solutionId, solutionType, fallbackSteps);
    }
  }

  /**
   * Check if step extraction failed for a solution
   */
  static async hasExtractionFailed(solutionId: string): Promise<boolean> {
    try {
      const steps = await this.getImplementationSteps(solutionId);
      
      // If no steps exist, extraction either failed or hasn't been attempted
      if (steps.length === 0) {
        return true;
      }
      
      // Check if all steps are fallback steps (basic indicators)
      const isAllFallback = steps.every(step => 
        step.step_title.includes('Review Requirements') ||
        step.step_title.includes('Set Up AI Environment') ||
        step.step_title.includes('Configure') ||
        step.step_title.includes('Test') ||
        step.step_title.includes('Deploy') ||
        step.step_title.includes('Monitor')
      );
      
      return isAllFallback;
    } catch (error) {
      console.error(`Error checking extraction status for solution ${solutionId}:`, error);
      return true; // Assume failed if we can't check
    }
  }

  /**
   * Get fallback status for a solution
   */
  static async getFallbackStatus(solutionId: string): Promise<{
    isFallback: boolean;
    hasSteps: boolean;
    stepCount: number;
    lastUpdated?: string;
  }> {
    try {
      const steps = await this.getImplementationSteps(solutionId);
      const hasSteps = steps.length > 0;
      const isFallback = await this.hasExtractionFailed(solutionId);
      const lastUpdated = hasSteps ? steps[0].updated_at : undefined;
      
      return {
        isFallback,
        hasSteps,
        stepCount: steps.length,
        lastUpdated
      };
    } catch (error) {
      console.error(`Error getting fallback status for solution ${solutionId}:`, error);
      return {
        isFallback: true,
        hasSteps: false,
        stepCount: 0
      };
    }
  }

  /**
   * Get implementation steps for a solution
   */
  static async getImplementationSteps(solutionId: string): Promise<StoredImplementationStep[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_implementation_steps', { p_solution_id: solutionId });

      if (error) {
        console.error('Error fetching implementation steps:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(`Error getting implementation steps for solution ${solutionId}:`, error);
      return [];
    }
  }

  /**
   * Store extracted steps in the database
   */
  private static async storeExtractedSteps(
    solutionId: string,
    solutionType: 'workflow' | 'agent',
    steps: ImplementationStep[]
  ): Promise<StoredImplementationStep[]> {
    try {
      const stepsJson = JSON.stringify(steps);
      
      const { data, error } = await supabase
        .rpc('store_implementation_steps', {
          p_solution_id: solutionId,
          p_solution_type: solutionType,
          p_steps: stepsJson
        });

      if (error) {
        console.error('Error storing implementation steps:', error);
        throw error;
      }

      console.log(`Stored ${data} implementation steps for solution ${solutionId}`);
      
      // Return the stored steps
      return await this.getImplementationSteps(solutionId);
    } catch (error) {
      console.error(`Error storing steps for solution ${solutionId}:`, error);
      throw error;
    }
  }

  /**
   * Get cached extraction result
   */
  private static async getCachedSteps(contentHash: string): Promise<ImplementationStep[] | null> {
    try {
      const { data, error } = await supabase
        .from('step_extraction_cache')
        .select('extracted_steps')
        .eq('content_hash', contentHash)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No cached result found
          return null;
        }
        console.error('Error fetching cached steps:', error);
        return null;
      }

      return data.extracted_steps as ImplementationStep[];
    } catch (error) {
      console.error('Error getting cached steps:', error);
      return null;
    }
  }

  /**
   * Cache extraction result
   */
  private static async cacheExtractionResult(
    contentHash: string,
    solutionId: string,
    solutionType: 'workflow' | 'agent',
    extractionResult: StepExtractionResult
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('get_or_create_step_extraction_cache', {
          p_content_hash: contentHash,
          p_solution_id: solutionId,
          p_solution_type: solutionType,
          p_extracted_steps: JSON.stringify(extractionResult.steps),
          p_extraction_metadata: JSON.stringify(extractionResult.extraction_metadata)
        });

      if (error) {
        console.error('Error caching extraction result:', error);
        // Don't throw - caching failure shouldn't break the main flow
      } else {
        console.log(`Cached extraction result for solution ${solutionId}`);
      }
    } catch (error) {
      console.error('Error caching extraction result:', error);
      // Don't throw - caching failure shouldn't break the main flow
    }
  }

  /**
   * Store steps from cache
   */
  private static async storeStepsFromCache(
    solutionId: string,
    solutionType: 'workflow' | 'agent',
    cachedSteps: ImplementationStep[]
  ): Promise<StoredImplementationStep[]> {
    return await this.storeExtractedSteps(solutionId, solutionType, cachedSteps);
  }

  /**
   * Validate implementation steps (admin only)
   */
  static async validateSteps(
    solutionId: string,
    adminUserId: string,
    validationNotes?: string
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('validate_implementation_steps', {
          p_solution_id: solutionId,
          p_admin_user_id: adminUserId,
          p_validation_notes: validationNotes
        });

      if (error) {
        console.error('Error validating implementation steps:', error);
        throw error;
      }

      console.log(`Validated ${data} implementation steps for solution ${solutionId}`);
      return data;
    } catch (error) {
      console.error(`Error validating steps for solution ${solutionId}:`, error);
      throw error;
    }
  }

  /**
   * Get step extraction statistics
   */
  static async getStepExtractionStats(): Promise<StepExtractionStats> {
    try {
      const { data, error } = await supabase
        .rpc('get_step_extraction_stats');

      if (error) {
        console.error('Error fetching step extraction stats:', error);
        throw error;
      }

      return data[0] || {
        total_solutions: 0,
        solutions_with_steps: 0,
        total_steps: 0,
        validated_steps: 0,
        pending_validation: 0,
        extraction_cache_hits: 0
      };
    } catch (error) {
      console.error('Error getting step extraction stats:', error);
      return {
        total_solutions: 0,
        solutions_with_steps: 0,
        total_steps: 0,
        validated_steps: 0,
        pending_validation: 0,
        extraction_cache_hits: 0
      };
    }
  }

  /**
   * Get solutions pending validation
   */
  static async getSolutionsPendingValidation(): Promise<Array<{
    solution_id: string;
    solution_type: string;
    step_count: number;
    created_at: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('solution_implementation_steps')
        .select(`
          solution_id,
          solution_type,
          created_at
        `)
        .eq('admin_validated', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching solutions pending validation:', error);
        throw error;
      }

      // Group by solution_id and count steps
      const grouped = data.reduce((acc, step) => {
        const key = step.solution_id;
        if (!acc[key]) {
          acc[key] = {
            solution_id: step.solution_id,
            solution_type: step.solution_type,
            step_count: 0,
            created_at: step.created_at
          };
        }
        acc[key].step_count++;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped);
    } catch (error) {
      console.error('Error getting solutions pending validation:', error);
      return [];
    }
  }

  /**
   * Delete implementation steps for a solution
   */
  static async deleteImplementationSteps(solutionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('solution_implementation_steps')
        .delete()
        .eq('solution_id', solutionId);

      if (error) {
        console.error('Error deleting implementation steps:', error);
        throw error;
      }

      console.log(`Deleted implementation steps for solution ${solutionId}`);
    } catch (error) {
      console.error(`Error deleting steps for solution ${solutionId}:`, error);
      throw error;
    }
  }

  /**
   * Update a specific implementation step
   */
  static async updateImplementationStep(
    stepId: string,
    updates: Partial<ImplementationStep>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('solution_implementation_steps')
        .update(updates)
        .eq('id', stepId);

      if (error) {
        console.error('Error updating implementation step:', error);
        throw error;
      }

      console.log(`Updated implementation step ${stepId}`);
    } catch (error) {
      console.error(`Error updating step ${stepId}:`, error);
      throw error;
    }
  }
}
