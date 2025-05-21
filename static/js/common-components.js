/**
 * 加载网站通用组件（页头和页脚）
 * 这个文件负责在每个页面中动态插入统一的页头和页脚
 */
document.addEventListener('DOMContentLoaded', function() {
    // 定义页头 HTML 模板
    // 包含网站 logo 和导航菜单
    const headerHtml = `
        <div class="header">
        <a href="/" class="logo">
        <img src="/static/img/logo.jpg" alt="Logo" onerror="this.src='/static/img/logo.png'">  <!-- Logo 图片，加载失败时使用备用图片 -->
        </a>
        <nav class="nav">
            <a href="/">首页</a>                          <!-- 网站首页链接 -->
            <a href="/pages/categories.html">分类</a>      <!-- 文章分类页面链接 -->
            <a href="/pages/search.html">搜索</a>         <!-- 搜索页面链接 -->
            <a href="/pages/tools.html">工具</a>          <!-- 工具页面链接 -->
            <a href="/pages/parenting.html">育儿</a>      <!-- 育儿专栏链接 -->
            <a href="/pages/about.html">关于</a>          <!-- 关于页面链接 -->
            <a href="/pages/post.html">发布</a>           <!-- 文章发布页面链接 -->
        </nav>
        </div>
    `;

    // 定义页脚 HTML 模板
    // 包含版权信息和访问统计
    const footerHtml = `
        <div class="footer">
        <div class="copyright">© ${new Date().getFullYear()} 我的博客. All rights reserved.</div>  <!-- 版权信息 -->
        <div class="footer-stats">总访问量：<span id="visit-count">加载中...</span></div>  <!-- 访问量统计 -->
        <a href="/static/xml/rss.xml">RSS</a>
        </div>
    `;

    // 在页面中插入页头
    const headerElement = document.getElementById('common-header');  // 获取页头容器元素
    if (headerElement) {
        headerElement.innerHTML = headerHtml;  // 插入页头 HTML
    }
    
    // 在页面中插入页脚
    const footerElement = document.getElementById('common-footer');  // 获取页脚容器元素
    if (footerElement) {
        footerElement.innerHTML = footerHtml;  // 插入页脚 HTML
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/service-worker.js')
        .then(function(registration) {
          console.log('SW registered! scope:', registration.scope);
        })
        .catch(function(error) {
          console.log('SW registration failed:', error);
        });
    });
  }

// 在js代码里动态创建<script>标签并插入到页面
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js';
document.head.appendChild(script);
script.onload = function() {
  // 确保L2Dwidget加载完成后再用
  L2Dwidget.init({
    model: {
      // 可选：以下URL可手动换不同人物模型
      // 黑猫
      jsonPath: 'https://unpkg.com/live2d-widget-model-hijiki/assets/hijiki.model.json',
      // 白猫
      // jsonPath: 'https://unpkg.com/live2d-widget-model-tororo/assets/tororo.model.json',
    },
    display: {
      position: 'right', // 显示在右下角
      width: 180,
      height: 280,
      hOffset: 0,
      vOffset: -20
    },
    mobile: {
      show: true,
      scale: 0.5
    },
    react: {
      opacityDefault: 0.8,
      opacityOnHover: 1
    },
    // 添加对话框配置
    dialog: {
      enable: true,
      script: {
      // 'tap body': 当点击身体时显示的文字
      'tap body': [
        '哎呀！别碰我！', 
        '你干嘛呢？', 
        '喂，不要动手动脚的！',
        '再摸我就报警了！',
        '我要生气了哦~'
      ],
      // 'tap face': 当点击脸部时显示的文字
      'tap face': [
        '开心~',
        '别戳我的脸啦！',
        '我的脸不是按钮！',
        '再摸我就不理你了！'
      ],
      'tap foot': [
        '别戳我的脚啦！',
        '我的脚不能踩！'
      ],
      // 可以添加更多的交互点和对应的文字
      // 'tap special': ['特殊区域的文字']
      }
    }
  });

    // 使用MutationObserver监听DOM变化，确保在Live2D元素加载后绑定事件
    const observer = new MutationObserver((mutations, obs) => {
      const live2dContainer = document.getElementById('live2d-widget');
      if (live2dContainer) {
        console.log('Live2D container found, setting up interactions');
        setupLive2DInteractions(live2dContainer);
        obs.disconnect(); // 找到元素后停止观察
      }
    });
  
    // 开始观察document.body的子元素变化
    observer.observe(document.body, { childList: true, subtree: true });
  
    // 同时设置一个超时保障，以防MutationObserver失效
    setTimeout(() => {
      const live2dContainer = document.getElementById('live2d-widget');
      if (live2dContainer) {
        setupLive2DInteractions(live2dContainer);
      }
    }, 5000);
  }
 // 设置Live2D交互功能
