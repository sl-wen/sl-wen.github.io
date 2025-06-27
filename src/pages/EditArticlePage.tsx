import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getArticleById, updateArticle, deleteArticle } from '../utils/articleService';

interface Post {
    post_id: string;
    title: string;
    content: string;
    author: string;
    tags: string[];
    created_at: string;
    updated_at?: string;
}

// 安全的 marked 解析
function safeMarked(content: string): string {
    if (!content || typeof content !== 'string') return '';
    try {
        return marked.parse(content);
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
renderer.image = function (href, title, text) {
    // 若 href 为对象等异常情况
    if (!href || typeof href === 'object') {
        href = '';
    }
    href = String(href || '').trim();
    title = String(title || '').trim();
    text = String(text || '').trim();
    if (!href) return `<img src="/static/img/logo.png" alt="${text}" title="${title}">`;
    if (!href.startsWith('http') && !href.startsWith('data:')) href = '/static/img/' + href;
    return `<img src="${href}" alt="${text}" title="${title}" onerror="this.src='/static/img/logo.png'">`;
};
// 配置 marked
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false,
    renderer,
});

const EditArticlePage: React.FC = () => {
    const { post_id } = useParams<{ post_id: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [content, setContent] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const editorRef = useRef<HTMLTextAreaElement | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    // 加载文章
    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getArticleById(post_id); // 获取文章
                setPost(data);
            } catch (err) {
                setError('加载文章失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [post_id]);

    // 标签字符串处理
    const onTagStringChange = (s: string) => {
        setTags(s.split(',').map(x => x.trim()).filter(Boolean));
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
        const anchor = previewRef.current.querySelector(`#line-anchor-${curLineNum}`) as HTMLElement | null;
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
        editor.addEventListener('keyup', e => {
            const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
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
        <div className="edit-article-page">
            {loading && <div>加载中...</div>}
            {message && <div className={`message ${message.type}`}>{message.text}</div>}
            {post && (
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        updateArticle(post_id, post);
                        navigate(`/article/${post_id}`);
                    }}
                >
                    <label>
                        标题：
                        <input value={title} onChange={e => setTitle(e.target.value)} disabled={loading} />
                    </label>
                    <label>
                        作者：
                        <input value={author} onChange={e => setAuthor(e.target.value)} disabled={loading} />
                    </label>
                    <label>
                        标签（逗号分隔）：
                        <input
                            value={tags.join(', ')}
                            onChange={e => onTagStringChange(e.target.value)}
                            disabled={loading}
                        />
                    </label>
                    <label>
                        内容：
                        <textarea
                            ref={editorRef}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={18}
                            disabled={loading}
                        />
                    </label>
                    <div className="button-group">
                        <button type="submit" disabled={loading}>变更</button>
                        <button type="button" onClick={deleteArticle(post_id)} disabled={loading}>
                            删除
                        </button>
                        <Link to={`/article/${post_id}`}>
                            <button type="button" disabled={loading}>取消</button>
                        </Link>
                    </div>
                </form>
            )}
            <div className="preview-container">
                <div
                    ref={previewRef}
                    id="preview"
                    className="markdown-body"
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(renderPreviewByLine(content)),
                    }}
                />
            </div>
        </div>
    );
};

export default EditArticlePage;