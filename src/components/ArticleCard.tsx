import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../utils/articleService';
import '../styles/ArticleCard.css';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <article className="articleCard">
      <div className="articleDate">{new Date(article.created_at).toLocaleDateString()}</div>
      <div className="articleTitle">
        <Link to={`/article/${article.post_id}`}>{article.title}</Link>
      </div>

      <div className="articleMeta">
        <div className="articleAuthor">{article.author || '匿名'}</div>
        <span>💬 {article.comments_count}</span>
        <span>👁️‍🗨️ {article.views}</span>
      </div>
    </article>
  );
};

export default ArticleCard;
