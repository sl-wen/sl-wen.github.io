import { fileURLToPath } from 'url';
import path from 'path';
import webpack from 'webpack';
import ESLintPlugin from 'eslint-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  entry: './src/index.tsx',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      ...BASE_ALIASES,
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@styles': path.resolve(__dirname, 'src/styles')
    }
  },
  /**
 * ESLint configuration for TypeScript files
 * @type {import('esl =nt-webpack-plugin').Options}
 */
const eslintOptions = {
  extensions: ['ts', 'tsx'],
  overrideConfigFile: path.resolve(__dirname, '.eslintrc.cjs'),
  failOnError: process.env.NODE_ENV === 'production'
};

// Shared path aliases
const BASE_ALIASES = {
  '@': path.resolve(__dirname, 'src'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@pages': path.resolve(__dirname, 'src/pages')
},

  plugins: [
    new ESLintPlugin(eslintOptions),
    new HtmlWebpackPlugin({
      template: './index.html'
    }),
    new webpack.ProvidePlugin({
      React: 'react'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'static',
          to: 'static'
        }
      ]
    }),
    new ESLintPlugin({
      extensions: ['js', 'jsx', 'ts', 'tsx'],
      exclude: 'node_modules'
    })
  ],
  devServer: {
    historyApiFallback: true,
    hot: true,
    port: 3000
  },
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\]node_modules[\\]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};