import { supabase } from './supabase';

// Function to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

// Helper to check if a string is a valid UUID
const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Feedback submission function
export const submitFeedback = async (
  userId: string,
  category: 'bug' | 'feature' | 'general' | 'performance',
  subject: string,
  message: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
): Promise<{ success: boolean; id?: string; error?: string }> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return { success: false, error: 'Database not configured' };
  }

  // Validation
  if (!subject.trim()) {
    return { success: false, error: 'Subject is required' };
  }

  if (!message.trim()) {
    return { success: false, error: 'Message is required' };
  }

  if (subject.length > 200) {
    return { success: false, error: 'Subject must be less than 200 characters' };
  }

  if (message.length > 2000) {
    return { success: false, error: 'Message must be less than 2000 characters' };
  }

  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        {
          user_id: userId,
          category,
          subject: subject.trim(),
          message: message.trim(),
          priority
        }
      ])
      .select('id')
      .single();

    if (error) {
      if (error.code === '42P01' || error.code === '22P02') {
        return { success: false, error: 'Feedback system not available' };
      }
      console.error('Error submitting feedback:', error);
      return { success: false, error: 'Failed to submit feedback' };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error submitting feedback:', error?.message || error);
    }
    return { success: false, error: 'Failed to submit feedback' };
  }
};

// Get user's feedback submissions
export const getUserFeedback = async (userId: string): Promise<any[] | null> => {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01' || error.code === '22P02') {
        return null;
      }
      console.error('Error fetching user feedback:', error);
      return null;
    }

    return data || [];
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error fetching feedback:', error?.message || error);
    }
    return null;
  }
};

// Get feedback by ID (for admins or users viewing their own)
export const getFeedbackById = async (feedbackId: string, userId?: string): Promise<any | null> => {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    let query = supabase
      .from('feedback')
      .select('*')
      .eq('id', feedbackId);

    // If userId provided, ensure user can only see their own feedback
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.code === '22P02' || error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching feedback by ID:', error);
      return null;
    }

    return data;
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error fetching feedback by ID:', error?.message || error);
    }
    return null;
  }
};

// Update feedback status (admin function)
export const updateFeedbackStatus = async (
  feedbackId: string,
  status: 'submitted' | 'reviewed' | 'in_progress' | 'resolved' | 'closed',
  response?: string
): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const updateData: any = { status };
    if (response) {
      updateData.response = response;
      updateData.response_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', feedbackId);

    if (error) {
      if (error.code === '42P01' || error.code === '22P02') {
        return false;
      }
      console.error('Error updating feedback status:', error);
      return false;
    }

    return true;
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error updating feedback status:', error?.message || error);
    }
    return false;
  }
};

// Get feedback statistics (admin function)
export const getFeedbackStats = async (): Promise<any | null> => {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    // Get count by category
    const { data: categoryStats, error: categoryError } = await supabase
      .from('feedback')
      .select('category')
      .then(result => {
        if (result.data) {
          const counts: Record<string, number> = {};
          result.data.forEach(item => {
            counts[item.category] = (counts[item.category] || 0) + 1;
          });
          return { data: Object.entries(counts).map(([category, count]) => ({ category, count })), error: result.error };
        }
        return result;
      });

    // Get count by status
    const { data: statusStats, error: statusError } = await supabase
      .from('feedback')
      .select('status')
      .then(result => {
        if (result.data) {
          const counts: Record<string, number> = {};
          result.data.forEach(item => {
            counts[item.status] = (counts[item.status] || 0) + 1;
          });
          return { data: Object.entries(counts).map(([status, count]) => ({ status, count })), error: result.error };
        }
        return result;
      });

    // Get recent feedback
    const { data: recentFeedback, error: recentError } = await supabase
      .from('feedback')
      .select('id, category, subject, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (categoryError || statusError || recentError) {
      console.error('Error fetching feedback stats:', { categoryError, statusError, recentError });
      return null;
    }

    return {
      categoryStats: categoryStats || [],
      statusStats: statusStats || [],
      recentFeedback: recentFeedback || []
    };
  } catch (error: any) {
    if (error?.code !== '22P02') {
      console.error('Unexpected error fetching feedback stats:', error?.message || error);
    }
    return null;
  }
};

// Feedback validation helpers
export const validateFeedback = (subject: string, message: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!subject.trim()) {
    errors.push('Subject is required');
  } else if (subject.length > 200) {
    errors.push('Subject must be less than 200 characters');
  }

  if (!message.trim()) {
    errors.push('Message is required');
  } else if (message.length > 2000) {
    errors.push('Message must be less than 2000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Feedback categories with labels
export const FEEDBACK_CATEGORIES = [
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'feature', label: 'Feature Request', icon: '✨' },
  { value: 'general', label: 'General Feedback', icon: '💬' },
  { value: 'performance', label: 'Performance Issue', icon: '⚡' }
];

// Priority levels
export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' },
  { value: 'urgent', label: 'Urgent', color: 'error' }
];