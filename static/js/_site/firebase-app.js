// 简化版的Firebase App模块
export function initializeApp(config) {
  console.log('Firebase App 初始化', config);
  
  // 返回一个简单的app对象
  return {
    name: config.projectId || 'default',
    options: config,
    automaticDataCollectionEnabled: true
  };
} 