import { supabase } from './supabase-config';
import { getArticleById }  from '../utils/articleService';

export const getVisitCount = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('stats')
      .select('total_views')
      .single();

    if (error) throw error;
    return data?.total_views || 0;
  } catch (error) {
    console.log('获取访问量失败:', error);
    return 0;
  }
};

export const incrementVisitCount = async (): Promise<void> => {
  try {
    const total_views = await getVisitCount();
    const { error } = await supabase
      .from('stats')
      .update({ total_views: total_views + 1 })
      .eq('status_id', 'views');

    if (error) throw error;
  } catch (error) {
    console.log('更新访问量失败:', error);
  }
};

export const recordPostsView = async (post_id: string): Promise<void> => {
  try {
    const articleData = await getArticleById(post_id);
    const { error } = await supabase
    .from('posts')
    .update({ views: articleData?.views || 0 + 1 })
    .eq('post_id', post_id);

    if (error) throw error;
  } catch (error) {
    console.log('记录文章访问失败:', error);
  }
};