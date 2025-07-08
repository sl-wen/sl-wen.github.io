'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createArticle, renderMarkdown } from '../utils/articleService';
import { Input, Textarea, Button, Card, Alert } from '../components/ui';

interface PostFormData {
  title: string;
  author: string;
  content: string;
  tags: string[];
}

const PostPage: React.FC = () => {
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    author: '',
    content: '',
    tags: []
  });
  const [preview, setPreview] = useState('');
  const [userProfile, setUserProfile] = useState<{
    user_id: string;
    username: string;
    email: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
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

  useEffect(() => {
    try {
      const userProfileStr = localStorage.getItem('userProfile');
      if(userProfileStr){
        setUserProfile(JSON.parse(userProfileStr));
      }
      if (!userProfile?.user_id) {
        throw new Error('请先登录');
      }
      setFormData({
        title: '',
        author: userProfile.username || '',
        content: '',
        tags: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布文章时出错');
    } finally {
      setLoading(false);
    }
  }, []);

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
      const article = await createArticle({
        ...formData,
        author: userProfile ? userProfile.username || '' : '',
        user_id: userProfile ? userProfile.user_id || '' : '',
        views: 0,
        dislikes_count: 0
      });

      router.push(`/article/${article?.post_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布文章时出错');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">发布文章</h2>
          <p className="text-gray-600 dark:text-gray-400">支持 Markdown 语法，实时预览效果</p>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)} className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 文章信息 */}
          <Card hoverable>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📝</span>
                文章信息
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">填写文章的基本信息</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="文章标题"
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="输入一个吸引人的标题..."
                required
                fullWidth
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
              />

              <Input
                label="作者"
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="作者姓名"
                required
                fullWidth
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />

              <div className="md:col-span-2">
                <Input
                  label="标签"
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  placeholder="添加相关标签来帮助读者更好地发现你的文章"
                  fullWidth
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  }
                  helperText="用逗号分隔，例如：技术,前端,React"
                />
                {formData.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 编辑器和预览区域 */}
          <Card hoverable>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <span>✍️</span>
                文章内容
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                支持 Markdown 语法，左侧编辑右侧实时预览 <span className="text-red-500">*</span>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
              {/* 编辑器区域 */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-t-lg border border-b-0 border-gray-300 dark:border-gray-600">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span>📝</span>
                    编辑器
                  </span>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>支持 Markdown</span>
                    <span>|</span>
                    <span>实时同步</span> 
                  </div>
                </div>
                <Textarea
                  id="content"
                  name="content"
                  ref={editorRef}
                  value={formData.content}
                  onChange={handleInputChange}
                  onScroll={handleEditorScroll}
                  className="flex-1 rounded-t-none font-mono text-sm resize-none border-t-0"
                  placeholder="# 开始你的创作吧！ 
                  required
                  rows={15}
                />
              </div>

              {/* 预览区域 */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-t-lg border border-b-0 border-gray-300 dark:border-gray-600">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span>👁️</span>
                    实时预览
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>同步中</span>
                  </div>
                </div>
                <div
                  ref={previewRef}
                  className="flex-1 w-full p-6 border border-gray-300 dark:border-gray-600 rounded-t-none rounded-b-lg bg-white dark:bg-gray-800 overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: preview || '<div class="text-center text-gray-400 italic py-8"><p>✨ 预览内容将在这里显示</p><p class="text-xs mt-2">开始在左侧编辑器中输入内容...</p></div>' 
                  }}
                />
              </div>
            </div>
          </Card>

          {/* 提交按钮 */}
          <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">准备发布？</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">检查内容无误后点击发布按钮</p>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => router.back()}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  }
                  className="flex-1 sm:flex-none"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  isLoading={loading}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  }
                  className="flex-1 sm:flex-none"
                >
                  {loading ? '发布中...' : '发布文章'}
                </Button>
              </div>
            </div>
            
            {/* 发布提示 */}
            <Alert variant="info" className="mt-4">
              <div>
                <p className="font-medium mb-1">发布小贴士：</p>
                <ul className="space-y-1 text-xs">
                  <li>• 确保标题简洁明了，能够吸引读者</li>
                  <li>• 检查文章内容格式是否正确</li>
                  <li>• 添加合适的标签有助于文章被发现</li>
                  <li>• 发布后可以随时编辑修改</li>
                </ul>
              </div>
            </Alert>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default PostPage;
