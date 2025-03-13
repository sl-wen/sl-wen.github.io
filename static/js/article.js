import { getArticle } from './articleService.js';

// 从 URL 获取文章 ID
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

// 获取容器元素
const articleContainer = document.getElementById('article-container');
const statusMessages = document.getElementById('status-messages');

// 显示错误信息
function showError(message, details = '') {
  if (articleContainer) {
    articleContainer.innerHTML = `
      <div class="error">
        <p>${message}</p>
        ${details ? `<p class="error-details">错误详情: ${details}</p>` : ''}
      </div>
    `;
  }
}

if (articleId) {
  console.log('正在加载文章:', articleId);
  // 获取文章内容
  getArticle(articleId)
    .then(article => {
      console.log('文章加载成功:', article);
      if (articleContainer) {
        // 更新页面内容
        document.title = `${article.title} - 我的博客`;
        articleContainer.innerHTML = `
          <h1 class="article-title">${article.title}</h1>
          <div class="article-meta">
            <span class="date">${new Date(article.createdAt?.toDate() || new Date()).toLocaleDateString('zh-CN')}</span>
            ${article.tags ? `<span class="tags">标签：${article.tags.join(', ')}</span>` : ''}
          </div>
          <div class="article-content">${article.content || ''}</div>
        `;
      }
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