// 在文件顶部声明全局变量
let savedToken;

// 确保DOM加载完成后再执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成');
    
    // 检查token-status元素是否存在
    const statusDiv = document.getElementById('token-status');
    if (!statusDiv) {
        console.error('未找到token-status元素');
    } else {
        console.log('找到token-status元素');
    }

    // 检查已保存的token
    savedToken = localStorage.getItem('github_token'); // 使用已声明的变量
    if (savedToken) {
        console.log('找到已保存的Token，正在验证...');
        // 确保DOM完全加载后再测试token
        setTimeout(() => {
            testToken();
        }, 100);
    }

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

    // 加载已保存的token到输入框
    if (savedToken) {
        const tokenInput = document.getElementById('github-token');
        if (tokenInput) {
            tokenInput.value = savedToken;
        }
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
    if (!statusDiv) {
        console.error('未找到状态显示区域');
        return;
    }

    try {
        // 创建新的状态元素
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.className = isValid ? 'status-valid' : 'status-invalid';
        
        // 清空并更新状态区域
        statusDiv.innerHTML = '';
        statusDiv.appendChild(messageElement);
    } catch (error) {
        console.error('更新状态显示失败:', error);
    }
}

// 测试Token
async function testToken() {
    console.log('测试Token被调用');
    const statusDiv = document.getElementById('token-status');
    
    // 检查状态div是否存在
    if (!statusDiv) {
        console.error('未找到状态显示区域');
        return;
    }

    const token = localStorage.getItem('github_token');
    if (!token) {
        updateTokenStatus('未找到保存的Token', false);
        return;
    }

    try {
        const response = await fetch('https://api.github.com/user', {
            method: 'GET',
            headers: {
                'Authorization': 'token ' + token,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // 创建状态元素
            const statusElement = document.createElement('div');
            
            // 添加状态信息
            const statusP = document.createElement('p');
            statusP.className = 'status-valid';
            statusP.textContent = 'Token有效';
            statusElement.appendChild(statusP);
            
            // 添加用户信息
            const userP = document.createElement('p');
            userP.textContent = `用户名: ${data.login}`;
            statusElement.appendChild(userP);
            
            // 添加权限信息
            const scopesP = document.createElement('p');
            const scopes = response.headers.get('X-OAuth-Scopes');
            scopesP.textContent = `Token权限: ${scopes || '未获取到权限信息'}`;
            statusElement.appendChild(scopesP);
            
            // 清空并更新状态区域
            statusDiv.innerHTML = '';
            statusDiv.appendChild(statusElement);
        } else {
            const errorData = await response.json();
            updateTokenStatus(`Token无效: ${errorData.message}`, false);
        }
    } catch (error) {
        console.error('测试失败:', error);
        updateTokenStatus(`测试失败: ${error.message}`, false);
    }
} 