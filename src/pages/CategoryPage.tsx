import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArticles } from '../utils/articleService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

import type { Article } from '../utils/articleService';

interface GroupedArticles {
  [key: string]: Article[];
}

const ArchivePage: React.FC = () => {
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
    return <ErrorMessage message={error} />;
  }

  const groupedArticles = groupArticlesByYear(articles);
  const years = Object.keys(groupedArticles).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem 1rem'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 600,
        marginBottom: '2rem',
        textAlign: 'center',
        color: 'var(--text-color)'
      }}>
        文章分类
      </h1>

      {years.map(year => (
        <div key={year} style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            color: 'var(--text-color)',
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: '0.5rem'
          }}>
            {year}
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {groupedArticles[year]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map(article => (
                <div
                  key={article.post_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <span style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap'
                  }}>
                    {new Date(article.created_at).toLocaleDateString('zh-CN')}
                  </span>

                  <Link
                    to={`/article/${article.post_id}`}
                    style={{
                      flex: 1,
                      color: 'var(--text-color)',
                      textDecoration: 'none',
                      fontSize: '1.1rem'
                    }}
                  >
                    {article.title}
                  </Link>

                  <span style={{
                    backgroundColor: '#f1f3f5',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '16px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap'
                  }}>
                    {article.tags.join(' / ')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}

      {articles.length === 0 && (
        <p style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          marginTop: '2rem'
        }}>
          暂无文章
        </p>
      )}
    </div>
  );
};

export default ArchivePage;