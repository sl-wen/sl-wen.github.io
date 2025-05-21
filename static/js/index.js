// Supabase主页面的入口文件
import { marked } from 'marked';
import { supabase } from './supabase-config.js';

// 格式化日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
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
        const date = new Date(post.created_at);  // 修正字段名
        const year = date.getFullYear();
        
        if (!groupedPosts[year]) {
            groupedPosts[year] = [];
        }
        
        groupedPosts[year].push(post);
    });
    
    console.log('分组结果:', groupedPosts);  // 添加调试日志
    return groupedPosts;
}

// 获取文章
async function getPosts() {
    try {
        const statusDiv = document.getElementById('status-messages');
        if (statusDiv) {
            statusDiv.innerHTML += '<p>开始从 Supabase 获取文章数据...</p>';
        }
        
        // 获取文章列表容器
        const container = document.getElementById('posts-container');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">加载中...</div>';
        
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
        
        // 处理文章数据
        const processedPosts = posts.map(post => ({
            id: post.id,
            title: post.title || '无标题',
            author: post.author || '未知',
            created_at: post.created_at,
            content: post.content,
            views: post.views || 0
        }));
        
        // 按年份分组
        const groupedPosts = groupPostsByYear(processedPosts);
        
        // 显示文章
        let postsHtml = '';
        
        // 按年份降序排列
        const years = Object.keys(groupedPosts).sort((a, b) => b - a);
        
        years.forEach(year => {
            postsHtml += `<h1>${year}</h1><ul class="post-list">`;
            
            groupedPosts[year].forEach(post => {
                const date = formatDate(post.created_at);
                
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
window.getPosts = getPosts;
window.marked = marked;