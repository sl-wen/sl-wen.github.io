// 加载 README 内容
function loadReadme() {
    fetch('/README.md')
        .then(response => response.text())
        .then(text => {
            const readmeContent = document.getElementById('readme-content');
            // 使用全局变量方式访问 marked
            if (window.marked) {
                readmeContent.innerHTML = window.marked.parse(text);
            } else {
                console.error('marked library not loaded');
                readmeContent.innerHTML = '<p class="error">Markdown 解析器未加载，请稍后重试。</p>';
            }
        })
        .catch(error => {
            const readmeContent = document.getElementById('readme-content');
            readmeContent.innerHTML = '<p class="error">加载失败，请稍后重试。</p>';
            console.error('Error loading README:', error);
        });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', loadReadme);