document.addEventListener('DOMContentLoaded', function() {
    // 从 URL 参数获取文章信息
    const params = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    if (!articleId) {
        alert('未指定要编辑的文章！');
        window.location.href = '/';
        return;
    }

    // 加载文章内容
    // loadPost(articleId);

    // 绑定按钮事件
    // document.getElementById('updateButton').addEventListener('click', () => updatePost(articleId));
    // document.getElementById('cancelButton').addEventListener('click', () => window.history.back());
});

async function loadPost(articleId) {
    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('请先在设置页面配置 GitHub Token！');
        window.location.href = '/pages/settings.html';
        return;
    }

    try {
        // 获取文件内容
        const response = await fetch(`https://api.github.com/repos/sl-wen/sl-wen.github.io/contents/_posts/${articleId}`, {
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

// 添加状态管理
let isUpdating = false;

// 修改 updatePost 函数
async function updatePost(fileName) {
    // 检查是否正在更新
    if (isUpdating) {
        alert('文章正在更新中，请稍候...');
        return;
    }

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
        // 设置更新状态
        isUpdating = true;
        updateStatus('文章更新中...', 'updating');
        disableForm(true);

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

        // 触发 GitHub Actions 工作流
        await triggerWorkflow(token);

        // 等待部署完成（每5秒检查一次，最多等待2分钟）
        let deploymentComplete = false;
        for (let i = 0; i < 24; i++) {
            updateStatus(`文章已更新，正在部署中...(${i + 1}/24)`, 'deploying');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            try {
                // 检查文件是否可访问
                const checkResponse = await fetch(`/posts/${fileName.replace('.md', '.html')}`);
                if (checkResponse.ok) {
                    deploymentComplete = true;
                    break;
                }
            } catch (error) {
                console.log('等待部署完成...');
            }
        }

        if (deploymentComplete) {
            updateStatus('更新成功！即将返回文章页面...', 'success');
            setTimeout(() => {
                window.location.href = `/posts/${fileName.replace('.md', '.html')}`;
            }, 2000);
        } else {
            updateStatus('文章已更新，但部署可能需要更长时间...', 'warning');
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        }

    } catch (error) {
        console.error('更新文章失败:', error);
        updateStatus(`更新失败: ${error.message}`, 'error');
    } finally {
        // 重置更新状态
        isUpdating = false;
        disableForm(false);
    }
}

// 更新状态显示
function updateStatus(message, status) {
    const statusDiv = document.getElementById('edit-status');
    if (!statusDiv) return;

    statusDiv.innerHTML = '';
    const messageElement = document.createElement('div');
    messageElement.className = `status-message ${status}`;
    messageElement.textContent = message;
    
    if (status === 'updating' || status === 'deploying') {
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        messageElement.prepend(spinner);
    }
    
    statusDiv.appendChild(messageElement);
}

// 禁用/启用表单
function disableForm(disabled) {
    const elements = [
        document.getElementById('post-title'),
        document.getElementById('post-categories'),
        document.getElementById('post-content'),
        document.getElementById('updateButton'),
        document.getElementById('cancelButton')
    ];

    elements.forEach(element => {
        if (element) {
            element.disabled = disabled;
            // 添加或移除禁用状态的类
            if (disabled) {
                element.classList.add('disabled');
            } else {
                element.classList.remove('disabled');
            }
        }
    });

    // 如果是禁用状态，滚动到状态消息
    if (disabled) {
        const statusDiv = document.getElementById('edit-status');
        if (statusDiv) {
            statusDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// 触发 GitHub Actions 工作流
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
            throw new Error('触发部署失败');
        }
    } catch (error) {
        console.error('触发工作流失败:', error);
        throw error;
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