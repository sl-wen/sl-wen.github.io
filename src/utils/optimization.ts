// 优化配置和工具
export const OPTIMIZATION_CONFIG = {
  // 缓存配置
  CACHE_DURATIONS: {
    ARTICLES: 2 * 60 * 1000, // 2分钟
    ARTICLES_COUNT: 5 * 60 * 1000, // 5分钟
    VISIT_COUNT: 1 * 60 * 1000, // 1分钟
    USER_PROFILE: 10 * 60 * 1000, // 10分钟
  },
  
  // 预加载配置
  PRELOAD: {
    ENABLED: true,
    DELAY: 100, // 预加载延迟（毫秒）
    MAX_RETRIES: 3,
  },
  
  // 性能监控阈值
  PERFORMANCE_THRESHOLDS: {
    QUERY_WARNING: 100, // 查询耗时警告阈值（毫秒）
    RENDER_WARNING: 50, // 渲染耗时警告阈值（毫秒）
  }
};

// 性能优化建议
export const getPerformanceRecommendations = () => {
  const recommendations = [];
  
  // 检查是否支持 Service Worker
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    recommendations.push('启用 Service Worker 缓存');
  }
  
  // 检查是否支持 Web Workers
  if (typeof window !== 'undefined' && 'Worker' in window) {
    recommendations.push('使用 Web Workers 处理重计算');
  }
  
  // 检查网络连接
  if (typeof window !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection && connection.effectiveType === 'slow-2g') {
      recommendations.push('当前网络较慢，建议减少数据请求');
    }
  }
  
  return recommendations;
};

// 自动性能优化
export const autoOptimize = () => {
  if (typeof window === 'undefined') return;
  
  // 预连接重要域名
  const domains = [
    'https://pcwbtcsigmjnrigkfixm.supabase.co',
    'https://fonts.googleapis.com',
    'https://cdnjs.cloudflare.com'
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  });
  
  // 预加载关键 CSS
  const criticalCSS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
  ];
  
  criticalCSS.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  });
};

// 在浏览器中自动运行优化
if (typeof window !== 'undefined') {
  // 页面加载完成后运行优化
  if (document.readyState === 'complete') {
    autoOptimize();
  } else {
    window.addEventListener('load', autoOptimize);
  }
}