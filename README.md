# Supabase博客系统 
GitHub：   https://sl-wen.github.io  
个人服务器：http://121.40.215.235

这是一个基于Supabase的博客系统，将静态网站生成与动态内容管理相结合。本系统使用Supabase数据库存储文章内容，实现了一个简洁、高效的博客平台。

## 功能特点

- **Supabase集成**：使用Supabase数据库存储和管理博客文章
- **Markdown支持**：使用Marked.js解析Markdown格式的文章内容
- **实时预览**：在发布页面支持Markdown实时预览
- **文章分类**：支持按标签对文章进行分类
- **响应式设计**：适配各种屏幕尺寸的设备
- **简洁界面**：参考blog.tmaize.net的简洁设计风格
- **Webpack打包**：使用Webpack打包JavaScript代码，解决CSP问题

## 技术栈

- **前端**：HTML, CSS, JavaScript
- **数据库**：Supabase
- **构建工具**：Webpack
- **Markdown解析**：Marked.js
- **依赖管理**：npm

## 项目结构
<details>
  <summary>项目结构展开/项目结构收起</summary>

```
├── pages/                  # 网站页面
│   ├── article.html        # 文章详情页
│   ├── categories.html     # 文章分类页
│   ├── post.html           # 文章发布页
│   ├── edit.html           # 文章编辑页
│   ├── novel-crawler.html  # 小说下载页面
│   ├── parenting.html      # 育儿页面
│   ├── tools.html          # 工具页面
│   ├── about.html          # 关于页面
│   └── search.html         # 搜索页面
├── static/                 # 静态资源
│   ├── css/                # 样式表
│   ├── img/                # 图片资源
│   ├── font/               # 字体资源
│   └── js/                 # JavaScript文件
│       ├── dist/           # Webpack打包后的文件
├── index.html              # 主页
├── package.json            # npm配置文件
└── webpack.config.js       # Webpack配置
```

</details>


## 安装与使用

### 前提条件

- Node.js 和 npm
- Supabase 账号和项目

### 安装步骤

1. 克隆仓库
   ```
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

2. 安装依赖
   ```
   npm install
   ```

3. 配置Supabase
   - 在Supabase控制台创建一个新项目
   - 获取Supabase配置信息
   - 更新`supabase-config.js`中的supabase配置

4. 构建JavaScript包
   ```
   npx webpack
   ```

5. 本地运行
   ```
   http-server
   ```

## 使用方法

### 发布文章

1. 访问 `/pages/post.html` 页面
2. 填写文章标题、作者和标签（用逗号分隔）
3. 在编辑器中使用Markdown格式编写文章内容
4. 实时预览区域会显示文章的渲染效果
5. 点击"发布文章"按钮将文章保存到Supabase数据库
6. 发布成功后会自动跳转到文章详细页

### 浏览文章

1. **浏览文章**：访问主页查看所有文章列表
2. **查看文章**：点击文章标题查看详细内容
3. **分类浏览**：访问`/pages/categories.html`按分类查看文章

## 自定义

- **样式**：修改`static/css/*.css`自定义网站外观
- **布局**：修改HTML文件自定义页面布局


## 许可证

本项目基于MIT许可证开源。

# 介绍

[![Language](https://img.shields.io/badge/Jekyll-Theme-blue)](https://github.com/sl-wen/slwen)

一款 jekyll 主题（[GitHub 地址](https://github.com/sl-wen/)），简洁纯净(主题资源请求<20KB)，未引入任何框架，秒开页面，支持自适应，支持全文检索

你可以到[slwen Blog](https://sl-wen.github.io/)查看主题效果 ，欢迎添加友链

## 感谢

[JetBrains](https://www.jetbrains.com/) 免费提供的开发工具[![JetBrains](./static/img/jetbrains.svg)](https://www.jetbrains.com/?from=slwen-blog)


# 运行

一般提交到 github 过个几十秒就可以看到效果


# 项目配置

1. 如果使用自己的域名，`CNAME`文件里的内容请换成你自己的域名，然后 CNAME 解析到`用户名.github.com`

2. 如果使用 GitHub 的的域名，请删除`CNAME`文件，然后把你的项目修改为`用户名.github.io`

3. 网站的 logo 和 favicon 放在了`static/img/`下，替换即可，大小无所谓，图片比例最好是 1:1

4. 如果你是把项目 fork 过去的，想要删除我的提交记录可以使用下面的命令

   ```
   git checkout --orphan temp
   git add . && git commit -m init
   git branch -D master
   git branch -m temp master
   git push --force
   ```

# 项目功能

该项目具有以下功能：

- **自适应设计**：支持在不同设备上自适应显示。
- **全文检索**：支持全文检索功能，方便用户快速查找内容。
- **访问量统计**：集成访问量统计功能。
- **页面特效**：点击页面文字时会出现特效。
- **代码高亮**：支持代码高亮显示，适合技术博客。
- **服务工作者**：使用Service Worker进行缓存管理，提高页面加载速度。


## 配置

- 支持自定义域名和GitHub Pages域名。

## 其他功能

- 提供多种页面布局，如首页、文章页、分类页、搜索页等。

# 改进计划

## 1. 性能优化

- **懒加载图片**：实现图片懒加载，减少初始加载时间
- **代码分割**：进一步优化Webpack配置，实现更细粒度的代码分割
- **缓存策略**：实现更高效的缓存策略，减少API请求次数
- **CDN加速**：考虑使用CDN加速静态资源加载

## 2. 功能扩展

- **评论系统**：添加评论功能，增加用户互动
- **社交分享**：添加社交媒体分享按钮
- **订阅功能**：实现邮件订阅，通知读者新文章发布
- **多语言支持**：添加多语言支持，扩大受众范围
- **文章版本控制**：实现文章的版本历史记录

## 3. 用户体验改进

- **深色模式**：实现深色模式切换功能
- **阅读进度指示器**：添加阅读进度指示器
- **相关文章推荐**：基于标签或内容相似度推荐相关文章
- **目录导航**：为长文章自动生成目录导航
- **阅读时间估计**：显示文章预计阅读时间

## 4. SEO优化

- **结构化数据**：添加结构化数据标记，提高搜索引擎理解能力
- **元标签优化**：完善每个页面的标题、描述和关键词元标签
- **URL优化**：使用更友好的URL结构，如使用文章标题而非ID
- **站点地图**：生成并提交站点地图，帮助搜索引擎索引

## 5. 安全性增强

- **API密钥保护**：将Supabase API密钥移至环境变量或服务端
- **内容安全策略**：实现更严格的CSP策略
- **输入验证**：加强用户输入验证和过滤
- **权限管理**：完善用户权限管理系统

## 6. 代码结构优化

- **组件化**：将前端代码重构为更模块化的组件
- **TypeScript集成**：考虑使用TypeScript提高代码可维护性
- **测试覆盖**：添加单元测试和集成测试
- **文档完善**：完善代码注释和项目文档

## 7. 部署与CI/CD

- **自动化部署**：完善GitHub Actions工作流
- **环境分离**：建立开发、测试和生产环境
- **监控系统**：添加错误监控和性能监控
