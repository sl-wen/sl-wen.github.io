#!/bin/bash

# 优化的前端部署脚本
# 用于加速 GitHub Actions 部署

set -e

echo "🚀 开始优化部署..."

# 设置环境变量
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export SKIP_TYPE_CHECK=1
export NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=512"

# 清理缓存
echo "🧹 清理缓存..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

# 快速安装依赖
echo "📦 快速安装依赖..."
npm ci --prefer-offline --no-audit --no-fund --silent

# 使用超快构建
echo "🔨 开始超快构建..."
time npm run build:ultra

# 验证构建结果
if [ -d ".next" ]; then
    echo "✅ 构建成功！"
    echo "📊 构建大小: $(du -sh .next | cut -f1)"
else
    echo "❌ 构建失败！"
    exit 1
fi

echo "🎉 优化部署完成！"