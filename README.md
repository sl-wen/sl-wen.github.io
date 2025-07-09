# sl-wen的个人博客

[![Language](https://img.shields.io/badge/Jekyll-Theme-blue)](https://github.com/sl-wen/slwen)
[![license](https://img.shields.io/github/license/slwen/slwen)](https://github.com/sl-wen/slwen)
[![GitHub stars](https://img.shields.io/github/stars/slwen/?style=social)](https://github.com/sl-wen/)

## 项目简介

这是一个现代化的个人博客系统，使用 React 19、Next.js 14 和 TailwindCSS 构建。

### 技术栈

- **前端框架**: React 19
- **构建工具**: Next.js 14
- **样式框架**: TailwindCSS 3
- **语言**: TypeScript
- **数据库**: Supabase
- **部署**: GitHub Actions + Ubuntu 24.04

### 主要功能

- 📝 文章发布和编辑
- 🔍 全文搜索
- 📱 PWA 支持
- 🌙 响应式设计
- ⚡ 服务端渲染 (SSR)
- 🔐 用户认证
- 💬 评论系统

## 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/sl-wen/sl-wen.github.io.git
cd sl-wen.github.io

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 部署

项目使用 GitHub Actions 自动部署，详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 项目结构

```
src/
├── app/                 # Next.js 应用路由
├── components/          # React 组件
├── utils/              # 工具函数
├── styles/             # 样式文件
└── types/              # TypeScript 类型定义
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

*最后更新: 2025年7月*
