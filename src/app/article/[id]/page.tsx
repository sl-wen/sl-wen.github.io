'use client';

import CommentSection from '@/components/CommentSection';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/Button';
import { Article, getAdjacentArticles, getArticleById } from '@/utils/articleService';
import { addPostReaction, getPostReaction } from '@/utils/reactionService';
import { recordPostsView } from '@/utils/stats';
import { TASK_ACTIONS, useSafeTaskProgress } from '@/utils/task-hooks';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

const addCopyButtons = () => {
  console.log('addCopyButtons called');
  document.querySelectorAll('.markdownBody pre').forEach((pre) => {
    // 防止重复插入
    if (pre.querySelector('.copy-button')) return;

    const code = pre.querySelector('code');
    if (!code) return;

    // 设置pre为relative布局
    pre.classList.add('relative');

    // 创建按钮
    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = [
      'copy-button', // 标识方便后续判断
      'absolute',
      'top-2',
      'right-3',
      'z-10',
      'bg-slate-700/80',
      'text-white',
      'rounded',
      'px-3',
      'py-1',
      'text-xs',
      'hover:bg-slate-900/90',
      'transition',
      'outline-none',
      'focus:ring-2',
      'focus:ring-blue-500',
      'select-none'
    ].join(' ');
    copyButton.textContent = '复制';

    copyButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const text = code.textContent || '';
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
        }
        copyButton.textContent = '已复制';
        copyButton.classList.remove('bg-slate-700/80');
        copyButton.classList.add('bg-green-500');
        setTimeout(() => {
          copyButton.textContent = '复制';
          copyButton.classList.remove('bg-green-500');
          copyButton.classList.add('bg-slate-700/80');
        }, 2000);
      } catch {
        copyButton.textContent = '失败';
        copyButton.classList.remove('bg-slate-700/80');
        copyButton.classList.add('bg-red-500');
        setTimeout(() => {
          copyButton.textContent = '复制';
          copyButton.classList.remove('bg-red-500');
          copyButton.classList.add('bg-slate-700/80');
        }, 2000);
      }
    });

    pre.appendChild(copyButton);
  });
};

// 配置 marked 为同步模式
marked.setOptions({
  async: false
});

