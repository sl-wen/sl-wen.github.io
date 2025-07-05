# 部署文档 - Ubuntu 24.04

本文档详细说明如何在Ubuntu 24.04服务器上部署博客系统，包括自动化部署配置。

## 系统要求

- **操作系统**: Ubuntu 24.04 LTS
- **Node.js**: 18.x 或更高版本
- **内存**: 至少 1GB RAM
- **存储**: 至少 10GB 可用空间
- **网络**: 稳定的互联网连接

## 快速开始

### 1. 一键初始化服务器

```bash
# 下载并运行初始化脚本
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/init-server.sh | bash

# 或者手动下载后运行
wget https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/init-server.sh
chmod +x init-server.sh
./init-server.sh
```

### 2. 配置SSH认证

```bash
# 下载并运行SSH配置脚本
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/setup-ssh.sh | bash

# 或者手动下载后运行
wget https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/setup-ssh.sh
chmod +x setup-ssh.sh
./setup-ssh.sh
```

### 3. 配置GitHub Secrets

在GitHub仓库的Settings → Secrets and variables → Actions中添加以下secrets：

- `SERVER_IP`: 服务器IP地址
- `SERVER_USER`: 服务器用户名
- `SERVER_KEY`: SSH私钥或密码

### 4. 触发部署

```bash
git push origin react
```

## 详细配置步骤

### 服务器环境准备

#### 1. 更新系统

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. 安装基础依赖

```bash
# 安装基础工具
sudo apt install -y git curl wget vim htop build-essential

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

#### 3. 安装和配置Nginx

```bash
# 安装Nginx
sudo apt install -y nginx

# 启动并启用Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

#### 4. 配置防火墙

```bash
# 启用防火墙
sudo ufw enable

# 允许必要端口
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3000/tcp

# 检查状态
sudo ufw status
```

### SSH认证配置

#### 方法1: 密钥认证（推荐）

```bash
# 生成SSH密钥对
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_actions -N "" -C "github-actions@$(hostname)"

# 添加公钥到authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 显示私钥（复制到GitHub Secrets）
cat ~/.ssh/github_actions
```

#### 方法2: 密码认证

```bash
# 编辑SSH配置
sudo vim /etc/ssh/sshd_config

# 确保以下配置
PasswordAuthentication yes
PubkeyAuthentication yes

# 重启SSH服务
sudo systemctl restart ssh
```

### 应用部署配置

#### 1. 创建应用目录

```bash
sudo mkdir -p /var/www/blog
sudo chown -R $(whoami):$(whoami) /var/www/blog
cd /var/www/blog
```

#### 2. 克隆代码

```bash
git clone https://github.com/sl-wen/sl-wen.github.io.git .
git checkout react
```

#### 3. 安装依赖并构建

```bash
npm ci
npm run build
```

#### 4. 配置环境变量

```bash
# 创建环境变量文件
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EOF
```

#### 5. 创建systemd服务

```bash
sudo tee /etc/systemd/system/blog.service > /dev/null <<EOF
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

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable blog
sudo systemctl start blog
```

#### 6. 配置Nginx反向代理

```bash
sudo tee /etc/nginx/sites-available/blog > /dev/null <<'EOF'
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
sudo ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置并重启
sudo nginx -t
sudo systemctl restart nginx
```

## GitHub Actions配置

### Workflow文件

`.github/workflows/static.yml` 文件已经配置好，支持：

- SSH连接到服务器
- 自动拉取最新代码
- 构建和部署应用
- 服务重启
- 自动回滚机制

### 必需的Secrets

| Secret名称 | 描述 | 示例 |
|------------|------|------|
| `SERVER_IP` | 服务器IP地址 | `192.168.1.100` |
| `SERVER_USER` | 服务器用户名 | `ubuntu` |
| `SERVER_KEY` | SSH私钥或密码 | `-----BEGIN RSA PRIVATE KEY-----...` |
| `SUPABASE_URL` | Supabase项目URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase匿名密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## 常用命令

### 服务管理

```bash
# 查看服务状态
sudo systemctl status blog

# 启动/停止/重启服务
sudo systemctl start blog
sudo systemctl stop blog
sudo systemctl restart blog

# 查看服务日志
sudo journalctl -u blog -f
sudo journalctl -u blog -n 50
```

### Nginx管理

```bash
# 查看Nginx状态
sudo systemctl status nginx

# 重启Nginx
sudo systemctl restart nginx

# 测试配置
sudo nginx -t

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 应用管理

```bash
# 进入应用目录
cd /var/www/blog

# 查看Git状态
git status
git log --oneline -n 5

# 手动部署
./quick-deploy.sh

# 查看应用日志
npm run logs
```

### 系统监控

```bash
# 查看系统资源
htop
df -h
free -h

# 查看网络连接
netstat -tlnp
ss -tlnp

# 查看进程
ps aux | grep -E "(node|nginx)"
```

## 故障排除

### 常见问题

#### 1. SSH连接失败

```bash
# 检查SSH服务状态
sudo systemctl status ssh

# 查看SSH日志
sudo journalctl -u ssh -n 50

# 检查SSH配置
sudo sshd -t

