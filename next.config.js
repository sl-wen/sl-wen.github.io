/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV !== 'production',
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*\/_next\/static\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/game\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'game-assets',
        expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
  ],
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在构建时跳过类型检查以加速部署
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === '1',
  },
  // 转译MUI v5包以解决兼容性问题
  transpilePackages: ['@mui/material', '@mui/styles', '@mui/lab', '@emotion/react', '@emotion/styled'],

  // 优化构建以减少内存使用
  compress: true,

  // 图片优化配置
  images: {
    // 禁用图片优化以支持游戏资源
    unoptimized: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // 静态资源处理
  async headers() {
    return [
      {
        // 为游戏资源设置缓存头
        source: '/game/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack配置
  webpack: (config, { isServer, dev }) => {
    // 处理Phaser.js的polyfill
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

    }

    // 优化游戏资源加载
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg|json)$/,
      type: 'asset/resource',
    });

    return config;
  },

};

module.exports = withPWA(nextConfig); 
