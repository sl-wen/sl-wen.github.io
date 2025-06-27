import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArticles } from '../utils/articleService';
import Loading from '../components/Loading';
import StatusMessage from '../components/StatusMessage';

import type { Article } from '../utils/articleService';

interface GroupedArticles {
  [key: string]: Article[];
}

const SearchPage: React.FC = () => {
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

  const groupArticlesByYear = (articles: Article[]): GroupedArticles => {
    return articles.reduce((groups: GroupedArticles, article) => {
      const year = new Date(article.created_at).getFullYear().toString();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(article);
      return groups;
    }, {});
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <StatusMessage message={error} />;
  }

  const groupedArticles = groupArticlesByYear(articles);
  const years = Object.keys(groupedArticles).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div>
      <h1>文章分类</h1>

      {years.map(year => (
        <div key={year}>
          <h2>{year}</h2>

          <div>
            {groupedArticles[year]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map(article => (
                <div key={article.post_id}>
                  <span>
                    {new Date(article.created_at).toLocaleDateString('zh-CN')}
                  </span>

                  <Link to={`/article/${article.post_id}`}>{article.title}</Link>

                  <span>
                    {article.tags.join(' / ')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}

      {articles.length === 0 && (
        <p>
          暂无文章
        </p>
      )}
    </div>
  );
};

export default SearchPage;