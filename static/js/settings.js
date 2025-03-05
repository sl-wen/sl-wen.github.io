// 确保DOM加载完成后再执行
document.addEventListener('DOMContentLoaded', function() {
    // 绑定保存按钮事件
    const saveButton = document.querySelector('button[onclick="saveSettings()"]');
    if (saveButton) {
        saveButton.addEventListener('click', saveSettings);
    }

    // 绑定测试按钮事件
    const testButton = document.querySelector('button[onclick="testToken()"]');
    if (testButton) {
        testButton.addEventListener('click', testToken);
    }

    // 加载已保存的token
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
        const tokenInput = document.getElementById('github-token');
        if (tokenInput) {
            tokenInput.value = savedToken;
        }
    }

    // 添加页面加载完成后的自动测试
    if (savedToken) {
        console.log('找到已保存的Token，正在验证...');
        testToken();
    }
});

// 保存设置
function saveSettings() {
    console.log('保存设置被调用');
    const tokenInput = document.getElementById('github-token');
    if (!tokenInput) {
        console.error('找不到token输入框');
        return;
    }

    const token = tokenInput.value.trim();
    if (!token) {
        alert('请输入GitHub Token!');
        return;
    }

    try {
        // 先验证token
        validateGitHubToken(token).then(valid => {
            if (valid) {
                // 验证成功后再保存
                try {
                    localStorage.setItem('github_token', token);
                    console.log('Token已保存到localStorage');
                    alert('Token保存成功并验证有效！');
                    updateTokenStatus('Token有效', true);
                } catch (storageError) {
                    console.error('Token存储失败:', storageError);
                    alert('Token验证成功但存储失败：' + storageError.message);
                }
            } else {
                alert('Token无效，请检查Token权限是否正确！');
                updateTokenStatus('Token无效', false);
            }
        }).catch(error => {
            console.error('Token验证过程出错:', error);
            updateTokenStatus('验证过程出错: ' + error.message, false);
        });
    } catch (error) {
        console.error('保存设置失败:', error);
        alert('保存设置失败：' + error.message);
        updateTokenStatus('保存失败: ' + error.message, false);
    }
}

// 验证GitHub Token
async function validateGitHubToken(token) {
    try {
        console.log('开始验证Token');
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        console.log('API响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Token验证成功，用户:', data.login);
            // 存储用户信息
            localStorage.setItem('github_user', data.login);
            return true;
        }
        
        console.log('Token验证失败，状态码:', response.status);
        return false;
    } catch (error) {
        console.error('Token验证出错:', error);
        throw error;
    }
}

// 更新token状态显示
function updateTokenStatus(message, isValid) {
    const statusDiv = document.getElementById('token-status');
    if (statusDiv) {
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.className = isValid ? 'status-valid' : 'status-invalid';
        statusDiv.innerHTML = '';
        statusDiv.appendChild(messageElement);
    }
}

// 测试Token
async function testToken() {
    console.log('测试Token被调用');
    const token = localStorage.getItem('github_token');
    const statusDiv = document.getElementById('token-status');
    
    if (!token) {
        updateTokenStatus('未找到保存的Token', false);
        return;
    }

    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            statusDiv.innerHTML = '';
            
            const statusP = document.createElement('p');
            statusP.className = 'status-valid';
            statusP.textContent = 'Token有效';
            
            const userP = document.createElement('p');
            userP.textContent = `用户名: ${data.login}`;
            
            const scopesP = document.createElement('p');
            const scopes = response.headers.get('X-OAuth-Scopes');
            scopesP.textContent = `Token权限: ${scopes || '未获取到权限信息'}`;
            
            statusDiv.appendChild(statusP);
            statusDiv.appendChild(userP);
            statusDiv.appendChild(scopesP);
        } else {
            const errorData = await response.json();
            statusDiv.innerHTML = '';
            
            const statusP = document.createElement('p');
            statusP.className = 'status-invalid';
            statusP.textContent = 'Token无效';
            
            const errorP = document.createElement('p');
            errorP.textContent = `错误信息: ${errorData.message}`;
            
            statusDiv.appendChild(statusP);
            statusDiv.appendChild(errorP);
        }
    } catch (error) {
        console.error('测试失败:', error);
        updateTokenStatus(`测试失败: ${error.message}`, false);
    }
} 