import React from 'react';

const CommonFooter: React.FC = () => (
  <footer>
      <div class="copyright">© ${new Date().getFullYear()} 我的博客. All rights reserved.</div>
      <div class="footer-stats">总访问量：<span id="visit-count">加载中...</span></div>
      <a href="/static/xml/rss.xml">RSS</a>
  </footer>
);

export default CommonFooter;