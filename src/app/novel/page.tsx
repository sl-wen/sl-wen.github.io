'use client';
import React, { useState } from 'react';

// 定义小说数据的类型
interface Novel {
  bookName: string;
  author: string;
  sourceName: string;
  url?: string;
  latestChapter?: string;
}

export default function NovelPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [novels, setNovels] = useState<Novel[]>([]); // 指定类型
  const [error, setError] = useState<string | null>(null); // 指定类型

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

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
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
      <ul>
        {novels.length === 0 && !loading && !error && (
          <li className="text-gray-400">暂无搜索结果</li>
        )}
        {novels.map((novel, idx) => (
          <li key={idx} className="p-4 mb-4 border rounded shadow-sm bg-white">
            <div className="font-semibold text-lg">{novel.bookName} <span className="text-sm text-gray-400">by {novel.author}</span></div>
            <div className="text-gray-600 mb-2">来源: {novel.sourceName}</div>
            {novel.url && <a className="text-blue-500 underline" href={novel.url} target="_blank" rel="noopener noreferrer">前往源站</a>}
            {novel.latestChapter && <div className="text-gray-700">最新章节：{novel.latestChapter}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}