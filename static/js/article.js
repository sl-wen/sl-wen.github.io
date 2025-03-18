import { getArticle } from './articleService.js';
import { marked } from 'marked';
import { deleteArticle } from './firebase-article-operations.js';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

// 配置 marked 选项
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true,    // 启用 GitHub 风格的 Markdown
  headerIds: true, // 为标题添加 id
  mangle: false, // 不转义标题中的字符
  sanitize: false, // 允许 HTML 标签
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {}
    }
    return hljs.highlightAuto(code).value;
  }
});

// 处理图片路径
function processImageUrl(url) {
  if (!url) return '';
  try {
    // 解码 URL，以防它已经被编码
    let decodedUrl = decodeURIComponent(url);
    
    // 如果是相对路径，添加基础路径
    if (decodedUrl.startsWith('/')) {
      return decodedUrl;
    }
    
    // 如果是完整的 URL，直接返回
    if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
      return decodedUrl;
    }
    
    // 否则假设是相对于 static/img 目录的路径
    // 不要对路径进行编码，让浏览器自动处理
    return `/static/img/${decodedUrl}`;
  } catch (e) {
    console.error('处理图片 URL 时出错:', e);
    return url;
  }
}

// 自定义 marked 渲染器
const renderer = {
  image(href, title, text) {
    const processedUrl = processImageUrl(href);
    // 不要对 src 属性进行编码，让浏览器自动处理
    return `<img src="${processedUrl}" alt="${text || ''}" title="${title || ''}" class="article-image" onerror="this.onerror=null; this.src='/static/img/default.jpg';">`;
  }
};

// 配置 marked
marked.use({ renderer });

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
    
    // 创建文章元信息区域
    const metaHtml = `
      <div class="article-meta">
        <span>发布于: ${article.createdAt ? article.createdAt.toDate().toLocaleDateString('zh-CN') : '未知日期'}</span>
        ${article.author ? `<span>作者: ${article.author}</span>` : ''}
        ${article.tags && article.tags.length > 0 ? `<span>标签: ${article.tags.join(', ')}</span>` : ''}
      </div>
    `;

    // 渲染文章内容
    const contentHtml = marked(article.content || '');
    
    // 组合完整的文章 HTML
    articleContainer.innerHTML = `
      <h1>${article.title || '无标题'}</h1>
      ${metaHtml}
      <div class="markdown-body">
        ${contentHtml}
      </div>
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