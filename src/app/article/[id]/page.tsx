'use client';
import Icon from '@/components/Icon';

import CommentSection from '@/components/CommentSection';
import Loading from '@/components/Loading';
import { Article, getAdjacentArticles, getArticleById } from '@/utils/articleService';
import { getPostReaction, clearAllReactionCache } from '@/utils/reactionService';
import { togglePostReaction } from '@/utils/interactionRpc';
import { recordPostsView } from '@/utils/stats';
import { TASK_ACTIONS, useSafeTaskProgress } from '@/utils/task-hooks';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';

const addCopyButtons = () => {
  document.querySelectorAll('.markdownBody pre').forEach((pre) => {
    // 防止重复插入
    if (pre.querySelector('.copy-button')) return;

    const code = pre.querySelector('code');
    if (!code) return;

    // 设置 pre 为 relative 布局
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

// 配置 marked：breaks 让单个换行渲染为 <br>（很多文章靠单换行分段）
marked.setOptions({
  async: false,
  gfm: true,
  breaks: true
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

  // 防止重复点击的状态
  const [isReactionLoading, setIsReactionLoading] = useState(false);

  // Safely use the task progress hook
  let updateProgress: ((actionType: string, count?: number) => Promise<void>) | null = null;
  try {
    const taskProgress = useSafeTaskProgress();
    updateProgress = taskProgress.updateProgress;
  } catch (error) {
    console.error('Failed to initialize task progress:', error);
  }

  // 防抖的点赞处理函数
  const debouncedHandleReaction = useCallback(
    debounce((reactionType: 'like' | 'dislike') => {
      handlePostReaction(reactionType);
    }, 300),
    [article, userProfile, PostReaction, updateProgress]
  );

  // 处理点赞/点踩的函数
  const handlePostReaction = async (reactionType: 'like' | 'dislike') => {
    if (!userProfile?.user_id) {
      alert('请先登录');
      return;
    }

    if (!article) {
      return;
    }

    setIsReactionLoading(true);

    // 立即更新UI状态（乐观更新）
    const oldLikes = article.likes_count || 0;
    const oldDislikes = article.dislikes_count || 0;
    const oldReaction = PostReaction;

    let newLikes = oldLikes;
    let newDislikes = oldDislikes;
    let newReaction = oldReaction;

    // 计算新的反应状态（遵循切换+1/-1，取消-1）
    if (reactionType === 'like') {
      if (oldReaction === 'like') {
        newLikes = Math.max(0, newLikes - 1);
        newReaction = null;
      } else {
        newLikes = newLikes + 1;
        if (oldReaction === 'dislike') {
          newDislikes = Math.max(0, newDislikes - 1);
        }
        newReaction = 'like';
      }
    } else if (reactionType === 'dislike') {
      if (oldReaction === 'dislike') {
        newDislikes = Math.max(0, newDislikes - 1);
        newReaction = null;
      } else {
        newDislikes = newDislikes + 1;
        if (oldReaction === 'like') {
          newLikes = Math.max(0, newLikes - 1);
        }
        newReaction = 'dislike';
      }
    }

    // 立即更新UI
    setPostReaction(newReaction);
    setArticle(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        likes_count: newLikes,
        dislikes_count: newDislikes,
      };
    });

    try {
      // 服务端幂等切换（RPC），返回权威计数；失败返回 null
      const result = await togglePostReaction(
        article.post_id,
        userProfile.user_id,
        reactionType
      );

      if (!result) {
        // RPC 失败，回滚状态
        setPostReaction(oldReaction);
        setArticle(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            likes_count: oldLikes,
            dislikes_count: oldDislikes,
          };
        });
      } else {
        // 以服务端计数为准
        setPostReaction(result.reaction);
        setArticle(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            likes_count: result.likes,
            dislikes_count: result.dislikes,
          };
        });
        // 更新任务进度
        if (updateProgress) {
          try {
            await updateProgress(TASK_ACTIONS.LIKE, 1);
          } catch (taskError) {
            console.error('更新任务进度失败:', taskError);
          }
        }
      }
    } catch (error) {
      console.error('处理反应失败:', error);
      // 回滚状态
      setPostReaction(oldReaction);
      setArticle(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          likes_count: oldLikes,
          dislikes_count: oldDislikes,
        };
      });
    } finally {
      setIsReactionLoading(false);
    }
  };

  // 防抖函数
  function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    }) as T;
  }

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

          // 记录浏览：RPC 原子自增 + sessionStorage 会话去重（同会话刷新文章不重复计数）
          const viewKey = `viewed_${post_id}`;
          const viewPromise = (async () => {
            if (typeof window !== 'undefined' && sessionStorage.getItem(viewKey)) {
              return; // 本会话已计过，不重复 +1
            }
            await recordPostsView(post_id, articleData.views);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(viewKey, '1');
            }
            // 成功后立即更新 views 数字，让用户看到 +1
            setArticle(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev);
          })().catch((viewError) => {
            console.error('记录文章浏览失败:', viewError);
          });

          const adjacentPromise = getAdjacentArticles(post_id)
            .then((adjacentArticles) => {
              setPrevArticle(adjacentArticles.prev);
              setNextArticle(adjacentArticles.next);
            })
            .catch((adjacentError) => {
              console.error('获取相邻文章失败:', adjacentError);
            });
          await Promise.allSettled([viewPromise, adjacentPromise]);
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

  // 清理缓存
  useEffect(() => {
    return () => {
      clearAllReactionCache();
    };
  }, []);

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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-4 rounded-xl shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 面包屑返回 - 轻量导航 */}
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            返回首页
          </Link>
        </div>

        {/* 文章头部 - 白底大卡，标题 + 元信息 */}
        <header className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 md:p-8 mb-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-4 leading-[1.2]">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="user" className="w-4 h-4" />
              {article.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" className="w-4 h-4" />
              {new Date(article.created_at).toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Icon name="eye" className="w-4 h-4" />
              {article.views || 0} 次浏览
            </span>
          </div>
        </header>

        {/* 操作区 - 点赞/点踩轻量化，编辑仅作者可见 */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => debouncedHandleReaction('like')}
              disabled={isReactionLoading}
              aria-pressed={PostReaction === 'like'}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 active:translate-y-px disabled:opacity-50',
                PostReaction === 'like'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
              </svg>
              <span className="tabular-nums">{article.likes_count || 0}</span>
            </button>

            <button
              onClick={() => debouncedHandleReaction('dislike')}
              disabled={isReactionLoading}
              aria-pressed={PostReaction === 'dislike'}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 active:translate-y-px disabled:opacity-50',
                PostReaction === 'dislike'
                  ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 01-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a5.025 5.025 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.75 2.25 2.25 0 009.75 22a.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 001.302-4.665c0-1.194-.232-2.333-.654-3.375z" />
              </svg>
              <span className="tabular-nums">{article.dislikes_count || 0}</span>
            </button>
          </div>

          {userProfile?.user_id && (
            <Link
              href={`/article/${article.post_id}/edit`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              <Icon name="edit" className="w-4 h-4" />
              编辑
            </Link>
          )}
        </div>

        {/* 文章内容 - 纯排版容器，读感优先 */}
        <article className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 md:p-8 mb-6">
          <div
            className="markdownBody prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(marked.parse(article.content) as string)
            }}
          />
        </article>

        {/* 相邻文章导航 - 双卡对称，纯文字 */}
        <nav className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {prevArticle ? (
            <Link
              href={`/article/${prevArticle.post_id}`}
              className="group flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl px-4 py-3 hover:border-gray-300 dark:hover:border-gray-700 transition-colors duration-200 min-w-0"
            >
              <svg className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{prevArticle.title}</span>
            </Link>
          ) : (
            <div className="hidden sm:block" aria-hidden="true"></div>
          )}

          {nextArticle ? (
            <Link
              href={`/article/${nextArticle.post_id}`}
              className="group flex items-center justify-end gap-2 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl px-4 py-3 hover:border-gray-300 dark:hover:border-gray-700 transition-colors duration-200 min-w-0"
            >
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{nextArticle.title}</span>
              <svg className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          ) : (
            <div className="hidden sm:block" aria-hidden="true"></div>
          )}
        </nav>

        {/* 评论区 */}
        <CommentSection postId={article.post_id} />
      </div>
    </div>
  );
}
