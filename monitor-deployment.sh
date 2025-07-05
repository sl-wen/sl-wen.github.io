#!/bin/bash

# Ubuntu 24.04 部署监控脚本
# 用于监控部署过程中的系统状态

set -e

echo "=== 部署监控脚本 ==="
echo "📋 开始时间: $(date)"

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
    log_info "检查系统资源..."
    
    # 内存使用情况
    MEM_TOTAL=$(free -m | grep Mem | awk '{print $2}')
    MEM_USED=$(free -m | grep Mem | awk '{print $3}')
    MEM_PERCENT=$((MEM_USED * 100 / MEM_TOTAL))
    
    echo "  内存使用: ${MEM_USED}MB/${MEM_TOTAL}MB (${MEM_PERCENT}%)"
    
    if [ $MEM_PERCENT -gt 80 ]; then
        log_warn "内存使用率过高: ${MEM_PERCENT}%"
    fi
    
    # 磁盘使用情况
    DISK_USAGE=$(df /var/www/blog 2>/dev/null | tail -1 | awk '{print $5}' | sed 's/%//' || echo "0")
    echo "  磁盘使用: ${DISK_USAGE}%"
    
    if [ $DISK_USAGE -gt 80 ]; then
        log_warn "磁盘使用率过高: ${DISK_USAGE}%"
    fi
    
    # CPU负载
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    echo "  CPU负载: ${LOAD_AVG}"
    
    # 检查可用端口
    if netstat -tlnp | grep -q ":3000"; then
        log_success "端口3000已被占用"
        netstat -tlnp | grep ":3000"
    else
        log_info "端口3000空闲"
    fi
    
    if netstat -tlnp | grep -q ":80"; then
        log_success "端口80已被占用"
        netstat -tlnp | grep ":80"
    else
        log_info "端口80空闲"
    fi
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    # 检查blog服务
    if systemctl list-unit-files | grep -q "blog.service"; then
        BLOG_STATUS=$(systemctl is-active blog)
        if [ "$BLOG_STATUS" = "active" ]; then
            log_success "blog服务: $BLOG_STATUS"
        else
            log_error "blog服务: $BLOG_STATUS"
            echo "  服务详情:"
            systemctl status blog --no-pager -l | head -10
        fi
    else
        log_warn "blog服务未安装"
    fi
    
    # 检查nginx服务
    if systemctl list-unit-files | grep -q "nginx.service"; then
        NGINX_STATUS=$(systemctl is-active nginx)
        if [ "$NGINX_STATUS" = "active" ]; then
            log_success "nginx服务: $NGINX_STATUS"
        else
            log_error "nginx服务: $NGINX_STATUS"
        fi
    else
        log_warn "nginx服务未安装"
    fi
    
    # 检查进程
    log_info "检查相关进程..."
    if pgrep -f "next start" > /dev/null; then
        log_success "Next.js进程运行中"
        pgrep -f "next start" | head -5
    else
        log_warn "未找到Next.js进程"
    fi
    
    if pgrep -f "npm start" > /dev/null; then
        log_success "npm进程运行中"
        pgrep -f "npm start" | head -5
    else
        log_warn "未找到npm进程"
    fi
}

