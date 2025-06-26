import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArticles, Article } from '../utils/articleService';
import ArticleCard from './ArticleCard';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';

const ArticleList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await getArticles(page);
      if (data.length < 10) {
        setHasMore(false);
      }
      setArticles(prev => page === 1 ? data : [...prev, ...data]);
      setError(null);
    } catch (err) {
      setError('加载文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [page]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="article-list">
      {articles.map(article => (
        <ArticleCard key={article.post_id} article={article} />
      ))}
      {loading && <Loading />}
      {!loading && hasMore && (
        <button 
          className="load-more-btn" 
          onClick={handleLoadMore}
        >
          加载更多
        </button>
      )}
      {!loading && !hasMore && articles.length > 0 && (
        <div className="no-more-articles">没有更多文章了</div>
      )}
      {!loading && articles.length === 0 && (
        <div className="no-articles">暂无文章</div>
      )}
    </div>
  );
};

export default ArticleList;