async function deletePost(fileName) {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复！')) {
        return;
    }

    const token = localStorage.getItem('github_token');
    if (!token) {
        alert('请先配置 GitHub Token！');
        return;
    }

    try {
        // 获取文件的 SHA
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

        // 删除文件
        const response = await fetch(`https://api.github.com/repos/sl-wen/sl-wen.github.io/contents/_posts/${fileName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Delete post: ${fileName}`,
                sha: fileData.sha
            })
        });

        if (!response.ok) {
            throw new Error('删除文章失败');
        }

        alert('文章删除成功！');
        window.location.href = '/';
    } catch (error) {
        console.error('删除文章失败:', error);
        alert('删除文章失败: ' + error.message);
    }
} 