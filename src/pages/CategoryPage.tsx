import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArticles } from '../utils/articleService';
import Loading from '../components/Loading';
import StatusMessage from '../components/StatusMessage';
import type { Article } from '../utils/articleService';
import '../styles/CategoryPage.css';

const CategoryPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getArticles(1, 1000); // 获取所有文章
        setArticles(data);
      } catch (err) {
        setError('加载文章失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const groupArticlesByTag = (articles: Article[]): Record<string, Article[]> => {
    return articles.reduce((groups: Record<string, Article[]>, article) => {
      if (!article.tags || article.tags.length === 0) {
        // 没有标签的文章可以统一归类到 "未分类"
        if (!groups['未分类']) groups['未分类'] = [];
        groups['未分类'].push(article);
      } else {
        article.tags.forEach((tag) => {
          if (!groups[tag]) groups[tag] = [];
          groups[tag].push(article);
        });
      }
      return groups;
    }, {});
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <StatusMessage message={error} />;
  }

  const groupedArticles = groupArticlesByTag(articles);
  const tags = Object.keys(groupedArticles).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  return (
    <div>
      <h1>文章分类</h1>

      {tags.map((tag) => (
        <div key={tag}>
          <h3>{tag}</h3>
          <div>
            {groupedArticles[tag]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((article) => (
                <div className="category-item" key={article.post_id}>
                  <span>{new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
                  <Link to={`/article/${article.post_id}`}>{article.title}</Link>
                  <div className="category-meta">
                    {article.tags.map((tagLabel, index) => (
                      <span key={index} className="tag">
                        {tagLabel}
                      </span>
                    ))}
                    <span className="category-author">{article.author}</span>
                    <span>💬 {article.comments_count}</span>
                    <span>👁️‍🗨️ {article.views}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {articles.length === 0 && <p>暂无文章</p>}
    </div>
  );
};

export default CategoryPage;
