'use client';

import { useEffect } from 'react';

// 定义 LayoutShiftEntry 类型
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

// 定义 FirstInputEntry 类型
interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  target?: EventTarget;
}

export default function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 监控页面加载性能
      const monitorPerformance = () => {
        // 等待页面完全加载
        window.addEventListener('load', () => {
          setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            const paint = performance.getEntriesByType('paint');
            
            if (navigation) {
              const metrics = {
                // DNS 解析时间
                dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
                // TCP 连接时间
                tcpTime: navigation.connectEnd - navigation.connectStart,
                // 请求响应时间
                responseTime: navigation.responseEnd - navigation.requestStart,
                // DOM 解析时间
                domParseTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                // 页面完全加载时间
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                // 总加载时间
                totalTime: navigation.loadEventEnd - navigation.fetchStart,
                // 首次内容绘制 (FCP)
                fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
                // 最大内容绘制 (LCP) - 需要额外监控
                lcp: 0
              };

              // 记录性能指标
              console.log('Performance Metrics:', metrics);

              // 性能警告和建议
              const warnings = [];
              
              if (metrics.dnsTime > 100) {
                warnings.push('DNS 解析时间过长，建议使用 DNS 预取');
              }
              
              if (metrics.tcpTime > 200) {
                warnings.push('TCP 连接时间过长，建议优化服务器响应');
              }
              
              if (metrics.responseTime > 1000) {
                warnings.push('服务器响应时间过长，建议优化后端性能');
              }
              
              if (metrics.fcp > 2000) {
                warnings.push('首次内容绘制时间过长，建议优化关键资源加载');
              }
              
              if (metrics.totalTime > 3000) {
                warnings.push('页面总加载时间过长，建议启用 Service Worker 缓存');
              }

              if (warnings.length > 0) {
                console.warn('Performance Warnings:', warnings);
              }

              // 发送性能数据到分析服务（可选）
              if (process.env.NODE_ENV === 'production') {
                // 这里可以发送性能数据到分析服务
                // sendAnalytics('performance', metrics);
              }
            }
          }, 1000);
        });

        // 监控 LCP (Largest Contentful Paint)
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
            
            if (lastEntry.startTime > 2500) {
              console.warn('LCP 时间过长，建议优化最大内容元素');
            }
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        }

        // 监控 CLS (Cumulative Layout Shift)
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
              const layoutShiftEntry = entry as LayoutShiftEntry;
              if (!layoutShiftEntry.hadRecentInput) {
                clsValue += layoutShiftEntry.value;
              }
            }
            console.log('CLS:', clsValue);
            
            if (clsValue > 0.1) {
              console.warn('CLS 值过高，建议优化布局稳定性');
            }
          });
          
          observer.observe({ entryTypes: ['layout-shift'] });
        }

        // 监控 FID (First Input Delay)
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const firstInputEntry = entry as FirstInputEntry;
              console.log('FID:', firstInputEntry.processingStart - firstInputEntry.startTime);
              
              if (firstInputEntry.processingStart - firstInputEntry.startTime > 100) {
                console.warn('FID 时间过长，建议优化 JavaScript 执行');
              }
            }
          });
          
          observer.observe({ entryTypes: ['first-input'] });
        }
      };

      // 检查 Service Worker 状态
      const checkServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            console.log('Service Worker is active:', registration.active?.state);
          } else {
            console.warn('Service Worker not registered');
          }
        }
      };

      // 检查缓存状态
      const checkCache = async () => {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          console.log('Available caches:', cacheNames);
        }
      };

      // 执行监控
      monitorPerformance();
      checkServiceWorker();
      checkCache();
    }
  }, []);

  return null;
}