// Simple LLM Test
import { LLMTaskAnalyzer } from './llmTaskAnalysis';

export async function testLLMIntegration() {
  console.log('🧪 Testing LLM Integration...');
  
  try {
    const testTask = {
      title: 'Telefonische Beratung von Kunden',
      description: 'Kundenanfragen telefonisch bearbeiten und Lösungen anbieten',
      category: 'Kundenservice',
      systems: ['CRM', 'Phone System']
    };
    
    console.log('📝 Test Task:', testTask);
    
    const result = await LLMTaskAnalyzer.analyzeTask(testTask);
    
    console.log('✅ LLM Test Result:', {
      domain: result.domain,
      confidence: result.confidence,
      reasoning: result.reasoning,
      subtasksCount: result.subtasks.length,
      subtasks: result.subtasks.map(s => s.title)
    });
    
    return result;
  } catch (error) {
    console.error('❌ LLM Test Failed:', error);
    throw error;
  }
}

// Export for browser testing
(window as any).testLLM = testLLMIntegration;
