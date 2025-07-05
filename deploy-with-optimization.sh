#!/bin/bash

# Ubuntu 24.04 一键优化部署脚本
# 集成内存优化、部署和监控的完整解决方案

set -e

echo "=== 一键优化部署脚本 ==="
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

# 错误处理
handle_error() {
    log_error "部署过程中发生错误，正在清理..."
    
    # 尝试恢复备份
    if [ -d "/var/www/blog/.next.backup" ]; then
        cd /var/www/blog
        rm -rf .next
        mv .next.backup .next
        sudo systemctl start blog || true
        log_info "已尝试恢复备份版本"
    fi
    
    exit 1
}

# 设置错误处理
trap handle_error ERR

# 检查权限
check_permissions() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用sudo运行此脚本"
        exit 1
    fi
}

# 步骤1：系统检查
step1_system_check() {
    log_info "步骤1: 系统环境检查..."
    
    # 检查操作系统
    if ! lsb_release -d | grep -q "Ubuntu 24.04"; then
        log_warn "当前系统不是Ubuntu 24.04，可能存在兼容性问题"
    fi
    
    # 检查必要工具
    for tool in curl git node npm; do
        if ! command -v $tool &> /dev/null; then
            log_error "$tool 未安装，请先安装必要工具"
            exit 1
        fi
    done
    
    # 检查应用目录
    if [ ! -d "/var/www/blog" ]; then
        log_error "应用目录不存在，请先运行初始化脚本"
        echo "运行: curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/init-server.sh | bash"
        exit 1
    fi
    
    log_success "系统环境检查通过"
}

# 步骤2：内存优化
step2_memory_optimization() {
    log_info "步骤2: 内存优化..."
    
    # 下载并运行内存优化脚本
    if curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/optimize-memory.sh | bash; then
        log_success "内存优化完成"
    else
        log_warn "内存优化失败，继续部署..."
    fi
}

# 步骤3：预部署检查
step3_pre_deployment_check() {
    log_info "步骤3: 预部署检查..."
    
    cd /var/www/blog
    
    # 检查Git状态
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "不是有效的Git仓库"
        exit 1
    fi
    
    # 显示当前状态
    echo "  当前分支: $(git branch --show-current)"
    echo "  当前提交: $(git log --oneline -n 1)"
    
    # 检查内存状态
    MEM_AVAILABLE=$(free -m | grep Mem | awk '{print $7}')
    echo "  可用内存: ${MEM_AVAILABLE}MB"
    
    if [ $MEM_AVAILABLE -lt 200 ]; then
        log_error "可用内存不足200MB，无法继续部署"
        exit 1
    fi
    
    log_success "预部署检查通过"
}

# 步骤4：停止服务
step4_stop_services() {
    log_info "步骤4: 停止现有服务..."
    
    # 停止blog服务
    if systemctl is-active --quiet blog 2>/dev/null; then
        systemctl stop blog
        log_success "blog服务已停止"
    fi
    
    # 温和地终止进程
    pkill -TERM -f "next start" 2>/dev/null || true
    pkill -TERM -f "npm start" 2>/dev/null || true
    sleep 5
    pkill -KILL -f "next start" 2>/dev/null || true
    pkill -KILL -f "npm start" 2>/dev/null || true
    
    log_success "服务停止完成"
}

# 步骤5：代码更新
step5_code_update() {
    log_info "步骤5: 更新代码..."
    
    cd /var/www/blog
    
    # 备份当前版本
    if [ -d ".next" ]; then
        rm -rf .next.backup
        cp -r .next .next.backup
        log_info "已备份当前版本"
    fi
    
    # 暂存未提交的更改
    if ! git diff --quiet || ! git diff --cached --quiet; then
        git stash push -u -m "Auto stash before deployment $(date)"
        log_info "已暂存未提交的更改"
    fi
    
    # 拉取最新代码
    git fetch origin
    BEFORE_COMMIT=$(git rev-parse HEAD)
    git reset --hard origin/react
    git clean -fd
    AFTER_COMMIT=$(git rev-parse HEAD)
    
    # 显示更新信息
    if [ "$BEFORE_COMMIT" != "$AFTER_COMMIT" ]; then
        log_success "代码已更新"
        git log --oneline $BEFORE_COMMIT..$AFTER_COMMIT | head -3
    else
        log_info "代码无变化"
    fi
}

# 步骤6：依赖安装
step6_install_dependencies() {
    log_info "步骤6: 安装依赖..."
    
    cd /var/www/blog
    
    # 清理旧的依赖
    rm -rf node_modules/.cache
    
    # 设置内存限制
    export NODE_OPTIONS="--max-old-space-size=256"
    
    # 安装依赖
    if [ -f "package-lock.json" ]; then
        npm ci --production --no-audit --no-fund
    else
        npm install --production --no-audit --no-fund
    fi
    
    log_success "依赖安装完成"
}

# 步骤7：构建应用
step7_build_application() {
    log_info "步骤7: 构建应用..."
    
    cd /var/www/blog
    
    # 检查内存状态
    MEM_AVAILABLE=$(free -m | grep Mem | awk '{print $7}')
    if [ $MEM_AVAILABLE -lt 200 ]; then
        log_warn "内存不足，清理缓存..."
        sync
        echo 1 > /proc/sys/vm/drop_caches
        npm cache clean --force
    fi
    
    # 清理旧构建
    rm -rf .next
    
    # 设置环境变量
    export NODE_ENV=production
    export NODE_OPTIONS="--max-old-space-size=256"
    
    # 构建应用
    timeout 1200 npm run build
    
    # 检查构建结果
    if [ ! -d ".next" ]; then
        log_error "构建失败，.next目录不存在"
        exit 1
    fi
    
    BUILD_SIZE=$(du -sh .next | awk '{print $1}')
    log_success "应用构建完成 (大小: $BUILD_SIZE)"
}

