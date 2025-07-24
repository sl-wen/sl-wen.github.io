'use client';
import React, { useState } from 'react';

// 定义小说数据的类型
interface Novel {
  bookName: string;
  author: string;
  sourceName: string;
  url?: string;
  latestChapter?: string;
  sourceId?: number; // 添加 sourceId 字段
}

export default function NovelPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set()); // 跟踪正在下载的小说

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    setNovels([]);
    try {
      const res = await fetch(`/api/novels/search?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      if (res.ok && data.code === 200) {
        setNovels(data.data || []);
      } else {
        setError(data.message || '接口错误');
      }
    } catch (e) {
      setError('请求失败');
    }
    setLoading(false);
  };

  // 下载小说函数 - 优化版
  const handleDownload = async (novel: Novel, format: 'txt' | 'epub' = 'txt', index: number) => {
    if (!novel.url) {
      alert('该小说没有可用的下载链接');
      return;
    }

    setDownloadingIds(prev => new Set(prev).add(index));

    try {
      const params = new URLSearchParams({
        url: novel.url,
        format: format
      });

      if (novel.sourceId) {
        params.append('sourceId', novel.sourceId.toString());
      }

      const response = await fetch(`/api/novels/download?${params.toString()}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`下载失败: ${response.status} ${errorText}`);
      }

      // 获取文件名 - 改进版
      let filename = getFilenameFromResponse(response, novel, format);

      // 创建并触发下载 - Safari兼容版
      const blob = await response.blob();
      downloadFile(blob, filename);

      alert('下载成功！');
    } catch (error) {
      console.error('下载失败:', error);
      alert(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  // 🔧 从响应头提取文件名
  const getFilenameFromResponse = (response: Response, novel: Novel, format: string): string => {
    const contentDisposition = response.headers.get('content-disposition');

    if (contentDisposition) {
      // 处理 UTF-8 编码的文件名
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
      if (utf8Match) {
        try {
          return decodeURIComponent(utf8Match[1]);
        } catch (e) {
          console.warn('UTF-8 文件名解码失败:', e);
        }
      }

      // 处理普通文件名
      const normalMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (normalMatch) {
        let filename = normalMatch[1].replace(/['"]/g, '');
        // 如果是URL编码，尝试解码
        try {
          return decodeURIComponent(filename);
        } catch (e) {
          return filename;
        }
      }
    }

    // 默认文件名 - 清理特殊字符
    const cleanTitle = novel.bookName.replace(/[<>:"/\\|?*]/g, '_');
    const cleanAuthor = novel.author.replace(/[<>:"/\\|?*]/g, '_');
    return `${cleanTitle}_${cleanAuthor}.${format}`;
  };

  // 🚀 Safari兼容的文件下载函数
  const downloadFile = (blob: Blob, filename: string) => {
    // 检测浏览器类型
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isSafari || isIOS) {
      // Safari 特殊处理
      downloadForSafari(blob, filename);
    } else {
      // 其他浏览器的标准处理
      downloadForStandardBrowser(blob, filename);
    }
  };

  // 🍎 Safari专用下载
  const downloadForSafari = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);

    // 方法1: 尝试标准下载
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    // Safari需要添加到DOM才能工作
    document.body.appendChild(a);

    // 触发点击 - Safari需要用户交互
    try {
      a.click();
    } catch (e) {
      // 如果点击失败，打开新窗口
      console.warn('直接下载失败，尝试新窗口:', e);
      window.open(url, '_blank');
    }

    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  // 🌐 标准浏览器下载
  const downloadForStandardBrowser = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.style.display = 'none';
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    // 立即清理
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">小说聚合搜索</h1>
      <form className="flex gap-2 mb-8" onSubmit={handleSearch}>
        <input
          type="text"
          className="flex-1 px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring"
          placeholder="请输入小说名或作者"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>

      {error && <div className="mb-4 text-red-500">{error}</div>}

      <div className="space-y-4">
        {novels.length === 0 && !loading && !error && (
          <div className="text-gray-400 text-center py-8">暂无搜索结果</div>
        )}

        {novels.map((novel, idx) => (
          <div key={idx} className="p-6 border rounded-lg shadow-sm bg-white">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="font-semibold text-xl mb-2">
                  {novel.bookName}
                  <span className="text-sm text-gray-500 ml-2">by {novel.author}</span>
                </div>
                <div className="text-gray-600 mb-2">来源: {novel.sourceName}</div>
                {novel.latestChapter && (
                  <div className="text-gray-700 mb-2">最新章节：{novel.latestChapter}</div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {novel.url && (
                <a
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                  href={novel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  前往源站
                </a>
              )}

              {/* 下载按钮组 */}
              <div className="flex gap-1">
                {(['txt', 'epub'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => handleDownload(novel, format, idx)}
                    disabled={downloadingIds.has(idx) || !novel.url}
                    className={`px-3 py-1 text-sm rounded transition ${downloadingIds.has(idx)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                  >
                    {downloadingIds.has(idx) ? '下载中...' : `下载${format.toUpperCase()}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}