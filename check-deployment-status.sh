#!/bin/bash

# Ubuntu 24.04 部署状态检查脚本
# 快速检查部署状态和系统健康

set -e

echo "=== 部署状态检查 ==="
echo "📋 检查时间: $(date)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 检查系统资源
check_system_resources() {
    echo "📊 系统资源状态:"
    
    # 内存状态
    MEM_INFO=$(free -h | grep Mem)
    MEM_TOTAL=$(echo $MEM_INFO | awk '{print $2}')
    MEM_USED=$(echo $MEM_INFO | awk '{print $3}')
    MEM_FREE=$(echo $MEM_INFO | awk '{print $4}')
    MEM_AVAILABLE=$(echo $MEM_INFO | awk '{print $7}')
    
    echo "  内存: 已用 $MEM_USED / 总计 $MEM_TOTAL (可用: $MEM_AVAILABLE)"
    
    # 交换空间
    SWAP_INFO=$(free -h | grep Swap)
    SWAP_TOTAL=$(echo $SWAP_INFO | awk '{print $2}')
    SWAP_USED=$(echo $SWAP_INFO | awk '{print $3}')
    echo "  交换: 已用 $SWAP_USED / 总计 $SWAP_TOTAL"
    
    # 磁盘使用
    if [ -d "/var/www/blog" ]; then
        DISK_INFO=$(df -h /var/www/blog | tail -1)
        DISK_USED=$(echo $DISK_INFO | awk '{print $3}')
        DISK_TOTAL=$(echo $DISK_INFO | awk '{print $2}')
        DISK_PERCENT=$(echo $DISK_INFO | awk '{print $5}')
        echo "  磁盘: 已用 $DISK_USED / 总计 $DISK_TOTAL ($DISK_PERCENT)"
    fi
    
    # CPU负载
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}')
    echo "  CPU负载:$LOAD_AVG"
}

# 检查服务状态
check_services() {
    echo ""
    echo "🔧 服务状态:"
    
    # 检查blog服务
    if systemctl list-unit-files | grep -q "blog.service"; then
        BLOG_STATUS=$(systemctl is-active blog 2>/dev/null || echo "inactive")
        if [ "$BLOG_STATUS" = "active" ]; then
            log_success "blog服务: $BLOG_STATUS"
        else
            log_error "blog服务: $BLOG_STATUS"
        fi
    else
        log_warn "blog服务: 未安装"
    fi
    
    # 检查nginx服务
    if systemctl list-unit-files | grep -q "nginx.service"; then
        NGINX_STATUS=$(systemctl is-active nginx 2>/dev/null || echo "inactive")
        if [ "$NGINX_STATUS" = "active" ]; then
            log_success "nginx服务: $NGINX_STATUS"
        else
            log_error "nginx服务: $NGINX_STATUS"
        fi
    else
        log_warn "nginx服务: 未安装"
    fi
}

# 检查网络端口
check_ports() {
    echo ""
    echo "🌐 网络端口状态:"
    
    # 检查3000端口
    if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
        PORT_3000=$(netstat -tlnp 2>/dev/null | grep ":3000" | awk '{print $7}' | head -1)
        log_success "端口3000: 已监听 ($PORT_3000)"
    else
        log_error "端口3000: 未监听"
    fi
    
    # 检查80端口
    if netstat -tlnp 2>/dev/null | grep -q ":80"; then
        PORT_80=$(netstat -tlnp 2>/dev/null | grep ":80" | awk '{print $7}' | head -1)
        log_success "端口80: 已监听 ($PORT_80)"
    else
        log_error "端口80: 未监听"
    fi
    
    # 检查22端口
    if netstat -tlnp 2>/dev/null | grep -q ":22"; then
        log_success "端口22: SSH已监听"
    else
        log_warn "端口22: SSH未监听"
    fi
}

