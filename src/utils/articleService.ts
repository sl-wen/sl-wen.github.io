import { supabase } from './supabase-config';
import { marked } from 'marked';

export interface Article {
  post_id: string;
  title: string;
  content: string;
  author: string;
  user_id: string;
  tags: string[];
  views: number;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

// 重试函数，用于处理网络不稳定的情况
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.warn(`操作失败，第 ${attempt} 次尝试:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // 指数退避延迟
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error('重试次数已用完');
};

// 检查内容大小并警告
const checkContentSize = (content: string): void => {
  const sizeInBytes = new Blob([content]).size;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > 5) {
    console.warn(`内容较大 (${sizeInMB.toFixed(2)}MB)，可能需要更长时间处理`);
  }
};

export const getArticles = async (page: number = 1, limit: number = 10): Promise<Article[]> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return [];
  }
};

export const getArticlesCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true }); // 只返回count
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('获取文章数量失败:', error);
    return 0;
  }
};

export const getArticleById = async (post_id: string): Promise<Article | null> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('post_id', post_id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    return null;
  }
};

export const getAdjacentArticles = async (
  post_id: string
): Promise<{ prev: Article | null; next: Article | null }> => {
  try {
    // 获取上一篇文章（创建时间较早的最近一篇）
    const { data: prevData, error: prevError } = await supabase
      .from('posts')
      .select('post_id, title')
      .lt('post_id', post_id)
      .order('post_id', { ascending: false })
      .limit(1)
      .single();

    if (prevError && prevError.code !== 'PGRST116') throw prevError;

    // 获取下一篇文章（创建时间较晚的最近一篇）
    const { data: nextData, error: nextError } = await supabase
      .from('posts')
      .select('post_id, title')
      .gt('post_id', post_id)
      .order('post_id', { ascending: true })
      .limit(1)
      .single();

    if (nextError && nextError.code !== 'PGRST116') throw nextError;

    return {
      prev: prevData as Article | null,
      next: nextData as Article | null
    };
  } catch (error) {
    console.error('获取相邻文章失败:', error);
    return { prev: null, next: null };
  }
};

export const createArticle = async (
  article: Omit<
    Article,
    | 'post_id'
    | 'created_at'
    | 'updated_at'
    | 'views'
    | 'likes_count'
    | 'dislikes_count'
    | 'comments_count'
  >
): Promise<Article | null> => {
  try {
    // 检查内容大小
    checkContentSize(article.content);
    
    // 使用重试机制创建文章
    const result = await retryOperation(async () => {
      const { data, error } = await supabase
        .from('posts')
        .insert([article])
        .select()
        .single();

      if (error) throw error;
      return data;
    }, 3, 2000); // 最多重试3次，初始延迟2秒

    return result;
  } catch (error: any) {
    console.error('创建文章失败:', error);
    
    // 提供更详细的错误信息
    if (error.message?.includes('timeout')) {
      throw new Error('网络超时，请检查网络连接后重试');
    } else if (error.message?.includes('payload')) {
      throw new Error('文章内容过长，请适当缩减内容长度');
    } else if (error.code === '23505') {
      throw new Error('文章标题已存在，请使用不同的标题');
    }
    
    throw new Error(error.message || '发布文章时出现未知错误');
  }
};

export const updateArticle = async (
  post_id: string,
  updates: Partial<Article>
): Promise<Article | null> => {
  try {
    // 如果更新包含内容，检查内容大小
    if (updates.content) {
      checkContentSize(updates.content);
    }
    
    // 使用重试机制更新文章
    const result = await retryOperation(async () => {
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('post_id', post_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }, 3, 2000); // 最多重试3次，初始延迟2秒

    return result;
  } catch (error: any) {
    console.error('更新文章失败:', error);
    
    // 提供更详细的错误信息
    if (error.message?.includes('timeout')) {
      throw new Error('网络超时，请检查网络连接后重试');
    } else if (error.message?.includes('payload')) {
      throw new Error('文章内容过长，请适当缩减内容长度');
    } else if (error.code === 'PGRST116') {
      throw new Error('文章不存在或已被删除');
    }
    
    throw new Error(error.message || '更新文章时出现未知错误');
  }
};

export const deleteArticle = async (post_id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('posts').delete().eq('post_id', post_id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('删除文章失败:', error);
    return false;
  }
};

export const renderMarkdown = (content: string): string => {
  return marked.parse(content, { async: false }) as string;
};
