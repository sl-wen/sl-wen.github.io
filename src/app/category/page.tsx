'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getArticles } from '@/utils/articleService';
import Loading from '@/components/Loading';
import { Alert } from '@/components/ui';
import type { Article } from '@/utils/articleService';

export default function CategoryPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getArticles(1, 1000); // 获取所有文章
        setArticles(data);
      } catch (err) {
        setError('加载文章失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const groupArticlesByTag = (articles: Article[]): Record<string, Article[]> => {
    return articles.reduce((groups: Record<string, Article[]>, article) => {
      if (!article.tags || article.tags.length === 0) {
        // 没有标签的文章可以统一归类到"未分类"
        if (!groups['未分类']) groups['未分类'] = [];
        groups['未分类'].push(article);
      } else {
        article.tags.forEach((tag) => {
          if (!groups[tag]) groups[tag] = [];
          groups[tag].push(article);
        });
      }
      return groups;
    }, {});
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  const groupedArticles = groupArticlesByTag(articles);
  const tags = Object.keys(groupedArticles).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          文章分类
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">按标签浏览所有文章</p>
      </div>

      {/* 分类列表 */}
      <div className="space-y-8">
        {tags.map((tag) => (
          <section key={tag}>
            {/* 分类标题 */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">{tag}</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {groupedArticles[tag].length}
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>

            {/* 文章列表 - 分割线行，不用嵌套卡片 */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {groupedArticles[tag]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((article) => (
                  <div key={article.post_id} className="group py-3">
                    <div className="flex items-baseline gap-4">
                      {/* 日期 */}
                      <time className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 tabular-nums w-20">
                        {new Date(article.created_at).toLocaleDateString('zh-CN')}
                      </time>

                      {/* 标题 */}
                      <Link
                        href={`/article/${article.post_id}`}
                        className="flex-1 min-w-0 text-base font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 truncate"
                      >
                        {article.title}
                      </Link>

                      {/* 浏览量 - 桌面端显示 */}
                      <span className="hidden md:inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {article.views || 0}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>

      {/* 空状态 */}
      {articles.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-500 dark:text-gray-400 text-lg">暂无文章</div>
          <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">还没有发布任何文章</div>
        </div>
      )}
    </div>
  );
}
