// Semantic Search Utilities for Hybrid Workflow Filtering
export interface EmbeddingVector {
  vector: number[];
  text: string;
}

export interface SemanticResult {
  id: string;
  similarity: number;
  text: string;
}

// Simple text similarity using TF-IDF approach (no external API needed)
export class SemanticSearch {
  private static tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  private static calculateTFIDF(text: string, allTexts: string[]): Map<string, number> {
    const tokens = this.tokenize(text);
    const tf = new Map<string, number>();
    
    // Calculate TF (Term Frequency)
    tokens.forEach(token => {
      tf.set(token, (tf.get(token) || 0) + 1);
    });
    
    // Normalize TF
    tokens.forEach(token => {
      tf.set(token, tf.get(token)! / tokens.length);
    });
    
    // Calculate IDF (Inverse Document Frequency)
    const idf = new Map<string, number>();
    const allTokens = new Set<string>();
    allTexts.forEach(t => this.tokenize(t).forEach(token => allTokens.add(token)));
    
    allTokens.forEach(token => {
      const docsWithToken = allTexts.filter(t => 
        this.tokenize(t).includes(token)
      ).length;
      idf.set(token, Math.log(allTexts.length / docsWithToken));
    });
    
    // Calculate TF-IDF
    const tfidf = new Map<string, number>();
    tokens.forEach(token => {
      tfidf.set(token, (tf.get(token) || 0) * (idf.get(token) || 0));
    });
    
    return tfidf;
  }

  private static cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    const allKeys = new Set([...vec1.keys(), ...vec2.keys()]);
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    allKeys.forEach(key => {
      const val1 = vec1.get(key) || 0;
      const val2 = vec2.get(key) || 0;
      
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    });
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  public static async search(
    query: string, 
    documents: Array<{ id: string; text: string }>,
    threshold: number = 0.3
  ): Promise<SemanticResult[]> {
    const allTexts = [query, ...documents.map(d => d.text)];
    
    const queryTFIDF = this.calculateTFIDF(query, allTexts);
    
    const results: SemanticResult[] = [];
    
    documents.forEach(doc => {
      const docTFIDF = this.calculateTFIDF(doc.text, allTexts);
      const similarity = this.cosineSimilarity(queryTFIDF, docTFIDF);
      
      if (similarity >= threshold) {
        results.push({
          id: doc.id,
          similarity,
          text: doc.text
        });
      }
    });
    
    return results.sort((a, b) => b.similarity - a.similarity);
  }

  // Enhanced search with domain context
  public static async searchWithContext(
    query: string,
    domain: string,
    documents: Array<{ id: string; text: string; tags?: string[] }>,
    threshold: number = 0.3
  ): Promise<SemanticResult[]> {
    // Boost query with domain-specific terms
    const domainBoosts = {
      'customer-service': ['customer', 'support', 'service', 'help', 'assist'],
      'content-creation': ['content', 'create', 'generate', 'publish', 'media'],
      'seo-marketing': ['seo', 'marketing', 'optimize', 'rank', 'traffic'],
      'data-analysis': ['data', 'analyze', 'report', 'insights', 'metrics'],
      'crm-sales': ['crm', 'sales', 'lead', 'customer', 'pipeline'],
      'finance': ['finance', 'invoice', 'payment', 'billing', 'accounting'],
      'hr-recruitment': ['hr', 'recruit', 'hiring', 'employee', 'candidate'],
      'project-management': ['project', 'manage', 'task', 'plan', 'timeline'],
      'ecommerce': ['ecommerce', 'shop', 'store', 'product', 'order'],
      'general': ['automation', 'workflow', 'integrate', 'connect', 'sync']
    };
    
    const boostTerms = domainBoosts[domain as keyof typeof domainBoosts] || [];
    const enhancedQuery = `${query} ${boostTerms.join(' ')}`;
    
    return this.search(enhancedQuery, documents, threshold);
  }
}

// Utility function to extract text from workflow for semantic search
export function extractWorkflowText(workflow: any): string {
  const parts = [
    workflow.name || '',
    workflow.description || '',
    workflow.tags?.join(' ') || '',
    workflow.nodes?.map((node: any) => node.name || '').join(' ') || '',
    workflow.connections?.map((conn: any) => conn.label || '').join(' ') || ''
  ];
  
  return parts.filter(Boolean).join(' ');
}