# 检查防火墙
sudo ufw status
```

#### 2. 应用无法启动

```bash
# 查看服务状态
sudo systemctl status blog

# 查看详细日志
sudo journalctl -u blog -n 100

# 检查端口占用
sudo netstat -tlnp | grep :3000

# 手动启动应用
cd /var/www/blog
npm start
```

#### 3. Nginx代理问题

```bash
# 测试Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 检查代理配置
sudo cat /etc/nginx/sites-available/blog
```

#### 4. 构建失败

```bash
# 检查Node.js版本
node --version
npm --version

# 清理缓存
rm -rf node_modules/.cache
rm -rf .next

# 重新安装依赖
npm ci

# 手动构建
npm run build
```

### 日志位置

- **应用日志**: `sudo journalctl -u blog`
- **Nginx访问日志**: `/var/log/nginx/access.log`
- **Nginx错误日志**: `/var/log/nginx/error.log`
- **SSH日志**: `sudo journalctl -u ssh`
- **系统日志**: `/var/log/syslog`

## 性能优化

### 1. 启用HTTP/2

```bash
# 编辑Nginx配置
sudo vim /etc/nginx/sites-available/blog

# 修改listen指令
listen 443 ssl http2;
listen [::]:443 ssl http2;
```

### 2. 配置SSL证书

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 优化Nginx配置

```bash
# 编辑主配置文件
sudo vim /etc/nginx/nginx.conf

# 添加优化配置
worker_processes auto;
worker_connections 1024;
sendfile on;
tcp_nopush on;
tcp_nodelay on;
keepalive_timeout 65;
```

### 4. 配置缓存

```bash
# 在Nginx配置中添加缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 安全建议

### 1. SSH安全

```bash
# 更改SSH端口
sudo vim /etc/ssh/sshd_config
# Port 2222

# 禁用root登录
# PermitRootLogin no

# 禁用密码认证（仅使用密钥）
# PasswordAuthentication no

# 重启SSH服务
sudo systemctl restart ssh
```

### 2. 防火墙配置

```bash
# 限制SSH访问
sudo ufw limit ssh

# 允许特定IP访问
sudo ufw allow from 192.168.1.0/24 to any port 22

# 拒绝其他连接
sudo ufw deny ssh
```

### 3. 自动更新

```bash
# 安装自动更新
sudo apt install -y unattended-upgrades

# 配置自动更新
sudo dpkg-reconfigure unattended-upgrades
```

### 4. 监控和告警

```bash
# 安装fail2ban
sudo apt install -y fail2ban

# 配置fail2ban
sudo vim /etc/fail2ban/jail.local
```

## 备份策略

### 1. 数据库备份

```bash
# 如果使用本地数据库
sudo crontab -e
# 添加: 0 2 * * * /usr/bin/pg_dump dbname > /backup/db_$(date +\%Y\%m\%d).sql
```

### 2. 代码备份

```bash
# Git自动备份
cd /var/www/blog
git remote add backup https://github.com/username/backup-repo.git
```

### 3. 配置备份

```bash
# 备份重要配置文件
sudo tar -czf /backup/config_$(date +%Y%m%d).tar.gz \
    /etc/nginx/sites-available/blog \
    /etc/systemd/system/blog.service \
    /var/www/blog/.env.local
```

## 监控和维护

### 1. 系统监控

```bash
# 安装监控工具
sudo apt install -y htop iotop nethogs

# 设置监控脚本
cat > /home/ubuntu/monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Status $(date) ===" >> /var/log/system-monitor.log
df -h >> /var/log/system-monitor.log
free -h >> /var/log/system-monitor.log
systemctl is-active blog nginx >> /var/log/system-monitor.log
echo "================================" >> /var/log/system-monitor.log
EOF

# 设置定时任务
sudo crontab -e
# 添加: */10 * * * * /home/ubuntu/monitor.sh
```

### 2. 日志轮转

```bash
# 配置日志轮转
sudo vim /etc/logrotate.d/blog

# 添加配置
/var/log/blog/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 ubuntu ubuntu
    postrotate
        systemctl reload blog
    endscript
}
```

### 3. 健康检查

```bash
# 创建健康检查脚本
cat > /home/ubuntu/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "Application health check failed" | mail -s "Blog App Down" admin@example.com
    systemctl restart blog
fi
EOF

# 设置定时检查
sudo crontab -e
# 添加: */5 * * * * /home/ubuntu/health-check.sh
```

## 总结

本文档提供了在Ubuntu 24.04上部署博客系统的完整指南。主要包括：

1. **一键初始化**: 使用脚本快速配置服务器环境
2. **SSH认证**: 配置安全的SSH访问
3. **自动部署**: 通过GitHub Actions实现CI/CD
4. **监控维护**: 完善的监控和维护策略
5. **故障排除**: 详细的故障排除指南

遵循本文档的步骤，你可以快速搭建一个稳定、安全、高效的博客系统。

## 联系支持

如果遇到问题，请：

1. 查看故障排除部分
2. 检查系统日志
3. 提交GitHub Issue
4. 联系系统管理员

---

*最后更新: 2024年12月* 