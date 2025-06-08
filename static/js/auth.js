// 导入supabase客户端
import { supabase } from './supabase-config.js';

// 显示消息
function showMessage(message, type = 'info') {
  const container = document.getElementById('message-container');
  if (!container) return;

  container.innerHTML = `
      <div class="${type}-message">
          ${message}
      </div>
  `;
}

// 初始化认证UI
const initAuth = () => {
  // 检查用户会话状态
  const checkUserSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session) {
      // 用户已登录，显示用户信息和登出按钮
      const authdiv = document.getElementById('auth');
      const user = session.user;
      
      // 获取用户详细信息
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      const username = userProfile?.username || user.email || '用户';
      
      authdiv.innerHTML = `
        <div class="user-menu">
          <div class="user-profile" id="userProfileButton">
            <span id="welcome">欢迎，${username}</span>
            <i class="dropdown-icon">▼</i>
          </div>
          <div class="dropdown-menu" id="userDropdownMenu">
            <ul class="dropdown-list">
              <li><a href="/pages/profile.html"><i class="icon-user"></i> 个人</a></li>
              <li><a href="/pages/settings.html"><i class="icon-settings"></i> 设置</a></li>
              <li><a href="#" id="logout-btn"><i class="icon-logout"></i> 登出</a></li>
            </ul>
          </div>
        </div>
      `;

      // 检查用户登录状态并显示发布链接
      setTimeout(() => {
        const postLink = document.getElementById('postLink');
        const toolsLink = document.getElementById('toolsLink');
        const parentingLink = document.getElementById('parentingLink');
        if (postLink) {
          postLink.style.display = '';
        }
        if (toolsLink) {
          toolsLink.style.display = '';
        }
        if (parentingLink) {
          parentingLink.style.display = '';
        }
      }, 0);

      const userProfileButton = document.getElementById('userProfileButton');
      const userDropdownMenu = document.getElementById('userDropdownMenu');

      // 切换下拉菜单显示/隐藏
      userProfileButton.addEventListener('click', function (e) {
        e.stopPropagation();
        userProfileButton.classList.toggle('active');
        userDropdownMenu.classList.toggle('active');
      });

      // 点击页面其他区域关闭下拉菜单
      document.addEventListener('click', function (e) {
        if (!userProfileButton.contains(e.target) && !userDropdownMenu.contains(e.target)) {
          userProfileButton.classList.remove('active');
          userDropdownMenu.classList.remove('active');
        }
      });

      // 添加登出事件监听
      setTimeout(() => {
        document.getElementById('logout-btn').addEventListener('click', logout);
      }, 0);

      // 用户已登录，显示用户信息
      if (userProfile) {
        const leveldetail = document.getElementById('level-detail');
        const amountdetail = document.getElementById('amount-detail');
        const adressdetail = document.getElementById('adress-detail');
        if (leveldetail) {
          leveldetail.innerHTML = `<span id="level-detail" >${userProfile.level || 0}</span>`;
        }
        if (amountdetail) {
          amountdetail.innerHTML = `<span id="amount-detail" >${userProfile.amount || 0}</span>`;
        }
        if (adressdetail) {
          adressdetail.innerHTML = `<span id="adress-detail" >${userProfile.adress || '未设置'}</span>`;
        }
      }
    } else {
      // 用户未登录，显示登录按钮
      const authdiv = document.getElementById('auth');
      if (authdiv) {
        authdiv.innerHTML = `
        <span id="auth-btn" class="primary-btn active" onclick="window.location.href='/pages/login.html'">登录</span>
        `;
      }
    }
  };
  
  // 检查用户会话
  checkUserSession();

  // 为登录表单添加提交事件监听
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // 阻止表单默认提交行为
      const email = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      // 验证输入不为空
      if (!email || !password) {
        showMessage('邮箱和密码不能为空', 'error');
        return;
      }

      await login(email, password);
    });
  }

  // 为注册表单添加提交事件监听
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-username').value;
      const password = document.getElementById('signup-password').value;
      const passwordAgain = document.getElementById('passwordagain').value;

      // 验证输入不为空
      if (!email || !password || !passwordAgain) {
        showMessage('所有字段都必须填写', 'error');
        return;
      }

      // 验证两次密码输入是否一致
      if (password !== passwordAgain) {
        showMessage('两次输入的密码不一致', 'error');
        return;
      }

      // 验证邮箱格式
      if (!isValidEmail(email)) {
        showMessage('请输入有效的邮箱地址', 'error');
        return;
      }

      if (!isPasswordComplex(password)) {
        showMessage('密码需至少8位，且包含大写、小写、数字、特殊字符中的最少两种', 'error');
        return;
      }

      await signup(email, password);
    });
  }

  // 为忘记密码表单添加提交事件监听
  const forgetForm = document.getElementById('forget-form');
  if (forgetForm) {
    forgetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forget-username').value;

      if (!email) {
        showMessage('请输入邮箱', 'error');
        return;
      }

      if (!isValidEmail(email)) {
        showMessage('请输入有效的邮箱地址', 'error');
        return;
      }

      await resetPassword(email);
    });
  }
};

// 验证邮箱格式
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 登录函数
const login = async (email, password) => {
  try {
    showMessage('登录中...', 'info');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    showMessage('登录成功！', 'success');
    // 跳转到首页
    window.location.href = '/';
    
    return data;
  } catch (error) {
    showMessage(error.message || '登录失败，请检查邮箱和密码', 'error');
    return null;
  }
};

// 注册函数
const signup = async (email, password) => {
  try {
    showMessage('注册中...', 'info');
    
    // 使用Supabase Auth注册
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/pages/login.html`,
      },
    });

    if (error) throw error;

    // 创建用户资料
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          username: email.split('@')[0],
          level: 0,
          amount: 0,
          adress: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (profileError) console.error('创建用户资料失败:', profileError);
    }

    showMessage('注册成功！请验证您的邮箱后登录', 'success');
    // 切换到登录表单
    document.querySelector('[data-tag="login"]').click();

    return data;
  } catch (error) {
    showMessage(error.message || '注册失败', 'error');
    return null;
  }
};

// 重置密码函数
const resetPassword = async (email) => {
  try {
    showMessage('处理中...', 'info');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/pages/reset-password.html`,
    });

    if (error) throw error;

    showMessage('重置密码链接已发送到您的邮箱', 'success');
  } catch (error) {
    showMessage(error.message || '重置密码请求失败', 'error');
  }
};

// 登出
async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    const authdiv = document.getElementById('auth');
    authdiv.innerHTML = `
    <span id="auth-btn" class="primary-btn active" onclick="window.location.href='/pages/login.html'">登录</span>
    `;
    window.location.href = '/';
  } catch (error) {
    console.error('登出失败:', error);
    showMessage('登出失败', 'error');
  }
}

function isPasswordComplex(password) {
  // 至少8位，含大写、小写、数字、特殊字符
  const lengthOk = password.length >= 8;
  const lower = /[a-z]/.test(password);
  const upper = /[A-Z]/.test(password);
  const number = /[0-9]/.test(password);
  const special = /[^a-zA-Z0-9]/.test(password);

  // 必须包含上述至少二类
  const count = [lower, upper, number, special].filter(Boolean).length;
  return lengthOk && count >= 2;
}

// 在页面加载完成后初始化认证
document.addEventListener('DOMContentLoaded', initAuth);

// 导出函数供其他模块使用
export {
  showMessage,
  login,
  signup,
  resetPassword
};