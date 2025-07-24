'use client';

import React, { useState, useEffect } from 'react';
import {
  Comment,
  getComments,
  addComment,
  updateComment,
  deleteComment
} from '@/utils/commentService';
import { addCommentReaction, getCommentReaction } from '@/utils/reactionService';
import { getUserProfile } from '@/utils/supabase-config';
import { Button, Textarea, Card, Alert } from './ui';

interface UserProfile {
  username: string;
  level: number;
  avatar_url: string;
}

interface CommentSectionProps {
  post_id: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ post_id }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{
    user_id: string;
    username: string;
    email: string;
  } | null>(null);
  const [commentUserProfiles, setCommentUserProfiles] = useState<{
    [key: string]: UserProfile | null;
  }>({});
  const [commentReactions, setCommentReactions] = useState<{
    [key: string]: 'like' | 'dislike' | null;
  }>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      const data = localStorage.getItem('userProfile');
      setUserProfile(JSON.parse(data || '{}'));
      const commentsData = await getComments(post_id);
      setComments(commentsData);
    };
    loadInitialData();
  }, [post_id]);

  useEffect(() => {
    const loadUserProfiles = async () => {
      const profiles: { [key: string]: UserProfile | null } = {};
      const newUserIds = comments
        .filter((comment) => !commentUserProfiles[comment.user_id])
        .map((comment) => comment.user_id);

      if (newUserIds.length > 0) {
        for (const userId of newUserIds) {
          const profile = await getUserProfile(userId);
          profiles[userId] = profile;
        }
        setCommentUserProfiles((prev) => ({ ...prev, ...profiles }));
      }
    };
    loadUserProfiles();
  }, [comments]);

  useEffect(() => {
    if (userProfile?.user_id && comments.length > 0) {
      const loadReactions = async () => {
        const reactions: { [key: string]: 'like' | 'dislike' | null } = {};
        for (const comment of comments) {
          const reaction = await getCommentReaction(comment.comment_id, userProfile.user_id);
          reactions[comment.comment_id] = reaction;
        }
        setCommentReactions(reactions);
      };
      loadReactions();
    }
  }, [userProfile?.user_id, comments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.user_id) {
      setError('请先登录后再评论');
      return;
    }
    if (!newComment.trim()) {
      setError('评论内容不能为空');
      return;
    }

    try {
      const comment = await addComment({
        post_id,
        user_id: userProfile?.user_id || '',
        parent_id: null,
        content: newComment.trim(),
        is_approved: false,
        likes_count: 0,
        dislikes_count: 0
      });

      if (comment) {
        setComments([...comments, comment]);
        setNewComment('');
        setError(null);
      }
    } catch (err) {
      setError('发表评论失败');
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment.comment_id);
    setEditContent(comment.content);
  };

  const handleUpdate = async (comment_id: string) => {
    if (!editContent.trim()) {
      setError('评论内容不能为空');
      return;
    }

    const updatedComment = await updateComment(comment_id, editContent.trim());
    if (updatedComment) {
      setComments(comments.map((c) => (c.comment_id === comment_id ? updatedComment : c)));
      setEditingCommentId(null);
      setEditContent('');
      setError(null);
    } else {
      setError('更新评论失败');
    }
  };

  const handleDelete = async (comment_id: string) => {
    if (window.confirm('确定要删除这条评论吗？')) {
      const success = await deleteComment(comment_id, post_id);
      if (success) {
        setComments(comments.filter((c) => c.comment_id !== comment_id));
      } else {
        setError('删除评论失败');
      }
    }
  };

  const handleReply = (comment_id: string) => {
    if (!userProfile?.user_id) {
      setError('请先登录后再回复评论');
      return;
    }
    setReplyingToId(comment_id);
    setReplyContent('');
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyContent('');
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.user_id) {
      setError('请先登录后再回复评论');
      return;
    }
    if (!replyContent.trim()) {
      setError('回复内容不能为空');
      return;
    }

    try {
      const reply = await addComment({
        post_id,
        user_id: userProfile.user_id,
        parent_id: replyingToId,
        content: replyContent.trim(),
        is_approved: false,
        likes_count: 0,
        dislikes_count: 0
      });

      if (reply) {
        setComments([...comments, reply]);
        handleCancelReply();
        setError(null);
      }
    } catch (error) {
      setError('回复发表失败');
    }
  };

  const [isReacting, setIsReacting] = useState<{ [key: string]: boolean }>({});

  const handleReaction = async (comment_id: string, type: 'like' | 'dislike') => {
    if (!userProfile?.user_id) {
      setError('请先登录后再操作');
      return;
    }

    if (isReacting[comment_id]) {
      return;
    }

    const comment = comments.find((c) => c.comment_id === comment_id);
    if (!comment) return;

    try {
      setIsReacting((prev) => ({ ...prev, [comment_id]: true }));

      const previousReaction = commentReactions[comment_id];
      const previousComments = [...comments];
      const newReaction = previousReaction === type ? null : type;

      const success = await addCommentReaction(
        comment_id,
        userProfile.user_id,
        type,
        comment.likes_count || 0,
        comment.dislikes_count || 0
      );

      setCommentReactions((prev) => ({ ...prev, [comment_id]: newReaction }));

      setComments(
        comments.map((c) => {
          if (c.comment_id === comment_id) {
            const likesCount = c.likes_count || 0;
            const dislikesCount = c.dislikes_count || 0;

            if (newReaction === null) {
              return {
                ...c,
                likes_count: type === 'like' ? likesCount - 1 : likesCount,
                dislikes_count: type === 'dislike' ? dislikesCount - 1 : dislikesCount
              };
            } else if (previousReaction && previousReaction !== newReaction) {
              return {
                ...c,
                likes_count: type === 'like' ? likesCount + 1 : likesCount - 1,
                dislikes_count: type === 'dislike' ? dislikesCount + 1 : dislikesCount - 1
              };
            } else {
              return {
                ...c,
                likes_count: type === 'like' ? likesCount + 1 : likesCount,
                dislikes_count: type === 'dislike' ? dislikesCount + 1 : dislikesCount
              };
            }
          }
          return c;
        })
      );

      if (!success) {
        setCommentReactions((prev) => ({ ...prev, [comment_id]: previousReaction }));
        setComments(previousComments);
        setError('操作失败，请稍后重试');
      }

    } catch (error) {
      console.error('处理评论反应失败:', error);
      setError('操作失败，请稍后重试');
    } finally {
      setIsReacting((prev) => ({ ...prev, [comment_id]: false }));
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 评论标题和统计 */}
      <div className="flex items-center justify-between pb-6 border-b-2 border-gradient-to-r from-blue-200 via-purple-200 to-pink-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              评论讨论
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 px-4 py-2 rounded-full font-medium shadow-sm border border-blue-200/50 dark:border-blue-700/50">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
              </svg>
              {comments.filter(c => !c.parent_id).length} 条评论
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>实时更新</span>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 发表评论表单 */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl blur-xl"></div>
        <Card className="relative p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl border border-white/20 dark:border-gray-700/50 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    发表评论
                  </label>
                </div>
                {userProfile?.user_id && (
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                      {userProfile.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {userProfile?.username}
                    </span>
                  </div>
                )}
              </div>
              <div className="relative">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="分享你的想法，让讨论更精彩..."
                  required
                  rows={4}
                  fullWidth
                  className="border-2 border-gray-200/50 dark:border-gray-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
                  {newComment.length}/1000
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewComment('')}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  清空
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!newComment.trim() || !userProfile?.user_id}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  }
                >
                  发表评论
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>

      {/* 评论列表 */}
      <div className="space-y-6">
        {comments
          .filter((comment) => !comment.parent_id)
          .map((comment) => (
            <div key={comment.comment_id} className="group relative">
              {/* 装饰性背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50 dark:from-blue-900/20 dark:via-gray-800 dark:to-purple-900/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 group-hover:transform group-hover:scale-[1.02]">
                {/* 主评论容器 */}
                <div className="p-6">
                  {/* 评论头部 */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-0.5">
                          <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {/* 用户头像 */}
                              <img src={commentUserProfiles[comment.user_id]?.avatar_url} alt="用户头像" className="w-10 h-10 rounded-full object-cover" />
                            </div>
                          </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white text-lg">
                            {commentUserProfiles[comment.user_id]?.username || '匿名用户'}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-800 dark:text-blue-200 rounded-full border border-blue-200/50 dark:border-blue-700/50">
                            Lv.{commentUserProfiles[comment.user_id]?.level || 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <time>
                            {new Date(comment.created_at).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </time>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 评论内容 */}
                  {editingCommentId === comment.comment_id ? (
                    <Card variant="filled" className="mt-3 p-4 bg-gray-50 dark:bg-gray-700">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleUpdate(comment.comment_id);
                        }}
                        className="space-y-4"
                      >
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          required
                          rows={3}
                          fullWidth
                          className="border-gray-300 dark:border-gray-600"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setEditingCommentId(null)}
                          >
                            取消
                          </Button>
                          <Button type="submit" variant="primary">
                            保存
                          </Button>
                        </div>
                      </form>
                    </Card>
                  ) : (
                    <>
                      <div className="prose prose-gray dark:prose-invert max-w-none mb-4">
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-base">
                          {comment.content}
                        </p>
                      </div>

                      {/* 评论操作按钮 */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-600">
                        <div className="flex items-center gap-2">
                          <Button
                            variant={commentReactions[comment.comment_id] === 'like' ? 'success' : 'ghost'}
                            size="sm"
                            onClick={() => handleReaction(comment.comment_id, 'like')}
                            className={`flex items-center gap-1 px-3 py-2 rounded-full transition-all ${commentReactions[comment.comment_id] === 'like'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            leftIcon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                              </svg>
                            }
                          >
                            {comment.likes_count || 0}
                          </Button>
                          <Button
                            variant={commentReactions[comment.comment_id] === 'dislike' ? 'danger' : 'ghost'}
                            size="sm"
                            onClick={() => handleReaction(comment.comment_id, 'dislike')}
                            className={`flex items-center gap-1 px-3 py-2 rounded-full transition-all ${commentReactions[comment.comment_id] === 'dislike'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            leftIcon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.7M10 14v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2M17 4H19a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                              </svg>
                            }
                          >
                            {comment.dislikes_count || 0}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReply(comment.comment_id)}
                            className="flex items-center gap-1 px-3 py-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                            leftIcon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            }
                          >
                            回复
                          </Button>
                        </div>
                        {userProfile?.user_id === comment.user_id && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(comment)}
                              className="flex items-center gap-1 px-3 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                              leftIcon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              }
                            >
                              编辑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(comment.comment_id)}
                              className="flex items-center gap-1 px-3 py-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                              leftIcon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              }
                            >
                              删除
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* 回复表单 */}
                      {replyingToId === comment.comment_id && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <form onSubmit={handleSubmitReply} className="space-y-4">
                            <Textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder={`回复 @${commentUserProfiles[comment.user_id]?.username || '匿名用户'}`}
                              required
                              rows={3}
                              fullWidth
                              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={handleCancelReply}
                              >
                                取消
                              </Button>
                              <Button type="submit" variant="primary">
                                发表回复
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 回复列表 - 缩进显示 */}
                <div className="replies-container">
                  {comments
                    .filter((reply) => reply.parent_id === comment.comment_id)
                    .map((reply) => (
                      <div key={reply.comment_id} className="ml-8 mr-6 mb-4 last:mb-6 relative">
                        {/* 回复连接线 */}
                        {/* <div className="absolute -left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-blue-200 dark:from-blue-600 dark:to-blue-800"></div> */}
                        {/* <div className="absolute -left-8 top-6 w-4 h-0.5 bg-blue-400 dark:bg-blue-600"></div> */}

                        {/* 回复内容卡片 */}
                        <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                          {/* 回复头部 */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                {(commentUserProfiles[reply.user_id]?.username || '匿名用户').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                  {commentUserProfiles[reply.user_id]?.username || '匿名用户'}
                                </span>
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full">
                                  Lv.{commentUserProfiles[reply.user_id]?.level || 1}
                                </span>
                              </div>
                            </div>
                            <time className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(reply.created_at).toLocaleString()}
                            </time>
                          </div>

                          {/* 回复内容 */}
                          <div className="prose prose-sm prose-gray dark:prose-invert max-w-none mb-3">
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                              {reply.content}
                            </p>
                          </div>

                          {/* 回复操作按钮 */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center gap-1">
                              <Button
                                variant={commentReactions[reply.comment_id] === 'like' ? 'success' : 'ghost'}
                                size="sm"
                                onClick={() => handleReaction(reply.comment_id, 'like')}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${commentReactions[reply.comment_id] === 'like'
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                leftIcon={
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                  </svg>
                                }
                              >
                                {reply.likes_count || 0}
                              </Button>
                              <Button
                                variant={commentReactions[reply.comment_id] === 'dislike' ? 'danger' : 'ghost'}
                                size="sm"
                                onClick={() => handleReaction(reply.comment_id, 'dislike')}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${commentReactions[reply.comment_id] === 'dislike'
                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                leftIcon={
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.7M10 14v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2M17 4H19a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                  </svg>
                                }
                              >
                                {reply.dislikes_count || 0}
                              </Button>
                            </div>
                            {userProfile?.user_id === reply.user_id && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(reply)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500 hover:bg-gray-200"
                                >
                                  编辑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(reply.comment_id)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-500 hover:bg-red-200"
                                >
                                  删除
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CommentSection;
