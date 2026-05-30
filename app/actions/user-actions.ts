'use server';

import { supabaseServer } from '../../lib/supabase-server';

export async function getAllUsers() {
  const { data: { users }, error } = await supabaseServer.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  // Fetch profiles to get avatars
  const { data: profiles } = await supabaseServer
    .from('user_profiles')
    .select('user_id, avatar_url');
    
  const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.avatar_url]));

  return users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
    avatarUrl: profileMap.get(user.id) || user.user_metadata?.avatar_url || null
  }));
}

export async function getUserConnectionsInfo(userId: string) {
  try {
    const { data } = await supabaseServer
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single();
      
    const prefs = data?.preferences || {};
    return {
      connections: (prefs.connections as string[]) || [],
      sentRequests: (prefs.sent_requests as string[]) || [],
      pendingRequests: (prefs.pending_requests as string[]) || []
    };
  } catch (error) {
    console.error('Error in getUserConnectionsInfo:', error);
    return { connections: [], sentRequests: [], pendingRequests: [] };
  }
}

async function updatePreferences(userId: string, updateFn: (prefs: any) => any) {
  const { data: prefData } = await supabaseServer
    .from('user_preferences')
    .select('preferences')
    .eq('user_id', userId)
    .single();

  const currentPrefs = prefData?.preferences || {};
  const newPrefs = updateFn(currentPrefs);

  if (prefData) {
    await supabaseServer
      .from('user_preferences')
      .update({ preferences: newPrefs })
      .eq('user_id', userId);
  } else {
    await supabaseServer
      .from('user_preferences')
      .insert([{ user_id: userId, preferences: newPrefs }]);
  }
}

export async function sendConnectionRequest(userId: string, targetUserId: string) {
  try {
    // Add target to user's sent_requests
    await updatePreferences(userId, (prefs) => {
      const sent = new Set(prefs.sent_requests || []);
      sent.add(targetUserId);
      return { ...prefs, sent_requests: Array.from(sent) };
    });

    // Add user to target's pending_requests
    await updatePreferences(targetUserId, (prefs) => {
      const pending = new Set(prefs.pending_requests || []);
      pending.add(userId);
      return { ...prefs, pending_requests: Array.from(pending) };
    });

    return { status: 'sent' };
  } catch (error) {
    console.error('Error in sendConnectionRequest:', error);
    throw error;
  }
}

export async function acceptConnectionRequest(userId: string, targetUserId: string) {
  try {
    // Remove from pending/sent and add to connections for both users
    await updatePreferences(userId, (prefs) => {
      const pending = new Set(prefs.pending_requests || []);
      pending.delete(targetUserId);
      const connections = new Set(prefs.connections || []);
      connections.add(targetUserId);
      return { ...prefs, pending_requests: Array.from(pending), connections: Array.from(connections) };
    });

    await updatePreferences(targetUserId, (prefs) => {
      const sent = new Set(prefs.sent_requests || []);
      sent.delete(userId);
      const connections = new Set(prefs.connections || []);
      connections.add(userId);
      return { ...prefs, sent_requests: Array.from(sent), connections: Array.from(connections) };
    });

    return { status: 'connected' };
  } catch (error) {
    console.error('Error in acceptConnectionRequest:', error);
    throw error;
  }
}

export async function rejectConnectionRequest(userId: string, targetUserId: string) {
  try {
    // Just remove from pending and sent
    await updatePreferences(userId, (prefs) => {
      const pending = new Set(prefs.pending_requests || []);
      pending.delete(targetUserId);
      return { ...prefs, pending_requests: Array.from(pending) };
    });

    await updatePreferences(targetUserId, (prefs) => {
      const sent = new Set(prefs.sent_requests || []);
      sent.delete(userId);
      return { ...prefs, sent_requests: Array.from(sent) };
    });

    return { status: 'rejected' };
  } catch (error) {
    console.error('Error in rejectConnectionRequest:', error);
    throw error;
  }
}

export async function removeConnection(userId: string, targetUserId: string) {
  try {
    // Remove from connections for both users
    await updatePreferences(userId, (prefs) => {
      const connections = new Set(prefs.connections || []);
      connections.delete(targetUserId);
      return { ...prefs, connections: Array.from(connections) };
    });

    await updatePreferences(targetUserId, (prefs) => {
      const connections = new Set(prefs.connections || []);
      connections.delete(userId);
      return { ...prefs, connections: Array.from(connections) };
    });

    return { status: 'disconnected' };
  } catch (error) {
    console.error('Error in removeConnection:', error);
    throw error;
  }
}
