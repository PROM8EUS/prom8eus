import { supabase } from '../supabase';

export interface PilotFeedback {
  id: string;
  solution_id: string;
  solution_type: 'workflow' | 'agent';
  step_id?: string;
  user_id?: string;
  user_email?: string;
  feedback_type: 'step_quality' | 'step_clarity' | 'step_completeness' | 'step_accuracy' | 'overall_rating' | 'suggestion' | 'issue' | 'success_story';
  rating?: number; // 1-5 star rating
  feedback_text?: string;
  is_helpful?: boolean;
  difficulty_level?: 'too_easy' | 'just_right' | 'too_hard';
  time_taken?: number; // Time taken in minutes
  completion_status?: 'completed' | 'partial' | 'failed' | 'not_attempted';
  issues_encountered?: string[];
  suggestions?: string[];
  tools_used?: string[];
  additional_resources?: string[];
  user_agent?: string;
  ip_address?: string;
  referrer_url?: string;
  session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PilotFeedbackSession {
  id: string;
  session_id: string;
  user_email?: string;
  solution_id: string;
  solution_type: 'workflow' | 'agent';
  started_at: string;
  completed_at?: string;
  total_steps: number;
  completed_steps: number;
  total_feedback_items: number;
  overall_rating?: number;
  session_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PilotFeedbackStats {
  total_feedback_count: number;
  average_rating: number;
  completion_rate: number;
  helpful_feedback_count: number;
  issue_count: number;
  suggestion_count: number;
  success_story_count: number;
  average_time_taken: number;
  difficulty_distribution: Record<string, number>;
  rating_distribution: Record<string, number>;
}

export interface PilotFeedbackAnalytics {
  solution_id: string;
  solution_type: 'workflow' | 'agent';
  total_feedback_count: number;
  average_rating: number;
  completion_rate: number;
  helpful_feedback_count: number;
  issue_count: number;
  suggestion_count: number;
  success_story_count: number;
  average_time_taken: number;
  most_common_issues: string[];
  most_common_suggestions: string[];
}

export interface SubmitFeedbackData {
  solution_id: string;
  solution_type: 'workflow' | 'agent';
  step_id?: string;
  user_email?: string;
  feedback_type: PilotFeedback['feedback_type'];
  rating?: number;
  feedback_text?: string;
  is_helpful?: boolean;
  difficulty_level?: PilotFeedback['difficulty_level'];
  time_taken?: number;
  completion_status?: PilotFeedback['completion_status'];
  issues_encountered?: string[];
  suggestions?: string[];
  tools_used?: string[];
  additional_resources?: string[];
  session_id?: string;
}

export class PilotFeedbackService {
  // Submit pilot feedback
  static async submitFeedback(data: SubmitFeedbackData): Promise<string> {
    try {
      const { data: result, error } = await supabase.rpc('submit_pilot_feedback', {
        p_solution_id: data.solution_id,
        p_solution_type: data.solution_type,
        p_step_id: data.step_id || null,
        p_user_email: data.user_email || null,
        p_feedback_type: data.feedback_type,
        p_rating: data.rating || null,
        p_feedback_text: data.feedback_text || null,
        p_is_helpful: data.is_helpful || null,
        p_difficulty_level: data.difficulty_level || null,
        p_time_taken: data.time_taken || null,
        p_completion_status: data.completion_status || null,
        p_issues_encountered: data.issues_encountered || null,
        p_suggestions: data.suggestions || null,
        p_tools_used: data.tools_used || null,
        p_additional_resources: data.additional_resources || null,
        p_session_id: data.session_id || null
      });

      if (error) {
        console.error('Error submitting pilot feedback:', error);
        throw new Error(`Failed to submit feedback: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Error in submitFeedback:', error);
      throw error;
    }
  }

  // Start a feedback session
  static async startFeedbackSession(
    sessionId: string,
    solutionId: string,
    solutionType: 'workflow' | 'agent',
    userEmail?: string
  ): Promise<string> {
    try {
      const { data: result, error } = await supabase.rpc('start_pilot_feedback_session', {
        p_session_id: sessionId,
        p_solution_id: solutionId,
        p_solution_type: solutionType,
        p_user_email: userEmail || null
      });

      if (error) {
        console.error('Error starting feedback session:', error);
        throw new Error(`Failed to start feedback session: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Error in startFeedbackSession:', error);
      throw error;
    }
  }

  // Complete a feedback session
  static async completeFeedbackSession(
    sessionId: string,
    overallRating?: number,
    sessionNotes?: string
  ): Promise<boolean> {
    try {
      const { data: result, error } = await supabase.rpc('complete_pilot_feedback_session', {
        p_session_id: sessionId,
        p_overall_rating: overallRating || null,
        p_session_notes: sessionNotes || null
      });

      if (error) {
        console.error('Error completing feedback session:', error);
        throw new Error(`Failed to complete feedback session: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Error in completeFeedbackSession:', error);
      throw error;
    }
  }

  // Get feedback statistics for a solution
  static async getFeedbackStats(solutionId: string): Promise<PilotFeedbackStats> {
    try {
      const { data, error } = await supabase.rpc('get_pilot_feedback_stats', {
        p_solution_id: solutionId
      });

      if (error) {
        console.error('Error getting feedback stats:', error);
        throw new Error(`Failed to get feedback stats: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return {
          total_feedback_count: 0,
          average_rating: 0,
          completion_rate: 0,
          helpful_feedback_count: 0,
          issue_count: 0,
          suggestion_count: 0,
          success_story_count: 0,
          average_time_taken: 0,
          difficulty_distribution: {},
          rating_distribution: {}
        };
      }

      const stats = data[0];
      return {
        total_feedback_count: parseInt(stats.total_feedback_count) || 0,
        average_rating: parseFloat(stats.average_rating) || 0,
        completion_rate: parseFloat(stats.completion_rate) || 0,
        helpful_feedback_count: parseInt(stats.helpful_feedback_count) || 0,
        issue_count: parseInt(stats.issue_count) || 0,
        suggestion_count: parseInt(stats.suggestion_count) || 0,
        success_story_count: parseInt(stats.success_story_count) || 0,
        average_time_taken: parseFloat(stats.average_time_taken) || 0,
        difficulty_distribution: stats.difficulty_distribution || {},
        rating_distribution: stats.rating_distribution || {}
      };
    } catch (error) {
      console.error('Error in getFeedbackStats:', error);
      throw error;
    }
  }

  // Get recent feedback for a solution
  static async getRecentFeedback(
    solutionId: string,
    limit: number = 10
  ): Promise<PilotFeedback[]> {
    try {
      const { data, error } = await supabase.rpc('get_recent_pilot_feedback', {
        p_solution_id: solutionId,
        p_limit: limit
      });

      if (error) {
        console.error('Error getting recent feedback:', error);
        throw new Error(`Failed to get recent feedback: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentFeedback:', error);
      throw error;
    }
  }

  // Get feedback analytics
  static async getFeedbackAnalytics(
    solutionId?: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<PilotFeedbackAnalytics[]> {
    try {
      const { data, error } = await supabase.rpc('get_pilot_feedback_analytics', {
        p_solution_id: solutionId || null,
        p_period: period
      });

      if (error) {
        console.error('Error getting feedback analytics:', error);
        throw new Error(`Failed to get feedback analytics: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFeedbackAnalytics:', error);
      throw error;
    }
  }

  // Get all feedback for a solution
  static async getAllFeedback(solutionId: string): Promise<PilotFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('pilot_feedback')
        .select('*')
        .eq('solution_id', solutionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all feedback:', error);
        throw new Error(`Failed to get all feedback: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllFeedback:', error);
      throw error;
    }
  }

  // Get feedback sessions for a solution
  static async getFeedbackSessions(solutionId: string): Promise<PilotFeedbackSession[]> {
    try {
      const { data, error } = await supabase
        .from('pilot_feedback_sessions')
        .select('*')
        .eq('solution_id', solutionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting feedback sessions:', error);
        throw new Error(`Failed to get feedback sessions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFeedbackSessions:', error);
      throw error;
    }
  }

  // Generate session ID
  static generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get feedback type display name
  static getFeedbackTypeDisplayName(feedbackType: PilotFeedback['feedback_type']): string {
    const displayNames = {
      'step_quality': 'Step Quality',
      'step_clarity': 'Step Clarity',
      'step_completeness': 'Step Completeness',
      'step_accuracy': 'Step Accuracy',
      'overall_rating': 'Overall Rating',
      'suggestion': 'Suggestion',
      'issue': 'Issue',
      'success_story': 'Success Story'
    };

    return displayNames[feedbackType] || feedbackType;
  }

  // Get difficulty level display name
  static getDifficultyLevelDisplayName(difficultyLevel: PilotFeedback['difficulty_level']): string {
    const displayNames = {
      'too_easy': 'Too Easy',
      'just_right': 'Just Right',
      'too_hard': 'Too Hard'
    };

    return displayNames[difficultyLevel] || difficultyLevel;
  }

  // Get completion status display name
  static getCompletionStatusDisplayName(completionStatus: PilotFeedback['completion_status']): string {
    const displayNames = {
      'completed': 'Completed',
      'partial': 'Partially Completed',
      'failed': 'Failed',
      'not_attempted': 'Not Attempted'
    };

    return displayNames[completionStatus] || completionStatus;
  }

  // Get feedback type icon
  static getFeedbackTypeIcon(feedbackType: PilotFeedback['feedback_type']): string {
    const icons = {
      'step_quality': '⭐',
      'step_clarity': '💡',
      'step_completeness': '✅',
      'step_accuracy': '🎯',
      'overall_rating': '📊',
      'suggestion': '💭',
      'issue': '⚠️',
      'success_story': '🎉'
    };

    return icons[feedbackType] || '📝';
  }

  // Get rating color
  static getRatingColor(rating: number): string {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  }

  // Get difficulty color
  static getDifficultyColor(difficultyLevel: PilotFeedback['difficulty_level']): string {
    const colors = {
      'too_easy': 'text-green-600',
      'just_right': 'text-blue-600',
      'too_hard': 'text-red-600'
    };

    return colors[difficultyLevel] || 'text-gray-600';
  }

  // Get completion status color
  static getCompletionStatusColor(completionStatus: PilotFeedback['completion_status']): string {
    const colors = {
      'completed': 'text-green-600',
      'partial': 'text-yellow-600',
      'failed': 'text-red-600',
      'not_attempted': 'text-gray-600'
    };

    return colors[completionStatus] || 'text-gray-600';
  }
}
