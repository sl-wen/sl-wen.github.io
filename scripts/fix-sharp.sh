#!/bin/bash

# Sharp 安装修复脚本
# 用于解决 Linux 环境下的 Sharp 模块加载问题

set -e

echo "🔧 Sharp 安装修复脚本开始..."

# 检查系统信息
echo "📋 系统信息:"
echo "  架构: $(uname -m)"
echo "  系统: $(uname -s)"
echo "  Node版本: $(node --version)"
echo "  NPM版本: $(npm --version)"

# 检查当前 Sharp 安装状态
echo "🔍 检查当前 Sharp 安装状态..."
if [ -d "node_modules/sharp" ]; then
    echo "  ✓ Sharp 已安装"
    echo "  Sharp 版本: $(node -e "console.log(require('sharp').versions.sharp)")"
else
    echo "  ✗ Sharp 未安装"
fi

# 清理可能的问题文件
echo "🧹 清理可能的问题文件..."
rm -rf node_modules/sharp
rm -rf node_modules/@img/sharp-linux-x64
rm -rf node_modules/.cache

# 设置环境变量
export SHARP_IGNORE_GLOBAL_LIBVIPS=1
export npm_config_platform=linux
export npm_config_arch=x64

echo "⚙️  设置环境变量:"
echo "  SHARP_IGNORE_GLOBAL_LIBVIPS=1"
echo "  npm_config_platform=linux"
echo "  npm_config_arch=x64"

# 重新安装 Sharp
echo "📦 重新安装 Sharp..."
npm install sharp --platform=linux --arch=x64

# 验证安装
echo "✅ 验证 Sharp 安装..."
if node -e "const sharp = require('sharp'); console.log('Sharp 加载成功!'); console.log('版本:', sharp.versions.sharp);"; then
    echo "  ✓ Sharp 安装成功!"
else
    echo "  ✗ Sharp 安装失败!"
    exit 1
fi

# 检查二进制文件
echo "🔍 检查 Sharp 二进制文件..."
if [ -f "node_modules/@img/sharp-linux-x64/lib/sharp-linux-x64.node" ]; then
    echo "  ✓ Linux x64 二进制文件存在"
    if command -v file >/dev/null 2>&1; then
        file node_modules/@img/sharp-linux-x64/lib/sharp-linux-x64.node
    else
        echo "    文件大小: $(ls -lh node_modules/@img/sharp-linux-x64/lib/sharp-linux-x64.node | awk '{print $5}')"
    fi
else
    echo "  ✗ Linux x64 二进制文件不存在"
fi

echo "🎉 Sharp 修复完成!"
echo ""
echo "如果问题仍然存在，请尝试以下步骤:"
echo "1. 删除 node_modules 和 package-lock.json"
echo "2. 运行: npm cache clean --force"
echo "3. 运行: npm install"
echo "4. 运行: npm run sharp:rebuild"