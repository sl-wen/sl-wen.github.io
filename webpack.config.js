import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: {
    // 基础服务
    firebase: './static/js/firebase.js',
    articleService: './static/js/articleService.js',
    stats: './static/js/stats.js',
    
    // 文章相关页面
    article: './static/js/article.js',
    edit: './src/js/edit-bundle.js',
    post: './src/js/post-bundle.js',
    categories: './static/js/categories.js',
    search: './static/js/search.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'static/js/dist'),
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
    alias: {
      'firebase': path.resolve(__dirname, 'node_modules/firebase'),
      '@firebase': path.resolve(__dirname, 'node_modules/@firebase')
    },
    fallback: {
      "path": false,
      "fs": false
    }
  }
}; 