#!/bin/bash

# 修复目录问题脚本 - Ubuntu 24.04
# 用于解决 getcwd() failed 错误

set -e

echo "🔧 修复目录问题脚本"
echo "=================="

# 切换到安全目录
echo "📁 切换到安全目录..."
cd /tmp

# 检查当前目录
echo "📋 当前目录: $(pwd)"

# 终止可能有问题的进程
echo "🛑 终止可能有问题的进程..."
pkill -f "next start" || echo "📋 没有Next.js进程"
pkill -f "npm start" || echo "📋 没有npm进程"

# 检查/var/www/blog目录状态
echo "🔍 检查应用目录状态..."
if [ -d "/var/www/blog" ]; then
    echo "✅ /var/www/blog 目录存在"
    cd /var/www/blog
    echo "📋 目录内容:"
    ls -la
    
    # 检查是否为Git仓库
    if [ -d ".git" ]; then
        echo "✅ 是Git仓库"
        git status || echo "⚠️  Git状态检查失败"
    else
        echo "❌ 不是Git仓库"
    fi
else
    echo "❌ /var/www/blog 目录不存在"
    echo "📋 创建目录..."
    mkdir -p /var/www/blog
    cd /var/www/blog
    echo "✅ 目录已创建"
fi

# 检查Node.js和npm
echo "🔍 检查Node.js环境..."
cd /tmp
node --version || echo "❌ Node.js有问题"
npm --version || echo "❌ npm有问题"

# 检查服务状态
echo "🔍 检查服务状态..."
if systemctl list-unit-files | grep -q "blog.service"; then
    echo "📋 blog服务状态: $(systemctl is-active blog 2>/dev/null || echo 'inactive')"
    if systemctl is-active --quiet blog; then
        echo "🛑 停止blog服务..."
        systemctl stop blog
    fi
else
    echo "📋 blog服务不存在"
fi

# 检查端口占用
echo "🔍 检查端口占用..."
if netstat -tlnp | grep -q ":3000"; then
    echo "⚠️  端口3000被占用:"
    netstat -tlnp | grep :3000
    echo "🛑 终止占用端口的进程..."
    fuser -k 3000/tcp || echo "📋 没有进程占用端口3000"
else
    echo "✅ 端口3000空闲"
fi

# 建议下一步操作
echo ""
echo "🎯 建议的修复步骤:"
echo "=================="
echo "1. 如果目录存在但有问题，运行清理脚本:"
echo "   curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/cleanup-server.sh | bash"
echo ""
echo "2. 然后重新运行初始化脚本:"
echo "   curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/init-server.sh | bash"
echo ""
echo "3. 或者手动修复:"
echo "   cd /var/www/blog"
echo "   git pull origin react"
echo "   npm ci"
echo "   npm run build"
echo "   systemctl restart blog"
echo ""
echo "📋 当前状态:"
echo "  - 当前目录: $(pwd)"
echo "  - /var/www/blog: $([ -d '/var/www/blog' ] && echo '存在' || echo '不存在')"
echo "  - blog服务: $(systemctl is-active blog 2>/dev/null || echo 'not-found')"
echo "  - 端口3000: $(netstat -tlnp | grep -q ':3000' && echo '占用' || echo '空闲')" 