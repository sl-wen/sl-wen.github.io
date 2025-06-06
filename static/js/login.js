    // 为标签按钮添加切换功能
    document.addEventListener('DOMContentLoaded', () => {
        const tagButtons = document.querySelectorAll('.tag-btn');
        const displaySections = document.querySelectorAll('.displaydiv');
        
        tagButtons.forEach(button => {
            button.addEventListener('click', function() {
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
    });