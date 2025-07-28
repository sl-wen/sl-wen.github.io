'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createArticle, renderMarkdown } from '@/utils/articleService';

interface PostFormData {
  title: string;
  author: string;
  content: string;
  tags: string[];
}

export default function PostPage() {
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    author: '',
    content: '',
    tags: []
  });
  const [preview, setPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<{
    user_id: string;
    username: string;
    email: string;
  } | null>(null);

  // 检查登录状态
  useEffect(() => {
    const data = localStorage.getItem('userProfile');
    setUserProfile(JSON.parse(data || '{}'));
  }, []);

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

  // 初始化表单数据
  useEffect(() => {
    if (userProfile?.username) {
      setFormData((prev) => ({
        ...prev,
        author: userProfile.username || ''
      }));
    }
  }, [userProfile]);

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
        user_id: userProfile ? userProfile.user_id || '' : ''
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <button
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 文章信息 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📝</span>
                文章信息
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">填写文章的基本信息</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  文章标题
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="输入一个吸引人的标题..."
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="author"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  作者
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="作者名"
                  readOnly
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  标签
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  placeholder="添加相关标签来帮助读者更好地发现你的文章"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  用逗号分隔，例如：技术,前端,React
                </p>
              </div>
            </div>
          </div>

          {/* 编辑器和预览区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
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
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-t-lg border border-b-0 border-gray-300 dark:border-gray-600">
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
                <textarea
                  id="content"
                  name="content"
                  ref={editorRef}
                  value={formData.content}
                  onChange={handleInputChange}
                  onScroll={handleEditorScroll}
                  className="flex-1 rounded-t-none font-mono text-sm resize-none border border-gray-300 dark:border-gray-600 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="# 开始你的创作吧！"
                  required
                  rows={15}
                />
              </div>

              {/* 预览区域 */}
              <div className="hidden md:flex flex-col">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-t-lg border border-b-0 border-gray-300 dark:border-gray-600">
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
                    __html:
                      preview ||
                      '<div class="text-center text-gray-400 italic py-8"><p>✨ 预览内容将在这里显示</p><p class="text-xs mt-2">开始在左侧编辑器中输入内容...</p></div>'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  准备发布？
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  检查内容无误后点击发布按钮
                </p>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {loading ? '发布中...' : '发布文章'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
