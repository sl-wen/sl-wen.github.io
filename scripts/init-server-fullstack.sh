#!/bin/bash

# 全栈应用服务器初始化脚本
# 用于设置前端 + Python后端API的服务器环境

echo "=== 全栈应用服务器初始化 ==="
echo "时间: $(date)"
echo "用户: $(whoami)"

# 更新系统
echo "更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装基础依赖
echo "安装基础依赖..."
sudo apt install -y \
    curl \
    wget \
    git \
    nginx \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# 安装最新版本的Node.js
echo "安装最新版本Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
echo "验证安装..."
echo "Node.js版本: $(node --version)"
echo "npm版本: $(npm --version)"
echo "Python版本: $(python3 --version)"
echo "pip版本: $(pip3 --version)"
echo "Nginx版本: $(nginx -v 2>&1)"

# 创建项目目录
echo "创建项目目录..."
sudo mkdir -p /var/www/blog
sudo mkdir -p /var/www/novel
sudo chown -R $USER:$USER /var/www/blog
sudo chown -R $USER:$USER /var/www/novel

# 配置Nginx
echo "配置Nginx..."
sudo tee /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    # 默认重定向到前端应用
    return 301 http://$host/;
}
EOF

# 创建全栈应用Nginx配置
echo "创建全栈应用Nginx配置..."
sudo tee /etc/nginx/sites-available/fullstack-app << 'EOF'
server {
    listen 80;
    server_name _;
    
    # 前端应用
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
    
    # 后端API
    location /api/ {
        proxy_pass http://localhost:8000/;
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
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# 启用站点
echo "启用Nginx站点..."
sudo ln -sf /etc/nginx/sites-available/fullstack-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
echo "测试Nginx配置..."
if sudo nginx -t; then
    echo "✅ Nginx配置正确"
    sudo systemctl restart nginx
    sudo systemctl enable nginx
else
    echo "❌ Nginx配置错误"
    exit 1
fi

# 配置防火墙
echo "配置防火墙..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 创建www-data用户组（如果不存在）
echo "配置用户和权限..."
sudo groupadd -f www-data
sudo usermod -a -G www-data $USER

# 设置目录权限
echo "设置目录权限..."
sudo chown -R www-data:www-data /var/www
sudo chmod -R 755 /var/www

# 创建日志目录
echo "创建日志目录..."
sudo mkdir -p /var/log/blog
sudo mkdir -p /var/log/novel-api
sudo chown www-data:www-data /var/log/blog
sudo chown www-data:www-data /var/log/novel-api

# 配置SSH密钥（如果需要）
echo "配置SSH环境..."
if [ ! -d ~/.ssh ]; then
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
fi

# 添加GitHub主机密钥
echo "添加GitHub主机密钥..."
ssh-keyscan -H github.com >> ~/.ssh/known_hosts 2>/dev/null || echo "无法添加GitHub主机密钥"

# 创建systemd服务配置
echo "创建systemd服务配置..."
sudo tee /etc/systemd/system/blog.service << 'EOF'
[Unit]
Description=Blog Frontend Application
After=network.target
Wants=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/blog
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=blog

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/blog

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/novel-api.service << 'EOF'
[Unit]
Description=Novel Backend API Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/novel
Environment=PATH=/var/www/novel/venv/bin
ExecStart=/var/www/novel/venv/bin/python app.py
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=novel-api

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/novel

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd配置
echo "重新加载systemd配置..."
sudo systemctl daemon-reload

# 启用服务
echo "启用服务..."
sudo systemctl enable blog
sudo systemctl enable novel-api

# 创建部署脚本
echo "创建部署脚本..."
sudo tee /usr/local/bin/deploy-fullstack << 'EOF'
#!/bin/bash
# 全栈应用部署脚本

echo "=== 全栈应用部署 ==="
echo "时间: $(date)"

# 部署前端
echo "部署前端应用..."
cd /var/www/blog
if [ -d ".git" ]; then
    git fetch origin
    git reset --hard origin/react
    npm install --production
    npm run build
    sudo systemctl restart blog
    echo "✅ 前端部署完成"
else
    echo "❌ 前端项目目录不存在或未初始化"
fi

# 部署后端
echo "部署后端API..."
cd /var/www/novel
if [ -d ".git" ]; then
    git fetch origin
    git reset --hard origin/main
    
    # 激活虚拟环境
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    
    # 安装依赖
    pip install -r requirements.txt
    
    # 数据库迁移（如果有）
    if [ -f "manage.py" ]; then
        python manage.py migrate --noinput
    fi
    
    sudo systemctl restart novel-api
    echo "✅ 后端部署完成"
else
    echo "❌ 后端项目目录不存在或未初始化"
fi

# 重启Nginx
echo "重启Nginx..."
sudo systemctl restart nginx

echo "=== 部署完成 ==="
echo "前端服务: $(sudo systemctl is-active blog)"
echo "后端API服务: $(sudo systemctl is-active novel-api)"
echo "Nginx服务: $(sudo systemctl is-active nginx)"
EOF

sudo chmod +x /usr/local/bin/deploy-fullstack

# 显示完成信息
echo ""
echo "=== 服务器初始化完成 ==="
echo "✅ 系统已更新"
echo "✅ Node.js 和 npm 已安装"
echo "✅ Python3 和 pip3 已安装"
echo "✅ Nginx 已配置"
echo "✅ 防火墙已配置"
echo "✅ systemd 服务已创建"
echo "✅ 目录权限已设置"
echo ""
echo "下一步操作:"
echo "1. 克隆前端项目: git clone git@github.com:sl-wen/sl-wen.github.io.git /var/www/blog"
echo "2. 克隆后端项目: git clone git@github.com:sl-wen/novel.git /var/www/novel"
echo "3. 配置GitHub Secrets: SERVER_IP, SERVER_USER, SERVER_PASSWORD"
echo "4. 推送代码触发自动部署"
echo ""
echo "服务管理命令:"
echo "  启动所有服务: sudo systemctl start blog novel-api nginx"
echo "  停止所有服务: sudo systemctl stop blog novel-api nginx"
echo "  查看服务状态: sudo systemctl status blog novel-api nginx"
echo "  查看服务日志: sudo journalctl -u blog -f"
echo "                sudo journalctl -u novel-api -f"
echo "  手动部署: sudo /usr/local/bin/deploy-fullstack"
echo ""
echo "访问地址:"
echo "  前端应用: http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')"
echo "  后端API: http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')/api/" 