import { getArticle } from './articleService.js';

// 从 URL 获取文章 ID
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

if (articleId) {
  console.log('正在加载文章:', articleId);
  // 获取文章内容
  getArticle(articleId)
    .then(article => {
      console.log('文章加载成功:', article);
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
      console.error('加载文章失败:', error);
      let errorMessage = '加载文章失败，请稍后重试。';
      
      if (error.code === 'unavailable') {
        errorMessage = '无法连接到 Firestore 服务，请检查网络连接或稍后重试。';
      } else if (error.message === '文章不存在') {
        errorMessage = '未找到该文章。';
      }
      
      document.querySelector('.article-content').innerHTML = `
        <div class="error">
          <p>${errorMessage}</p>
          <p class="error-details">错误详情: ${error.message}</p>
        </div>
      `;
    });
} else {
  document.querySelector('.article-content').innerHTML = `
    <div class="error">
      <p>未找到文章 ID。</p>
    </div>
  `;
} 