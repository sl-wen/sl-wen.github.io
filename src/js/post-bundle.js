// 发布页面的打包入口文件
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { marked } from 'marked';

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyCuXDfNvLwiISoMwzcUIwUbaPTl69uRnao",
    authDomain: "slwen-45838.firebaseapp.com",
    projectId: "slwen-45838",
    storageBucket: "slwen-45838.appspot.com",
    messagingSenderId: "734137620659",
    appId: "1:734137620659:web:81ce8b971dce766d67b8c6",
    measurementId: "G-WEBZLW3S59"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 初始化编辑器
function initEditor() {
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

    // 实时预览
    editor.addEventListener('input', () => {
        preview.innerHTML = marked.parse(editor.value);
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
            const tags = tagsInput.value.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
                
            const title = document.getElementById('title').value;
            const content = editor.value;
            const author = document.getElementById('author').value || 'Admin';

            if (statusDiv) {
                statusDiv.innerHTML += `<p>准备文章数据: 标题=${title}, 作者=${author}, 标签数=${tags.length}</p>`;
            }

            const post = {
                title: title,
                content: content,
                author: author,
                tags: tags,
                createdAt: Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date())
            };

            if (statusDiv) {
                statusDiv.innerHTML += '<p>正在添加文章到 Firestore...</p>';
            }
            
            const docRef = await addDoc(collection(db, "posts"), post);
            
            if (statusDiv) {
                statusDiv.innerHTML += `<p>文章添加成功，ID: ${docRef.id}</p>`;
            }
            
            // 显示成功消息
            const message = document.createElement('div');
            message.className = 'success-message';
            message.textContent = '文章发布成功！';
            form.insertBefore(message, form.firstChild);

            // 重置表单
            form.reset();
            preview.innerHTML = '';

            // 3秒后跳转到首页
            if (statusDiv) {
                statusDiv.innerHTML += '<p>3秒后将跳转到首页</p>';
            }
            setTimeout(() => {
                window.location.href = '/';
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
        statusDiv.innerHTML += '<p>页面加载完成，开始初始化...</p>';
    }
    
    // 初始化编辑器
    initEditor();
});

// 导出函数和变量，使其在全局可用
window.firebaseApp = app;
window.firestore = db;
window.marked = marked; 