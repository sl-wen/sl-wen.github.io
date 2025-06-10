// 发布页面的打包入口文件
import { marked } from 'marked';
import { supabase } from './supabase-config.js';

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
        }, 150); // 150ms 无滚动视为滚动结束
    });
}

// 计算编辑框中可见的第一行
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

// 初始化编辑器
async function initEditor() {
    const statusDiv = document.getElementById('status-messages');
    if (statusDiv) {
        statusDiv.innerHTML += '<p>初始化编辑器...</p>';
    }

    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');
    const form = document.getElementById('post-form');
    const tagsInput = document.getElementById('tags');

    if (!editor || !preview || !form || !tagsInput) {
        console.error('找不到必要的DOM元素');
        return;
    }

    const authordiv = document.getElementById('author');
    const userSessionStr = sessionStorage.getItem('userSession');
    const userProfileStr = sessionStorage.getItem('userProfile');
    // 解析 JSON 字符串
    const userSession = userSessionStr ? JSON.parse(userSessionStr) : null;
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
    if (authordiv && userSession) {
        authordiv.value = userProfile?.username || userSession?.user.email;
    }

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

    // 表单提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '发布中...';

        if (statusDiv) {
            statusDiv.innerHTML += '<p>开始处理表单提交...</p>';
        }

        try {
            const title = document.getElementById('title').value.trim();
            const content = editor.value.trim();
            const author = document.getElementById('author').value.trim() || 'sl-wen';
            const tags = tagsInput.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            if (!title || !content) {
                throw new Error('标题和内容不能为空');
            }

            if (statusDiv) {
                statusDiv.innerHTML += `<p>准备文章数据: 标题=${title}, 作者=${author}, 标签数=${tags.length}</p>`;
            }

            const post = {
                title,
                content,
                author,
                tags,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                views: 0
            };

            if (statusDiv) {
                statusDiv.innerHTML += '<p>正在添加文章到 Supabase...</p>';
            }

            const { data: newPost, error } = await supabase
                .from('posts')
                .insert([post])
                .select()
                .single();

            if (error) throw error;

            if (statusDiv) {
                statusDiv.innerHTML += `<p>文章添加成功，ID: ${newPost.id}</p>`;
            }

            // 显示成功消息
            const message = document.createElement('div');
            message.className = 'success-message';
            message.textContent = '文章发布成功！';
            form.insertBefore(message, form.lastChild);

            // 重置表单
            form.reset();
            preview.innerHTML = '';

            // 3秒后跳转到文章页面
            if (statusDiv) {
                statusDiv.innerHTML += '<p>3秒后将跳转到文章页面</p>';
            }
            setTimeout(() => {
                window.location.href = `/pages/article.html?id=${newPost.id}`;
            }, 3000);

        } catch (error) {
            console.error('发布失败:', error);
            if (statusDiv) {
                statusDiv.innerHTML += `<p style="color: red;">发布失败: ${error.message}</p>`;
            }

            const message = document.createElement('div');
            message.className = 'error-message';
            message.textContent = `发布失败: ${error.message}`;
            form.insertBefore(message, form.firstChild);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '发布文章';
        }
    });
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status-messages');
    if (statusDiv) {
        statusDiv.style.display = 'none';
        statusDiv.innerHTML += '<p>页面加载完成，开始初始化...</p>';
    }

    // 初始化编辑器
    initEditor();
});