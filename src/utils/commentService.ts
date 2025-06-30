import { supabase } from './supabase-config';

export interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_approved: boolean | null;
  likes_count: number | null;
  dislikes_count: number | null;
  created_at: string;
  updated_at: string;
}

export const getComments = async (post_id: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post_id)
      .eq('is_approved', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取评论失败:', error);
    return [];
  }
};

export const addComment = async (comment: Omit<Comment, 'comment_id' | 'created_at' | 'updated_at'>): Promise<Comment | null> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select()
      .maybeSingle();

    if (error) throw error;

    // 更新文章的评论计数
    await updateCommentCount(comment.post_id);

    return data;
  } catch (error) {
    console.error('添加评论失败:', error);
    return null;
  }
};

export const updateComment = async (comment_id: string, content: string): Promise<Comment | null> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('comment_id', comment_id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('更新评论失败:', error);
    return null;
  }
};

export const deleteComment = async (comment_id: string, post_id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('comment_id', comment_id);

    if (error) throw error;

    // 更新文章的评论计数
    await updateCommentCount(post_id);

    return true;
  } catch (error) {
    console.error('删除评论失败:', error);
    return false;
  }
};

const updateCommentCount = async (post_id: string): Promise<void> => {
  try {
    // 获取评论数
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id);

    // 更新文章的评论数
    await supabase
      .from('posts')
      .update({ comments_count: count || 0 })
      .eq('post_id', post_id)
      .maybeSingle();
  } catch (error) {
    console.error('更新评论计数失败:', error);
  }
};