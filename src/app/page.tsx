'use client';

import React, { useEffect, useState } from 'react';
import ArticleList from '@/components/ArticleList';
import { getVisitCount } from '@/utils/stats';
import { getArticlesCount } from '@/utils/articleService';

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [ArticlesCount, setArticlesCount] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    getVisitCount().then(setVisitCount);
    getArticlesCount().then(setArticlesCount);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return '夜深了，注意休息 🌙';
    if (hour < 12) return '早上好！新的一天开始了 🌅';
    if (hour < 18) return '下午好！继续加油 ☀️';
    return '晚上好！辛苦了一天 🌆';
  };

  return (
    <div className="min-h-screen" onMouseMove={handleMouseMove}>
      {/* 动态背景效果 */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.05), transparent 50%)`
        }}
      />

      {/* 英雄区块 */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 文本内容 */}
            <div className="space-y-8">
              {/* 问候语 */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{getGreeting()}</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                欢迎来到
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">
                  鱼鱼的博客
                </span>
                <span className="block text-2xl md:text-3xl lg:text-4xl text-gray-600 dark:text-gray-400 font-normal mt-2">
                  分享知识，记录成长
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
                在这里，我分享技术见解、生活感悟和创意思考。
                <br />
                <span className="text-blue-600 dark:text-blue-400 font-medium">探索知识的边界，记录成长的足迹。</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#articles"
                  className="group btn-primary px-8 py-4 text-lg text-center relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    开始阅读
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </a>
                <a
                  href="/about"
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-200"
                >
                  <span>了解更多</span>
                  <svg className="w-5 h-5 ml-2 transform group-hover:rotate-45 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{ArticlesCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">技术文章</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{visitCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">阅读量</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 装饰性元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-pink-200 dark:bg-pink-800 rounded-full opacity-20 animate-float-slow"></div>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>
      
      {/* 最新文章区域 */}
      <section id="articles" className="py-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4 border border-blue-200 dark:border-blue-800">
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              最新更新
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              最新
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">文章</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              探索最新的想法和见解，与我一起在知识的海洋中遨游
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mx-auto mt-8 animate-pulse"></div>
          </div>

          <div className="max-w-5xl mx-auto">
            <ArticleList />
          </div>
        </div>
      </section>
    </div>
  );
}
