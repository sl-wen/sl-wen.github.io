/**
 * 加载网站通用组件（页头和页脚）
 * 这个文件负责在每个页面中动态插入统一的页头和页脚
 */
document.addEventListener('DOMContentLoaded', function () {
    // 定义页头 HTML 模板
    // 包含网站 logo 和导航菜单
    const headerHtml = `
      <div class="header">
      <div class="header-auth">
      <a href="/" class="logo">
      <img src="/static/img/logo.jpg" alt="Logo" onerror="this.src='/static/img/logo.png'">  <!-- Logo 图片，加载失败时使用备用图片 -->
      </a>
      <div class="auth" id="auth"> <!-- 操作按钮区域 -->
      <span id="auth-btn" class="primary-btn active" onclick="window.location.href='/pages/login.html'">登录</span> <!-- login按钮 -->
      </div>
      </div>
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
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function (registration) {
                //console.log('SW registered! scope:', registration.scope);
            })
            .catch(function (error) {
                console.log('SW registration failed:', error);
            });
    });
}

// 在DOMContentLoaded事件中初始化Live2D
document.addEventListener('DOMContentLoaded', function () {
    // 确保head元素存在
    if (!document.head) {
        console.error('Document head not found!');
        return;
    }

    // 动态创建script标签
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js';
    document.head.appendChild(script);
    script.onload = function () {
        // 确保L2Dwidget加载完成后再用
        if (typeof L2Dwidget === 'undefined') {
            console.error('L2Dwidget failed to load!');
            return;
        }
        L2Dwidget.init({
            model: {
                // 可选：以下URL可手动换不同人物模型
                // Shizuku模型
                //jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-shizuku@1.0.5/assets/shizuku.model.json',
                //jsonPath: 'https://app.unpkg.com/live2d-widget-model-shizuku@1.0.5/files/assets/shizuku.model.json',
                // 可选模型路径（取消对应注释即可切换）:
                // Unity-Chan模型（支持20+种基础动作）
                //jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-unitychan@1.0.5/assets/unitychan.model.json',
                // 碧蓝航线-光辉模型（支持特殊场景交互）
                //jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-azurlane-yamashiro@1.0.5/assets/yamashiro.model.json',
                // 黑猫模型
                jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-hijiki@1.0.5/assets/hijiki.model.json',
                // 白猫模型
                // jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json',
                // 布偶猫模型 (新增)
                // jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-haru@1.0.5/assets/haru.model.json',
                // 虎斑猫模型 (新增)
                //jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-koharu@1.0.5/assets/koharu.model.json',
                // 三花猫模型 (新增)
                //jsonPath: 'https://cdn.jsdelivr.net/npm/live2d-widget-model-wanko@1.0.5/assets/wanko.model.json',scale: 1.1,
                // live2d-widget-model-chitose
                // live2d-widget-model-epsilon2_1
                // live2d-widget-model-gf
                // live2d-widget-model-haru/01（使用npm install --save - live2d-widget-model-haru）
                // live2d-widget-model-haru/02（使用npm install --save - live2d-widget-model-haru）
                // live2d-widget-model-haruto
                // live2d-widget-model-hibiki
                // live2d-widget-model-hijiki
                // live2d-widget-model-izumi
                // live2d-widget-model-koharu
                // live2d-widget-model-miku
                // live2d-widget-model-ni-j
                // live2d-widget-model-nico
                // live2d-widget-model-nietzsche
                // live2d-widget-model-nipsilon
                // live2d-widget-model-nito
                // live2d-widget-model-shizuku
                // live2d-widget-model-tororo
                // live2d-widget-model-tsumiki
                // live2d-widget-model-unitychan
                // live2d-widget-model-wanko
                // live2d-widget-model-z16
                motionPreload: 'all',
                motionInterval: 6000,
                motionRandom: true,
            },
            display: {
                position: 'right', // 显示在右下角
                width: 200,
                height: 320,
                hOffset: 0,
                vOffset: -20,
                draggable: true
            },
            mobile: {
                show: true,
                scale: 0.8
            },
            react: {
                opacityDefault: 0.8,
                opacityOnHover: 1
            },
        });
        // 等待Live2D加载完成
        waitForLive2D();
    }

    // 等待Live2D元素加载
    function waitForLive2D() {
        //console.log("Waiting for Live2D element...");

        // 检查元素是否已存在
        let checkInterval = setInterval(function () {
            try {
                const live2dContainer = document.getElementById('live2d-widget');
                const canvas = document.querySelector('#live2d-widget canvas');

                if (live2dContainer && canvas) {
                    //console.log("Live2D elements found!");
                    clearInterval(checkInterval);
                    setupLive2DInteractions(live2dContainer, canvas);
                }
            } catch (error) {
                console.error('Error checking Live2D elements:', error);
                clearInterval(checkInterval);
            }
        }, 1000);

        // 设置超时，防止无限等待
        setTimeout(function () {
            try {
                clearInterval(checkInterval);
                const live2dContainer = document.getElementById('live2d-widget');
                const canvas = document.querySelector('#live2d-widget canvas');

                if (live2dContainer && canvas) {
                    console.log("Live2D elements found after timeout!");
                    setupLive2DInteractions(live2dContainer, canvas);
                } else {
                    console.error("Live2D elements not found after timeout!");
                }
            } catch (error) {
                console.error('Error in Live2D timeout handler:', error);
            }
        }, 5000);
    }

    // 设置Live2D交互功能
    function setupLive2DInteractions(container, canvas) {
        // 确保容器可定位
        container.style.position = 'fixed';
        container.style.zIndex = '999';

        // iOS特别处理：确保触摸事件可以正常工作
        canvas.style.pointerEvents = 'auto';

        // 创建消息框
        let messageBox = document.createElement('div');
        messageBox.id = 'live2d-custom-message';
        messageBox.style.cssText = `
  position: absolute;
  top: 10px;
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
  transition: opacity 0.5s;
  pointer-events: none;
  max-width: 200px;
  z-index: 1000;
  white-space: nowrap;
  `;
        container.appendChild(messageBox);

        // 问候语列表
        const greetings = [
            '你好呀！欢迎来到我的网站~',
            '今天天气真不错！',
            '摸我干嘛(*/ω＼*)',
            '别戳我啦，好痒！',
            '你想知道什么呢？',
            '我是可爱的你的助手~',
            '有什么可以帮到你吗？',
            '今天也要元气满满哦！',
            '摸头杀！啊啊啊~',
            '主人，你又来啦~'
        ];

        // 显示消息函数
        let isShowingMessage = false;
        let isDragging = false;

        function showMessage(text, duration = 2000) {
            if (isShowingMessage || isDragging) {
                return; // 如果正在显示消息或正在拖拽，则不显示新消息
            }

            console.log('Showing message:', text);
            isShowingMessage = true;
            messageBox.textContent = text;
            messageBox.style.opacity = '1';

            messageTimeout = setTimeout(() => {
                messageBox.style.opacity = '0';
                hideTimeout = setTimeout(() => {
                    isShowingMessage = false;
                }, 1000); // 等待过渡动画完成
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
        let touchStartTime = 0;

        // 处理鼠标和触摸事件的开始
        function handleTouchStart(e) {
            // 检查触摸是否在Live2D区域内
            const point = e.touches ? e.touches[0] : e;
            const rect = container.getBoundingClientRect();

            if (point.clientX >= rect.left && point.clientX <= rect.right &&
                point.clientY >= rect.top && point.clientY <= rect.bottom) {

                //console.log('Interaction start in Live2D area');
                isTouching = true;
                hasMoved = false;
                touchStartTime = Date.now();

                startX = point.clientX;
                startY = point.clientY;

                const styles = getComputedStyle(container);
                startRight = parseInt(styles.right, 10) || 0;
                startBottom = parseInt(styles.bottom, 10) || 0;

                e.preventDefault(); // 阻止默认行为
            }
        }

        function handleTouchMove(e) {
            if (!isTouching) return;

            const point = e.touches ? e.touches[0] : e;
            const dx = point.clientX - startX;
            const dy = point.clientY - startY;

            // 如果移动超过5px，认为是拖拽而非点击
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasMoved = true;
                isDragging = true;

                // 获取浏览器窗口尺寸和容器尺寸
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const containerRect = container.getBoundingClientRect();

                // 计算新位置，确保不超出浏览器边界
                const maxRight = windowWidth - containerRect.width;
                const maxBottom = windowHeight - containerRect.height;

                // 限制在可视区域内
                const newRight = Math.min(maxRight, Math.max(0, startRight - dx));
                const newBottom = Math.min(maxBottom, Math.max(0, startBottom - dy));

                //console.log(`Moving to: right=${newRight}px, bottom=${newBottom}px`);
                container.style.right = newRight + 'px';
                container.style.bottom = newBottom + 'px';

                e.preventDefault(); // 阻止滚动
            }
        }

        function handleTouchEnd(e) {
            if (!isTouching) return;

            const touchDuration = Date.now() - touchStartTime;
            //console.log(`Interaction end: moved=${hasMoved}, duration=${touchDuration}ms`);

            // 只处理触摸事件或鼠标事件中的一种，避免重复触发
            if (!hasMoved && touchDuration < 300 && !isShowingMessage) {
                // 对于触摸事件，只处理touchend
                // 对于鼠标事件，只处理mouseup且确保没有touches属性
                if ((e.type === 'touchend' && !e._handled) ||
                    (e.type === 'mouseup' && !e.touches && !e._handled)) {
                    e._handled = true; // 标记事件已处理
                    showMessage(getRandomGreeting());
                    e.preventDefault();
                }
            }

            isTouching = false;
            isDragging = false;
        }

        // 添加触摸和鼠标事件监听
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });

        // 添加PC端鼠标事件监听
        container.addEventListener('mousedown', handleTouchStart);
        document.addEventListener('mousemove', handleTouchMove);
        document.addEventListener('mouseup', handleTouchEnd);

        // 初始显示一条问候语
        showMessage('你好！我是你的小助手~');

        // 定期随机显示问候语
        setInterval(() => {
            if (Math.random() < 0.3) { // 30%概率显示
                showMessage(getRandomGreeting());
            }
        }, 30000);

        // // 添加调试按钮（仅用于测试）
        // const debugButton = document.createElement('button');
        // debugButton.textContent = '测试消息';
        // debugButton.style.cssText = `
        //   position: fixed;
        //   bottom: 10px;
        //   left: 10px;
        //   z-index: 1001;
        //   padding: 5px 10px;
        // `;
        // debugButton.addEventListener('click', function() {
        //   showMessage(getRandomGreeting());
        // });
        // document.body.appendChild(debugButton);

        console.log('Live2D interactions setup complete');
    }
});