export default function ArticlePage() {
  const params = useParams();
  const post_id = params?.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevArticle, setPrevArticle] = useState<Article | null>(null);
  const [nextArticle, setNextArticle] = useState<Article | null>(null);
  const [PostReaction, setPostReaction] = useState<'like' | 'dislike' | null>(null);
  const [userProfile, setUserProfile] = useState<{
    user_id: string;
    username: string;
    email: string;
  } | null>(null);

  // 添加防止重复点击的状态
  const [isReactionLoading, setIsReactionLoading] = useState(false);

  // Safely use the task progress hook
  let updateProgress: ((actionType: string, count?: number) => Promise<void>) | null = null;
  try {
    const taskProgress = useSafeTaskProgress();
    updateProgress = taskProgress.updateProgress;
  } catch (error) {
    console.error('Failed to initialize task progress:', error);
  }

  // 处理点赞/点踩的函数
  const handlePostReaction = async (reactionType: 'like' | 'dislike') => {
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

    // 当用户点击点赞/点踩按钮
    setIsReactionLoading(true);

    const oldLikes = article.likes_count;
    const oldDislikes = article.dislikes_count;
    const oldReaction = PostReaction;

    setArticle(prev => {
      if (!prev) return prev;
      let newLikes = oldLikes;
      let newDislikes = oldDislikes;
      let newReaction = oldReaction;

      // 计算新的点赞踩数量和反应类型
      if (reactionType === 'like') {
        if (oldReaction === 'like') {
          newLikes -= 1;
          newReaction = null;
        } else {
          newLikes += 1;
          if (oldReaction === 'dislike') {
            newDislikes -= 1;
          }
          newReaction = 'like';
        }
      } else if (reactionType === 'dislike') {
        if (oldReaction === 'dislike') {
          newDislikes -= 1;
          newReaction = null;
        } else {
          newDislikes += 1;
          if (oldReaction === 'like') {
            newLikes -= 1;
          }
          newReaction = 'dislike';
        }
      }

      setPostReaction(newReaction);

      return {
        ...prev,
        likes_count: newLikes,
        dislikes_count: newDislikes,
      };
    });

    try {
      // 2. 再做请求
      const success = await addPostReaction(
        article.post_id,
        userProfile.user_id,
        reactionType,
        oldLikes,
        oldDislikes
      );

      if (success) {
        // 3. 更新任务进度
        if (updateProgress) {
          try {
            await updateProgress(TASK_ACTIONS.LIKE, 1);
          } catch (taskError) {
            console.error('更新任务进度失败:', taskError);
          }
        }
      } else {
        // 如果请求失败，回滚状态
        setArticle(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            likes_count: oldLikes,
            dislikes_count: oldDislikes,
          };
        });
        setPostReaction(oldReaction);
      }
    } catch (error) {
      console.error('处理反应失败:', error);
      // 回滚状态
      setArticle(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          likes_count: oldLikes,
          dislikes_count: oldDislikes,
        };
      });
      setPostReaction(oldReaction);
    } finally {
      setIsReactionLoading(false);
    }
  };

  // 获取文章数据
  useEffect(() => {
    const fetchArticle = async () => {
      if (!post_id) return;

      try {
        setLoading(true);
        setError(null);

        const articleData = await getArticleById(post_id);
        if (articleData) {
          setArticle(articleData);

          // 记录文章浏览
          try {
            await recordPostsView(post_id);
          } catch (viewError) {
            console.error('记录文章浏览失败:', viewError);
          }

          // 获取相邻文章
          try {
            const adjacentArticles = await getAdjacentArticles(post_id);
            setPrevArticle(adjacentArticles.prev);
            setNextArticle(adjacentArticles.next);
          } catch (adjacentError) {
            console.error('获取相邻文章失败:', adjacentError);
          }
        } else {
          setError('文章不存在');
        }
      } catch (error) {
        console.error('获取文章失败:', error);
        setError('获取文章失败');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [post_id]);

  // 加载用户资料
  useEffect(() => {
    try {
      const data = localStorage.getItem('userProfile');
      if (data) {
        const profile = JSON.parse(data);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('加载用户资料失败:', error);
    }
  }, []);

  // 加载用户反应状态
  useEffect(() => {
    if (article && userProfile?.user_id) {
      const loadUserReaction = async () => {
        try {
          const reaction = await getPostReaction(article.post_id, userProfile.user_id);
          setPostReaction(reaction);
        } catch (error) {
          console.error('加载用户反应失败:', error);
          setPostReaction(null);
        }
      };
      loadUserReaction();
    } else {
      setPostReaction(null);
    }
  }, [article, userProfile?.user_id]);

  // 添加复制按钮到代码块
  useEffect(() => {
    const timer = setTimeout(() => {
      if (article?.content) {
        addCopyButtons();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [article?.content]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 操作按钮区域 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          {userProfile?.user_id && (
            <Button variant="primary" size="md" asChild>
              <Link href={`/article/${article.post_id}/edit`}>
                <i className="fas fa-edit mr-2"></i>
                编辑文章
              </Link>
            </Button>
          )}
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => handlePostReaction('like')}
              disabled={isReactionLoading}
              variant={PostReaction === 'like' ? 'success' : 'ghost'}
              size="sm"
              className={cn(
                "transition-all duration-200",
                PostReaction === 'like' && "scale-105"
              )}
            >
              <i className="fas fa-thumbs-up text-sm"></i>
              <span className="ml-1">{article.likes_count || 0}</span>
            </Button>

            <Button
              onClick={() => handlePostReaction('dislike')}
              disabled={isReactionLoading}
              variant={PostReaction === 'dislike' ? 'danger' : 'ghost'}
              size="sm"
              className={cn(
                "transition-all duration-200",
                PostReaction === 'dislike' && "scale-105"
              )}
            >
              <i className="fas fa-thumbs-down text-sm"></i>
              <span className="ml-1">{article.dislikes_count || 0}</span>
            </Button>
          </div>
        </div>

        {/* 文章头部 */}
        <div className="card p-8 mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center">
              <i className="fas fa-user mr-2"></i>
              {article.author}
            </span>
            <span className="flex items-center">
              <i className="fas fa-calendar mr-2"></i>
              {new Date(article.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center">
              <i className="fas fa-eye mr-2"></i>
              {article.views_count || 0} 次浏览
            </span>
          </div>
        </div>

        {/* 文章内容 */}
        <div className="card p-8 mb-8">
          <div
            className="markdownBody prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(marked.parse(article.content) as string)
            }}
          />
        </div>

        {/* 相邻文章导航 */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {prevArticle ? (
              <Button variant="ghost" size="md" asChild className="w-full sm:w-auto">
                <Link href={`/article/${prevArticle.post_id}`}>
                  <i className="fas fa-chevron-left mr-2"></i>
                  <span className="truncate">{prevArticle.title}</span>
                </Link>
              </Button>
            ) : (
              <div className="w-full sm:w-auto"></div>
            )}

            {nextArticle ? (
              <Button variant="ghost" size="md" asChild className="w-full sm:w-auto">
                <Link href={`/article/${nextArticle.post_id}`}>
                  <span className="truncate">{nextArticle.title}</span>
                  <i className="fas fa-chevron-right ml-2"></i>
                </Link>
              </Button>
            ) : (
              <div className="w-full sm:w-auto"></div>
            )}
          </div>
        </div>

        {/* 评论区 */}
        <CommentSection postId={article.post_id} />
      </div>
    </div>
  );
}
