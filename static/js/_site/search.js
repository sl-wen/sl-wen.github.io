import { db } from './firebase-config.js';
import { collection, getDocs } from 'firebase/firestore';

// 辅助函数：处理图片 URL
function processImageUrl(url) {
  if (!url) return '';
  try {
    // 如果是相对路径，添加基础路径
    if (url.startsWith('/')) {
      return url;
    }
    // 如果是完整的 URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // 否则假设是相对于 static 目录的路径
    return `/static/${url}`;
  } catch (e) {
    console.error('处理图片 URL 时出错:', e);
    return '';
  }
}

// 辅助函数：从 Markdown 中提取纯文本
function extractTextFromMarkdown(markdown) {
  if (!markdown) return '';
  return markdown
    // 移除图片
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // 移除链接，保留链接文字
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    // 移除标题标记
    .replace(/#{1,6}\s/g, '')
    // 移除强调标记
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    // 移除斜体标记
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // 移除代码块
    .replace(/```[\s\S]*?```/g, '')
    // 移除行内代码
    .replace(/`([^`]+)`/g, '$1')
    // 移除引用
    .replace(/^\s*>\s*/gm, '')
    // 移除水平线
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    // 移除列表标记
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // 移除多余的空行
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// 搜索功能
document.addEventListener('DOMContentLoaded', async function() {
  const searchInput = document.getElementById('search-input');
  const searchList = document.querySelector('.search-list');
  let posts = [];

  // 从 Firestore 获取所有文章
  try {
    const querySnapshot = await getDocs(collection(db, "posts"));
    posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('获取到文章:', posts.length, '篇');
  } catch (error) {
    console.error("获取文章失败:", error);
    searchList.innerHTML = '<li class="no-results">加载文章失败，请稍后再试</li>';
  }

  // 搜索函数
  function search(keyword) {
    console.log('搜索关键词:', keyword);
    keyword = keyword.toLowerCase().trim();
    searchList.innerHTML = ''; // 清空搜索结果

    if (!keyword) {
      searchList.innerHTML = '<li class="no-results">请输入搜索关键词</li>';
      return;
    }

    const results = posts.filter(post => {
      const titleMatch = post.title && post.title.toLowerCase().includes(keyword);
      const contentText = extractTextFromMarkdown(post.content);
      const contentMatch = contentText && contentText.toLowerCase().includes(keyword);
      const tagsMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(keyword));
      return titleMatch || contentMatch || tagsMatch;
    });

    console.log('搜索结果:', results.length, '篇');

    if (results.length === 0) {
      searchList.innerHTML = '<li class="no-results">没有找到相关文章</li>';
      return;
    }

    results.forEach(post => {
      const li = document.createElement('li');
      li.className = 'search-item';

      // 创建文章标题
      const title = document.createElement('h3');
      const titleLink = document.createElement('a');
      titleLink.href = `/pages/article.html?id=${post.id}`;
      titleLink.textContent = post.title || '无标题';
      title.appendChild(titleLink);

      // 创建文章预览
      const preview = document.createElement('p');
      if (post.content) {
        const plainText = extractTextFromMarkdown(post.content);
        const previewText = plainText.substring(0, 200) + '...';
        preview.textContent = previewText;
      } else {
        preview.textContent = '暂无内容预览';
      }

      // 创建标签列表
      const tags = document.createElement('div');
      tags.className = 'tags';
      if (post.tags && post.tags.length > 0) {
        post.tags.forEach(tag => {
          const tagSpan = document.createElement('span');
          tagSpan.className = 'tag';
          tagSpan.textContent = tag;
          tags.appendChild(tagSpan);
        });
      }

      // 添加所有元素到列表项
      li.appendChild(title);
      li.appendChild(preview);
      li.appendChild(tags);
      searchList.appendChild(li);
    });
  }

  // 监听输入事件
  let debounceTimer;
  searchInput.addEventListener('input', function(e) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      search(e.target.value);
    }, 300);
  });

  // 初始显示提示
  searchList.innerHTML = '<li class="no-results">请输入搜索关键词</li>';
}); 