// 点击特效功能
// 定义blog对象
var blog = blog || {};
blog.buildAt = blog.buildAt || "";

// 添加事件
blog.addEvent = function (dom, eventName, func, useCapture) {
  if (window.attachEvent) {
    dom.attachEvent('on' + eventName, func);
  } else if (window.addEventListener) {
    if (useCapture != undefined && useCapture === true) {
      dom.addEventListener(eventName, func, true);
    } else {
      dom.addEventListener(eventName, func, false);
    }
  }
};

// 点击特效
blog.initClickEffect = function (textArr) {
  function createDOM(text) {
    var dom = document.createElement('span');
    dom.innerText = text;
    dom.style.left = 0;
    dom.style.top = 0;
    dom.style.position = 'fixed';
    dom.style.fontSize = '30px';
    dom.style.whiteSpace = 'nowrap';
    dom.style.webkitUserSelect = 'none';
    dom.style.userSelect = 'none';
    dom.style.opacity = 0;
    dom.style.transform = 'translateY(0)';
    dom.style.webkitTransform = 'translateY(0)';
    return dom;
  }

  blog.addEvent(window, 'click', function (ev) {
    let target = ev.target;
    while (target !== document.documentElement) {
      if (target.tagName.toLocaleLowerCase() == 'a') return;
      if (target.className.indexOf('footer-btn') !== -1) return;
      target = target.parentNode;
    }

    var text = textArr[parseInt(Math.random() * textArr.length)];
    var dom = createDOM(text);

    document.body.appendChild(dom);
    var w = parseInt(window.getComputedStyle(dom, null).getPropertyValue('width'));
    var h = parseInt(window.getComputedStyle(dom, null).getPropertyValue('height'));

    var sh = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    dom.style.left = ev.pageX - w / 2 + 'px';
    dom.style.top = ev.pageY - sh - h + 'px';
    dom.style.opacity = 1;

    setTimeout(function () {
      dom.style.transition = 'transform 500ms ease-out, opacity 500ms ease-out';
      dom.style.webkitTransition = 'transform 500ms ease-out, opacity 500ms ease-out';
      dom.style.opacity = 0;
      dom.style.transform = 'translateY(-26px)';
      dom.style.webkitTransform = 'translateY(-26px)';
    }, 20);

    setTimeout(function () {
      document.body.removeChild(dom);
      dom = null;
    }, 520);
  });
};

// 初始化点击特效
document.addEventListener('DOMContentLoaded', function() {
  var textArr = ['富强', '民主', '文明', '和谐', '自由', '平等', '公正', '法治', '爱国', '敬业', '诚信', '友善', '暴富', '健康', '平安', '幸福', 'Hi~ o(*￣▽￣*)ブ'];
  blog.initClickEffect(textArr);
}); 