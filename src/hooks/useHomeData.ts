import { useState, useEffect } from 'react';
import { getVisitCount } from '@/utils/stats';
import { getArticlesCount } from '@/utils/articleService';

interface HomeData {
  visitCount: number | null;
  articlesCount: number | null;
  loading: boolean;
  error: string | null;
}

export const useHomeData = (): HomeData => {
  const [data, setData] = useState<HomeData>({
    visitCount: null,
    articlesCount: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        // 并行获取数据，而不是串行
        const [visitCount, articlesCount] = await Promise.all([
          getVisitCount().catch(() => 0), // 失败时返回默认值
          getArticlesCount().catch(() => 0)
        ]);

        setData({
          visitCount,
          articlesCount,
          loading: false,
          error: null
        });
      } catch (error) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: '加载数据失败'
        }));
      }
    };

    fetchData();
  }, []);

  return data;
};