'use client';
import React, { useState } from 'react';

// 定义小说数据的类型
interface Novel {
  title: string;
  author: string;
  source_name: string;
  url?: string;
  latest_chapter?: string;
  update_time?: string;
  source_id?: number;
  word_count?: string;
  status?: string;
}

export default function NovelPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set()); // 跟踪正在下载的小说
  const [downloadStates, setDownloadStates] = useState<Record<number, {
    taskId?: string;
    progress: number;
    status: 'idle' | 'starting' | 'running' | 'completed' | 'failed' | 'queued';
    error?: string;
    completedChapters?: number;
    totalChapters?: number;
    startTime?: number;
    format?: string;
  }>>({});
  const [downloadQueue, setDownloadQueue] = useState<Array<{
    novel: Novel;
    format: 'txt' | 'epub';
    index: number;
  }>>([]);
  const [maxConcurrentDownloads] = useState(2); // 最大并发下载数

  // API 基础地址（默认指向 FastAPI 服务）
  const API_BASE = (process.env.NEXT_PUBLIC_NOVEL_API_BASE || 'http://localhost:8000').replace(/\/$/, '');
  const buildApiUrl = (path: string, params?: Record<string, string | number | undefined>) => {
    const url = new URL(`${API_BASE}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  };

  // 将不同字段风格（snake_case/camelCase）统一为前端使用的结构
  const normalizeNovel = (item: any): Novel => ({
    title: item.title,
    author: item.author,
    source_name: item.source_name || item.sourceName || item.source || '',
    url: item.url,
    latest_chapter: item.latest_chapter || item.latestChapter,
    update_time: item.update_time || item.lastUpdateTime,
    source_id: item.source_id ?? item.sourceId,
    word_count: item.word_count || item.wordCount,
    status: item.status,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    setNovels([]);
    try {
      // 优先调用优化版搜索接口
      const optimizedUrl = buildApiUrl('/api/optimized/search', {
        keyword,
        q: keyword, // 兼容参数名
        maxResults: 30,
        max_results: 30, // 兼容参数名
      });
      let res = await fetch(optimizedUrl);
      let data: any = await res.json().catch(async () => ({ raw: await res.text().catch(() => '') }));

      if (res.ok && (data.code === 200 || Array.isArray(data.data))) {
        const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        setNovels(list.map(normalizeNovel));
      } else {
        // 失败时尝试标准版搜索作为兜底
        const standardUrl = buildApiUrl('/api/novels/search', { keyword, q: keyword, maxResults: 30, max_results: 30 });
        res = await fetch(standardUrl);
        data = await res.json().catch(async () => ({ raw: await res.text().catch(() => '') }));
        if (res.ok && (data.code === 200 || Array.isArray(data.data))) {
          const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
          setNovels(list.map(normalizeNovel));
        } else {
          const detail = Array.isArray(data?.detail) ? (data.detail[0]?.msg || data.detail[0]?.message) : data?.detail;
          const msg = data?.message || detail || data?.raw || `接口错误 (${res.status})`;
          setError(typeof msg === 'string' ? msg : '接口错误');
        }
      }
    } catch (e) {
      setError('请求失败');
    }
    setLoading(false);
  };

  // 检查当前运行的下载数量
  const getActiveDownloadsCount = () => {
    return Object.values(downloadStates).filter(state => 
      state.status === 'starting' || state.status === 'running'
    ).length;
  };

  // 处理下载队列
  const processDownloadQueue = async () => {
    if (downloadQueue.length === 0 || getActiveDownloadsCount() >= maxConcurrentDownloads) {
      return;
    }

    const nextDownload = downloadQueue[0];
    setDownloadQueue(prev => prev.slice(1));
    
    await executeDownload(nextDownload.novel, nextDownload.format, nextDownload.index);
  };

  // 添加到下载队列
  const handleDownload = async (novel: Novel, format: 'txt' | 'epub' = 'txt', index: number) => {
    if (!novel.url) {
      alert('该小说没有可用的下载链接');
      return;
    }

    // 检查是否已在下载或队列中
    if (downloadingIds.has(index) || downloadStates[index]?.status === 'queued') {
      return;
    }

    const activeDownloads = getActiveDownloadsCount();
    
    if (activeDownloads >= maxConcurrentDownloads) {
      // 添加到队列
      setDownloadQueue(prev => [...prev, { novel, format, index }]);
      setDownloadStates(prev => ({
        ...prev,
        [index]: { status: 'queued', progress: 0, format }
      }));
      alert(`已添加到下载队列，当前队列位置: ${downloadQueue.length + 1}`);
    } else {
      // 直接开始下载
      await executeDownload(novel, format, index);
    }
  };

  // 执行下载（异步：启动任务 -> 轮询进度 -> 拉取结果文件）
  const executeDownload = async (novel: Novel, format: 'txt' | 'epub' = 'txt', index: number) => {
    // 初始化下载状态
    setDownloadStates(prev => ({
      ...prev,
      [index]: { status: 'starting', progress: 0, startTime: Date.now(), format }
    }));
    setDownloadingIds(prev => new Set(prev).add(index));

    try {
      // 1) 启动任务
      const startUrl = buildApiUrl('/api/novels/download/start', {
        url: novel.url,
        sourceId: novel.source_id,
        format,
      });
      const startResp = await fetch(startUrl, { method: 'POST' });
      const startJson = await safeJson(startResp);
      const taskId: string | undefined = startJson?.data?.task_id || startJson?.task_id;

      if (!startResp.ok || !taskId) {
        throw new Error(startJson?.message || startJson?.error || '启动下载任务失败');
      }

      setDownloadStates(prev => ({
        ...prev,
        [index]: { ...prev[index], status: 'running', progress: 0, taskId }
      }));

      // 2) 轮询进度
      await pollUntilDone(taskId, index);

      // 3) 拉取结果文件
      await fetchAndDownloadResult(taskId, novel, format);

      // 完成
      setDownloadStates(prev => ({
        ...prev,
        [index]: { ...(prev[index] || {}), status: 'completed', progress: 100 }
      }));
      
      // 显示成功消息，包含下载时间
      const downloadTime = downloadStates[index]?.startTime 
        ? Math.round((Date.now() - downloadStates[index].startTime!) / 1000)
        : 0;
      alert(`下载成功！用时 ${downloadTime} 秒`);

    } catch (error) {
      console.error('下载失败:', error);
      setDownloadStates(prev => ({
        ...prev,
        [index]: { 
          ...(prev[index] || {}), 
          status: 'failed', 
          error: error instanceof Error ? error.message : '未知错误', 
          progress: prev[index]?.progress || 0 
        }
      }));
      alert(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      
      // 处理队列中的下一个任务
      setTimeout(processDownloadQueue, 500);
    }
  };

  // 轮询进度直至完成
  const pollUntilDone = async (taskId: string, index: number) => {
    const maxWaitMs = 15 * 60 * 1000; // 最长等待15分钟
    const startTime = Date.now();
    let lastProgress = 0;
    let consecutiveErrors = 0;
    let pollInterval = 1000; // 动态轮询间隔，从1秒开始

    while (true) {
      // 超时控制
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error('下载任务超时，请稍后重试');
      }

      try {
        const resp = await fetch(buildApiUrl('/api/novels/download/progress/smart', { task_id: taskId, timeout: 120 }));
        
        if (!resp.ok) {
          throw new Error(`服务器响应错误: ${resp.status}`);
        }

        const json = await safeJson(resp);
        consecutiveErrors = 0; // 重置错误计数

        // 尝试读取进度/状态字段，兼容多种返回结构
        const status: string = (json?.data?.status || json?.status || '').toString();
        const progressValue =
          typeof json?.data?.progress_percentage === 'number' ? json.data.progress_percentage :
            typeof json?.data?.progress === 'number' ? json.data.progress :
              typeof json?.progress === 'number' ? json.progress : undefined;

        // 读取章节信息
        const completedChapters = json?.data?.completed_chapters || json?.completed_chapters;
        const totalChapters = json?.data?.total_chapters || json?.total_chapters;

        // 更新进度
        if (typeof progressValue === 'number') {
          const newProgress = Math.max(lastProgress, Math.min(100, Math.max(0, Math.round(progressValue))));
          lastProgress = newProgress;
          
          // 根据进度调整轮询间隔
          if (newProgress < 10) {
            pollInterval = 800; // 初期更频繁
          } else if (newProgress < 50) {
            pollInterval = 1500; // 中期适中
          } else {
            pollInterval = 2000; // 后期较慢
          }

          setDownloadStates(prev => ({
            ...prev,
            [index]: {
              ...(prev[index] || {}),
              status: 'running',
              progress: lastProgress,
              completedChapters,
              totalChapters
            }
          }));
        } else {
          // 未提供进度时，维持原进度并显示处理中
          setDownloadStates(prev => ({
            ...prev,
            [index]: {
              ...(prev[index] || {}),
              status: 'running',
              progress: lastProgress,
              completedChapters,
              totalChapters
            }
          }));
        }

        // 判断完成
        if (/finish|complete|success|done/i.test(status) || lastProgress >= 100) {
          return;
        }

        // 判断失败
        if (/fail|error|cancel/i.test(status) || (json?.code && json.code >= 400)) {
          const errorMsg = json?.message || json?.error || '下载任务失败';
          throw new Error(errorMsg);
        }

      } catch (e) {
        consecutiveErrors++;
        console.warn(`进度查询失败 (${consecutiveErrors}/3):`, e);
        
        // 连续错误过多时放弃
        if (consecutiveErrors >= 3) {
          throw new Error(`连续查询失败，请检查网络连接或稍后重试`);
        }
        
        // 错误时增加轮询间隔
        pollInterval = Math.min(pollInterval * 1.5, 5000);
      }

      // 等待一会再轮询
      await delay(pollInterval);
    }
  };

  // 获取结果并触发下载
  const fetchAndDownloadResult = async (taskId: string, novel: Novel, format: string) => {
    // 浏览器 fetch 默认跟随跳转，等同于 curl -L
    const response = await fetch(buildApiUrl('/api/novels/download/result', { task_id: taskId }));

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`获取结果失败: ${response.status} ${errorText}`);
    }

    const filename = getFilenameFromResponse(response, novel, format);
    const blob = await response.blob();
    downloadFile(blob, filename);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const safeJson = async (resp: Response) => {
    try {
      return await resp.json();
    } catch {
      return {} as any;
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
    const cleanTitle = novel.title.replace(/[<>:"/\\|?*]/g, '_');
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

  // 取消下载
  const cancelDownload = async (index: number) => {
    const state = downloadStates[index];
    if (!state || (state.status !== 'running' && state.status !== 'starting' && state.status !== 'queued')) {
      return;
    }

    if (state.status === 'queued') {
      // 从队列中移除
      setDownloadQueue(prev => prev.filter(item => item.index !== index));
      setDownloadStates(prev => ({
        ...prev,
        [index]: { ...prev[index], status: 'idle', progress: 0 }
      }));
      return;
    }

    // 尝试取消后端任务
    if (state.taskId) {
      try {
        await fetch(buildApiUrl('/api/novels/download/cancel', { task_id: state.taskId }), { method: 'POST' });
      } catch (e) {
        console.warn('取消后端任务失败:', e);
      }
    }

    setDownloadStates(prev => ({
      ...prev,
      [index]: { ...prev[index], status: 'idle', progress: 0, error: '用户取消' }
    }));
    
    setDownloadingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });

    // 处理队列中的下一个任务
    setTimeout(processDownloadQueue, 500);
  };

  // 批量下载选中的小说
  const handleBatchDownload = (format: 'txt' | 'epub' = 'txt') => {
    const selectedNovels = novels.filter((_, idx) => 
      !downloadingIds.has(idx) && 
      downloadStates[idx]?.status !== 'queued' &&
      downloadStates[idx]?.status !== 'running'
    );

    if (selectedNovels.length === 0) {
      alert('没有可下载的小说');
      return;
    }

    // 确认批量下载
    if (!confirm(`确定要下载 ${selectedNovels.length} 本小说吗？`)) {
      return;
    }

    selectedNovels.forEach((novel, idx) => {
      const originalIndex = novels.findIndex(n => n === novel);
      if (originalIndex !== -1) {
        handleDownload(novel, format, originalIndex);
      }
    });

    alert(`已添加 ${selectedNovels.length} 本小说到下载队列`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">小说聚合搜索</h1>
      <form className="flex gap-2 mb-8" onSubmit={handleSearch}>
        <input
          type="text"
          className="flex-1 px-2 py-2 border rounded shadow-sm focus:outline-none focus:ring"
          placeholder="请输入小说名或作者"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button
          type="submit"
          className="px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>

      {error && <div className="mb-4 text-red-500">{error}</div>}

      {/* 批量操作栏 */}
      {novels.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => handleBatchDownload('txt')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
              >
                批量下载TXT
              </button>
              <button
                onClick={() => handleBatchDownload('epub')}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm"
              >
                批量下载EPUB
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              活跃下载: {getActiveDownloadsCount()}/{maxConcurrentDownloads} | 队列: {downloadQueue.length}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {novels.length === 0 && !loading && !error && (
          <div className="text-gray-400 text-center py-8">暂无搜索结果</div>
        )}

        {novels.map((novel, idx) => (
          <div key={idx} className="p-6 border rounded-lg shadow-sm bg-white">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="font-semibold text-xl mb-2">
                  {novel.title}
                  <span className="text-sm text-gray-500 ml-2">by {novel.author}</span>
                  {novel.word_count}
                  {novel.status}
                </div>
                <div className="text-gray-600 mb-2">来源: {novel.source_name}</div>
                {novel.latest_chapter && (
                  <div className="text-gray-700 mb-2">最新章节：{novel.latest_chapter}</div>
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
              <div className="flex gap-1 items-center flex-wrap">
                {(['txt', 'epub'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => handleDownload(novel, format, idx)}
                    disabled={downloadingIds.has(idx) || downloadStates[idx]?.status === 'queued' || !novel.url}
                    className={`px-3 py-1 text-sm rounded transition ${
                      downloadingIds.has(idx) || downloadStates[idx]?.status === 'queued'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : downloadStates[idx]?.status === 'failed'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : downloadStates[idx]?.status === 'completed'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                  >
                    {downloadStates[idx]?.status === 'queued' && `队列中...`}
                    {downloadStates[idx]?.status === 'starting' && `启动${format.toUpperCase()}...`}
                    {downloadStates[idx]?.status === 'running' &&
                      `${downloadStates[idx]?.completedChapters || 0}/${downloadStates[idx]?.totalChapters || 0} ${downloadStates[idx]?.progress ?? 0}%`}
                    {downloadStates[idx]?.status === 'completed' && `✓ 已完成`}
                    {downloadStates[idx]?.status === 'failed' && `失败，重试`}
                    {!downloadStates[idx]?.status || downloadStates[idx]?.status === 'idle' ? `下载${format.toUpperCase()}` : null}
                  </button>
                ))}

                {/* 取消按钮 */}
                {(downloadingIds.has(idx) || downloadStates[idx]?.status === 'queued') && (
                  <button
                    onClick={() => cancelDownload(idx)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    取消
                  </button>
                )}

                {/* 进度提示 */}
                {(downloadingIds.has(idx) || downloadStates[idx]?.status === 'queued') && (
                  <span className="text-xs text-gray-500 ml-2">
                    {downloadStates[idx]?.status === 'queued' && `队列第 ${downloadQueue.findIndex(q => q.index === idx) + 1} 位`}
                    {downloadStates[idx]?.status === 'starting' && '启动任务中...'}
                    {downloadStates[idx]?.status === 'running' && (
                      <span>
                        {downloadStates[idx]?.completedChapters && downloadStates[idx]?.totalChapters
                          ? `${downloadStates[idx]?.completedChapters}/${downloadStates[idx]?.totalChapters} 章节`
                          : ''
                        } {downloadStates[idx]?.progress ?? 0}%
                        {downloadStates[idx]?.startTime && (
                          <span className="ml-1">
                            ({Math.round((Date.now() - downloadStates[idx].startTime!) / 1000)}s)
                          </span>
                        )}
                      </span>
                    )}
                    {downloadStates[idx]?.status === 'failed' && (
                      <span className="text-red-500">{downloadStates[idx]?.error || '下载失败'}</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
