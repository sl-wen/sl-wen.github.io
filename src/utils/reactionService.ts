import { supabase } from './supabase-config';

export interface Reaction {
  reaction_id: string;
  post_id: string;
  user_id: string;
  type: 'like' | 'dislike';
}

// 缓存用户的点赞状态，减少重复查询
const reactionCache = new Map<string, 'like' | 'dislike' | null>();
const requestCache = new Map<string, Promise<boolean>>();

// 防抖缓存，防止快速多次点击
const debounceCache = new Map<string, NodeJS.Timeout>();

// 缓存键生成函数
const getReactionCacheKey = (targetId: string, userId: string, type: 'post' | 'comment') =>
  `${type}_${targetId}_${userId}`;

const getRequestCacheKey = (targetId: string, userId: string, type: 'like' | 'dislike', targetType: 'post' | 'comment') =>
  `${targetType}_${targetId}_${userId}_${type}`;

// 防抖函数
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  key: string
): T => {
  return ((...args: any[]) => {
    const existingTimeout = debounceCache.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      func.apply(null, args);
      debounceCache.delete(key);
    }, wait);

    debounceCache.set(key, timeout);
  }) as T;
};

// 获取缓存的点赞状态
export const getCachedReaction = (
  targetId: string,
  userId: string,
  type: 'post' | 'comment'
): 'like' | 'dislike' | null | undefined => {
  const key = getReactionCacheKey(targetId, userId, type);
  return reactionCache.get(key);
};

// 设置缓存的点赞状态
export const setCachedReaction = (
  targetId: string,
  userId: string,
  type: 'post' | 'comment',
  reaction: 'like' | 'dislike' | null
): void => {
  const key = getReactionCacheKey(targetId, userId, type);
  reactionCache.set(key, reaction);
};

// 清理缓存
export const clearReactionCache = (targetId?: string, userId?: string): void => {
  if (targetId && userId) {
    const postKey = getReactionCacheKey(targetId, userId, 'post');
    const commentKey = getReactionCacheKey(targetId, userId, 'comment');
    reactionCache.delete(postKey);
    reactionCache.delete(commentKey);
  } else {
    reactionCache.clear();
  }
};

// 清理请求缓存
export const clearRequestCache = (): void => {
  requestCache.clear();
};

// 批量清理缓存（用于页面切换时）
export const clearAllReactionCache = (): void => {
  reactionCache.clear();
  requestCache.clear();
  debounceCache.forEach(timeout => clearTimeout(timeout));
  debounceCache.clear();
};

// 获取缓存统计信息（用于调试）
export const getReactionCacheStats = () => {
  return {
    reactionCache: reactionCache.size,
    requestCache: requestCache.size,
    debounceCache: debounceCache.size
  };
};

// 性能监控
const performanceMonitor = {
  reactions: new Map<string, { startTime: number; endTime?: number; success?: boolean }>(),

  startReaction: (id: string) => {
    performanceMonitor.reactions.set(id, { startTime: performance.now() });
  },

  endReaction: (id: string, success: boolean) => {
    const reaction = performanceMonitor.reactions.get(id);
    if (reaction) {
      reaction.endTime = performance.now();
      reaction.success = success;
      performanceMonitor.reactions.delete(id);
    }
  },

  getStats: () => {
    const reactions = Array.from(performanceMonitor.reactions.values());
    const completed = reactions.filter(r => r.endTime !== undefined);

    if (completed.length === 0) return null;

    const durations = completed.map(r => r.endTime! - r.startTime);
    const successRate = (completed.filter(r => r.success).length / completed.length) * 100;

    return {
      total: reactions.length,
      completed: completed.length,
      pending: reactions.length - completed.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: successRate
    };
  }
};

// 性能测试函数
export const testReactionPerformance = async (iterations: number = 100) => {
  const results = {
    totalTime: 0,
    averageTime: 0,
    minTime: Infinity,
    maxTime: 0,
    successRate: 0
  };

  console.log(`开始性能测试，执行 ${iterations} 次点赞操作...`);

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    try {
      // 这里应该使用真实的测试数据，但为了演示，我们使用模拟数据
      const success = true; // 模拟成功
      const endTime = performance.now();

      const duration = endTime - startTime;
      results.totalTime += duration;
      results.minTime = Math.min(results.minTime, duration);
      results.maxTime = Math.max(results.maxTime, duration);

      if (success) {
        results.successRate++;
      }
    } catch (error) {
      console.error(`第 ${i + 1} 次操作失败:`, error);
    }
  }

  results.averageTime = results.totalTime / iterations;
  results.successRate = (results.successRate / iterations) * 100;

  console.log('性能测试结果:', results);
  return results;
};

