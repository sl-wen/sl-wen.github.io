# Firebase Jekyll 博客系统

这是一个基于Firebase和Jekyll的博客系统，将静态网站生成与动态内容管理相结合。本系统使用Firebase Firestore作为数据库存储文章内容，同时保留了Jekyll的静态网站生成能力，实现了一个简洁、高效的博客平台。

## 功能特点

- **Firebase集成**：使用Firestore数据库存储和管理博客文章
- **Markdown支持**：使用Marked.js解析Markdown格式的文章内容
- **实时预览**：在发布页面支持Markdown实时预览
- **文章分类**：支持按标签对文章进行分类
- **响应式设计**：适配各种屏幕尺寸的设备
- **简洁界面**：参考blog.tmaize.net的简洁设计风格
- **Webpack打包**：使用Webpack打包JavaScript代码，解决CSP问题

## 技术栈

- **前端**：HTML, CSS, JavaScript
- **数据库**：Firebase Firestore
- **静态生成**：Jekyll
- **构建工具**：Webpack, Babel
- **Markdown解析**：Marked.js
- **依赖管理**：npm

## 项目结构

```
├── _site/                  # Jekyll生成的静态网站文件
├── pages/                  # 网站页面
│   ├── article.html        # 文章详情页
│   ├── categories.html     # 文章分类页
│   ├── post.html           # 文章发布页
│   ├── about.html          # 关于页面
│   └── search.html         # 搜索页面
├── src/                    # 源代码
│   └── js/                 # JavaScript源文件
│       ├── firebase-bundle.js  # 主页Firebase功能
│       └── post-bundle.js      # 发布页Firebase功能
├── static/                 # 静态资源
│   ├── css/                # 样式表
│   ├── img/                # 图片资源
│   └── js/                 # JavaScript文件
│       ├── bundles/        # Webpack打包后的文件
│       └── migrate-posts.js # 迁移脚本
├── index.html              # 主页
├── package.json            # npm配置文件
├── webpack.config.js       # Webpack配置
└── _config.yml             # Jekyll配置
```

## 安装与使用

### 前提条件

- Node.js 和 npm
- Ruby 和 Jekyll
- Firebase 账号和项目

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

3. 配置Firebase
   - 在Firebase控制台创建一个新项目
   - 获取Firebase配置信息
   - 更新`src/js/firebase-bundle.js`和`src/js/post-bundle.js`中的Firebase配置

4. 构建JavaScript包
   ```
   npx webpack
   ```

5. 构建Jekyll网站
   ```
   jekyll build
   ```

6. 本地运行
   ```
   jekyll serve
   ```

## 使用方法

### 发布文章

1. 访问 `/pages/post.html` 页面
2. 填写文章标题、作者和标签（用逗号分隔）
3. 在编辑器中使用Markdown格式编写文章内容
4. 实时预览区域会显示文章的渲染效果
5. 点击"发布文章"按钮将文章保存到Firestore数据库
6. 发布成功后会自动跳转到文章详细页

### 浏览文章

1. **浏览文章**：访问主页查看所有文章列表
2. **查看文章**：点击文章标题查看详细内容
3. **分类浏览**：访问`/pages/categories.html`按分类查看文章

## 自定义

- **样式**：修改`static/css/style.css`自定义网站外观
- **布局**：修改HTML文件自定义页面布局
- **配置**：修改`_config.yml`调整Jekyll配置


## 许可证

本项目基于MIT许可证开源。

# 介绍

[![Language](https://img.shields.io/badge/Jekyll-Theme-blue)](https://github.com/sl-wen/slwen)
[![license](https://img.shields.io/github/license/slwen/slwen)](https://github.com/sl-wen/slwen)
[![GitHub stars](https://img.shields.io/github/stars/slwen/?style=social)](https://github.com/sl-wen/)

一款 jekyll 主题（[GitHub 地址](https://github.com/sl-wen/)），简洁纯净(主题资源请求<20KB)，未引入任何框架，秒开页面，支持自适应，支持全文检索，支持夜间模式

你可以到[slwen Blog](https://sl-wen.github.io/)查看主题效果 ，欢迎添加友链

## 感谢

[JetBrains](https://www.jetbrains.com/) 免费提供的开发工具[![JetBrains](./static/img/jetbrains.svg)](https://www.jetbrains.com/?from=slwen-blog)


# 本地运行

一般提交到 github 过个几十秒就可以看到效果，如果你需要对在本地查看效果需要安装 ruby 环境和依赖


# 项目配置

1. 如果使用自己的域名，`CNAME`文件里的内容请换成你自己的域名，然后 CNAME 解析到`用户名.github.com`

2. 如果使用 GitHub 的的域名，请删除`CNAME`文件，然后把你的项目修改为`用户名.github.io`

3. 修改`_config.yml`文件，具体作用请参考注释

4. 网站的 logo 和 favicon 放在了`static/img/`下，替换即可，大小无所谓，图片比例最好是 1:1

5. 如果你是把项目 fork 过去的，想要删除我的提交记录可以使用下面的命令

   ```
   git checkout --orphan temp
   git add . && git commit -m init
   git branch -D master
   git branch -m temp master
   git push --force
   ```


```md
![这是图片](xxx.png)

[xxx.zip 下载](xxx.zip)
```
# 项目功能

该项目是一个基于Jekyll的博客主题，具有以下功能：

- **自适应设计**：支持在不同设备上自适应显示。
- **夜间模式**：支持切换夜间模式，提供更好的夜间阅读体验。
- **全文检索**：支持全文检索功能，方便用户快速查找内容。
- **访问量统计**：集成访问量统计功能。
- **页面特效**：点击页面文字时会出现特效。
- **代码高亮**：支持代码高亮显示，适合技术博客。
- **服务工作者**：使用Service Worker进行缓存管理，提高页面加载速度。


## 配置

- 修改`_config.yml`文件进行项目配置。
- 支持自定义域名和GitHub Pages域名。

## 其他功能

- 支持MathJax数学公式显示。
- 支持Google Adsense广告集成。
- 提供多种页面布局，如首页、文章页、分类页、搜索页等。
