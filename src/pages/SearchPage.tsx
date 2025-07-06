'use client';

import React, { useEffect, useState, useMemo, ChangeEvent } from 'react';
import Link from 'next/link';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { getArticles } from '../utils/articleService';
import { Input, Card } from '../components/ui';

interface Post {
  post_id: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  created_at: string;
}

interface CodeBlock {
  language: string;
  code: string;
}

// 辅助函数，和你原版基本一致
function extractTextFromMarkdown(markdown: string) {
  if (!markdown) return { text: '', codeBlocks: [] as CodeBlock[] };

  // 提取代码块并保存
  const codeBlocks: CodeBlock[] = [];
  const withoutCodeBlocks = markdown.replace(/```([^\n]*)[\s\S]*?```/g, (match, lang) => {
    codeBlocks.push({
      language: lang.trim(),
      code: match.slice(3 + lang.length, -3).trim()
    });
    return '';
  });

  // 行内代码
  const withoutInlineCode = withoutCodeBlocks.replace(/`([^`]+)`/g, (match, code) => {
    codeBlocks.push({
      language: 'inline',
      code: code.trim()
    });
    return '';
  });

  // 剩余文本处理
  const text = withoutInlineCode
    .replace(/!$.*?$$.*?$/g, '')
    .replace(/$([^$]+)\]$.*?$/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(\*|_)(.+?)\1/g, '$2')
    .replace(/^\s*>\s*/gm, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  return { text, codeBlocks };
}

// 高亮关键词 (返回安全 HTML 字符串)
function highlightKeyword(html: string, keyword: string) {
  if (!keyword) return html;
  const safeKey = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${safeKey})`, 'gi');
  return html.replace(regex, `<span class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</span>`);
}

const SearchPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始获取所有文章
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getArticles(1, 1000); // 获取所有文章
        setPosts(data);
      } catch (err) {
        setError('加载文章失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // 用 useMemo 优化过滤
  const results = useMemo(() => {
    if (!keyword.trim()) return [];
    const lowerKey = keyword.toLowerCase();
    return posts.filter((post) => {
      const titleMatch = post.title && post.title.toLowerCase().includes(lowerKey);
      const { text: contentText, codeBlocks } = extractTextFromMarkdown(post.content);
      const contentMatch = contentText && contentText.toLowerCase().includes(lowerKey);
      const codeMatch = codeBlocks.some(
        (block) =>
          block.code.toLowerCase().includes(lowerKey) ||
          block.language.toLowerCase().includes(lowerKey)
      );
      const authorMatch = post.author && post.author.toLowerCase().includes(lowerKey);
      const tagsMatch = post.tags && post.tags.some((tag) => tag.toLowerCase().includes(lowerKey));
      return titleMatch || contentMatch || codeMatch || authorMatch || tagsMatch;
    });
  }, [keyword, posts]);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 搜索标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            文章搜索
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            搜索文章标题、内容、代码和标签
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4"></div>
        </div>

        {/* 搜索输入框 */}
        <Card className="p-6 mb-8" hoverable>
          <Input
            id="search-input"
            type="text"
            value={keyword}
            onChange={handleInput}
            placeholder="请输入搜索关键词（支持搜索标题、内容、代码和标签）..."
            inputSize="lg"
            fullWidth
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            className="text-lg"
          />
          
          {/* 搜索统计和提示 */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {keyword && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                找到 <span className="font-semibold text-blue-600 dark:text-blue-400 text-lg">{results.length}</span> 个相关结果
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                <span>📝</span>
                标题
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                <span>📄</span>
                内容
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                <span>💻</span>
                代码
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                <span>🏷️</span>
                标签
              </span>
            </div>
          </div>
        </Card>

        {/* 搜索结果 */}
        <div className="space-y-6">
          {/* 加载状态 */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <div className="text-gray-600 dark:text-gray-400">加载文章中...</div>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-20">⚠️</div>
              <div className="text-red-600 dark:text-red-400">加载失败：{error}</div>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !error && !keyword && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 opacity-20">🔍</div>
              <div className="text-gray-500 dark:text-gray-400 text-lg">请输入搜索关键词</div>
              <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">支持搜索标题、内容、代码和标签</div>
            </div>
          )}

          {/* 无结果状态 */}
          {!loading && !error && keyword && results.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 opacity-20">😔</div>
              <div className="text-gray-500 dark:text-gray-400 text-lg">没有找到相关文章</div>
              <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                尝试使用不同的关键词或检查拼写
              </div>
            </div>
          )}

          {/* 搜索结果列表 */}
          {!loading && !error && results.length > 0 && (
            <div className="space-y-6">
              {results.map((post) => {
                // 预处理文案和代码高亮
                const { text: contentText, codeBlocks } = extractTextFromMarkdown(post.content);
                const matchingCodeBlock = codeBlocks.find(
                  (block) =>
                    block.code.toLowerCase().includes(keyword.toLowerCase()) ||
                    block.language.toLowerCase().includes(keyword.toLowerCase())
                );

                return (
                  <article key={post.post_id} className="card hover:shadow-lg transition-shadow duration-200">
                    {/* 文章标题 */}
                    <h2 className="text-xl md:text-2xl font-bold mb-4">
                      <Link
                        href={`/article/${post.post_id}`}
                        className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                        dangerouslySetInnerHTML={{
                          __html: highlightKeyword(DOMPurify.sanitize(post.title), keyword)
                        }}
                      />
                    </h2>

                    {/* 文章预览 */}
                    <div className="mb-4">
                      {matchingCodeBlock ? (
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            代码匹配 - {matchingCodeBlock.language}
                          </div>
                          <pre className="text-sm">
                            <code
                              className={
                                matchingCodeBlock.language !== 'inline'
                                  ? `language-${matchingCodeBlock.language}`
                                  : undefined
                              }
                              dangerouslySetInnerHTML={{
                                __html: highlightKeyword(
                                  DOMPurify.sanitize(
                                    matchingCodeBlock.code.substring(0, 200) +
                                      (matchingCodeBlock.code.length > 200 ? '...' : '')
                                  ),
                                  keyword
                                )
                              }}
                            />
                          </pre>
                        </div>
                      ) : (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none line-clamp-3"
                          dangerouslySetInnerHTML={{
                            __html: highlightKeyword(
                              DOMPurify.sanitize(
                                marked.parse(
                                  post.content.substring(0, 300) +
                                    (post.content.length > 300 ? '...' : ''),
                                  { async: false }
                                ) as string
                              ),
                              keyword
                            )
                          }}
                        />
                      )}
                    </div>

                    {/* 文章元信息 */}
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {/* 作者 */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">✍️</span>
                        <span
                          className="text-sm text-gray-600 dark:text-gray-400"
                          dangerouslySetInnerHTML={{
                            __html: highlightKeyword(DOMPurify.sanitize(post.author || '匿名'), keyword)
                          }}
                        />
                      </div>

                      {/* 发布时间 */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">📅</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* 标签 */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-500 dark:text-gray-400">🏷️</span>
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              dangerouslySetInnerHTML={{
                                __html: highlightKeyword(DOMPurify.sanitize(tag), keyword)
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