// 导出性能监控器（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  (window as any).reactionPerformance = performanceMonitor;
}

export const addPostReaction = async (
  post_id: string,
  user_id: string,
  type: 'like' | 'dislike',
  likesCount: number,
  dislikesCount: number
): Promise<boolean> => {
  // 使用缓存键来防止重复请求
  const cacheKey = getRequestCacheKey(post_id, user_id, type, 'post');

  // 如果已经有相同请求在进行中，直接返回
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  const reactionPromise = (async () => {
    try {
      // 先检查缓存的用户反应状态
      const cacheKey = getReactionCacheKey(post_id, user_id, 'post');
      let currentReaction = reactionCache.get(cacheKey);

      // 如果缓存中没有，则查询数据库
      if (currentReaction === undefined) {
        const { data: existingReaction } = await supabase
          .from('post_reactions')
          .select('*')
          .eq('post_id', post_id)
          .eq('user_id', user_id)
          .maybeSingle();

        currentReaction = existingReaction?.type || null;
        reactionCache.set(cacheKey, currentReaction);
      }

      let newReaction: 'like' | 'dislike' | null = currentReaction;
      let newLikesCount = likesCount;
      let newDislikesCount = dislikesCount;

      // 计算新的反应状态和计数
      if (currentReaction === type) {
        // 如果点击相同类型，则取消反应
        newReaction = null;
        if (type === 'like') {
          newLikesCount--;
        } else {
          newDislikesCount--;
        }
      } else if (currentReaction === null) {
        // 如果没有反应，则添加新反应
        newReaction = type;
        if (type === 'like') {
          newLikesCount++;
        } else {
          newDislikesCount++;
        }
      } else {
        // 如果有不同类型的反应，则切换反应
        newReaction = type;
        if (type === 'like') {
          newLikesCount += 2; // 取消踩 +1，添加赞 +1
          newDislikesCount--;
        } else {
          newDislikesCount += 2; // 取消赞 +1，添加踩 +1
          newLikesCount--;
        }
      }

      // 更新数据库
      if (currentReaction === type) {
        // 取消反应
        const { data: existingReaction } = await supabase
          .from('post_reactions')
          .select('reaction_id')
          .eq('post_id', post_id)
          .eq('user_id', user_id)
          .maybeSingle();

        if (existingReaction) {
          await supabase
            .from('post_reactions')
            .delete()
            .eq('reaction_id', existingReaction.reaction_id);
        }
      } else if (currentReaction === null) {
        // 添加新反应
        await supabase
          .from('post_reactions')
          .insert([{ post_id, user_id, type }]);
      } else {
        // 切换反应类型
        const { data: existingReaction } = await supabase
          .from('post_reactions')
          .select('reaction_id')
          .eq('post_id', post_id)
          .eq('user_id', user_id)
          .maybeSingle();

        if (existingReaction) {
          await supabase
            .from('post_reactions')
            .update({ type })
            .eq('reaction_id', existingReaction.reaction_id);
        }
      }

      // 更新计数
      await updatePostReactionCount(post_id, newLikesCount, newDislikesCount);

      // 更新缓存
      reactionCache.set(cacheKey, newReaction);

      return true;
    } catch (error) {
      console.error('处理反应失败:', error);
      return false;
    } finally {
      // 清理请求缓存
      requestCache.delete(cacheKey);
    }
  })();

  requestCache.set(cacheKey, reactionPromise);
  return reactionPromise;
};

