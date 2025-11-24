import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: {
    // 基础服务
    supabase: './static/js/supabase-config.js',
    articleService: './static/js/articleService.js',
    auth: './static/js/auth.js',
    stats: './static/js/stats.js',

    // 文章相关页面
    index: './static/js/index.js',
    article: './static/js/article.js',
    edit: './static/js/edit.js',
    post: './static/js/post.js',
    about: './static/js/about.js',
    categories: './static/js/categories.js',
    search: './static/js/search.js',
    comments: './static/js/comments.js',
    login: './static/js/login.js',
    reaction: './static/js/reaction.js',
    reset: './static/js/reset.js',
    profile: './static/js/profile.js',
    task: './static/js/task.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'static/js/dist'),
    publicPath: '/static/js/dist/'
  },
  devServer: {
    static: [
      {
        directory: __dirname,             // 服务根目录（包含 index.html, pages/*）
      },
      {
        directory: path.join(__dirname, 'static'), // 服务 static 目录下所有资源
      }
    ],
    open: true,
    port: 8080,
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [
      'node_modules',
      path.resolve(__dirname, 'node_modules')
    ],
    alias: {
      'marked': path.resolve(__dirname, 'node_modules/marked/lib/marked.esm.js'),
      '@supabase/supabase-js': path.resolve(__dirname, 'node_modules/@supabase/supabase-js'),
      'firebase/app': path.resolve(__dirname, 'node_modules/firebase/app'),
      'firebase/firestore': path.resolve(__dirname, 'node_modules/firebase/firestore'),
      'firebase/auth': path.resolve(__dirname, 'node_modules/firebase/auth')
    },
    fallback: {
      "path": false,
      "fs": false,
      "process": false
    }
  },
  optimization: {
    minimize: true,
    moduleIds: 'deterministic',
    chunkIds: 'deterministic'
  },
  plugins: [
    new webpack.ProvidePlugin({
      global: 'global',
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  ],
  performance: {
    hints: 'warning', // 或 false 完全关闭
    maxAssetSize: 1024 * 1024, // 允许到 1MB，无警告（默认244KiB）
    maxEntrypointSize: 1024 * 1024
  }
};