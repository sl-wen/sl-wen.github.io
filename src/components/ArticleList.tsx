'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getArticles, Article } from '@/utils/articleService';
import ArticleCard from './ArticleCard';
import { Alert } from './ui';
import Loading from './Loading';

// 骨架屏组件
const ArticleSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
    </div>
    <div className="space-y-3 mb-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
    <div className="flex items-center space-x-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
    </div>
  </div>
);

const ArticleList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // 预加载缓存
  const [preloadCache, setPreloadCache] = useState<Map<number, Article[]>>(new Map());

  const loadArticles = useCallback(async (pageNum: number, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else if (initialLoad) {
        setLoading(true);
      }
      
      // 检查预加载缓存
      const cachedData = preloadCache.get(pageNum);
      let data: Article[];
      
      if (cachedData) {
        data = cachedData;
        // 从缓存中移除已使用的数据
        setPreloadCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(pageNum);
          return newCache;
        });
      } else {
        data = await getArticles(pageNum, 10);
      }
      
      if (data.length < 10) {
        setHasMore(false);
      }
      
      setArticles((prev) => (pageNum === 1 ? data : [...prev, ...data]));
      setError(null);
      
      // 预加载下一页数据（如果还有更多数据且未缓存）
      if (data.length === 10 && hasMore && !preloadCache.has(pageNum + 1)) {
        setTimeout(async () => {
          try {
            const nextPageData = await getArticles(pageNum + 1, 10);
            setPreloadCache(prev => {
              const newCache = new Map(prev);
              newCache.set(pageNum + 1, nextPageData);
              return newCache;
            });
          } catch (error) {
            // 静默处理预加载失败
            console.warn('预加载失败:', error);
          }
        }, 200);
      }
      
    } catch (err) {
      setError('加载文章列表失败');
      console.error('加载文章失败:', err);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
        setInitialLoad(false);
      }
    }
  }, [hasMore, preloadCache, initialLoad]);

  useEffect(() => {
    // 避免开发环境 StrictMode 造成的双调用
    let didRun = false;
    if (!didRun) {
      didRun = true;
      loadArticles(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadArticles(nextPage, true);
    }
  }, [loadingMore, hasMore, page, loadArticles]);

  // 渲染骨架屏
  const renderSkeletons = useMemo(() => 
    Array.from({ length: 6 }, (_, index) => (
      <ArticleSkeleton key={`skeleton-${index}`} />
    )), []
  );

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 文章列表 */}
      <div className="space-y-4">
        {/* 初始加载时显示骨架屏 */}
        {loading && initialLoad ? (
          renderSkeletons
        ) : (
          articles.map((article) => (
            <ArticleCard key={article.post_id} article={article} />
          ))
        )}
      </div>

      {/* 加载更多按钮 */}
      {hasMore && !initialLoad && (
        <div className="flex justify-center py-8">
          <button
            className="btn-primary px-8 py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:transform hover:scale-105"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                加载中...
              </div>
            ) : (
              '加载更多'
            )}
          </button>
        </div>
      )}

      {/* 没有更多文章提示 */}
      {!loading && !loadingMore && !hasMore && articles.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="inline-flex items-center gap-2 text-sm">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            没有更多文章了
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
          </div>
        </div>
      )}

      {/* 暂无文章提示 */}
      {!loading && !initialLoad && articles.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-20">📝</div>
          <div className="text-gray-500 dark:text-gray-400 text-lg">暂无文章</div>
          <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            等待第一篇精彩文章的诞生
          </div>
        </div>
      )}

      {/* 全局加载状态（用于初始加载失败的情况） */}
      {loading && !initialLoad && (
        <div className="flex justify-center py-8">
          <Loading size="medium" text="加载中" />
        </div>
      )}
    </div>
  );
};

export default ArticleList;
