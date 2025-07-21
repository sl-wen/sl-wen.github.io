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

  // 下载小说函数
  const handleDownload = async (novel: Novel, format: 'txt' | 'epub' | 'pdf' = 'txt', index: number) => {
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
        throw new Error('下载失败');
      }

      // 获取文件名
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${novel.bookName}_${novel.author}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // 创建下载链接
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('下载成功！');
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">小说聚合搜索引擎</h1>
      <form className="flex gap-2 mb-8" onSubmit={handleSearch}>
        <input
          type="text"
          className="flex-1 px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring"
          placeholder="请输入小说名或作者、如：三体"
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
                {(['txt', 'epub', 'pdf'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => handleDownload(novel, format, idx)}
                    disabled={downloadingIds.has(idx) || !novel.url}
                    className={`px-3 py-1 text-sm rounded transition ${
                      downloadingIds.has(idx)
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