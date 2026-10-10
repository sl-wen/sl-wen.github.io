'use client';
import React from 'react';
import Link from 'next/link';
import { Article } from '@/utils/articleService';

interface ArticleCardProps {
  article: Article;
  index?: number;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, index = 0 }) => {
  // 计算阅读时间（基于字数，假设每分钟200字）
  const getReadingTime = () => {
    const wordsPerMinute = 200;
    const words = article.content?.length || 0;
    if (words === 0) {
      return Math.max(1, Math.ceil((article.title?.length || 0) / wordsPerMinute));
    }
    return Math.ceil(words / wordsPerMinute);
  };

  // 格式化日期
  const formatDate = () => {
    return new Date(article.created_at).toLocaleDateString('zh-CN');
  };

  // 提取纯文本摘要（从 markdown 剥离语法，80 字）
  const getExcerpt = () => {
    const raw = article.content || '';
    if (!raw) return '';
    const plain = raw
      .replace(/```[\s\S]*?```/g, '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#*_`>~\-\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plain.length > 80 ? plain.slice(0, 80) + '…' : plain;
  };

  // 入场动画延迟（列表序号错开，每条 +60ms，上限 8 条后不再增加）
  const riseDelay = { animationDelay: `${Math.min(index, 8) * 60}ms` };

  // 获取文章标签（无标签时留空，不造假数据）
  const getTags = () => {
    if (article.tags && Array.isArray(article.tags)) {
      return article.tags.slice(0, 5);
    }
    return [];
  };

  const tags = getTags();

  return (
    <article className="card group relative overflow-hidden animate-rise-in" style={riseDelay}>
      <div className="relative z-10 p-6">
        {/* 头部 - 日期和阅读时长（去掉作者头像假绿点和假难度标签） */}
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
          <time>{formatDate()}</time>
          <span className="w-px h-3 bg-gray-200 dark:bg-gray-600" aria-hidden="true"></span>
          <span>{getReadingTime()} 分钟阅读</span>
        </div>

        {/* 文章标题 */}
        <div className="mb-2">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            <Link
              href={`/article/${article.post_id}`}
              className="hover:underline decoration-2 underline-offset-2"
            >
              {article.title}
            </Link>
          </h2>
        </div>

        {/* 摘要预览（列表页 content 有数据时展示） */}
        {getExcerpt() && (
          <p className="mb-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
            {getExcerpt()}
          </p>
        )}

        {/* 标签区域 - 素色描边胶囊，去渐变去缩放 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 底部 - 统计信息在左，文字链接在右（降级为链接，与主 CTA 拉开层级） */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          {/* 统计信息 */}
          <div className="flex items-center gap-5 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="tabular-nums">{article.views || 0}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              <span className="tabular-nums">{article.comments_count || 0}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span className="tabular-nums">{article.likes_count || 0}</span>
            </div>
          </div>

          {/* 阅读链接 - 文字 + 箭头，hover 才亮起 */}
          <Link
            href={`/article/${article.post_id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-2.5 transition-all duration-200"
          >
            <span>阅读全文</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
