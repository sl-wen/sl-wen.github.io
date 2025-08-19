import React, { useState } from 'react';
import { NovelDownloadManager } from './NovelDownloadManager';

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

interface NovelDownloadExampleProps {
  novels: Novel[];
  apiBase: string;
}

export function NovelDownloadExample({ novels, apiBase }: NovelDownloadExampleProps) {
  const {
    downloadTasks,
    downloadingIds,
    startDownload,
    cancelDownload,
    retryDownload,
    isDownloading
  } = NovelDownloadManager({
    apiBase,
    onDownloadComplete: (taskId, novel, format) => {
      console.log(`下载完成: ${novel.title} (${format})`);
    },
    onDownloadError: (taskId, error) => {
      console.error(`下载失败: ${taskId}`, error);
    }
  });

  return (
    <div className="space-y-4">
      {/* 小说列表 */}
      {novels.map((novel, idx) => (
        <div key={idx} className="p-6 border rounded-lg shadow-sm bg-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="font-semibold text-xl mb-2">
                {novel.title}
                <span className="text-sm text-gray-500 ml-2">by {novel.author}</span>
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
            <div className="flex gap-1 items-center">
              {(['txt', 'epub'] as const).map((format) => {
                const taskId = `${novel.title}_${novel.author}_${format}_${Date.now()}`;
                const isDownloadingThis = isDownloading(taskId);
                const downloadTask = downloadTasks.find(task => 
                  task.novel.title === novel.title && 
                  task.novel.author === novel.author && 
                  task.format === format
                );

                return (
                  <button
                    key={format}
                    onClick={() => {
                      if (downloadTask?.state.status === 'failed') {
                        retryDownload(downloadTask.id);
                      } else if (!isDownloadingThis) {
                        startDownload(novel, format);
                      }
                    }}
                    disabled={isDownloadingThis || !novel.url}
                    className={`px-3 py-1 text-sm rounded transition ${
                      isDownloadingThis
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : downloadTask?.state.status === 'failed'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {downloadTask?.state.status === 'starting' && `启动${format.toUpperCase()}...`}
                    {downloadTask?.state.status === 'running' && `下载中`}
                    {downloadTask?.state.status === 'completed' && `已完成`}
                    {downloadTask?.state.status === 'failed' && `失败，重试`}
                    {!downloadTask?.state.status || downloadTask?.state.status === 'idle' ? `下载${format.toUpperCase()}` : null}
                  </button>
                );
              })}

              {/* 进度提示 */}
              {downloadTasks.map(task => {
                if (task.novel.title === novel.title && task.novel.author === novel.author) {
                  return (
                    <span key={task.id} className="text-xs text-gray-500 ml-2">
                      {task.state.status === 'starting' && '启动任务中'}
                      {task.state.status === 'running' &&
                        `${task.state.completedChapters || 0}/${task.state.totalChapters || 0} 章 ${task.state.progress ?? 0}%`}
                      {task.state.status === 'failed' && (task.state.error || '下载失败')}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      ))}

      {/* 下载任务列表 */}
      {downloadTasks.length > 0 && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">下载任务</h3>
          <div className="space-y-2">
            {downloadTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex-1">
                  <div className="font-medium">{task.novel.title}</div>
                  <div className="text-sm text-gray-600">
                    {task.novel.author} - {task.format.toUpperCase()}
                  </div>
                  {task.state.status === 'running' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.state.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {task.state.completedChapters || 0}/{task.state.totalChapters || 0} 章 ({task.state.progress}%)
                      </div>
                    </div>
                  )}
                  {task.state.status === 'failed' && (
                    <div className="text-sm text-red-600 mt-1">
                      错误: {task.state.error}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {task.state.status === 'failed' && (
                    <button
                      onClick={() => retryDownload(task.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      重试
                    </button>
                  )}
                  <button
                    onClick={() => cancelDownload(task.id)}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    取消
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}