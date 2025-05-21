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
      jsonPath: 'https://unpkg.com/live2d-widget-model-hijiki/assets/hijiki.model.json',
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
    }
  });

    // 延迟一点时间，等widget渲染完
    setTimeout(() => {
      // live2d-widget包裹层通常有个 id="live2d-widget"
      // canvas本身是 live2d-widget 的第一个子节点
      var canvas = document.querySelector('#live2d-widget canvas');
      var container = document.getElementById('live2d-widget');
      if (!container) return;
  
      let isTouching = false, startX = 0, startY = 0, startRight = 0, startBottom = 0;
  
      container.addEventListener('touchstart', function(e) {
        isTouching = true;
        // 记录起始点和当前right/bottom
        var touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
  
        let styles = getComputedStyle(container);
        startRight = parseInt(styles.right, 10) || 0;
        startBottom = parseInt(styles.bottom, 10) || 0;
  
        e.preventDefault();
      });
  
      container.addEventListener('touchmove', function(e) {
        if (!isTouching) return;
        var touch = e.touches[0];
        // delta移动
        var dx = touch.clientX - startX;
        var dy = touch.clientY - startY;
        container.style.right = (startRight - dx) + 'px';
        container.style.bottom = (startBottom - dy) + 'px';
        e.preventDefault();
      });
  
      container.addEventListener('touchend', function(e) {
        isTouching = false;
        e.preventDefault();
      });
  
    }, 1000); // 推荐实际用 MutationObserver 观察元素加载，但简单起见用 setTimeout。
}