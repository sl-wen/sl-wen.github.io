// 导入 Supabase 客户端
import { supabase } from './supabase-config.js';

// 显示状态消息的函数
const showStatusMessage = (message, type) => {
  console.log('显示状态消息:', message, type);
  const statusContainer = document.getElementById('status-messages');
  if (!statusContainer) {
    console.warn('未找到status-messages容器');
    return;
  }
  
  // 清除旧消息
  statusContainer.innerHTML = '';
  statusContainer.style.display = 'none'; // Hide if previously shown and now cleared
  
  const messageElement = document.createElement('div');
  // Correct class name assignment to match CSS
  messageElement.className = `message ${type}-message`; 
  messageElement.textContent = message;
  
  statusContainer.appendChild(messageElement);
  statusContainer.style.display = 'block'; // Make sure container is visible
  
  // 5秒后自动移除消息
  setTimeout(() => {
    messageElement.classList.add('fade-out');
    setTimeout(() => {
      messageElement.remove();
      // If no other messages, hide the container
      if (statusContainer.children.length === 0) {
        statusContainer.style.display = 'none';
      }
    }, 500);
  }, 5000);
};

// 添加表单验证
const validateForm = (email, password) => {
  if (!email || !email.includes('@')) {
    showStatusMessage('请输入有效的邮箱地址', 'error');
    return false;
  }
  if (!password || password.length < 6) {
    showStatusMessage('密码长度至少6位', 'error');
    return false;
  }
  return true;
};

// 登录函数
const login = async (email, password) => {
  if (!validateForm(email, password)) return;
  
  console.log('尝试登录:', email);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    showStatusMessage('登录成功！', 'success');
    refreshAuthUI();
    return data.user;
  } catch (error) {
    console.error('登录失败:', error);
    let message = error.message;
    if (error.message.includes('Invalid login credentials')) { // Supabase specific message for invalid credentials
      message = '邮箱或密码错误';
    } else if (error.message.includes('Email not confirmed')) {
      message = '请先验证您的邮箱地址。';
    }
    showStatusMessage(message, 'error');
  }
};

// 注册函数
const signup = async (email, password) => {
  if (!validateForm(email, password)) return;
  
  console.log('尝试注册:', email);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    
    showStatusMessage('注册成功！请检查您的邮箱确认邮件。', 'success');
    return data.user;
  } catch (error) {
    console.error('注册失败:', error);
    let message = error.message;
    if (error.message.includes('User already registered')) { // Supabase specific message
      message = '该邮箱已注册';
    } else if (error.message.includes('Password should be at least 6 characters')) {
      message = '密码至少需要6位字符。';
    }
    showStatusMessage(message, 'error');
  }
};

// 初始化认证UI
const initAuth = async () => {
  console.log('开始初始化认证UI');
  const authContainer = document.createElement('div');
  authContainer.id = 'auth-container';

  // 统一的登录/注册表单 HTML
  const createAuthFormHtml = () => `
    <div class="auth-form">
      <div class="form-header">
        <h3>用户登录/注册</h3>
      </div>
      <div class="form-group">
        <label for="auth-email">邮箱</label>
        <input type="email" class="form-control" id="auth-email" placeholder="请输入邮箱">
      </div>
      <div class="form-group">
        <label for="auth-password">密码</label>
        <input type="password" class="form-control" id="auth-password" placeholder="请输入密码 (至少6位)">
      </div>
      <div class="form-actions">
        <button id="login-btn" class="btn-primary">登录</button>
        <button id="signup-btn" class="btn-secondary">注册</button>
      </div>
    </div>
  `;

  // 用户信息展示 HTML
  const createUserInfoHtml = (user) => `
    <div class="user-info">
      <span>欢迎，${user.email || '用户'}</span>
      <button id="logout-btn" class="btn-secondary">登出</button>
    </div>
  `;

  try {
    // Simplified user check: directly attempt to get the user
    const { data: { user: currentUser }, error: userFetchError } = await supabase.auth.getUser();

    if (userFetchError) {
      // Log the error but proceed to show login form as currentUser will be null
      console.error('Error fetching user for initAuth:', userFetchError.message);
    }
    
    console.log('当前用户状态:', currentUser);

    if (currentUser) {
      // 用户已登录，显示用户信息和登出按钮
      authContainer.innerHTML = createUserInfoHtml(currentUser);
      
      // 添加登出事件监听 (直接附加)
      const logoutBtn = authContainer.querySelector('#logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
      } else {
        console.warn('未找到登出按钮');
      }
    } else {
      // 用户未登录或获取失败，显示统一的登录/注册表单
      authContainer.innerHTML = createAuthFormHtml();
      
      // 添加登录和注册事件监听 (直接附加)
      const loginBtn = authContainer.querySelector('#login-btn');
      const signupBtn = authContainer.querySelector('#signup-btn');
      const emailInput = authContainer.querySelector('#auth-email');
      const passwordInput = authContainer.querySelector('#auth-password');
      
      if (loginBtn && signupBtn && emailInput && passwordInput) {
        loginBtn.addEventListener('click', () => {
          login(emailInput.value, passwordInput.value);
        });
        
        signupBtn.addEventListener('click', () => {
          signup(emailInput.value, passwordInput.value);
        });
      } else {
        console.warn('未找到登录/注册表单元素');
      }
    }
  } catch (error) {
    console.error('初始化认证UI时出错:', error);
    showStatusMessage(error.message, 'error');
    // 即使出错，也尝试显示登录表单，避免空白页面
    authContainer.innerHTML = createAuthFormHtml();
    
    // 添加登录和注册事件监听 (直接附加 - 错误处理分支)
    const loginBtn = authContainer.querySelector('#login-btn');
    const signupBtn = authContainer.querySelector('#signup-btn');
    const emailInput = authContainer.querySelector('#auth-email');
    const passwordInput = authContainer.querySelector('#auth-password');
    
    if (loginBtn && signupBtn && emailInput && passwordInput) {
      loginBtn.addEventListener('click', () => {
        login(emailInput.value, passwordInput.value);
      });
      
      signupBtn.addEventListener('click', () => {
        signup(emailInput.value, passwordInput.value);
      });
    } else {
      console.warn('未找到登录/注册表单元素（错误处理分支）');
    }
  }
  
  return authContainer;
};

// 登出函数
const logout = async () => {
  console.log('尝试登出');
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    console.log('登出成功');
    showStatusMessage('已成功登出', 'success');
    // 刷新认证UI
    refreshAuthUI();
  } catch (error) {
    console.error('登出失败:', error);
    showStatusMessage(error.message, 'error');
  }
};

// 刷新认证UI
const refreshAuthUI = async () => {
  console.log('开始刷新认证UI');
  const authSection = document.getElementById('auth-section');
  if (!authSection) {
    console.warn('未找到auth-section容器');
    return;
  }
  
  // 清空当前内容
  authSection.innerHTML = '';
  // 重新初始化认证UI
  const newAuthContainer = await initAuth();
  authSection.appendChild(newAuthContainer);
};

// 导出需要的函数
export { initAuth, login, signup, logout, refreshAuthUI };