'use client';

import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getArticleById,
  updateArticle,
  deleteArticle,
  renderMarkdown
} from '@/utils/articleService';

interface Post {
  post_id: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
}

interface PostFormData {
  title: string;
  author: string;
  content: string;
  tags: string[];
}

// 安全的 marked 解析
function safeMarked(content: string): string {
  if (!content || typeof content !== 'string') return '';
  try {
    return marked.parse(content, { async: false }) as string;
  } catch (e) {
    console.error('Markdown 解析错误:', e);
    return '内容解析错误';
  }
}

// 自定义图片渲染器与 marked 配置
const renderer = new marked.Renderer();
renderer.image = function ({
  href,
  title,
  text
}: {
  href: string | null;
  title: string | null;
  text: string;
}) {
  if (!href || typeof href === 'object') {
    href = '';
  }
  href = String(href || '').trim();
  title = String(title || '').trim();
  text = String(text || '').trim();
  if (!href)
    return `<img src="https://gss0.bdstatic.com/6LZ1dD3d1sgCo2Kml5_Y_D3/sys/portrait/item/tb.1.7e293cdd.cfUL8Z5IOqpEDaQ0zOUSZg" alt="${text}" title="${title}">`;
  return `<img src="${href}" alt="${text}" title="${title}" onError="this.src='https://gss0.bdstatic.com/6LZ1dD3d1sgCo2Kml5_Y_D3/sys/portrait/item/tb.1.7e293cdd.cfUL8Z5IOqpEDaQ0zOUSZg'">`;
};

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
  async: false
});

export default function EditArticlePage() {
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    author: '',
    content: '',
    tags: []
  });
  const params = useParams();
  const post_id = params?.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [newpost, setnewPost] = useState<Post | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // 加载文章
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getArticleById(post_id || '');
        if (!data) {
          setError('文章不存在');
          setMessage({ type: 'error', text: '文章不存在' });
          return;
        }
        setPost(data);
        setFormData({
          title: data?.title || '',
          author: data?.author || '',
          content: data?.content || '',
          tags: data?.tags || []
        });
      } catch (err) {
        setError('加载文章失败，请稍后重试');
        setMessage({ type: 'error', text: '加载文章失败，请稍后重试' });
        return;
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [post_id]);

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
    setnewPost({
      post_id: post?.post_id || '',
      title: formData?.title || '',
      author: formData?.author || '',
      content: formData?.content || '',
      tags: formData?.tags || []
    });
  }, [formData, post?.post_id]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (post?.post_id && newpost) {
      try {
        setLoading(true);
        await updateArticle(post.post_id, newpost);
        setMessage({ type: 'success', text: '文章更新成功' });
        setTimeout(() => {
          router.push(`/article/${post.post_id}`);
        }, 1000);
      } catch (error) {
        setMessage({ type: 'error', text: '更新文章失败' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      try {
        setLoading(true);
        if (post?.post_id) {
          await deleteArticle(post.post_id);
        }
        router.push('/');
      } catch (error) {
        setMessage({ type: 'error', text: '删除文章失败' });
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
            : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
            }`}>
            {message.text}
          </div>
        )}

        {post && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">编辑文章</h1>
                  <p className="text-gray-600 dark:text-gray-400">修改文章内容并实时预览</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 基本信息 */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      文章标题
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="请输入文章标题..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      作者
                    </label>
                    <input
                      type="text"
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      required
                      placeholder="请输入作者名称..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    标签
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags.join(', ')}
                    onChange={handleTagsChange}
                    placeholder="用逗号分隔多个标签，如：技术, React, JavaScript"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">用逗号分隔多个标签</p>
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

              {/* 编辑器区域 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  文章内容（支持 Markdown）
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  {/* 工具栏 */}
                  <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          编辑器
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          实时预览
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        支持 Markdown 语法
                      </div>
                    </div>
                  </div>

                  {/* 编辑器和预览区域 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 h-96">
                    {/* 编辑区 */}
                    <div className="border-r border-gray-200 dark:border-gray-700 h-full flex flex-col min-h-0">
                      <textarea
                        id="content"
                        name="content"
                        ref={editorRef}
                        value={formData.content}
                        onChange={handleInputChange}
                        onScroll={handleEditorScroll}
                        required
                        className="w-full h-full border-0 resize-none focus:ring-0 focus:outline-none font-mono text-sm rounded-none overflow-y-auto p-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="开始编写你的文章内容..."
                      />
                    </div>
                    {/* 预览区 */}
                    <div className="bg-gray-50 dark:bg-gray-900 h-full flex flex-col min-h-0 hidden lg:block">
                      <div
                        ref={previewRef}
                        className="h-full p-4 overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: preview }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  保存修改
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  删除文章
                </button>

                <Link href={`/article/${post?.post_id}`}>
                  <button
                    type="button"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    取消编辑
                  </button>
                </Link>
              </div>

              {/* 编辑提示 */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div>
                  <p className="font-medium mb-1 text-blue-800 dark:text-blue-300">编辑小贴士：</p>
                  <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                    <li>• 支持完整的 Markdown 语法，包括代码块、表格、链接等</li>
                    <li>• 左侧编辑区域会与右侧预览区域同步滚动</li>
                    <li>• 修改后记得点击"保存修改"按钮</li>
                  </ul>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 