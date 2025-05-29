import { supabase } from './supabase-config.js';

// 显示状态消息的函数
const showStatusMessage = (message, type) => {
  const statusContainer = document.getElementById('status-messages');
  if (!statusContainer) return;
  
  const messageElement = document.createElement('div');
  messageElement.className = `status-message ${type}`;
  messageElement.textContent = message;
  
  statusContainer.appendChild(messageElement);
  
  // 3秒后自动移除消息
  setTimeout(() => {
    messageElement.remove();
  }, 3000);
};

// 初始化认证UI
const initAuth = () => {
  // 登录监听
  const userStr = localStorage.getItem('user');
  if (userStr) {
    // 用户已登录，显示用户信息和登出按钮
    const authdiv = document.getElementById('auth');
    authdiv.innerHTML = `
      <span>欢迎，${JSON.parse(userStr).username || '用户'}</span>
      <span id="logout-btn">登出</span>
    `;

    // 添加登出事件监听
    setTimeout(() => {
      document.getElementById('logout-btn').addEventListener('click', logout);
    }, 0);
  }
  // 为登录表单添加提交事件监听
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // 阻止表单默认提交行为
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // 验证输入不为空
      if (!username || !password) {
        showStatusMessage('用户名和密码不能为空', 'error');
        return;
      }
      
      await login(username, password);
    });
  }

  // 为注册表单添加提交事件监听
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('signup-username').value;
      const password = document.getElementById('signup-password').value;
      const passwordAgain = document.getElementById('passwordagain').value;
      
      // 验证输入不为空
      if (!username || !password || !passwordAgain) {
        showStatusMessage('所有字段都必须填写', 'error');
        return;
      }
      
      // 验证两次密码输入是否一致
      if (password !== passwordAgain) {
        showStatusMessage('两次输入的密码不一致', 'error');
        return;
      }
      
      await signup(username, password);
    });
  }

  // 为忘记密码表单添加提交事件监听
  const forgetForm = document.getElementById('forget-form');
  if (forgetForm) {
    forgetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('forget-username').value;
      
      if (!username) {
        showStatusMessage('请输入用户名', 'error');
        return;
      }
      
      await resetPassword(username);
    });
  }
};

// 登录函数
const login = async (username, password) => {
  try {
    if (!username || !password) {
      throw new Error('用户名和密码不能为空');
    }

    // 获取登录信息
    const { data: userinfo, error: checkError } = await supabase
      .from('userinfo')
      .select('username, password')
      .eq('username', username)
      .single();
    
    if (checkError) throw checkError;
    if (!userinfo) throw new Error('用户不存在');

    if (userinfo.password === password) {
      showStatusMessage('登录成功！', 'success');
      // 保存登录状态
      localStorage.setItem('user', JSON.stringify(userinfo));
      // 跳转到首页
      window.location.href = '/';
    } else {
      throw new Error('密码不正确');
    }

    return userinfo;
  } catch (error) {
    showStatusMessage(error.message, 'error');
    return null;
  }
};

// 注册函数
const signup = async (username, password) => {
  try {
    // 检查用户名是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('userinfo')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      throw new Error('用户名已存在');
    }

    const newuserinfo = {
      username,
      password,
      level: 0,
      amount: 0,
      adress: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
  };

    // 创建新用户
    const { data, error } = await supabase
      .from('userinfo')
      .insert([newuserinfo])
      .select()
      .single();

    if (error) throw error;

    showStatusMessage('注册成功！请登录', 'success');
    // 切换到登录表单
    document.querySelector('[data-tag="login"]').click();

    return data;
  } catch (error) {
    showStatusMessage(error.message, 'error');
    return null;
  }
};

// 重置密码函数
const resetPassword = async (username) => {
  try {
    // 检查用户是否存在
    const { data: user, error: checkError } = await supabase
      .from('userinfo')
      .select('*')
      .eq('username', username)
      .single();

    if (!user) {
      throw new Error('用户不存在');
    }

    // TODO: 实现发送重置密码邮件的逻辑
    showStatusMessage('重置密码链接已发送到您的邮箱', 'success');

  } catch (error) {
    showStatusMessage(error.message, 'error');
  }
};

// 保存用户会话
function saveUserSession(userinfo) {
  // 创建会话对象
  const sessionData = {
    user: userinfo,
    token: generateSessionToken(), // 可以是随机生成的令牌或从服务器获取的令牌
    expiry: new Date().getTime() + (24 * 60 * 60 * 1000) // 24小时后过期
  };
  
  // 保存到 localStorage
  localStorage.setItem('userSession', JSON.stringify(sessionData));
  
  // 触发登录事件
  const loginEvent = new CustomEvent('userLogin', { detail: userinfo });
  document.dispatchEvent(loginEvent);
}

// 生成会话令牌
function generateSessionToken() {
  // 简单示例 - 实际应用中应使用更安全的方法
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// 检查用户是否已登录
function isLoggedIn() {
  const sessionStr = localStorage.getItem('userSession');
  if (!sessionStr) {
    return false;
  }
  
  try {
    const session = JSON.parse(sessionStr);
    
    // 检查会话是否过期
    if (new Date().getTime() > session.expiry) {
      logout(); // 会话已过期，执行登出
      return false;
    }
    
    // 检查用户数据完整性
    if (!session.user || !session.user.username) {
      logout();
      return false;
    }
    
    return true;
  } catch (e) {
    logout();
    return false;
  }
}

// 获取当前用户信息
function getCurrentUser() {
  if (!isLoggedIn()) {
    return null;
  }
  
  const session = JSON.parse(localStorage.getItem('userSession'));
  return session.user;
}

// 获取会话令牌（用于API请求）
function getSessionToken() {
  if (!isLoggedIn()) {
    return null;
  }
  
  const session = JSON.parse(localStorage.getItem('userSession'));
  return session.token;
}

// 登出
function logout() {
  localStorage.removeItem('user');

  const authdiv = document.getElementById('auth');
  authdiv.innerHTML = `
  <span id="auth-btn" class="primary-btn active" onclick="window.location.href='/pages/login.html'">登录</span> <!-- login按钮 -->
  `;
}

// 刷新会话（延长过期时间）
function refreshSession() {
  if (!isLoggedIn()) {
    return false;
  }
  
  const session = JSON.parse(localStorage.getItem('userSession'));
  session.expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
  localStorage.setItem('userSession', JSON.stringify(session));
  return true;
}

// 在页面加载完成后初始化认证
document.addEventListener('DOMContentLoaded', initAuth);

// 导出函数供其他模块使用
export {
  showStatusMessage,
  login,
  signup,
  resetPassword
};