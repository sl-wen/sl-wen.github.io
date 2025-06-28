import React from 'react';
import ArticleList from '../components/ArticleList';
import '../styles/HomePage.css';

const HomePage: React.FC = () => (
  <div className="homePage">
    <div className="container">
      <div className="postsContainer">
        <ArticleList />
      </div>
    </div>
  </div>
);

export default HomePage;