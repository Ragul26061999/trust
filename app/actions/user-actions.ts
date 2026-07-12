'use server';

import { supabaseServer } from '../../lib/supabase-server';

import { unstable_cache } from 'next/cache';

export async function getAllUsers() {
  const getCachedUsers = unstable_cache(
    async () => {
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
    },
    ['all-users'],
    { revalidate: 60 } // Cache for 60 seconds
  );

  return getCachedUsers();
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
      pendingRequests: (prefs.pending_requests as string[]) || [],
      connectionTypes: (prefs.connection_types as Record<string, string>) || {},
      pendingTypes: (prefs.pending_types as Record<string, string>) || {},
      cancelRequests: (prefs.cancel_requests as string[]) || []
    };
  } catch (error) {
    console.error('Error in getUserConnectionsInfo:', error);
    return { connections: [], sentRequests: [], pendingRequests: [], connectionTypes: {}, pendingTypes: {}, cancelRequests: [] };
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

export async function sendConnectionRequest(userId: string, targetUserId: string, connectionType: string = 'Professional') {
  try {
    // Add target to user's sent_requests
    await updatePreferences(userId, (prefs) => {
      const sent = new Set(prefs.sent_requests || []);
      sent.add(targetUserId);
      const connection_types = { ...(prefs.connection_types || {}) };
      connection_types[targetUserId] = connectionType;
      return { ...prefs, sent_requests: Array.from(sent), connection_types };
    });

    // Add user to target's pending_requests
    await updatePreferences(targetUserId, (prefs) => {
      const pending = new Set(prefs.pending_requests || []);
      pending.add(userId);
      const pending_types = { ...(prefs.pending_types || {}) };
      pending_types[userId] = connectionType;
      return { ...prefs, pending_requests: Array.from(pending), pending_types };
    });

    return { status: 'sent' };
  } catch (error) {
    console.error('Error in sendConnectionRequest:', error);
    throw error;
  }
}

export async function acceptConnectionRequest(userId: string, targetUserId: string, connectionType: string = 'Professional') {
  try {
    // Remove from pending/sent and add to connections for both users
    await updatePreferences(userId, (prefs) => {
      const pending = new Set(prefs.pending_requests || []);
      pending.delete(targetUserId);
      const connections = new Set(prefs.connections || []);
      connections.add(targetUserId);
      const connection_types = { ...(prefs.connection_types || {}) };
      connection_types[targetUserId] = connectionType;
      const pending_types = { ...(prefs.pending_types || {}) };
      delete pending_types[targetUserId];
      return { ...prefs, pending_requests: Array.from(pending), connections: Array.from(connections), connection_types, pending_types };
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
      const pending_types = { ...(prefs.pending_types || {}) };
      delete pending_types[targetUserId];
      return { ...prefs, pending_requests: Array.from(pending), pending_types };
    });

    await updatePreferences(targetUserId, (prefs) => {
      const sent = new Set(prefs.sent_requests || []);
      sent.delete(userId);
      const connection_types = { ...(prefs.connection_types || {}) };
      delete connection_types[userId];
      return { ...prefs, sent_requests: Array.from(sent), connection_types };
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
      const connection_types = { ...(prefs.connection_types || {}) };
      delete connection_types[targetUserId];
      return { ...prefs, connections: Array.from(connections), connection_types };
    });

    await updatePreferences(targetUserId, (prefs) => {
      const cancel_requests = new Set(prefs.cancel_requests || []);
      const targetConnections = prefs.connections || [];
      if (targetConnections.includes(userId)) {
        cancel_requests.add(userId);
      }
      return { ...prefs, cancel_requests: Array.from(cancel_requests) };
    });

    return { status: 'disconnected' };
  } catch (error) {
    console.error('Error in removeConnection:', error);
    throw error;
  }
}

export async function resolveCancelRequest(userId: string, targetUserId: string, keepConnection: boolean) {
  try {
    await updatePreferences(userId, (prefs) => {
      const cancel_requests = new Set(prefs.cancel_requests || []);
      cancel_requests.delete(targetUserId);
      
      const connections = new Set(prefs.connections || []);
      if (!keepConnection) {
        connections.delete(targetUserId);
        const connection_types = { ...(prefs.connection_types || {}) };
        delete connection_types[targetUserId];
        return { ...prefs, cancel_requests: Array.from(cancel_requests), connections: Array.from(connections), connection_types };
      }
      
      return { ...prefs, cancel_requests: Array.from(cancel_requests), connections: Array.from(connections) };
    });
    return { status: 'resolved' };
  } catch (error) {
    console.error('Error in resolveCancelRequest:', error);
    throw error;
  }
}

export async function getBannerPreferences(userId: string) {
  try {
    const { data } = await supabaseServer
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single();
      
    const prefs = data?.preferences || {};
    return {
      bannerColor: prefs.bannerColor || null,
      bannerUrl: prefs.bannerUrl || null,
    };
  } catch (error) {
    return { bannerColor: null, bannerUrl: null };
  }
}

export async function saveBannerPreferences(userId: string, bannerColor: string | null, bannerUrl: string | null) {
  await updatePreferences(userId, (prefs) => ({ ...prefs, bannerColor, bannerUrl }));
}

// ─── Social Feed with Author Profiles ─────────────────────────────────────────
// Uses supabaseServer (service_role) to bypass RLS and fetch cross-user posts.
// Returns posts enriched with author name, avatar, and email.

export interface FeedPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  converted_to_task?: boolean;
  color?: string;
  drawing_data?: any;
  drawing_thumbnail?: string;
  audio_recording_url?: string;
  video_recording_url?: string;
  tags?: string[];
  is_drawing?: boolean;
  is_recording?: boolean;
  task_level?: string;
  task_status?: string;
  note_attachments?: any[];
  // Author profile fields
  author_name: string;
  author_avatar: string | null;
  author_email: string;
}

