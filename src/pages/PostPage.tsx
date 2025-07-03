'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createArticle, renderMarkdown } from '../utils/articleService';
import StatusMessage from '../components/StatusMessage';

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

        {error && <StatusMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 文章信息 */}
          <div className="card hover-lift p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📝</span>
                文章信息
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">填写文章的基本信息</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  文章标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="输入一个吸引人的标题..."
                  required
                />
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  作者 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="作者姓名"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  标签 <span className="text-gray-500 text-xs">(用逗号分隔，例如：技术,前端,React)</span>
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  className="form-input"
                  placeholder="添加相关标签来帮助读者更好地发现你的文章"
                />
                {formData.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="badge badge-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 编辑器和预览区域 */}
          <div className="card hover-lift p-6">
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
                <textarea
                  id="content"
                  name="content"
                  ref={editorRef}
                  value={formData.content}
                  onChange={handleInputChange}
                  onScroll={handleEditorScroll}
                  className="form-textarea flex-1 rounded-t-none font-mono text-sm resize-none"
                  placeholder="# 开始你的创作吧！

## 这里是一些 Markdown 语法示例：

**粗体文本** 和 *斜体文本*

### 列表：
- 无序列表项
- 另一个列表项

### 有序列表：
1. 第一项
2. 第二项

### 代码块：
```javascript
console.log('Hello World!');
```

### 链接：
[链接文本](https://example.com)

### 引用：
> 这是一个引用

---

现在开始写你的精彩内容吧！✨"
                  required
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
          </div>

          {/* 提交按钮 */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">准备发布？</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">检查内容无误后点击发布按钮</p>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn-secondary px-6 py-3 text-base font-medium touch-feedback flex-1 sm:flex-none"
                >
                  <span className="mr-2">←</span>
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="btn-primary px-8 py-3 text-base font-medium touch-feedback flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      发布中...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">🚀</span>
                      发布文章
                    </div>
                  )}
                </button>
              </div>
            </div>
            
            {/* 发布提示 */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">💡</span>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">发布小贴士：</p>
                  <ul className="space-y-1 text-xs">
                    <li>• 确保标题简洁明了，能够吸引读者</li>
                    <li>• 检查文章内容格式是否正确</li>
                    <li>• 添加合适的标签有助于文章被发现</li>
                    <li>• 发布后可以随时编辑修改</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostPage;
