import React from 'react';

interface ProgressIndicatorProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  isVisible,
  message = '处理中...',
  progress
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {message}
            </p>
            {progress !== undefined && (
              <div className="mt-2">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round(progress || 0)}%
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>长内容可能需要更多时间处理</p>
          <p>请耐心等待，不要关闭页面</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;