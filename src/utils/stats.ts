import { supabase } from './supabase-config';
import { getArticleById } from '../utils/articleService';
import { withCache, getCacheKey } from './cache';

export const getVisitCount = async (): Promise<number> => {
  const cacheKey = getCacheKey('stats', 'visits');
  
  return withCache(cacheKey, async () => {
    const { data, error } = await supabase
      .from('stats')
      .select('total_views')
      .eq('stats_id', 'site')
      .single();

    if (error) throw error;
    return data?.total_views || 0;
  }, 1 * 60 * 1000); // 1分钟缓存，访问量更新频率较高
};

export const incrementVisitCount = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_site_views');

    if (error) throw error;
  } catch (error) {
    console.log('更新访问量失败:', error);
  }
};

export const recordPostsView = async (post_id: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_post_views', { p_post_id: post_id });

    if (error) throw error;
  } catch (error) {
    console.log('记录文章访问失败:', error);
  }
};
