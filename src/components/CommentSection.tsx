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
          rows={4}
        />
        <button type="submit" disabled={!userProfile}>发表评论</button>
      </form>

      <div className="comments-list">
        {comments.map(comment => (
          <div key={comment.comment_id} className="comment">
            <div className="comment-header">
              <div className="comment-user-info">
                {commentUserProfiles[comment.user_id]?.avatar_url && (
                  <img
                    src={commentUserProfiles[comment.user_id]?.avatar_url}
                    alt="用户头像"
                    className="user-avatar"
                  />
                )}
                <span className="comment-author">{commentUserProfiles[comment.user_id]?.username || '匿名用户'}</span>
                {commentUserProfiles[comment.user_id]?.level && (
                  <span className="user-level">Lv.{commentUserProfiles[comment.user_id]?.level}</span>
                )}
              </div>
              <span className="comment-date">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
            <div className="comment-content">{comment.content}</div>
            <div className="comment-actions">
              <button
                className={`reaction-button ${commentReactions[comment.comment_id] === 'like' ? 'active' : ''}`}
                onClick={() => handleReaction(comment.comment_id, 'like')}
                title="点赞"
              >
                <i className="fas fa-thumbs-up"></i>
                <span>{comment.likes_count || 0}</span>
              </button>
              <button
                className={`reaction-button ${commentReactions[comment.comment_id] === 'dislike' ? 'active' : ''}`}
                onClick={() => handleReaction(comment.comment_id, 'dislike')}
                title="点踩"
              >
                <i className="fas fa-thumbs-down"></i>
                <span>{comment.dislikes_count || 0}</span>
              </button>
              {userProfile?.user_id === comment.user_id && (
                <>
                  <button onClick={() => handleEdit(comment)} className="edit-button">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button onClick={() => handleDelete(comment.comment_id)} className="delete-button">
                    <i className="fas fa-trash"></i>
                  </button>
                </>
              )}
            </div>

            {editingCommentId === comment.comment_id ? (
              <div className="edit-comment">

                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                />
                <div className="edit-actions">
                  <button onClick={() => handleUpdate(comment.comment_id)}>
                    保存
                  </button>
                  <button onClick={() => setEditingCommentId(null)}>
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                {userProfile && userProfile.user_id === comment.user_id && (
                  <div className="comment-actions">
                    <button onClick={() => handleEdit(comment)}>
                      编辑
                    </button>
                    <button onClick={() => handleDelete(comment.comment_id)}>
                      删除
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;