import { supabase } from './supabase-config.js';
// 辅助函数：从 Markdown 文本中提取纯文本内容
function extractTextFromMarkdown(markdown) {
  if (!markdown) return '';  // 如果输入为空，返回空字符串
  return markdown
    // 移除图片标记 ![alt](url)
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // 移除链接标记 [text](url)，但保留链接文字
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    // 移除标题标记 (#, ##, etc.)
    .replace(/#{1,6}\s/g, '')
    // 移除加粗标记 (**text** 或 __text__)
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    // 移除斜体标记 (*text* 或 _text_)
    .replace(/(\*|_)(.+?)\1/g, '$2')
    // 移除代码块 (```code```)
    .replace(/```[\s\S]*?```/g, '')
    // 移除行内代码 (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // 移除引用标记 (> text)
    .replace(/^\s*>\s*/gm, '')
    // 移除水平分隔线
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    // 移除无序列表标记
    .replace(/^\s*[-*+]\s+/gm, '')
    // 移除有序列表标记
    .replace(/^\s*\d+\.\s+/gm, '')
    // 移除多余的空行
    .replace(/\n\s*\n/g, '\n')
    .trim();  // 移除首尾空白
}

// 高亮匹配的内容
function highlightKeyword(text, keyword) {
  if (!keyword) return text;
  // 使用正则忽略大小写，并转义特殊字符
  const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 正则转义
  const regex = new RegExp(safeKeyword, 'gi');
  return text.replace(regex, (match) => `<span class="highlight">${match}</span>`);
}

// 搜索功能
document.addEventListener('DOMContentLoaded', async function() {
  const searchInput = document.getElementById('search-input');
  const searchList = document.querySelector('.search-list');
  let posts = [];

  // 从 Supabase 获取所有文章
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    posts = data;
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
      const authorMatch = post.author && post.author.toLowerCase().includes(keyword);
      const tagsMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(keyword));
      return titleMatch || contentMatch || authorMatch || tagsMatch;
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
      titleLink.innerHTML = highlightKeyword(post.title || '无标题', keyword);
      title.appendChild(titleLink);

      // 创建文章预览
      const preview = document.createElement('p');
      if (post.content) {
        const plainText = extractTextFromMarkdown(post.content);
        const previewText = plainText.substring(0, 200) + '...';
        preview.textContent = highlightKeyword(previewText, keyword);
      } else {
        preview.textContent = '暂无内容预览';
      }

      // 创建标签列表
      const author = document.createElement('span');
      author.className = 'author';
      author.textContent = highlightKeyword(post.author || '', keyword);

      // 创建标签列表
      const tags = document.createElement('div');
      tags.className = 'tags';
      if (post.tags && post.tags.length > 0) {
        post.tags.forEach(tag => {
          const tagSpan = document.createElement('span');
          tagSpan.className = 'tag';
          tagSpan.textContent = highlightKeyword(tag, keyword);
          tags.appendChild(tagSpan);
        });
      }

      // 添加所有元素到列表项
      li.appendChild(title);
      li.appendChild(preview);
      li.appendChild(author);
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