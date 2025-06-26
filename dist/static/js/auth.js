// 导入supabase客户端
import { supabase } from './supabase-config.js';
// 在页面加载完成后初始化认证
document.addEventListener('DOMContentLoaded', initAuth);

// 初始化认证UI
async function initAuth() {

  // 检查用户会话状态
  const userSessionStr = localStorage.getItem('userSession');
  const userProfileStr = localStorage.getItem('userProfile');
  // 解析 JSON 字符串
  const userSession = userSessionStr ? JSON.parse(userSessionStr) : null;
  const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
  console.log('userSession:', userSession);
  console.log('userProfile:', userProfile);
  const authdiv = document.getElementById('auth');

  if (userSession && authdiv) {
    // 用户已登录，显示用户信息和登出按钮
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
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }

  } else {
    // 用户未登录，显示登录按钮
    if (authdiv) {
      authdiv.innerHTML = `
        <span id="auth-btn" class="primary-btn active" onclick="window.location.href='/pages/login.html'">登录</span>
        `;
    }
  }
}

// 登出
async function logout() {
  try {
    // 显示登出中状态
    const authdiv = document.getElementById('auth');
    if (authdiv) {
      authdiv.innerHTML = `<span>登出中...</span>`;
    }
    
    //  清除所有本地存储
    localStorage.clear(); // 清除所有 localStorage
    
    //  调用 Supabase 登出 API
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Supabase 登出 API 调用失败:', error);
      // 继续执行，不要中断登出流程
    }
    
    //  更新 UI
    if (authdiv) {
      authdiv.innerHTML = `
        <span id="auth-btn" class="primary-btn active" onclick="window.location.href='/pages/login.html'">登录</span>
      `;
    }
    
    // 通知 Service Worker 清除缓存
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'LOGOUT'
      });
    }
    
    //  强制刷新页面，确保所有状态重置
    window.location.href = '/';
    
  } catch (error) {
    console.error('登出失败:', error);
  }
}