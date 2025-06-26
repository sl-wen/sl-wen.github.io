import React from 'react';
import { Link } from 'react-router-dom';

import { Article } from '../utils/articleService';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <article className="article-card">
      <h2 className="article-title">
        <Link to={`/article/${article.post_id}`}>{article.title}</Link>
      </h2>
      
      <div className="article-meta">
        <div className="article-date">
          {new Date(article.created_at).toLocaleDateString()}
        </div>
        
        <div className="article-category">
          {article.tags || '未分类'}
        </div>
        
        <div className="article-author">
          {article.author || '匿名'}
        </div>
      </div>

      <p className="article-summary">{article.content.slice(0, 100) + '...'}</p>

      <div className="article-footer">
        <div className="article-tags">
          {article.tags.map((tag, index) => (
            <span key={index} className="article-tag">{tag}</span>
          ))}
        </div>

        <div className="article-stats">
          <span>
            {article.views}
          </span>
          <span>
            {article.comments_count}
          </span>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;