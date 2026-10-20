'use client';

/**
 * interactionRpc — 文章点赞/点踩的幂等切换
 *
 * 依赖 reactionService 的现有 post_reactions 表逻辑（切换/取消/改类型），
 * 返回服务端权威计数，供文章页乐观更新回填。
 * 与 addPostReaction 的区别：本函数感知当前状态，返回切换后的精确状态，
 * 且不依赖调用方传入本地计数（避免并发误差）。
 */
import { supabase } from '@/utils/supabase-config';

export interface ToggleReactionResult {
  reaction: 'like' | 'dislike' | null;
  likes: number;
  dislikes: number;
}

export const togglePostReaction = async (
  post_id: string,
  user_id: string,
  type: 'like' | 'dislike'
): Promise<ToggleReactionResult | null> => {
  try {
    // 1. 读取当前反应状态
    const { data: existing, error: readError } = await supabase
      .from('post_reactions')
      .select('reaction_id,type')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (readError) throw readError;

    let newReaction: 'like' | 'dislike' | null = type;

    if (existing && existing.type === type) {
      // 2a. 重复点击同一类型 → 取消
      const { error: delError } = await supabase
        .from('post_reactions')
        .delete()
        .eq('reaction_id', existing.reaction_id);
      if (delError) throw delError;
      newReaction = null;
    } else if (existing) {
      // 2b. 切换类型
      const { error: updError } = await supabase
        .from('post_reactions')
        .update({ type })
        .eq('reaction_id', existing.reaction_id);
      if (updError) throw updError;
      newReaction = type;
    } else {
      // 2c. 新增反应
      const { error: insError } = await supabase
        .from('post_reactions')
        .insert([{ post_id, user_id, type }]);
      if (insError) throw insError;
      newReaction = type;
    }

    // 3. 以数据库为准统计计数
    const { count: likes, error: likeError } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id)
      .eq('type', 'like');
    if (likeError) throw likeError;

    const { count: dislikes, error: dislikeError } = await supabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id)
      .eq('type', 'dislike');
    if (dislikeError) throw dislikeError;

    return {
      reaction: newReaction,
      likes: likes || 0,
      dislikes: dislikes || 0
    };
  } catch (error) {
    console.error('togglePostReaction failed:', error);
    return null;
  }
};

/**
 * 批量拉取用户对多条评论的反应状态
 * 返回 { [comment_id]: 'like' | 'dislike' | null }
 */
export const fetchCommentReactions = async (
  commentIds: string[],
  user_id: string
): Promise<Record<string, 'like' | 'dislike' | null>> => {
  const result: Record<string, 'like' | 'dislike' | null> = {};
  if (!commentIds.length) return result;
  try {
    const { data, error } = await supabase
      .from('comment_reactions')
      .select('comment_id,type')
      .eq('user_id', user_id)
      .in('comment_id', commentIds);
    if (error) throw error;

    // 先全部置 null，再用查询结果覆盖
    for (const id of commentIds) result[id] = null;
    for (const row of data || []) {
      result[row.comment_id] = row.type as 'like' | 'dislike';
    }
    return result;
  } catch (error) {
    console.error('fetchCommentReactions failed:', error);
    return result;
  }
};

/**
 * 评论点赞/点踩的幂等切换，返回服务端权威计数
 */
export const toggleCommentReaction = async (
  comment_id: string,
  user_id: string,
  type: 'like' | 'dislike'
): Promise<ToggleReactionResult | null> => {
  try {
    const { data: existing, error: readError } = await supabase
      .from('comment_reactions')
      .select('reaction_id,type')
      .eq('comment_id', comment_id)
      .eq('user_id', user_id)
      .maybeSingle();
    if (readError) throw readError;

    let newReaction: 'like' | 'dislike' | null = type;

    if (existing && existing.type === type) {
      const { error: delError } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('reaction_id', existing.reaction_id);
      if (delError) throw delError;
      newReaction = null;
    } else if (existing) {
      const { error: updError } = await supabase
        .from('comment_reactions')
        .update({ type })
        .eq('reaction_id', existing.reaction_id);
      if (updError) throw updError;
      newReaction = type;
    } else {
      const { error: insError } = await supabase
        .from('comment_reactions')
        .insert([{ comment_id, user_id, type }]);
      if (insError) throw insError;
      newReaction = type;
    }

    const { count: likes, error: likeError } = await supabase
      .from('comment_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', comment_id)
      .eq('type', 'like');
    if (likeError) throw likeError;

    const { count: dislikes, error: dislikeError } = await supabase
      .from('comment_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', comment_id)
      .eq('type', 'dislike');
    if (dislikeError) throw dislikeError;

    return {
      reaction: newReaction,
      likes: likes || 0,
      dislikes: dislikes || 0
    };
  } catch (error) {
    console.error('toggleCommentReaction failed:', error);
    return null;
  }
};
