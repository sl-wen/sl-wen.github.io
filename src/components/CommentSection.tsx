'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Comment,
  getComments,
  addComment,
  updateComment,
  deleteComment
} from '@/utils/commentService';
import { addCommentReaction, getCommentReaction, clearAllReactionCache } from '@/utils/reactionService';
import { getUserProfile } from '@/utils/supabase-config';
import { Button, Textarea, Card, Alert } from './ui';
import { useSafeTaskProgress, TASK_ACTIONS } from '@/utils/task-hooks';

interface UserProfile {
  username: string;
  level: number;
  avatar_url: string;
}

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
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
  const [reactionLoading, setReactionLoading] = useState<{
    [key: string]: boolean;
  }>({});

  // Safely use the task progress hook
  let updateProgress: ((actionType: string, count?: number) => Promise<void>) | null = null;
  try {
    const taskProgress = useSafeTaskProgress();
    updateProgress = taskProgress.updateProgress;
  } catch (error) {
    console.error('Failed to initialize task progress in CommentSection:', error);
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = localStorage.getItem('userProfile');
        if (data) {
          const profile = JSON.parse(data);
          setUserProfile(profile);
        }

        const commentsData = await getComments(postId);
        setComments(commentsData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };
    loadInitialData();
  }, [postId]);

  const loadUserProfiles = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error('Failed to load user profiles:', error);
    }
  }, [comments, commentUserProfiles]);

  useEffect(() => {
    loadUserProfiles();
  }, [loadUserProfiles]);

  const loadReactions = useCallback(async () => {
    try {
      if (userProfile?.user_id && comments.length > 0) {
        const reactions: { [key: string]: 'like' | 'dislike' | null } = {};
        for (const comment of comments) {
          const reaction = await getCommentReaction(comment.comment_id, userProfile.user_id);
          reactions[comment.comment_id] = reaction;
        }
        setCommentReactions(reactions);
      }
    } catch (error) {
      console.error('Failed to load reactions:', error);
    }
  }, [userProfile?.user_id, comments]);

  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  // 清理缓存
  useEffect(() => {
    return () => {
      clearAllReactionCache();
    };
  }, []);

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
      const newCommentData = await addComment({
        post_id: postId,
        user_id: userProfile.user_id,
        parent_id: null,
        content: newComment.trim(),
        is_approved: false,
        likes_count: 0,
        dislikes_count: 0
      });

      if (newCommentData) {
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        setError(null);

        // 更新任务进度
        if (updateProgress) {
          try {
            await updateProgress(TASK_ACTIONS.COMMENT, 1);
          } catch (taskError) {
            console.error('更新任务进度失败:', taskError);
          }
        }
      } else {
        setError('添加评论失败，请稍后再试');
      }
    } catch (error) {
      console.error('添加评论失败:', error);
      setError('添加评论失败，请稍后再试');
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

    try {
      const updatedComment = await updateComment(comment_id, editContent.trim());
      if (updatedComment) {
        setComments(prev =>
          prev.map(comment =>
            comment.comment_id === comment_id
              ? updatedComment
              : comment
          )
        );
        setEditingCommentId(null);
        setEditContent('');
        setError(null);
      } else {
        setError('更新评论失败，请稍后再试');
      }
    } catch (error) {
      console.error('更新评论失败:', error);
      setError('更新评论失败，请稍后再试');
    }
  };

  const handleDelete = async (comment_id: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      const success = await deleteComment(comment_id, postId);
      if (success) {
        setComments(prev => prev.filter(comment => comment.comment_id !== comment_id));
        setError(null);
      } else {
        setError('删除评论失败，请稍后再试');
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      setError('删除评论失败，请稍后再试');
    }
  };

  const handleReply = (comment_id: string) => {
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
      setError('请先登录后再回复');
      return;
    }
    if (!replyContent.trim()) {
      setError('回复内容不能为空');
      return;
    }
    if (!replyingToId) return;

    try {
      const newReply = await addComment({
        post_id: postId,
        user_id: userProfile.user_id,
        parent_id: replyingToId,
        content: replyContent.trim(),
        is_approved: false,
        likes_count: 0,
        dislikes_count: 0
      });

      if (newReply) {
        setComments(prev => [newReply, ...prev]);
        setReplyingToId(null);
        setReplyContent('');
        setError(null);

        // 更新任务进度
        if (updateProgress) {
          try {
            await updateProgress(TASK_ACTIONS.COMMENT, 1);
          } catch (taskError) {
            console.error('更新任务进度失败:', taskError);
          }
        }
      } else {
        setError('添加回复失败，请稍后再试');
      }
    } catch (error) {
      console.error('添加回复失败:', error);
      setError('添加回复失败，请稍后再试');
    }
  };

  const handleReaction = async (comment_id: string, type: 'like' | 'dislike') => {
    if (!userProfile?.user_id) {
      setError('请先登录');
      return;
    }

    if (reactionLoading[comment_id]) {
      return;
    }

    const comment = comments.find(c => c.comment_id === comment_id);
    if (!comment) return;

    // 设置loading状态
    setReactionLoading(prev => ({ ...prev, [comment_id]: true }));

    const oldLikes = comment.likes_count || 0;
    const oldDislikes = comment.dislikes_count || 0;
    const currentReaction = commentReactions[comment_id];

    let newLikes = oldLikes;
    let newDislikes = oldDislikes;
    let newReaction = currentReaction;

    // 乐观更新UI
    if (currentReaction === type) {
      newReaction = null;
      if (type === 'like') {
        newLikes--;
      } else {
        newDislikes--;
      }
    } else if (currentReaction === null) {
      newReaction = type;
      if (type === 'like') {
        newLikes++;
      } else {
        newDislikes++;
      }
    } else {
      newReaction = type;
      if (type === 'like') {
        newLikes += 2;
        newDislikes--;
      } else {
        newDislikes += 2;
        newLikes--;
      }
    }

    // 立即更新UI
    setCommentReactions(prev => ({ ...prev, [comment_id]: newReaction }));
    setComments(prev => prev.map(c =>
      c.comment_id === comment_id
        ? { ...c, likes_count: newLikes, dislikes_count: newDislikes }
        : c
    ));

    try {
      const success = await addCommentReaction(
        comment_id,
        userProfile.user_id,
        type,
        newLikes,
        newDislikes
      );

      if (!success) {
        // 回滚状态
        setCommentReactions(prev => ({ ...prev, [comment_id]: currentReaction }));
        setComments(prev => prev.map(c =>
          c.comment_id === comment_id
            ? { ...c, likes_count: oldLikes, dislikes_count: oldDislikes }
            : c
        ));
      }
    } catch (error) {
      console.error('处理评论反应失败:', error);
      setError('操作失败，请稍后再试');
      // 回滚状态
      setCommentReactions(prev => ({ ...prev, [comment_id]: currentReaction }));
      setComments(prev => prev.map(c =>
        c.comment_id === comment_id
          ? { ...c, likes_count: oldLikes, dislikes_count: oldDislikes }
          : c
      ));
    } finally {
      setReactionLoading(prev => ({ ...prev, [comment_id]: false }));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        评论 ({comments.length})
      </h3>

      {/* 错误提示 */}
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* 发表评论 */}
      {userProfile?.user_id ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的评论..."
            className="mb-3"
            rows={3}
          />
          <Button type="submit" variant="primary" size="sm">
            发表评论
          </Button>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            请先登录后再发表评论
          </p>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.comment_id} className="p-4">
            <div className="flex items-start space-x-3">
              {/* 用户头像 */}
              <div className="flex-shrink-0">
                <Image
                  src={commentUserProfiles[comment.user_id]?.avatar_url || '/default-avatar.svg'}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div>

              <div className="flex-1 min-w-0">
                {/* 用户信息 */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {commentUserProfiles[comment.user_id]?.username || '未知用户'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Lv.{commentUserProfiles[comment.user_id]?.level || 1}
                  </span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>

                {/* 评论内容 */}
                {editingCommentId === comment.comment_id ? (
                  <div className="mb-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="mb-2"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleUpdate(comment.comment_id)}
                        variant="primary"
                        size="sm"
                      >
                        保存
                      </Button>
                      <Button
                        onClick={() => setEditingCommentId(null)}
                        variant="ghost"
                        size="sm"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex items-center space-x-4">
                  {/* 点赞/点踩 */}
                  <button
                    onClick={() => handleReaction(comment.comment_id, 'like')}
                    disabled={reactionLoading[comment.comment_id]}
                    className={`flex items-center space-x-1 text-sm transition-all duration-200 ${
                      commentReactions[comment.comment_id] === 'like'
                        ? 'text-blue-600 dark:text-blue-400 scale-105'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:scale-105'
                    } ${reactionLoading[comment.comment_id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <i className="fas fa-thumbs-up"></i>
                    <span>点赞 ({comment.likes_count || 0})</span>
                  </button>

                  <button
                    onClick={() => handleReaction(comment.comment_id, 'dislike')}
                    disabled={reactionLoading[comment.comment_id]}
                    className={`flex items-center space-x-1 text-sm transition-all duration-200 ${
                      commentReactions[comment.comment_id] === 'dislike'
                        ? 'text-red-600 dark:text-red-400 scale-105'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:scale-105'
                    } ${reactionLoading[comment.comment_id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <i className="fas fa-thumbs-down"></i>
                    <span>点踩 ({comment.dislikes_count || 0})</span>
                  </button>

                  {/* 回复按钮 */}
                  <button
                    onClick={() => handleReply(comment.comment_id)}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    回复
                  </button>

                  {/* 编辑/删除按钮（仅评论作者可见） */}
                  {userProfile?.user_id === comment.user_id && (
                    <>
                      <button
                        onClick={() => handleEdit(comment)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(comment.comment_id)}
                        className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>

                {/* 回复表单 */}
                {replyingToId === comment.comment_id && (
                  <form onSubmit={handleSubmitReply} className="mt-3">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="写下你的回复..."
                      className="mb-2"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <Button type="submit" variant="primary" size="sm">
                        回复
                      </Button>
                      <Button
                        onClick={handleCancelReply}
                        variant="ghost"
                        size="sm"
                      >
                        取消
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          暂无评论，快来发表第一条评论吧！
        </div>
      )}
    </div>
  );
};

export default CommentSection;
