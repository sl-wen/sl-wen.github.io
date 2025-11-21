// 点击特效功能实现
// 定义全局 blog 对象，如果不存在则创建
var blog = blog || {};
blog.buildAt = blog.buildAt || "";  // 构建时间属性

// 跨浏览器事件添加函数
blog.addEvent = function (dom, eventName, func, useCapture) {
  if (window.attachEvent) {  // IE 浏览器支持
    dom.attachEvent('on' + eventName, func);
  } else if (window.addEventListener) {  // 现代浏览器支持
    if (useCapture != undefined && useCapture === true) {
      dom.addEventListener(eventName, func, true);  // 捕获阶段处理
    } else {
      dom.addEventListener(eventName, func, false);  // 冒泡阶段处理
    }
  }
};

// 点击特效初始化函数
blog.initClickEffect = function (textArr) {
  // 创建特效文本 DOM 元素
  function createDOM(text) {
    var dom = document.createElement('span');  // 创建 span 元素
    dom.innerText = text;  // 设置文本内容
    dom.style.left = 0;  // 初始化位置
    dom.style.top = 0;
    dom.style.position = 'fixed';  // 固定定位
    dom.style.fontSize = '30px';  // 设置字体大小
    dom.style.whiteSpace = 'nowrap';  // 禁止文本换行
    dom.style.webkitUserSelect = 'none';  // 禁止文本选择
    dom.style.userSelect = 'none';
    dom.style.opacity = 0;  // 初始透明
    dom.style.transform = 'translateY(0)';  // 初始化变换
    dom.style.webkitTransform = 'translateY(0)';  // Webkit 浏览器兼容
    return dom;
  }

  // 添加点击事件监听
  blog.addEvent(window, 'click', function (ev) {
    // 检查点击目标，避免在特定元素上触发特效
    let target = ev.target;
    while (target !== document.documentElement) {
      if (target.tagName.toLocaleLowerCase() == 'a') return;  // 链接上不显示
      if (target.className.indexOf('footer-btn') !== -1) return;  // 页脚按钮上不显示
      target = target.parentNode;
    }

    // 随机选择一个文本
    var text = textArr[parseInt(Math.random() * textArr.length)];
    var dom = createDOM(text);  // 创建 DOM 元素

    // 将元素添加到页面
    document.body.appendChild(dom);
    // 获取元素尺寸
    var w = parseInt(window.getComputedStyle(dom, null).getPropertyValue('width'));
    var h = parseInt(window.getComputedStyle(dom, null).getPropertyValue('height'));

    // 计算元素位置
    var sh = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    dom.style.left = ev.pageX - w / 2 + 'px';  // 水平居中于点击位置
    dom.style.top = ev.pageY - sh - h + 'px';  // 垂直位于点击位置上方
    dom.style.opacity = 1;  // 显示元素

    // 添加动画效果
    setTimeout(function () {
      // 设置过渡动画
      dom.style.transition = 'transform 500ms ease-out, opacity 500ms ease-out';
      dom.style.webkitTransition = 'transform 500ms ease-out, opacity 500ms ease-out';
      dom.style.opacity = 0;  // 淡出
      dom.style.transform = 'translateY(-26px)';  // 向上移动
      dom.style.webkitTransform = 'translateY(-26px)';
    }, 20);

    // 动画结束后移除元素
    setTimeout(function () {
      document.body.removeChild(dom);  // 从页面中移除
      dom = null;  // 释放内存
    }, 520);
  });
};

// DOM 加载完成后初始化点击特效
document.addEventListener('DOMContentLoaded', function() {
  // 定义点击特效显示的文字数组
  var textArr = ['富强', '民主', '文明', '和谐', '自由', '平等', '公正', '法治', '爱国', '敬业', '诚信', '友善', '暴富', '健康', '平安', '幸福', 'Hi~ o(*￣▽￣*)ブ'];
  blog.initClickEffect(textArr);  // 初始化点击特效
}); 