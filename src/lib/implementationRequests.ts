import { supabase } from '../integrations/supabase/client';

// Types
export interface ImplementationRequest {
  id: string;
  user_name: string;
  user_email: string;
  company?: string;
  preferred_tools: string[];
  timeline: string;
  budget_range: string;
  task_description?: string;
  subtasks?: any[];
  automation_score?: number;
  selected_workflow_ids: string[];
  selected_agent_ids: string[];
  status: 'pending' | 'contacted' | 'quoted' | 'in_progress' | 'completed' | 'cancelled';
  admin_notes?: string;
  admin_assigned_to?: string;
  estimated_value?: number;
  email_sent_to_service: boolean;
  email_sent_at?: string;
  auto_reply_sent: boolean;
  auto_reply_sent_at?: string;
  created_at: string;
  updated_at: string;
  contacted_at?: string;
  quoted_at?: string;
  completed_at?: string;
}

export interface ImplementationRequestStats {
  total_requests: number;
  pending_requests: number;
  contacted_requests: number;
  quoted_requests: number;
  in_progress_requests: number;
  completed_requests: number;
  cancelled_requests: number;
  total_estimated_value: number;
  avg_estimated_value: number;
  requests_today: number;
  requests_this_week: number;
  requests_this_month: number;
}

export interface CreateImplementationRequestData {
  user_name: string;
  user_email: string;
  company?: string;
  preferred_tools: string[];
  timeline: string;
  budget_range: string;
  additional_requirements?: string;
  task_context?: {
    task_description?: string;
    subtasks?: string[];
    automation_score?: number;
    selected_workflow_ids?: string[];
    selected_agent_ids?: string[];
  };
  user_agent?: string;
  referrer_url?: string;
  session_id?: string;
}

export class ImplementationRequestService {
  /**
   * Create a new implementation request
   */
  static async createRequest(data: CreateImplementationRequestData): Promise<{ success: boolean; request_id?: string; error?: string }> {
    try {
      const response = await fetch('/api/implementation-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create implementation request');
      }

      const result = await response.json();
      return { success: true, request_id: result.request_id };
    } catch (error) {
      console.error('Error creating implementation request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get implementation request statistics
   */
  static async getStats(): Promise<ImplementationRequestStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_implementation_request_stats');
      
      if (error) {
        console.error('Error fetching implementation request stats:', error);
        return null;
      }

      return data[0] || null;
    } catch (error) {
      console.error('Error fetching implementation request stats:', error);
      return null;
    }
  }

  /**
   * Get implementation requests by status
   */
  static async getRequestsByStatus(status: string): Promise<ImplementationRequest[]> {
    try {
      const { data, error } = await supabase.rpc('get_implementation_requests_by_status', {
        request_status: status
      });
      
      if (error) {
        console.error('Error fetching implementation requests by status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching implementation requests by status:', error);
      return [];
    }
  }

  /**
   * Get recent implementation requests
   */
  static async getRecentRequests(limit: number = 10): Promise<ImplementationRequest[]> {
    try {
      const { data, error } = await supabase.rpc('get_recent_implementation_requests', {
        limit_count: limit
      });
      
      if (error) {
        console.error('Error fetching recent implementation requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching recent implementation requests:', error);
      return [];
    }
  }

  /**
   * Get implementation request with full context
   */
  static async getRequestWithContext(requestId: string): Promise<ImplementationRequest | null> {
    try {
      const { data, error } = await supabase.rpc('get_implementation_request_with_context', {
        request_id: requestId
      });
      
      if (error) {
        console.error('Error fetching implementation request with context:', error);
        return null;
      }

      return data[0] || null;
    } catch (error) {
      console.error('Error fetching implementation request with context:', error);
      return null;
    }
  }

  /**
   * Update implementation request status
   */
  static async updateRequestStatus(
    requestId: string,
    status: string,
    adminNotes?: string,
    adminAssignedTo?: string,
    estimatedValue?: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_implementation_request_status', {
        request_id: requestId,
        new_status: status,
        admin_notes: adminNotes,
        admin_assigned_to: adminAssignedTo,
        estimated_value: estimatedValue
      });
      
      if (error) {
        console.error('Error updating implementation request status:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error updating implementation request status:', error);
      return false;
    }
  }

  /**
   * Mark email as sent
   */
  static async markEmailSent(requestId: string, emailType: 'service' | 'auto_reply'): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('mark_implementation_request_email_sent', {
        request_id: requestId,
        email_type: emailType
      });
      
      if (error) {
        console.error('Error marking email as sent:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error marking email as sent:', error);
      return false;
    }
  }

  /**
   * Get all implementation requests (admin only)
   */
  static async getAllRequests(): Promise<ImplementationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('implementation_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all implementation requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all implementation requests:', error);
      return [];
    }
  }

  /**
   * Search implementation requests
   */
  static async searchRequests(query: string): Promise<ImplementationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('implementation_requests')
        .select('*')
        .or(`user_name.ilike.%${query}%,user_email.ilike.%${query}%,company.ilike.%${query}%,task_description.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error searching implementation requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error searching implementation requests:', error);
      return [];
    }
  }

  /**
   * Get requests by date range
   */
  static async getRequestsByDateRange(startDate: string, endDate: string): Promise<ImplementationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('implementation_requests')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching implementation requests by date range:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching implementation requests by date range:', error);
      return [];
    }
  }

  /**
   * Get requests by company
   */
  static async getRequestsByCompany(company: string): Promise<ImplementationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('implementation_requests')
        .select('*')
        .eq('company', company)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching implementation requests by company:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching implementation requests by company:', error);
      return [];
    }
  }

  /**
   * Get requests by budget range
   */
  static async getRequestsByBudgetRange(budgetRange: string): Promise<ImplementationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('implementation_requests')
        .select('*')
        .eq('budget_range', budgetRange)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching implementation requests by budget range:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching implementation requests by budget range:', error);
      return [];
    }
  }

  /**
   * Get requests by timeline
   */
  static async getRequestsByTimeline(timeline: string): Promise<ImplementationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('implementation_requests')
        .select('*')
        .eq('timeline', timeline)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching implementation requests by timeline:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching implementation requests by timeline:', error);
      return [];
    }
  }
}
