/**
 * 加载通用组件
 */
document.addEventListener('DOMContentLoaded', function() {
    // Header HTML
    const headerHtml = `
        <div class="header">
        <a href="/" class="logo">
        <img src="/static/img/logo.jpg" alt="Logo" onerror="this.src='/static/img/logo.png'">
        </a>
        <nav class="nav">
            <a href="/">首页</a>
            <a href="/pages/categories.html">分类</a>
            <a href="/pages/search.html">搜索</a>
            <a href="/pages/tools.html">工具</a>
            <a href="/pages/parenting.html">育儿</a>
            <a href="/pages/about.html">关于</a>
            <a href="/pages/post.html">发布</a>
        </nav>
        </div>
    `;

    // Footer HTML
    const footerHtml = `
        <div class="footer">
        <div class="copyright">© 2025 我的博客. All rights reserved.</div>
        <div class="footer-stats">总访问量：<span id="visit-count">加载中...</span></div>
        </div>
    `;

    // 加载header
    const headerElement = document.getElementById('common-header');
    if (headerElement) {
        headerElement.innerHTML = headerHtml;
    }
    
    // 加载footer
    const footerElement = document.getElementById('common-footer');
    if (footerElement) {
        footerElement.innerHTML = footerHtml;
    }
}); 