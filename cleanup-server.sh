#!/bin/bash

# 服务器清理脚本 - Ubuntu 24.04
# 用于清理现有安装并重新开始

set -e

echo "🧹 服务器清理脚本 (Ubuntu 24.04)"
echo "============================="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  建议使用root用户运行此脚本"
    echo "如果不是root用户，某些操作可能需要sudo权限"
fi

echo "⚠️  警告：此脚本将清理以下内容："
echo "  - 停止并删除blog服务"
echo "  - 删除应用目录 /var/www/blog"
echo "  - 删除Nginx配置"
echo "  - 清理相关日志"
echo ""

read -p "是否继续？(y/N): " -n 1 -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消清理"
    exit 0
fi

# 停止服务
echo "🛑 停止服务..."
if systemctl list-unit-files | grep -q "blog.service"; then
    if systemctl is-active --quiet blog; then
        systemctl stop blog
        echo "✅ blog服务已停止"
    fi
    
    # 禁用服务
    systemctl disable blog
    echo "✅ blog服务已禁用"
    
    # 删除服务文件
    rm -f /etc/systemd/system/blog.service
    systemctl daemon-reload
    echo "✅ blog服务文件已删除"
else
    echo "📋 blog服务不存在"
fi

# 终止可能的残留进程
echo "🔄 终止残留进程..."
pkill -f "next start" || echo "📋 没有运行中的Next.js进程"
pkill -f "npm start" || echo "📋 没有运行中的npm进程"

# 备份并删除应用目录
echo "📁 处理应用目录..."
if [ -d "/var/www/blog" ]; then
    echo "💾 备份现有目录..."
    mv /var/www/blog /var/www/blog.cleanup.$(date +%Y%m%d_%H%M%S)
    echo "✅ 目录已备份到 /var/www/blog.cleanup.$(date +%Y%m%d_%H%M%S)"
else
    echo "📋 应用目录不存在"
fi

# 删除Nginx配置
echo "🌐 清理Nginx配置..."
if [ -f "/etc/nginx/sites-available/blog" ]; then
    rm -f /etc/nginx/sites-available/blog
    echo "✅ 删除Nginx站点配置"
fi

if [ -L "/etc/nginx/sites-enabled/blog" ]; then
    rm -f /etc/nginx/sites-enabled/blog
    echo "✅ 删除Nginx启用配置"
fi

# 恢复默认Nginx配置
if [ ! -f "/etc/nginx/sites-enabled/default" ] && [ -f "/etc/nginx/sites-available/default" ]; then
    ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
    echo "✅ 恢复默认Nginx配置"
fi

# 测试并重启Nginx
echo "🧪 测试Nginx配置..."
if nginx -t; then
    systemctl restart nginx
    echo "✅ Nginx配置正常并已重启"
else
    echo "❌ Nginx配置有问题"
fi

# 清理日志
echo "🧹 清理日志..."
journalctl --vacuum-time=1d
echo "✅ 系统日志已清理"

# 清理npm缓存
echo "🧹 清理npm缓存..."
if command -v npm >/dev/null 2>&1; then
    npm cache clean --force
    echo "✅ npm缓存已清理"
fi

# 检查端口占用
echo "🔍 检查端口占用..."
if netstat -tlnp | grep -q ":3000"; then
    echo "⚠️  端口3000仍被占用："
    netstat -tlnp | grep :3000
    echo "💡 可能需要手动终止进程"
else
    echo "✅ 端口3000已释放"
fi

# 显示备份信息
echo ""
echo "📋 备份文件："
ls -la /var/www/blog.* 2>/dev/null || echo "无备份文件"

echo ""
echo "🎉 服务器清理完成！"
echo "=================="
echo "📊 当前状态:"
echo "  - blog服务: $(systemctl is-active blog 2>/dev/null || echo 'not-found')"
echo "  - nginx服务: $(systemctl is-active nginx)"
echo "  - 应用目录: $([ -d '/var/www/blog' ] && echo '存在' || echo '不存在')"
echo "  - 端口3000: $(netstat -tlnp | grep -q ':3000' && echo '占用' || echo '空闲')"
echo ""
echo "📝 下一步:"
echo "  1. 运行初始化脚本重新安装"
echo "  2. 或者手动配置环境"
echo ""
echo "🔧 初始化命令:"
echo "  curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/init-server.sh | bash" 