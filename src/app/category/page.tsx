'use client';

import React, { useState, useEffect } from 'react';
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
        // 没有标签的文章可以统一归类到 "未分类"
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
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          文章分类
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          按标签浏览所有文章
        </p>
        <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4"></div>
      </div>

      {/* 分类列表 */}
      <div className="space-y-8">
        {tags.map((tag) => (
          <div key={tag} className="card">
            {/* 分类标题 */}
            <div className="flex items-center gap-3 pb-4 p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white text-sm font-bold">
                {tag.charAt(0)}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tag}
              </h3>
              <div className="ml-auto bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {groupedArticles[tag].length} 篇文章
                </span>
              </div>
            </div>

            {/* 文章列表 */}
            <div className="space-y-1">
              {groupedArticles[tag]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((article) => (
                  <div
                    key={article.post_id}
                    className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
                  >
                    {/* 文章主要信息 */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* 日期 */}
                      <div className="flex-shrink-0">
                        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                          {new Date(article.created_at).toLocaleDateString('zh-CN')}
                        </div>
                      </div>

                      {/* 文章标题 */}
                      <div className="flex-grow">
                        <Link
                          href={`/article/${article.post_id}`}
                          className="interactive text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 block py-1 relative z-10"
                        >
                          {article.title}
                        </Link>
                      </div>

                      {/* 文章统计 */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <span>💬</span>
                          <span>{article.comments_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>👁️</span>
                          <span>{article.views || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* 文章元信息 */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      {/* 标签 */}
                      <div className="flex flex-wrap gap-2">
                        {article.tags && article.tags.map((tagLabel, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {tagLabel}
                          </span>
                        ))}
                      </div>

                      {/* 作者 */}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        by {article.author || '匿名'}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {articles.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-20">📂</div>
          <div className="text-gray-500 dark:text-gray-400 text-lg">暂无文章</div>
          <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">还没有发布任何文章</div>
        </div>
      )}
    </div>
  );
} 