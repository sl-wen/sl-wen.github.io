import { supabase } from './supabase-config';

export interface Reaction {
    reaction_id: string;
    post_id: string;
    user_id: string;
    type: 'like' | 'dislike';
}

export const addPostReaction = async (post_id: string, user_id: string, type: 'like' | 'dislike', likesCount: number, dislikesCount: number): Promise<boolean> => {
    try {
        // 检查用户是否已经对这篇文章做出过反应
        const { data: existingReaction } = await supabase
            .from('post_reactions')
            .select('*')
            .eq('post_id', post_id)
            .eq('user_id', user_id)
            .maybeSingle();

        if (existingReaction) {
            if (existingReaction.type === type) {
                // 如果已经存在相同类型的反应，则删除它（取消点赞/踩）
                const { error: deleteError } = await supabase
                    .from('post_reactions')
                    .delete()
                    .eq('reaction_id', existingReaction.reaction_id);

                if (deleteError) throw deleteError;
                // 减少相应的计数
                if (type === 'like') {
                    likesCount--;
                } else {
                    dislikesCount--;
                }
            } else {
                // 如果存在不同类型的反应，则更新它
                const { error: updateError } = await supabase
                    .from('post_reactions')
                    .update({ type })
                    .eq('reaction_id', existingReaction.reaction_id);

                if (updateError) throw updateError;
                // 更新计数
                if (type === 'like') {
                    likesCount++;
                    dislikesCount--;
                } else {
                    dislikesCount++;
                    likesCount--;
                }
            }
        } else {
            // 如果不存在反应，则创建新的
            const { error: insertError } = await supabase
                .from('post_reactions')
                .insert([{ post_id, user_id, type }])
                .maybeSingle();

            if (insertError) throw insertError;
            // 增加相应的计数
            if (type === 'like') {
                likesCount++;
            } else {
                dislikesCount++;
            }
        }

        await updatePostReactionCount(post_id, likesCount, dislikesCount);
        return true;
    } catch (error) {
        console.error('处理反应失败:', error);
        return false;
    }
};


export const addCommentReaction = async (comment_id: string, user_id: string, type: 'like' | 'dislike', likesCount: number, dislikesCount: number): Promise<boolean> => {
    try {
        // 检查用户是否已经对评论做出过反应
        const { data: existingReaction } = await supabase
            .from('comment_reactions')
            .select('*')
            .eq('comment_id', comment_id)
            .eq('user_id', user_id)
            .maybeSingle();

        if (existingReaction) {
            if (existingReaction.type === type) {
                // 如果已经存在相同类型的反应，则删除它（取消点赞/踩）
                const { error: deleteError } = await supabase
                    .from('comment_reactions')
                    .delete()
                    .eq('reaction_id', existingReaction.reaction_id);

                if (deleteError) throw deleteError;
                // 减少相应的计数
                if (type === 'like') {
                    likesCount--;
                } else {
                    dislikesCount--;
                }
            } else {
                // 如果存在不同类型的反应，则更新它
                const { error: updateError } = await supabase
                    .from('comment_reactions')
                    .update({ type })
                    .eq('reaction_id', existingReaction.reaction_id);

                if (updateError) throw updateError;
                // 更新计数
                if (type === 'like') {
                    likesCount++;
                    dislikesCount--;
                } else {
                    dislikesCount++;
                    likesCount--;
                }
            }
        } else {
            // 如果不存在反应，则创建新的
            const { error: insertError } = await supabase
                .from('comment_reactions')
                .insert([{ comment_id, user_id, type }])
                .maybeSingle();

            if (insertError) throw insertError;
            // 增加相应的计数
            if (type === 'like') {
                likesCount++;
            } else {
                dislikesCount++;
            }
        }

        await updateCommentReactionCount(comment_id, likesCount, dislikesCount);
        return true;
    } catch (error) {
        console.error('处理评论反应失败:', error);
        return false;
    }
};

export const getPostReaction = async (post_id: string, user_id: string): Promise<'like' | 'dislike' | null> => {
    try {
        const { data, error } = await supabase
            .from('post_reactions')
            .select('type')
            .eq('post_id', post_id)
            .eq('user_id', user_id)
            .maybeSingle();

        if (error) return null;
        return data?.type || null;
    } catch (error) {
        console.error('获取用户文章反应失败:', error);
        return null;
    }
};

export const getCommentReaction = async (comment_id: string, user_id: string): Promise<'like' | 'dislike' | null> => {
    try {
        const { data, error } = await supabase
            .from('comment_reactions')
            .select('type')
            .eq('comment_id', comment_id)
            .eq('user_id', user_id)
            .maybeSingle();

        if (error) return null;
        return data?.type || null;
    } catch (error) {
        console.error('获取用户评论反应失败:', error);
        return null;
    }
};

const updatePostReactionCount = async (post_id: string, likesCount: number, dislikesCount: number): Promise<void> => {
    try {

        // 更新文章的点赞和踩数
        await supabase
            .from('posts')
            .update({
                likes_count: likesCount || 0,
                dislikes_count: dislikesCount || 0
            })
            .eq('post_id', post_id)
            .maybeSingle();
    } catch (error) {
        console.error('更新文章反应计数失败:', error);
    }
};


const updateCommentReactionCount = async (comment_id: string, likesCount: number, dislikesCount: number): Promise<void> => {
    try {

        // 更新文章的点赞和踩数
        await supabase
            .from('comments')
            .update({
                likes_count: likesCount || 0,
                dislikes_count: dislikesCount || 0
            })
            .eq('comment_id', comment_id)
            .maybeSingle();
    } catch (error) {
        console.error('更新评论反应计数失败:', error);
    }
};