import React from 'react';
import ArticleList from '../components/ArticleList';
import '../styles/article-list.css';

const HomePage: React.FC = () => (
  <div className="page home-page">
    <div className="container">
      <div id="posts-container">
        <ArticleList />
      </div>
    </div>
  </div>
);

export default HomePage;