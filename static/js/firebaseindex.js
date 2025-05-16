// Firebase主页面的打包入口文件
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
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

// 格式化日期
function formatDate(timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// 按年份分组文章
function groupPostsByYear(posts) {
    const groupedPosts = {};
    
    posts.forEach(post => {
        const date = post.createdAt.toDate();
        const year = date.getFullYear();
        
        if (!groupedPosts[year]) {
            groupedPosts[year] = [];
        }
        
        groupedPosts[year].push(post);
    });
    
    return groupedPosts;
}

// 获取文章
async function getPosts() {
    try {
        const statusDiv = document.getElementById('status-messages');
        if (statusDiv) {
            statusDiv.innerHTML += '<p>开始从 Firestore 获取文章数据...</p>';
        }
        
        // 获取文章列表容器
        const container = document.getElementById('posts-container');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">加载中...</div>';
        
        // 尝试获取文章
        const postsRef = collection(db, "posts");
        
        // 创建查询，按创建时间降序排列
        const q = query(postsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (statusDiv) {
            statusDiv.innerHTML += `<p>查询完成，找到 ${querySnapshot.size} 篇文章</p>`;
        }
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="no-posts">暂无文章，请先<a href="/pages/post.html">发布一篇文章</a></div>';
            return;
        }
        
        // 收集所有文章
        const posts = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            posts.push({
                id: doc.id,
                title: data.title || '无标题',
                author: data.author || '未知',
                createdAt: data.createdAt,
                content: data.content,
                views: data.views || 0
            });
        });
        
        // 按年份分组
        const groupedPosts = groupPostsByYear(posts);
        
        // 显示文章
        let postsHtml = '';
        
        // 按年份降序排列
        const years = Object.keys(groupedPosts).sort((a, b) => b - a);
        
        years.forEach(year => {
            postsHtml += `<h1>${year}</h1><ul class="post-list">`;
            
            groupedPosts[year].forEach(post => {
                const date = formatDate(post.createdAt);
                
                postsHtml += `
                    <li>
                        <span class="post-date">${date}</span>
                        <a href="/pages/article.html?id=${post.id}">${post.title}</a>
                        <span class="post-views">👁️‍🗨️ ${post.views}</span>
                    </li>
                `;
            });
            
            postsHtml += '</ul>';
        });
        
        container.innerHTML = postsHtml;
        if (statusDiv) {
            statusDiv.innerHTML += '<p>文章渲染完成</p>';
        }
        
    } catch (error) {
        console.error('出错:', error);
        const statusDiv = document.getElementById('status-messages');
        if (statusDiv) {
            statusDiv.innerHTML += `
                <p style="color: red;">错误: ${error.message}</p>
                <p>错误详情: ${JSON.stringify(error)}</p>
            `;
        }
        
        const container = document.getElementById('posts-container');
        if (container) {
            container.innerHTML = `
                <div class="error">加载文章失败，请查看控制台和下方错误信息</div>
            `;
        }
    }
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status-messages');
    if (statusDiv) {
        statusDiv.innerHTML += '<p>页面加载完成，开始初始化...</p>';
    }
    
    // 执行获取文章
    getPosts();
});

// 导出函数和变量，使其在全局可用
window.firebaseApp = app;
window.firestore = db;
window.getPosts = getPosts;
window.marked = marked; 