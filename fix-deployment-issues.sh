#!/bin/bash

# Ubuntu 24.04 部署问题修复脚本
# 修复常见的部署问题，特别是SIGTERM相关问题

set -e

echo "=== 部署问题修复脚本 ==="
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

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用sudo运行此脚本"
        exit 1
    fi
}

# 强制停止所有相关进程
force_stop_processes() {
    log_info "强制停止所有相关进程..."
    
    # 停止systemd服务
    if systemctl list-unit-files | grep -q "blog.service"; then
        systemctl stop blog || true
        systemctl disable blog || true
        log_success "已停止blog服务"
    fi
    
    # 强制终止所有相关进程
    pkill -TERM -f "next start" || true
    pkill -TERM -f "npm start" || true
    pkill -TERM -f "node.*next" || true
    
    sleep 3
    
    # 如果还有进程，强制杀死
    pkill -KILL -f "next start" || true
    pkill -KILL -f "npm start" || true
    pkill -KILL -f "node.*next" || true
    
    log_success "已强制停止所有相关进程"
}

# 清理临时文件和锁文件
cleanup_temp_files() {
    log_info "清理临时文件和锁文件..."
    
    if [ -d "/var/www/blog" ]; then
        cd /var/www/blog
        
        # 清理Next.js缓存
        rm -rf .next/cache || true
        rm -rf .next/static || true
        
        # 清理npm缓存
        rm -rf node_modules/.cache || true
        
        # 清理package-lock
        rm -f package-lock.json || true
        
        # 清理临时文件
        find . -name "*.tmp" -delete || true
        find . -name "*.lock" -delete || true
        
        log_success "已清理临时文件"
    fi
    
    # 清理全局npm缓存
    npm cache clean --force || true
    
    # 清理系统临时文件
    rm -rf /tmp/npm-* || true
    rm -rf /tmp/next-* || true
    
    log_success "已清理缓存文件"
}

# 修复文件权限
fix_permissions() {
    log_info "修复文件权限..."
    
    if [ -d "/var/www/blog" ]; then
        # 获取非root用户
        DEPLOY_USER=$(ls -la /var/www/blog | head -3 | tail -1 | awk '{print $3}')
        if [ "$DEPLOY_USER" = "root" ]; then
            DEPLOY_USER="ubuntu"  # 默认使用ubuntu用户
        fi
        
        chown -R $DEPLOY_USER:$DEPLOY_USER /var/www/blog
        chmod -R 755 /var/www/blog
        
        # 确保关键目录权限正确
        chmod 755 /var/www/blog/.next 2>/dev/null || true
        chmod 755 /var/www/blog/node_modules 2>/dev/null || true
        
        log_success "已修复文件权限 (用户: $DEPLOY_USER)"
    fi
}

# 重新安装依赖
reinstall_dependencies() {
    log_info "重新安装依赖..."
    
    if [ ! -d "/var/www/blog" ]; then
        log_error "应用目录不存在"
        return 1
    fi
    
    cd /var/www/blog
    
    # 获取用户
    DEPLOY_USER=$(ls -la . | head -3 | tail -1 | awk '{print $3}')
    if [ "$DEPLOY_USER" = "root" ]; then
        DEPLOY_USER="ubuntu"
    fi
    
    # 切换到非root用户执行
    sudo -u $DEPLOY_USER bash -c "
        cd /var/www/blog
        rm -rf node_modules
        rm -f package-lock.json
        npm install --production
    "
    
    log_success "已重新安装依赖"
}

# 重新构建应用
rebuild_application() {
    log_info "重新构建应用..."
    
    if [ ! -d "/var/www/blog" ]; then
        log_error "应用目录不存在"
        return 1
    fi
    
    cd /var/www/blog
    
    # 获取用户
    DEPLOY_USER=$(ls -la . | head -3 | tail -1 | awk '{print $3}')
    if [ "$DEPLOY_USER" = "root" ]; then
        DEPLOY_USER="ubuntu"
    fi
    
    # 切换到非root用户执行
    sudo -u $DEPLOY_USER bash -c "
        cd /var/www/blog
        export NODE_OPTIONS='--max-old-space-size=1024'
        rm -rf .next
        npm run build
    "
    
    log_success "已重新构建应用"
}

