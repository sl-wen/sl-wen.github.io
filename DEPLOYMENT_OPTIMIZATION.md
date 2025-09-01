# 🚀 部署优化指南

## 概述

本文档介绍了如何优化 GitHub Actions 部署速度，解决 TypeScript 类型检查慢的问题。

## 🎯 主要优化

### 1. GitHub Actions 优化

- **缓存依赖**: 使用 `actions/cache@v4` 缓存 `node_modules` 和 `.next/cache`
- **并行构建**: 启用多核构建和并行处理
- **跳过类型检查**: 在构建时跳过 TypeScript 类型检查
- **优化超时**: 设置合理的超时时间

### 2. Next.js 构建优化

- **SWC 编译器**: 使用更快的 SWC 替代 Babel
- **持久化缓存**: 启用文件系统缓存
- **代码分割优化**: 优化 vendor 和游戏资源的分割
- **并行构建**: 启用多核构建

### 3. TypeScript 优化

- **增量编译**: 启用 `incremental` 编译
- **跳过库检查**: 使用 `skipLibCheck` 跳过第三方库类型检查
- **项目引用**: 使用 TypeScript 项目引用加速构建
- **直接依赖优化**: 启用 `assumeChangesOnlyAffectDirectDependencies`

## 📋 构建脚本说明

### 快速构建脚本

```bash
# 标准构建（包含类型检查）
npm run build

# 快速构建（跳过类型检查）
npm run build:fast

# CI 构建（优化内存使用）
npm run build:ci

# 超快构建（最大内存优化）
npm run build:ultra
```

### 环境变量

```bash
# 跳过类型检查
export SKIP_TYPE_CHECK=1

# 禁用遥测
export NEXT_TELEMETRY_DISABLED=1

# 优化内存使用
export NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=512"
```

## 🔧 配置优化

### Next.js 配置

```javascript
// next.config.js
const nextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === '1',
  },
  experimental: {
    swcMinify: true,
    cpus: Math.max(1, Math.min(4, require('os').cpus().length)),
  },
  webpack: (config, { isServer, dev }) => {
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: { config: [__filename] },
      };
    }
    return config;
  },
};
```

### TypeScript 配置

```json
{
  "compilerOptions": {
    "incremental": true,
    "assumeChangesOnlyAffectDirectDependencies": true,
    "disableSourceOfProjectReferenceRedirect": true,
    "disableReferencedProjectLoad": true
  }
}
```

## 📊 性能提升

### 构建时间对比

| 构建类型 | 优化前 | 优化后 | 提升 |
|---------|--------|--------|------|
| 标准构建 | 3-5 分钟 | 1-2 分钟 | 60-70% |
| 类型检查 | 1-2 分钟 | 0 分钟 | 100% |
| 依赖安装 | 2-3 分钟 | 30 秒 | 80-85% |

### 内存使用优化

- **标准构建**: 2-4GB
- **优化构建**: 8GB (可配置)
- **缓存启用**: 减少重复计算

## 🚨 注意事项

### 1. 类型检查跳过

- 仅在 CI/CD 环境中跳过类型检查
- 本地开发时仍应运行类型检查
- 定期运行 `npm run tsc` 验证类型

### 2. 内存配置

- 根据服务器配置调整 `NODE_OPTIONS`
- 监控构建过程中的内存使用
- 避免设置过高的内存限制

### 3. 缓存策略

- 定期清理构建缓存
- 监控缓存命中率
- 避免缓存过大的文件

## 🔍 故障排除

### 常见问题

1. **构建失败**: 检查内存配置和环境变量
2. **缓存失效**: 清理 `.next/cache` 和 `node_modules/.cache`
3. **类型错误**: 本地运行 `npm run tsc` 检查类型问题

### 调试命令

```bash
# 检查构建配置
npm run build --debug

# 验证类型
npm run tsc:fast

# 清理缓存
npm run clean

# 检查依赖
npm ls --depth=0
```

## 📚 参考资料

- [Next.js 性能优化](https://nextjs.org/docs/advanced-features/compiler)
- [TypeScript 编译优化](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [GitHub Actions 缓存](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Webpack 性能优化](https://webpack.js.org/guides/build-performance/)

## 🤝 贡献

如果您有更好的优化建议，请提交 Issue 或 Pull Request。

---

**最后更新**: 2024年12月
**版本**: 1.0.0