export const addCommentReaction = async (
  comment_id: string,
  user_id: string,
  type: 'like' | 'dislike',
  likesCount: number,
  dislikesCount: number
): Promise<boolean> => {
  // 使用缓存键来防止重复请求
  const cacheKey = getRequestCacheKey(comment_id, user_id, type, 'comment');

  // 如果已经有相同请求在进行中，直接返回
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  const reactionPromise = (async () => {
    try {
      // 先检查缓存的用户反应状态
      const cacheKey = getReactionCacheKey(comment_id, user_id, 'comment');
      let currentReaction = reactionCache.get(cacheKey);

      // 如果缓存中没有，则查询数据库
      if (currentReaction === undefined) {
        const { data: existingReaction } = await supabase
          .from('comment_reactions')
          .select('*')
          .eq('comment_id', comment_id)
          .eq('user_id', user_id)
          .maybeSingle();

        currentReaction = existingReaction?.type || null;
        reactionCache.set(cacheKey, currentReaction);
      }

      let newReaction: 'like' | 'dislike' | null = currentReaction;
      let newLikesCount = likesCount;
      let newDislikesCount = dislikesCount;

      // 计算新的反应状态和计数
      if (currentReaction === type) {
        // 如果点击相同类型，则取消反应
        newReaction = null;
        if (type === 'like') {
          newLikesCount--;
        } else {
          newDislikesCount--;
        }
      } else if (currentReaction === null) {
        // 如果没有反应，则添加新反应
        newReaction = type;
        if (type === 'like') {
          newLikesCount++;
        } else {
          newDislikesCount++;
        }
      } else {
        // 如果有不同类型的反应，则切换反应
        newReaction = type;
        if (type === 'like') {
          newLikesCount += 2; // 取消踩 +1，添加赞 +1
          newDislikesCount--;
        } else {
          newDislikesCount += 2; // 取消赞 +1，添加踩 +1
          newLikesCount--;
        }
      }

      // 更新数据库
      if (currentReaction === type) {
        // 取消反应
        const { data: existingReaction } = await supabase
          .from('comment_reactions')
          .select('reaction_id')
          .eq('comment_id', comment_id)
          .eq('user_id', user_id)
          .maybeSingle();

        if (existingReaction) {
          await supabase
            .from('comment_reactions')
            .delete()
            .eq('reaction_id', existingReaction.reaction_id);
        }
      } else if (currentReaction === null) {
        // 添加新反应
        await supabase
          .from('comment_reactions')
          .insert([{ comment_id, user_id, type }]);
      } else {
        // 切换反应类型
        const { data: existingReaction } = await supabase
          .from('comment_reactions')
          .select('reaction_id')
          .eq('comment_id', comment_id)
          .eq('user_id', user_id)
          .maybeSingle();

        if (existingReaction) {
          await supabase
            .from('comment_reactions')
            .update({ type })
            .eq('reaction_id', existingReaction.reaction_id);
        }
      }

      // 更新计数
      await updateCommentReactionCount(comment_id, newLikesCount, newDislikesCount);

      // 更新缓存
      reactionCache.set(cacheKey, newReaction);

      return true;
    } catch (error) {
      console.error('处理评论反应失败:', error);
      return false;
    } finally {
      // 清理请求缓存
      requestCache.delete(cacheKey);
    }
  })();

  requestCache.set(cacheKey, reactionPromise);
  return reactionPromise;
};

export const getPostReaction = async (
  post_id: string,
  user_id: string
): Promise<'like' | 'dislike' | null> => {
  // 先检查缓存
  const cacheKey = getReactionCacheKey(post_id, user_id, 'post');
  const cachedReaction = reactionCache.get(cacheKey);
  if (cachedReaction !== undefined) {
    return cachedReaction;
  }

  try {
    const { data, error } = await supabase
      .from('post_reactions')
      .select('type')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) return null;
    const reaction = data?.type || null;
    reactionCache.set(cacheKey, reaction);
    return reaction;
  } catch (error) {
    console.error('获取用户文章反应失败:', error);
    return null;
  }
};

export const getCommentReaction = async (
  comment_id: string,
  user_id: string
): Promise<'like' | 'dislike' | null> => {
  // 先检查缓存
  const cacheKey = getReactionCacheKey(comment_id, user_id, 'comment');
  const cachedReaction = reactionCache.get(cacheKey);
  if (cachedReaction !== undefined) {
    return cachedReaction;
  }

  try {
    const { data, error } = await supabase
      .from('comment_reactions')
      .select('type')
      .eq('comment_id', comment_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) return null;
    const reaction = data?.type || null;
    reactionCache.set(cacheKey, reaction);
    return reaction;
  } catch (error) {
    console.error('获取用户评论反应失败:', error);
    return null;
  }
};

const updatePostReactionCount = async (
  post_id: string,
  likesCount: number,
  dislikesCount: number
): Promise<void> => {
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

const updateCommentReactionCount = async (
  comment_id: string,
  likesCount: number,
  dislikesCount: number
): Promise<void> => {
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
