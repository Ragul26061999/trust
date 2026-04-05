import { supabase, isSupabaseConfigured } from './supabase';

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_email?: string;
}

export const getPostLikes = async (postId: string) => {
  if (!isSupabaseConfigured() || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('post_likes table might not exist yet:', error);
    return [];
  }
};

export const toggleLike = async (postId: string, userId: string) => {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    // Check if liked
    const { data: existing } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase.from('post_likes').delete().eq('id', existing.id);
      return { action: 'unliked' };
    } else {
      const { data, error } = await supabase
        .from('post_likes')
        .insert([{ post_id: postId, user_id: userId }])
        .select()
        .single();
      if (error) throw error;
      return { action: 'liked', data };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return null;
  }
};

export const getPostComments = async (postId: string) => {
  if (!isSupabaseConfigured() || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('post_comments table might not exist yet:', error);
    return [];
  }
};

export const addComment = async (postId: string, userId: string, content: string) => {
  if (!isSupabaseConfigured() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .insert([{ post_id: postId, user_id: userId, content }])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    return null;
  }
};
