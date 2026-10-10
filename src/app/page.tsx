'use client';

import { useHomeData } from '@/hooks/useHomeData';
import React, { Suspense, lazy } from 'react';

// 懒加载 ArticleList 组件 - 优化首屏加载性能
const ArticleList = lazy(() => import('@/components/ArticleList'));

// 首页组件 - 博客网站的主页面，包含欢迎区域和文章列表
export default function HomePage() {
  // 获取首页数据 - 包含访问量、文章数等统计信息
  const { articlesCount, totalViews, loading } = useHomeData();

  // 根据当前时间生成问候语 - 服务端与客户端各渲染一次，不做秒级定时器
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了，注意休息';
    if (hour < 12) return '早上好，新的一天';
    if (hour < 18) return '下午好，继续加油';
    return '晚上好，辛苦了';
  };

  return (
    <div className="min-h-screen">
      {/* 英雄区块 - 克制编辑感：单一蓝色 accent，去掉彩虹渐变与装饰球 */}
      <section className="relative border-b border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-950 overflow-hidden">
        {/* 极淡网格纹理，唯一氛围层 */}
        <div className="absolute inset-0 bg-grid-fade pointer-events-none" />

        <div className="container mx-auto px-4 pt-14 pb-12 md:pt-20 md:pb-16 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {/* 问候语 - 纯文本小字，不做胶囊装饰 */}
              <p className="animate-rise-in text-sm tracking-wide text-gray-500 dark:text-gray-400" style={{ animationDelay: '0ms' }}>
                {getGreeting()}
              </p>

              {/* 主标题 - 同字体加粗强调，不用渐变字 */}
              <h1 className="animate-rise-in text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] text-gray-900 dark:text-gray-50" style={{ animationDelay: '60ms' }}>
                鱼鱼的博客
                <span className="block mt-3 text-xl md:text-2xl font-normal text-gray-500 dark:text-gray-400">
                  分享知识，记录成长
                </span>
              </h1>

              {/* 介绍 - 一句就够，链接色只出现这一次 */}
              <p className="animate-rise-in text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-[65ch]" style={{ animationDelay: '120ms' }}>
                在这里分享技术见解、生活感悟和创意思考，
                <span className="text-blue-600 dark:text-blue-400">探索知识的边界</span>。
              </p>

              {/* 行动按钮 - 一个主 CTA + 一个次级，同字体同色系 */}
              <div className="animate-rise-in flex flex-col sm:flex-row gap-3 pt-2" style={{ animationDelay: '180ms' }}>
                <a
                  href="#articles"
                  className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-base active:translate-y-px"
                >
                  开始阅读
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a
                  href="/about"
                  className="btn-secondary inline-flex items-center justify-center px-6 py-3 text-base active:translate-y-px"
                >
                  了解更多
                </a>
              </div>

              {/* 统计 - 一行内联数字，去掉玻璃卡 */}
              <div className="animate-rise-in flex items-center gap-6 pt-4 text-sm text-gray-500 dark:text-gray-400" style={{ animationDelay: '240ms' }}>
                <span>
                  <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums align-middle">
                    {loading ? '—' : articlesCount}
                  </span>
                  <span className="ml-1.5">篇文章</span>
                </span>
                <span className="w-px h-4 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                <span>
                  <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums align-middle">
                    {loading ? '—' : totalViews}
                  </span>
                  <span className="ml-1.5">次阅读</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 最新文章区域 */}
      <section id="articles" className="py-10 bg-gray-50 dark:bg-gray-900/60">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto">
            {/* 区域标题 - 左对齐 + 细分割线 */}
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white whitespace-nowrap">最新文章</h2>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <Suspense fallback={
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200/80 dark:border-gray-700/80">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }>
              <ArticleList />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
