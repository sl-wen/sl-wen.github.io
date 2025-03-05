# 介绍

[![Language](https://img.shields.io/badge/Jekyll-Theme-blue)](https://github.com/sl-wen/slwen)
[![license](https://img.shields.io/github/license/slwen/slwen)](https://github.com/sl-wen/slwen)
[![GitHub stars](https://img.shields.io/github/stars/slwen/?style=social)](https://github.com/sl-wen/)

一款 jekyll 主题（[GitHub 地址](https://github.com/sl-wen/)），简洁纯净(主题资源请求<20KB)，未引入任何框架，秒开页面，支持自适应，支持全文检索，支持夜间模式

你可以到[slwen Blog](https://sl-wen.github.io/)查看主题效果 ，欢迎添加友链

## 感谢

[JetBrains](https://www.jetbrains.com/) 免费提供的开发工具[![JetBrains](./static/img/jetbrains.svg)](https://www.jetbrains.com/?from=slwen-blog)

[夜间模式代码高亮配色](https://github.com/mgyongyosi/OneDarkJekyll)

# 本地运行

一般提交到 github 过个几十秒就可以看到效果，如果你需要对在本地查看效果需要安装 ruby 环境和依赖

windows 下推荐在 wsl 下装 ruby，直接一句`apt install build-essential ruby ruby-dev` 就行了

```bash
# gem sources --remove https://rubygems.org/
# gem sources -a https://mirrors.tuna.tsinghua.edu.cn/rubygems/
# gem sources -l
# gem sources --clear-all
# gem sources --update
gem install bundler
# bundle config mirror.https://rubygems.org https://mirrors.tuna.tsinghua.edu.cn/rubygems
# bundle config list
bundle install
```

通过下面命令启动/编译项目

```bash
bundle exec jekyll serve --watch --host=127.0.0.1 --port=8080
bundle exec jekyll build --destination=dist
```

如果需要替换代码高亮的样式可以通过下面的命令生成 css

```bash
rougify help style
rougify style github > highlighting.css
```

# 项目配置

1. 如果使用自己的域名，`CNAME`文件里的内容请换成你自己的域名，然后 CNAME 解析到`用户名.github.com`

2. 如果使用 GitHub 的的域名，请删除`CNAME`文件，然后把你的项目修改为`用户名.github.io`

3. 修改`pages/about.md`中关于我的内容

4. 修改`_config.yml`文件，具体作用请参考注释

5. 清空`posts`和`_posts`目录下所有文件，注意是清空，不是删除这两个目录

6. 网站的 logo 和 favicon 放在了`static/img/`下，替换即可，大小无所谓，图片比例最好是 1:1

7. 如果你是把项目 fork 过去的，想要删除我的提交记录可以使用下面的命令

   ```
   git checkout --orphan temp
   git add . && git commit -m init
   git branch -D master
   git branch -m temp master
   git push --force
   ```

# 使用

文章放在`_posts`目录下，命名为`yyyy-MM-dd-xxxx-xxxx.md`，内容格式如下

```yaml
---
layout: mypost
title: 标题
categories: [分类1, 分类2]
---
文章内容，Markdown格式
```

文章资源放在`posts`目录，如文章文件名是`2019-05-01-theme-usage.md`，则该篇文章的资源需要放在`posts/2019/05/01`下，在文章使用时直接引用即可。当然了，写作的时候会提示资源不存在忽略即可

```md
![这是图片](xxx.png)

[xxx.zip 下载](xxx.zip)
```
# 项目功能

该项目是一个基于Jekyll的博客主题，具有以下功能：

- **自适应设计**：支持在不同设备上自适应显示。
- **夜间模式**：支持切换夜间模式，提供更好的夜间阅读体验。
- **全文检索**：支持全文检索功能，方便用户快速查找内容。
- **访问量统计**：集成不蒜子的访问量统计功能。
- **友链管理**：支持友情链接的展示和管理。
- **多语言支持**：支持中文和英文的内容展示。
- **页面特效**：点击页面文字时会出现特效。
- **代码高亮**：支持代码高亮显示，适合技术博客。
- **服务工作者**：使用Service Worker进行缓存管理，提高页面加载速度。

## 本地运行

- 安装Ruby环境和依赖。
- 使用`bundle exec jekyll serve`命令启动本地服务器。

## 部署

- 使用`bundle exec jekyll build`命令生成静态文件。
- 将生成的文件上传到服务器或GitHub Pages进行部署。

## 配置

- 修改`_config.yml`文件进行项目配置。
- 支持自定义域名和GitHub Pages域名。

## 其他功能

- 支持MathJax数学公式显示。
- 支持Google Adsense广告集成。
- 提供多种页面布局，如首页、文章页、分类页、搜索页等。
