// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 测量函数执行时间
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}-error`, duration);
      throw error;
    }
  }

  // 记录指标
  private recordMetric(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(duration);
    
    // 只保留最近50次记录
    if (values.length > 50) {
      values.shift();
    }

    // 在开发环境下输出性能日志
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
  }

  // 获取性能统计
  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max, count: values.length };
  }

  // 获取所有指标
  getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, any> = {};
    for (const [name] of this.metrics) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  // 清理指标
  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// React 组件性能监控 Hook
export const usePerformanceMonitor = (componentName: string) => {
  if (typeof window === 'undefined') return;
  
  const startTime = performance.now();

  // 注意：这里不能直接使用 React.useEffect，需要在实际组件中使用
  return {
    startTime,
    recordRenderTime: () => {
      const renderTime = performance.now() - startTime;
      performanceMonitor['recordMetric'](`component-${componentName}`, renderTime);
    }
  };
};

// 页面加载性能监控
export const measurePageLoad = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      'page-dns': navigation.domainLookupEnd - navigation.domainLookupStart,
      'page-tcp': navigation.connectEnd - navigation.connectStart,
      'page-request': navigation.responseStart - navigation.requestStart,
      'page-response': navigation.responseEnd - navigation.responseStart,
      'page-dom': navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      'page-load': navigation.loadEventEnd - navigation.loadEventStart,
      'page-total': navigation.loadEventEnd - navigation.navigationStart
    };

    Object.entries(metrics).forEach(([name, duration]) => {
      if (duration > 0) {
        performanceMonitor.recordMetric(name, duration);
      }
    });

    // 在开发环境下输出页面加载性能
    if (process.env.NODE_ENV === 'development') {
      console.log('[Page Performance]', metrics);
    }
  });
};

// 自动启动页面性能监控
if (typeof window !== 'undefined') {
  measurePageLoad();
}