# 检查应用响应
check_app_response() {
    echo ""
    echo "🧪 应用响应测试:"
    
    # 测试本地3000端口
    if curl -f --connect-timeout 5 --max-time 10 http://localhost:3000 > /dev/null 2>&1; then
        log_success "本地3000端口: 响应正常"
    else
        log_error "本地3000端口: 无响应"
    fi
    
    # 测试本地80端口
    if curl -f --connect-timeout 5 --max-time 10 http://localhost > /dev/null 2>&1; then
        log_success "本地80端口: 响应正常"
    else
        log_error "本地80端口: 无响应"
    fi
    
    # 获取外部IP并测试
    EXTERNAL_IP=$(curl -s --connect-timeout 5 ifconfig.me || echo "unknown")
    if [ "$EXTERNAL_IP" != "unknown" ]; then
        echo "  外部IP: $EXTERNAL_IP"
        if curl -f --connect-timeout 5 --max-time 10 http://$EXTERNAL_IP > /dev/null 2>&1; then
            log_success "外部访问: 响应正常"
        else
            log_warn "外部访问: 可能需要配置防火墙/安全组"
        fi
    fi
}

# 检查应用目录
check_app_directory() {
    echo ""
    echo "📁 应用目录状态:"
    
    if [ ! -d "/var/www/blog" ]; then
        log_error "应用目录: /var/www/blog 不存在"
        return 1
    fi
    
    cd /var/www/blog
    
    # 检查Git状态
    if git rev-parse --git-dir > /dev/null 2>&1; then
        CURRENT_BRANCH=$(git branch --show-current)
        CURRENT_COMMIT=$(git log --oneline -n 1)
        log_success "Git仓库: $CURRENT_BRANCH"
        echo "  最新提交: $CURRENT_COMMIT"
    else
        log_error "Git仓库: 无效"
    fi
    
    # 检查关键文件
    if [ -f "package.json" ]; then
        log_success "package.json: 存在"
    else
        log_error "package.json: 不存在"
    fi
    
    if [ -d "node_modules" ]; then
        MODULES_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
        log_success "node_modules: 存在 ($MODULES_COUNT 个包)"
    else
        log_error "node_modules: 不存在"
    fi
    
    if [ -d ".next" ]; then
        BUILD_SIZE=$(du -sh .next 2>/dev/null | awk '{print $1}')
        log_success "构建文件: 存在 ($BUILD_SIZE)"
    else
        log_error "构建文件: 不存在"
    fi
}

# 检查最近日志
check_recent_logs() {
    echo ""
    echo "📋 最近日志 (最新5条):"
    
    if systemctl list-unit-files | grep -q "blog.service"; then
        echo "--- Blog服务日志 ---"
        journalctl -u blog --no-pager -n 5 --since "10 minutes ago" 2>/dev/null | tail -5 || echo "无最近日志"
    fi
    
    if systemctl list-unit-files | grep -q "nginx.service"; then
        echo "--- Nginx错误日志 ---"
        if [ -f "/var/log/nginx/error.log" ]; then
            tail -3 /var/log/nginx/error.log 2>/dev/null || echo "无错误日志"
        else
            echo "日志文件不存在"
        fi
    fi
}

# 生成建议
generate_recommendations() {
    echo ""
    echo "💡 建议和下一步:"
    
    # 检查内存状态
    MEM_AVAILABLE_MB=$(free -m | grep Mem | awk '{print $7}')
    if [ $MEM_AVAILABLE_MB -lt 300 ]; then
        echo "  ⚠️  内存不足，建议运行内存优化脚本"
        echo "     curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/optimize-memory.sh | sudo bash"
    fi
    
    # 检查服务状态
    if ! systemctl is-active --quiet blog 2>/dev/null; then
        echo "  🔧 blog服务未运行，尝试启动:"
        echo "     sudo systemctl start blog"
    fi
    
    if ! systemctl is-active --quiet nginx 2>/dev/null; then
        echo "  🔧 nginx服务未运行，尝试启动:"
        echo "     sudo systemctl start nginx"
    fi
    
    # 检查端口
    if ! netstat -tlnp 2>/dev/null | grep -q ":3000"; then
        echo "  🌐 应用端口3000未监听，检查应用是否正常启动"
    fi
    
    # 检查构建文件
    if [ -d "/var/www/blog" ] && [ ! -d "/var/www/blog/.next" ]; then
        echo "  📦 构建文件不存在，需要重新构建:"
        echo "     cd /var/www/blog && npm run build"
    fi
    
    echo ""
    echo "🔄 要持续监控，运行: watch -n 5 'curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/check-deployment-status.sh | bash'"
}

# 主函数
main() {
    check_system_resources
    check_services
    check_ports
    check_app_response
    check_app_directory
    check_recent_logs
    generate_recommendations
    
    echo ""
    echo "=== 检查完成 ==="
    echo "📋 检查时间: $(date)"
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 