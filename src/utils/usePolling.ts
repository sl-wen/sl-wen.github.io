import { useState, useCallback, useRef } from 'react';
import { pollNovelDownload, PollingOptions } from './polling';

export interface PollingState {
  status: 'idle' | 'starting' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
  completedChapters?: number;
  totalChapters?: number;
}

export interface UsePollingOptions extends Omit<PollingOptions, 'onProgress' | 'onError'> {
  onComplete?: () => void;
  onFail?: (error: Error) => void;
}

/**
 * 轮询 Hook
 * 用于管理轮询状态和进度
 */
export function usePolling(options: UsePollingOptions = {}) {
  const [state, setState] = useState<PollingState>({
    status: 'idle',
    progress: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startPolling = useCallback(async (
    taskId: string,
    apiBase: string
  ) => {
    // 如果已经在轮询，先停止
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    // 重置状态
    setState({
      status: 'starting',
      progress: 0
    });

    try {
      await pollNovelDownload(
        taskId,
        apiBase,
        (progress) => {
          setState(prev => ({
            ...prev,
            status: 'running',
            progress: progress.progress,
            completedChapters: progress.completedChapters,
            totalChapters: progress.totalChapters
          }));
        },
        {
          ...options,
          onError: (error) => {
            setState(prev => ({
              ...prev,
              status: 'failed',
              error: error.message
            }));
            options.onFail?.(error);
          }
        }
      );

      // 轮询成功完成
      setState(prev => ({
        ...prev,
        status: 'completed',
        progress: 100
      }));
      options.onComplete?.();

    } catch (error) {
      // 如果是被取消的，不更新状态
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      setState(prev => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : '未知错误'
      }));
      options.onFail?.(error instanceof Error ? error : new Error('未知错误'));
    } finally {
      abortControllerRef.current = null;
    }
  }, [options]);

  const stopPolling = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      status: 'idle',
      progress: 0
    }));
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setState({
      status: 'idle',
      progress: 0
    });
  }, [stopPolling]);

  return {
    state,
    startPolling,
    stopPolling,
    reset,
    isPolling: state.status === 'starting' || state.status === 'running'
  };
}