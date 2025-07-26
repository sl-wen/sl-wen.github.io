# 全栈应用部署指南

## 概述

本项目使用 GitHub Actions 自动部署到 Ubuntu 24.04 服务器。支持前端（React + Next.js）和后端（Python API）的独立或联合部署。

## 服务器要求

- Ubuntu 24.04 LTS
- Node.js 18+
- Python 3.8+
- PM2 或 systemd 服务管理
- Nginx (反向代理)
- Git

## 部署配置

### 1. GitHub Secrets 配置

在 GitHub 仓库设置中添加以下 Secrets：

```
SERVER_IP=你的服务器IP地址
SERVER_USER=服务器用户名
SERVER_PASSWORD=服务器密码
```

### 2. 服务器初始化

#### 手动初始化

如果需要手动配置，运行以下命令：

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装依赖
sudo apt install -y curl wget git nginx python3 python3-pip python3-venv nodejs npm

# 安装最新Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 创建项目目录
sudo mkdir -p /var/www/blog /var/www/novel
sudo chown -R $USER:$USER /var/www/blog /var/www/novel
```

### 3. 项目克隆

```bash
# 克隆前端项目
git clone git@github.com:sl-wen/sl-wen.github.io.git /var/www/blog
cd /var/www/blog
git checkout react

# 克隆后端项目
git clone git@github.com:sl-wen/novel.git /var/www/novel
cd /var/www/novel
git checkout main
```

### 4. 服务配置

#### 手动配置

创建前端服务文件 `/etc/systemd/system/blog.service`：

```ini
[Unit]
Description=Blog Frontend Application
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/blog
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

创建后端服务文件 `/etc/systemd/system/novel.service`：

```ini
[Unit]
Description=Novel Backend API Service
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/novel
Environment=PATH=/var/www/novel/venv/bin
ExecStart=/var/www/novel/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable blog
```

### 5. Nginx 配置

Nginx 配置文件位于 `/etc/nginx/sites-available/blog`：

```nginx
server {
    if ($host = www.slwen.cn) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = slwen.cn) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name slwen.cn www.slwen.cn;

}

server {
    listen 443 ssl http2;
    server_name slwen.cn www.slwen.cn;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/slwen.cn/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/slwen.cn/privkey.pem; # managed by Certbot

    # SSL 安全设置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
        # 推荐：增强安全性
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;  # about 40000 sessions
    ssl_session_tickets off;

    # 其他SSL安全优化（可选）
    # add_header Strict-Transport-Security "max-age=63072000" always;

    # 后端API反代【加在 location / 前面！！】
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 反向代理到 Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        # 以下配置为 websocket/Keepalive/真实client IP 转发
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 部署流程

### 自动部署

#### 分支触发规则

- **前端部署**：推送到 `react` 分支
- **后端部署**：推送到 `main` 分支
- **手动部署**：在 GitHub Actions 页面手动触发

#### 部署步骤

1. 代码推送到对应分支
2. GitHub Actions 触发部署
3. SSH 连接到服务器
4. 拉取最新代码
5. 安装依赖（如有变化）
6. 构建应用（前端）/ 更新虚拟环境（后端）
7. 重启服务
8. 配置 Nginx
9. 健康检查

### 手动部署

```bash
# 手动部署
cd /var/www/blog
git pull origin react
npm install
npm run build
sudo systemctl restart blog

cd /var/www/novel
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart novel-api

sudo systemctl restart nginx
```

## 服务管理

### 启动服务

```bash
sudo systemctl start blog novel nginx
```

### 停止服务

```bash
sudo systemctl stop blog novel nginx
```

### 重启服务

```bash
sudo systemctl restart blog novel nginx
```

### 查看状态

```bash
sudo systemctl status blog novel nginx
```

### 查看日志

```bash
# 前端服务日志
sudo journalctl -u blog -f

# 后端API服务日志
sudo journalctl -u novel -f

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 访问地址

- **前端应用**：`http://your-server-ip`
- **后端API**：`http://your-server-ip/api/`

## 常见问题和解决方案

### 1. SSH 密钥问题

**问题**: `Permission denied (publickey)` 或 `git@ssh.github.com: Permission denied`

**解决方案**:

```bash
# 检查SSH密钥
ls -la ~/.ssh/

# 修复GitHub SSH域名
git remote set-url origin git@github.com:sl-wen/sl-wen.github.io.git

# 添加GitHub主机密钥
ssh-keyscan -H github.com >> ~/.ssh/known_hosts

# 验证SSH连接
ssh -T git@github.com
```

### 2. 端口冲突

**问题**: 端口 3000 或 8000 被占用

**解决方案**:

```bash
# 检查端口占用
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :8000

# 杀死占用进程
sudo pkill -f "node.*3000"
sudo pkill -f "python.*8000"
```

### 3. 权限问题

**问题**: 文件权限错误

**解决方案**:

```bash
# 修复目录权限
sudo chown -R www-data:www-data /var/www/blog
sudo chown -R www-data:www-data /var/www/novel
sudo chmod -R 755 /var/www/blog
sudo chmod -R 755 /var/www/novel
```

### 4. Python 虚拟环境问题

**问题**: Python 依赖安装失败

**解决方案**:

```bash
cd /var/www/novel

# 重新创建虚拟环境
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Node.js 内存不足

**问题**: 构建过程中内存不足

**解决方案**:

```bash
# 设置Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=512"

# 或增加交换空间
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 监控和维护

### 系统监控

```bash
# 查看系统资源
htop
free -h
df -h

# 查看服务状态
sudo systemctl list-units --type=service --state=running
```

### 日志轮转

```bash
# 配置日志轮转
sudo tee /etc/logrotate.d/blog << 'EOF'
/var/log/blog/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
EOF
```

## 安全建议

1. **定期更新系统**：`sudo apt update && sudo apt upgrade`
2. **配置防火墙**：只开放必要端口
3. **使用HTTPS**：配置SSL证书
4. **定期备份**：设置自动备份脚本
5. **监控日志**：定期检查服务日志
6. **限制访问**：配置IP白名单（如需要）

## 故障排除

### 服务无法启动

```bash
# 查看详细错误信息
sudo systemctl status blog --no-pager
sudo journalctl -u blog --no-pager -n 50

# 检查配置文件
sudo nginx -t
sudo systemctl status nginx --no-pager
```

### 网络连接问题

```bash
# 检查端口监听
sudo netstat -tlnp | grep LISTEN

# 检查防火墙
sudo ufw status

# 测试本地连接
curl http://localhost:3000
curl http://localhost:8000
```

### 性能优化

```bash
# 启用Nginx gzip压缩
# 在nginx配置中添加：
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# 配置Node.js集群模式
# 在package.json中添加：
"scripts": {
  "start": "next start -p 3000",
  "start:cluster": "pm2 start npm --name 'blog' -- start"
}
```
