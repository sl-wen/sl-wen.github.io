import React, { useEffect, useState } from 'react';
import { getVisitCount, incrementVisitCount } from '../utils/stats';

const Footer: React.FC = () => {
  const [visitCount, setVisitCount] = useState<number>(0);

  useEffect(() => {
    const fetchVisitCount = async () => {
      try {
        const count = await getVisitCount();
        setVisitCount(count);
        incrementVisitCount();
      } catch (error) {
        console.error('获取访问量失败:', error);
      }
    };

    fetchVisitCount();
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footerContent">
        {/* 主要内容区域 */}
        <div className="footerMain">
          {/* 品牌信息 */}
          <div className="footerSection">
            <div className="footerBrand">
              <h3 className="brandTitle">个人博客</h3>
              <p className="brandDescription">
                分享技术见解与生活感悟的地方。
                <br />
                记录成长足迹，探索知识边界。
              </p>
            </div>
          </div>

          {/* 快速链接 */}
          <div className="footerSection">
            <h4 className="sectionTitle">快速导航</h4>
            <ul className="linkList">
              <li>
                <a href="/">首页</a>
              </li>
              <li>
                <a href="/category">分类</a>
              </li>
              <li>
                <a href="/search">搜索</a>
              </li>
              <li>
                <a href="/about">关于</a>
              </li>
            </ul>
          </div>

          {/* 分类链接 */}
          <div className="footerSection">
            <h4 className="sectionTitle">热门话题</h4>
            <ul className="linkList">
              <li>
                <a href="/category?tag=tech">技术</a>
              </li>
              <li>
                <a href="/category?tag=frontend">前端开发</a>
              </li>
              <li>
                <a href="/category?tag=design">设计</a>
              </li>
              <li>
                <a href="/category?tag=life">生活感悟</a>
              </li>
            </ul>
          </div>

          {/* 联系方式 */}
          <div className="footerSection">
            <h4 className="sectionTitle">联系方式</h4>
            <div className="contactInfo">
              <div className="contactItem">
                <span className="contactIcon">📧</span>
                <span className="contactText">contact@example.com</span>
              </div>
              <div className="contactItem">
                <span className="contactIcon">📱</span>
                <span className="contactText">关注我的动态</span>
              </div>
            </div>

            {/* 社交媒体链接 */}
            <div className="socialLinks">
              <a href="https://github.com" className="socialLink" title="GitHub">
                <span className="socialIcon">🐙</span>
              </a>
              <a href="https://twitter.com" className="socialLink" title="Twitter">
                <span className="socialIcon">🐦</span>
              </a>
              <a href="https://linkedin.com" className="socialLink" title="LinkedIn">
                <span className="socialIcon">💼</span>
              </a>
              <a href="/static/xml/rss.xml" className="socialLink" title="RSS">
                <span className="socialIcon">📡</span>
              </a>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="footerStats">
          <div className="statsGrid">
            <div className="statItem">
              <span className="statLabel">总访问量</span>
              <span className="statValue">{visitCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="footerBottom">
          <div className="copyright">
            <p>© {currentYear} 个人博客. All rights reserved.</p>
            <p className="poweredBy">Powered by React & TypeScript with ❤️</p>
          </div>

          {/* 备案信息等 */}
          <div className="legalLinks">
            <a href="/privacy">隐私政策</a>
            <span className="separator">|</span>
            <a href="/terms">使用条款</a>
            <span className="separator">|</span>
            <a href="/sitemap">网站地图</a>
          </div>
        </div>
      </div>

      {/* 装饰性元素 */}
      <div className="footerDecoration">
        <div className="decorativeWave"></div>
      </div>
    </footer>
  );
};

export default Footer;
