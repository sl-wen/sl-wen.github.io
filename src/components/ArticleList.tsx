'use client';

import React, { useState, useEffect } from 'react';
import { getArticles, Article } from '../utils/articleService';
import ArticleCard from './ArticleCard';
import StatusMessage from './StatusMessage';

const ArticleList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await getArticles(page);
      if (data.length < 15) {
        setHasMore(false);
      }
      setArticles((prev) => (page === 1 ? data : [...prev, ...data]));
      setError(null);
    } catch (err) {
      setError('加载文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [page]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  if (error) {
    return <StatusMessage message={error} />;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* 文章列表 */}
      <div className="space-y-4">
        {articles.map((article) => (
          <ArticleCard key={article.post_id} article={article} />
        ))}
      </div>

      {/* 加载更多按钮 */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <button 
            className="btn-primary px-8 py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:transform hover:scale-105"
            onClick={handleLoadMore} 
            disabled={loading}
          >
            {loading ? (
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
      {!loading && !hasMore && articles.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="inline-flex items-center gap-2 text-sm">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            没有更多文章了
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
          </div>
        </div>
      )}

      {/* 暂无文章提示 */}
      {!loading && articles.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-20">📝</div>
          <div className="text-gray-500 dark:text-gray-400 text-lg">暂无文章</div>
          <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">等待第一篇精彩文章的诞生</div>
        </div>
      )}
    </div>
  );
};

export default ArticleList;
