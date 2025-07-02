import React from 'react';
import ArticleList from '../components/ArticleList';
import '../styles/HomePage.css';

const HomePage: React.FC = () => (
  <div className="homePage">
    {/* 英雄区块 */}
    <section className="heroSection">
      <div className="heroContent">
        <div className="heroText">
          <h1 className="heroTitle">
            欢迎来到我的
            <span className="gradientText">个人博客</span>
          </h1>
          <p className="heroDescription">
            分享技术见解、生活感悟和创意思考的地方。
            <br />
            在这里探索知识的边界，记录成长的足迹。
          </p>
          <div className="heroActions">
            <a href="#articles" className="btn btn-primary btn-lg">
              开始阅读
            </a>
            <a href="/about" className="btn btn-ghost btn-lg">
              了解更多
            </a>
          </div>
        </div>
        <div className="heroVisual">
          <div className="floatingCard">
            <div className="cardIcon">📚</div>
            <div className="cardText">
              <div className="cardTitle">技术分享</div>
              <div className="cardDesc">前端开发经验</div>
            </div>
          </div>
          <div className="floatingCard">
            <div className="cardIcon">💡</div>
            <div className="cardText">
              <div className="cardTitle">创意想法</div>
              <div className="cardDesc">设计与思考</div>
            </div>
          </div>
          <div className="floatingCard">
            <div className="cardIcon">🚀</div>
            <div className="cardText">
              <div className="cardTitle">项目展示</div>
              <div className="cardDesc">实战经验分享</div>
            </div>
          </div>
        </div>
      </div>

      {/* 装饰性元素 */}
      <div className="heroDecoration">
        <div className="decorationCircle circle1"></div>
        <div className="decorationCircle circle2"></div>
        <div className="decorationCircle circle3"></div>
      </div>
    </section>

    {/* 特色内容区域 */}
    <section className="featuresSection">
      <div className="container">
        <h2 className="sectionTitle">探索内容</h2>
        <div className="featuresGrid">
          <div className="featureCard">
            <div className="featureIcon">🎯</div>
            <h3>精选文章</h3>
            <p>深度技术文章和个人见解分享</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon">🛠️</div>
            <h3>实用工具</h3>
            <p>开发工具和资源推荐</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon">📊</div>
            <h3>数据洞察</h3>
            <p>行业趋势和技术分析</p>
          </div>
          <div className="featureCard">
            <div className="featureIcon">🎨</div>
            <h3>设计灵感</h3>
            <p>UI/UX设计心得体会</p>
          </div>
        </div>
      </div>
    </section>

    {/* 最新文章区域 */}
    <section className="articlesSection" id="articles">
      <div className="container">
        <div className="sectionHeader">
          <h2 className="sectionTitle">最新文章</h2>
          <p className="sectionSubtitle">探索最新的想法和见解</p>
        </div>
        <div className="postsContainer">
          <ArticleList />
        </div>
      </div>
    </section>
  </div>
);

export default HomePage;
