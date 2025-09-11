# CODEBUDDY.md

此文件为 CodeBuddy Code 在本仓库中高效工作提供必要信息。

## 项目概述

这是一个使用 Next.js 14、React 19、TypeScript 和 TailwindCSS 构建的现代化个人博客系统。项目包含用户认证、评论系统、实时统计、PWA 支持和俯视角游戏功能。使用 Supabase 作为后端服务，提供数据库、认证和实时功能。

## 开发命令

### 核心开发
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 清理构建产物
npm run clean
npm run build:clean
```

### 代码质量与测试
```bash
# 运行 ESLint
npm run lint
npm run lint:fast        # 快速检查，最多50个警告
npm run lint:check       # 静默检查

# TypeScript 类型检查
npm run tsc              # 完整类型检查
npm run tsc:fast         # 快速检查，跳过库检查
npm run test:types       # tsc --noEmit 的别名

# 代码格式化
npm run format

# 运行所有测试
npm test                 # 运行资源测试 + 类型检查
npm run test:assets      # 测试游戏资源
```

### 构建变体
```bash
# 快速构建（跳过类型检查）
npm run build:fast
npm run build:light
npm run build:ci         # CI 优化构建

# 静态导出
npm run build:static
npm run export
```

### 游戏开发（俯视角功能）
```bash
# 转换 TMX 地图文件为 JSON
npm run tmx:json
npm run tmx:json:default # 转换默认地图

# 测试游戏系统
npm run test:task        # 测试任务系统
```

### 部署
```bash
# 部署脚本
npm run deploy           # 默认部署
npm run deploy:docker    # Docker 部署
npm run deploy:pm2       # PM2 部署

# Docker 命令
npm run docker:build
npm run docker:run
npm run docker:dev       # 开发环境 docker-compose
npm run docker:prod      # 生产环境 docker-compose
```

### 工具
```bash
# 验证 CSS 路径
npm run validate:css

# Sharp 图片优化
npm run sharp:rebuild
npm run sharp:install
```

## 架构概览

### 前端结构
- **Next.js App Router**: 现代路由系统，使用 `src/app/` 目录结构
- **React 19**: 最新 React，支持并发特性和 hooks
- **TypeScript**: 严格类型检查，自定义接口和工具类型
- **TailwindCSS**: 实用优先的样式系统，自定义配置
- **PWA 支持**: Service Worker、离线功能和移动端优化

### 后端集成
- **Supabase**: PostgreSQL 数据库，支持实时订阅
- **认证**: 基于邮箱的认证，用户资料和会话管理
- **存储**: 文件上传和头像管理
- **实时**: 实时评论、反应和统计

### 核心组件架构

#### 认证系统 (`src/utils/auth-context.tsx`)
- React Context 提供全局认证状态
- 本地存储缓存提升性能
- 自动会话管理和刷新
- 用户资料与任务系统集成

#### 文章系统 (`src/utils/articleService.ts`)
- 博客文章的 CRUD 操作
- 分类和标签管理
- 搜索和过滤功能
- SEO 优化和元数据

#### 评论系统 (`src/components/CommentSection.tsx`)
- 基于 Supabase 订阅的实时评论
- 嵌套回复和反应功能
- 用户认证集成
- 垃圾评论防护和审核

#### 任务/游戏化系统 (`src/utils/task.ts`)
- 用户进度和成就追踪
- 每日登录奖励和经验值
- 基于等级的进度系统
- 与用户资料集成

### 数据库架构 (Supabase)
主要表结构：
- `profiles`: 用户资料和游戏化数据
- `articles`: 博客文章和元数据
- `comments`: 层级评论系统
- `reactions`: 文章和评论的点赞/反应
- `user_tasks`: 任务进度和成就
- `categories`: 文章分类

### 性能优化
- **动态导入**: 组件代码分割
- **图片优化**: Next.js Image 组件配合 Sharp
- **字体加载**: Inter 字体，display swap 策略
- **资源预加载**: 关键 CSS 和字体预加载
- **缓存**: 用户数据本地存储和 Service Worker 缓存

### 开发规范

#### TypeScript 标准 (来自 `.cursor/rules/typescript-rules.mdc`)
- 使用 2 空格缩进
- 优先使用 `const` 声明
- 显式声明函数返回类型
- 避免 `any` 类型
- 接口优于类型别名
- 合理使用泛型

#### 代码组织
- 组件放在 `src/components/`，清晰分离 UI 和业务逻辑
- 工具函数放在 `src/utils/`，提供共享功能
- App Router 页面放在 `src/app/`，遵循 Next.js 14 约定
- 自定义 hooks 放在 `src/hooks/`，可复用逻辑

#### 环境配置
- 环境变量配置在 `.env.local`
- Supabase 配置在 `src/utils/supabase-config.ts`
- 使用 cross-env 进行构建时优化

### 特殊功能

#### 俯视角游戏
- Phaser 3 游戏引擎集成
- TMX 地图文件支持和转换脚本
- 网格化移动系统
- 资源管理和测试工具

#### PWA 功能
- Service Worker 离线功能
- 推送通知支持
- 移动端类应用体验
- 自定义启动画面和图标

#### 实时功能
- 实时评论更新
- 实时统计数据
- 用户在线状态
- 即时反应和反馈

### 常见开发任务

在此代码库中工作时：

1. **添加新功能**: 遵循现有组件模式，使用 TypeScript 接口
2. **数据库变更**: 更新 Supabase 架构和对应的 TypeScript 类型
3. **样式设计**: 使用 TailwindCSS 工具类，遵循现有设计系统
4. **性能优化**: 提交前务必运行 `npm run tsc` 和 `npm run lint`
5. **测试验证**: 使用 `npm test` 验证资源和类型安全

### 环境配置

`.env.local` 中需要的环境变量：
- Supabase URL 和 API 密钥
- 第三方服务配置
- 开发环境特定设置

项目使用 Supabase 作为后端服务，请确保在 `src/utils/supabase-config.ts` 中正确配置。

## CodeBuddy Added Memories
- to memorize
- User prefers Phaser topdown project; continue development within existing GameScene/FarmManager/FarmlandIcon architecture.
