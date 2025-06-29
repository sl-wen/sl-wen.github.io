import React, { useState, useEffect } from 'react';
import { getArticles, Article } from '../utils/articleService';
import ArticleCard from './ArticleCard';
import StatusMessage from './StatusMessage';
// 导入样式模块
import '../styles/ArticleList.css';

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
      if (data.length < 15) {
        setHasMore(false);
      }
      setArticles((prev) => (page === 1 ? data : [...prev, ...data]));
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
      setPage((prev) => prev + 1);
    }
  };

  if (error) {
    return <StatusMessage message={error} />;
  }

  return (
    <div className="articleList">
      {articles.map((article) => (
        <ArticleCard key={article.post_id} article={article} />
      ))}

      {hasMore && (
        <div className="loadMoreContainer">
          <button className="loadMoreButton" onClick={handleLoadMore} disabled={loading}>
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
      {!loading && !hasMore && articles.length > 0 && (
        <div className="noMoreArticles">没有更多文章了</div>
      )}
      {!loading && articles.length === 0 && <div className="noArticles">暂无文章</div>}
    </div>
  );
};

export default ArticleList;
