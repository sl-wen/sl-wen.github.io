import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createArticle, renderMarkdown } from '../utils/articleService';
import { getCurrentSession } from '../utils/auth';
import StatusMessage from '../components/StatusMessage';
import '../styles/PostPage.css';

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
    const percentage =
      editorElement.scrollTop / (editorElement.scrollHeight - editorElement.clientHeight);
    previewElement.scrollTop =
      percentage * (previewElement.scrollHeight - previewElement.clientHeight);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    setFormData((prev) => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await getCurrentSession();
      const user = session?.user;
      if (!user) {
        throw new Error('请先登录');
      }

      const article = await createArticle({
        ...formData,
        author: user?.email || '',
        user_id: user?.id || '',
        views: 0,
        dislikes_count: 0
      });

      navigate(`/article/${article?.post_id}`);
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
          <form className="editor-form" onSubmit={handleSubmit}>
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
            <div className="formGroup">
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
            <div className="formGroup">
              <label htmlFor="tags">标签（用逗号分隔）</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
              />
            </div>
            <label htmlFor="content">内容（支持 Markdown）</label>
            <div className="editorPreviewContainer">
              <div className="editorSection">
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
              <div className="previewSection">
                <div
                  ref={previewRef}
                  className="previewContent markdownBody"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              </div>
            </div>
            <div className="buttonGroup">
              <button type="submit" className="primary-button" disabled={loading}>
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
