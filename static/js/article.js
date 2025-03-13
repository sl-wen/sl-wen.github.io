import { getArticle } from './articleService.js';
import { marked } from 'marked';

// 配置 marked 选项
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true,    // 启用 GitHub 风格的 Markdown
  headerIds: true, // 为标题添加 id
  mangle: false, // 不转义标题中的字符
  sanitize: false // 允许 HTML 标签
});

// 从 URL 获取文章 ID
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 获取容器元素
  const articleContainer = document.getElementById('article-container');
  const statusMessages = document.getElementById('status-messages');

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
    const renderedContent = marked(article.content || '');
    
    articleContainer.innerHTML = `
      <h1 class="article-title">${article.title}</h1>
      <div class="article-meta">
        <span class="date">${new Date(article.createdAt?.toDate() || new Date()).toLocaleDateString('zh-CN')}</span>
        ${article.tags ? `<span class="tags">标签：${article.tags.join(', ')}</span>` : ''}
      </div>
      <div class="article-content">${renderedContent}</div>
    `;

    // 处理代码块
    const codeBlocks = articleContainer.querySelectorAll('pre code');
    if (window.hljs) {
      codeBlocks.forEach(block => {
        window.hljs.highlightElement(block);
      });
    }
  }

  if (!articleContainer) {
    console.error('找不到文章容器元素');
    return;
  }

  if (articleId) {
    console.log('正在加载文章:', articleId);
    showLoading();
    
    // 获取文章内容
    getArticle(articleId)
      .then(article => {
        console.log('文章加载成功:', article);
        showArticle(article);
      })
      .catch(error => {
        console.error('加载文章失败:', error);
        let errorMessage = '加载文章失败，请稍后重试。';
        
        if (error.code === 'unavailable') {
          errorMessage = '无法连接到 Firestore 服务，请检查网络连接或稍后重试。';
        } else if (error.message === '文章不存在') {
          errorMessage = '未找到该文章。';
        }
        
        showError(errorMessage, error.message);
      });
  } else {
    showError('未找到文章 ID。');
  }
}); 