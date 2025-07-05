#!/bin/bash

# 快速状态检查脚本
# 用于已部署服务器的快速状态监控

echo "=== 快速状态检查 ==="
echo "📋 检查时间: $(date)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 状态函数
status_ok() { echo -e "${GREEN}✅${NC} $1"; }
status_warn() { echo -e "${YELLOW}⚠️${NC} $1"; }
status_error() { echo -e "${RED}❌${NC} $1"; }

echo ""
echo "🔧 服务状态:"

# 检查blog服务
if systemctl is-active --quiet blog 2>/dev/null; then
    status_ok "blog服务: 运行中"
else
    status_error "blog服务: 未运行"
fi

# 检查nginx服务
if systemctl is-active --quiet nginx 2>/dev/null; then
    status_ok "nginx服务: 运行中"
else
    status_warn "nginx服务: 未运行"
fi

echo ""
echo "🌐 端口状态:"

# 检查端口3000
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    status_ok "端口3000: 已监听"
else
    status_error "端口3000: 未监听"
fi

# 检查端口80
if netstat -tlnp 2>/dev/null | grep -q ":80"; then
    status_ok "端口80: 已监听"
else
    status_error "端口80: 未监听"
fi

echo ""
echo "🧪 应用响应:"

# 测试应用响应
if curl -f --connect-timeout 5 http://localhost:3000 > /dev/null 2>&1; then
    status_ok "本地3000端口: 响应正常"
else
    status_error "本地3000端口: 无响应"
fi

# 测试nginx代理
if curl -f --connect-timeout 5 http://localhost > /dev/null 2>&1; then
    status_ok "本地80端口: 响应正常"
else
    status_error "本地80端口: 无响应"
fi

echo ""
echo "📊 系统资源:"

# 内存状态
MEM_INFO=$(free -h | grep Mem)
MEM_USED=$(echo $MEM_INFO | awk '{print $3}')
MEM_TOTAL=$(echo $MEM_INFO | awk '{print $2}')
MEM_AVAILABLE=$(echo $MEM_INFO | awk '{print $7}')
echo "  内存: 已用 $MEM_USED / 总计 $MEM_TOTAL (可用: $MEM_AVAILABLE)"

# 磁盘状态
if [ -d "/var/www/blog" ]; then
    DISK_INFO=$(df -h /var/www/blog | tail -1)
    DISK_USED=$(echo $DISK_INFO | awk '{print $3}')
    DISK_TOTAL=$(echo $DISK_INFO | awk '{print $2}')
    DISK_PERCENT=$(echo $DISK_INFO | awk '{print $5}')
    echo "  磁盘: 已用 $DISK_USED / 总计 $DISK_TOTAL ($DISK_PERCENT)"
fi

# 应用版本信息
if [ -d "/var/www/blog" ]; then
    echo ""
    echo "📋 应用信息:"
    cd /var/www/blog
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo "  当前分支: $(git branch --show-current)"
        echo "  最新提交: $(git log --oneline -n 1)"
    fi
    
    if [ -d ".next" ]; then
        BUILD_SIZE=$(du -sh .next 2>/dev/null | awk '{print $1}')
        status_ok "构建文件: 存在 ($BUILD_SIZE)"
    else
        status_error "构建文件: 不存在"
    fi
fi

echo ""
echo "=== 检查完成 ==="

# 如果有问题，显示建议
ISSUES=0
if ! systemctl is-active --quiet blog 2>/dev/null; then ((ISSUES++)); fi
if ! netstat -tlnp 2>/dev/null | grep -q ":3000"; then ((ISSUES++)); fi
if ! curl -f --connect-timeout 5 http://localhost:3000 > /dev/null 2>&1; then ((ISSUES++)); fi

if [ $ISSUES -gt 0 ]; then
    echo ""
    echo "💡 发现 $ISSUES 个问题，建议操作:"
    echo "  重启服务: sudo systemctl restart blog"
    echo "  查看日志: journalctl -u blog -n 20"
    echo "  详细检查: curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/check-deployment-status.sh | bash"
fi 