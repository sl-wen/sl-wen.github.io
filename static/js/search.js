import { marked } from 'marked';
import { supabase } from './supabase-config.js';
// 辅助函数：从 Markdown 文本中提取文本内容，包括代码块
function extractTextFromMarkdown(markdown) {
  if (!markdown) return { text: '', codeBlocks: [] };  // 如果输入为空，返回空对象

  // 提取代码块并保存
  const codeBlocks = [];
  const withoutCodeBlocks = markdown.replace(/```([^\n]*)[\s\S]*?```/g, (match, lang) => {
    codeBlocks.push({
      language: lang.trim(),
      code: match.slice(3 + lang.length, -3).trim()
    });
    return '';
  });

  // 提取行内代码并保存到代码块数组
  const withoutInlineCode = withoutCodeBlocks.replace(/`([^`]+)`/g, (match, code) => {
    codeBlocks.push({
      language: 'inline',
      code: code.trim()
    });
    return '';
  });

  // 处理其他 Markdown 语法
  const text = withoutInlineCode
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

  return { text, codeBlocks };
}

// 高亮匹配的内容
function highlightKeyword(html, keyword) {
  if (!keyword) return html;
  
  // 创建一个临时的 DOM 元素来解析 HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // 递归处理文本节点
  function highlightTextNode(node) {
    if (node.nodeType === 3) { // 文本节点
      const text = node.textContent;
      const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safeKeyword, 'gi');
      if (regex.test(text)) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(regex, match => `<span class="highlight">${match}</span>`);
        node.parentNode.replaceChild(span, node);
      }
    } else if (node.nodeType === 1) { // 元素节点
      // 不处理代码块和行内代码
      if (!['CODE', 'PRE'].includes(node.tagName)) {
        Array.from(node.childNodes).forEach(highlightTextNode);
      }
    }
  }
  
  Array.from(tempDiv.childNodes).forEach(highlightTextNode);
  return tempDiv.innerHTML;
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
      const { text: contentText, codeBlocks } = extractTextFromMarkdown(post.content);
      const contentMatch = contentText && contentText.toLowerCase().includes(keyword);
      const codeMatch = codeBlocks.some(block => 
        block.code.toLowerCase().includes(keyword) ||
        block.language.toLowerCase().includes(keyword)
      );
      const authorMatch = post.author && post.author.toLowerCase().includes(keyword);
      const tagsMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(keyword));
      return titleMatch || contentMatch || codeMatch || authorMatch || tagsMatch;
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
      titleLink.href = `/pages/article.html?post_id=${post.post_id}`;
      titleLink.innerHTML = highlightKeyword(post.title || '无标题', keyword);
      title.appendChild(titleLink);

      // 创建文章预览
      const preview = document.createElement('div');
      preview.className = 'search-preview';
      
      if (post.content) {
        const { text: contentText, codeBlocks } = extractTextFromMarkdown(post.content);
        const previewLink = document.createElement('a');
        previewLink.href = `/pages/article.html?post_id=${post.post_id}`;
        
        // 检查是否在代码块中找到匹配
        const matchingCodeBlock = codeBlocks.find(block => 
          block.code.toLowerCase().includes(keyword) ||
          block.language.toLowerCase().includes(keyword)
        );
        
        if (matchingCodeBlock) {
          // 如果在代码块中找到匹配，显示代码块预览
          const codePreview = document.createElement('pre');
          codePreview.className = 'markdown-body';
          if (matchingCodeBlock.language !== 'inline') {
            codePreview.innerHTML = `<code class="language-${matchingCodeBlock.language}">${
              highlightKeyword(matchingCodeBlock.code.substring(0, 500) + 
              (matchingCodeBlock.code.length > 500 ? '...' : ''), keyword)
            }</code>`;
          } else {
            codePreview.innerHTML = `<code>${
              highlightKeyword(matchingCodeBlock.code, keyword)
            }</code>`;
          }
          previewLink.appendChild(codePreview);
        } else {
          // 否则显示普通文本预览
          // 如果内容包含代码块，直接使用原始的 Markdown
          const previewText = post.content.substring(0, 500) + (post.content.length > 500 ? '...' : '');
          const parsedHtml = marked.parse(previewText);
          previewLink.innerHTML = parsedHtml;
          
          // 只在非代码块区域高亮关键词
          const codeBlocks = previewLink.querySelectorAll('pre code');
          const textNodes = Array.from(previewLink.childNodes).filter(node => 
            !Array.from(codeBlocks).some(block => block.contains(node))
          );
          
          textNodes.forEach(node => {
            if (node.nodeType === 3) { // 文本节点
              const text = node.textContent;
              const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(safeKeyword, 'gi');
              if (regex.test(text)) {
                const span = document.createElement('span');
                span.innerHTML = text.replace(regex, match => `<span class="highlight">${match}</span>`);
                node.parentNode.replaceChild(span, node);
              }
            }
          });
        }
        
        preview.appendChild(previewLink);
      } else {
        preview.textContent = '暂无内容预览';
      }

      // 创建作者信息
      const author = document.createElement('span');
      author.className = 'author';
      author.innerHTML = highlightKeyword(('作成者: ' + post.author) || '', keyword); 

      // 创建标签列表
      const tags = document.createElement('div');
      tags.className = 'tags';
      if (post.tags && post.tags.length > 0) {
        post.tags.forEach(tag => {
          const tagSpan = document.createElement('span');
          tagSpan.className = 'tag';
          tagSpan.innerHTML = highlightKeyword(tag, keyword);
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