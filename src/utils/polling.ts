/**
 * 通用轮询工具函数
 * 用于轮询任务状态直到完成
 */

export interface PollingOptions {
  maxWaitMs?: number; // 最大等待时间（毫秒）
  intervalMs?: number; // 轮询间隔（毫秒）
  maxConsecutiveErrors?: number; // 最大连续错误次数
  onProgress?: (progress: any) => void; // 进度回调
  onError?: (error: Error) => void; // 错误回调
}

export interface TaskStatus {
  status: string;
  progress?: number;
  message?: string;
  data?: any;
}

/**
 * 轮询任务状态直到完成
 * @param taskId 任务ID
 * @param checkStatus 检查状态的函数
 * @param options 轮询选项
 * @returns Promise<void>
 */
export async function pollUntilCompleted(
  taskId: string,
  checkStatus: (taskId: string) => Promise<TaskStatus>,
  options: PollingOptions = {}
): Promise<void> {
  const {
    maxWaitMs = 15 * 60 * 1000, // 默认15分钟
    intervalMs = 1200, // 默认1.2秒
    maxConsecutiveErrors = 5, // 默认5次连续错误
    onProgress,
    onError
  } = options;

  const startTime = Date.now();
  let consecutiveErrors = 0;
  let lastProgress = 0;

  while (true) {
    // 超时控制
    if (Date.now() - startTime > maxWaitMs) {
      const error = new Error(`任务 ${taskId} 轮询超时 (${maxWaitMs}ms)`);
      onError?.(error);
      throw error;
    }

    try {
      const taskStatus = await checkStatus(taskId);
      consecutiveErrors = 0; // 重置连续错误计数

      const { status, progress, message, data } = taskStatus;
      const normalizedStatus = status.toLowerCase();

      // 更新进度
      if (typeof progress === 'number') {
        lastProgress = Math.max(lastProgress, Math.min(100, Math.max(0, Math.round(progress))));
      }

      // 调用进度回调
      onProgress?.({
        status: normalizedStatus,
        progress: lastProgress,
        message,
        data
      });

      // 严格判断任务完成状态
      if (normalizedStatus === 'completed' || normalizedStatus === 'finished') {
        console.log(`任务 ${taskId} 已完成，状态: ${status}`);
        return;
      }

      // 判断失败状态
      if (/fail|error|cancel|failed/i.test(normalizedStatus)) {
        const error = new Error(message || `任务 ${taskId} 失败，状态: ${status}`);
        onError?.(error);
        throw error;
      }

      // 如果状态是进行中，继续轮询
      if (/pending|in_progress|processing|running/i.test(normalizedStatus)) {
        console.log(`任务 ${taskId} 进行中，状态: ${status}，进度: ${lastProgress}%`);
      } else {
        // 未知状态，记录日志但继续轮询
        console.log(`任务 ${taskId} 未知状态: ${status}，继续轮询`);
      }

    } catch (error) {
      consecutiveErrors++;
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.warn(`任务 ${taskId} 状态查询失败 (${consecutiveErrors}/${maxConsecutiveErrors}): ${errorMessage}`);
      
      // 如果连续错误次数过多，抛出异常
      if (consecutiveErrors >= maxConsecutiveErrors) {
        const finalError = new Error(`任务 ${taskId} 连续 ${maxConsecutiveErrors} 次查询失败，可能网络异常`);
        onError?.(finalError);
        throw finalError;
      }
    }

    // 等待一段时间再轮询 - 根据连续错误次数调整等待时间
    const waitTime = consecutiveErrors > 0 
      ? Math.min(intervalMs * (1 + consecutiveErrors), 10000) 
      : intervalMs;
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

/**
 * 小说下载专用的轮询函数
 * @param taskId 任务ID
 * @param apiBase API基础地址
 * @param onProgress 进度回调
 * @param options 轮询选项
 */
export async function pollNovelDownload(
  taskId: string,
  apiBase: string,
  onProgress: (progress: {
    status: string;
    progress: number;
    completedChapters?: number;
    totalChapters?: number;
  }) => void,
  options: PollingOptions = {}
): Promise<void> {
  const buildApiUrl = (path: string, params?: Record<string, string | number>) => {
    const url = new URL(`${apiBase}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  };

  const safeJson = async (resp: Response) => {
    try {
      return await resp.json();
    } catch {
      return {} as any;
    }
  };

  const checkStatus = async (taskId: string): Promise<TaskStatus> => {
    const resp = await fetch(buildApiUrl('/api/optimized/download/progress', { task_id: taskId }));
    const json = await safeJson(resp);

    const status = (json?.data?.status || json?.status || '').toString();
    const progressValue =
      typeof json?.data?.progress_percentage === 'number' ? json.data.progress_percentage :
      typeof json?.data?.progress === 'number' ? json.data.progress :
      typeof json?.progress === 'number' ? json.progress : undefined;

    const completedChapters = json?.data?.completed_chapters || json?.completed_chapters;
    const totalChapters = json?.data?.total_chapters || json?.total_chapters;

    return {
      status,
      progress: progressValue,
      message: json?.message,
      data: {
        completedChapters,
        totalChapters,
        ...json?.data
      }
    };
  };

  await pollUntilCompleted(taskId, checkStatus, {
    ...options,
    onProgress: (progress) => {
      onProgress({
        status: progress.status,
        progress: progress.progress || 0,
        completedChapters: progress.data?.completedChapters,
        totalChapters: progress.data?.totalChapters
      });
    }
  });
}