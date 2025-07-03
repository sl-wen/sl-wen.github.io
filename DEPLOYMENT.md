# 部署指南

## 🚀 自动部署到阿里云服务器

### 1. GitHub Secrets 配置

在你的 GitHub 仓库中设置以下 Secrets：

#### 必需的 Secrets：
- `HOST_ALI`: 阿里云服务器的root密码

#### 可选的 Secrets（如果使用 Supabase）：
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase项目URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名密钥

### 2. 服务器环境准备

#### 2.1 安装 Nginx
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

#### 2.2 配置 Nginx
```bash
# 备份原配置
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 编辑配置文件
sudo vim /etc/nginx/conf.d/blog.conf
```

将 `nginx.conf.example` 的内容复制到 `/etc/nginx/conf.d/blog.conf`

#### 2.3 创建应用目录和安装Node.js
```bash
# 安装Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 创建应用目录
sudo mkdir -p /var/www/blog

# 设置权限
sudo chown -R $USER:$USER /var/www/blog
sudo chmod -R 755 /var/www/blog

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

#### 2.4 配置防火墙
```bash
# 开放HTTP端口
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 3. 本地测试构建

在推送到生产环境之前，先在本地测试：

```bash
# 安装依赖
npm install

# 构建Next.js应用
npm run build

# 检查构建输出
ls -la .next/
```

### 4. 触发部署

#### 自动部署
推送代码到 `react` 分支即可自动触发部署：
```bash
git add .
git commit -m "feat: 更新网站内容"
git push origin react
```

#### 手动部署
在 GitHub 仓库的 Actions 页面可以手动触发 `Deploy to ALI` 工作流。

### 5. 验证部署

1. 检查 GitHub Actions 日志确认部署成功
2. 访问服务器IP确认网站正常运行：`http://121.40.215.235`
3. 检查网站功能：
   - 首页加载
   - 文章页面
   - 搜索功能
   - 用户登录

### 6. 常见问题排查

#### 6.1 构建失败
- 检查代码是否有语法错误
- 确认所有依赖都在 package.json 中
- 查看 Actions 日志了解具体错误

#### 6.2 部署失败
- 检查服务器连接是否正常
- 确认 Nginx 配置正确
- 检查目录权限

#### 6.3 网站访问异常
```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log

# 重启 Nginx
sudo systemctl restart nginx
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

### 8. 性能优化

#### 8.1 启用HTTP/2
在Nginx配置中添加：
```nginx
listen 443 ssl http2;
```

#### 8.2 配置CDN
可以考虑使用阿里云CDN加速静态资源访问。

#### 8.3 监控设置
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