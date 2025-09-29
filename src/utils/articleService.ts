import { supabase } from './supabase-config';
import { marked } from 'marked';
import { withCache, getCacheKey } from './cache';
import { QueryBuilder, withQueryPerformance } from './queryOptimizer';

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
  // 列表视图优化可选字段
  excerpt?: string;
  content_length?: number;
}

export const getArticles = async (page: number = 1, limit: number = 10): Promise<Article[]> => {
  const cacheKey = getCacheKey('articles', page, limit);
  
  return withCache(cacheKey, async () => {
    return withQueryPerformance(`getArticles-page-${page}`, async () => {
      // 使用轻量视图，避免传输完整 content
      const columns = 'post_id,title,author,user_id,tags,views,likes_count,dislikes_count,comments_count,created_at,updated_at,excerpt,content_length';
      const articles = await new QueryBuilder('posts_list_view')
        .select(columns)
        .order('created_at', false)
        .range((page - 1) * limit, page * limit - 1)
        .execute();

      // 将 excerpt 映射为 content，保持下游类型不变
      return (articles as any[]).map((row: any) => ({
        ...row,
        content: row.excerpt ?? ''
      })) as Article[];
    });
  }, 5 * 60 * 1000); // 增加缓存时间到5分钟
};

export const getArticlesCount = async (): Promise<number> => {
  const cacheKey = getCacheKey('articles', 'count');
  
  return withCache(cacheKey, async () => {
    return withQueryPerformance('getArticlesCount', async () => {
      return (await new QueryBuilder('posts').count('planned')) || 0;
    });
  }, 5 * 60 * 1000); // 5分钟缓存
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
    // 先获取当前文章的创建时间
    const { data: current, error: currentError } = await supabase
      .from('posts')
      .select('created_at')
      .eq('post_id', post_id)
      .single();
    if (currentError) throw currentError;

    const createdAt = current?.created_at as string;

    // 获取上一篇文章（创建时间较早的最近一篇）
    const { data: prevData, error: prevError } = await supabase
      .from('posts')
      .select('post_id, title')
      .lt('created_at', createdAt)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prevError && prevError.code !== 'PGRST116') throw prevError;

    // 获取下一篇文章（创建时间较晚的最近一篇）
    const { data: nextData, error: nextError } = await supabase
      .from('posts')
      .select('post_id, title')
      .gt('created_at', createdAt)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

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
    const { data, error } = await supabase.from('posts').insert([article]).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('创建文章失败:', error);
    return null;
  }
};

export const updateArticle = async (
  post_id: string,
  updates: Partial<Article>
): Promise<Article | null> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('post_id', post_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('更新文章失败:', error);
    return null;
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
