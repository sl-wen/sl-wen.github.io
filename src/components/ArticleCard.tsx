import React from 'react';
import Link from 'next/link';
import { Article } from '../utils/articleService';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  // 计算阅读时间（基于字数，假设每分钟200字）
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content?.length || 0;
    const readingTime = Math.ceil(words / wordsPerMinute);
    return readingTime || 1;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)}个月前`;
    return `${Math.ceil(diffDays / 365)}年前`;
  };

  // 获取文章摘要
  const getExcerpt = (content: string, maxLength: number = 120) => {
    if (!content) return '暂无内容摘要...';
    
    // 移除 Markdown 语法
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // 移除标题
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体
      .replace(/`(.*?)`/g, '$1') // 移除行内代码
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接，保留文本
      .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
      .replace(/\n+/g, ' ') // 替换换行符为空格
      .trim();
    
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  // 获取文章标签
  const getTags = () => {
    if (article.tags && Array.isArray(article.tags)) {
      return article.tags.slice(0, 3); // 最多显示3个标签
    }
    // 默认标签
    const defaultTags = ['技术', '博客'];
    return defaultTags.slice(0, 2);
  };

  // 获取文章难度等级
  const getDifficultyLevel = (content: string) => {
    const length = content?.length || 0;
    if (length < 500) return { level: '入门', color: 'green', icon: '🌱' };
    if (length < 1500) return { level: '进阶', color: 'blue', icon: '⚡' };
    return { level: '高级', color: 'purple', icon: '🚀' };
  };

  const difficulty = getDifficultyLevel(article.content);
  const tags = getTags();
  const excerpt = getExcerpt(article.content);

  return (
    <article className="card group relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/10 dark:via-transparent dark:to-purple-950/10 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
      
      {/* 顶部装饰条 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      
      {/* 卡片内容 */}
      <div className="relative z-10 p-6">
        {/* 头部 - 作者信息和元数据 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(article.author || '匿名')}&background=random&size=48`}
                alt={article.author || '匿名'}
                className="w-12 h-12 rounded-full ring-2 ring-white dark:ring-gray-700 shadow-sm group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all duration-300"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                {article.author || '匿名作者'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span>{formatDate(article.created_at)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  ⏱️ {getReadingTime(article.content)}分钟阅读
                </span>
              </div>
            </div>
          </div>
          
          {/* 难度标签 */}
          <div className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium
            ${difficulty.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : ''}
            ${difficulty.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : ''}
            ${difficulty.color === 'purple' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : ''}
            group-hover:scale-105 transition-transform duration-200
          `}>
            <span>{difficulty.icon}</span>
            <span>{difficulty.level}</span>
          </div>
        </div>

        {/* 文章标题 */}
        <div className="mb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
            <Link href={`/article/${article.post_id}`} className="hover:underline decoration-2 underline-offset-2">
              {article.title}
            </Link>
          </h2>
        </div>

        {/* 文章摘要 */}
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
            {excerpt}
          </p>
        </div>

        {/* 标签区域 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span 
                key={index} 
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-300 dark:border-blue-800 hover:shadow-sm transition-all duration-200 group-hover:scale-105"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 底部 - 统计信息和操作 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* 统计信息 */}
          <div className="flex items-center gap-5 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{article.views || 0}</span>
            </div>
            
            <div className="flex items-center gap-1.5 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{article.comments_count || 0}</span>
            </div>
            
            <div className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{article.likes_count || Math.floor(Math.random() * 20) + 1}</span>
            </div>
          </div>

          {/* 阅读更多按钮 */}
          <Link 
            href={`/article/${article.post_id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 group/btn"
          >
            <span>阅读全文</span>
            <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 悬停时的装饰动画 */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-30 transition-opacity duration-500">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>

      {/* 悬停时的光晕效果 */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-xl transition-opacity duration-500 -z-10"></div>
    </article>
  );
};

export default ArticleCard;
