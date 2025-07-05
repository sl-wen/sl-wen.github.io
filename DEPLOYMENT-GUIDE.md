# Ubuntu 24.04 部署指南

## 📋 概述

这是一套完整的Ubuntu 24.04服务器部署解决方案，专门针对内存不足导致的`SIGKILL`错误进行了优化。

## 🚀 快速开始

### 方法1：自动部署（推荐）
GitHub Actions会自动运行优化部署，无需手动操作。

### 方法2：一键部署
如果需要手动部署，使用一键部署脚本：
```bash
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/deploy-with-optimization.sh | sudo bash
```

### 方法3：分步部署
如果需要更精细的控制，可以分步执行：

```bash
# 1. 内存优化
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/optimize-memory.sh | sudo bash

# 2. 检查状态
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/check-deployment-status.sh | bash

# 3. 如果有问题，运行修复脚本
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/fix-deployment-issues.sh | sudo bash
```

## 📚 脚本说明

### 1. `optimize-memory.sh` - 内存优化脚本
**功能：**
- 创建1GB交换空间
- 清理系统缓存
- 停止不必要的服务
- 优化内存管理参数
- 动态调整Node.js内存限制

**使用场景：**
- 部署前优化内存环境
- 解决内存不足问题
- 提高系统稳定性

### 2. `check-deployment-status.sh` - 部署状态检查
**功能：**
- 检查系统资源状态
- 监控服务运行状态
- 测试应用响应
- 查看最近日志
- 生成优化建议

**使用场景：**
- 快速检查部署状态
- 诊断问题
- 监控系统健康

### 3. `fix-deployment-issues.sh` - 问题修复脚本
**功能：**
- 强制清理残留进程
- 重新安装依赖
- 重新构建应用
- 修复服务配置
- 恢复系统状态

**使用场景：**
- 部署失败后的修复
- 清理系统状态
- 重置部署环境

### 4. `deploy-with-optimization.sh` - 一键部署脚本
**功能：**
- 集成所有优化措施
- 完整的部署流程
- 自动错误处理
- 部署状态验证

**使用场景：**
- 手动完整部署
- 替代GitHub Actions
- 本地部署测试

### 5. `monitor-deployment.sh` - 详细监控脚本
**功能：**
- 深度系统监控
- 详细诊断报告
- 性能分析
- 问题定位

**使用场景：**
- 深度问题诊断
- 性能监控
- 系统分析

## 🔧 GitHub Actions 工作流

### 优化特性
- **内存管理**：自动内存优化和监控
- **进程管理**：温和终止 + 强制清理
- **错误处理**：自动备份和回滚
- **超时控制**：防止构建卡死
- **分阶段部署**：逐步验证每个步骤

### 触发条件
- 推送到`react`分支
- 手动触发（workflow_dispatch）

## 🛠️ 故障排除

### 常见问题

#### 1. 内存不足 (SIGKILL)
**症状：** `Process exited with status 137`
**解决：**
```bash
# 运行内存优化
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/optimize-memory.sh | sudo bash

# 检查内存状态
free -h
```

#### 2. 服务启动失败
**症状：** blog服务inactive或failed
**解决：**
```bash
# 检查服务状态
systemctl status blog

# 查看日志
journalctl -u blog -n 20

# 重启服务
sudo systemctl restart blog
```

#### 3. 端口未监听
**症状：** 端口3000或80无响应
**解决：**
```bash
# 检查端口状态
netstat -tlnp | grep -E ":(80|3000)"

# 检查应用状态
curl http://localhost:3000
```

#### 4. 构建失败
**症状：** npm run build失败
**解决：**
```bash
# 清理缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build
```

### 诊断命令

```bash
# 快速状态检查
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/check-deployment-status.sh | bash

# 详细系统监控
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/monitor-deployment.sh | bash

# 实时监控
watch -n 5 'curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/check-deployment-status.sh | bash'
```

## 📊 系统要求

### 最低要求
- **内存：** 1GB (建议2GB)
- **磁盘：** 10GB可用空间
- **CPU：** 1核心

### 推荐配置
- **内存：** 2GB或以上
- **磁盘：** 20GB SSD
- **CPU：** 2核心

## 🔐 安全考虑

### 防火墙设置
```bash
# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS (如果使用SSL)
sudo ufw enable
```

### 权限管理
- 脚本需要sudo权限运行
- 应用文件属于非root用户
- 系统服务以受限用户运行

## 📈 性能优化

### 内存优化
- 自动创建交换空间
- 清理系统缓存
- 优化内存参数
- 动态调整Node.js限制

### 构建优化
- 使用production模式
- 启用缓存清理
- 设置构建超时
- 分阶段构建验证

## 🆘 紧急恢复

如果部署完全失败，可以使用紧急恢复：

```bash
# 停止所有服务
sudo systemctl stop blog nginx

# 清理所有进程
sudo pkill -f "next start"
sudo pkill -f "npm start"

# 运行完整修复
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/fix-deployment-issues.sh | sudo bash

# 重新初始化（如果需要）
curl -sSL https://raw.githubusercontent.com/sl-wen/sl-wen.github.io/react/init-server.sh | bash
```

## 📞 支持

如果遇到问题，请：
1. 运行诊断脚本收集信息
2. 检查GitHub Actions日志
3. 查看系统日志
4. 提供详细的错误信息

## 🔄 更新日志

### v2.0 (当前版本)
- ✅ 完整的内存优化解决方案
- ✅ 自动备份和回滚机制
- ✅ 分阶段部署验证
- ✅ 详细的监控和诊断
- ✅ 一键部署脚本

### v1.0 (之前版本)
- ❌ 内存不足导致SIGKILL错误
- ❌ 缺少错误处理机制
- ❌ 监控和诊断不足 