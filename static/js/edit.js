import { supabase } from './supabase-config.js';
import { marked } from 'marked';

// 配置 marked 选项
marked.setOptions({
    breaks: true, // 支持 GitHub 风格的换行
    gfm: true,    // 启用 GitHub 风格的 Markdown
    headerIds: true, // 为标题添加 id
    mangle: false, // 不转义标题中的字符
    sanitize: true, // 允许 HTML 标签
});

function getCursorLine(textarea) {
    const value = textarea.value;
    const selectionStart = textarea.selectionStart;

    // 截取到光标，统计有多少个换行符，就是光标所在行号
    return value.substring(0, selectionStart).split('\n').length - 1;
}

function renderPreviewByLine(text) {
    // 1. 分割原始Markdown文本为行
    const markdownLines = text.split('\n');
    
    // 2. 标记各种特殊Markdown结构
    let inCodeBlock = false;
    let inTable = false;
    let inHtmlBlock = false;
    
    const markedLines = markdownLines.map((line, i) => {
        // 检测代码块开始和结束
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
        }
        
        // 检测表格行
        if (line.trim().startsWith('|') && line.includes('|', 1)) {
            inTable = true;
        } else if (inTable && line.trim() === '') {
            inTable = false;
        }
        
        // 检测HTML块
        if (line.trim().startsWith('<') && !line.trim().startsWith('</') && !line.includes('/>')) {
            inHtmlBlock = true;
        } else if (inHtmlBlock && line.includes('</')) {
            inHtmlBlock = false;
        }
        
        // 只在安全区域添加行锚点标记
        if (!inCodeBlock && !inTable && !inHtmlBlock) {
            // 使用一个不太可能在正常文本中出现的标记
            return `${line}\n<!-- SAFE_LINE_ANCHOR_${i} -->`;
        }
        return line;
    });
    
    // 3. 渲染Markdown
    const htmlContent = safeMarked(markedLines.join('\n'));
    
    // 4. 将自定义标记替换为实际的锚点span
    const contentWithAnchors = htmlContent.replace(
        /<!-- SAFE_LINE_ANCHOR_(\d+) -->/g, 
        (match, lineNum) => `<span class="md-line-anchor" data-line="${lineNum}" id="line-anchor-${lineNum}"></span>`
    );
    
    return contentWithAnchors;
}

function scrollPreviewToLine(lineNumber) {
    const anchor = document.querySelector(`#line-anchor-${lineNumber}`);
    if (anchor) {
        anchor.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
}

// 添加滚动结束检测
function onScrollEnd(element, callback) {
    let timer;
    element.addEventListener('scroll', function () {
        // 清除之前的定时器
        clearTimeout(timer);
        // 设置新的定时器，滚动停止后执行回调
        timer = setTimeout(function () {
            callback();
        }, 300); // 300ms 无滚动视为滚动结束
    });
}

/**
 * 计算编辑框中可见的第一行行号
 * @param {HTMLTextAreaElement} textarea - 文本区域元素
 * @return {number} 可见的第一行行号（从0开始）
 */
function getVisibleFirstLine(textarea) {
    // 获取文本框的滚动位置
    const scrollTop = textarea.scrollTop;
    
    // 获取文本框的样式
    const style = window.getComputedStyle(textarea);
    
    // 获取内边距
    const paddingTop = parseFloat(style.paddingTop) || 0;
    
    // 计算实际滚动位置（考虑内边距）
    const effectiveScrollTop = Math.max(0, scrollTop - paddingTop);
    
    // 获取行高
    let lineHeight;
    if (style.lineHeight === 'normal') {
        // 'normal'通常是字体大小的1.2倍左右
        const fontSize = parseFloat(style.fontSize) || 16;
        lineHeight = fontSize * 1.2;
    } else {
        lineHeight = parseFloat(style.lineHeight) || 18;
    }
    
    // 估算第一个可见行（从0开始）
    const firstVisibleLine = Math.floor(effectiveScrollTop / lineHeight);
    
    return firstVisibleLine;
}

// 创建自定义渲染器
const renderer = new marked.Renderer();
renderer.image = function (href, title, text) {
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

// 显示消息
function showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) return;

    container.innerHTML = `
        <div class="${type}-message">
            ${message}
        </div>
    `;
}

