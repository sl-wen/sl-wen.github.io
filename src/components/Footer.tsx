'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gray-900 text-white">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 主要内容 */}
        <div className="py-2 lg:py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* 品牌信息 */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                鱼鱼的博客
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                一个分享技术、记录生活、探索世界的个人博客。在这里，我们一起学习、成长、创造。
              </p>
            </div>

          </div>
        </div>

        {/* 底部版权 */}
        <div className="border-t border-gray-800 py-3">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm flex flex-wrap items-center">
                © {currentYear} 鱼鱼的博客. 保留所有权利.
                <a
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-gray-400 hover:text-white underline"
                >
                  赣ICP备2025067253号-1
                </a>
                <a
                  href="/rss.xml"
                  className="ml-2 text-gray-400 hover:text-white text-sm transition-colors duration-200  underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  RSS
                </a>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                隐私政策
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                使用条款
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
