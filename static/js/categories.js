import { supabase } from './supabase-config.js';
import { formatDate } from './common.js';

// 获取文章分类
async function getCategories() {
    const container = document.getElementById('categories-container');
    const statusDiv = document.getElementById('status-messages');
    
    try {
        if (statusDiv) {
            statusDiv.innerHTML += '<p>开始从 Supabase 获取文章数据...</p>';
        }

        // 获取所有文章
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (statusDiv) {
            statusDiv.innerHTML += `<p>查询完成，找到 ${posts.length} 篇文章</p>`;
        }
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="no-posts">暂无文章，请先<a href="/pages/post.html">发布一篇文章</a></div>';
            return;
        }
        
        // 按标签分组文章
        const categorizedPosts = {};
        
        posts.forEach(post => {
            const tags = post.tags || ['未分类'];
            
            tags.forEach(tag => {
                if (!categorizedPosts[tag]) {
                    categorizedPosts[tag] = [];
                }
                
                categorizedPosts[tag].push({
                    post_id: post.post_id,
                    title: post.title || '无标题',
                    created_at: post.created_at,
                    views: post.views || 0
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
                const date = post.created_at ? formatDate(post.created_at) : '未知日期';
                
                categoriesHtml += `
                    <li>
                        <span class="post-date">${date}</span>
                        <a href="/pages/article.html?post_id=${post.post_id}">${post.title}</a>
                        <span class="post-views">👁️‍🗨️ ${post.views}</span>
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