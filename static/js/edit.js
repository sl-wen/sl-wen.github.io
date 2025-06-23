import { supabase } from './supabase-config.js';
import { marked } from 'marked';
import { getCursorLine, scrollPreviewToLine, showMessage,onScrollEnd, getVisibleFirstLine } from './common.js';

// 安全的 marked 解析函数
function safeMarked(content) {
    if (!content || typeof content !== 'string') {
        return '';
    }
    try {
        return marked.parse(content);
    } catch (error) {
        console.error('Markdown 解析错误:', error);
        return '内容解析错误';
    }
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

// 配置 marked 选项
marked.setOptions({
    breaks: true, // 支持 GitHub 风格的换行
    gfm: true,    // 启用 GitHub 风格的 Markdown
    headerIds: true, // 为标题添加 id
    mangle: false, // 不转义标题中的字符
    sanitize: true, // 允许 HTML 标签
});

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



marked.setOptions({ renderer });

// 加载文章
async function loadArticle(post_id) {
    try {
        console.log('正在加载文章:', post_id);
        const { data: article, error } = await supabase
            .from('posts')
            .select('*')
            .eq('post_id', post_id)
            .maybeSingle();

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
async function updateArticle(post_id) {
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
            .eq('post_id', post_id);

        showMessage('文章更新成功！', 'success');
        setTimeout(() => {
            window.location.href = `/pages/article.html?post_id=${post_id}`;
        }, 1500);

    } catch (error) {
        console.error('更新文章失败:', error);
        showMessage(`更新文章失败: ${error.message}`, 'error');
    }
}

// 删除文章
async function handleDeleteArticle(post_id) {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复！')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('post_id', post_id);
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
        const post_id = urlParams.get('post_id');

        if (!post_id) {
            showMessage('错误：未指定文章ID', 'error');
            return;
        }

        // 加载文章
        loadArticle(post_id);

        // 绑定按钮事件
        const updateButton = document.getElementById('update-button');
        const deleteButton = document.getElementById('delete-button');
        const cancelButton = document.getElementById('cancel-button');
        const editor = document.getElementById('editor');
        const preview = document.getElementById('preview');


        if (updateButton) {
            updateButton.addEventListener('click', () => updateArticle(post_id));
        }

        if (deleteButton) {
            deleteButton.addEventListener('click', () => handleDeleteArticle(post_id));
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                window.location.href = `/pages/article.html?post_id=${post_id}`;
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