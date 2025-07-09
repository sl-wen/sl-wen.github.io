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

    // 检查是否正在处理该评论的反应
    if (isReacting[comment_id]) {
      return;
    }

    const comment = comments.find((c) => c.comment_id === comment_id);
    if (!comment) return;

    try {
      // 标记正在处理
      setIsReacting((prev) => ({ ...prev, [comment_id]: true }));

      // 保存当前状态以便回滚
      const previousReaction = commentReactions[comment_id];
      const previousComments = [...comments];

      // 计算新的反应状态
      const newReaction = previousReaction === type ? null : type;

      // 立即更新本地状态，提供即时反馈
      setCommentReactions((prev) => ({ ...prev, [comment_id]: newReaction }));

      // 更新评论列表中的点赞数
      setComments(
        comments.map((c) => {
          if (c.comment_id === comment_id) {
            const likesCount = c.likes_count || 0;
            const dislikesCount = c.dislikes_count || 0;

            if (newReaction === null) {
              // 取消反应
              return {
                ...c,
                likes_count: type === 'like' ? likesCount - 1 : likesCount,
                dislikes_count: type === 'dislike' ? dislikesCount - 1 : dislikesCount
              };
            } else if (previousReaction && previousReaction !== newReaction) {
              // 切换反应
              return {
                ...c,
                likes_count: type === 'like' ? likesCount + 1 : likesCount - 1,
                dislikes_count: type === 'dislike' ? dislikesCount + 1 : dislikesCount - 1
              };
            } else {
              // 新增反应
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

      // 发送请求到服务器
      const success = await addCommentReaction(
        comment_id,
        userProfile.user_id,
        type,
        comment.likes_count || 0,
        comment.dislikes_count || 0
      );

      if (!success) {
        // 如果服务器请求失败，回滚本地状态
        setCommentReactions((prev) => ({ ...prev, [comment_id]: previousReaction }));
        setComments(previousComments);
        setError('操作失败，请稍后重试');
      }
    } catch (error) {
      console.error('处理评论反应失败:', error);
      setError('操作失败，请稍后重试');
    } finally {
      // 取消标记
      setIsReacting((prev) => ({ ...prev, [comment_id]: false }));
    }
  };

  return (
    <div className="comment-section space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">评论</h3>
        <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
          {comments.filter(c => !c.parent_id).length} 条评论
        </span>
      </div>
      
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的评论..."
            required
            rows={4}
            fullWidth
            label="发表评论"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={!newComment.trim() || !userProfile?.user_id}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              }
            >
              发表评论
            </Button>
          </div>
        </form>
      </Card>

      <div className="comments-list">
        {comments
          .filter((comment) => !comment.parent_id)
          .map((comment) => (
            <div key={comment.comment_id} className="comment">
              <div className="comment-header">
                <div className="comment-user-info">
                  <img
                    src={commentUserProfiles[comment.user_id]?.avatar_url || ''}
                    alt="用户头像"
                    className="user-avatar"
                  />
                  <span className="username">
                    {commentUserProfiles[comment.user_id]?.username || '匿名用户'}
                  </span>
                  <span className="user-level">
                    Lv.{commentUserProfiles[comment.user_id]?.level || 1}
                  </span>
                </div>
                <time>{new Date(comment.created_at).toLocaleString()}</time>
              </div>

              {editingCommentId === comment.comment_id ? (
                <Card variant="filled" className="mt-3">
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
                      label="编辑评论"
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
                  <p className="comment-content">{comment.content}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={commentReactions[comment.comment_id] === 'like' ? 'success' : 'ghost'}
                        size="sm"
                        onClick={() => handleReaction(comment.comment_id, 'like')}
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

                  {replyingToId === comment.comment_id && (
                    <Card variant="outlined" className="mt-4">
                      <form onSubmit={handleSubmitReply} className="space-y-4">
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`回复 @${commentUserProfiles[comment.user_id]?.username || '匿名用户'}`}
                          required
                          rows={3}
                          fullWidth
                          label="回复评论"
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
                    </Card>
                  )}

                  <div className="replies-list">
                    {comments
                      .filter((reply) => reply.parent_id === comment.comment_id)
                      .map((reply) => (
                        <div key={reply.comment_id} className="reply">
                          <div className="comment-header">
                            <div className="comment-user-info">
                              <img
                                src={
                                  commentUserProfiles[reply.user_id]?.avatar_url ||
                                  ''
                                }
                                alt="用户头像"
                                className="user-avatar"
                              />
                              <span className="username">
                                {commentUserProfiles[reply.user_id]?.username || '匿名用户'}
                              </span>
                              <span className="user-level">
                                Lv.{commentUserProfiles[reply.user_id]?.level || 1}
                              </span>
                            </div>
                            <time>{new Date(reply.created_at).toLocaleString()}</time>
                          </div>
                          <p className="comment-content">{reply.content}</p>
                          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <Button
                                variant={commentReactions[reply.comment_id] === 'like' ? 'success' : 'ghost'}
                                size="sm"
                                onClick={() => handleReaction(reply.comment_id, 'like')}
                              >
                                👍 {reply.likes_count || 0}
                              </Button>
                              <Button
                                variant={commentReactions[reply.comment_id] === 'dislike' ? 'danger' : 'ghost'}
                                size="sm"
                                onClick={() => handleReaction(reply.comment_id, 'dislike')}
                              >
                                👎 {reply.dislikes_count || 0}
                              </Button>
                            </div>
                            {userProfile?.user_id === reply.user_id && (
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(reply)}>
                                  编辑
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(reply.comment_id)}>
                                  删除
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default CommentSection;
