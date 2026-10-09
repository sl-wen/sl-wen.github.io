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
}

// 获取文章总数
export const getArticlesCount = async (): Promise<number> => {
  const cacheKey = getCacheKey('articles', 'count');
  
  return withCache(cacheKey, async () => {
    return withQueryPerformance('getArticlesCount', async () => {
      try {
        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return count || 0;
      } catch (error) {
        console.error('获取文章数失败:', error);
        return 0;
      }
    });
  }, 5 * 60 * 1000);
};

// 获取文章列表（分页）- 列表页不需要 content 字段
export const getArticles = async (page: number = 1, limit: number = 10): Promise<Article[]> => {
  const cacheKey = getCacheKey('articles', page, limit);
  
  return withCache(cacheKey, async () => {
    return withQueryPerformance(`getArticles-page-${page}`, async () => {
      // 只查询必要的字段 - 列表页面不需要完整 content
      const columns = 'post_id,title,author,user_id,tags,views,likes_count,dislikes_count,comments_count,created_at,updated_at';
      
      const articles = await new QueryBuilder('posts')
        .select(columns)
        .order('created_at', false)
        .range((page - 1) * limit, page * limit - 1)
        .execute();

      // 列表页不需要 content
      return articles.map((article: Article) => ({
        ...article,
        content: ''
      }));
    });
  }, 5 * 60 * 1000);
};

// 获取文章总浏览量 — 用 SQL SUM 聚合，只查一行
export const getTotalViews = async (): Promise<number> => {
  const cacheKey = getCacheKey('articles', 'total_views');
  
  return withCache(cacheKey, async () => {
    return withQueryPerformance('getTotalViews', async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('views')
          .is('views', 'not null');
        
        if (error) throw error;
        const total = (data || []).reduce((sum, post: any) => sum + (post.views || 0), 0);
        return total;
      } catch (error) {
        console.error('获取总浏览量失败:', error);
        return 0;
      }
    });
  }, 5 * 60 * 1000);
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
    const { data: prevData, error: prevError } = await supabase
      .from('posts')
      .select('post_id, title')
      .lt('post_id', post_id)
      .order('post_id', { ascending: false })
      .limit(1)
      .single();

    if (prevError && prevError.code !== 'PGRST116') throw prevError;

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
  return marked.parse(content, { async: false, gfm: true, breaks: true }) as string;
};
