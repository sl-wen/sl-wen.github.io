#!/bin/bash

# SWC依赖修复脚本
# 用于解决 Next.js SWC 依赖问题

set -e

echo "=== SWC依赖修复脚本 ==="
echo "时间: $(date)"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "当前目录: $(pwd)"
echo "Node.js版本: $(node --version)"
echo "npm版本: $(npm --version)"

# 停止服务
echo "停止服务..."
sudo systemctl stop blog || echo "服务已停止"

# 清理缓存和构建文件
echo "清理缓存..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .npm

# 删除锁文件强制重新安装
echo "删除锁文件..."
rm -f package-lock.json

# 清理npm缓存
echo "清理npm缓存..."
npm cache clean --force

# 重新安装依赖
echo "重新安装依赖..."
npm install --production=false --prefer-offline=false

# 检查SWC依赖
echo "检查SWC依赖..."
if npm list @next/swc > /dev/null 2>&1; then
    echo "✅ @next/swc 已安装"
    npm list @next/swc
else
    echo "⚠️  @next/swc 缺失，强制安装..."
    npm install @next/swc --force
fi

# 检查其他关键依赖
echo "检查关键依赖..."
CRITICAL_DEPS=(
    "next"
    "react"
    "react-dom"
    "@types/react"
    "@types/react-dom"
    "typescript"
)

for dep in "${CRITICAL_DEPS[@]}"; do
    if npm list "$dep" > /dev/null 2>&1; then
        echo "✅ $dep 已安装"
    else
        echo "❌ $dep 缺失"
        npm install "$dep" --force
    fi
done

# 验证依赖完整性
echo "验证依赖完整性..."
npm audit --audit-level=moderate || echo "⚠️  发现依赖安全问题"

# 测试构建
echo "测试构建..."
export NODE_OPTIONS="--max-old-space-size=1024"
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

if npm run build:fast; then
    echo "✅ 构建测试成功"
else
    echo "❌ 快速构建失败，尝试标准构建..."
    if npm run build; then
        echo "✅ 标准构建成功"
    else
        echo "❌ 构建失败"
        exit 1
    fi
fi

# 启动服务
echo "启动服务..."
sudo systemctl start blog

# 等待服务启动
echo "等待服务启动..."
for i in {1..30}; do
    if sudo systemctl is-active --quiet blog; then
        echo "✅ 服务启动成功 (${i}s)"
        break
    fi
    sleep 1
done

if ! sudo systemctl is-active --quiet blog; then
    echo "❌ 服务启动失败"
    sudo systemctl status blog --no-pager
    exit 1
fi

# 测试应用
echo "测试应用..."
for i in {1..10}; do
    if curl -f --connect-timeout 10 http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ 应用响应正常 (${i}s)"
        break
    fi
    sleep 2
done

if ! curl -f --connect-timeout 10 http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ 应用无响应"
    exit 1
fi

echo "=== SWC依赖修复完成 ==="
echo "时间: $(date)"
echo "服务状态: $(sudo systemctl is-active blog)"
echo "🎉 修复成功！"