# 重新创建systemd服务
recreate_systemd_service() {
    log_info "重新创建systemd服务..."
    
    # 获取用户
    DEPLOY_USER="ubuntu"
    if [ -d "/var/www/blog" ]; then
        DEPLOY_USER=$(ls -la /var/www/blog | head -3 | tail -1 | awk '{print $3}')
        if [ "$DEPLOY_USER" = "root" ]; then
            DEPLOY_USER="ubuntu"
        fi
    fi
    
    # 删除旧服务
    systemctl stop blog || true
    systemctl disable blog || true
    rm -f /etc/systemd/system/blog.service
    
    # 创建新服务
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
RestartSec=10
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=1024
StandardOutput=journal
StandardError=journal
SyslogIdentifier=blog-app
TimeoutStartSec=120
TimeoutStopSec=30
KillMode=mixed
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
EOF
    
    # 重新加载systemd
    systemctl daemon-reload
    systemctl enable blog
    
    log_success "已重新创建systemd服务"
}

# 测试服务启动
test_service_startup() {
    log_info "测试服务启动..."
    
    # 启动服务
    systemctl start blog
    
    # 等待启动
    sleep 15
    
    # 检查状态
    if systemctl is-active --quiet blog; then
        log_success "服务启动成功"
        
        # 测试端口
        sleep 10
        if curl -f --connect-timeout 10 http://localhost:3000 > /dev/null 2>&1; then
            log_success "应用响应正常"
        else
            log_warn "应用暂时无响应，可能还在启动中"
        fi
    else
        log_error "服务启动失败"
        systemctl status blog --no-pager
        return 1
    fi
}

# 修复Nginx配置
fix_nginx_config() {
    log_info "检查并修复Nginx配置..."
    
    if ! systemctl list-unit-files | grep -q "nginx.service"; then
        log_warn "Nginx未安装，跳过配置"
        return 0
    fi
    
    # 检查配置文件
    if [ ! -f "/etc/nginx/sites-available/blog" ]; then
        log_info "创建Nginx配置文件..."
        
        cat > /etc/nginx/sites-available/blog << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
        
        # 启用站点
        ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/blog
        
        # 删除默认站点
        rm -f /etc/nginx/sites-enabled/default
        
        log_success "已创建Nginx配置"
    fi
    
    # 测试配置
    if nginx -t; then
        log_success "Nginx配置正确"
        systemctl restart nginx
    else
        log_error "Nginx配置有误"
        return 1
    fi
}

# 主修复函数
main() {
    log_info "开始修复部署问题..."
    
    # 检查root权限
    check_root
    
    # 1. 强制停止所有进程
    force_stop_processes
    
    # 2. 清理临时文件
    cleanup_temp_files
    
    # 3. 修复权限
    fix_permissions
    
    # 4. 重新安装依赖
    reinstall_dependencies
    
    # 5. 重新构建应用
    rebuild_application
    
    # 6. 重新创建systemd服务
    recreate_systemd_service
    
    # 7. 修复Nginx配置
    fix_nginx_config
    
    # 8. 测试服务启动
    test_service_startup
    
    log_success "修复完成！"
    
    echo ""
    echo "=== 修复结果 ==="
    echo "blog服务状态: $(systemctl is-active blog)"
    echo "nginx服务状态: $(systemctl is-active nginx)"
    echo "应用端口: $(netstat -tlnp | grep :3000 | wc -l) 个监听"
    echo ""
    echo "请尝试重新运行部署脚本。"
}

# 如果脚本被直接执行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 