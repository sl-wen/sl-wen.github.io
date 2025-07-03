'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-purple-600/20 opacity-50"></div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 主要内容 */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* 品牌信息 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gradient">鱼鱼的博客</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                一个分享技术、记录生活、探索世界的个人博客。在这里，我们一起学习、成长、创造。
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <span className="sr-only">GitHub</span>
                  <i className="fab fa-github text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <span className="sr-only">微博</span>
                  <i className="fab fa-weibo text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <span className="sr-only">邮箱</span>
                  <i className="fas fa-envelope text-xl"></i>
                </a>
              </div>
            </div>

            {/* 快速链接 */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">快速链接</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                    首页
                  </Link>
                </li>
                <li>
                  <Link href="/category" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                    分类
                  </Link>
                </li>
                <li>
                  <Link href="/search" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                    搜索
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                    关于
                  </Link>
                </li>
              </ul>
            </div>

            {/* 分类标签 */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">热门标签</h4>
              <div className="flex flex-wrap gap-2">
                {['React', 'Next.js', 'TypeScript', 'JavaScript', 'CSS', 'Node.js'].map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 联系信息 */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">联系方式</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-envelope text-primary-400"></i>
                  <span className="text-gray-300 text-sm">contact@blog.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fas fa-map-marker-alt text-primary-400"></i>
                  <span className="text-gray-300 text-sm">中国</span>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* 底部版权 */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                © {currentYear} 鱼鱼的博客. 保留所有权利.
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                隐私政策
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                使用条款
              </Link>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400 text-sm">
                Powered by Next.js
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