# 步骤8：配置服务
step8_configure_services() {
    log_info "步骤8: 配置服务..."
    
    # 获取用户
    DEPLOY_USER=$(ls -la /var/www/blog | head -3 | tail -1 | awk '{print $3}')
    if [ "$DEPLOY_USER" = "root" ]; then
        DEPLOY_USER="ubuntu"
    fi
    
    # 设置权限
    chown -R $DEPLOY_USER:$DEPLOY_USER /var/www/blog
    chmod -R 755 /var/www/blog
    
    # 创建systemd服务
    cat > /etc/systemd/system/blog.service << EOF
[Unit]
Description=Blog Next.js Application
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=$DEPLOY_USER
Group=$DEPLOY_USER
WorkingDirectory=/var/www/blog
ExecStart=/usr/bin/npm start
ExecStop=/bin/kill -TERM \$MAINPID
Restart=always
RestartSec=15
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=256
StandardOutput=journal
StandardError=journal
SyslogIdentifier=blog-app
TimeoutStartSec=180
TimeoutStopSec=60
KillMode=mixed
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
EOF
    
    # 重新加载systemd
    systemctl daemon-reload
    systemctl enable blog
    
    log_success "服务配置完成"
}

# 步骤9：启动服务
step9_start_services() {
    log_info "步骤9: 启动服务..."
    
    # 启动blog服务
    systemctl start blog
    
    # 等待服务启动
    sleep 15
    
    # 检查服务状态
    for i in {1..6}; do
        if systemctl is-active --quiet blog; then
            log_success "blog服务启动成功"
            break
        else
            if [ $i -eq 6 ]; then
                log_error "blog服务启动失败"
                systemctl status blog --no-pager
                exit 1
            fi
            log_info "等待服务启动... ($i/6)"
            sleep 10
        fi
    done
    
    # 启动nginx（如果存在）
    if systemctl list-unit-files | grep -q "nginx.service"; then
        if ! systemctl is-active --quiet nginx; then
            systemctl start nginx
            log_success "nginx服务已启动"
        fi
    fi
}

# 步骤10：验证部署
step10_verify_deployment() {
    log_info "步骤10: 验证部署..."
    
    # 等待应用完全启动
    sleep 20
    
    # 检查端口
    if netstat -tlnp | grep -q ":3000"; then
        log_success "应用端口3000已监听"
    else
        log_error "应用端口3000未监听"
        exit 1
    fi
    
    # 检查应用响应
    for i in {1..5}; do
        if curl -f --connect-timeout 10 http://localhost:3000 > /dev/null 2>&1; then
            log_success "应用响应正常"
            break
        else
            if [ $i -eq 5 ]; then
                log_error "应用无响应"
                exit 1
            fi
            log_info "等待应用响应... ($i/5)"
            sleep 10
        fi
    done
    
    # 检查nginx代理
    if curl -f --connect-timeout 10 http://localhost > /dev/null 2>&1; then
        log_success "nginx代理正常"
    else
        log_warn "nginx代理可能有问题"
    fi
    
    # 清理备份
    rm -rf /var/www/blog/.next.backup
    
    log_success "部署验证完成"
}

# 步骤11：部署总结
step11_deployment_summary() {
    log_info "步骤11: 部署总结..."
    
    echo ""
    echo "🎉 部署成功完成！"
    echo ""
    echo "📊 部署状态:"
    echo "  blog服务: $(systemctl is-active blog)"
    echo "  nginx服务: $(systemctl is-active nginx 2>/dev/null || echo 'not installed')"
    echo "  应用端口: $(netstat -tlnp | grep :3000 | wc -l) 个监听"
    echo "  系统内存: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
    
    # 获取外部IP
    EXTERNAL_IP=$(curl -s --connect-timeout 5 ifconfig.me || echo "unknown")
    if [ "$EXTERNAL_IP" != "unknown" ]; then
        echo "  外部IP: $EXTERNAL_IP"
        echo "🔗 访问地址: http://$EXTERNAL_IP"
    fi
    
    echo ""
    echo "📋 版本信息:"
    cd /var/www/blog
    echo "  $(git log --oneline -n 1)"
    
    echo ""
    echo "💡 后续建议:"
    echo "  - 使用以下命令监控状态:"
    echo "    curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/check-deployment-status.sh | bash"
    echo "  - 查看服务日志:"
    echo "    journalctl -u blog -f"
    echo "  - 如果外部无法访问，请检查防火墙/安全组设置"
}

# 主函数
main() {
    log_info "开始一键优化部署..."
    
    check_permissions
    
    step1_system_check
    step2_memory_optimization
    step3_pre_deployment_check
    step4_stop_services
    step5_code_update
    step6_install_dependencies
    step7_build_application
    step8_configure_services
    step9_start_services
    step10_verify_deployment
    step11_deployment_summary
    
    echo ""
    echo "=== 部署完成 ==="
    echo "📋 结束时间: $(date)"
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 