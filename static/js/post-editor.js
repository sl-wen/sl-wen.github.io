import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

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

export class PostEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.createEditor();
    }

    createEditor() {
        this.container.innerHTML = `
            <div class="post-editor">
                <h3>创建新文章</h3>
                <div class="form-group">
                    <label for="title">标题</label>
                    <input type="text" id="title" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="content">内容</label>
                    <textarea id="content" class="form-control" rows="6" required></textarea>
                </div>
                <div class="form-group">
                    <label for="author">作者</label>
                    <input type="text" id="author" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="tags">标签（用逗号分隔）</label>
                    <input type="text" id="tags" class="form-control" placeholder="标签1,标签2,标签3">
                </div>
                <button id="submitPost" class="btn-submit">发布文章</button>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .post-editor {
                max-width: 800px;
                margin: 20px auto;
                padding: 20px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .form-group {
                margin-bottom: 15px;
            }
            .form-group label {
                display: block;
                margin-bottom: 5px;
                color: #333;
            }
            .form-control {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            .btn-submit {
                background-color: #4CAF50;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
            }
            .btn-submit:hover {
                background-color: #45a049;
            }
        `;
        document.head.appendChild(style);

        // 添加提交事件监听
        document.getElementById('submitPost').addEventListener('click', () => this.submitPost());
    }

    async submitPost() {
        try {
            const title = document.getElementById('title').value;
            const content = document.getElementById('content').value;
            const author = document.getElementById('author').value;
            const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);

            if (!title || !content || !author) {
                alert('请填写必要的字段（标题、内容、作者）');
                return;
            }

            const post = {
                title,
                content,
                author,
                tags,
                createdAt: Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date())
            };

            const docRef = await addDoc(collection(db, "posts"), post);
            alert('文章发布成功！');
            
            // 清空表单
            document.getElementById('title').value = '';
            document.getElementById('content').value = '';
            document.getElementById('tags').value = '';
            
            // 刷新文章列表（如果在同一页面）
            if (typeof getLatestPosts === 'function') {
                getLatestPosts();
            }
        } catch (error) {
            console.error('发布文章失败:', error);
            alert('发布文章失败: ' + error.message);
        }
    }
} 