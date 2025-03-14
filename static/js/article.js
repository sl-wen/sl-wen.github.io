import { getArticle } from './articleService.js';
import { marked } from 'marked';
import { deleteArticle } from './firebase-article-operations.js';

// 配置 marked 选项
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true,    // 启用 GitHub 风格的 Markdown
  headerIds: true, // 为标题添加 id
  mangle: false, // 不转义标题中的字符
  sanitize: false // 允许 HTML 标签
});

// 创建自定义渲染器
const renderer = new marked.Renderer();
renderer.image = function(href, title, text) {
    try {
        // 如果 href 是对象，尝试获取其 toString 方法的结果
        if (href && typeof href === 'object') {
            console.warn('图片链接是对象类型:', href);
            href = '';
        }
        
        // 确保所有参数都是字符串
        href = String(href || '').trim();
        title = String(title || '').trim();
        text = String(text || '').trim();
        
        // 如果没有有效的 href，直接使用默认图片
        if (!href) {
            return `<img src="/static/img/logo.png" alt="${text}" title="${title}">`;
        }
        
        // 如果是相对路径，添加基础URL
        if (!href.startsWith('http') && !href.startsWith('data:')) {
            href = '/static/img/' + href;
        }
        
        return `<img src="${href}" alt="${text}" title="${title}" onerror="this.src='/static/img/logo.png'">`;
    } catch (error) {
        console.error('图片渲染错误:', error);
        return `<img src="/static/img/logo.png" alt="图片加载失败" title="图片加载失败">`;
    }
};

// 安全的 marked 解析函数
function safeMarked(content) {
    if (!content || typeof content !== 'string') {
        return '';
    }
    try {
        return marked(content);
    } catch (error) {
        console.error('Markdown 解析错误:', error);
        return '内容解析错误';
    }
}

marked.setOptions({ renderer });

// 从 URL 获取文章 ID
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 获取容器元素
  const articleContainer = document.getElementById('article-container');
  const articleActions = document.querySelector('.article-actions');

  // 更新文章操作按钮
  function updateArticleActions(id) {
    if (articleActions) {
      articleActions.innerHTML = `
        <a href="/pages/edit.html?id=${id}" class="edit-button">编辑</a>
        <button onclick="deleteArticle('${id}')" class="delete-button">删除</button>
      `;
    }
  }

  // 显示错误信息
  function showError(message, details = '') {
    if (!articleContainer) {
      console.error('文章容器元素不存在');
      return;
    }
    
    articleContainer.innerHTML = `
      <div class="error">
        <p>${message}</p>
        ${details ? `<p class="error-details">错误详情: ${details}</p>` : ''}
      </div>
    `;
  }

  // 显示加载状态
  function showLoading() {
    if (!articleContainer) {
      console.error('文章容器元素不存在');
      return;
    }
    
    articleContainer.innerHTML = `
      <div class="loading">
        <p>正在加载文章...</p>
      </div>
    `;
  }

  // 显示文章内容
  function showArticle(article) {
    if (!articleContainer) {
      console.error('文章容器元素不存在');
      return;
    }
    
    // 更新页面内容
    document.title = `${article.title} - 我的博客`;
    
    // 渲染 Markdown 内容
    const renderedContent = safeMarked(article.content);
    
    articleContainer.innerHTML = `
      <h1 class="article-title">${article.title}</h1>
      <div class="article-meta">
        <span class="date">发布于：${new Date(article.createdAt?.toDate() || new Date()).toLocaleDateString('zh-CN')}</span>
        ${article.tags ? `<span class="tags">标签：${article.tags.join(', ')}</span>` : ''}
        <span class="views">阅读量：${article.views || 0}</span>
      </div>
      <div class="article-content">${renderedContent}</div>
    `;

    // 更新文章操作按钮
    updateArticleActions(article.id);

    // 应用代码高亮
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightBlock(block);
    });
  }

  // 加载并显示文章
  async function loadArticle() {
    if (!articleId) {
      showError('未找到文章 ID');
      return;
    }

    try {
      showLoading();
      const article = await getArticle(articleId);
      showArticle(article);
    } catch (error) {
      console.error('加载文章失败:', error);
      showError('加载文章失败', error.message);
    }
  }

  // 加载文章
  loadArticle();
}); 