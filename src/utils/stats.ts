import { supabase } from './supabase-config';

export const getVisitCount = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('stats')
      .select('total_views')
      .single();

    if (error) throw error;
    return data?.total_views || 0;
  } catch (error) {
    console.error('获取访问量失败:', error.message || error);
    return 0;
  }
};

export const incrementVisitCount = async (): Promise<void> => {
  try {
    const currentCount = await getVisitCount();
    const { error } = await supabase
      .from('stats')
      .update({ total_views: currentCount + 1 })
      .eq('id', 1);

    if (error) throw error;
  } catch (error) {
    console.error('更新访问量失败:', error.message || error);
  }
};

export const recordPageView = async (page: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('page_views')
      .insert([
        {
          page,
          viewed_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;
  } catch (error) {
    console.error('记录页面访问失败:', error.message || error);
  }
};