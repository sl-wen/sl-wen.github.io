# 鱼鱼的博客 - AI驱动的现代化个人博客系统

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.13-38B2AC)](https://tailwindcss.com/)
[![Phaser](https://img.shields.io/badge/Phaser-3.90.0-8AC926)](https://phaser.io/)
[![License](https://img.shields.io/badge/License-ISC-green)](https://github.com/sl-wen/sl-wen.github.io)

## 🚀 项目简介

这是一个AI驱动的现代化个人博客系统，采用最新的Web技术栈构建。项目不仅提供了完整的博客功能，还集成了AI工具集合、游戏功能、实时统计等高级特性，打造一个多功能的个人数字空间。

### ✨ 核心特性

- 📝 **文章管理**: 支持Markdown编辑、分类管理、标签系统
- 🔐 **用户认证**: 基于Supabase的完整用户系统
- 💬 **评论系统**: 实时评论、点赞、回复功能
- 🔍 **智能搜索**: 全文搜索、分类筛选
- 📱 **PWA支持**: 离线访问、推送通知
- 🌙 **响应式设计**: 完美适配各种设备
- ⚡ **性能优化**: SSR、图片优化、缓存策略
- 📊 **实时统计**: 访问量统计、文章计数
- 🎨 **现代化UI**: 动态背景、流畅动画
- 🤖 **AI工具集**: 图像转文字、密码生成、格式转换等AI工具
- 🎮 **游戏功能**: 基于Phaser的2D游戏引擎
- 🛠️ **开发者工具**: 代码格式化、JSON处理、加密解密等实用工具

## 🛠️ 技术栈

### 前端技术
- **框架**: React 19.1.1 + Next.js 15.5.3
- **语言**: TypeScript 5.9.2
- **样式**: TailwindCSS 4.1.13 + PostCSS
- **状态管理**: React Context + Hooks
- **路由**: Next.js App Router
- **游戏引擎**: Phaser 3.90.0

### 后端服务
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **实时功能**: Supabase Realtime

### AI与工具集成
- **图像处理**: Tesseract.js (OCR)
- **背景移除**: @imgly/background-removal
- **UI组件**: Material-UI + Emotion
- **动画**: Framer Motion
- **PWA支持**: next-pwa

### 开发工具
- **代码质量**: ESLint 9.35.0 + Prettier 3.6.2
- **类型检查**: TypeScript 5.9.2
- **构建工具**: Next.js 15.5.3
- **包管理**: npm

### 部署环境
- **服务器**: Ubuntu 24.04
- **反向代理**: Nginx
- **进程管理**: PM2
- **CI/CD**: GitHub Actions

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Supabase 账户

### 本地开发

```bash
# 克隆项目
git clone https://github.com/sl-wen/sl-wen.github.io.git
cd sl-wen.github.io

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，添加你的 Supabase 配置

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── about/             # 关于页面
│   ├── article/           # 文章详情页（含编辑功能）
│   ├── category/          # 分类页面
│   ├── globals.css        # 全局样式
│   ├── img/               # 图像处理工具
│   ├── img2json/          # 图像转JSON工具
│   ├── layout.tsx         # 根布局
│   ├── login/             # 登录页面
│   ├── novel/             # 小说阅读器
│   ├── page.tsx           # 首页
│   ├── post/              # 发布文章页面
│   ├── privacy/           # 隐私政策页面
│   ├── profile/           # 用户资料页面
│   ├── search/            # 搜索页面
│   ├── settings/          # 设置页面
│   ├── terms/             # 服务条款页面
│   ├── tools/             # 工具集合
│   │   ├── api/           # API测试工具
│   │   ├── base64/        # Base64编码/解码
│   │   ├── color/         # 颜色工具
│   │   ├── convert/       # 格式转换
│   │   ├── crypto/        # 加密/解密
│   │   ├── diff/          # 文本差异对比
│   │   ├── formatter/     # 代码格式化
│   │   ├── hash/          # 哈希计算
│   │   ├── img2text/      # 图像转文字（AI）
│   │   ├── json/          # JSON处理
│   │   ├── mortgage/      # 房贷计算器
│   │   ├── password/      # 密码生成器
│   │   ├── qr/            # QR码生成
│   │   ├── rates/         # 汇率转换
│   │   ├── savings/       # 储蓄计算器
│   │   └── timestamp/     # 时间戳转换
│   └── topdown/           # Phaser游戏
├── components/             # React 组件
│   ├── ui/                # 基础UI组件
│   ├── ArticleCard.tsx    # 文章卡片组件
│   ├── ArticleList.tsx    # 文章列表组件
│   ├── CommentSection.tsx # 评论系统组件
│   ├── Footer.tsx         # 页脚组件
│   ├── Header.tsx         # 头部导航组件
│   ├── Loading.tsx        # 加载组件
│   ├── StatusMessages.tsx # 状态消息组件
│   ├── TaskHistory.tsx    # 任务历史组件
│   ├── TaskProgress.tsx   # 任务进度组件
│   └── ErrorBoundary.tsx  # 错误边界组件
├── hooks/                 # 自定义React Hooks
│   ├── useHomeData.ts     # 首页数据Hook
│   └── usePWA.ts          # PWA功能Hook
└── utils/                 # 工具函数和服务
    ├── articleService.ts   # 文章服务
    ├── auth-context.tsx   # 认证上下文
    ├── commentService.ts  # 评论服务
    ├── reactionService.ts # 反应服务
    ├── stats.ts           # 统计服务
    ├── supabase-config.ts # Supabase配置
    ├── cache.ts           # 缓存管理
    ├── optimization.ts    # 性能优化
    ├── performance.ts     # 性能监控
    ├── preloader.ts       # 资源预加载
    └── task.ts            # 任务管理
```

## 🔧 开发工具

### 代码质量检查

```bash
# 运行 ESLint 检查
npm run lint

# 快速 ESLint 检查（带警告限制）
npm run lint:fast

# 严格 ESLint 检查（无警告）
npm run lint:check

# 自动修复 ESLint 问题
npm run lint -- --fix

# 代码格式化
npm run format

# TypeScript 类型检查
npm run tsc

# 快速 TypeScript 类型检查
npm run tsc:fast
```

### 构建和优化

```bash
# 标准构建
npm run build

# 快速构建（跳过类型检查）
npm run build:fast

# 轻量构建（跳过类型检查）
npm run build:light

# 静态导出构建
npm run build:static

# 清理构建文件
npm run clean

# 清理后构建
npm run build:clean
```

### 开发工具

```bash
# CSS 路径验证
npm run validate:css

# 游戏资源测试
npm run test:assets

# 类型检查测试
npm run test:types

# 运行所有测试
npm run test
```

### 故障排除

如果遇到 ESLint 配置问题：

```bash
# 运行 ESLint 修复脚本
chmod +x scripts/fix-eslint.sh
./scripts/fix-eslint.sh
```

### Docker 开发

```bash
# 构建 Docker 镜像
npm run docker:build

# 运行 Docker 容器
npm run docker:run

# 开发环境 Docker
npm run docker:dev

# 生产环境 Docker
npm run docker:prod
```

## 🚀 部署

项目支持多种部署方式：

### 环境要求

- **Node.js**: 18.0.0 或更高版本
- **npm**: 9.0.0 或更高版本
- **Supabase**: 账户和项目配置
- **Git**: 用于版本控制

### GitHub Actions 自动部署

项目配置了完整的 CI/CD 流程，详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

### Docker 部署

```bash
# 构建 Docker 镜像
npm run docker:build

# 运行生产环境
npm run docker:prod

# 或者使用 docker-compose
docker-compose up -d
```

### PM2 部署

```bash
# 使用 PM2 部署脚本
npm run deploy:pm2

# 或者手动部署
npm run build
npm start
```

### Vercel 部署（推荐）

1. 连接你的 GitHub 仓库到 Vercel
2. 自动检测 Next.js 项目
3. 配置环境变量
4. 自动部署

### Netlify 部署

1. 连接你的 GitHub 仓库到 Netlify
2. 配置构建命令：`npm run build`
3. 发布目录：`.next`
4. 配置环境变量
5. 部署

### 传统服务器部署

```bash
# 1. 构建项目
npm run build

# 2. 安装 PM2（生产环境推荐）
npm install -g pm2

# 3. 使用 PM2 启动应用
pm2 start npm --name "sl-wen-blog" -- start

# 4. 配置 Nginx 反向代理
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 功能特性详解

### 文章系统
- Markdown 编辑器支持
- 文章分类和标签
- 文章预览和草稿功能
- SEO 优化
- 文章编辑和版本管理

### 用户系统
- 邮箱注册/登录
- 用户资料管理
- 权限控制
- 会话管理
- 用户头像上传

### 评论系统
- 实时评论显示
- 点赞和回复功能
- 评论审核
- 垃圾评论过滤
- 评论统计

### 搜索功能
- 全文搜索
- 分类筛选
- 搜索结果高亮
- 搜索历史
- 智能搜索建议

### AI工具集合
- **图像转文字**: 基于Tesseract.js的OCR功能
- **背景移除**: 智能图像背景移除工具
- **密码生成**: 安全的随机密码生成器
- **格式转换**: JSON、Base64等多种格式转换
- **加密解密**: 多种加密算法支持
- **哈希计算**: MD5、SHA等哈希算法

### 开发者工具
- **代码格式化**: Prettier集成
- **JSON处理**: JSON格式化和验证
- **文本差异**: 代码差异对比工具
- **时间戳转换**: 时间戳与日期互转
- **QR码生成**: 多种QR码生成工具
- **API测试**: RESTful API测试工具

### 实用工具
- **颜色工具**: 颜色选择器和转换
- **房贷计算器**: 智能房贷计算工具
- **汇率转换**: 实时汇率查询和转换
- **储蓄计算器**: 个人理财计算工具
- **文本对比**: 文本差异分析

### 游戏功能
- **2D游戏引擎**: 基于Phaser 3的游戏开发
- **地图编辑器**: Tiled地图支持
- **精灵动画**: 2D精灵动画系统
- **物理引擎**: 碰撞检测和物理模拟

### 性能优化
- 服务端渲染 (SSR)
- 图片懒加载
- 代码分割
- 缓存策略
- 资源预加载
- 性能监控

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 贡献步骤

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 编写清晰的提交信息

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架
- [Supabase](https://supabase.com/) - 后端服务
- [React](https://reactjs.org/) - 前端库

---

**最后更新**: 2025年9月

**项目维护者**: [sl-wen](https://github.com/sl-wen)

---

## 📝 更新日志

### v1.0.1 (2025-09-24)
- ✨ 新增AI工具集合（图像转文字、背景移除等）
- 🎮 集成Phaser游戏引擎
- 🛠️ 添加多种实用工具（密码生成器、格式转换器等）
- 📱 优化PWA功能和离线支持
- 🚀 升级到Next.js 15和React 19
- 📚 完善文档和部署指南
