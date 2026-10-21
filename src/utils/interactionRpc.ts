'use client';

/**
 * interactionRpc — 交互四件套的 RPC 封装（原子操作 + 服务端权威计数）
 *
 * 线上已部署的 Supabase RPC：
 *   toggle_post_reaction(p_post_id, p_user_id, p_type)    → [{likes,dislikes,reaction}]
 *   toggle_comment_reaction(p_comment_id, p_user_id, p_type) → 同上
 *   increment_post_views(p_post_id)                       → 原子 +1
 *   increment_site_views()                                → 原子 +1（003 修复触发器豁免）
 *
 * 兼容策略：RPC 未部署（PGRST202）→ 回退到旧客户端三步写路径，
 * 保证渐进增强，不让站点在迁移间隙挂掉。
 */
import { supabase } from '@/utils/supabase-config';
import { addPostReaction, addCommentReaction } from './reactionService';
import { getVisitCount } from './stats';

export interface ToggleReactionResult {
  reaction: 'like' | 'dislike' | null;
  likes: number;
  dislikes: number;
}

/** RPC 未部署时回退旧路径成功后的哨兵返回值：无服务端计数，调用方保持乐观值 */
const REACTION_PENDING: ToggleReactionResult = { reaction: null, likes: -1, dislikes: -1 };

/** PGRST202 = function not found in schema cache → RPC 未部署 */
const isRpcMissing = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) return false;
  return error.code === 'PGRST202' || /Could not find the function/i.test(error.message || '');
};

/**
 * 文章点赞/点踩幂等切换（服务端 RPC）
 * 返回切换后的权威状态；RPC 未部署时回退旧路径（成功返回哨兵值 likes=-1）
 */
export const togglePostReaction = async (
  post_id: string,
  user_id: string,
  type: 'like' | 'dislike'
): Promise<ToggleReactionResult | null> => {
  try {
    const { data, error } = await supabase.rpc('toggle_post_reaction', {
      p_post_id: post_id,
      p_user_id: user_id,
      p_type: type
    });

    if (error) {
      if (isRpcMissing(error)) {
        const ok = await addPostReaction(post_id, user_id, type, 0, 0);
        return ok ? REACTION_PENDING : null;
      }
      console.error('togglePostReaction RPC failed:', error.message);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      reaction: (row.reaction as 'like' | 'dislike' | null) ?? null,
      likes: row.likes ?? 0,
      dislikes: row.dislikes ?? 0
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
 * 评论点赞/点踩幂等切换（服务端 RPC）
 */
export const toggleCommentReaction = async (
  comment_id: string,
  user_id: string,
  type: 'like' | 'dislike'
): Promise<ToggleReactionResult | null> => {
  try {
    const { data, error } = await supabase.rpc('toggle_comment_reaction', {
      p_comment_id: comment_id,
      p_user_id: user_id,
      p_type: type
    });

    if (error) {
      if (isRpcMissing(error)) {
        const ok = await addCommentReaction(comment_id, user_id, type, 0, 0);
        return ok ? REACTION_PENDING : null;
      }
      console.error('toggleCommentReaction RPC failed:', error.message);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    return {
      reaction: (row.reaction as 'like' | 'dislike' | null) ?? null,
      likes: row.likes ?? 0,
      dislikes: row.dislikes ?? 0
    };
  } catch (error) {
    console.error('toggleCommentReaction failed:', error);
    return null;
  }
};

/**
 * 文章浏览量原子 +1（服务端 RPC；未部署时回退旧读改写）
 */
export const bumpPostView = async (post_id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('increment_post_views', { p_post_id: post_id });
    if (error) {
      if (isRpcMissing(error)) {
        const { data: post } = await supabase
          .from('posts')
          .select('views')
          .eq('post_id', post_id)
          .maybeSingle();
        const { error: updError } = await supabase
          .from('posts')
          .update({ views: (post?.views ?? 0) + 1 })
          .eq('post_id', post_id);
        return !updError;
      }
      console.error('bumpPostView RPC failed:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('bumpPostView failed:', error);
    return false;
  }
};

/**
 * 站点访问量原子 +1（服务端 RPC；未部署时回退旧读改写）
 */
export const bumpSiteVisit = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('increment_site_views');
    if (error) {
      if (isRpcMissing(error)) {
        // 回退旧读改写
        const total = await getVisitCount();
        const { error: updError } = await supabase
          .from('stats')
          .update({ total_views: (total ?? 0) + 1 })
          .eq('status_id', 'views');
        return !updError;
      }
      console.error('bumpSiteVisit RPC failed:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('bumpSiteVisit failed:', error);
    return false;
  }
};
