import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../utils/articleService';
import '../styles/ArticleCard.css';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  // 计算阅读时间（基于字数，假设每分钟200字）
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content?.length || 0;
    const readingTime = Math.ceil(words / wordsPerMinute);
    return readingTime || 1;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)}个月前`;
    return `${Math.ceil(diffDays / 365)}年前`;
  };

  // 获取文章标签（示例数据，实际应从article中获取）
  const getTags = () => {
    // 这里可以根据文章内容或分类生成标签
    const tags = ['技术', '前端', 'React'];
    return tags.slice(0, 2); // 最多显示2个标签
  };

  return (
    <article className="articleCard">
      <div className="cardHeader">
        <div className="articleMeta">
          <div className="metaLeft">
            <div className="authorInfo">
              <div className="authorAvatar">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(article.author || '匿名')}&background=0ea5e9&color=fff&size=32`}
                  alt={article.author || '匿名'}
                />
              </div>
              <div className="authorDetails">
                <div className="authorName">{article.author || '匿名作者'}</div>
                <div className="publishTime">{formatDate(article.created_at)}</div>
              </div>
            </div>
          </div>
          <div className="metaRight">
            <div className="readingTime">
              <span className="timeIcon">⏱️</span>
              {getReadingTime(article.content)}分钟阅读
            </div>
          </div>
        </div>
      </div>

      <div className="cardBody">
        <div className="articleContent">
          <h2 className="articleTitle">
            <Link to={`/article/${article.post_id}`}>{article.title}</Link>
          </h2>

          <div className="articleTags">
            {getTags().map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="cardFooter">
        <div className="articleStats">
          <div className="statItem">
            <span className="statIcon">👁️</span>
            <span className="statValue">{article.views || 0}</span>
            <span className="statLabel">阅读</span>
          </div>
          <div className="statItem">
            <span className="statIcon">💬</span>
            <span className="statValue">{article.comments_count || 0}</span>
            <span className="statLabel">评论</span>
          </div>
          <div className="statItem">
            <span className="statIcon">❤️</span>
            <span className="statValue">{Math.floor(Math.random() * 20) + 1}</span>
            <span className="statLabel">点赞</span>
          </div>
        </div>

        <div className="cardActions">
          <Link to={`/article/${article.post_id}`} className="readMoreBtn">
            阅读更多
            <span className="readMoreIcon">→</span>
          </Link>
        </div>
      </div>

      {/* 装饰性元素 */}
      <div className="cardDecoration">
        <div className="decorativeDot dot1"></div>
        <div className="decorativeDot dot2"></div>
        <div className="decorativeDot dot3"></div>
      </div>
    </article>
  );
};

export default ArticleCard;
