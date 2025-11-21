// Supabase主页面的入口文件
import { supabase } from './supabase-config.js';
import { formatDate } from './common.js';

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
        
        container.innerHTML = `
        <div class="loading">
          <div class="octocat-container">
          <svg class="octocat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="32" height="32">
            <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          <div class="octocat-arm"></div>
          </div>
          <p class="loading-text">加载中...</p>
        </div>
       `;
        
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
            container.innerHTML = '<div class="no-posts">暂无文章，请先<a href="pages/post.html">发布一篇文章</a></div>';
            return;
        }
        
        // 处理文章数据
        const processedPosts = posts.map(post => ({
            post_id: post.post_id,
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
                        <a href="pages/article.html?post_id=${post.post_id}">${post.title}</a>
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