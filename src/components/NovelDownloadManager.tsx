import React, { useState, useCallback } from 'react';
import { usePolling, PollingState } from '@/utils/usePolling';

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

interface DownloadTask {
  id: string;
  novel: Novel;
  format: 'txt' | 'epub';
  taskId?: string;
  state: PollingState;
}

interface NovelDownloadManagerProps {
  apiBase: string;
  onDownloadComplete?: (taskId: string, novel: Novel, format: string) => void;
  onDownloadError?: (taskId: string, error: Error) => void;
}

export function NovelDownloadManager({ 
  apiBase, 
  onDownloadComplete, 
  onDownloadError 
}: NovelDownloadManagerProps) {
  const [downloadTasks, setDownloadTasks] = useState<Map<string, DownloadTask>>(new Map());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  // 启动下载任务
  const startDownload = useCallback(async (novel: Novel, format: 'txt' | 'epub') => {
    if (!novel.url) {
      alert('该小说没有可用的下载链接');
      return;
    }

    const taskId = `${novel.title}_${novel.author}_${format}_${Date.now()}`;
    
    // 创建下载任务
    const downloadTask: DownloadTask = {
      id: taskId,
      novel,
      format,
      state: {
        status: 'starting',
        progress: 0
      }
    };

    setDownloadTasks(prev => new Map(prev).set(taskId, downloadTask));
    setDownloadingIds(prev => new Set(prev).add(taskId));

    try {
      // 1) 启动任务
      const startUrl = new URL(`${apiBase}/api/optimized/download/start`);
      startUrl.searchParams.set('url', novel.url);
      if (novel.source_id) {
        startUrl.searchParams.set('sourceId', novel.source_id.toString());
      }
      startUrl.searchParams.set('format', format);

      const startResp = await fetch(startUrl.toString(), { method: 'POST' });
      const startJson = await startResp.json().catch(() => ({}));
      const apiTaskId: string | undefined = startJson?.data?.task_id || startJson?.task_id;

      if (!startResp.ok || !apiTaskId) {
        throw new Error(startJson?.message || '启动下载任务失败');
      }

      // 更新任务ID
      setDownloadTasks(prev => {
        const newMap = new Map(prev);
        const task = newMap.get(taskId);
        if (task) {
          task.taskId = apiTaskId;
          task.state.status = 'running';
        }
        return newMap;
      });

      // 2) 开始轮询
      await pollTaskStatus(apiTaskId, taskId);

      // 3) 拉取结果文件
      await fetchAndDownloadResult(apiTaskId, novel, format);

      // 完成
      setDownloadTasks(prev => {
        const newMap = new Map(prev);
        const task = newMap.get(taskId);
        if (task) {
          task.state.status = 'completed';
          task.state.progress = 100;
        }
        return newMap;
      });

      onDownloadComplete?.(taskId, novel, format);
      alert('下载成功！');

    } catch (error) {
      console.error('下载失败:', error);
      
      setDownloadTasks(prev => {
        const newMap = new Map(prev);
        const task = newMap.get(taskId);
        if (task) {
          task.state.status = 'failed';
          task.state.error = error instanceof Error ? error.message : '未知错误';
        }
        return newMap;
      });

      onDownloadError?.(taskId, error instanceof Error ? error : new Error('未知错误'));
      alert(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  }, [apiBase, onDownloadComplete, onDownloadError]);

  // 轮询任务状态
  const pollTaskStatus = useCallback(async (apiTaskId: string, taskId: string) => {
    const maxWaitMs = 15 * 60 * 1000; // 15分钟超时
    const startTime = Date.now();
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    while (true) {
      // 超时控制
      if (Date.now() - startTime > maxWaitMs) {
        throw new Error('下载任务超时');
      }

      try {
        const progressUrl = new URL(`${apiBase}/api/optimized/download/progress`);
        progressUrl.searchParams.set('task_id', apiTaskId);
        
        const resp = await fetch(progressUrl.toString());
        const json = await resp.json().catch(() => ({}));

        consecutiveErrors = 0;

        const status: string = (json?.data?.status || json?.status || '').toString();
        const progressValue =
          typeof json?.data?.progress_percentage === 'number' ? json.data.progress_percentage :
          typeof json?.data?.progress === 'number' ? json.data.progress :
          typeof json?.progress === 'number' ? json.progress : undefined;

        const completedChapters = json?.data?.completed_chapters || json?.completed_chapters;
        const totalChapters = json?.data?.total_chapters || json?.total_chapters;

        // 更新进度
        setDownloadTasks(prev => {
          const newMap = new Map(prev);
          const task = newMap.get(taskId);
          if (task) {
            task.state.progress = typeof progressValue === 'number' 
              ? Math.max(task.state.progress, Math.min(100, Math.max(0, Math.round(progressValue))))
              : task.state.progress;
            task.state.completedChapters = completedChapters;
            task.state.totalChapters = totalChapters;
          }
          return newMap;
        });

        // 严格判断任务完成状态
        if (status.toLowerCase() === 'completed' || status.toLowerCase() === 'finished') {
          console.log(`任务 ${apiTaskId} 已完成，状态: ${status}`);
          return;
        }

        // 判断失败状态
        if (/fail|error|cancel|failed/i.test(status) || (json?.code && json.code >= 400)) {
          throw new Error(json?.message || `下载任务失败，状态: ${status}`);
        }

        // 记录状态
        if (/pending|in_progress|processing|running/i.test(status)) {
          console.log(`任务 ${apiTaskId} 进行中，状态: ${status}`);
        } else {
          console.log(`任务 ${apiTaskId} 未知状态: ${status}，继续轮询`);
        }

      } catch (error) {
        consecutiveErrors++;
        console.warn(`进度查询失败 (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`连续 ${maxConsecutiveErrors} 次查询失败，可能网络异常`);
        }
      }

      // 等待一段时间再轮询
      const waitTime = consecutiveErrors > 0 ? Math.min(2000 * consecutiveErrors, 10000) : 1200;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }, [apiBase]);

  // 获取结果并触发下载
  const fetchAndDownloadResult = useCallback(async (apiTaskId: string, novel: Novel, format: string) => {
    const resultUrl = new URL(`${apiBase}/api/optimized/download/result`);
    resultUrl.searchParams.set('task_id', apiTaskId);

    const response = await fetch(resultUrl.toString());

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`获取结果失败: ${response.status} ${errorText}`);
    }

    const filename = getFilenameFromResponse(response, novel, format);
    const blob = await response.blob();
    downloadFile(blob, filename);
  }, [apiBase]);

  // 从响应头提取文件名
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
        try {
          return decodeURIComponent(filename);
        } catch (e) {
          return filename;
        }
      }
    }

    // 默认文件名
    const cleanTitle = novel.title.replace(/[<>:"/\\|?*]/g, '_');
    const cleanAuthor = novel.author.replace(/[<>:"/\\|?*]/g, '_');
    return `${cleanTitle}_${cleanAuthor}.${format}`;
  };

  // 文件下载函数
  const downloadFile = (blob: Blob, filename: string) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isSafari || isIOS) {
      downloadForSafari(blob, filename);
    } else {
      downloadForStandardBrowser(blob, filename);
    }
  };

  // Safari专用下载
  const downloadForSafari = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);

    try {
      a.click();
    } catch (e) {
      console.warn('直接下载失败，尝试新窗口:', e);
      window.open(url, '_blank');
    }

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  // 标准浏览器下载
  const downloadForStandardBrowser = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // 取消下载任务
  const cancelDownload = useCallback((taskId: string) => {
    setDownloadTasks(prev => {
      const newMap = new Map(prev);
      newMap.delete(taskId);
      return newMap;
    });
    setDownloadingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  }, []);

  // 重试下载任务
  const retryDownload = useCallback((taskId: string) => {
    const task = downloadTasks.get(taskId);
    if (task) {
      startDownload(task.novel, task.format);
    }
  }, [downloadTasks, startDownload]);

  return {
    downloadTasks: Array.from(downloadTasks.values()),
    downloadingIds,
    startDownload,
    cancelDownload,
    retryDownload,
    isDownloading: (taskId: string) => downloadingIds.has(taskId)
  };
}