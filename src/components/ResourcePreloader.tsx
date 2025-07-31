'use client';

import { useEffect } from 'react';

export default function ResourcePreloader() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 预加载关键资源
      const preloadResources = () => {
        // 预加载字体
        const fontLinks = [
          'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
        ];

        fontLinks.forEach(href => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'style';
          link.href = href;
          document.head.appendChild(link);
        });

        // 预加载关键图片
        const imageUrls = [
          '/favicon.ico',
          '/apple-touch-icon.png',
          '/pwa-192x192.png',
          '/pwa-512x512.png'
        ];

        imageUrls.forEach(src => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = src;
          document.head.appendChild(link);
        });

        // 预加载关键页面
        const pageUrls = [
          '/about',
          '/post',
          '/search'
        ];

        pageUrls.forEach(href => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = href;
          document.head.appendChild(link);
        });

        // 预连接到外部域名
        const domains = [
          'https://fonts.googleapis.com',
          'https://fonts.gstatic.com',
          'https://cdnjs.cloudflare.com',
          'https://ui-avatars.com',
          'https://pcwbtcsigmjnrigkfixm.supabase.co'
        ];

        domains.forEach(domain => {
          const link = document.createElement('link');
          link.rel = 'preconnect';
          link.href = domain;
          document.head.appendChild(link);
        });

        // DNS 预取
        const dnsDomains = [
          '//fonts.googleapis.com',
          '//fonts.gstatic.com',
          '//cdnjs.cloudflare.com',
          '//ui-avatars.com',
          '//pcwbtcsigmjnrigkfixm.supabase.co'
        ];

        dnsDomains.forEach(domain => {
          const link = document.createElement('link');
          link.rel = 'dns-prefetch';
          link.href = domain;
          document.head.appendChild(link);
        });
      };

      // 延迟预加载非关键资源
      const preloadNonCriticalResources = () => {
        // 预加载其他页面
        const otherPages = [
          '/category',
          '/article',
          '/novel',
          '/tools',
          '/settings',
          '/profile',
          '/login',
          '/privacy',
          '/terms'
        ];

        otherPages.forEach(href => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = href;
          document.head.appendChild(link);
        });
      };

      // 立即预加载关键资源
      preloadResources();

      // 延迟预加载非关键资源
      setTimeout(preloadNonCriticalResources, 2000);

      // 监听用户交互，预加载相关资源
      const handleUserInteraction = () => {
        // 用户开始交互后，预加载更多资源
        preloadNonCriticalResources();
        
        // 移除事件监听器，避免重复执行
        document.removeEventListener('mousemove', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('scroll', handleUserInteraction);
      };

      // 添加用户交互监听器
      document.addEventListener('mousemove', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
      document.addEventListener('scroll', handleUserInteraction, { once: true });
    }
  }, []);

  return null;
}