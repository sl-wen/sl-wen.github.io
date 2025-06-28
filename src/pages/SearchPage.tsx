import React, { useEffect, useState, useMemo, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { getArticles } from '../utils/articleService';
import '../styles/SearchPage.css';

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
    return html.replace(regex, `<span class="highlight">$1</span>`);
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
        return posts.filter(post => {
            const titleMatch = post.title && post.title.toLowerCase().includes(lowerKey);
            const { text: contentText, codeBlocks } = extractTextFromMarkdown(post.content);
            const contentMatch = contentText && contentText.toLowerCase().includes(lowerKey);
            const codeMatch = codeBlocks.some(block =>
                block.code.toLowerCase().includes(lowerKey) ||
                block.language.toLowerCase().includes(lowerKey)
            );
            const authorMatch = post.author && post.author.toLowerCase().includes(lowerKey);
            const tagsMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowerKey));
            return titleMatch || contentMatch || codeMatch || authorMatch || tagsMatch;
        });
    }, [keyword, posts]);

    const handleInput = (e: ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value);

    return (
        <div className="searchComponent">
            <input
                id="search-input"
                type="text"
                value={keyword}
                onChange={handleInput}
                placeholder="请输入搜索关键词"
                className="searchInput"
                autoComplete="off"
            />
            <ul className="searchList">
                {loading && <li className="noResults">加载中…</li>}
                {error && <li className="noResults">加载失败：{error}</li>}
                {!loading && !error && !keyword && (
                    <li className="noResults">请输入搜索关键词</li>
                )}
                {!loading && !error && keyword && results.length === 0 && (
                    <li className="noResults">没有找到相关文章</li>
                )}
                {!loading && !error && results.length > 0 && results.map(post => {
                    // 预处理文案和代码高亮
                    const { text: contentText, codeBlocks } = extractTextFromMarkdown(post.content);
                    const matchingCodeBlock = codeBlocks.find(block =>
                        block.code.toLowerCase().includes(keyword.toLowerCase()) ||
                        block.language.toLowerCase().includes(keyword.toLowerCase())
                    );

                    return (
                        <li key={post.post_id} className="searchItem">
                            {/* 标题 */}
                            <h2 className="searchTitle">
                                <Link to={`/article/${post.post_id}`}>{post.title}</Link>
                            </h2>
                            {/* 预览 */}
                            <div className="searchPreview">
                                {matchingCodeBlock ? (
                                    <pre className="markdownBody">
                                        <code
                                            className={matchingCodeBlock.language !== 'inline'
                                                ? `language-${matchingCodeBlock.language}`
                                                : undefined}
                                            dangerouslySetInnerHTML={{
                                                __html: highlightKeyword(DOMPurify.sanitize(
                                                    (matchingCodeBlock.code.substring(0, 500) +
                                                        (matchingCodeBlock.code.length > 500 ? "..." : ""))
                                                ), keyword)
                                            }}
                                        />
                                    </pre>
                                ) : (
                                    <a
                                        href={`/pages/article.html?post_id=${post.post_id}`}
                                        dangerouslySetInnerHTML={{
                                            __html: highlightKeyword(
                                                DOMPurify.sanitize(marked.parse(post.content.substring(0, 500) +
                                                    (post.content.length > 500 ? '...' : ''),
                                                    { async: false }
                                                ) as string),
                                                keyword
                                            )
                                        }}
                                    />
                                )}
                            </div>
                            {/* 作者 */}
                            <span
                                className="author"
                                dangerouslySetInnerHTML={{
                                    __html: highlightKeyword(
                                        DOMPurify.sanitize((post.author || '匿名')), keyword
                                    )
                                }}
                            />
                            {/* 标签 */}
                            <div className="tags">
                                {post.tags &&
                                    post.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="tag"
                                            dangerouslySetInnerHTML={{
                                                __html: highlightKeyword(DOMPurify.sanitize(tag), keyword)
                                            }}
                                        />
                                    ))}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default SearchPage;