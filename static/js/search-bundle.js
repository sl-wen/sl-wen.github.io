import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase.js';

// 初始化搜索功能
async function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.querySelector('.list-search');
    const loadingIcon = document.querySelector('.icon-loading');

    if (!searchInput || !searchResults) {
        console.error('搜索组件未找到');
        return;
    }

    try {
        // 获取所有文章
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        // 存储所有文章数据
        const posts = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            posts.push({
                id: doc.id,
                title: data.title || '无标题',
                content: data.content || '',
                createdAt: data.createdAt
            });
        });

        // 生成搜索结果列表
        const generateSearchResults = (searchTerm) => {
            searchResults.innerHTML = '';
            if (!searchTerm.trim()) {
                return;
            }

            const searchTermLower = searchTerm.toLowerCase();
            const matchedPosts = posts.filter(post => 
                post.title.toLowerCase().includes(searchTermLower) ||
                post.content.toLowerCase().includes(searchTermLower)
            );

            if (matchedPosts.length === 0) {
                searchResults.innerHTML = '<li>没有找到相关文章</li>';
                return;
            }

            matchedPosts.forEach(post => {
                const li = document.createElement('li');
                const contentPreview = post.content.length > 200 
                    ? post.content.substring(0, 200) + '...' 
                    : post.content;

                li.innerHTML = `
                    <a href="/pages/article.html?id=${post.id}">
                        <p class="title">${highlightText(post.title, searchTerm)}</p>
                        <p class="content">${highlightText(contentPreview, searchTerm)}</p>
                    </a>
                `;
                searchResults.appendChild(li);
            });
        };

        // 高亮搜索词
        const highlightText = (text, searchTerm) => {
            if (!searchTerm.trim()) return text;
            const regex = new RegExp(searchTerm, 'gi');
            return text.replace(regex, match => `<span class="hint">${match}</span>`);
        };

        // 添加搜索事件监听
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            if (loadingIcon) {
                loadingIcon.style.opacity = '1';
            }
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                generateSearchResults(e.target.value);
                if (loadingIcon) {
                    loadingIcon.style.opacity = '0';
                }
            }, 300);
        });

    } catch (error) {
        console.error('搜索初始化失败:', error);
        if (loadingIcon) {
            loadingIcon.style.opacity = '0';
        }
        searchResults.innerHTML = '<li>搜索功能初始化失败</li>';
    }
}

// 页面加载完成后初始化搜索
document.addEventListener('DOMContentLoaded', initSearch); 