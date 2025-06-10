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
const initAuth = async () => {
  // 检查用户会话状态
  try {
    const { session, profile, error } = await getUserInfo();  // 获取用户数据
    if (session) {
      // 用户已登录，显示用户信息和登出按钮
      const authdiv = document.getElementById('auth');

      authdiv.innerHTML = `
        <div class="user-menu">
          <div class="user-profile" id="userProfileButton">
            <span id="welcome">欢迎，${profile?.username}</span>
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
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', logout);
        }
      }, 0);

      // 用户已登录，显示用户信息
      if (profile) {
        const leveldetail = document.getElementById('level-detail');
        const coinsdetail = document.getElementById('coins-detail');
        const experiencedetail = document.getElementById('experience-detail');
        const adressdetail = document.getElementById('adress-detail');
        const usernamedetail = document.getElementById('username-detail');
        if (leveldetail) {
          leveldetail.innerHTML = `<span id="level-detail" >${profile.level || 0}</span>`;
        }
        if (coinsdetail) {
          coinsdetail.innerHTML = `<span id="coins-detail" >${profile.coins || 0}</span>`;
        }
        if (experiencedetail) {
          experiencedetail.innerHTML = `<span id="experience-detail" >${profile.experience || 0}</span>`;
        }
        if (adressdetail) {
          adressdetail.innerHTML = `<span id="adress-detail" >${profile.adress || '未设置'}</span>`;
        }
        if (usernamedetail) {
          usernamedetail.value = profile?.username || session?.user.email;
        }
      }

      // 为用户名表单添加提交事件监听
      const usernameForm = document.getElementById('username-form');
      if (usernameForm) {
        usernameForm.addEventListener('submit', async (e) => {
          e.preventDefault(); // 阻止表单默认提交行为
          const newusername = document.getElementById('username-detail').value;

          // 验证输入不为空
          if (!username) {
            showMessage('用户名不能为空', 'error');
            return;
          }

          await usernamechange(profile, newusername);
        });
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
  } catch (error) {
    console.error('获取用户数据失败:', error);
    showError('获取用户数据失败', error.message);  // 显示错误信息
  }

  // 为登录表单添加提交事件监听
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // 阻止表单默认提交行为
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      // 验证输入不为空
      if (!email || !password) {
        showMessage('邮箱和密码不能为空', 'error');
        return;
      }

      await login(email, password);
    });
  }

  const resetForm = document.getElementById('reset-password-form"');
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // 阻止表单默认提交行为
      const newpassword = document.getElementById('new-password').value;
      const confirmpassword = document.getElementById('confirm-password').value;

      // 验证输入不为空
      if (!newpassword || !confirmpassword) {
        showMessage('新密码和确认密码不能为空', 'error');
        return;
      }
      // 验证两次密码输入是否一致
      if (newpassword !== confirmpassword) {
        showMessage('两次输入的密码不一致', 'error');
        return;
      }

      if (!isPasswordComplex(newpassword)) {
        showMessage('密码需至少8位，且包含大写、小写、数字、特殊字符中的最少两种', 'error');
        return;
      }

      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');

      if (!accessToken) {
        showMessage('无效的密码重置链接，请重新申请密码重置', 'error');
        document.getElementById('reset-password-form').style.display = 'none';
        return;
      }

      try {
        const { error } = await supabase.auth.updateUser({
          password: newpassword
        });

        if (error) throw error;

        showMessage('密码重置成功！即将跳转到登录页面...', 'success');
        setTimeout(() => {
          window.location.href = '/pages/login.html';
        }, 2000);
      } catch (error) {
        showMessage(error.message || '更新密码失败', 'error');
      }

    });
  }

  // 为注册表单添加提交事件监听
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email').value;
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
      const email = document.getElementById('forget-email').value;

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


// 变更用户函数
const usernamechange = async (profile, newusername) => {
  const profileid = profile.id;
  try {
    showMessage('变更中...', 'info');


    // 获取用户详细信息
    const { data: newprofile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', newusername)
      .single();

    if (newprofile.username) {
      showMessage('用户名已存在', 'error');
      return null;
    }

    // 变更用户资料
    const { error: usernamechangeError } = await supabase
      .from('profiles')
      .update({
        username: newusername,
        updated_at: new Date()
      })
      .eq('id', profileid);

    if (usernamechangeError) console.error('变更用户资料失败:', usernamechangeError);

    showMessage('变更用户资料成功！', 'success');
    // 跳转到首页
    setTimeout(() => {
      window.location.href = `/pages/settings.html`;
    }, 1500);
  } catch (error) {
    showMessage(error.message || '变更用户资料失败', 'error');
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

// 评估密码强度
function evaluatePasswordStrength(password) {
  if (!password) return { score: 0, feedback: '' };

  let score = 0;
  let feedback = [];

  // 长度评分
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // 复杂度评分
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // 反馈信息
  if (password.length < 8) {
    feedback.push('密码太短');
  }

  if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) {
    feedback.push('建议添加字母');
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('建议添加数字');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('建议添加特殊字符');
  }

  // 标准化分数到 0-100
  const normalizedScore = Math.min(100, Math.round((score / 6) * 100));

  return {
    score: normalizedScore,
    feedback: feedback.join('，')
  };
}

// 更新密码强度指示器
function updatePasswordStrength(password) {
  const strengthBar = document.getElementById('password-strength');
  const feedbackElement = document.getElementById('password-feedback');

  if (!password) {
    strengthBar.style.width = '0%';
    strengthBar.style.backgroundColor = '#e9ecef';
    feedbackElement.textContent = '';
    return;
  }

  const { score, feedback } = evaluatePasswordStrength(password);

  // 更新强度条
  strengthBar.style.width = `${score}%`;

  // 根据分数设置颜色
  if (score < 30) {
    strengthBar.style.backgroundColor = '#dc3545'; // 弱
    feedbackElement.style.color = '#dc3545';
  } else if (score < 70) {
    strengthBar.style.backgroundColor = '#ffc107'; // 中
    feedbackElement.style.color = '#856404';
  } else {
    strengthBar.style.backgroundColor = '#28a745'; // 强
    feedbackElement.style.color = '#28a745';
  }

  // 更新反馈文本
  if (score < 30) {
    feedbackElement.textContent = `密码强度：弱 ${feedback ? '- ' + feedback : ''}`;
  } else if (score < 70) {
    feedbackElement.textContent = `密码强度：中 ${feedback ? '- ' + feedback : ''}`;
  } else {
    feedbackElement.textContent = `密码强度：强`;
  }
}

/**
 * 获取当前用户的会话和个人资料信息
 * @returns {Promise<{session: Object|null, profile: Object|null, error: Error|null}>}
 */
async function getUserInfo() {
  try {
    // 获取会话信息
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("获取会话失败:", error.message);
      return { session: null, profile: null, error };
    }

    const session = data?.session;
    if (!session) {
      return { session: null, profile: null, error: null };
    }

    // 获取用户详细信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error("获取用户资料失败:", profileError.message);
      return { session, profile: null, error: profileError };
    }

    return { session, profile, error: null };
  } catch (error) {
    console.error("获取用户信息时发生异常:", error);
    return { session: null, profile: null, error };
  }
}

// 在页面加载完成后初始化认证
document.addEventListener('DOMContentLoaded', initAuth);

// 设置密码强度监听
const newpassword = document.getElementById('new-password');
const signuppassword = document.getElementById('signup-password');
newpassword.addEventListener('input', function () {
  updatePasswordStrength(this.value);
});
signuppassword.addEventListener('input', function () {
  updatePasswordStrength(this.value);
});

// 导出函数供其他模块使用
export {
  showMessage,
  login,
  signup,
  resetPassword,
  getUserInfo
};