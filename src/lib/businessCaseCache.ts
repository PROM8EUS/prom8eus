// Global Business Case Cache to prevent multiple generations
class BusinessCaseCache {
  private cache = new Map<string, any>();
  private generationInProgress = new Set<string>();

  generateKey(taskText: string): string {
    // Create a consistent key from task text
    return taskText.trim().toLowerCase().slice(0, 100);
  }

  async getOrGenerate(
    taskText: string, 
    subtasks: any[], 
    lang: 'de' | 'en',
    generator: (taskText: string, subtasks: any[], lang: 'de' | 'en') => Promise<any>
  ): Promise<any> {
    const key = this.generateKey(taskText);
    
    // Check cache first
    if (this.cache.has(key)) {
      console.log('✅ [BusinessCaseCache] Cache hit for:', taskText.slice(0, 50));
      return this.cache.get(key);
    }
    
    // Check if generation is in progress
    if (this.generationInProgress.has(key)) {
      console.log('⏳ [BusinessCaseCache] Generation in progress for:', taskText.slice(0, 50));
      
      // Wait for generation to complete
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.cache.has(key)) {
            clearInterval(checkInterval);
            resolve(this.cache.get(key));
          } else if (!this.generationInProgress.has(key)) {
            clearInterval(checkInterval);
            reject(new Error('Generation failed'));
          }
        }, 100);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Generation timeout'));
        }, 30000);
      });
    }
    
    // Start generation
    this.generationInProgress.add(key);
    console.log('🤖 [BusinessCaseCache] Starting generation for:', taskText.slice(0, 50));
    
    try {
      const result = await generator(taskText, subtasks, lang);
      this.cache.set(key, result);
      console.log('✅ [BusinessCaseCache] Generation completed and cached for:', taskText.slice(0, 50));
      return result;
    } catch (error) {
      console.error('❌ [BusinessCaseCache] Generation failed for:', taskText.slice(0, 50), error);
      throw error;
    } finally {
      this.generationInProgress.delete(key);
    }
  }
  
  clear(): void {
    this.cache.clear();
    this.generationInProgress.clear();
  }
  
  getStats(): { cacheSize: number; inProgress: number } {
    return {
      cacheSize: this.cache.size,
      inProgress: this.generationInProgress.size
    };
  }
}

export const businessCaseCache = new BusinessCaseCache();
