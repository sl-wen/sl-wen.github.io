# 鱼鱼的博客 - 现代化个人博客系统

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-ISC-green)](https://github.com/sl-wen/sl-wen.github.io)

## 🚀 项目简介

这是一个功能丰富的现代化个人博客系统，采用最新的Web技术栈构建。项目不仅提供了完整的博客功能，还包含了用户认证、评论系统、实时统计等高级特性。

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

## 🛠️ 技术栈

### 前端技术
- **框架**: React 18 + Next.js 14
- **语言**: TypeScript 5.8
- **样式**: TailwindCSS 3.4 + PostCSS
- **状态管理**: React Context + Hooks
- **路由**: Next.js App Router

### 后端服务
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **实时功能**: Supabase Realtime

### 开发工具
- **代码质量**: ESLint + Prettier
- **类型检查**: TypeScript
- **构建工具**: Next.js
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
│   ├── article/           # 文章详情页
│   ├── category/          # 分类页面
│   ├── login/             # 登录页面
│   ├── post/              # 发布文章页面
│   ├── profile/           # 用户资料页面
│   ├── search/            # 搜索页面
│   ├── settings/          # 设置页面
│   ├── tools/             # 工具页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/             # React 组件
│   ├── ui/                # 基础UI组件
│   ├── ArticleCard.tsx    # 文章卡片组件
│   ├── ArticleList.tsx    # 文章列表组件
│   ├── CommentSection.tsx # 评论系统组件
│   ├── Footer.tsx         # 页脚组件
│   ├── Header.tsx         # 头部导航组件
│   ├── Loading.tsx        # 加载组件
│   └── StatusMessages.tsx # 状态消息组件
└── utils/                 # 工具函数
    ├── articleService.ts   # 文章服务
    ├── auth-context.tsx   # 认证上下文
    ├── commentService.ts  # 评论服务
    ├── reactionService.ts # 反应服务
    ├── stats.ts           # 统计服务
    └── supabase-config.ts # Supabase 配置
```

## 🔧 开发工具

### 代码质量检查

```bash
# 运行 ESLint 检查
npm run lint

# 自动修复 ESLint 问题
npm run lint -- --fix

# 代码格式化
npm run format

# TypeScript 类型检查
npm run tsc
```

### 故障排除

如果遇到 ESLint 配置问题：

```bash
# 运行 ESLint 修复脚本
chmod +x scripts/fix-eslint.sh
./scripts/fix-eslint.sh
```

## 🚀 部署

项目支持多种部署方式：

### GitHub Actions 自动部署

项目配置了完整的 CI/CD 流程，详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 手动部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 📊 功能特性详解

### 文章系统
- Markdown 编辑器支持
- 文章分类和标签
- 文章预览和草稿功能
- SEO 优化

### 用户系统
- 邮箱注册/登录
- 用户资料管理
- 权限控制
- 会话管理

### 评论系统
- 实时评论显示
- 点赞和回复功能
- 评论审核
- 垃圾评论过滤

### 搜索功能
- 全文搜索
- 分类筛选
- 搜索结果高亮
- 搜索历史

### 性能优化
- 服务端渲染 (SSR)
- 图片懒加载
- 代码分割
- 缓存策略

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

**最后更新**: 2025年1月

**项目维护者**: [sl-wen](https://github.com/sl-wen)
