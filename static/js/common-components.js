/**
 * 加载通用组件
 */
document.addEventListener('DOMContentLoaded', function() {
    // 加载header
    if (document.getElementById('common-header')) {
        fetch('/components/header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('无法加载header组件');
                }
                return response.text();
            })
            .then(data => {
                document.getElementById('common-header').innerHTML = data;
            })
            .catch(error => {
                console.error('加载header失败:', error);
            });
    }
    
    // 加载footer
    if (document.getElementById('common-footer')) {
        fetch('/components/footer.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('无法加载footer组件');
                }
                return response.text();
            })
            .then(data => {
                document.getElementById('common-footer').innerHTML = data;
            })
            .catch(error => {
                console.error('加载footer失败:', error);
            });
    }
}); 