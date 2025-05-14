import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: {
    // 基础服务
    firebase: './static/js/firebase-config.js',
    articleService: './static/js/articleService.js',
    stats: './static/js/stats.js',
    
    // 文章相关页面
    firebaseindex: './static/js/firebaseindex.js',
    article: './static/js/article.js',
    edit: './static/js/edit.js',
    post: './static/js/post.js',
    categories: './static/js/categories.js',
    search: './static/js/search.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, '/static/js/dist/'),
    publicPath: '/static/js/dist/'
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
      'firebase': path.resolve(__dirname, 'node_modules/firebase'),
      'firebase/app': path.resolve(__dirname, 'node_modules/firebase/app'),
      'firebase/firestore': path.resolve(__dirname, 'node_modules/firebase/firestore'),
      'firebase/auth': path.resolve(__dirname, 'node_modules/firebase/auth')
    },
    fallback: {
      "path": false,
      "fs": false
    }
  },
  optimization: {
    minimize: true,
    moduleIds: 'deterministic',
    chunkIds: 'deterministic'
  }
}; 