'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 品牌信息 - 单列布局，实拍四列网格只填一列的问题 */}
        <div className="py-8">
          <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
            鱼鱼的博客
          </h3>
          <p className="mt-2 max-w-[65ch] text-sm leading-relaxed">
            分享技术、记录生活、探索世界的个人博客。在这里，一起学习、成长、创造。
          </p>
        </div>

        {/* 底部版权 */}
        <div className="border-t border-gray-100 dark:border-gray-800 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 gap-2">
            <p className="text-xs flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-500 dark:text-gray-500">
              <span>© {currentYear} 鱼鱼的博客</span>
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-800 dark:hover:text-gray-300 transition-colors duration-200"
              >
                赣ICP备2025067253号-1
              </a>
              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-800 dark:hover:text-gray-300 transition-colors duration-200"
              >
                RSS
              </a>
            </p>
            <div className="flex items-center space-x-5">
              <Link
                href="/privacy"
                className="text-xs hover:text-gray-800 dark:hover:text-gray-300 transition-colors duration-200"
              >
                隐私政策
              </Link>
              <Link
                href="/terms"
                className="text-xs hover:text-gray-800 dark:hover:text-gray-300 transition-colors duration-200"
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
