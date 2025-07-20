# 🚀 全栈应用部署指南

## 📋 概述

本指南将帮助您将前端（React + Next.js）和后端（Python API）应用部署到同一台Ubuntu服务器上。

## 🎯 部署架构

```
用户请求 → Nginx (80端口) → 前端应用 (3000端口) / 后端API (8000端口)
```

## ⚡ 快速部署

### 1. 服务器准备

在Ubuntu服务器上运行：

```bash
# 下载并运行初始化脚本
wget https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/scripts/init-server-fullstack.sh
chmod +x init-server-fullstack.sh
./init-server-fullstack.sh
```

### 2. 克隆项目

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

### 3. 配置GitHub Secrets

在**前端仓库**设置中添加：

- `SERVER_IP`: 服务器IP地址
- `SERVER_USER`: 服务器用户名
- `SERVER_PASSWORD`: 服务器密码

### 4. 触发部署

#### 前端部署（自动）
推送代码到 `react` 分支，会自动触发前端部署

#### 后端部署（手动）
在GitHub Actions页面手动触发，选择"Deploy Full Stack Application"工作流

## 🔧 手动部署

### 前端部署

```bash
cd /var/www/blog
git pull origin react
npm install
npm run build
sudo systemctl restart blog
```

### 后端部署

```bash
cd /var/www/novel
git pull origin main

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 重启服务
sudo systemctl restart novel-api
```

### 重启Nginx

```bash
sudo systemctl restart nginx
```

## 📊 服务管理

```bash
# 查看所有服务状态
sudo systemctl status blog novel-api nginx

# 启动所有服务
sudo systemctl start blog novel-api nginx

# 停止所有服务
sudo systemctl stop blog novel-api nginx

# 重启所有服务
sudo systemctl restart blog novel-api nginx
```

## 🔍 监控和日志

```bash
# 查看前端日志
sudo journalctl -u blog -f

# 查看后端日志
sudo journalctl -u novel-api -f

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🌐 访问地址

- **前端应用**: `http://your-server-ip`
- **后端API**: `http://your-server-ip/api/`

## 🛠️ 故障排除

### 常见问题

1. **服务无法启动**
   ```bash
   sudo systemctl status blog --no-pager
   sudo journalctl -u blog --no-pager -n 50
   ```

2. **端口被占用**
   ```bash
   sudo netstat -tlnp | grep :3000
   sudo netstat -tlnp | grep :8000
   ```

3. **权限问题**
   ```bash
   sudo chown -R www-data:www-data /var/www/blog
   sudo chown -R www-data:www-data /var/www/novel
   ```

4. **SSH连接问题**
   ```bash
   ssh-keyscan -H github.com >> ~/.ssh/known_hosts
   ssh -T git@github.com
   ```

### 一键修复

```bash
# 运行部署脚本
sudo /usr/local/bin/deploy-fullstack
```

## 📁 文件结构

```
/var/www/
├── blog/          # 前端项目
│   ├── .next/     # Next.js构建文件
│   ├── src/       # 源代码
│   └── package.json
└── novel/         # 后端项目
    ├── venv/      # Python虚拟环境
    ├── app.py     # 主应用文件
    └── requirements.txt
```

## 🔒 安全建议

1. **配置防火墙**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw --force enable
   ```

2. **定期更新**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

3. **备份数据**
   ```bash
   sudo /usr/local/bin/backup-fullstack
   ```

## 📞 支持

如果遇到问题：

1. 检查GitHub Actions部署日志
2. 查看服务器服务状态
3. 参考完整部署文档：`DEPLOYMENT.md`
4. 检查服务日志获取详细错误信息

---

**🎉 部署完成后，您的全栈应用就可以通过 `http://your-server-ip` 访问了！** 