// Helper to decode level/status from tags (mirrors notes-db.ts logic)
function decodeFeedNote(note: any): any {
  if (!note) return note;
  const tags = note.tags || [];
  const levelTag = tags.find((t: string) => t.startsWith('level:'));
  const statusTag = tags.find((t: string) => t.startsWith('status:'));
  const cleanTags = tags.filter((t: string) => !t.startsWith('level:') && !t.startsWith('status:'));
  return {
    ...note,
    tags: cleanTags,
    task_level: levelTag ? levelTag.split(':')[1] : undefined,
    task_status: statusTag ? statusTag.split(':')[1] : undefined,
  };
}

export async function getSocialFeedWithAuthors(userId: string): Promise<FeedPost[]> {
  const getCachedFeed = unstable_cache(
    async (id: string) => {
      try {
        // 1. Resolve the user's connections from user_preferences
        const { data: prefData } = await supabaseServer

      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single();

    const prefs = prefData?.preferences || {};
    const connectionIds: string[] = prefs.connections || [];

    // 2. Build the list of user IDs whose posts we want
    const feedUserIds = [userId, ...connectionIds];

    // 3. Fetch posts AND auth users in parallel (both are independent)
    const [postsResult, authUsersResult] = await Promise.all([
      supabaseServer
        .from('notes')
        .select(`
          *,
          note_attachments (*)
        `)
        .in('user_id', feedUserIds)
        .is('converted_to_task', null)
        .order('created_at', { ascending: false })
        .limit(100),
      supabaseServer.auth.admin.listUsers()
    ]);

    const { data: posts, error: postsError } = postsResult;

    if (postsError) {
      console.error('Error fetching social feed posts:', postsError);
      return [];
    }

    if (!posts || posts.length === 0) return [];

    // 4. Collect unique author IDs from the posts
    const authorIds = [...new Set(posts.map((p: any) => p.user_id))];

    // 5. Fetch author profiles (avatar_url) from user_profiles table
    const { data: profiles } = await supabaseServer
      .from('user_profiles')
      .select('user_id, avatar_url')
      .in('user_id', authorIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.avatar_url]));

    // 6. Build auth user map from already-fetched data
    const authUsers = authUsersResult.data?.users || [];
    const authUserMap = new Map(
      authUsers.map(u => [u.id, {
        name: u.user_metadata?.name || u.email?.split('@')[0] || 'Unknown User',
        email: u.email || '',
        avatar: u.user_metadata?.avatar_url || null
      }])
    );

    // 7. Enrich each post with author data
    const enrichedPosts: FeedPost[] = posts.map((post: any) => {
      const decoded = decodeFeedNote(post);
      const authUser = authUserMap.get(post.user_id);
      const profileAvatar = profileMap.get(post.user_id);

      return {
        ...decoded,
        author_name: authUser?.name || 'Unknown User',
        author_avatar: profileAvatar || authUser?.avatar || null,
        author_email: authUser?.email || '',
      };
    });

      return enrichedPosts;
    } catch (error) {
      console.error('Error in getSocialFeedWithAuthors:', error);
      return [];
    }
  },
  ['social-feed', userId],
  { revalidate: 15 } // Cache for 15 seconds to support high concurrency
  );
  
  return getCachedFeed(userId);
}

export async function getSuggestedUsersInfo() {
  try {
    const { data: { users }, error: usersError } = await supabaseServer.auth.admin.listUsers();
    if (usersError) return [];
    
    const userIds = users.map(u => u.id);
    
    const [profilesRes, rolesRes] = await Promise.all([
      supabaseServer.from('user_profiles').select('user_id, avatar_url').in('user_id', userIds),
      supabaseServer.from('professional_roles').select('user_id, role_name, department, experience').in('user_id', userIds)
    ]);
    
    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.avatar_url]));
    const roleMap = new Map((rolesRes.data || []).map((r: any) => [r.user_id, r]));
    
    return users.map(user => {
      const roleInfo = roleMap.get(user.id) || {};
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User',
        avatarUrl: profileMap.get(user.id) || user.user_metadata?.avatar_url || null,
        role: roleInfo.role_name || 'Professional',
        department: roleInfo.department || 'General',
        experience: roleInfo.experience || 'Not specified'
      };
    });
  } catch (error) {
    console.error('Error in getSuggestedUsersInfo:', error);
    return [];
  }
}
