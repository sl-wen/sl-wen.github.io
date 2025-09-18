'use client';

import { useHomeData } from '@/hooks/useHomeData';
import React, { Suspense, lazy, useEffect, useState } from 'react';

// 懒加载 ArticleList 组件 - 优化首屏加载性能
const ArticleList = lazy(() => import('@/components/ArticleList'));

// 首页组件 - 博客网站的主页面，包含欢迎区域和文章列表
export default function HomePage() {
  // 当前时间状态 - 用于显示实时时间和动态问候语
  const [currentTime, setCurrentTime] = useState(new Date());
  // 鼠标位置状态 - 用于创建动态背景跟随效果
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // 获取首页数据 - 包含访问量、文章数等统计信息
  const { visitCount, articlesCount, loading } = useHomeData();

  // 设置定时器更新当前时间 - 每秒更新一次时间显示
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    // 清理定时器防止内存泄漏
    return () => clearInterval(timer);
  }, []);

  // 鼠标移动事件处理 - 记录鼠标位置用于动态背景效果
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  // 根据当前时间生成问候语 - 提供个性化的时间问候
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return '夜深了，注意休息 🌙';
    if (hour < 12) return '早上好！新的一天开始了 🌅';
    if (hour < 18) return '下午好！继续加油 ☀️';
    return '晚上好！辛苦了一天 🌆';
  };

  return (
    <div className="min-h-screen" onMouseMove={handleMouseMove}>
      {/* 动态背景效果 - 跟随鼠标移动的径向渐变背景 */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.05), transparent 50%)`
        }}
      />

      {/* 英雄区块 - 主要的欢迎和介绍区域 */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 overflow-hidden">
        <div className="container mx-auto px-4 py-4 md:py-4 relative z-10">
          <div className="text-center">
            {/* 文本内容区域 */}
            <div className="space-y-8">
              {/* 问候语显示区域 - 显示动态时间问候和在线状态 */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{getGreeting()}</span>
              </div>

              {/* 主标题区域 - 网站名称和副标题 */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                欢迎来到 鱼鱼的博客
                <span className="block text-2xl md:text-3xl lg:text-4xl text-gray-600 dark:text-gray-400 font-normal mt-2">
                  分享知识，记录成长
                </span>
              </h1>

              {/* 网站介绍文本 */}
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
                在这里，我分享技术见解、生活感悟和创意思考。
                <br />
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  探索知识的边界，记录成长的足迹。
                </span>
              </p>

              {/* 行动按钮组 - 引导用户进行主要操作 */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {/* 开始阅读按钮 - 主要行动按钮 */}
                <a
                  href="#articles"
                  className="group btn-primary px-8 py-4 text-lg text-center relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    开始阅读
                    <svg
                      className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                  {/* 按钮悬停效果背景 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </a>

                {/* game 游戏按钮 - 特色功能 */}
                <a
                  href="/topdown"
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    🌱 game
                    <svg
                      className="w-5 h-5 transform group-hover:rotate-12 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </span>
                </a>

                {/* 了解更多按钮 - 次要行动按钮 */}
                <a
                  href="/about"
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-200"
                >
                  <span>了解更多</span>
                  <svg
                    className="w-5 h-5 ml-2 transform group-hover:rotate-45 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>

              {/* 统计信息展示区域 - 显示网站的关键数据 */}
              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-200 dark:border-gray-700">
                {/* 技术文章数量统计 */}
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {loading ? (
                      // 加载状态的骨架屏
                      <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-16 mx-auto rounded"></div>
                    ) : (
                      articlesCount
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">技术文章</div>
                </div>
                {/* 阅读量统计 */}
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {loading ? (
                      // 加载状态的骨架屏
                      <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-16 mx-auto rounded"></div>
                    ) : (
                      visitCount
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">阅读量</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 装饰性元素 - 背景装饰圆圈，增加视觉层次 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-pink-200 dark:bg-pink-800 rounded-full opacity-20 animate-float-slow"></div>
        </div>

        {/* 滚动提示 - 引导用户向下滚动查看内容 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <svg
              className="w-6 h-6 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* 最新文章区域 - 展示博客的最新文章列表 */}
      <section
        id="articles"
        className="py-4 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto">
            {/* 使用Suspense包装懒加载组件，提供加载状态 */}
            <Suspense fallback={
              // 文章列表加载时的骨架屏
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }>
              {/* 文章列表组件 - 显示最新发布的文章 */}
              <ArticleList />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
