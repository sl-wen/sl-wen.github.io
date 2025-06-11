import { marked } from 'marked';
// 加载 README 内容
function loadReadme() {
    fetch('/README.md')
        .then(response => response.text())
        .then(text => {
            const readmeContent = document.getElementById('readme-content');

            readmeContent.innerHTML = marked.parse(text);
        })
        .catch(error => {
            const readmeContent = document.getElementById('readme-content');
            readmeContent.innerHTML = '<p class="error">加载失败，请稍后重试。</p>';
            console.error('Error loading README:', error);
        });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', loadReadme);