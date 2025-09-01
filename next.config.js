/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint:{
    ignoreDuringBuilds: true,
  },
  // 转译MUI v5包以解决兼容性问题
  transpilePackages: ['@mui/material', '@mui/styles', '@mui/lab', '@emotion/react', '@emotion/styled'],
  // 启用实验性功能（谨慎使用）
  experimental: {
    // 禁用可能导致构建缓慢的功能
    optimizeCss: false,
    optimizePackageImports: ['lodash'],
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
  webpack: (config, { isServer, dev }) => {
    // 处理Phaser.js的polyfill
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // 优化代码分割（仅在生产环境）
      if (!dev) {
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
          },
        };
      }
    }

    // 优化游戏资源加载
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg|json)$/,
      type: 'asset/resource',
    });

    // 忽略Material-UI v4与React 19的兼容性警告
    config.ignoreWarnings = [
      /Attempted import error: 'findDOMNode' is not exported from 'react-dom'/,
    ];

    return config;
  },

  // 输出配置
  output: 'standalone',

  // 压缩配置
  compress: true,

  // 生产环境优化
  // SWC压缩在 Next.js 13+ 中默认启用
};

module.exports = nextConfig; 
