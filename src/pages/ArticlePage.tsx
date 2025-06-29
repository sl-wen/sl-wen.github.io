import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticleById, getAdjacentArticles, Article } from '../utils/articleService';
import DOMPurify from 'dompurify';
import Loading from '../components/Loading';
import StatusMessage from '../components/StatusMessage';
import { recordPostsView } from '../utils/stats';
import { marked } from 'marked';
import '../styles/ArticlePage.css';

// 配置 marked 为同步模式
marked.setOptions({
  async: false
});

interface ShareButtonProps {
  platform: string;
  icon: string;
  onClick: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ platform, icon, onClick }) => (
  <button className="share-button" onClick={onClick}>
    <i className={icon}></i>
    {platform}
  </button>
);

const ArticlePage: React.FC = () => {
  const { post_id } = useParams<{ post_id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevArticle, setPrevArticle] = useState<Article | null>(null);
  const [nextArticle, setNextArticle] = useState<Article | null>(null);

  const [showShareTip, setShowShareTip] = useState(false);
  const [shareTipText, setShareTipText] = useState('');

  const handleShare = async (platform: string) => {
    const url = window.location.href;

    try {
      switch (platform) {
        case '复制链接':
          await navigator.clipboard.writeText(url);
          setShareTipText('链接已复制到剪贴板');
          setShowShareTip(true);
          break;
      }

      // 3秒后隐藏提示
      setTimeout(() => {
        setShowShareTip(false);
      }, 3000);
    } catch (error) {
      console.error('分享失败:', error);
      setShareTipText('分享失败，请重试');
      setShowShareTip(true);
    }
  };

  useEffect(() => {
    const fetchArticle = async () => {
      if (!post_id) {
        setError('文章ID无效');
        return;
      }

      try {
        setLoading(true);
        const [articleData, adjacentArticles] = await Promise.all([
          getArticleById(post_id),
          getAdjacentArticles(post_id)
        ]);

        if (!articleData) {
          setError('文章不存在');
          return;
        }

        setArticle(articleData);
        setPrevArticle(adjacentArticles.prev);
        setNextArticle(adjacentArticles.next);
        recordPostsView(post_id);
      } catch (err) {
        setError('加载文章失败');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [post_id]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <StatusMessage message={error} />;
  }

  if (!article) {
    return null;
  }

  return (
    <div className="page">
      <div className="article-container">
        <h1 className="article-title">{article.title}</h1>
        <div className="article-meta">
          <span className="article-author">作者：{article.author}</span>
          <span className="article-date">
            发布于：{new Date(article.created_at).toLocaleDateString()}
          </span>
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="article-tags">
            标签：
            {article.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div
          className="articleContent markdownBody"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(marked.parse(article.content).toString())
          }}
        />
        <div className="article-stats">
          <span>👍 {article.likes_count}</span>
          <span>💬 {article.comments_count}</span>
          <span>👁️ {article.views}</span>
        </div>

        <div className="article-actions">
          <div className="article-share">
            <ShareButton
              platform="复制链接"
              icon="icon-link"
              onClick={() => handleShare('复制链接')}
            />
          </div>
        </div>

        {(prevArticle || nextArticle) && (
          <div className="article-navigation">
            {prevArticle && (
              <Link to={`/article/${prevArticle.post_id}`} className="nav-link prev-article">
                <span>上一篇</span>
                <p>{prevArticle.title}</p>
              </Link>
            )}
            {nextArticle && (
              <Link to={`/article/${nextArticle.post_id}`} className="nav-link next-article">
                <span>下一篇</span>
                <p>{nextArticle.title}</p>
              </Link>
            )}
          </div>
        )}
      </div>
      {showShareTip && <div className="share-tip">{shareTipText}</div>}
    </div>
  );
};

export default ArticlePage;
