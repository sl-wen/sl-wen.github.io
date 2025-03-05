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
        // 检查localStorage是否可用
        if (typeof localStorage === 'undefined') {
            throw new Error('浏览器不支持localStorage');
        }

        // 测试localStorage
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');

        // 保存token到localStorage
        localStorage.setItem('github_token', token);
        console.log('Token已保存到localStorage');
        
        // 立即验证是否保存成功
        const savedToken = localStorage.getItem('github_token');
        console.log('保存后立即读取Token:', savedToken ? '成功' : '失败');
        
        if (!savedToken) {
            throw new Error('Token保存失败');
        }

        // 验证token
        validateGitHubToken(token).then(valid => {
            if (valid) {
                alert('Token保存成功并验证有效！');
                updateTokenStatus('Token有效', true);
            } else {
                alert('Token无效，请检查Token权限是否正确！');
                localStorage.removeItem('github_token');
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
        const response = await fetch('https://api.github.com/sl-wen', {
            headers: {
                'Authorization': `Bearer ${token}`, // 修改为Bearer认证
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        console.log('API响应状态:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Token验证成功，用户:', data.login);
            return true;
        }
        
        const errorData = await response.json();
        console.log('Token验证失败，错误信息:', errorData);
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
        statusDiv.innerHTML = `<p style="color: ${isValid ? 'green' : 'red'}">${message}</p>`;
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
        const response = await fetch('https://api.github.com/sl-wen', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
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
    } catch (error) {
        statusDiv.innerHTML = `
            <p style="color: red;">测试失败</p>
            <p>错误信息: ${error.message}</p>
        `;
    }
} 