#!/bin/bash

# 快速清理脚本 - Ubuntu 24.04
# 简单版本，避免编码问题

set -e

echo "Quick cleanup script for Ubuntu 24.04"
echo "======================================"

# 切换到安全目录
cd /tmp

echo "WARNING: This will clean up:"
echo "  - Stop and remove blog service"
echo "  - Remove /var/www/blog directory"
echo "  - Remove Nginx configuration"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

# 停止服务
echo "Stopping services..."
if systemctl list-unit-files | grep -q "blog.service"; then
    systemctl stop blog 2>/dev/null || true
    systemctl disable blog 2>/dev/null || true
    rm -f /etc/systemd/system/blog.service
    systemctl daemon-reload
    echo "Blog service removed"
else
    echo "Blog service not found"
fi

# 终止进程
echo "Killing processes..."
pkill -f "next start" || true
pkill -f "npm start" || true
fuser -k 3000/tcp || true

# 备份并删除目录
echo "Handling directory..."
if [ -d "/var/www/blog" ]; then
    BACKUP_DIR="/var/www/blog.cleanup.$(date +%Y%m%d_%H%M%S)"
    mv /var/www/blog "$BACKUP_DIR"
    echo "Directory backed up to $BACKUP_DIR"
else
    echo "Directory does not exist"
fi

# 清理Nginx配置
echo "Cleaning Nginx config..."
rm -f /etc/nginx/sites-available/blog
rm -f /etc/nginx/sites-enabled/blog

# 恢复默认Nginx配置
if [ ! -f "/etc/nginx/sites-enabled/default" ] && [ -f "/etc/nginx/sites-available/default" ]; then
    ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
    echo "Default Nginx config restored"
fi

# 重启Nginx
nginx -t && systemctl restart nginx
echo "Nginx restarted"

# 清理缓存
cd /tmp
npm cache clean --force 2>/dev/null || true
journalctl --vacuum-time=1d

echo ""
echo "Cleanup completed!"
echo "=================="
echo "Status:"
echo "  - blog service: $(systemctl is-active blog 2>/dev/null || echo 'not-found')"
echo "  - nginx service: $(systemctl is-active nginx)"
echo "  - app directory: $([ -d '/var/www/blog' ] && echo 'exists' || echo 'removed')"
echo "  - port 3000: $(netstat -tlnp | grep -q ':3000' && echo 'occupied' || echo 'free')"
echo ""
echo "Next steps:"
echo "  Run init script: curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/init-server.sh | bash" 