'use client';

import { useEffect } from 'react';

/**
 * 资源预加载（2026-10-10 性能修复版）
 * 旧版在首屏用 JS preload 4 张 PWA 图标（最大 440KB）+ prefetch 7 个页面 + Google Fonts 外链，
 * 全部和首屏 JS 抢带宽，4G 下把可交互时间拖慢 3 秒以上 —— 已全部移除。
 * 现在只做：空闲时预连接第三方头像服务（真实在用的外域）。
 */
export default function ResourcePreloader() {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = 'https://ui-avatars.com';
        document.head.appendChild(link);
      } catch {
        /* noop */
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
