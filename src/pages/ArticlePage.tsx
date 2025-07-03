'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getArticleById, getAdjacentArticles, Article } from '../utils/articleService';
import DOMPurify from 'dompurify';
import Loading from '../components/Loading';
import StatusMessage from '../components/StatusMessage';
import { recordPostsView } from '../utils/stats';
import { marked } from 'marked';
import { addPostReaction, getPostReaction } from '../utils/reactionService';
import CommentSection from '../components/CommentSection';

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
  <button 
    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
    onClick={onClick}
  >
    <i className={icon}></i>
    {platform}
  </button>
);

const ArticlePage: React.FC = () => {
  const params = useParams();
  const post_id = params?.id as string;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 操作按钮区域 */}
        <div className="flex justify-between items-center mb-8">
          <Link 
            href={`/article/${article.post_id}/edit`} 
            className="btn-primary px-4 py-2 text-sm"
          >
            编辑文章
          </Link>
          
          <div className="flex items-center gap-2">
            <button
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                PostReaction === 'like' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              } ${isReactionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleReaction('like')}
              disabled={isReactionLoading}
            >
              <span>👍</span>
              <span>{likeCount || 0}</span>
            </button>
            
            <button
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                PostReaction === 'dislike' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              } ${isReactionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleReaction('dislike')}
              disabled={isReactionLoading}
            >
              <span>👎</span>
              <span>{dislikeCount || 0}</span>
            </button>
          </div>
        </div>

        {/* 文章主体 */}
        <article className="card">
          {/* 文章标题 */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {article.title}
          </h1>
          
          {/* 文章元信息 */}
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span>✍️</span>
              <span>作者：{article.author}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span>📅</span>
              <span>发布于：{new Date(article.created_at).toLocaleDateString()}</span>
            </div>
            
            {article.tags && article.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">🏷️ 标签：</span>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 文章内容 */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none markdownBody"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(marked.parse(article.content).toString())
            }}
          />

          {/* 分享操作 */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-gray-400">分享文章：</span>
              <ShareButton
                platform="复制链接"
                icon="icon-link"
                onClick={() => handleShare('复制链接')}
              />
            </div>
          </div>
        </article>

        {/* 上下篇导航 */}
        {(prevArticle || nextArticle) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {prevArticle && (
              <Link 
                href={`/article/${prevArticle.post_id}`} 
                className="card hover:shadow-lg transition-shadow duration-200 group"
              >
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">上一篇</div>
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  {prevArticle.title}
                </div>
              </Link>
            )}
            
            {nextArticle && (
              <Link 
                href={`/article/${nextArticle.post_id}`} 
                className="card hover:shadow-lg transition-shadow duration-200 group md:text-right"
              >
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">下一篇</div>
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  {nextArticle.title}
                </div>
              </Link>
            )}
          </div>
        )}

        {/* 评论区域 */}
        <div className="mt-8">
          <CommentSection post_id={article.post_id} />
        </div>
      </div>

      {/* 分享提示 */}
      {showShareTip && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {shareTipText}
        </div>
      )}
    </div>
  );
};

export default ArticlePage;
