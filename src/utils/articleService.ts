import { supabase } from './supabase-config';
import { marked } from 'marked';

export interface Article {
  id: number;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  category: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
}

export const getArticles = async (page: number = 1, limit: number = 10): Promise<Article[]> => {
  try {
    const { data, error } = await supabase
      .from('articles')
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

export const getArticleById = async (id: number): Promise<Article | null> => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('获取文章详情失败:', error);
    return null;
  }
};

export const createArticle = async (article: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'comments_count'>): Promise<Article | null> => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .insert([article])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('创建文章失败:', error);
    return null;
  }
};

export const updateArticle = async (id: number, updates: Partial<Article>): Promise<Article | null> => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('更新文章失败:', error);
    return null;
  }
};

export const deleteArticle = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('删除文章失败:', error);
    return false;
  }
};

export const renderMarkdown = async (content: string): Promise<string> => {
  return await marked.parse(content);
};