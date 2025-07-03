# SL-Wen 博客系统

[![Next.js](https://img.shields.io/badge/Next.js-14.2.30-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple)](https://web.dev/progressive-web-apps/)

🚀 **现代化的全栈博客系统** - 基于 Next.js 14 + TypeScript + Tailwind CSS + Supabase 构建的高性能博客平台。

## 🌟 在线演示

- **GitHub Pages**: [https://sl-wen.github.io](https://sl-wen.github.io)
- **个人服务器**: [http://121.40.215.235](http://121.40.215.235)

## ✨ 核心特性

### 🎨 用户界面与体验
- **现代化设计**: 基于 Tailwind CSS 的美观响应式界面
- **深色模式**: 完整的深色/浅色主题切换支持
- **渐变动画**: 精美的CSS动画和过渡效果
- **移动端优化**: 完美适配手机、平板和桌面设备
- **PWA支持**: 可安装的渐进式Web应用

### 📝 文章管理
- **Markdown编辑器**: 实时预览的Markdown编辑体验
- **标签分类**: 基于标签的文章分类系统
- **全文搜索**: 强大的搜索功能，支持标题、内容、代码和标签搜索
- **文章统计**: 浏览量、评论数等统计信息
- **文章编辑**: 支持已发布文章的在线编辑

### 👤 用户系统
- **用户认证**: 基于 Supabase Auth 的安全登录注册
- **个人资料**: 用户等级、经验值、成就系统
- **密码安全**: 强密码验证和实时强度提示
- **会话管理**: 安全的用户会话和状态管理

### 💬 交互功能
- **评论系统**: 完整的文章评论和回复功能
- **反应系统**: 文章点赞和互动反馈
- **实时通知**: 状态消息和操作反馈
- **分享功能**: 社交媒体分享支持

### 🔧 开发者友好
- **TypeScript**: 完整的类型安全支持
- **组件化**: 可复用的React组件架构
- **代码高亮**: 支持多种编程语言的语法高亮
- **SEO优化**: 完善的元标签和结构化数据

## 🛠 技术栈

### 前端技术
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.0
- **样式**: Tailwind CSS 3.4
- **UI组件**: 自定义组件库
- **状态管理**: React Hooks + Local Storage
- **PWA**: next-pwa

### 后端服务
- **数据库**: Supabase PostgreSQL
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **实时功能**: Supabase Realtime

### 工具链
- **构建工具**: Next.js + Webpack
- **包管理**: npm
- **代码格式**: Prettier + ESLint
- **部署**: Vercel / GitHub Pages

## 📁 项目结构

```
sl-wen.github.io/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页
│   │   ├── globals.css        # 全局样式
│   │   ├── about/             # 关于页面
│   │   ├── article/[id]/      # 文章详情页
│   │   ├── category/          # 分类页面
│   │   ├── login/             # 登录页面
│   │   ├── post/              # 发布文章页
│   │   └── search/            # 搜索页面
│   ├── components/            # React 组件
│   │   ├── ArticleCard.tsx    # 文章卡片
│   │   ├── ArticleList.tsx    # 文章列表
│   │   ├── CommentSection.tsx # 评论组件
│   │   ├── Header.tsx         # 页面头部
│   │   ├── Footer.tsx         # 页面底部
│   │   └── ...               # 其他组件
│   ├── pages/                 # 页面组件
│   │   ├── HomePage.tsx       # 首页组件
│   │   ├── ArticlePage.tsx    # 文章页组件
│   │   ├── LoginPage.tsx      # 登录页组件
│   │   └── ...               # 其他页面
│   ├── utils/                 # 工具函数
│   │   ├── supabase-config.ts # Supabase 配置
│   │   ├── articleService.ts  # 文章服务
│   │   ├── auth.ts           # 认证服务
│   │   └── ...               # 其他服务
│   ├── styles/               # 样式文件
│   └── types/                # TypeScript 类型定义
├── public/                   # 静态资源
│   ├── favicon.ico          # 网站图标
│   ├── manifest.json        # PWA 配置
│   └── ...                  # 图标和静态文件
├── next.config.js           # Next.js 配置
├── tailwind.config.js       # Tailwind 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 项目依赖
```

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn
- Supabase 账号

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/sl-wen/sl-wen.github.io.git
   cd sl-wen.github.io
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   # 创建 .env.local 文件
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **配置Supabase数据库**
   ```sql
   -- 运行 sql/init.sql 中的数据库初始化脚本
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

6. **访问应用**
   ```
   http://localhost:3000
   ```

### 生产部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start

# 或导出静态站点
npm run export
```

## 📖 使用指南

### 🖊️ 发布文章

1. 访问 `/post` 页面
2. 填写文章标题和标签
3. 使用 Markdown 编辑器撰写内容
4. 实时预览确认效果
5. 点击发布按钮保存文章

### 🔍 搜索文章

1. 访问 `/search` 页面
2. 输入关键词进行搜索
3. 支持搜索文章标题、内容、代码和标签
4. 查看高亮显示的搜索结果

### 📂 分类浏览

1. 访问 `/category` 页面
2. 按标签分类查看文章
3. 点击文章标题进入详情页

### 👤 用户管理

1. 访问 `/login` 页面进行登录注册
2. 查看个人统计和成就
3. 管理个人发布的文章

## 🎨 自定义配置

### 主题定制

在 `tailwind.config.js` 中自定义主题：

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // 自定义颜色
      },
      animation: {
        // 自定义动画
      }
    }
  }
}
```

### 样式修改

在 `src/app/globals.css` 中调整全局样式：

```css
/* 自定义组件样式 */
.btn-primary {
  /* 主按钮样式 */
}

.card {
  /* 卡片样式 */
}
```

## 🚀 性能优化

- **代码分割**: 自动按路由分割代码
- **图片优化**: Next.js Image 组件自动优化
- **缓存策略**: 智能缓存静态资源
- **懒加载**: 组件和图片按需加载
- **PWA缓存**: Service Worker 离线缓存

## 🔒 安全特性

- **XSS防护**: DOMPurify 净化用户输入
- **CSRF保护**: Supabase 内置安全机制
- **内容安全策略**: CSP 头部配置
- **密码安全**: 强密码验证和加密存储

## 📱 PWA 功能

- **离线访问**: Service Worker 缓存关键资源
- **桌面安装**: 可安装到桌面或主屏幕
- **推送通知**: 支持浏览器推送通知
- **响应式图标**: 自适应不同设备的应用图标

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 开发规范

- 使用 TypeScript 进行类型安全开发
- 遵循 React Hooks 最佳实践
- 组件使用函数式编程风格
- CSS 使用 Tailwind 工具类优先
- 代码格式化使用 Prettier

## 🐛 问题反馈

如果您遇到任何问题或有改进建议，请：

1. 查看 [Issues](https://github.com/sl-wen/sl-wen.github.io/issues) 是否已有相关问题
2. 创建新的 Issue 详细描述问题
3. 提供复现步骤和环境信息

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架
- [Supabase](https://supabase.com/) - 开源后端即服务
- [Marked.js](https://marked.js.org/) - Markdown 解析器
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS 防护库

---

⭐ 如果这个项目对您有帮助，请给它一个星标！

📧 联系方式: [你的邮箱]  
🌐 个人网站: [https://sl-wen.github.io](https://sl-wen.github.io)
