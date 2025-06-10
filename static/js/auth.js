// 导入supabase客户端
import { supabase } from './supabase-config.js';
import common from './common.js';

// 检查用户会话状态
const userSession = sessionStorage.getItem('userSession');
const userProfile = sessionStorage.getItem('userProfile');

// 初始化认证UI
const initAuth = async () => {

  if (userSession) {
    // 用户已登录，显示用户信息和登出按钮
    const authdiv = document.getElementById('auth');

    authdiv.innerHTML = `
        <div class="user-menu">
          <div class="user-profile" id="userProfileButton">
            <span id="welcome">欢迎，${userProfile?.username}</span>
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

  } else {
    // 用户未登录，显示登录按钮
    const authdiv = document.getElementById('auth');
    if (authdiv) {
      authdiv.innerHTML = `
        <span id="auth-btn" class="primary-btn active" onclick="window.location.href='/pages/login.html'">登录</span>
        `;
    }
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
      common.showMessage('用户名不能为空', 'error');
      return;
    }

    await usernamechange(profile, newusername);
  });
}

// 变更用户名函数
const usernamechange = async (profile, newusername) => {
  const profileid = profile.id;
  try {
    common.showMessage('变更中...', 'info');


    // 获取用户详细信息
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', newusername)
      .single();

    if (profile.username) {
      common.showMessage('用户名已存在', 'error');
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

    common.showMessage('变更用户资料成功！', 'success');
    const { data: newprofile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileid)
      .single();

    sessionStorage.setItem('userProfile', JSON.stringify(newprofile));

    // 跳转到设置页
    setTimeout(() => {
      window.location.href = `/pages/settings.html`;
    }, 1500);
  } catch (error) {
    common.showMessage(error.message || '变更用户资料失败', 'error');
    return null;
  }
};

// 在页面加载完成后初始化认证
document.addEventListener('DOMContentLoaded', initAuth);
