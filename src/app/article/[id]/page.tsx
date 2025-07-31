'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getArticleById, getAdjacentArticles, Article } from '@/utils/articleService';
import DOMPurify from 'dompurify';
import Loading from '@/components/Loading';
import { recordPostsView } from '@/utils/stats';
import { marked } from 'marked';
import { addPostReaction, getPostReaction } from '@/utils/reactionService';
import CommentSection from '@/components/CommentSection';
import { Button } from '@/components/ui/Button';
import { useTaskProgress, TASK_ACTIONS } from '@/utils/task-hooks';

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
  const { updateProgress } = useTaskProgress();

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

      if (!success) {
        // 请求失败，回退状态
        throw new Error('操作失败');
      } else if (reactionType === 'like' && oldReaction !== 'like') {
        // 更新任务进度 - 点赞
        await updateProgress(TASK_ACTIONS.LIKE);
      }
    } catch (e) {
      // 回滚
      setArticle(prev => {
        if (!prev) return prev;
        // 注意这里假设postReaction未变动，最好保存旧状态到闭包中再恢复
        return {
          ...prev,
          likes_count: oldLikes,
          dislikes_count: oldDislikes
        };
      });
      setPostReaction(oldReaction);
      alert('操作失败，请稍后再试');
    } finally {
      setIsReactionLoading(false);
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

  useEffect(() => {
    const data = localStorage.getItem('userProfile');
    const profile = JSON.parse(data || '{}');
    setUserProfile(profile);
  }, []);

  useEffect(() => {
    if (article && userProfile?.user_id) {
      // 加载用户的反应状态
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 操作按钮区域 */}
        <div className="flex justify-between items-center mb-8">
          {userProfile?.user_id && (
            <Link
              href={`/article/${article.post_id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              编辑文章
            </Link>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant={PostReaction === 'like' ? 'success' : 'ghost'}
              size="sm"
              onClick={() => handlePostReaction('like')}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
              }
            >
              {article.likes_count || 0}
            </Button>
            <Button
              variant={PostReaction === 'dislike' ? 'danger' : 'ghost'}
              size="sm"
              onClick={() => handlePostReaction('dislike')}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.7M10 14v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2M17 4H19a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                  />
                </svg>
              }
            >
              {article.dislikes_count || 0}
            </Button>
          </div>
        </div>

        {/* 文章主体 */}
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2">
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
        </article>

        {/* 上下篇导航 */}
        {(prevArticle || nextArticle) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {prevArticle && (
              <Link
                href={`/article/${prevArticle.post_id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:shadow-lg transition-shadow duration-200 group"
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
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 hover:shadow-lg transition-shadow duration-200 group md:text-right"
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
    </div>
  );
}
