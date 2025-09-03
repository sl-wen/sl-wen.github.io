'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 开发环境不注册 SW，避免 404 噪音
      const isProd = process.env.NODE_ENV === 'production';
      if (!isProd) {
        (async () => {
          try {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          } catch { }
        })();
        return;
      }

      const ensureSW = async () => {
        try {
          // 先探测 sw.js 是否存在（避免 404 抛错）
          const res = await fetch('/sw.js', { method: 'HEAD', cache: 'no-store' });
          if (res.ok) {
            const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            console.log('Service Worker registered successfully:', registration);
          } else {
            // 文件不存在：确保注销已有的 ServiceWorker
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
            console.log('Service Worker not found; unregistered any existing registrations.');
          }
        } catch (error) {
          // 异常也尝试清理已有注册，避免反复报错
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
          console.error('Service Worker check/register failed, cleaned registrations:', error);
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureSW);
      } else {
        ensureSW();
      }
    }
  }, []);

  return null;
}