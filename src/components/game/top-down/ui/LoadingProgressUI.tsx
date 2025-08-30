'use client';

import React, { useEffect, useState } from 'react';
import { LoadProgress, ResourceItem, ResourceLoadEvent } from '../systems/ResourceLoader';

interface LoadingProgressUIProps {
  progress: LoadProgress;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const LoadingProgressUI: React.FC<LoadingProgressUIProps> = ({
  progress,
  onComplete,
  onError
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 格式化时间
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取进度条颜色
  const getProgressColor = (percentage: number): string => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    if (percentage < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // 获取状态图标
  const getStatusIcon = (item?: ResourceItem): string => {
    if (!item) return '⏳';
    switch (item.status) {
      case 'loading': return '🔄';
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'retrying': return '🔄';
      default: return '⏳';
    }
  };

  // 获取状态颜色
  const getStatusColor = (item?: ResourceItem): string => {
    if (!item) return 'text-gray-400';
    switch (item.status) {
      case 'loading': return 'text-blue-400';
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'retrying': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // 处理错误
  useEffect(() => {
    if (progress.failed > 0 && !errorMessage) {
      const error = `${progress.failed} 个资源加载失败`;
      setErrorMessage(error);
      onError?.(error);
    }
  }, [progress.failed, errorMessage, onError]);

  // 处理完成
  useEffect(() => {
    if (progress.percentage === 100 && progress.failed === 0) {
      setTimeout(() => {
        onComplete?.();
      }, 1000); // 延迟1秒显示完成动画
    }
  }, [progress.percentage, progress.failed, onComplete]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">🎮 游戏加载中</h2>
          <p className="text-gray-400 text-sm">正在加载游戏资源...</p>
        </div>

        {/* 主进度条 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>总体进度</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out ${getProgressColor(progress.percentage)}`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{progress.loaded}</div>
            <div className="text-xs text-gray-400">已加载</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{progress.total}</div>
            <div className="text-xs text-gray-400">总计</div>
          </div>
          {progress.failed > 0 && (
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{progress.failed}</div>
              <div className="text-xs text-gray-400">失败</div>
            </div>
          )}
          {progress.retrying > 0 && (
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{progress.retrying}</div>
              <div className="text-xs text-gray-400">重试中</div>
            </div>
          )}
        </div>

        {/* 当前加载项 */}
        {progress.currentItem && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">当前加载:</span>
              <span className={`text-sm ${getStatusColor(progress.currentItem)}`}>
                {getStatusIcon(progress.currentItem)}
              </span>
            </div>
            <div className="text-xs text-gray-300 truncate">
              {progress.currentItem.key}
            </div>
            <div className="text-xs text-gray-400">
              {progress.currentItem.type} • {progress.currentItem.url.split('/').pop()}
            </div>
          </div>
        )}

        {/* 预估时间 */}
        {progress.estimatedTime && progress.estimatedTime > 0 && (
          <div className="text-center text-sm text-gray-400 mb-4">
            预计剩余时间: {formatTime(progress.estimatedTime)}
          </div>
        )}

        {/* 错误信息 */}
        {errorMessage && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-red-200 text-sm">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* 详细信息切换 */}
        <div className="text-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            {showDetails ? '隐藏详细信息' : '显示详细信息'}
          </button>
        </div>

        {/* 详细信息 */}
        {showDetails && (
          <div className="mt-4 bg-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
            <h4 className="text-sm font-medium text-white mb-2">加载详情:</h4>
            <div className="space-y-1">
              {Array.from({ length: progress.total }, (_, i) => {
                const item = progress.currentItem; // 这里应该从资源列表获取
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">资源 {i + 1}</span>
                    <span className="text-gray-400">加载中...</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 完成动画 */}
        {progress.percentage === 100 && progress.failed === 0 && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-white font-bold">加载完成!</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 简化的加载进度组件
export const SimpleLoadingProgress: React.FC<{ progress: LoadProgress }> = ({ progress }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center mb-4">
          <div className="text-2xl mb-2">🎮</div>
          <div className="text-white font-bold">加载中...</div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>进度</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        <div className="text-center text-sm text-gray-400">
          {progress.loaded} / {progress.total} 资源已加载
        </div>
      </div>
    </div>
  );
};

// 移动端优化的加载进度组件
export const MobileLoadingProgress: React.FC<{ progress: LoadProgress }> = ({ progress }) => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="w-full max-w-xs mx-4">
        {/* 游戏Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎮</div>
          <div className="text-white text-xl font-bold mb-2">游戏加载中</div>
          <div className="text-gray-400 text-sm">请稍候...</div>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-300 mb-3">
            <span>加载进度</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-400">{progress.loaded}</div>
            <div className="text-xs text-gray-400">已加载</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-400">{progress.total}</div>
            <div className="text-xs text-gray-400">总计</div>
          </div>
        </div>

        {/* 当前加载项 */}
        {progress.currentItem && (
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-sm text-gray-300 mb-1">正在加载:</div>
            <div className="text-xs text-gray-400 truncate">
              {progress.currentItem.key}
            </div>
          </div>
        )}

        {/* 完成提示 */}
        {progress.percentage === 100 && (
          <div className="text-center mt-6">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-white font-bold">加载完成!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingProgressUI;