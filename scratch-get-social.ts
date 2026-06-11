import { supabaseServer } from './lib/supabase-server';

const decodeNote = (note: any): any => {
    if (!note) return note;
    const tags = note.tags || [];
    const levelTag = tags.find((t: string) => t.startsWith('level:'));
    const statusTag = tags.find((t: string) => t.startsWith('status:'));
    const newTags = tags.filter((t: string) => !t.startsWith('level:') && !t.startsWith('status:'));
    return {
        ...note,
        tags: newTags,
        task_level: levelTag ? levelTag.split(':')[1] : undefined,
        task_status: statusTag ? statusTag.split(':')[1] : undefined,
    };
};

export async function getSocialFeedServer(userId: string, connectionIds: string[]) {
    try {
        const userIds = [userId, ...connectionIds];
        
        const { data: networkPosts, error: networkError } = await supabaseServer
            .from('notes')
            .select(`
                *,
                note_attachments (*)
            `)
            .in('user_id', userIds)
            .is('converted_to_task', null)
            .order('created_at', { ascending: false });

        const { data: recentPosts, error: recentError } = await supabaseServer
            .from('notes')
            .select(`
                *,
                note_attachments (*)
            `)
            .is('converted_to_task', null)
            .order('created_at', { ascending: false })
            .limit(50);

        let combined = [...(networkPosts || [])];

        if (recentPosts) {
            const suggestedPosts = recentPosts.filter((post: any) => {
                if (userIds.includes(post.user_id)) return false;
                const decodedPost = decodeNote(post);
                const hasSocialTag = decodedPost.tags?.includes('social_post');
                return hasSocialTag;
            });
            combined = [...combined, ...suggestedPosts];
        }

        const uniquePosts = Array.from(new Map(combined.map(item => [item.id, item])).values());
        uniquePosts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return uniquePosts.map(decodeNote);
    } catch (error) {
        console.error('Unexpected error fetching social feed posts server:', error);
        return [];
    }
}
