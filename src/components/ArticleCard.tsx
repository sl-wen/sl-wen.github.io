import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/utils/articleService';

const ArticleCard: React.FC<{ article: Article }> = ({ article }) => {
  return (
    <Link
      href={`/article/${article.post_id}`}
      className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
    >
      <div className="p-6">
        {/* 文章标题 */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
          {article.title}
        </h2>

        {/* 文章摘要 */}
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {article.content?.substring(0, 150)}...
        </p>

        {/* 文章元信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(article.author || '匿名')}&background=random&size=48`}
                alt={article.author || '匿名'}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full ring-2 ring-white dark:ring-gray-700 shadow-sm group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all duration-300"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                loading="lazy"
                sizes="48px"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {article.author || '匿名'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(article.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* 标签 */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex gap-1">
              {article.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {tag}
                </span>
              ))}
              {article.tags.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  +{article.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
