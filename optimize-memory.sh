#!/bin/bash

# Ubuntu 24.04 内存优化脚本
# 专门处理低内存环境下的部署问题

set -e

echo "=== 内存优化脚本 ==="
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

# 检查内存状态
check_memory_status() {
    log_info "检查内存状态..."
    
    MEM_TOTAL=$(free -m | grep Mem | awk '{print $2}')
    MEM_USED=$(free -m | grep Mem | awk '{print $3}')
    MEM_FREE=$(free -m | grep Mem | awk '{print $4}')
    MEM_AVAILABLE=$(free -m | grep Mem | awk '{print $7}')
    MEM_PERCENT=$((MEM_USED * 100 / MEM_TOTAL))
    
    echo "  总内存: ${MEM_TOTAL}MB"
    echo "  已使用: ${MEM_USED}MB (${MEM_PERCENT}%)"
    echo "  空闲: ${MEM_FREE}MB"
    echo "  可用: ${MEM_AVAILABLE}MB"
    
    # 检查交换空间
    SWAP_TOTAL=$(free -m | grep Swap | awk '{print $2}')
    SWAP_USED=$(free -m | grep Swap | awk '{print $3}')
    SWAP_FREE=$(free -m | grep Swap | awk '{print $4}')
    
    echo "  交换空间: ${SWAP_USED}MB/${SWAP_TOTAL}MB"
    
    if [ $MEM_AVAILABLE -lt 300 ]; then
        log_warn "可用内存不足300MB，需要优化"
        return 1
    elif [ $MEM_AVAILABLE -lt 500 ]; then
        log_warn "可用内存较少，建议优化"
        return 2
    else
        log_success "内存状态良好"
        return 0
    fi
}

# 创建交换空间
create_swap() {
    log_info "创建交换空间..."
    
    # 检查是否已有交换空间
    if [ "$(swapon -s | wc -l)" -gt 1 ]; then
        log_info "交换空间已存在"
        return 0
    fi
    
    # 创建1GB交换文件
    SWAPFILE="/swapfile"
    
    if [ ! -f "$SWAPFILE" ]; then
        log_info "创建交换文件..."
        sudo fallocate -l 1G $SWAPFILE
        sudo chmod 600 $SWAPFILE
        sudo mkswap $SWAPFILE
        sudo swapon $SWAPFILE
        
        # 添加到fstab
        if ! grep -q "$SWAPFILE" /etc/fstab; then
            echo "$SWAPFILE none swap sw 0 0" | sudo tee -a /etc/fstab
        fi
        
        log_success "交换空间创建成功"
    else
        sudo swapon $SWAPFILE
        log_success "交换空间已激活"
    fi
}

# 清理系统内存
clean_system_memory() {
    log_info "清理系统内存..."
    
    # 同步磁盘
    sync
    
    # 清理页面缓存
    echo 1 | sudo tee /proc/sys/vm/drop_caches > /dev/null
    
    # 清理目录项和inode缓存
    echo 2 | sudo tee /proc/sys/vm/drop_caches > /dev/null
    
    # 清理所有缓存
    echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null
    
    log_success "系统缓存已清理"
}

# 优化系统参数
optimize_system_params() {
    log_info "优化系统参数..."
    
    # 设置交换倾向（降低使用交换空间的倾向）
    echo 10 | sudo tee /proc/sys/vm/swappiness > /dev/null
    
    # 优化内存回收
    echo 50 | sudo tee /proc/sys/vm/vfs_cache_pressure > /dev/null
    
    # 设置脏页比例
    echo 5 | sudo tee /proc/sys/vm/dirty_ratio > /dev/null
    echo 2 | sudo tee /proc/sys/vm/dirty_background_ratio > /dev/null
    
    log_success "系统参数已优化"
}

# 停止不必要的服务
stop_unnecessary_services() {
    log_info "停止不必要的服务..."
    
    # 要停止的服务列表
    SERVICES_TO_STOP=(
        "snapd"
        "unattended-upgrades"
        "packagekit"
        "ubuntu-advantage"
        "motd-news"
        "esm-cache"
    )
    
    for service in "${SERVICES_TO_STOP[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            sudo systemctl stop "$service" || true
            log_info "已停止服务: $service"
        fi
    done
    
    log_success "不必要的服务已停止"
}

