'use client';

import React, { useEffect, useState, useMemo, ChangeEvent } from 'react';
import Link from 'next/link';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { getArticles } from '@/utils/articleService';

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

// 辅助函数：从 markdown 提取纯文本与代码块
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

// 高亮关键词（返回安全 HTML 字符串）
function highlightKeyword(html: string, keyword: string) {
  if (!keyword) return html;
  const safeKey = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${safeKey})`, 'gi');
  return html.replace(
    regex,
    `<span class="bg-amber-100 dark:bg-amber-900/40 px-0.5 rounded">$1</span>`
  );
}

export default function SearchPage() {
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

  // useMemo 优化过滤
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            搜索
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">搜索标题、内容、代码和标签</p>
        </div>

        {/* 搜索输入框 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl p-5 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              id="search-input"
              type="text"
              value={keyword}
              onChange={handleInput}
              placeholder="输入关键词…"
              className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-shadow"
            />
          </div>

          {/* 搜索统计 */}
          {keyword && (
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              找到{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                {results.length}
              </span>{' '}
              个结果
            </div>
          )}
        </div>

        {/* 搜索结果 */}
        <div className="space-y-6">
          {/* 加载状态 */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block h-7 w-7 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">加载文章中…</div>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="text-center py-12">
              <div className="text-gray-700 dark:text-gray-300">{error}</div>
            </div>
          )}

          {/* 空状态（未输入） */}
          {!loading && !error && !keyword && (
            <div className="text-center py-16">
              <div className="text-gray-500 dark:text-gray-400 text-base">输入关键词开始搜索</div>
              <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                支持搜索标题、内容、代码和标签
              </div>
            </div>
          )}

          {/* 无结果状态 */}
          {!loading && !error && keyword && results.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-500 dark:text-gray-400 text-base">没有找到相关文章</div>
              <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                试试其他关键词，或检查拼写
              </div>
            </div>
          )}

          {/* 搜索结果列表 */}
          {!loading && !error && results.length > 0 && (
            <div className="space-y-4">
              {results.map((post) => {
                // 预处理文案和代码高亮
                const { codeBlocks } = extractTextFromMarkdown(post.content);
                const matchingCodeBlock = codeBlocks.find(
                  (block) =>
                    block.code.toLowerCase().includes(keyword.toLowerCase()) ||
                    block.language.toLowerCase().includes(keyword.toLowerCase())
                );

                return (
                  <article
                    key={post.post_id}
                    className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors duration-200"
                  >
                    {/* 文章标题 */}
                    <h2 className="text-lg font-bold tracking-tight mb-2 leading-snug">
                      <Link
                        href={`/article/${post.post_id}`}
                        className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                        dangerouslySetInnerHTML={{
                          __html: highlightKeyword(DOMPurify.sanitize(post.title), keyword)
                        }}
                      />
                    </h2>

                    {/* 文章预览 */}
                    <div className="mb-3">
                      {matchingCodeBlock ? (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3.5 overflow-x-auto border border-gray-100 dark:border-gray-800">
                          <div className="text-xs text-gray-400 dark:text-gray-500 mb-1.5 font-mono">
                            {matchingCodeBlock.language}
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
                                      (matchingCodeBlock.code.length > 200 ? '…' : '')
                                  ),
                                  keyword
                                )
                              }}
                            />
                          </pre>
                        </div>
                      ) : (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none line-clamp-3 text-gray-500 dark:text-gray-400"
                          dangerouslySetInnerHTML={{
                            __html: highlightKeyword(
                              DOMPurify.sanitize(
                                marked.parse(
                                  post.content.substring(0, 300) +
                                    (post.content.length > 300 ? '…' : ''),
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
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
                      {/* 作者 */}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: highlightKeyword(
                            DOMPurify.sanitize(post.author || '匿名'),
                            keyword
                          )
                        }}
                      />

                      {/* 发布时间 */}
                      <time className="tabular-nums">
                        {new Date(post.created_at).toLocaleDateString()}
                      </time>

                      {/* 标签 */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded-full font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
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
}
