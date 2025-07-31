'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 注册 Service Worker
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });

          console.log('Service Worker registered successfully:', registration);

          // 监听 Service Worker 更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 显示更新提示
                  if (confirm('有新版本可用，是否立即更新？')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });

          // 监听 Service Worker 消息
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CACHE_UPDATED') {
              console.log('Cache updated:', event.data.payload);
            }
          });

        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };

      // 等待页面加载完成后注册
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerSW);
      } else {
        registerSW();
      }
    }
  }, []);

  return null;
}