# 清理应用缓存
clean_application_cache() {
    log_info "清理应用缓存..."
    
    # 清理npm缓存
    npm cache clean --force 2>/dev/null || true
    
    # 清理yarn缓存（如果存在）
    yarn cache clean 2>/dev/null || true
    
    # 清理系统临时文件
    sudo rm -rf /tmp/npm-* || true
    sudo rm -rf /tmp/next-* || true
    sudo rm -rf /tmp/yarn-* || true
    
    # 清理用户缓存
    rm -rf ~/.npm/_cacache || true
    rm -rf ~/.cache/yarn || true
    
    if [ -d "/var/www/blog" ]; then
        cd /var/www/blog
        
        # 清理Next.js缓存
        rm -rf .next/cache || true
        rm -rf node_modules/.cache || true
        
        # 清理构建临时文件
        find . -name "*.tmp" -delete 2>/dev/null || true
        find . -name "*.temp" -delete 2>/dev/null || true
    fi
    
    log_success "应用缓存已清理"
}

# 检查并终止大内存进程
kill_memory_hogs() {
    log_info "检查大内存进程..."
    
    # 查找占用内存超过100MB的进程
    MEMORY_HOGS=$(ps aux --sort=-%mem | awk 'NR>1 && $4>10 {print $2, $11}' | head -5)
    
    if [ -n "$MEMORY_HOGS" ]; then
        echo "内存占用较高的进程:"
        echo "$MEMORY_HOGS"
        
        # 温和地终止一些可以安全终止的进程
        pkill -f "snap" || true
        pkill -f "packagekit" || true
        pkill -f "unattended-upgrade" || true
        
        log_info "已终止部分高内存进程"
    fi
}

# 配置Node.js内存限制
configure_nodejs_memory() {
    log_info "配置Node.js内存限制..."
    
    MEM_AVAILABLE=$(free -m | grep Mem | awk '{print $7}')
    
    if [ $MEM_AVAILABLE -lt 300 ]; then
        # 极低内存环境
        export NODE_OPTIONS="--max-old-space-size=128"
        log_warn "设置极低内存限制: 128MB"
    elif [ $MEM_AVAILABLE -lt 500 ]; then
        # 低内存环境
        export NODE_OPTIONS="--max-old-space-size=256"
        log_warn "设置低内存限制: 256MB"
    elif [ $MEM_AVAILABLE -lt 800 ]; then
        # 中等内存环境
        export NODE_OPTIONS="--max-old-space-size=512"
        log_info "设置中等内存限制: 512MB"
    else
        # 充足内存环境
        export NODE_OPTIONS="--max-old-space-size=1024"
        log_success "设置标准内存限制: 1024MB"
    fi
    
    echo "export NODE_OPTIONS=\"$NODE_OPTIONS\"" >> ~/.bashrc
}

# 创建内存监控脚本
create_memory_monitor() {
    log_info "创建内存监控脚本..."
    
    cat > /tmp/memory-monitor.sh << 'EOF'
#!/bin/bash
while true; do
    MEM_AVAILABLE=$(free -m | grep Mem | awk '{print $7}')
    if [ $MEM_AVAILABLE -lt 100 ]; then
        echo "$(date): 内存不足警告 - 可用内存: ${MEM_AVAILABLE}MB"
        # 清理缓存
        sync
        echo 1 > /proc/sys/vm/drop_caches
        
        # 终止内存占用过高的进程
        pkill -f "next start" || true
        pkill -f "npm start" || true
        exit 1
    fi
    sleep 30
done
EOF
    
    chmod +x /tmp/memory-monitor.sh
    log_success "内存监控脚本已创建"
}

# 主优化函数
main() {
    log_info "开始内存优化..."
    
    # 检查内存状态
    check_memory_status
    MEMORY_STATUS=$?
    
    if [ $MEMORY_STATUS -ne 0 ]; then
        log_warn "内存状态需要优化"
        
        # 1. 清理系统内存
        clean_system_memory
        
        # 2. 停止不必要的服务
        stop_unnecessary_services
        
        # 3. 清理应用缓存
        clean_application_cache
        
        # 4. 检查并终止大内存进程
        kill_memory_hogs
        
        # 5. 创建交换空间
        create_swap
        
        # 6. 优化系统参数
        optimize_system_params
        
        # 7. 配置Node.js内存限制
        configure_nodejs_memory
        
        # 8. 创建内存监控脚本
        create_memory_monitor
        
        # 等待系统稳定
        sleep 5
        
        # 再次检查内存状态
        echo ""
        log_info "优化后内存状态:"
        check_memory_status
        
        log_success "内存优化完成！"
    else
        log_success "内存状态良好，无需优化"
    fi
    
    echo ""
    echo "=== 优化结果 ==="
    echo "内存状态: $(free -h | grep Mem | awk '{print $3 "/" $2 " (可用:" $7 ")"}')"
    echo "交换空间: $(free -h | grep Swap | awk '{print $3 "/" $2}')"
    echo "Node.js限制: $NODE_OPTIONS"
    echo ""
    echo "💡 建议:"
    echo "1. 在部署前运行此脚本优化内存"
    echo "2. 使用 'watch free -h' 监控内存使用"
    echo "3. 如果仍然出现内存不足，考虑升级服务器配置"
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 