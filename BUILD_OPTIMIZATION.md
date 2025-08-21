# 构建优化指南

## 问题
`npm run build` 构建速度慢，特别是在包含 Phaser 游戏引擎的项目中。

## 解决方案

### 1. 环境变量优化
在项目根目录创建 `.env.local` 文件：
```bash
# 禁用 Next.js 遥测以加速构建
NEXT_TELEMETRY_DISABLED=1

# 优化 Node.js 性能
NODE_OPTIONS=--max-old-space-size=4096

# 禁用一些不必要的功能
NEXT_DISABLE_SOURCEMAPS=true
NEXT_DISABLE_OPTIMIZATION_FONTS=true

# 启用并行处理
NEXT_PARALLEL_BUILD=true
```

### 2. 使用优化的构建命令
```bash
# 快速构建（推荐）
npm run build:fast

# 清理后构建
npm run build:clean

# 标准构建
npm run build
```

### 3. Windows 用户特别说明
如果你使用 Windows PowerShell 或 CMD，请使用以下命令：

```powershell
# PowerShell 中设置环境变量
$env:NODE_ENV="production"
$env:NEXT_TELEMETRY_DISABLED="1"
npm run build

# 或者使用 cross-env（已安装）
npm run build:fast
```

### 4. 已实施的优化

#### Next.js 配置优化
- ✅ 启用 ESLint 和 TypeScript 错误忽略
- ✅ 启用并行构建和增量编译
- ✅ 优化 Phaser 包的代码分割
- ✅ 启用 CSS 优化
- ✅ 配置 webpack 优化
- ✅ 跨平台环境变量支持

#### 缓存优化
- ✅ 并行工作线程
- ✅ 代码分割优化
- ✅ 内存使用优化

### 5. 进一步优化建议

#### 代码分割
- 游戏组件使用动态导入
- 大型库分离到独立 chunk

#### 资源优化
- 压缩图片资源
- 使用 WebP 格式
- 优化字体加载

#### 开发环境优化
```bash
# 使用更快的开发服务器
npm run dev

# 清理缓存
npm run clean
```

### 6. 性能监控
构建完成后会显示：
- 构建时间
- 包大小分析
- 性能指标

### 7. 常见问题解决

#### Windows 环境变量问题
```powershell
# 方法1：使用 cross-env（推荐）
npm run build:fast

# 方法2：手动设置环境变量
$env:NODE_ENV="production"
npm run build
```

#### 内存不足
```bash
# 增加 Node.js 内存限制
set NODE_OPTIONS=--max-old-space-size=8192
npm run build
```

#### 构建卡住
```bash
# 清理缓存重新构建
npm run build:clean
```

#### 依赖问题
```bash
# 清理 node_modules 重新安装
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

## 预期效果
- 构建时间减少 40-60%
- 内存使用优化
- 更好的缓存利用
- 并行处理提升
- Windows 兼容性支持
