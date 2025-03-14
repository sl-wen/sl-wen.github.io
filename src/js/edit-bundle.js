import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../static/js/firebase.js';
import { marked } from 'marked';

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
        document.getElementById('preview').innerHTML = marked(article.content || '');
        
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
async function deleteArticle(articleId) {
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
            deleteButton.addEventListener('click', () => deleteArticle(articleId));
        }
        
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                window.location.href = `/pages/article.html?id=${articleId}`;
            });
        }
        
        // 实时预览
        if (editor && preview) {
            editor.addEventListener('input', () => {
                preview.innerHTML = marked(editor.value);
            });
        }
        
    } catch (error) {
        console.error('初始化失败:', error);
        showMessage(`初始化失败: ${error.message}`, 'error');
    }
}); 