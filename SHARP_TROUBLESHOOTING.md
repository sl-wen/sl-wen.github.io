# Sharp 模块加载问题解决方案

## 问题描述
在 Linux 环境下部署时出现以下错误：
```
Error: Could not load the "sharp" module using the linux-x64 runtime
```

## 常见原因

### 1. 架构不匹配
- 在错误的架构上安装了 Sharp
- Docker 容器内的架构与宿主机不匹配

### 2. 依赖缺失
- 缺少必要的系统库
- libvips 版本不兼容

### 3. 权限问题
- 文件权限不正确
- 用户权限不足

### 4. 缓存问题
- npm 缓存损坏
- 旧的二进制文件残留

## 解决方案

### 方案 1: 使用修复脚本（推荐）
```bash
# 运行自动修复脚本
./scripts/fix-sharp.sh
```

### 方案 2: 手动修复
```bash
# 1. 清理环境
rm -rf node_modules
rm -f package-lock.json

# 2. 设置环境变量
export SHARP_IGNORE_GLOBAL_LIBVIPS=1
export npm_config_platform=linux
export npm_config_arch=x64

# 3. 清理 npm 缓存
npm cache clean --force

# 4. 重新安装
npm install

# 5. 重建 Sharp
npm run sharp:rebuild
```

### 方案 3: Docker 环境修复
```bash
# 在 Dockerfile 中添加以下环境变量
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV npm_config_platform=linux
ENV npm_config_arch=x64

# 在安装依赖后添加
RUN npm rebuild sharp --platform=linux --arch=x64
```

### 方案 4: 系统级修复
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y build-essential libvips-dev

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install vips-devel

# Alpine Linux
apk add --no-cache build-base vips-dev
```

## 验证修复

### 1. 检查 Sharp 安装
```bash
node -e "console.log('Sharp version:', require('sharp').versions.sharp)"
```

### 2. 检查二进制文件
```bash
ls -la node_modules/@img/sharp-linux-x64/lib/
file node_modules/@img/sharp-linux-x64/lib/sharp-linux-x64.node
```

### 3. 测试功能
```bash
node -e "
const sharp = require('sharp');
sharp('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
  .resize(100, 100)
  .toBuffer()
  .then(() => console.log('Sharp 工作正常!'))
  .catch(err => console.error('Sharp 错误:', err));
"
```

## 预防措施

### 1. 在 package.json 中添加脚本
```json
{
  "scripts": {
    "postinstall": "npm run sharp:rebuild",
    "sharp:rebuild": "npm rebuild sharp",
    "sharp:install": "npm install --platform=linux --arch=x64 sharp"
  }
}
```

### 2. 环境变量设置
```bash
# 在 .env 文件中添加
SHARP_IGNORE_GLOBAL_LIBVIPS=1
npm_config_platform=linux
npm_config_arch=x64
```

### 3. Docker 最佳实践
```dockerfile
# 使用多阶段构建
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV npm_config_platform=linux
ENV npm_config_arch=x64
RUN npm ci --only=production && npm rebuild sharp --platform=linux --arch=x64
```

## 常见错误及解决方案

### 错误 1: "Could not load the sharp module"
**原因**: 架构不匹配或二进制文件损坏
**解决**: 重新安装对应架构的 Sharp

### 错误 2: "libvips not found"
**原因**: 缺少 libvips 依赖
**解决**: 安装系统级 libvips 或使用 SHARP_IGNORE_GLOBAL_LIBVIPS=1

### 错误 3: "Permission denied"
**原因**: 文件权限问题
**解决**: 检查文件权限，确保用户有读取权限

### 错误 4: "Module version mismatch"
**原因**: Node.js 版本与 Sharp 版本不兼容
**解决**: 升级或降级 Sharp 版本

## 调试技巧

### 1. 启用详细日志
```bash
export SHARP_LOG_LEVEL=debug
npm install sharp
```

### 2. 检查系统信息
```bash
uname -a
node --version
npm --version
```

### 3. 检查 Sharp 信息
```bash
node -e "console.log(require('sharp').versions)"
```

## 联系支持

如果以上方案都无法解决问题，请提供以下信息：
1. 操作系统版本和架构
2. Node.js 版本
3. 完整的错误日志
4. package.json 内容
5. 安装步骤

## 相关链接

- [Sharp 官方文档](https://sharp.pixelplumbing.com/)
- [Sharp 安装指南](https://sharp.pixelplumbing.com/install)
- [Sharp 故障排除](https://sharp.pixelplumbing.com/install#troubleshooting)