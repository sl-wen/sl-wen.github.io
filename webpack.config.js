import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  entry: {
    // 基础服务
    supabase: './static/js/supabase-config.js',
    articleService: './static/js/articleService.js',
    stats: './static/js/stats.js',
    auth: './static/js/auth.js',
    
    // 文章相关页面
    index: './static/js/index.js',
    article: './static/js/article.js',
    edit: './static/js/edit.js',
    post: './static/js/post.js',
    categories: './static/js/categories.js',
    search: './static/js/search.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'static/js/dist'),
    publicPath: '/static/js/dist/',
    library: {
      type: 'umd' // 修改为UMD格式
    }
  },
  experiments: {
    outputModule: false // 关闭ES模块输出
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-transform-runtime'
            ]
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
      '@': path.resolve(__dirname, 'static/js/'),
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^ws$/
    })
  ],
  devServer: {
    static: {
      directory: __dirname,
      serveIndex: true,
    },
    compress: true,
    port: 8080,
    open: false,
    hot: true,
  },
};