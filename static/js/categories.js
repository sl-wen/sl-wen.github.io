import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase-config.js';

// 格式化日期
function formatDate(timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// 等待 Firebase 初始化完成
async function waitForFirebase() {
    return new Promise(resolve => {
      const checkFirebase = () => {
        if (db) {
          resolve(db);
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      checkFirebase();
    });
}

// 获取文章分类
async function getCategories() {
    const container = document.getElementById('categories-container');
    const statusDiv = document.getElementById('status-messages');
    
    try {
        if (statusDiv) {
            statusDiv.innerHTML += '<p>开始从 Firestore 获取文章数据...</p>';
        }
        
        // 等待 Firebase 初始化完成
        const db = await waitForFirebase();
        
        if (!db) {
          throw new Error('Firebase未初始化');
        }
        
        console.log('Firebase初始化成功，db:', typeof db);

        // 获取所有文章
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (statusDiv) {
            statusDiv.innerHTML += `<p>查询完成，找到 ${querySnapshot.size} 篇文章</p>`;
        }
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="no-posts">暂无文章，请先<a href="/pages/post.html">发布一篇文章</a></div>';
            return;
        }
        
        // 按标签分组文章
        const categorizedPosts = {};
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const tags = data.tags || ['未分类'];
            
            tags.forEach(tag => {
                if (!categorizedPosts[tag]) {
                    categorizedPosts[tag] = [];
                }
                
                categorizedPosts[tag].push({
                    id: doc.id,
                    title: data.title || '无标题',
                    createdAt: data.createdAt
                });
            });
        });
        
        // 显示分类
        let categoriesHtml = '';
        
        // 按分类名称排序
        const categories = Object.keys(categorizedPosts).sort();
        
        categories.forEach(category => {
            const posts = categorizedPosts[category];
            
            categoriesHtml += `
                <div class="category-list">
                    <h2 class="category-name">${category}</h2>
                    <ul class="post-list">
            `;
            
            posts.forEach(post => {
                const date = post.createdAt ? formatDate(post.createdAt) : '未知日期';
                
                categoriesHtml += `
                    <li>
                        <span class="post-date">${date}</span>
                        <a href="/pages/article.html?id=${post.id}">${post.title}</a>
                    </li>
                `;
            });
            
            categoriesHtml += `
                    </ul>
                </div>
            `;
        });
        
        container.innerHTML = categoriesHtml;
        
        if (statusDiv) {
            statusDiv.innerHTML += '<p>分类渲染完成</p>';
        }
        
    } catch (error) {
        console.error('获取分类失败:', error);
        container.innerHTML = `<div class="error">加载分类失败: ${error.message}</div>`;
        
        if (statusDiv) {
            statusDiv.innerHTML += `
                <p style="color: red;">错误: ${error.message}</p>
                <p>错误详情: ${JSON.stringify(error)}</p>
            `;
        }
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', getCategories); 