import { doc, getDoc, updateDoc, deleteDoc } from '@firebase/firestore';
import { db } from '../../static/js/firebase.js';
import { marked } from 'marked';

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
renderer.image = function(href, title, text) {
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
        const docRef = doc(db, 'posts', articleId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            showMessage('文章不存在', 'error');
            return;
        }
        
        const article = docSnap.data();
        console.log('获取到文章数据:', article);
        
        // 填充表单
        document.getElementById('title').value = article.title || '';
        document.getElementById('author').value = article.author || '';
        document.getElementById('tags').value = article.tags ? article.tags.join(', ') : '';
        document.getElementById('editor').value = article.content || '';
        
        // 更新预览
        document.getElementById('preview').innerHTML = safeMarked(article.content);
        
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
        
        const docRef = doc(db, 'posts', articleId);
        await updateDoc(docRef, {
            title,
            author: author || 'Admin',
            tags,
            content,
            updatedAt: new Date()
        });
        
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
        const docRef = doc(db, 'posts', articleId);
        await deleteDoc(docRef);
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
                preview.innerHTML = safeMarked(editor.value);
            });
        }
        
    } catch (error) {
        console.error('初始化失败:', error);
        showMessage(`初始化失败: ${error.message}`, 'error');
    }
}); 