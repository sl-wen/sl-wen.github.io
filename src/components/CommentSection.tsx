import React, { useState, useEffect } from 'react';
import { Comment, getComments, addComment, updateComment, deleteComment } from '../utils/commentService';
import { addCommentReaction, getCommentReaction } from '../utils/reactionService';
import { getUserProfile } from '../utils/supabase-config';
import '../styles/CommentSection.css';

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
  const [userProfile, setUserProfile] = useState<{ user_id: string, username: string, email: string } | null>(null);
  const [commentUserProfiles, setCommentUserProfiles] = useState<{ [key: string]: UserProfile | null }>({});
  const [commentReactions, setCommentReactions] = useState<{ [key: string]: 'like' | 'dislike' | null }>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    const data = localStorage.getItem('userProfile');
    setUserProfile(JSON.parse(data || '{}'));
    loadComments();
  }, [post_id]);

  useEffect(() => {
    const loadUserProfiles = async () => {
      const profiles: { [key: string]: UserProfile | null } = {};
      for (const comment of comments) {
        if (!commentUserProfiles[comment.user_id]) {
          const profile = await getUserProfile(comment.user_id);
          profiles[comment.user_id] = profile;
        }
      }
      setCommentUserProfiles(prev => ({ ...prev, ...profiles }));
    };
    loadUserProfiles();
  }, [comments, commentUserProfiles]);

  useEffect(() => {
    if (userProfile?.user_id && comments.length > 0) {
      loadCommentReactions();
    }
  }, [userProfile?.user_id, comments]);

  const loadCommentReactions = async () => {
    const reactions: { [key: string]: 'like' | 'dislike' | null } = {};
    for (const comment of comments) {
      if (userProfile?.user_id) {
        const reaction = await getCommentReaction(comment.comment_id, userProfile.user_id);
        reactions[comment.comment_id] = reaction;
      }
    }
    setCommentReactions(reactions);
  };

  const loadComments = async () => {
    const commentsData = await getComments(post_id);
    setComments(commentsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
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
        dislikes_count: 0,
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
      setComments(comments.map(c =>
        c.comment_id === comment_id ? updatedComment : c
      ));
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
        setComments(comments.filter(c => c.comment_id !== comment_id));
      } else {
        setError('删除评论失败');
      }
    }
  };

  const handleReply = (comment_id: string) => {
    if (!userProfile) {
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
    if (!userProfile) {
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

  const handleReaction = async (comment_id: string, type: 'like' | 'dislike') => {
    if (!userProfile?.user_id) {
      setError('请先登录后再操作');
      return;
    }

    const comment = comments.find(c => c.comment_id === comment_id);
    if (!comment) return;

    const success = await addCommentReaction(
      comment_id,
      userProfile.user_id,
      type,
      comment.likes_count || 0,
      comment.dislikes_count || 0
    );

    if (success) {
      // 更新本地状态
      const newReaction = commentReactions[comment_id] === type ? null : type;
      setCommentReactions({ ...commentReactions, [comment_id]: newReaction });

      // 更新评论列表中的点赞数
      setComments(comments.map(c => {
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
          } else if (commentReactions[comment_id] && commentReactions[comment_id] !== newReaction) {
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
      }));
    } else {
      setError('操作失败，请稍后重试');
    }
  };

  return (
    <div className="comment-section">
      <h3>评论</h3>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="写下你的评论..."
          required
        />
        <button type="submit">发表评论</button>
      </form>

      <ul className="comments-list">
        {comments.filter(comment => !comment.parent_id).map(comment => (
          <li key={comment.comment_id} className="comment">
            <div className="comment-header">
              <div className="comment-user-info">
                <img
                  src={commentUserProfiles[comment.user_id]?.avatar_url || 'default-avatar.png'}
                  alt="用户头像"
                  className="user-avatar"
                />
                <span className="username">{commentUserProfiles[comment.user_id]?.username || '匿名用户'}</span>
                <span className="user-level">Lv.{commentUserProfiles[comment.user_id]?.level || 1}</span>
              </div>
              <time>{new Date(comment.created_at).toLocaleString()}</time>
            </div>
            
            {editingCommentId === comment.comment_id ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(comment.comment_id);
              }}>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  required
                />
                <div className="edit-buttons">
                  <button type="button" onClick={() => setEditingCommentId(null)}>取消</button>
                  <button type="submit">保存</button>
                </div>
              </form>
            ) : (
              <>
                <p className="comment-content">{comment.content}</p>
                <div className="comment-actions">
                  <div className="comment-actions-left">
                    <button
                      className={`like-button ${commentReactions[comment.comment_id] === 'like' ? 'active' : ''}`}
                      onClick={() => handleReaction(comment.comment_id, 'like')}
                    >
                      👍 {comment.likes_count || 0}
                    </button>
                    <button
                      className={`dislike-button ${commentReactions[comment.comment_id] === 'dislike' ? 'active' : ''}`}
                      onClick={() => handleReaction(comment.comment_id, 'dislike')}
                    >
                      👎 {comment.dislikes_count || 0}
                    </button>
                    <button
                      className="reply-button"
                      onClick={() => handleReply(comment.comment_id)}
                    >
                      回复
                    </button>
                  </div>
                  {userProfile?.user_id === comment.user_id && (
                    <div className="comment-actions-right">
                      <button className="edit-button" onClick={() => handleEdit(comment)}>编辑</button>
                      <button className="delete-button" onClick={() => handleDelete(comment.comment_id)}>删除</button>
                    </div>
                  )}
                </div>

                {replyingToId === comment.comment_id && (
                  <form onSubmit={handleSubmitReply} className="reply-form">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`回复 @${commentUserProfiles[comment.user_id]?.username || '匿名用户'}`}
                      required
                    />
                    <div className="reply-buttons">
                      <button type="button" onClick={handleCancelReply}>取消</button>
                      <button type="submit">发表回复</button>
                    </div>
                  </form>
                )}

                <div className="replies-list">
                  {comments
                    .filter(reply => reply.parent_id === comment.comment_id)
                    .map(reply => (
                      <div key={reply.comment_id} className="reply">
                        <div className="comment-header">
                          <div className="comment-user-info">
                            <img
                              src={commentUserProfiles[reply.user_id]?.avatar_url || 'default-avatar.png'}
                              alt="用户头像"
                              className="user-avatar"
                            />
                            <span className="username">{commentUserProfiles[reply.user_id]?.username || '匿名用户'}</span>
                            <span className="user-level">Lv.{commentUserProfiles[reply.user_id]?.level || 1}</span>
                          </div>
                          <time>{new Date(reply.created_at).toLocaleString()}</time>
                        </div>
                        <p className="comment-content">{reply.content}</p>
                        <div className="comment-actions">
                          <div className="reaction-buttons">
                            <button
                              className={`like-button ${commentReactions[reply.comment_id] === 'like' ? 'active' : ''}`}
                              onClick={() => handleReaction(reply.comment_id, 'like')}
                            >
                              👍 {reply.likes_count || 0}
                            </button>
                            <button
                              className={`dislike-button ${commentReactions[reply.comment_id] === 'dislike' ? 'active' : ''}`}
                              onClick={() => handleReaction(reply.comment_id, 'dislike')}
                            >
                              👎 {reply.dislikes_count || 0}
                            </button>
                          </div>
                          {userProfile?.user_id === reply.user_id && (
                            <div className="edit-delete-buttons">
                              <button onClick={() => handleEdit(reply)}>编辑</button>
                              <button onClick={() => handleDelete(reply.comment_id)}>删除</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommentSection;