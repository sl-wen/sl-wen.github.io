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
    const { data: userInfo, error: checkError } = await supabase
      .from('Userinfo')
      .select('username, password')
      .eq('username', username)
      .single();
    
    if (checkError) throw checkError;
    if (!userInfo) throw new Error('用户不存在');

    if (userInfo.password === password) {
      showStatusMessage('登录成功！', 'success');
      // 保存登录状态
      localStorage.setItem('user', JSON.stringify(userInfo));
      // 跳转到首页
      window.location.href = '/';
    } else {
      throw new Error('密码不正确');
    }

    return userInfo;
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
      .from('Userinfo')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      throw new Error('用户名已存在');
    }
    console.log("注册");

    // 创建新用户
    const { data, error } = await supabase
      .from('Userinfo')
      .insert([{ username, password }])
      .select();

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
      .from('Userinfo')
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

// 在页面加载完成后初始化认证
document.addEventListener('DOMContentLoaded', initAuth);

// 导出函数供其他模块使用
export {
  showStatusMessage,
  login,
  signup,
  resetPassword
};