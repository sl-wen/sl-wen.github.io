document.addEventListener('DOMContentLoaded', function() {
    // 从 URL 参数获取文章信息
    const params = new URLSearchParams(window.location.search);
    const fileName = params.get('file');
    
    if (!fileName) {
        alert('未指定要编辑的文章！');
        window.location.href = '/';
        return;
    }

    // 加载文章内容
    loadPost(fileName);

    // 绑定按钮事件
    document.getElementById('updateButton').addEventListener('click', () => updatePost(fileName));
    document.getElementById('cancelButton').addEventListener('click', () => window.history.back());
});

async function loadPost(fileName) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('请先在设置页面配置 GitHub Token！');
        window.location.href = '/pages/settings.html';
        return;
    }

    try {
        // 获取文件内容
        const response = await fetch(`https://api.github.com/repos/sl-wen/sl-wen.github.io/contents/_posts/${fileName}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('获取文章失败');
        }

        const data = await response.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        
        // 解析文章内容
        const {title, categories, body} = parsePost(content);
        
        // 填充表单
        document.getElementById('post-title').value = title;
        document.getElementById('post-categories').value = categories;
        document.getElementById('post-content').value = body;
    } catch (error) {
        console.error('加载文章失败:', error);
        alert('加载文章失败: ' + error.message);
    }
}

async function updatePost(fileName) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('请先配置 GitHub Token！');
        return;
    }

    const title = document.getElementById('post-title').value.trim();
    const categories = document.getElementById('post-categories').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if (!title || !content) {
        alert('标题和内容不能为空！');
        return;
    }

    try {
        // 获取原文件的 SHA
        const fileResponse = await fetch(`https://api.github.com/repos/sl-wen/sl-wen.github.io/contents/_posts/${fileName}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!fileResponse.ok) {
            throw new Error('获取文件信息失败');
        }

        const fileData = await fileResponse.json();
        
        // 构建新的文章内容
        const postContent = `---
layout: mypost
title: ${title}
categories: [${categories}]
---

${content}`;

        // 更新文件
        const response = await fetch(`https://api.github.com/repos/sl-wen/sl-wen.github.io/contents/_posts/${fileName}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update post: ${fileName}`,
                content: btoa(unescape(encodeURIComponent(postContent))),
                sha: fileData.sha
            })
        });

        if (!response.ok) {
            throw new Error('更新文章失败');
        }

        alert('文章更新成功！');
        window.location.href = '/';
    } catch (error) {
        console.error('更新文章失败:', error);
        alert('更新文章失败: ' + error.message);
    }
}

function parsePost(content) {
    const matches = content.match(/^---([\s\S]*?)---([\s\S]*)$/);
    if (!matches) {
        return { title: '', categories: '', body: content };
    }

    const frontMatter = matches[1];
    const body = matches[2].trim();

    const titleMatch = frontMatter.match(/title:\s*(.+)/);
    const categoriesMatch = frontMatter.match(/categories:\s*\[(.*)\]/);

    return {
        title: titleMatch ? titleMatch[1].trim() : '',
        categories: categoriesMatch ? categoriesMatch[1].trim() : '',
        body: body
    };
} 