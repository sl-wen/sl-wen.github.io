import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createArticle,renderMarkdown} from '../utils/articleService';
import { supabase } from '../utils/supabase-config';
import StatusMessage from '../components/StatusMessage';
import '../styles/post.css';

interface PostFormData {
  title: string;
  content: string;
  tags: string[];
}

const PostPage: React.FC = () => {
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    tags: []
  });
  const [preview, setPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 实时预览功能
  useEffect(() => {
    const updatePreview = async () => {
      if (formData.content) {
        const rendered = await renderMarkdown(formData.content);
        setPreview(rendered);
      } else {
        setPreview('');
      }
    };
    updatePreview();
  }, [formData.content]);

  // 同步滚动功能
  const handleEditorScroll = () => {
    if (!editorRef.current || !previewRef.current) return;
    
    const editorElement = editorRef.current;
    const previewElement = previewRef.current;
    const percentage = editorElement.scrollTop / (editorElement.scrollHeight - editorElement.clientHeight);
    previewElement.scrollTop = percentage * (previewElement.scrollHeight - previewElement.clientHeight);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = supabase.auth.getUser();
      if (!user) {
        throw new Error('请先登录');
      }

      const article = await createArticle({
        title: formData.title,
        author: (await user).data.user?.email || 'unknown',
        views: 0,
        dislikes_count: 0,
        content: formData.content,
        tags: formData.tags,
        user_id: (await user).data.user?.id || ''
      });

      if (article) {
        navigate(`/article/${article.post_id}`);
      } else {
        throw new Error('创建文章失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布文章时出错');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page editor-page">
      <div className="container">
        <div className="editor-container">
          <h2>发布文章</h2>
          {error && <StatusMessage message={error} />}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">标题</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">分类</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.tags}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="tags">标签（用逗号分隔）</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
              />
            </div>
            <div className="editor-preview-container">
              <div className="editor-section">
                <label htmlFor="content">内容（支持 Markdown）</label>
                <textarea
                  id="content"
                  name="content"
                  ref={editorRef}
                  value={formData.content}
                  onChange={handleInputChange}
                  onScroll={handleEditorScroll}
                  required
                />
              </div>
              <div className="preview-section">
                <div
                  ref={previewRef}
                  className="preview-content"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              </div>
            </div>
            <div className="button-group">
              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? '发布中...' : '发布文章'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostPage;