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
      .order('parent_id', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取评论失败:', error);
    return [];
  }
};

export const addComment = async (
  comment: Omit<Comment, 'comment_id' | 'created_at' | 'updated_at'>
): Promise<Comment | null> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select()
      .maybeSingle();

    if (error) throw error;

    // 评论计数已由数据库触发器 trg_sync_post_comment_count 自动维护。
    // 原先这里要再发 count + update 两次请求（各约 0.5~0.9s），是「发评论慢」的主因。
    return data;
  } catch (error) {
    console.error('添加评论失败:', error);
    return null;
  }
};

export const updateComment = async (
  comment_id: string,
  content: string
): Promise<Comment | null> => {
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
    const { error } = await supabase.from('comments').delete().eq('comment_id', comment_id);

    if (error) throw error;

    // 计数由 trg_sync_post_comment_count 触发器自动回填，无需前端补刀
    return true;
  } catch (error) {
    console.error('删除评论失败:', error);
    return false;
  }
};