// 加载文章
async function loadArticle(articleId) {
    try {
        console.log('正在加载文章:', articleId);
        const { data: article, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', articleId)
            .single();

        if (error || !article) {
            showMessage('文章不存在', 'error');
            return;
        }
        console.log('获取到文章数据:', article);

        // 填充表单
        document.getElementById('title').value = article.title || '';
        document.getElementById('author').value = article.author || '';
        document.getElementById('tags').value = article.tags ? article.tags.join(', ') : '';
        document.getElementById('editor').value = article.content || '';

        // 更新预览
        document.getElementById('preview').innerHTML = renderPreviewByLine(article.content);

    } catch (error) {
        console.error('加载文章失败:', error);
        showMessage(`加载文章失败: ${error.message}`, 'error');
    }
}

// 更新文章
async function updateArticle(articleId) {
    try {
        const title = document.getElementById('title').value.trim();
        const author = document.getElementById('author').value.trim();
        const tags = document.getElementById('tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        const content = document.getElementById('editor').value.trim();

        if (!title || !content) {
            showMessage('标题和内容不能为空', 'error');
            return;
        }


        const { error } = await supabase
            .from('posts')
            .update({
                title,
                author: author || 'Admin',
                tags,
                content,
                updated_at: new Date()
            })
            .eq('id', articleId);

        showMessage('文章更新成功！', 'success');
        setTimeout(() => {
            window.location.href = `/pages/article.html?id=${articleId}`;
        }, 1500);

    } catch (error) {
        console.error('更新文章失败:', error);
        showMessage(`更新文章失败: ${error.message}`, 'error');
    }
}

// 删除文章
async function handleDeleteArticle(articleId) {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复！')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', articleId);
        showMessage('文章删除成功！', 'success');
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
    } catch (error) {
        console.error('删除文章失败:', error);
        showMessage(`删除文章失败: ${error.message}`, 'error');
    }
}

// 将删除函数暴露到全局作用域
window.deleteArticle = handleDeleteArticle;

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');

        if (!articleId) {
            showMessage('错误：未指定文章ID', 'error');
            return;
        }

        // 加载文章
        loadArticle(articleId);

        // 绑定按钮事件
        const updateButton = document.getElementById('update-button');
        const deleteButton = document.getElementById('delete-button');
        const cancelButton = document.getElementById('cancel-button');
        const editor = document.getElementById('editor');
        const preview = document.getElementById('preview');


        if (updateButton) {
            updateButton.addEventListener('click', () => updateArticle(articleId));
        }

        if (deleteButton) {
            deleteButton.addEventListener('click', () => handleDeleteArticle(articleId));
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                window.location.href = `/pages/article.html?id=${articleId}`;
            });
        }

        // 实时预览
        if (editor && preview) {
            editor.addEventListener('input', () => {
                preview.innerHTML = renderPreviewByLine(editor.value);
                // 渲染后再滚动
                setTimeout(() => {
                    const lineNumber = getCursorLine(editor);
                    scrollPreviewToLine(lineNumber);
                }, 10); // 短暂延时确保DOM已更新
            });

            editor.addEventListener('keyup', () => {
                // 只在导航键按下时滚动
                const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
                if (navKeys.includes(e.key)) {
                    const lineNumber = getCursorLine(editor);
                    scrollPreviewToLine(lineNumber);
                }
            });

            editor.addEventListener('click', () => {
                const lineNumber = getCursorLine(editor);
                scrollPreviewToLine(lineNumber);
            });

            // 滚动同步
            onScrollEnd(editor, function () {
                const firstVisibleLine = getVisibleFirstLine(editor);
                scrollPreviewToLine(firstVisibleLine);
            });

        }

    } catch (error) {
        console.error('初始化失败:', error);
        showMessage(`初始化失败: ${error.message}`, 'error');
    }
});