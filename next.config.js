/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性功能
  experimental: {
    // 启用App Router
    appDir: true,
  },

  // 图片优化配置
  images: {
    // 禁用图片优化以支持游戏资源
    unoptimized: true,
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
  webpack: (config, { isServer }) => {
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

  // 输出配置
  output: 'standalone',

  // 压缩配置
  compress: true,

  // 生产环境优化
  ...(process.env.NODE_ENV === 'production' && {
    // 启用SWC压缩
    swcMinify: true,
  }),
};

module.exports = nextConfig; 
