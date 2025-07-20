# 🔄 多仓库部署配置指南

## 📋 概述

本项目采用前后端分离架构，前端和后端分别在不同的GitHub仓库中。本文档说明如何配置多仓库的自动部署。

## 🏗️ 仓库结构

```
前端仓库: sl-wen/sl-wen.github.io (当前仓库)
├── 分支: react (部署分支)
├── 技术栈: React + Next.js
└── 部署端口: 3000

后端仓库: sl-wen/novel
├── 分支: main (部署分支)
├── 技术栈: Python API
└── 部署端口: 8000
```

## ⚙️ 部署配置

### 前端仓库配置 (当前仓库)

#### 1. 自动部署工作流

**文件**: `.github/workflows/deploy-frontend.yml`

**触发条件**:
- 推送到 `react` 分支时自动触发
- 支持手动触发

**功能**:
- 拉取最新前端代码
- 安装依赖
- 构建应用
- 重启前端服务
- 重启Nginx

#### 2. 全栈部署工作流

**文件**: `.github/workflows/deploy-full-stack.yml`

**触发条件**:
- 推送到 `react` 分支时触发前端部署
- 手动触发时可选择部署前端和/或后端

**功能**:
- 前端部署（同上述）
- 后端部署（手动触发）
- Nginx配置
- 健康检查

### 后端仓库配置

#### 1. 后端专用部署工作流

**文件**: `.github/workflows/deploy-backend-only.yml` (需要复制到后端仓库)

**触发条件**:
- 推送到 `main` 分支时自动触发
- 支持手动触发

**功能**:
- 拉取最新后端代码
- 更新Python虚拟环境
- 安装依赖
- 数据库迁移（如果有）
- 重启后端服务
- 重启Nginx

## 🚀 部署流程

### 前端部署流程

1. **推送代码到 `react` 分支**
   ```bash
   git checkout react
   git add .
   git commit -m "更新前端代码"
   git push origin react
   ```

2. **自动触发部署**
   - GitHub Actions 自动检测到推送
   - 执行 `deploy-frontend.yml` 工作流
   - 部署到服务器的 `/var/www/blog` 目录

### 后端部署流程

#### 方案一：自动部署（推荐）

1. **在后端仓库中配置工作流**
   - 将 `deploy-backend-only.yml` 复制到后端仓库的 `.github/workflows/` 目录
   - 配置相同的 GitHub Secrets

2. **推送代码到 `main` 分支**
   ```bash
   git checkout main
   git add .
   git commit -m "更新后端代码"
   git push origin main
   ```

3. **自动触发部署**
   - GitHub Actions 自动检测到推送
   - 执行 `deploy-backend-only.yml` 工作流
   - 部署到服务器的 `/var/www/novel` 目录

#### 方案二：手动部署

1. **在前端仓库中手动触发**
   - 进入 GitHub Actions 页面
   - 选择 "Deploy Full Stack Application" 工作流
   - 点击 "Run workflow"
   - 选择 "deploy_backend: true"

## 🔧 配置步骤

### 1. 服务器初始化

在两个仓库中都可以使用相同的服务器初始化脚本：

```bash
# 在服务器上运行
wget https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/scripts/init-server-fullstack.sh
chmod +x init-server-fullstack.sh
./init-server-fullstack.sh
```

### 2. GitHub Secrets 配置

#### 前端仓库 Secrets
```
SERVER_IP=你的服务器IP地址
SERVER_USER=服务器用户名
SERVER_PASSWORD=服务器密码
```

#### 后端仓库 Secrets
```
SERVER_IP=你的服务器IP地址
SERVER_USER=服务器用户名
SERVER_PASSWORD=服务器密码
```

### 3. 项目克隆

```bash
# 克隆前端项目
git clone git@github.com:sl-wen/sl-wen.github.io.git /var/www/blog
cd /var/www/blog && git checkout react

# 克隆后端项目
git clone git@github.com:sl-wen/novel.git /var/www/novel
cd /var/www/novel && git checkout main
```

## 📊 服务管理

### 查看服务状态

```bash
# 查看所有服务
sudo systemctl status blog novel-api nginx

# 查看前端服务
sudo systemctl status blog

# 查看后端服务
sudo systemctl status novel-api
```

### 服务操作

```bash
# 启动所有服务
sudo systemctl start blog novel-api nginx

# 停止所有服务
sudo systemctl stop blog novel-api nginx

# 重启所有服务
sudo systemctl restart blog novel-api nginx
```

### 查看日志

```bash
# 前端日志
sudo journalctl -u blog -f

# 后端日志
sudo journalctl -u novel-api -f

# Nginx日志
sudo tail -f /var/log/nginx/access.log
```

## 🌐 访问地址

- **前端应用**: `http://your-server-ip`
- **后端API**: `http://your-server-ip/api/`

## 🔄 部署策略

### 独立部署

- **前端**: 推送到 `react` 分支自动部署
- **后端**: 推送到 `main` 分支自动部署

### 联合部署

- 使用前端仓库的 "Deploy Full Stack Application" 工作流
- 手动触发，可选择部署前端和/或后端

### 回滚策略

```bash
# 前端回滚
cd /var/www/blog
git log --oneline -n 5
git reset --hard <commit-hash>
npm run build
sudo systemctl restart blog

# 后端回滚
cd /var/www/novel
git log --oneline -n 5
git reset --hard <commit-hash>
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart novel-api
```

## 🛠️ 故障排除

### 常见问题

1. **SSH连接问题**
   ```bash
   ssh-keyscan -H github.com >> ~/.ssh/known_hosts
   ssh -T git@github.com
   ```

2. **权限问题**
   ```bash
   sudo chown -R www-data:www-data /var/www/blog
   sudo chown -R www-data:www-data /var/www/novel
   ```

3. **端口冲突**
   ```bash
   sudo netstat -tlnp | grep :3000
   sudo netstat -tlnp | grep :8000
   ```

4. **服务启动失败**
   ```bash
   sudo systemctl status blog --no-pager
   sudo systemctl status novel-api --no-pager
   ```

### 一键修复

```bash
# 运行部署脚本
sudo /usr/local/bin/deploy-fullstack
```

## 📝 最佳实践

1. **分支管理**
   - 前端使用 `react` 分支作为部署分支
   - 后端使用 `main` 分支作为部署分支
   - 开发时使用其他分支

2. **提交信息**
   - 使用清晰的提交信息
   - 包含功能描述和影响范围

3. **测试**
   - 部署前在本地测试
   - 使用 staging 环境进行预发布测试

4. **监控**
   - 定期检查服务状态
   - 监控系统资源使用
   - 设置告警机制

## 📞 支持

如果遇到问题：

1. 检查 GitHub Actions 部署日志
2. 查看服务器服务状态和日志
3. 参考 `DEPLOYMENT.md` 和 `FULLSTACK_DEPLOYMENT.md`
4. 确认所有配置文件正确

---

**🎉 配置完成后，您就可以通过推送代码到对应分支来自动部署前后端应用了！** 