module.exports = {
  extends: [
    'next/core-web-vitals'
  ],
  // 移除复杂的 TypeScript 配置，使用 Next.js 默认配置
  rules: {
    // 禁用大部分警告以提高性能
    'no-unused-vars': 'off',
    'no-explicit-any': 'off',
    'react/react-in-jsx-scope': 'off',
    // 禁用一些可能导致性能问题的规则
    'react-hooks/exhaustive-deps': 'off',
    '@next/next/no-img-element': 'off',
    // 添加性能优化规则
    'no-console': 'off',
    'no-debugger': 'off',
    // 禁用其他可能导致问题的规则
    'no-empty-function': 'off',
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
    '*.config.ts',
    'scripts/',
    'public/'
  ]
};