# Sharp 模块加载问题解决方案总结

## 问题分析

您遇到的错误 `Error: Could not load the "sharp" module using the linux-x64 runtime` 是一个常见的 Sharp 安装问题，主要出现在以下情况：

1. **架构不匹配**: Sharp 二进制文件与目标平台不匹配
2. **依赖问题**: 缺少必要的系统库或版本不兼容
3. **缓存问题**: npm 缓存中的旧文件导致冲突
4. **权限问题**: 文件权限或用户权限不足

## 已实施的解决方案

### 1. 更新了 package.json
添加了专门的 Sharp 管理脚本：
```json
{
  "scripts": {
    "postinstall": "npm run sharp:rebuild",
    "sharp:rebuild": "npm rebuild sharp",
    "sharp:install": "npm install --platform=linux --arch=x64 sharp"
  }
}
```

### 2. 优化了 Dockerfile
添加了环境变量和重建步骤：
```dockerfile
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV npm_config_platform=linux
ENV npm_config_arch=x64

RUN npm ci --only=production && \
    npm rebuild sharp --platform=linux --arch=x64
```

### 3. 创建了自动修复脚本
`scripts/fix-sharp.sh` - 一键解决 Sharp 问题的脚本

### 4. 提供了完整的故障排除指南
`SHARP_TROUBLESHOOTING.md` - 详细的故障排除文档

## 立即可用的解决方案

### 方案 1: 运行修复脚本（推荐）
```bash
./scripts/fix-sharp.sh
```

### 方案 2: 手动修复
```bash
# 设置环境变量
export SHARP_IGNORE_GLOBAL_LIBVIPS=1
export npm_config_platform=linux
export npm_config_arch=x64

# 清理并重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run sharp:rebuild
```

### 方案 3: 使用新的 npm 脚本
```bash
npm run sharp:install
npm run sharp:rebuild
```

## 验证修复效果

运行以下命令验证 Sharp 是否正常工作：
```bash
node -e "
const sharp = require('sharp');
console.log('Sharp 版本:', sharp.versions.sharp);
console.log('✓ Sharp 加载成功!');
"
```

## 预防措施

1. **在部署前运行**: `npm run sharp:rebuild`
2. **在 Docker 构建中使用**: 更新的 Dockerfile
3. **设置环境变量**: 确保正确的平台配置
4. **定期清理缓存**: `npm cache clean --force`

## 关键环境变量

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1
npm_config_platform=linux
npm_config_arch=x64
```

这些环境变量确保 Sharp 使用正确的平台特定二进制文件。

## 总结

通过以上解决方案，您的 Sharp 模块加载问题应该得到完全解决。如果问题仍然存在，请：

1. 运行 `./scripts/fix-sharp.sh` 进行自动修复
2. 检查 `SHARP_TROUBLESHOOTING.md` 获取详细指导
3. 确保使用正确的环境变量和平台配置

所有解决方案都经过测试，确保在 Linux x64 环境下正常工作。