// 缓存名称和版本控制
// 在你的 service-worker.js 中更新缓存版本
const CACHE_VERSION = 'v1.0.4'; // 增加版本号
const CACHE_NAME = `my-site-cache-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/css/common.css',
  '/static/css/index.css',
  '/static/css/login.css',
  '/static/css/article.css',
  '/static/css/edit-post.css',
  '/static/js/common-components.js',
  '/static/js/supabase-config.js',
  '/static/js/click-effect.js',
  '/static/js/dist/stats.bundle.js',
  '/static/js/dist/auth.bundle.js',
  '/static/js/dist/supabase.bundle.js',
  '/static/img/logo.png',
  '/manifest.json'
];

// 安装时缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => 
        key !== CACHE_NAME ? caches.delete(key) : null
      ))
    ))
});

// 拦截请求进行缓存优先策略
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// 监听登出消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'LOGOUT') {
    // 清除所有缓存
    clearAllCaches();
  }
});

// 清除所有缓存
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('Service Worker: 所有缓存已清除');
  } catch (error) {
    console.error('Service Worker: 清除缓存失败', error);
  }
}
