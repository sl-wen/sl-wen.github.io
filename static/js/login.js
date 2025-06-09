// 为标签按钮添加切换功能
document.addEventListener('DOMContentLoaded', () => {
    const tagButtons = document.querySelectorAll('.tag-btn');
    const displaySections = document.querySelectorAll('.displaydiv');

    tagButtons.forEach(button => {
        button.addEventListener('click', function () {
            const tag = this.getAttribute('data-tag');

            // 移除所有按钮的活动状态
            tagButtons.forEach(btn => btn.classList.remove('active'));

            // 为当前点击的按钮添加活动状态
            this.classList.add('active');

            // 隐藏所有内容
            displaySections.forEach(section => section.classList.remove('active'));

            // 显示对应标签的内容
            document.getElementById(`${tag}-form`).classList.add('active');
        });
    });

    // 修复输入框焦点问题
    const inputElements = document.querySelectorAll('input');

    inputElements.forEach(input => {
        // 确保不是只读的
        input.readOnly = false;

        // 添加点击事件
        input.addEventListener('touchend', function (e) {
            e.preventDefault();
            this.focus();
        });

        input.addEventListener('click', function () {
            this.focus();
        });
    });

    // iOS 特定修复
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // iOS PWA 模式下的键盘修复
        inputElements.forEach(el => {
            el.addEventListener('focus', function () {
                document.body.classList.add('keyboard-open');
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 100);
            });

            el.addEventListener('blur', function () {
                document.body.classList.remove('keyboard-open');
            });
        });
    }

    // 防止页面缩放
    document.addEventListener('touchmove', function (e) {
        if (e.scale !== 1) {
            e.preventDefault();
        }
    }, { passive: false });
});