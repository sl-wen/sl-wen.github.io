// 发布文章
async function publishPost() {
    console.log('开始发布文章...');
    
    // 获取token
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('请先在设置页面配置GitHub Token！');
        window.location.href = '/pages/settings.html';
        return;
    }

    // 获取表单数据
    const title = document.getElementById('post-title').value.trim();
    const categories = document.getElementById('post-categories').value.trim();
    const content = document.getElementById('post-content').value.trim();
    
    if (!title || !content) {
        alert('标题和内容不能为空！');
        return;
    }

    try {
        // 生成文件名
        const date = new Date();
        const fileName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${title.toLowerCase().replace(/\s+/g, '-')}.md`;

        // 生成文章内容
        const postContent = `---
layout: mypost
title: ${title}
categories: [${categories}]
---

${content}`;

        // 创建文件
        await createGitHubFile(fileName, postContent, token);
        
        alert('文章发布成功！');
        window.location.href = '/';
    } catch (error) {
        console.error('发布失败:', error);
        alert('发布失败: ' + error.message);
        updatePublishStatus('发布失败: ' + error.message, false);
    }
}

// 创建GitHub文件
async function createGitHubFile(fileName, content, token) {
    try {
        // 1. 先尝试获取仓库信息
        const repoResponse = await fetch('https://api.github.com/repos/sl-wen/sl-wen.github.io', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!repoResponse.ok) {
            const errorData = await repoResponse.json();
            console.error('获取仓库信息失败:', errorData);
            throw new Error(`仓库不存在或无法访问: ${errorData.message}`);
        }

        // 2. 直接创建文件，不依赖分支信息
        const response = await fetch(`https://api.github.com/repos/sl-wen/sl-wen.github.io/contents/_posts/${fileName}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Add new post: ${fileName}`,
                content: btoa(unescape(encodeURIComponent(content))),
                branch: 'master'  // 直接使用master分支
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('创建文件失败:', errorData);
            throw new Error(errorData.message);
        }

        const responseData = await response.json();
        console.log('文件创建成功:', responseData);

        // 3. 触发GitHub Actions工作流
        await triggerWorkflow(token);

        updatePublishStatus('文章发布成功！', true);
        return true;
    } catch (error) {
        console.error('创建文件失败:', error);
        throw error;
    }
}

// 触发GitHub Actions工作流
async function triggerWorkflow(token) {
    try {
        const response = await fetch('https://api.github.com/repos/sl-wen/sl-wen.github.io/dispatches', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_type: 'deploy',
                client_payload: {
                    unit: false,
                    integration: true,
                    timestamp: new Date().toISOString()
                }
            })
        });

        if (!response.ok) {
            console.warn('触发工作流失败。状态码:', response.status);
            const errorData = await response.json();
            console.warn('工作流错误详情:', errorData);
        } else {
            console.log('成功触发工作流');
        }
    } catch (error) {
        console.warn('触发工作流失败:', error);
    }
}

// 更新发布状态显示
function updatePublishStatus(message, isSuccess) {
    const statusDiv = document.getElementById('publish-status');
    if (statusDiv) {
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.className = isSuccess ? 'status-valid' : 'status-invalid';
        statusDiv.innerHTML = '';
        statusDiv.appendChild(messageElement);
    }
} 