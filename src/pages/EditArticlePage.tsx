import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getArticleById, updateArticle, deleteArticle, renderMarkdown } from '../utils/articleService';
import '../styles/EditArticlePage.css';

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
  if (!href) return `<img src="https://gss0.bdstatic.com/6LZ1dD3d1sgCo2Kml5_Y_D3/sys/portrait/item/tb.1.7e293cdd.cfUL8Z5IOqpEDaQ0zOUSZg" alt="${text}" title="${title}">`;
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
  const { post_id } = useParams<{ post_id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [newpost, setnewPost] = useState<Post | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      tags: formData?.tags || [],
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
    <div className="page editor-page">
      {loading && <div>加载中...</div>}
      {message && <div className={`message ${message.type}`}>{message.text}</div>}
      {post && (
        <form className="editor-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (post?.post_id && newpost) {
              updateArticle(post.post_id, newpost);
            }
            navigate(`/article/${post?.post_id}`);
          }}
        >
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
            <label htmlFor="author">作成者</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
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
          <div className="button-group">
            <button type="submit" disabled={loading}>
              变更
            </button>
            <button type="button" onClick={async () => {
              await deleteArticle(post?.post_id);
              navigate('/');
              window.location.reload();
            }} disabled={loading}>
                删除
            </button>
            <Link to={`/article/${post?.post_id}`}>
              <button type="button" disabled={loading}>
                取消
              </button>
            </Link>
          </div>
        </form>
      )
      }
    </div >
  );
};

export default EditArticlePage;
