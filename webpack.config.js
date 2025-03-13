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
    
    // 文章相关页面
    article: './static/js/article.js',
    edit: './static/js/edit.js',
    post: './static/js/post.js',
    categories: './static/js/categories.js',
    
    // 测试工具
    'test-firebase': './static/js/test-firebase.js'
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
    extensions: ['.js']
  }
}; 