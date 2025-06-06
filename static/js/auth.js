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
  // 登录监听
  const userStr = localStorage.getItem('user');
  if (userStr) {
    // 用户已登录，显示用户信息和登出按钮
    const authdiv = document.getElementById('auth');
    authdiv.innerHTML = `
      <div class="user-menu">
        <div class="user-profile" id="userProfileButton">
          <span id="welcome">欢迎，${JSON.parse(userStr).username || '用户'}</span>
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
    const leveldetail = document.getElementById('level-detail');
    const amountdetail = document.getElementById('amount-detail');
    const adressdetail = document.getElementById('adress-detail');
    if (leveldetail) {
      leveldetail.innerHTML = `<span id="level-detail" >${JSON.parse(userStr).level}</span>`;
    }
    if (amountdetail) {
      amountdetail.innerHTML = `<span id="amount-detail" >${JSON.parse(userStr).amount}</span>`;
    }
    if (adressdetail) {
      adressdetail.innerHTML = `<span id="adress-detail" >${JSON.parse(userStr).adress || '未设置'}</span>`;
    }
  }

  // 为登录表单添加提交事件监听
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // 阻止表单默认提交行为
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      // 验证输入不为空
      if (!username || !password) {
        showMessage('用户名和密码不能为空', 'error');
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
        showMessage('所有字段都必须填写', 'error');
        return;
      }

      // 验证两次密码输入是否一致
      if (password !== passwordAgain) {
        showMessage('两次输入的密码不一致', 'error');
        return;
      }


      if (username.length < 3 || username.length > 20) {
        showMessage('用户名需为3~20位，只含字母、数字下划线、@ .', 'error');
        return;
      }

      if (!isPasswordComplex(password)) {
        showMessage('密码需至少8位，且包含大写、小写、数字、特殊字符中的最少两种', 'error');
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
        showMessage('请输入用户名(邮箱)', 'error');
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
      .select('*')
      .eq('username', username)
      .single();

    // if (checkError) throw checkError;
    if (!userinfo) throw new Error('用户不存在');

    if (userinfo.password === password) {
      showMessage('登录成功！', 'success');
      // 保存登录状态
      localStorage.setItem('user', JSON.stringify(userinfo));
      // 跳转到首页
      window.location.href = '/';
    } else {
      throw new Error('密码不正确');
    }

    return userinfo;
  } catch (error) {
    showMessage(error.message, 'error');
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

    showMessage('注册成功！请登录', 'success');
    // 切换到登录表单
    document.querySelector('[data-tag="login"]').click();

    return data;
  } catch (error) {
    showMessage(error.message, 'error');
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

    if (!user.mail) {
      throw new Error('用户邮箱不存在');
    }

    // TODO: 实现发送重置密码邮件的逻辑
    showMessage('重置密码链接已发送到您的邮箱(todo)', 'success');

  } catch (error) {
    showMessage(error.message, 'error');
  }
};

// 登出
function logout() {
  localStorage.removeItem('user');

  const authdiv = document.getElementById('auth');
  authdiv.innerHTML = `
  <span id="auth-btn" class="primary-btn active" onclick="window.location.href='/pages/login.html'">登录</span> <!-- login按钮 -->
  `;
  window.location.href = '/';
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