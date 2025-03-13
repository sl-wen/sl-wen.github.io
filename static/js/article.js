import { getArticle } from './articleService.js';

// 从 URL 获取文章 ID
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

if (articleId) {
  // 获取文章内容
  getArticle(articleId)
    .then(article => {
      // 更新页面内容
      document.title = article.title;
      document.querySelector('h1').textContent = article.title;
      document.querySelector('.article-meta').innerHTML = `
        <span class="date">${new Date(article.date).toLocaleDateString()}</span>
        <span class="tags">${article.tags.join(', ')}</span>
      `;
      document.querySelector('.article-content').innerHTML = article.content;
    })
    .catch(error => {
      if (error.message === 'FirebaseError: Failed to get document because the client is offline.') {
        console.error('加载文章失败:', error);
        document.querySelector('.article-content').innerHTML = `
          <div class="error">
            <p>网络连接不可用，请检查您的网络连接。</p>
          </div>
        `;
      } else {
        console.error('加载文章失败:', error);
        document.querySelector('.article-content').innerHTML = `
          <div class="error">
            <p>加载文章失败，请稍后重试。</p>
          </div>
        `;
      }
    });
} else {
  document.querySelector('.article-content').innerHTML = `
    <div class="error">
      <p>未找到文章 ID。</p>
    </div>
  `;
} 