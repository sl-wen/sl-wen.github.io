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
            <a href="/">首页3</a>                          <!-- 网站首页链接 -->
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
        <div class="copyright">© 2025 我的博客. All rights reserved.</div>  <!-- 版权信息 -->
        <div class="footer-stats">总访问量：<span id="visit-count">加载中...</span></div>  <!-- 访问量统计 -->
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