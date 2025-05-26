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
  
  const messageElement = document.createElement('div');
  messageElement.className = `status-message ${type}`;
  messageElement.textContent = message;
  
  statusContainer.appendChild(messageElement);
  
  // 5秒后自动移除消息
  setTimeout(() => {
    messageElement.classList.add('fade-out');
    setTimeout(() => messageElement.remove(), 500);
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
    showStatusMessage(error.message.includes('Invalid') ? '邮箱或密码错误' : error.message, 'error');
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
    showStatusMessage(error.message.includes('already') ? '该邮箱已注册' : error.message, 'error');
  }
};

// 初始化认证UI
const initAuth = async () => {
  console.log('开始初始化认证UI');
  const authContainer = document.createElement('div');
  authContainer.id = 'auth-container';
  
  try {
    // 首先检查是否有session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('获取session时出错:', sessionError);
      throw sessionError;
    }
    
    // 如果有session再获取用户信息
    if (session) {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('获取用户信息时出错:', userError);
        throw userError;
      }
      
      console.log('当前用户状态:', currentUser);
      
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
          const logoutBtn = document.getElementById('logout-btn');
          if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
          } else {
            console.warn('未找到登出按钮');
          }
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
          const loginBtn = document.getElementById('login-btn');
          const signupBtn = document.getElementById('signup-btn');
          const emailInput = document.getElementById('auth-email');
          const passwordInput = document.getElementById('auth-password');
          
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
        }, 0);
      }
    } else {
      // 没有session，显示登录表单
      const authForm = document.createElement('div');
      authForm.className = 'auth-form';
      authForm.innerHTML = `
        <div class="form-header">
          <h3>用户登录</h3>
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input type="email" class="form-control" id="auth-email">
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" class="form-control" id="auth-password">
        </div>
        <div class="form-footer">
          <button class="btn-primary" id="login-btn">立即登录</button>
          <button class="btn-secondary" id="signup-btn">注册账号</button>
        </div>
      `;
      authContainer.appendChild(authForm);
      
      // 添加登录和注册事件监听
      setTimeout(() => {
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        const emailInput = document.getElementById('auth-email');
        const passwordInput = document.getElementById('auth-password');
        
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
      }, 0);
    }
  } catch (error) {
    console.error('初始化认证UI时出错:', error);
    showStatusMessage(error.message, 'error');
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