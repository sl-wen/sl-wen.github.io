'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getArticles, Article } from '@/utils/articleService';
import ArticleCard from './ArticleCard';
import { Alert } from './ui';
import Loading from './Loading';

// 骨架屏组件（对齐 ArticleCard v3 布局：meta 行 + 标题 + 摘要 + 底栏）
const ArticleSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-800 p-6 animate-pulse">
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-3"></div>
    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
    <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-14"></div>
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
            console.warn('预加载失败', error);
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

  // 始终指向最新 loadArticles 的 ref（供 focus 刷新回调使用，避免闭包过期）
  const loadArticlesRef = useRef(loadArticles);
  useEffect(() => {
    loadArticlesRef.current = loadArticles;
  }, [loadArticles]);

  useEffect(() => {
    // 避免开发环境 StrictMode 造成的双调用
    let didRun = false;
    if (!didRun) {
      didRun = true;
      loadArticles(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 发布文章等数据变更后，返回首页时静默刷新第一页（App Router 会复用组件，不会自动重取）
  useEffect(() => {
    let lastHidden = document.visibilityState === 'visible';

    const refreshFirstPage = () => {
      if (document.visibilityState !== 'visible') return;
      setPreloadCache(prev => {
        const c = new Map(prev);
        c.delete(1);
        return c;
      });
      loadArticlesRef.current(1);
    };

    const onVisible = () => {
      if (!lastHidden && document.visibilityState === 'visible') {
        refreshFirstPage();
      }
      lastHidden = document.visibilityState === 'visible';
    };

    const onFocus = () => refreshFirstPage();
    window.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
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
          articles.map((article, idx) => (
            <ArticleCard key={article.post_id} article={article} index={idx} />
          ))
        )}
      </div>

      {/* 加载更多按钮 */}
      {hasMore && !initialLoad && (
        <div className="flex justify-center py-6">
          <button
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <span className="inline-block h-3.5 w-3.5 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                加载中…
              </>
            ) : (
              '加载更多'
            )}
          </button>
        </div>
      )}

      {/* 没有更多文章提示 */}
      {!loading && !loadingMore && !hasMore && articles.length > 0 && (
        <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
          已经到底了
        </div>
      )}

      {/* 暂无文章提示 */}
      {!loading && !initialLoad && articles.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-500 dark:text-gray-400 text-lg">暂无文章</div>
          <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            等待第一篇文章的诞生
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleList;
