function publishPost() {
  const title = document.getElementById('post-title').value;
  const categories = document.getElementById('post-categories').value;
  const content = document.getElementById('post-content').value;
  
  if(!title || !content) {
    alert('标题和内容不能为空!');
    return;
  }

  // 生成文章文件名
  const date = new Date();
  const fileName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${title.toLowerCase().replace(/\s+/g, '-')}.md`;

  // 生成文章内容
  const postContent = `---
layout: mypost
title: ${title}
categories: [${categories}]
---

${content}`;

  // 获取GitHub Token
  const githubToken = localStorage.getItem('github_token');
  if(!githubToken) {
    alert('请先配置GitHub Token!');
    return;
  }

  // 先获取主分支的最新commit SHA
  getMainBranchSHA(githubToken)
    .then(sha => createGitHubFile(fileName, postContent, githubToken, sha))
    .catch(error => {
      console.error('Error:', error);
      alert('发布出错!');
    });
}

// 获取主分支最新commit SHA
async function getMainBranchSHA(token) {
  const apiUrl = 'https://api.github.com/repos/sl-wen/sl-wen.github.io/branches/main';
  
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error('获取分支信息失败');
  }

  const data = await response.json();
  return data.commit.sha;
}

async function createGitHubFile(fileName, content, token, parentSHA) {
  const apiUrl = `https://api.github.com/repos/sl-wen/sl-wen.github.io/contents/_posts/${fileName}`;
  
  try {
    // 创建文件
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add new post: ${fileName}`,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: 'main',
        sha: parentSHA
      })
    });

    if(response.ok) {
      // 文件创建成功后自动部署
      await deployToGitHubPages(token);
      alert('发布成功!');
      window.location.href = '/';
    } else {
      alert('发布失败,请检查GitHub配置!');
    }
  } catch(error) {
    console.error('Error:', error);
    alert('发布出错!');
  }
}

// 触发GitHub Pages部署
async function deployToGitHubPages(token) {
  const apiUrl = 'https://api.github.com/repos/sl-wen/sl-wen.github.io/pages/builds';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      console.warn('触发部署失败，但文件已保存');
    }
  } catch (error) {
    console.warn('触发部署失败，但文件已保存:', error);
  }
} 