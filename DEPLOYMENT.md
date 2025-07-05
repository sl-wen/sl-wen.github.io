# 部署指南

## 🚀 自动部署到阿里云服务器（Git拉取 + 服务器端构建）

> 💡 **部署策略**：本配置采用Git拉取方式，服务器直接从GitHub拉取最新代码并在服务器上构建。这是最简单高效的部署方式，无需文件传输，支持版本控制和自动回滚。

### 1. GitHub Secrets 配置

在你的 GitHub 仓库中设置以下 Secrets：

#### 必需的 Secrets：
- `SERVER_IP`: 服务器IP地址
- `SERVER_USER`: 服务器用户名（如 root）
- `SERVER_KEY`: 服务器密码或SSH私钥

#### 可选的 Secrets（如果使用 Supabase）：
- `SUPABASE_URL`: Supabase项目URL
- `SUPABASE_KEY`: Supabase匿名密钥

#### SSH认证配置
如果遇到SSH认证问题，有两种解决方案：

**方案1：使用SSH密钥（推荐）**
1. 在服务器上生成SSH密钥对：
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

2. 将公钥添加到authorized_keys：
```bash
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

3. 将私钥内容复制到GitHub Secrets的 `SERVER_KEY` 中

**方案2：启用密码认证**
1. 编辑SSH配置：
```bash
sudo vim /etc/ssh/sshd_config
```

2. 确保以下配置：
```
PasswordAuthentication yes
PermitRootLogin yes
```

3. 重启SSH服务：
```bash
sudo systemctl restart sshd
```

**方案3：使用配置脚本（最简单）**
1. 在服务器上运行SSH配置脚本：
```bash
# 下载并运行SSH配置脚本
curl -o setup-ssh.sh https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/setup-ssh.sh
chmod +x setup-ssh.sh
./setup-ssh.sh
```

2. 按照脚本提示复制私钥到GitHub Secrets

### 2. 服务器环境准备

#### 2.0 一键初始化（推荐）
```bash
# 使用一键初始化脚本（适用于全新服务器）
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/init-server.sh | bash

# 脚本会自动完成：
# - 安装Git、Node.js、Nginx
# - 克隆代码仓库
# - 创建systemd服务
# - 配置Nginx反向代理
# - 启动所有服务
```

#### 2.1 手动安装（如果需要自定义配置）

#### 2.1.1 安装 Nginx
```bash
# 更新系统
sudo yum update -y

# 安装 Nginx
sudo yum install -y nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

#### 2.1.2 配置 Nginx
```bash
# 备份原配置
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 编辑配置文件
sudo vim /etc/nginx/conf.d/blog.conf
```

将以下内容复制到 `/etc/nginx/conf.d/blog.conf`：

```nginx
server {
    listen 80;
    server_name 182.92.240.153;  # 你的服务器IP，也可以改为域名
    
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
    
    # 静态资源缓存（Next.js _next 静态文件）
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 图片和其他静态资源
    location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
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
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # 安全头
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 错误页面
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
    
    # 限制请求大小
    client_max_body_size 10M;
}
```

#### 2.1.3 安装Git和Node.js，创建应用目录
```bash
# 安装Git
sudo yum install -y git

# 安装Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 创建应用目录
sudo mkdir -p /var/www/blog

# 设置权限
sudo chown -R $USER:$USER /var/www/blog
sudo chmod -R 755 /var/www/blog

# 进入应用目录并克隆代码
cd /var/www/blog
git clone https://github.com/sl-wen/sl-wen.github.io.git .
git checkout react

# 创建systemd服务文件
sudo tee /etc/systemd/system/blog.service > /dev/null <<EOF
[Unit]
Description=Blog Next.js App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/blog
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl enable blog.service
```

#### 2.1.4 配置防火墙
```bash
# 开放HTTP端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 3. 服务器端构建流程

#### 3.1 本地测试构建（可选）
在推送到生产环境之前，可以先在本地测试：

```bash
# 安装依赖
npm install

# 构建Next.js应用
npm run build

# 检查构建输出
ls -la .next/
```

#### 3.2 Git拉取部署优势
- ✅ **无文件传输**：直接从GitHub拉取，无需上传文件
- ✅ **版本控制**：完整的Git历史记录，便于版本管理
- ✅ **自动回滚**：部署失败时自动回滚到上一个版本
- ✅ **环境一致性**：构建环境与运行环境完全一致
- ✅ **简单高效**：一条命令完成拉取、构建、部署

#### 3.3 部署过程说明
GitHub Actions会执行以下步骤：
1. SSH连接到服务器
2. 拉取最新代码 (`git pull`)
3. 停止现有服务并备份
4. 清理旧的构建文件
5. 安装开发依赖
6. 执行构建 (`npm run build`)
7. 安装生产依赖
8. 启动新服务
9. 健康检查（失败时自动回滚）

### 4. 触发部署

#### 自动部署
推送代码到 `react` 分支即可自动触发部署：
```bash
git add .
git commit -m "feat: 更新网站内容"
git push origin react
```

#### 手动部署
1. **GitHub Actions 手动触发**：在 GitHub 仓库的 Actions 页面可以手动触发 `Deploy to ALI` 工作流。

2. **服务器端手动部署**：
```bash
# 在服务器上，进入应用目录
cd /var/www/blog

