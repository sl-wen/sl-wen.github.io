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

    // 修改显示时间（默认是5秒）
    setTimeout(() => {
      if (window.Live2DCubismCore) {
        window.Live2DCubismCore.dialogDuration = 5000; // 设置为5秒
      }
    }, 5000);

   // 延迟一点时间，等widget渲染完
   setTimeout(() => {
    // 获取Live2D容器
    var container = document.getElementById('live2d-widget');
    if (!container) return;
    
    // 确保容器可定位
    container.style.position = 'fixed';
    
    // 创建一个用于显示消息的元素（如果dialog功能不够用）
    var messageBox = document.createElement('div');
    messageBox.id = 'live2d-message';
    messageBox.style.cssText = `
      position: absolute;
      top: -60px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 12px;
      box-shadow: 0 3px 15px 2px rgba(0, 0, 0, 0.2);
      font-size: 14px;
      text-align: center;
      color: #333;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      z-index: 100;
      width: max-content;
      max-width: 200px;
    `;
    container.appendChild(messageBox);
    
    // 定义问候语数组
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
    
    // 显示消息的函数
    function showMessage(text, duration = 3000) {
      if (!messageBox) return;
      
      messageBox.textContent = text;
      messageBox.style.opacity = '1';
      
      // 设置定时器，自动隐藏消息
      setTimeout(() => {
        messageBox.style.opacity = '0';
      }, duration);
    }
    
    // 触摸开始时显示问候语
    container.addEventListener('touchstart', function(e) {
      // 随机选择一条问候语
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      showMessage(randomGreeting);
      
      // 拖拽相关代码
      let isTouching = true;
      var touch = e.touches[0];
      let startX = touch.clientX;
      let startY = touch.clientY;
      
      let styles = getComputedStyle(container);
      let startRight = parseInt(styles.right, 10) || 0;
      let startBottom = parseInt(styles.bottom, 10) || 0;
      
      // 触摸移动事件
      function onTouchMove(e) {
        if (!isTouching) return;
        var touch = e.touches[0];
        var dx = touch.clientX - startX;
        var dy = touch.clientY - startY;
        
        // 确保不会拖出屏幕
        let newRight = Math.max(0, startRight - dx);
        let newBottom = Math.max(0, startBottom - dy);
        
        container.style.right = newRight + 'px';
        container.style.bottom = newBottom + 'px';
        e.preventDefault();
      }
      
      // 触摸结束事件
      function onTouchEnd(e) {
        isTouching = false;
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        e.preventDefault();
      }
      
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
      e.preventDefault();
    });
    
    // 也可以添加定期显示问候语的功能
    setInterval(() => {
      // 随机决定是否显示（20%概率）
      if (Math.random() < 0.2) {
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        showMessage(randomGreeting);
      }
    }, 30000); // 每30秒检查一次
    
    console.log('Touch events and messages enabled for Live2D widget');
  }, 6000); // 增加等待时间确保加载完成
}