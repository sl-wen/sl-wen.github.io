// 缓存名称和版本控制
const CACHE_NAME = 'blog-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/css/common.css',
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
