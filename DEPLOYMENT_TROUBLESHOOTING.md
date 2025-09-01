# 部署问题排查指南

## SWC 依赖超时错误

### 问题描述
```
err: ⚠ Lockfile was successfully patched, please run "npm install" to ensure @next/swc dependencies are downloaded
```

### 原因分析
这个错误通常发生在以下情况：
1. Next.js 版本更新后，SWC 编译器依赖没有正确安装
2. package-lock.json 文件损坏或不完整
3. npm 缓存问题导致依赖安装不完整
4. 服务器内存不足导致安装超时

### 解决方案

#### 1. 自动修复（推荐）
GitHub Actions 工作流已经更新，会自动处理以下步骤：
- 清理构建缓存
- 删除并重新生成 package-lock.json
- 强制重新安装所有依赖
- 专门检查并安装 @next/swc 依赖
- 增加构建超时时间和内存限制

#### 2. 手动修复
如果自动修复失败，可以在服务器上手动运行修复脚本：

```bash
# 进入项目目录
cd /var/www/blog

# 运行修复脚本
./scripts/fix-swc-deps.sh
```

#### 3. 手动步骤
如果脚本不可用，可以手动执行以下步骤：

```bash
# 停止服务
sudo systemctl stop blog

# 清理缓存
rm -rf .next
rm -rf node_modules/.cache
rm -f package-lock.json

# 清理 npm 缓存
npm cache clean --force

# 重新安装依赖
npm install --production=false --prefer-offline=false

# 检查 SWC 依赖
npm list @next/swc

# 如果缺失，强制安装
npm install @next/swc --force

# 测试构建
export NODE_OPTIONS="--max-old-space-size=1024"
npm run build:fast

# 启动服务
sudo systemctl start blog
```

### 预防措施

#### 1. 更新 package.json
确保使用最新的稳定版本：

```json
{
  "dependencies": {
    "next": "^15.5.2",
    "react": "^19.1.1",
    "react-dom": "^19.1.1"
  }
}
```

#### 2. 配置构建优化
在 `next.config.js` 中添加：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 SWC 压缩
  swcMinify: true,
  
  // 优化构建性能
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lodash', 'react-icons'],
  },
  
  // 增加内存限制
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};
```

#### 3. 服务器配置
确保服务器有足够的内存和磁盘空间：

```bash
# 检查内存使用
free -h

# 检查磁盘空间
df -h

# 清理系统缓存
sudo apt-get clean
sudo apt-get autoremove
```

### 常见错误及解决方案

#### 1. 内存不足错误
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

**解决方案：**
```bash
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build
```

#### 2. 网络超时错误
```
npm ERR! network timeout at: https://registry.npmjs.org/
```

**解决方案：**
```bash
# 使用国内镜像
npm config set registry https://registry.npmmirror.com/

# 或使用 yarn
yarn install
```

#### 3. 权限错误
```
npm ERR! EACCES: permission denied
```

**解决方案：**
```bash
# 修复 npm 权限
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config

# 或使用 nvm
nvm use node
```

### 监控和日志

#### 1. 查看构建日志
```bash
# 查看详细构建日志
npm run build 2>&1 | tee build.log

# 查看服务日志
sudo journalctl -u blog -f
```

#### 2. 监控资源使用
```bash
# 监控内存使用
watch -n 1 'free -h'

# 监控磁盘使用
watch -n 1 'df -h'

# 监控进程
htop
```

### 联系支持

如果问题仍然存在，请提供以下信息：
1. 完整的错误日志
2. 服务器配置信息（内存、CPU、磁盘）
3. Node.js 和 npm 版本
4. package.json 内容
5. 构建日志文件

---

## 其他常见问题

### 1. 端口占用
```bash
# 检查端口占用
sudo netstat -tlnp | grep :3000

# 杀死占用进程
sudo kill -9 <PID>
```

### 2. 服务启动失败
```bash
# 查看服务状态
sudo systemctl status blog

# 查看详细日志
sudo journalctl -u blog --no-pager -l
```

### 3. 静态资源加载失败
检查 nginx 配置和文件权限：
```bash
# 检查 nginx 配置
sudo nginx -t

# 检查文件权限
ls -la /var/www/blog/.next/
```