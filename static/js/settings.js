// 保存设置
function saveSettings() {
  const token = document.getElementById('github-token').value.trim();
  
  if(!token) {
    alert('请输入GitHub Token!');
    return;
  }

  try {
    // 保存token到localStorage
    localStorage.setItem('github_token', token);
    
    // 验证token是否有效
    validateGitHubToken(token).then(valid => {
      if(valid) {
        alert('Token保存成功并验证有效！');
      } else {
        alert('Token无效，请检查Token权限是否正确！');
        localStorage.removeItem('github_token');
      }
    });
  } catch(error) {
    console.error('保存设置失败:', error);
    alert('保存设置失败！');
  }
}

// 验证GitHub Token
async function validateGitHubToken(token) {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if(response.ok) {
      const data = await response.json();
      console.log('Token验证成功，用户:', data.login);
      return true;
    }
    return false;
  } catch(error) {
    console.error('Token验证失败:', error);
    return false;
  }
}

// 页面加载时填充已保存的设置
document.addEventListener('DOMContentLoaded', function() {
  const savedToken = localStorage.getItem('github_token');
  if(savedToken) {
    document.getElementById('github-token').value = savedToken;
    console.log('已加载保存的Token');
  }
});

// 添加调试信息
function checkToken() {
  const token = localStorage.getItem('github_token');
  console.log('当前保存的Token:', token ? '已存在' : '不存在');
  return token;
}

// 添加到settings.js
async function testToken() {
  const token = localStorage.getItem('github_token');
  const statusDiv = document.getElementById('token-status');
  
  if(!token) {
    statusDiv.innerHTML = '<p style="color: red;">未找到保存的Token</p>';
    return;
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    const data = await response.json();
    
    if(response.ok) {
      statusDiv.innerHTML = `
        <p style="color: green;">Token有效</p>
        <p>用户名: ${data.login}</p>
        <p>Token权限: ${Object.keys(data.permissions || {}).join(', ')}</p>
      `;
    } else {
      statusDiv.innerHTML = `
        <p style="color: red;">Token无效</p>
        <p>错误信息: ${data.message}</p>
      `;
    }
  } catch(error) {
    statusDiv.innerHTML = `
      <p style="color: red;">测试失败</p>
      <p>错误信息: ${error.message}</p>
    `;
  }
} 