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
} from '../utils/articleService';
import { Input, Textarea, Button, Card, Alert } from '../components/ui';


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

// 逐行打标记（略简化，为例子清晰）
function renderPreviewByLine(text: string) {
  const lines = text.split('\n');
  let inCodeBlock = false;
  const markedLines = lines.map((line, idx) => {
    if (line.trim().startsWith('```')) inCodeBlock = !inCodeBlock;
    // 这里只在非代码区域插入锚点
    if (!inCodeBlock) return line + `\n<!--SAFE_LINE_ANCHOR_${idx}-->`;
    return line;
  });
  const html = safeMarked(markedLines.join('\n'));
  // 将自定义锚点换为 span
  return html.replace(
    /<!--SAFE_LINE_ANCHOR_(\d+)-->/g,
    (_m, n) => `<span class="md-line-anchor" data-line="${n}" id="line-anchor-${n}"></span>`
  );
}

// 自定义图片渲染器与 marked 配置同原版
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
  // 若 href 为对象等异常情况
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

const EditArticlePage: React.FC = () => {
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
        const data = await getArticleById(post_id || ''); // 获取文章
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
  }, [post?.post_id]);

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
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(name, value);
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

  // 编辑器滚动同步（极简示例，详细功能需自定义ref和scroll滚动算法）
  const syncPreviewToCursor = () => {
    if (!editorRef.current || !previewRef.current) return;
    // 获取当前行
    const { selectionStart } = editorRef.current;
    const value = editorRef.current.value;
    const lines = value.slice(0, selectionStart).split('\n');
    const curLineNum = lines.length - 1;
    // 查找预览区锚点
    const anchor = previewRef.current.querySelector(
      `#line-anchor-${curLineNum}`
    ) as HTMLElement | null;
    if (anchor) {
      previewRef.current.scrollTo({ top: anchor.offsetTop - 40, behavior: 'smooth' });
    }
  };

  // 编辑区每次 input、click、键盘导航后同步预览滚动
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const onInput = () => {
      syncPreviewToCursor();
    };
    editor.addEventListener('input', onInput);
    editor.addEventListener('click', onInput);
    // 导航键同步
    editor.addEventListener('keyup', (e) => {
      const navKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'PageUp',
        'PageDown'
      ];
      if (navKeys.includes((e as KeyboardEvent).key)) {
        syncPreviewToCursor();
      }
    });
    return () => {
      editor.removeEventListener('input', onInput);
      editor.removeEventListener('click', onInput);
    };
  }, []);

  // 主渲染
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">加载中...</span>
          </div>
        )}

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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (post?.post_id && newpost) {
                  updateArticle(post.post_id, newpost);
                }
                router.push(`/article/${post?.post_id}`);
              }}
              className="p-6 space-y-6"
            >
              {/* 基本信息 */}
              <Card variant="filled">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="文章标题"
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    fullWidth
                    placeholder="请输入文章标题..."
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
                    required
                    fullWidth
                    placeholder="请输入作者名称..."
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  />
                </div>

                <div className="mt-6">
                  <Input
                    label="标签"
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags.join(', ')}
                    onChange={handleTagsChange}
                    fullWidth
                    placeholder="用逗号分隔多个标签，如：技术, React, JavaScript"
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    }
                    helperText="用逗号分隔多个标签"
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
              </Card>

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
                    {/* 编辑区：始终显示 */}
                    <div className="border-r border-gray-200 dark:border-gray-700 h-full flex flex-col min-h-0">
                      <Textarea
                        id="content"
                        name="content"
                        ref={editorRef}
                        value={formData.content}
                        onChange={handleInputChange}
                        onScroll={handleEditorScroll}
                        required
                        className="w-full h-full border-0 resize-none focus:ring-0 focus:border-0 font-mono text-sm rounded-none overflow-y-auto"
                        placeholder="开始编写你的文章内容..."
                        style={{ minHeight: 0 }}
                      />
                    </div>
                    {/* 预览区：仅lg及以上显示，手机端（sm/md）隐藏 */}
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
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  isLoading={loading}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                  className="flex-1 sm:flex-none"
                >
                  保存修改
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  size="lg"
                  onClick={async () => {
                    if (confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
                      await deleteArticle(post?.post_id);
                      router.push('/');
                      window.location.reload();
                    }
                  }}
                  disabled={loading}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                >
                  删除文章
                </Button>

                <Link href={`/article/${post?.post_id}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    disabled={loading}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                    className="w-full sm:w-auto"
                  >
                    取消编辑
                  </Button>
                </Link>
              </div>

              {/* 编辑提示 */}
              <Alert variant="info">
                <div>
                  <p className="font-medium mb-1">编辑小贴士：</p>
                  <ul className="space-y-1 text-xs">
                    <li>• 支持完整的 Markdown 语法，包括代码块、表格、链接等</li>
                    <li>• 左侧编辑区域会与右侧预览区域同步滚动</li>
                    <li>• 修改后记得点击"保存修改"按钮</li>
                  </ul>
                </div>
              </Alert>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditArticlePage;
