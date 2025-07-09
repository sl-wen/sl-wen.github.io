# 部署指南

## 概述

本项目使用 GitHub Actions 自动部署到 Ubuntu 24.04 服务器。当代码推送到 `react` 分支时，会自动触发部署流程。

## 服务器要求

- Ubuntu 24.04 LTS
- Node.js 18+ 
- PM2 或 systemd 服务管理
- Nginx (可选，用于反向代理)
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

运行初始化脚本：

```bash
chmod +x init-server.sh
./init-server.sh
```

### 3. Git 配置修复

如果遇到 SSH 密钥问题，可以手动将远程仓库设置为 HTTPS：

```bash
cd /var/www/blog
git remote set-url origin https://github.com/sl-wen/sl-wen.github.io.git
```

### 4. 服务配置

创建 systemd 服务文件 `/etc/systemd/system/blog.service`：

```ini
[Unit]
Description=Blog Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/blog
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable blog
sudo systemctl start blog
```

## 部署流程

### 自动部署

1. 代码推送到 `react` 分支
2. GitHub Actions 触发部署
3. SSH 连接到服务器
4. 拉取最新代码
5. 安装依赖（如有变化）
6. 构建应用
7. 重启服务
8. 验证部署

### 手动部署

也可以在 GitHub Actions 页面手动触发部署。

## 常见问题和解决方案

### 1. SSH 密钥问题

**问题**: `Permission denied (publickey)`

**解决方案**:
- 确保服务器上的 Git 配置使用 HTTPS 而非 SSH
- 更新的部署脚本会自动处理这个问题

### 2. ESLint 依赖缺失

**问题**: `Cannot find module 'eslint-plugin-react-hooks'`

**解决方案**:
- 更新的部署脚本会自动安装缺失的开发依赖
- 或手动安装：`npm install --save-dev eslint-plugin-react-hooks`

### 3. 内存不足

**问题**: 构建过程中内存不足

**解决方案**:
- 部署脚本已设置 `NODE_OPTIONS="--max-old-space-size=512"`
- 如果仍有问题，可增加交换空间

### 4. 端口冲突

**问题**: 端口 3000 被占用

**解决方案**:
```bash
sudo netstat -tlnp | grep :3000
sudo systemctl stop blog
sudo systemctl start blog
```

### 5. 服务启动失败

**问题**: 服务无法启动

**解决方案**:
```bash
sudo journalctl -u blog -f  # 查看实时日志
sudo systemctl status blog  # 查看服务状态
```

## 部署后验证

部署完成后，脚本会自动进行以下验证：

1. ✅ 服务状态检查
2. ✅ 端口监听检查
3. ✅ 应用响应检查
4. ✅ 内存使用监控

## 性能监控

### 内存使用

部署脚本会显示内存使用情况：
```bash
内存使用: 445Mi/1.6Gi
```

### 服务状态

```bash
sudo systemctl status blog
```

### 应用日志

```bash
sudo journalctl -u blog --since "1 hour ago"
```

## 回滚

如果新版本有问题，可以回滚到上一个版本：

```bash
cd /var/www/blog
git log --oneline -n 5  # 查看最近的提交
git reset --hard <commit-hash>  # 回滚到指定提交
npm run build
sudo systemctl restart blog
```

## 升级维护

### Node.js 升级

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 依赖更新

```bash
cd /var/www/blog
npm update
npm audit fix
```

## 安全建议

1. 定期更新服务器系统：`sudo apt update && sudo apt upgrade`
2. 配置防火墙：只开放必要端口
3. 使用 SSH 密钥认证而非密码
4. 定期备份应用数据和配置

## 联系支持

如果遇到部署问题，请：

1. 检查 GitHub Actions 的部署日志
2. 查看服务器上的应用日志
3. 确认所有配置文件正确
4. 参考本文档的故障排除部分 