# 使用部署脚本（默认react分支）
chmod +x deploy-server.sh
./deploy-server.sh

# 或指定分支
./deploy-server.sh main
```

3. **快速手动部署**（适用于小更新）：
```bash
# 在服务器上快速部署（不重新构建）
cd /var/www/blog
chmod +x quick-deploy.sh
./quick-deploy.sh

# 或手动执行
git pull origin react
sudo systemctl restart blog
```

4. **传统方式部署**：
```bash
# 上传代码到服务器后
cd /var/www/blog
npm ci
npm run build
sudo systemctl restart blog
```

### 5. 验证部署

1. 检查 GitHub Actions 日志确认部署成功
2. 访问服务器IP确认网站正常运行：`http://182.92.240.153`
3. 检查网站功能：
   - 首页加载
   - 文章页面
   - 搜索功能
   - 用户登录

### 6. 常见问题排查

#### 6.1 SSH认证失败
```bash
# 错误信息：ssh: handshake failed: ssh: unable to authenticate
# 解决方案：

# 1. 检查SSH服务状态
sudo systemctl status sshd

# 2. 检查SSH配置
sudo cat /etc/ssh/sshd_config | grep -E "(PasswordAuthentication|PubkeyAuthentication|PermitRootLogin)"

# 3. 查看SSH日志
sudo tail -f /var/log/secure

# 4. 测试SSH连接
ssh -v username@server_ip

# 5. 重新生成SSH密钥
./setup-ssh.sh
```

#### 6.2 构建失败
- 检查代码是否有语法错误
- 确认所有依赖都在 package.json 中
- 查看 Actions 日志了解具体错误

#### 6.3 部署失败
- 检查服务器连接是否正常
- 确认 Nginx 配置正确
- 检查目录权限

#### 6.4 网站访问异常
```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log

# 重启 Nginx
sudo systemctl restart nginx
```

#### 6.5 Git状态问题
```bash
# 错误：Changes not staged for commit
# 解决方案：清理Git工作区

cd /var/www/blog

# 查看Git状态
git status

# 丢弃本地更改
git reset --hard HEAD
git clean -fd

# 强制拉取最新代码
git fetch origin
git reset --hard origin/react
```

#### 6.6 服务不存在问题
```bash
# 错误：Failed to stop blog.service: Unit blog.service not loaded
# 解决方案：创建systemd服务

# 使用自动脚本创建
chmod +x create-service.sh
./create-service.sh

# 或手动创建
sudo vim /etc/systemd/system/blog.service
sudo systemctl daemon-reload
sudo systemctl enable blog
```

#### 6.7 服务器端构建失败
```bash
# 检查应用服务状态
sudo systemctl status blog

# 查看应用日志
sudo journalctl -u blog -f

# 手动构建测试
cd /var/www/blog
npm run build

# 检查磁盘空间
df -h

# 检查内存使用
free -h

# 清理npm缓存
npm cache clean --force
```

#### 6.8 部署过程监控
```bash
# 实时查看部署日志
sudo journalctl -u blog -f

# 检查端口占用
sudo netstat -tlnp | grep :3000

# 测试应用响应
curl -I http://localhost:3000

# 查看进程信息
ps aux | grep node
```

### 7. SSL证书配置（可选）

如果你有域名，建议配置SSL证书：

```bash
# 安装 Certbot
sudo yum install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 8. Git配置和权限

#### 8.1 Git访问配置
```bash
# 如果是私有仓库，需要配置SSH密钥或Personal Access Token
# 使用SSH密钥（推荐）
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
cat ~/.ssh/id_rsa.pub  # 将公钥添加到GitHub

# 或使用Personal Access Token
git config --global credential.helper store
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
```

#### 8.2 仓库权限设置
```bash
# 确保仓库是公开的，或者配置了正确的访问权限
# 测试Git访问
git ls-remote https://github.com/sl-wen/sl-wen.github.io.git

# 如果需要更改远程仓库地址
git remote set-url origin https://github.com/your-username/your-repo.git
```

### 9. 性能优化

#### 9.1 启用HTTP/2
在Nginx配置中添加：
```nginx
listen 443 ssl http2;
```

#### 9.2 配置CDN
可以考虑使用阿里云CDN加速静态资源访问。

#### 9.3 监控设置
```bash
# 安装htop监控资源
sudo yum install -y htop

# 查看系统资源
htop
```

## 📝 注意事项

1. **安全性**：确保服务器安全组只开放必要端口
2. **备份**：定期备份网站文件和Nginx配置
3. **监控**：设置服务器监控，及时发现问题
4. **更新**：定期更新系统和Nginx版本

## 🔧 高级配置

### 多环境部署
可以创建不同的workflow文件支持开发、测试、生产环境：
- `.github/workflows/deploy-dev.yml`
- `.github/workflows/deploy-staging.yml` 
- `.github/workflows/deploy-prod.yml`

### 蓝绿部署
配置两个部署目录，实现零停机部署。

### 自动回滚
在部署失败时自动回滚到上一个版本。 