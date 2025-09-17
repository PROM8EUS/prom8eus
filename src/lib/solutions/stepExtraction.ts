import { openaiClient } from '../openai';

export interface ImplementationStep {
  step_number: number;
  step_title: string;
  step_description: string;
  step_category: 'setup' | 'configuration' | 'testing' | 'deployment' | 'monitoring' | 'maintenance';
  estimated_time?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  tools_required?: string[];
}

export interface StepExtractionResult {
  steps: ImplementationStep[];
  extraction_metadata: {
    model_used: string;
    extraction_timestamp: string;
    confidence_score: number;
    source_content_length: number;
  };
}

export interface StepExtractionContext {
  solution_type: 'workflow' | 'agent';
  category?: string;
  integrations?: string[];
  capabilities?: string[];
  additional_context?: string;
}

export class StepExtractionService {
  private static readonly MAX_STEPS = 5;
  private static readonly MIN_STEPS = 3;

  /**
   * Extract implementation steps from solution description using LLM
   */
  static async extractImplementationSteps(
    title: string,
    description: string,
    context: StepExtractionContext = {}
  ): Promise<StepExtractionResult> {
    try {
      const prompt = this.buildExtractionPrompt(title, description, context);
      
      const response = await openaiClient.chatCompletion([
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: prompt }
      ], { temperature: 0.3, max_tokens: 2000 });

      const content = response.content;
      if (!content) {
        throw new Error('No content returned from LLM');
      }

      const parsedResult = this.parseLLMResponse(content);
      
      return {
        steps: parsedResult.steps,
        extraction_metadata: {
          model_used: 'gpt-4',
          extraction_timestamp: new Date().toISOString(),
          confidence_score: parsedResult.confidence_score,
          source_content_length: description.length
        }
      };
    } catch (error) {
      console.error('Error extracting implementation steps:', error);
      throw new Error(`Failed to extract implementation steps: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the extraction prompt for the LLM
   */
  private static buildExtractionPrompt(
    title: string,
    description: string,
    context: StepExtractionContext
  ): string {
    const { solution_type, category, integrations, capabilities, additional_context } = context;
    
    let prompt = `Extract 3-5 implementation steps for the following ${solution_type} solution:

Title: ${title}
Description: ${description}`;

    if (category) {
      prompt += `\nCategory: ${category}`;
    }

    if (integrations && integrations.length > 0) {
      prompt += `\nIntegrations: ${integrations.join(', ')}`;
    }

    if (capabilities && capabilities.length > 0) {
      prompt += `\nCapabilities: ${capabilities.join(', ')}`;
    }

    if (additional_context) {
      prompt += `\nAdditional Context: ${additional_context}`;
    }

    prompt += `\n\nPlease provide implementation steps that are:
1. Specific and actionable
2. Ordered logically from setup to deployment
3. Include estimated time and difficulty
4. Mention any prerequisites or tools required
5. Appropriate for the solution type (${solution_type})

Return the response in the following JSON format:
{
  "steps": [
    {
      "step_number": 1,
      "step_title": "Brief title",
      "step_description": "Detailed description of what to do",
      "step_category": "setup|configuration|testing|deployment|monitoring|maintenance",
      "estimated_time": "e.g., 15 minutes, 1 hour, 2-3 hours",
      "difficulty_level": "beginner|intermediate|advanced",
      "prerequisites": ["prerequisite1", "prerequisite2"],
      "tools_required": ["tool1", "tool2"]
    }
  ],
  "confidence_score": 0.85
}`;

    return prompt;
  }

  /**
   * Get the system prompt for step extraction
   */
  private static getSystemPrompt(): string {
    return `You are an expert technical implementation specialist. Your task is to extract clear, actionable implementation steps from solution descriptions.

Guidelines:
1. Extract 3-5 steps maximum, focusing on the most important implementation tasks
2. Each step should be specific and actionable
3. Order steps logically from initial setup to final deployment/monitoring
4. Include realistic time estimates and difficulty levels
5. Mention specific tools, prerequisites, and requirements
6. Use appropriate categories: setup, configuration, testing, deployment, monitoring, maintenance
7. Be practical and consider real-world implementation challenges
8. Provide a confidence score (0-1) for the extraction quality

Focus on steps that a developer or implementer would actually need to follow to get the solution working.`;
  }

  /**
   * Parse the LLM response and extract steps
   */
  private static parseLLMResponse(content: string): { steps: ImplementationStep[]; confidence_score: number } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        throw new Error('Invalid steps format in LLM response');
      }

      // Validate and normalize steps
      const steps: ImplementationStep[] = parsed.steps
        .slice(0, this.MAX_STEPS) // Limit to max steps
        .map((step: any, index: number) => ({
          step_number: step.step_number || index + 1,
          step_title: this.sanitizeText(step.step_title || `Step ${index + 1}`),
          step_description: this.sanitizeText(step.step_description || ''),
          step_category: this.validateCategory(step.step_category),
          estimated_time: step.estimated_time ? this.sanitizeText(step.estimated_time) : undefined,
          difficulty_level: step.difficulty_level ? this.validateDifficulty(step.difficulty_level) : undefined,
          prerequisites: step.prerequisites ? this.sanitizeArray(step.prerequisites) : undefined,
          tools_required: step.tools_required ? this.sanitizeArray(step.tools_required) : undefined
        }));

      // Ensure we have at least the minimum number of steps
      if (steps.length < this.MIN_STEPS) {
        throw new Error(`Insufficient steps extracted: ${steps.length} < ${this.MIN_STEPS}`);
      }

      const confidence_score = Math.max(0, Math.min(1, parsed.confidence_score || 0.7));

      return { steps, confidence_score };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate step category
   */
  private static validateCategory(category: any): ImplementationStep['step_category'] {
    const validCategories = ['setup', 'configuration', 'testing', 'deployment', 'monitoring', 'maintenance'];
    const normalized = String(category).toLowerCase().trim();
    
    if (validCategories.includes(normalized)) {
      return normalized as ImplementationStep['step_category'];
    }
    
    // Default mapping for common variations
    const categoryMap: Record<string, ImplementationStep['step_category']> = {
      'install': 'setup',
      'configure': 'configuration',
      'config': 'configuration',
      'test': 'testing',
      'deploy': 'deployment',
      'monitor': 'monitoring',
      'maintain': 'maintenance'
    };
    
    return categoryMap[normalized] || 'setup';
  }

  /**
   * Validate difficulty level
   */
  private static validateDifficulty(difficulty: any): ImplementationStep['difficulty_level'] {
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    const normalized = String(difficulty).toLowerCase().trim();
    
    if (validDifficulties.includes(normalized)) {
      return normalized as ImplementationStep['difficulty_level'];
    }
    
    // Default mapping for common variations
    const difficultyMap: Record<string, ImplementationStep['difficulty_level']> = {
      'easy': 'beginner',
      'simple': 'beginner',
      'basic': 'beginner',
      'medium': 'intermediate',
      'moderate': 'intermediate',
      'hard': 'advanced',
      'complex': 'advanced',
      'expert': 'advanced'
    };
    
    return difficultyMap[normalized] || 'intermediate';
  }

  /**
   * Sanitize text input
   */
  private static sanitizeText(text: any): string {
    if (typeof text !== 'string') {
      return String(text || '').trim();
    }
    return text.trim();
  }

  /**
   * Sanitize array input
   */
  private static sanitizeArray(arr: any): string[] {
    if (!Array.isArray(arr)) {
      return [];
    }
    return arr
      .map(item => this.sanitizeText(item))
      .filter(item => item.length > 0);
  }

  /**
   * Generate content hash for caching
   */
  static generateContentHash(
    title: string,
    description: string,
    solution_type: string,
    additional_context: string = ''
  ): string {
    const content = `${title}|${description}|${solution_type}|${additional_context}`.toLowerCase().trim();
    
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Get fallback steps when extraction fails
   */
  static getFallbackSteps(solution_type: 'workflow' | 'agent'): ImplementationStep[] {
    if (solution_type === 'workflow') {
      return [
        {
          step_number: 1,
          step_title: 'Review Requirements',
          step_description: 'Review the workflow requirements and ensure all necessary integrations are available',
          step_category: 'setup',
          estimated_time: '15 minutes',
          difficulty_level: 'beginner',
          prerequisites: ['Access to workflow platform', 'Required integrations'],
          tools_required: ['Workflow platform access']
        },
        {
          step_number: 2,
          step_title: 'Configure Integrations',
          step_description: 'Set up and configure the required integrations and API connections',
          step_category: 'configuration',
          estimated_time: '30-60 minutes',
          difficulty_level: 'intermediate',
          prerequisites: ['API keys', 'Integration access'],
          tools_required: ['API credentials', 'Integration platform']
        },
        {
          step_number: 3,
          step_title: 'Test Workflow',
          step_description: 'Test the workflow with sample data to ensure it works correctly',
          step_category: 'testing',
          estimated_time: '20-30 minutes',
          difficulty_level: 'intermediate',
          prerequisites: ['Configured integrations', 'Sample data'],
          tools_required: ['Test data', 'Monitoring tools']
        },
        {
          step_number: 4,
          step_title: 'Deploy to Production',
          step_description: 'Deploy the workflow to production environment and activate it',
          step_category: 'deployment',
          estimated_time: '15-30 minutes',
          difficulty_level: 'intermediate',
          prerequisites: ['Tested workflow', 'Production access'],
          tools_required: ['Production environment', 'Deployment tools']
        },
        {
          step_number: 5,
          step_title: 'Monitor and Maintain',
          step_description: 'Monitor workflow performance and maintain it as needed',
          step_category: 'monitoring',
          estimated_time: 'Ongoing',
          difficulty_level: 'beginner',
          prerequisites: ['Deployed workflow', 'Monitoring access'],
          tools_required: ['Monitoring dashboard', 'Alerting system']
        }
      ];
    } else {
      return [
        {
          step_number: 1,
          step_title: 'Set Up AI Environment',
          step_description: 'Set up the AI agent environment and required dependencies',
          step_category: 'setup',
          estimated_time: '30-45 minutes',
          difficulty_level: 'intermediate',
          prerequisites: ['AI platform access', 'Required APIs'],
          tools_required: ['AI platform', 'API credentials']
        },
        {
          step_number: 2,
          step_title: 'Configure Agent Parameters',
          step_description: 'Configure the AI agent parameters, prompts, and capabilities',
          step_category: 'configuration',
          estimated_time: '45-60 minutes',
          difficulty_level: 'advanced',
          prerequisites: ['Agent framework', 'Configuration knowledge'],
          tools_required: ['Configuration interface', 'Documentation']
        },
        {
          step_number: 3,
          step_title: 'Train and Test Agent',
          step_description: 'Train the agent with sample data and test its responses',
          step_category: 'testing',
          estimated_time: '60-90 minutes',
          difficulty_level: 'advanced',
          prerequisites: ['Training data', 'Test scenarios'],
          tools_required: ['Training platform', 'Test data']
        },
        {
          step_number: 4,
          step_title: 'Deploy Agent',
          step_description: 'Deploy the AI agent to production and integrate with systems',
          step_category: 'deployment',
          estimated_time: '30-45 minutes',
          difficulty_level: 'intermediate',
          prerequisites: ['Tested agent', 'Production environment'],
          tools_required: ['Deployment platform', 'Integration tools']
        },
        {
          step_number: 5,
          step_title: 'Monitor Performance',
          step_description: 'Monitor agent performance and fine-tune as needed',
          step_category: 'monitoring',
          estimated_time: 'Ongoing',
          difficulty_level: 'intermediate',
          prerequisites: ['Deployed agent', 'Monitoring tools'],
          tools_required: ['Analytics dashboard', 'Performance metrics']
        }
      ];
    }
  }
}
