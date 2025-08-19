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
    status: 'idle' | 'starting' | 'running' | 'polling' | 'downloading' | 'completed' | 'failed';
    phase?: 'init' | 'polling' | 'fetching' | 'done';
    error?: string;
    completedChapters?: number;
    totalChapters?: number;
  }>>({});

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
      // 调用优化版搜索接口
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
      }
    } catch (e) {
      setError('请求失败');
    }
    setLoading(false);
  };

  // 下载小说（异步：启动任务 -> 轮询进度 -> 拉取结果文件）
  const handleDownload = async (novel: Novel, format: 'txt' | 'epub' = 'txt', index: number) => {
    if (!novel.url) {
      alert('该小说没有可用的下载链接');
      return;
    }

    // 初始化下载状态
    setDownloadStates(prev => ({
      ...prev,
      [index]: { status: 'starting', progress: 0 }
    }));
    setDownloadingIds(prev => new Set(prev).add(index));

    let taskId: string | undefined;

    try {
      // 阶段1：启动下载任务
      console.log(`开始启动下载任务: ${novel.title} (${format})`);
      const startUrl = buildApiUrl('/api/optimized/download/start', {
        url: novel.url,
        sourceId: novel.source_id,
        format,
      });
      
      const startResp = await fetch(startUrl, { method: 'POST' });
      const startJson = await safeJson(startResp);
      taskId = startJson?.data?.task_id || startJson?.task_id;

      if (!startResp.ok) {
        throw new Error(startJson?.message || `启动任务失败: ${startResp.status} ${startResp.statusText}`);
      }

      if (!taskId) {
        throw new Error(startJson?.message || '服务器未返回任务ID');
      }

      console.log(`任务启动成功，任务ID: ${taskId}`);
      
      setDownloadStates(prev => ({
        ...prev,
        [index]: { status: 'running', progress: 0, taskId }
      }));

      // 阶段2：轮询进度直到完成
      console.log(`开始轮询任务进度: ${taskId}`);
      setDownloadStates(prev => ({
        ...prev,
        [index]: { ...(prev[index] || {}), phase: 'polling', status: 'polling' }
      }));
      
      await pollUntilDone(taskId, index);
      console.log(`轮询完成，任务状态为completed: ${taskId}`);

      // 阶段3：拉取结果文件 - 只有轮询完成且状态为completed才会执行到这里
      console.log(`开始拉取结果文件: ${taskId}`);
      setDownloadStates(prev => ({
        ...prev,
        [index]: { ...(prev[index] || {}), phase: 'fetching', status: 'downloading' }
      }));
      
      await fetchAndDownloadResult(taskId, novel, format);
      console.log(`文件下载完成: ${taskId}`);

      // 最终完成状态
      setDownloadStates(prev => ({
        ...prev,
        [index]: { ...(prev[index] || {}), status: 'completed', progress: 100, phase: 'done' }
      }));
      
      alert(`${novel.title} 下载成功！`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error(`下载失败 (任务ID: ${taskId || 'N/A'}):`, error);
      
      setDownloadStates(prev => ({
        ...prev,
        [index]: { 
          ...(prev[index] || {}), 
          status: 'failed', 
          error: errorMessage, 
          progress: prev[index]?.progress || 0,
          taskId
        }
      }));
      
      // 根据错误类型提供更详细的提示
      let userMessage = `下载失败: ${errorMessage}`;
      if (errorMessage.includes('超时')) {
        userMessage += '\n\n建议：任务可能仍在后台运行，请稍后重试';
      } else if (errorMessage.includes('网络')) {
        userMessage += '\n\n建议：检查网络连接后重试';
      }
      
      alert(userMessage);
      
    } finally {
      // 清理下载状态
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  // 轮询进度直至完成 - 严格确保状态为 completed 才结束轮询
  const pollUntilDone = async (taskId: string, index: number): Promise<void> => {
    const maxWaitMs = 15 * 60 * 1000; // 最长等待15分钟
    const startTime = Date.now();
    let lastProgress = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5; // 最多连续5次错误

    while (true) {

      // 超时控制
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error('下载任务超时（15分钟）');
      }

      try {
        const resp = await fetch(buildApiUrl('/api/optimized/download/progress', { task_id: taskId }));
        
        // 重置连续错误计数
        consecutiveErrors = 0;

        if (!resp.ok) {
          throw new Error(`服务器响应错误: ${resp.status} ${resp.statusText}`);
        }

        const json = await safeJson(resp);

        // 尝试读取进度/状态字段，兼容多种返回结构
        const status: string = (json?.data?.status || json?.status || '').toString().toLowerCase();
        const progressValue =
          typeof json?.data?.progress_percentage === 'number' ? json.data.progress_percentage :
            typeof json?.data?.progress === 'number' ? json.data.progress :
            typeof json?.progress === 'number' ? json.progress : undefined;

        // 读取章节信息
        const completedChapters = json?.data?.completed_chapters || json?.completed_chapters;
        const totalChapters = json?.data?.total_chapters || json?.total_chapters;

        // 更新进度
        if (typeof progressValue === 'number') {
          lastProgress = Math.max(lastProgress, Math.min(100, Math.max(0, Math.round(progressValue))));
        }

        // 更新状态
        setDownloadStates(prev => ({
          ...prev,
          [index]: {
            ...(prev[index] || {}),
            status: 'polling',
            progress: lastProgress,
            completedChapters,
            totalChapters,
            taskId,
            phase: 'polling'
          }
        }));

        // 严格判断完成状态 - 只有状态明确为 completed 才认为完成
        if (status === 'completed' || status === 'finished' || status === 'success' || status === 'done') {
          console.log(`任务 ${taskId} 轮询完成，状态: ${status}, 进度: ${lastProgress}%`);
          return; // 轮询结束，可以进行下一步
        }

        // 判断失败状态
        if (status === 'failed' || status === 'error' || status === 'cancelled' || status === 'timeout') {
          throw new Error(json?.message || json?.data?.message || `任务失败，状态: ${status}`);
        }

        // 检查是否有错误码
        if (json?.code && json.code >= 400) {
          throw new Error(json?.message || json?.data?.message || `任务失败，错误码: ${json.code}`);
        }

        // 如果进度达到100%但状态不是completed，继续等待状态更新
        if (lastProgress >= 100 && !['completed', 'finished', 'success', 'done'].includes(status)) {
          console.log(`进度已100%但状态为 ${status}，继续等待状态更新...`);
        }

      } catch (e) {
        consecutiveErrors++;
        console.warn(`进度查询失败 (${consecutiveErrors}/${maxConsecutiveErrors}):`, e);
        
        // 如果连续错误过多，抛出异常
        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`进度查询连续失败 ${maxConsecutiveErrors} 次: ${e instanceof Error ? e.message : '未知错误'}`);
        }
        
        // 连续错误时增加等待时间
        await delay(2000 * consecutiveErrors);
        continue;
      }

      // 等待一会再轮询
      await delay(1200);
    }
  };

  // 获取结果并触发下载 - 只有轮询状态为completed后才会调用此函数
  const fetchAndDownloadResult = async (taskId: string, novel: Novel, format: string): Promise<void> => {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        console.log(`尝试获取结果文件 (尝试 ${attempt + 1}/${maxRetries}): ${taskId}`);
        
        // 浏览器 fetch 默认跟随跳转，等同于 curl -L
        const response = await fetch(buildApiUrl('/api/optimized/download/result', { task_id: taskId }), {
          method: 'GET',
          headers: {
            'Accept': '*/*',
          }
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`获取结果失败 (${response.status}): ${errorText || response.statusText}`);
        }

        // 检查响应内容类型
        const contentType = response.headers.get('content-type') || '';
        const contentLength = response.headers.get('content-length');
        
        console.log(`结果文件信息: Content-Type=${contentType}, Content-Length=${contentLength}`);

        // 如果返回的是JSON错误信息而不是文件
        if (contentType.includes('application/json')) {
          const json = await response.json();
          throw new Error(json?.message || json?.error || '服务器返回错误信息');
        }

        const filename = getFilenameFromResponse(response, novel, format);
        const blob = await response.blob();
        
        // 验证文件大小
        if (blob.size === 0) {
          throw new Error('下载的文件为空');
        }

        console.log(`准备下载文件: ${filename} (${blob.size} bytes)`);
        downloadFile(blob, filename);
        
        return; // 成功，退出重试循环
        
      } catch (error) {
        attempt++;
        console.warn(`获取结果文件失败 (尝试 ${attempt}/${maxRetries}):`, error);
        
        if (attempt >= maxRetries) {
          throw new Error(`获取结果文件失败，已重试 ${maxRetries} 次: ${error instanceof Error ? error.message : '未知错误'}`);
        }
        
        // 等待后重试
        await delay(2000 * attempt);
      }
    }
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
                  源站>
                </a>
              )}

              {/* 下载按钮组 */}
              <div className="flex gap-1 items-center">
                {(['txt', 'epub'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => handleDownload(novel, format, idx)}
                    disabled={downloadingIds.has(idx) || !novel.url}
                    className={`px-3 py-1 text-sm rounded transition ${downloadingIds.has(idx)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : downloadStates[idx]?.status === 'completed' 
                        ? 'bg-green-200 text-green-800'
                        : downloadStates[idx]?.status === 'failed'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                  >
                    {downloadStates[idx]?.status === 'starting' && `启动${format.toUpperCase()}...`}
                    {downloadStates[idx]?.status === 'running' && `任务中`}
                    {downloadStates[idx]?.status === 'polling' && `轮询中`}
                    {downloadStates[idx]?.status === 'downloading' && `拉取中`}
                    {downloadStates[idx]?.status === 'completed' && `已完成`}
                    {downloadStates[idx]?.status === 'failed' && `✗ 失败`}
                    {!downloadStates[idx]?.status || downloadStates[idx]?.status === 'idle' ? `${format.toUpperCase()}` : null}
                  </button>
                ))}

                {/* 进度提示 */}
                {downloadingIds.has(idx) && (
                  <div className="text-xs text-gray-600 ml- flex flex-col">
                    <div className="flex items-center gap-1">
                      {downloadStates[idx]?.status === 'starting' && (
                        <>
                          <span className="animate-pulse">⏳</span>
                          <span>启动中.</span>
                        </>
                      )}
                      {downloadStates[idx]?.status === 'running' && (
                        <>
                          <span className="animate-spin">⚙️</span>
                          <span>任务中.</span>
                        </>
                      )}
                      {downloadStates[idx]?.status === 'polling' && (
                        <>
                          <span className="animate-pulse">🔄</span>
                          <span>进度{downloadStates[idx]?.progress ?? 0}%</span>
                        </>
                      )}
                      {downloadStates[idx]?.status === 'downloading' && (
                        <>
                          <span className="animate-bounce">⬇️</span>
                          <span>拉取中.</span>
                        </>
                      )}
                      {downloadStates[idx]?.status === 'failed' && (
                        <>
                          <span>❌</span>
                          <span className="text-red-600">{downloadStates[idx]?.error || '失败'}</span>
                        </>
                      )}
                    </div>
                    {downloadStates[idx]?.status === 'polling' && downloadStates[idx]?.completedChapters && (
                      <div className="text-xs text-gray-500 mt-1">
                        章节: {downloadStates[idx]?.completedChapters || 0}/{downloadStates[idx]?.totalChapters || 0}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
