import React from 'react';

const CommonHeader: React.FC = () => (
  <header>
      <div class="header-auth">
      <a href="/" class="logo">
      <img src="/static/img/logo.jpg" alt="Logo" onerror="this.src='/static/img/logo.png'">
      </a>
      <div class="auth" id="auth">
      <span id="auth-btn" class="primary-btn active" onclick="window.location.href='/pages/login.html'">登录</span>
      </div>
      </div>
      <nav class="nav">
          <a href="/">首页</a>                         
          <a href="/pages/categories.html">分类</a>  
          <a href="/pages/search.html">搜索</a>     
          <a href="/pages/tools.html" id="toolsLink" style="display: none;">工具</a> 
          <a href="/pages/parenting.html" id="parentingLink" style="display: none;">育儿</a>
          <a href="/pages/about.html">关于</a>          <!-- 关于页面链接 -->
          <a href="/pages/post.html" id="postLink" style="display: none;">发布</a>
      </nav>
  </header>
);

export default CommonHeader;