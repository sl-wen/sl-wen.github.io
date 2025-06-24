import React from 'react';
import { Link } from 'react-router-dom';

interface ArticleCardProps {
  id: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  category: string;
  tags: string[];
  viewCount: number;
  commentCount: number;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  id,
  title,
  summary,
  author,
  date,
  category,
  tags,
  viewCount,
  commentCount
}) => {
  return (
    <article className="article-card">
      <h2 className="article-title">
        <Link to={`/article/${id}`}>{title}</Link>
      </h2>
      
      <div className="article-meta">
        <div className="article-date">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM5 6V5h14v1H5z" />
          </svg>
          {date}
        </div>
        
        <div className="article-category">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" />
          </svg>
          {category}
        </div>
        
        <div className="article-author">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm6 5H6v-.99c.2-.72 3.3-2.01 6-2.01s5.8 1.29 6 2v1z" />
          </svg>
          {author}
        </div>
      </div>

      <p className="article-summary">{summary}</p>

      <div className="article-footer">
        <div className="article-tags">
          {tags.map((tag, index) => (
            <span key={index} className="article-tag">{tag}</span>
          ))}
        </div>

        <div className="article-stats">
          <span>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            {viewCount}
          </span>
          <span>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
            {commentCount}
          </span>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;