function setupLive2DInteractions(container) {
  // 确保容器可定位
  container.style.position = 'fixed';
  container.style.zIndex = '999';
  
  // 创建消息框
  let messageBox = document.createElement('div');
  messageBox.id = 'live2d-custom-message';
  messageBox.style.cssText = `
    position: absolute;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9);
    color: #333;
    padding: 8px 15px;
    border-radius: 12px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    font-size: 14px;
    text-align: center;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
    max-width: 200px;
    z-index: 1000;
  `;
  container.appendChild(messageBox);
  
  // 问候语列表
  const greetings = [
    '你好呀！欢迎来到我的网站~',
    '今天天气真不错！',
    '摸摸我干嘛(*/ω＼*)',
    '别戳我啦，好痒！',
    '你想知道什么呢？',
    '我是可爱的Live2D助手~',
    '有什么可以帮到你吗？',
    '今天也要元气满满哦！',
    '摸头杀！啊啊啊~',
    '主人，你又来啦~'
  ];
  
  // 显示消息函数
  function showMessage(text, duration = 3000) {
    console.log('Showing message:', text);
    messageBox.textContent = text;
    messageBox.style.opacity = '1';
    
    clearTimeout(messageBox.hideTimeout);
    messageBox.hideTimeout = setTimeout(() => {
      messageBox.style.opacity = '0';
    }, duration);
  }
  
  // 获取随机问候语
  function getRandomGreeting() {
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // 触摸变量
  let isTouching = false;
  let startX = 0;
  let startY = 0;
  let startRight = 0;
  let startBottom = 0;
  let hasMoved = false;
  
  // 触摸开始
  container.addEventListener('touchstart', function(e) {
    console.log('Touch start detected');
    isTouching = true;
    hasMoved = false;
    
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    
    const styles = getComputedStyle(container);
    startRight = parseInt(styles.right, 10) || 0;
    startBottom = parseInt(styles.bottom, 10) || 0;
    
    // 不要阻止默认行为，以免影响点击
  }, { passive: false });
  
  // 触摸移动
  container.addEventListener('touchmove', function(e) {
    if (!isTouching) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    
    // 如果移动超过5px，认为是拖拽而非点击
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved = true;
      
      // 计算新位置
      const newRight = Math.max(0, startRight - dx);
      const newBottom = Math.max(0, startBottom - dy);
      
      container.style.right = newRight + 'px';
      container.style.bottom = newBottom + 'px';
      
      e.preventDefault(); // 阻止滚动
    }
  }, { passive: false });
  
  // 触摸结束
  container.addEventListener('touchend', function(e) {
    console.log('Touch end detected, hasMoved:', hasMoved);
    
    if (isTouching && !hasMoved) {
      // 如果没有移动，则视为点击，显示问候语
      showMessage(getRandomGreeting());
    }
    
    isTouching = false;
  }, { passive: false });
  
  // 触摸取消
  container.addEventListener('touchcancel', function() {
    isTouching = false;
  }, { passive: false });
  
  // 添加点击事件（用于PC端）
  container.addEventListener('click', function() {
    console.log('Click detected');
    showMessage(getRandomGreeting());
  });
  
  // 初始显示一条问候语
  setTimeout(() => {
    showMessage('你好！我是Live2D助手~');
  }, 1000);
  
  // 定期随机显示问候语
  setInterval(() => {
    if (Math.random() < 0.3) { // 30%概率显示
      showMessage(getRandomGreeting());
    }
  }, 30000);
  
  console.log('Live2D interactions setup complete');
}