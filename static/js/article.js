// 导入必要的模块和函数
import { getArticle } from './articleService.js';  // 导入获取文章的服务函数
import { marked } from 'marked';  // 导入 Markdown 解析器
import { getUserInfo } from './auth.js';  // 导入获取文章的服务函数

// 自定义 marked 渲染器配置
const renderer = {
  // 自定义图片渲染方法
  image(href, title, text) {
    const processedUrl = processImageUrl(href);  // 处理图片 URL
    // 返回自定义的图片 HTML，包含错误处理和样式类
    return `<img src="${processedUrl}" alt="${text || ''}" title="${title || ''}" class="article-image" onerror="this.onerror=null; this.src='/static/img/default.jpg';">`;
  }
};

// 配置 marked Markdown 解析器
marked.use({
  breaks: true,  // 启用换行符转换
  gfm: true,     // 启用 GitHub 风格的 Markdown
  renderer: renderer  // 使用自定义渲染器
});

// 处理图片 URL 的函数
function processImageUrl(url) {
  if (!url) return '';  // 如果 URL 为空，返回空字符串
  try {
    // 解码 URL，以防它已经被编码
    let decodedUrl = decodeURIComponent(url);

    // 如果是以斜杠开头的绝对路径，直接返回
    if (decodedUrl.startsWith('/')) {
      return decodedUrl;
    }

    // 如果是完整的 HTTP/HTTPS URL，直接返回
    if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
      return decodedUrl;
    }

    // 否则将其视为相对于 static/img 目录的路径
    return `/static/img/${decodedUrl}`;
  } catch (e) {
    console.error('处理图片 URL 时出错:', e);
    return url;  // 发生错误时返回原始 URL
  }
}

// 从 URL 参数中获取文章 ID
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

// 等待 DOM 完全加载后执行
document.addEventListener('DOMContentLoaded', () => {
  // 获取页面上的重要元素
  const articleContainer = document.getElementById('article-container');  // 文章容器
  const articleActions = document.querySelector('.article-actions');     // 文章操作按钮容器

  // 更新文章操作按钮（如编辑按钮）
  function updateArticleActions(id) {
    if (articleActions) {
      articleActions.innerHTML = `
        <a href="/pages/edit.html?id=${id}" class="edit-button">编辑</a>
      `;
    }
  }

  // 显示错误信息的函数
  function showError(message, details = '') {
    if (!articleContainer) {
      console.error('文章容器元素不存在');
      return;
    }

    // 显示错误消息和详细信息
    articleContainer.innerHTML = `
      <div class="error">
        <p>${message}</p>
        ${details ? `<p class="error-details">错误详情: ${details}</p>` : ''}
      </div>
    `;
  }

  // 显示加载状态的函数
  function showLoading() {
    if (!articleContainer) {
      console.error('文章容器元素不存在');
      return;
    }

    // 显示加载中提示
    articleContainer.innerHTML = `
      <div class="loading">
        <div class="octocat-container">
        <svg class="octocat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="32" height="32">
          <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
        <div class="octocat-arm"></div>
      </div>
      <p class="loading-text">正在加载文章...</p>
      </div>
    `;
  }

  // 为代码块添加复制功能
  function addCopyButtons() {
    // 为每个代码块添加复制按钮
    document.querySelectorAll('pre code').forEach((codeBlock) => {
      const container = codeBlock.parentNode;
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.textContent = '复制';

      // 添加点击事件处理
      copyButton.addEventListener('click', async () => {
        let copied = false;

        // try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(codeBlock.textContent);
            copied = true;
          } catch (err) {
            // fall back
          }
        }

        if (!copied) {
          try {
            // 创建临时textarea
            const textarea = document.createElement('textarea');
            textarea.value = codeBlock.textContent;
            // 防止页面滚动
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            document.execCommand('copy');
            copied = true;
            document.body.removeChild(textarea);
          } catch (err) {
            copied = false;
          }
        }

        // 状态反馈
        if (copied) {
          copyButton.textContent = '已复制！'; copyButton.classList.add('copied');
          setTimeout(() => { copyButton.textContent = '复制'; copyButton.classList.remove('copied'); }, 2000);
        } else {
          copyButton.textContent = '复制失败';
          setTimeout(() => { copyButton.textContent = '复制'; }, 2000);
        }
      });

      container.appendChild(copyButton);  // 将复制按钮添加到代码块容器中
    });
  }

  // 显示文章内容的函数
  async function showArticle(article) {
    if (!articleContainer) {
      console.error('文章容器元素不存在');
      return;
    }

    console.log('文章数据:', article);
    console.log('文章创建日期:', article.created_at);

    // 更新页面标题
    document.title = `${article.title} - 我的博客`;

    // 创建文章元信息 HTML（发布日期、作者、标签等）
    const metaHtml = `
      <div class="article-meta">
        <span>发布于: ${article.created_at ? new Date(article.created_at).getFullYear() + '年' + (new Date(article.created_at).getMonth() + 1) + '月' + new Date(article.created_at).getDate() + '日' : '未知日期'}</span>
        ${article.author ? `<span>作者: ${article.author}</span>` : ''}
        ${article.tags && article.tags.length > 0 ? `<span>标签: ${article.tags.join(', ')}</span>` : ''}
      </div>
    `;

    // 将 Markdown 内容转换为 HTML
    const contentHtml = marked.parse(article.content || '');

    // 组合完整的文章 HTML
    articleContainer.innerHTML = `
      <h1>${article.title || '无标题'}</h1>
      ${metaHtml}
      <div class="markdown-body">
        ${contentHtml}
      </div>
    `;

    // 更新文章操作按钮
    try {
      const { session, profile, error } = await getUserInfo();  // 获取用户数据
      if (session && (session?.user.email === 'sl-wen@outlook.com' || profile?.username === article.author)) {
        updateArticleActions(article.id);
      }
    } catch (error) {
      console.error('更新文章操作按钮失败:', error);
      showError('更新文章操作按钮失败', error.message);  // 显示错误信息
    }
    // 应用代码高亮（如果 hljs 可用）
    if (window.hljs) {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
      });
    }

    // 添加代码块复制按钮
    addCopyButtons();
  }

  // 加载并显示文章的异步函数
  async function loadArticle() {
    if (!articleId) {
      showError('未找到文章 ID');  // 如果没有文章 ID，显示错误
      return;
    }

    try {
      showLoading();  // 显示加载状态
      const article = await getArticle(articleId);  // 获取文章数据
      showArticle(article);  // 显示文章内容
    } catch (error) {
      console.error('加载文章失败:', error);
      showError('加载文章失败', error.message);  // 显示错误信息
    }
  }

  // 开始加载文章
  loadArticle();
});