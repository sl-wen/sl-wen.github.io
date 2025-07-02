import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticleById, getAdjacentArticles, Article } from '../utils/articleService';
import DOMPurify from 'dompurify';
import Loading from '../components/Loading';
import StatusMessage from '../components/StatusMessage';
import { recordPostsView } from '../utils/stats';
import { marked } from 'marked';
import { addPostReaction, getPostReaction } from '../utils/reactionService';
import CommentSection from '../components/CommentSection';
import '../styles/ArticlePage.css';

const addCopyButtons = () => {
  const codeBlocks = document.querySelectorAll('.markdownBody pre code');
  codeBlocks.forEach((block) => {
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = '';
    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
    copyButton.title = '复制代码';

    copyButton.addEventListener('click', async () => {
      const code = block.querySelector('code');
      if (code) {
        try {
          const text = code.textContent || '';
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
          } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
              document.execCommand('copy');
            } catch (err) {
              console.error('复制失败:', err);
            }
            textArea.remove();
          }
          copyButton.innerHTML = '<i class="fas fa-check"></i>';
          copyButton.classList.add('copied');
          setTimeout(() => {
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('复制失败:', err);
        }
      }
    });

    block.appendChild(copyButton);
  });
};

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
  const [dislikeCount, setDislikeCount] = useState<number>(0);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevArticle, setPrevArticle] = useState<Article | null>(null);
  const [nextArticle, setNextArticle] = useState<Article | null>(null);

  const [showShareTip, setShowShareTip] = useState(false);
  const [shareTipText, setShareTipText] = useState('');
  const [PostReaction, setPostReaction] = useState<'like' | 'dislike' | null>(null);
  const [userProfile, setUserProfile] = useState<{
    user_id: string;
    username: string;
    email: string;
  } | null>(null);

  // 添加防止重复点击的状态
  const [isReactionLoading, setIsReactionLoading] = useState(false);

  const handleShare = async (platform: string) => {
    const url = window.location.href;

    try {
      switch (platform) {
        case '复制链接':
          try {
            if (navigator.clipboard) {
              await navigator.clipboard.writeText(url);
              setShareTipText('链接已复制到剪贴板');
            } else {
              // 兼容旧版浏览器
              const textArea = document.createElement('textarea');
              textArea.value = url;
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand('copy');
              document.body.removeChild(textArea);
              setShareTipText('链接已复制');
            }
            setShowShareTip(true);
          } catch (error) {
            console.error('复制失败:', error);
            setShareTipText('复制失败，请手动复制链接');
            setShowShareTip(true);
          }
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

  // 处理点赞/点踩的函数
  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    // 防止重复点击
    if (isReactionLoading) {
      return;
    }

    if (!userProfile?.user_id) {
      alert('请先登录');
      return;
    }

    if (!article) {
      return;
    }

    try {
      setIsReactionLoading(true);

      await addPostReaction(
        article.post_id,
        userProfile.user_id,
        reactionType,
        article.likes_count,
        article.dislikes_count
      );

      const newReaction = PostReaction === reactionType ? null : reactionType;
      setPostReaction(newReaction);

      // 更新文章的点赞/点踩数量
      setArticle((prev) => {
        if (!prev) return null;

        let newLikesCount = prev.likes_count;
        let newDislikesCount = prev.dislikes_count;

        if (reactionType === 'like') {
          // 处理点赞
          if (newReaction === 'like') {
            newLikesCount += 1;
            // 如果之前是点踩，需要减少点踩数
            if (PostReaction === 'dislike') {
              newDislikesCount -= 1;
            }
          } else {
            // 取消点赞
            newLikesCount -= 1;
          }
        } else {
          // 处理点踩
          if (newReaction === 'dislike') {
            newDislikesCount += 1;
            // 如果之前是点赞，需要减少点赞数
            if (PostReaction === 'like') {
              newLikesCount -= 1;
            }
          } else {
            // 取消点踩
            newDislikesCount -= 1;
          }
        }

        return {
          ...prev,
          likes_count: newLikesCount,
          dislikes_count: newDislikesCount
        };
      });
    } catch (error) {
      console.error('操作失败:', error);
      // 可以添加错误提示
      alert('操作失败，请重试');
    } finally {
      setIsReactionLoading(false);
    }
  };

  useEffect(() => {
    const data = localStorage.getItem('userProfile');
    setUserProfile(JSON.parse(data || '{}'));
  }, []);

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
        setDislikeCount(articleData.dislikes_count);
        setLikeCount(articleData.likes_count);
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

  useEffect(() => {
    addCopyButtons();
    if (article && userProfile?.user_id) {
      getPostReaction(article.post_id, userProfile.user_id).then(setPostReaction);
    }
  }, [article]);

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
        <div className="button-area">
          <Link to={`/edit/${article.post_id}`} className="editButton">
            <span>编辑</span>
          </Link>
          <div className="reactionButton">
            <button
              className={`reaction-button ${PostReaction === 'like' ? 'active' : ''} ${isReactionLoading ? 'loading' : ''}`}
              onClick={() => handleReaction('like')}
              disabled={isReactionLoading}
            >
              <i className="fas fa-thumbs-up"></i>
              <span className="likes-count">{likeCount || 0}</span>
            </button>
            <button
              className={`reaction-button ${PostReaction === 'dislike' ? 'active' : ''} ${isReactionLoading ? 'loading' : ''}`}
              onClick={() => handleReaction('dislike')}
              disabled={isReactionLoading}
            >
              <i className="fas fa-thumbs-down"></i>
              <span className="dislikes-count">{dislikeCount || 0}</span>
            </button>
          </div>
        </div>
        <h1 className="article-title">{article.title}</h1>
        <div className="article-meta">
          <span className="article-author">作者：{article.author}</span>
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
          <span className="article-date">
            发布于：{new Date(article.created_at).toLocaleDateString()}
          </span>
        </div>
        <div
          className="articleContent markdownBody"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(marked.parse(article.content).toString())
          }}
        />

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
                <span>{prevArticle.title}</span>
              </Link>
            )}
            {nextArticle && (
              <Link to={`/article/${nextArticle.post_id}`} className="nav-link next-article">
                <span>下一篇</span>
                <span>{nextArticle.title}</span>
              </Link>
            )}
          </div>
        )}
      </div>
      {showShareTip && <div className="share-tip">{shareTipText}</div>}

      <CommentSection post_id={article.post_id} />
    </div>
  );
};

export default ArticlePage;
