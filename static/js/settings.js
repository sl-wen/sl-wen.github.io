function saveSettings() {
  const token = document.getElementById('github-token').value;
  
  if(token) {
    // 保存token到localStorage
    localStorage.setItem('github_token', token);
    alert('设置保存成功!');
  } else {
    alert('请输入GitHub Token!');
  }
}

// 页面加载时填充已保存的设置
document.addEventListener('DOMContentLoaded', function() {
  const savedToken = localStorage.getItem('github_token');
  if(savedToken) {
    document.getElementById('github-token').value = savedToken;
  }
}); 