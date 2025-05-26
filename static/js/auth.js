// 导入 Supabase 客户端
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
  const authContainer = document.createElement('div');
  authContainer.id = 'auth-container';
  
  // 检查当前用户状态
  const currentUser = supabase.auth.getUser();
  
  if (currentUser) {
    // 用户已登录，显示用户信息和登出按钮
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
      <span>欢迎，${currentUser.email || '用户'}</span>
      <button id="logout-btn">登出</button>
    `;
    authContainer.appendChild(userInfo);
    
    // 添加登出事件监听
    setTimeout(() => {
      document.getElementById('logout-btn').addEventListener('click', logout);
    }, 0);
  } else {
    // 用户未登录，显示登录表单
    const authForm = document.createElement('div');
    authForm.className = 'auth-form';
    authForm.innerHTML = `
      <div class="form-group">
        <input type="email" id="auth-email" placeholder="邮箱" />
      </div>
      <div class="form-group">
        <input type="password" id="auth-password" placeholder="密码" />
      </div>
      <div class="form-actions">
        <button id="login-btn">登录</button>
        <button id="signup-btn">注册</button>
      </div>
    `;
    authContainer.appendChild(authForm);
    
    // 添加登录和注册事件监听
    setTimeout(() => {
      document.getElementById('login-btn').addEventListener('click', () => {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        login(email, password);
      });
      
      document.getElementById('signup-btn').addEventListener('click', () => {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        signup(email, password);
      });
    }, 0);
  }
  
  return authContainer;
};

// 登录函数 (使用新版 Supabase API)
const login = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    showStatusMessage('登录成功！', 'success');
    // 刷新认证UI
    refreshAuthUI();
    return data.user;
  } catch (error) {
    showStatusMessage(error.message, 'error');
  }
};

// 注册函数
const signup = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) throw error;
    
    showStatusMessage('注册成功！请检查您的邮箱。', 'success');
    return data.user;
  } catch (error) {
    showStatusMessage(error.message, 'error');
  }
};

// 登出函数
const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    showStatusMessage('已成功登出', 'success');
    // 刷新认证UI
    refreshAuthUI();
  } catch (error) {
    showStatusMessage(error.message, 'error');
  }
};

// 刷新认证UI
const refreshAuthUI = () => {
  const authSection = document.getElementById('auth-section');
  if (!authSection) return;
  
  // 清空当前内容
  authSection.innerHTML = '';
  // 重新初始化认证UI
  authSection.appendChild(initAuth());
};

// 监听认证状态变化
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    showStatusMessage('已登录', 'success');
    refreshAuthUI();
  } else if (event === 'SIGNED_OUT') {
    showStatusMessage('已登出', 'info');
    refreshAuthUI();
  }
});

// 初始化认证UI
document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('auth-section');
  if (authSection) {
    authSection.appendChild(initAuth());
  }
});