'use server';

import { supabaseServer } from '../../lib/supabase-server';

export async function getAllUsers() {
  const { data: { users }, error } = await supabaseServer.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User'
  }));
}

export async function toggleUserConnection(userId: string, targetUserId: string) {
  // Try to create the table if it doesn't exist, ignore error if it does
  await supabaseServer.rpc('execute_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS user_connections (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        connected_user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(user_id, connected_user_id)
      );
    `
  });

  const { data: existing } = await supabaseServer
    .from('user_connections')
    .select('id')
    .eq('user_id', userId)
    .eq('connected_user_id', targetUserId)
    .single();

  if (existing) {
    await supabaseServer.from('user_connections').delete().eq('id', existing.id);
    return { status: 'disconnected' };
  } else {
    await supabaseServer.from('user_connections').insert([
      { user_id: userId, connected_user_id: targetUserId }
    ]);
    return { status: 'connected' };
  }
}

export async function getUserConnections(userId: string) {
  const { data } = await supabaseServer
    .from('user_connections')
    .select('connected_user_id')
    .eq('user_id', userId);
    
  return (data || []).map(d => d.connected_user_id);
}
