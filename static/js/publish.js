async function publishPost() {
  console.log('开始发布文章...');
  
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

  try {
    // 直接创建commit
    await createCommit(fileName, postContent);
    alert('文章发布成功！');
    window.location.href = '/';
  } catch (error) {
    console.error('发布失败:', error);
    alert('发布失败: ' + error.message);
  }
}

async function createCommit(fileName, content) {
  const token = localStorage.getItem('github_token');
  if (!token) {
    throw new Error('请先配置GitHub Token');
  }

  const owner = 'sl-wen'; // 替换为你的GitHub用户名
  const repo = 'sl-wen.github.io'; // 替换为你的仓库名
  const path = `_posts/${fileName}`;

  // 1. 获取最新的commit信息
  const refResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`,
    {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );
  const refData = await refResponse.json();
  const latestCommitSha = refData.object.sha;

  // 2. 获取当前树信息
  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${latestCommitSha}`,
    {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );
  const treeData = await treeResponse.json();

  // 3. 创建新的blob
  const blobResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content,
        encoding: 'utf-8'
      })
    }
  );
  const blobData = await blobResponse.json();

  // 4. 创建新的树
  const newTreeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees`,
    {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base_tree: treeData.sha,
        tree: [{
          path: path,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        }]
      })
    }
  );
  const newTreeData = await newTreeResponse.json();

  // 5. 创建新的commit
  const commitResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add new post: ${fileName}`,
        tree: newTreeData.sha,
        parents: [latestCommitSha]
      })
    }
  );
  const commitData = await commitResponse.json();

  // 6. 更新引用
  const updateRefResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sha: commitData.sha,
        force: true
      })
    }
  );

  if (!updateRefResponse.ok) {
    throw new Error('更新分支失败');
  }

  return commitData;
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