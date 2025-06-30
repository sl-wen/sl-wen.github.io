import React, { useState, useEffect } from 'react';
import { Comment, getComments, addComment, updateComment, deleteComment } from '../utils/commentService';
import '../styles/CommentSection.css';

interface CommentSectionProps {
  post_id: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ post_id }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{user_id: string, username: string, email: string} | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('userProfile');
    setUserProfile(JSON.parse(data || '{}'));
    loadComments();
  }, [post_id]);

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
              <span className="comment-author">{comment.user_id}</span>
              <span className="comment-date">
                {new Date(comment.created_at).toLocaleString()}
              </span>
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
                <div className="comment-content">{comment.content}</div>
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