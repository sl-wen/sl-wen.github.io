import { useState, useEffect } from 'react';
import { getVisitCount } from '@/utils/stats';
import { getArticlesCount } from '@/utils/articleService';

// 首页数据接口 - 定义首页需要展示的统计数据结构
interface HomeData {
  visitCount: number | null; // 网站访问量统计
  articlesCount: number | null; // 文章总数统计
  loading: boolean; // 数据加载状态
  error: string | null; // 错误信息
}

// 首页数据获取Hook - 用于获取首页展示所需的统计数据
export const useHomeData = (): HomeData => {
  // 初始化状态数据
  const [data, setData] = useState<HomeData>({
    visitCount: null, // 初始访问量为空
    articlesCount: null, // 初始文章数为空
    loading: true, // 初始为加载状态
    error: null // 初始无错误
  });

  // 组件挂载时获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 设置加载状态并清除之前的错误
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        // 并行获取访问量和文章数据，提升性能
        const [visitCount, articlesCount] = await Promise.all([
          getVisitCount().catch(() => 0), // 访问量获取失败时返回0
          getArticlesCount().catch(() => 0) // 文章数获取失败时返回0
        ]);

        // 更新状态为成功获取的数据
        setData({
          visitCount,
          articlesCount,
          loading: false, // 加载完成
          error: null // 无错误
        });
      } catch (error) {
        // 处理获取数据时的错误
        setData(prev => ({
          ...prev,
          loading: false, // 停止加载状态
          error: '加载数据失败' // 设置错误信息
        }));
      }
    };

    fetchData(); // 执行数据获取
  }, []); // 空依赖数组，仅在组件挂载时执行一次

  return data; // 返回当前数据状态
};