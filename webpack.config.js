import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: {
    // PWA相关
    'service-worker': './service-worker.js',
    // 基础服务
    supabase: './static/js/supabase-config.js',
    articleService: './static/js/articleService.js',
    stats: './static/js/stats.js',
    marked: './node_modules/marked/lib/marked.esm.js',
    about: './static/js/about.js',
    auth: './static/js/auth.js',
    
    // 文章相关页面
    index: './static/js/index.js',
    article: './static/js/article.js',
    settings: './static/js/settings.js',
    edit: './static/js/edit.js',
    post: './static/js/post.js',
    login: './static/js/login.js',
    reset: './static/js/reset.js',
    categories: './static/js/categories.js',
    search: './static/js/search.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'static/js/dist'),
    publicPath: '/static/js/dist/',
    library: {
      type: 'umd',
      name: '[name]'
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-typescript'
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.jsx'],
    modules: [
      'node_modules',
      path.resolve(__dirname, 'node_modules')
    ],
    alias: {
      'marked': path.resolve(__dirname, 'node_modules/marked/lib/marked.esm.js'),
      '@supabase/supabase-js': path.resolve(__dirname, 'node_modules/@supabase/supabase-js')
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
      marked: ['marked', 'marked'],
      global: 'global',
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^ws$/
    })
  ]
};