import { supabase, isSupabaseConfigured } from './supabase';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export const getMessages = async (userId: string, otherUserId: string) => {
  if (!isSupabaseConfigured() || !supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data as ChatMessage[];
  } catch (error) {
    console.error('Unexpected error fetching messages:', error);
    return [];
  }
};

export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  if (!isSupabaseConfigured() || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ 
        sender_id: senderId, 
        receiver_id: receiverId, 
        content 
      }])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data as ChatMessage;
  } catch (error) {
    console.error('Unexpected error sending message:', error);
    return null;
  }
};

export const getUnreadCounts = async (userId: string) => {
  if (!isSupabaseConfigured() || !supabase) return {};

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread counts:', error);
      return {};
    }

    const counts: Record<string, number> = {};
    for (const msg of data || []) {
      counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
    }
    return counts;
  } catch (error) {
    console.error('Unexpected error fetching unread counts:', error);
    return {};
  }
};

export const markMessagesAsRead = async (userId: string, senderId: string) => {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('sender_id', senderId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error marking messages as read:', error);
    return false;
  }
};
