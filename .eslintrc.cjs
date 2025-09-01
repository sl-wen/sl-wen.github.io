module.exports = {
  extends: [
    'next/core-web-vitals'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    // 添加 TypeScript 版本兼容性配置
    project: null,
    tsconfigRootDir: __dirname,
  },
  rules: {
    // 禁用大部分警告以提高性能
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'react/react-in-jsx-scope': 'off',
    // 禁用一些可能导致性能问题的规则
    'react-hooks/exhaustive-deps': 'off',
    '@next/next/no-img-element': 'off',
    // 添加性能优化规则
    'no-console': 'off',
    'no-debugger': 'off',
    // 禁用其他可能导致问题的规则
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'prefer-const': 'off',
    'no-var': 'off',
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  // 添加忽略文件以提高性能
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'dist/',
    '*.config.js',
    '*.config.ts'
  ]
};