# 检查应用目录
check_application() {
    log_info "检查应用目录..."
    
    if [ ! -d "/var/www/blog" ]; then
        log_error "应用目录不存在: /var/www/blog"
        return 1
    fi
    
    cd /var/www/blog
    
    # 检查关键文件
    if [ -f "package.json" ]; then
        log_success "package.json 存在"
    else
        log_error "package.json 不存在"
    fi
    
    if [ -f "next.config.js" ]; then
        log_success "next.config.js 存在"
    else
        log_warn "next.config.js 不存在"
    fi
    
    if [ -d ".next" ]; then
        log_success ".next 构建目录存在"
        BUILD_SIZE=$(du -sh .next | awk '{print $1}')
        echo "  构建大小: $BUILD_SIZE"
    else
        log_error ".next 构建目录不存在"
    fi
    
    if [ -d "node_modules" ]; then
        log_success "node_modules 存在"
        MODULES_SIZE=$(du -sh node_modules | awk '{print $1}')
        echo "  模块大小: $MODULES_SIZE"
    else
        log_error "node_modules 不存在"
    fi
    
    # 检查Git状态
    if git rev-parse --git-dir > /dev/null 2>&1; then
        log_success "Git仓库正常"
        echo "  当前分支: $(git branch --show-current)"
        echo "  最新提交: $(git log --oneline -n 1)"
        
        # 检查是否有未提交的更改
        if ! git diff --quiet || ! git diff --cached --quiet; then
            log_warn "有未提交的更改"
        fi
    else
        log_error "不是Git仓库"
    fi
}

# 测试网络连接
test_network() {
    log_info "测试网络连接..."
    
    # 测试本地连接
    if curl -f --connect-timeout 5 http://localhost:3000 > /dev/null 2>&1; then
        log_success "本地端口3000响应正常"
    else
        log_error "本地端口3000无响应"
    fi
    
    if curl -f --connect-timeout 5 http://localhost > /dev/null 2>&1; then
        log_success "本地端口80响应正常"
    else
        log_error "本地端口80无响应"
    fi
    
    # 测试外部连接
    if curl -f --connect-timeout 5 https://www.google.com > /dev/null 2>&1; then
        log_success "外部网络连接正常"
    else
        log_error "外部网络连接失败"
    fi
}

# 检查日志
check_logs() {
    log_info "检查最近日志..."
    
    if systemctl list-unit-files | grep -q "blog.service"; then
        echo "=== Blog服务日志 (最近10条) ==="
        journalctl -u blog --no-pager -n 10 | tail -10
        echo ""
    fi
    
    if systemctl list-unit-files | grep -q "nginx.service"; then
        echo "=== Nginx错误日志 (最近5条) ==="
        if [ -f "/var/log/nginx/error.log" ]; then
            tail -5 /var/log/nginx/error.log
        else
            echo "Nginx错误日志不存在"
        fi
        echo ""
    fi
    
    # 检查系统日志中的相关错误
    echo "=== 系统日志中的错误 (最近5条) ==="
    journalctl --no-pager -p err -n 5 | tail -5
}

# 生成诊断报告
generate_report() {
    log_info "生成诊断报告..."
    
    REPORT_FILE="/tmp/deployment-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "=== 部署诊断报告 ==="
        echo "生成时间: $(date)"
        echo "系统信息: $(lsb_release -d | cut -f2)"
        echo ""
        
        echo "=== 系统资源 ==="
        free -h
        echo ""
        df -h
        echo ""
        
        echo "=== 服务状态 ==="
        systemctl status blog --no-pager -l || echo "blog服务不存在"
        echo ""
        systemctl status nginx --no-pager -l || echo "nginx服务不存在"
        echo ""
        
        echo "=== 网络端口 ==="
        netstat -tlnp | grep -E ":(80|3000|22)"
        echo ""
        
        echo "=== 进程信息 ==="
        ps aux | grep -E "(next|npm|node)" | grep -v grep
        echo ""
        
        echo "=== 最近日志 ==="
        journalctl -u blog --no-pager -n 20 || echo "无blog服务日志"
        
    } > "$REPORT_FILE"
    
    log_success "诊断报告已生成: $REPORT_FILE"
    echo "可以使用以下命令查看报告: cat $REPORT_FILE"
}

# 主函数
main() {
    echo "=== 开始部署监控 ==="
    
    check_system_resources
    echo ""
    
    check_services
    echo ""
    
    check_application
    echo ""
    
    test_network
    echo ""
    
    check_logs
    echo ""
    
    generate_report
    
    echo "=== 监控完成 ==="
    echo "📋 结束时间: $(date)"
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 