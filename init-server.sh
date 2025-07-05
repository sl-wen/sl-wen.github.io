#!/bin/bash

# 服务器初始化脚本 - Ubuntu 24.04
# 用法: curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/init-server.sh | bash

set -e

echo "🚀 博客服务器初始化脚本 (Ubuntu 24.04)"
echo "=================================="

# 检查系统版本
echo "📋 检查系统版本..."
lsb_release -a

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  建议使用root用户运行此脚本"
    echo "如果不是root用户，某些操作可能需要sudo权限"
fi

# 更新系统
echo "📦 更新系统..."
apt update && apt upgrade -y

# 安装基础工具
echo "🔧 安装基础工具..."
apt install -y git curl wget vim htop build-essential

# 安装Node.js 18
echo "📦 安装Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证安装
echo "✅ 验证安装:"
node --version
npm --version
git --version

# 安装Nginx
echo "🌐 安装Nginx..."
apt install -y nginx

# 启动并启用Nginx
systemctl start nginx
systemctl enable nginx

# 配置防火墙 (Ubuntu使用ufw)
echo "🔥 配置防火墙..."
ufw --force enable
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 3000/tcp
ufw status

# 处理应用目录
echo "📁 处理应用目录..."
if [ -d "/var/www/blog" ]; then
    echo "⚠️  目录 /var/www/blog 已存在"
    
    # 检查是否为Git仓库
    if [ -d "/var/www/blog/.git" ]; then
        echo "📋 发现现有Git仓库"
        cd /var/www/blog
        
        # 检查远程仓库
        CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
        TARGET_REMOTE="https://github.com/sl-wen/sl-wen.github.io.git"
        
        if [ "$CURRENT_REMOTE" = "$TARGET_REMOTE" ]; then
            echo "✅ 远程仓库匹配，更新现有仓库..."
            git fetch origin
            git checkout react 2>/dev/null || git checkout -b react origin/react
            git pull origin react
        else
            echo "⚠️  远程仓库不匹配"
            echo "当前: $CURRENT_REMOTE"
            echo "目标: $TARGET_REMOTE"
            echo "🔄 重新初始化仓库..."
            cd /var/www
            rm -rf blog
            mkdir -p blog
            cd blog
            git clone https://github.com/sl-wen/sl-wen.github.io.git .
            git checkout react
        fi
    else
        echo "📋 目录存在但不是Git仓库"
        
        # 检查目录是否为空
        if [ "$(ls -A /var/www/blog)" ]; then
            echo "⚠️  目录不为空，备份现有内容..."
            mv /var/www/blog /var/www/blog.backup.$(date +%Y%m%d_%H%M%S)
            echo "✅ 已备份到 /var/www/blog.backup.$(date +%Y%m%d_%H%M%S)"
        fi
        
        # 创建新目录并克隆
        mkdir -p /var/www/blog
        cd /var/www/blog
        git clone https://github.com/sl-wen/sl-wen.github.io.git .
        git checkout react
    fi
else
    # 创建新目录
    mkdir -p /var/www/blog
    cd /var/www/blog
    git clone https://github.com/sl-wen/sl-wen.github.io.git .
    git checkout react
fi

# 设置权限
echo "🔐 设置权限..."
chown -R $(whoami):$(whoami) /var/www/blog
chmod -R 755 /var/www/blog

# 检查package.json是否存在
if [ ! -f "/var/www/blog/package.json" ]; then
    echo "❌ package.json 不存在，请检查仓库内容"
    exit 1
fi

# 安装依赖
echo "📦 安装项目依赖..."
cd /var/www/blog
npm ci

# 构建应用
echo "🔨 构建应用..."
npm run build

# 创建环境变量文件
echo "🔧 创建环境变量文件..."
cat > .env.local << 'EOF'
# 在此添加你的环境变量
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NODE_ENV=production
EOF

# 创建systemd服务
echo "🔧 创建systemd服务..."
tee /etc/systemd/system/blog.service > /dev/null <<EOF
[Unit]
Description=Blog Next.js App
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=/var/www/blog
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd并启动服务
echo "🚀 启动服务..."
systemctl daemon-reload
systemctl enable blog
systemctl start blog

# 配置Nginx
echo "🌐 配置Nginx..."
tee /etc/nginx/sites-available/blog > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # 反向代理到Next.js应用
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
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Service Worker
    location /sw.js {
        proxy_pass http://localhost:3000;
        expires 0;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # 安全头
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# 启用站点配置
echo "🔗 启用站点配置..."
ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
echo "🧪 测试Nginx配置..."
nginx -t

# 重启Nginx
echo "🔄 重启Nginx..."
systemctl restart nginx

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "🔍 检查服务状态..."
if systemctl is-active --quiet blog; then
    echo "✅ blog服务运行正常"
else
    echo "❌ blog服务启动失败"
    echo "📋 服务状态:"
    systemctl status blog --no-pager
    echo "📋 服务日志:"
    journalctl -u blog -n 20 --no-pager
fi

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx服务运行正常"
else
    echo "❌ Nginx服务启动失败"
    systemctl status nginx --no-pager
fi

# 测试应用响应
echo "🧪 测试应用响应..."
sleep 10
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 应用响应正常"
else
    echo "⚠️  应用可能还在启动中"
    echo "📋 端口状态:"
    netstat -tlnp | grep :3000 || echo "端口3000未监听"
fi

# 测试Nginx代理
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Nginx代理正常"
else
    echo "⚠️  Nginx代理可能有问题"
fi

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "无法获取公网IP")

echo ""
echo "🎉 Ubuntu服务器初始化完成！"
echo "=========================="
echo "📊 系统信息:"
echo "  - 操作系统: $(lsb_release -d | cut -f2)"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo ""
echo "📊 服务状态:"
echo "  - blog服务: $(systemctl is-active blog)"
echo "  - nginx服务: $(systemctl is-active nginx)"
echo ""
echo "🔗 访问地址:"
echo "  - 本地访问: http://localhost"
echo "  - 外部访问: http://$SERVER_IP"
echo ""
echo "📋 常用命令:"
echo "  查看blog状态: systemctl status blog"
echo "  查看blog日志: journalctl -u blog -f"
echo "  重启blog: systemctl restart blog"
echo "  查看nginx状态: systemctl status nginx"
echo "  重启nginx: systemctl restart nginx"
echo "  查看防火墙: ufw status"
echo ""
echo "📝 下一步:"
echo "  1. 编辑 /var/www/blog/.env.local 添加环境变量"
echo "  2. 配置GitHub Actions的Secrets"
echo "  3. 推送代码测试自动部署"
echo ""
echo "🔧 配置文件位置:"
echo "  - Nginx配置: /etc/nginx/sites-available/blog"
echo "  - 服务配置: /etc/systemd/system/blog.service"
echo "  - 应用目录: /var/www/blog"
echo ""
if [ -d "/var/www/blog.backup."* ] 2>/dev/null; then
    echo "📋 备份信息:"
    echo "  - 原有文件已备份到: $(ls -d /var/www/blog.backup.* 2>/dev/null | head -1)"
fi 