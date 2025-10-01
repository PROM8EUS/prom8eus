// Shared Analysis Service for cross-user sharing
import { supabase } from './supabase';

export interface SharedAnalysisData {
  originalText: string;
  jobTitle?: string;
  createdAt?: string;
  views?: number;
}

export interface StoreAnalysisRequest {
  shareId: string;
  originalText: string;
  jobTitle?: string;
}

export class SharedAnalysisService {
  private static readonly FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL || 'https://gasqdnyyrxmmojivlxon.supabase.co'}/functions/v1/shared-analysis`;
  private static readonly storeInProgress = new Set<string>();

  /**
   * Store an analysis for sharing
   */
  static async storeAnalysis(request: StoreAnalysisRequest): Promise<{ success: boolean; shareId?: string; error?: string }> {
    // DEBOUNCE: Prevent multiple simultaneous store calls for same analysis
    if (this.storeInProgress.has(request.shareId)) {
      console.log('⏳ [SharedAnalysis] Store already in progress for:', request.shareId);
      return { success: false, error: 'Store already in progress' };
    }
    
    this.storeInProgress.add(request.shareId);
    
    try {
      console.log('🔄 Storing analysis:', { shareId: request.shareId, originalTextLength: request.originalText?.length, jobTitle: request.jobTitle });
      console.log('📡 Function URL:', this.FUNCTION_URL);
      
      const response = await fetch(this.FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'store',
          ...request
        })
      });

      const result = await response.json();
      console.log('📥 Store response status:', response.status, 'Result:', result);

      if (!response.ok) {
        console.error('❌ Failed to store shared analysis:', result);
        return {
          success: false,
          error: result.error || 'Failed to store analysis'
        };
      }

      console.log('✅ Successfully stored analysis with shareId:', result.shareId);
      return {
        success: true,
        shareId: result.shareId
      };

    } catch (error) {
      console.error('Error storing shared analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.storeInProgress.delete(request.shareId);
    }
  }

  /**
   * Retrieve a shared analysis by share ID
   */
  static async getAnalysis(shareId: string): Promise<{ success: boolean; data?: SharedAnalysisData; error?: string }> {
    try {
      console.log('🔍 Getting analysis for shareId:', shareId);
      console.log('📡 Function URL:', this.FUNCTION_URL);
      
      const response = await fetch(this.FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'get',
          shareId
        })
      });

      const result = await response.json();
      console.log('📥 Get response status:', response.status, 'Result:', result);

      if (!response.ok) {
        console.error('❌ Failed to retrieve shared analysis:', result);
        
        // Provide more specific error messages
        if (response.status === 404) {
          return {
            success: false,
            error: 'Die geteilte Analyse ist nicht mehr verfügbar oder abgelaufen. Bitte führen Sie eine neue Analyse durch.'
          };
        }
        
        return {
          success: false,
          error: result.error || 'Fehler beim Abrufen der geteilten Analyse'
        };
      }

      console.log('✅ Successfully retrieved analysis:', result.data);
      return {
        success: true,
        data: result.data
      };

    } catch (error) {
      console.error('Error retrieving shared analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Abrufen der geteilten Analyse'
      };
    }
  }

  /**
   * Generate a unique share ID
   */
  static generateShareId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `analysis_${timestamp}_${random}`;
  }

  /**
   * Create a shareable URL
   */
  static createShareUrl(shareId: string, lang: string = 'de'): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/results?share=${shareId}&lang=${lang}`;
  }
}
