import React from 'react';

interface StatusMessageProps {
  message: string;
  onRetry?: () => void;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="card max-w-md w-full text-center">
        {/* 错误图标 */}
        <div className="text-6xl mb-4 opacity-30">
          ⚠️
        </div>
        
        {/* 错误消息 */}
        <p className="text-gray-700 dark:text-gray-300 mb-6 text-base leading-relaxed">
          {message}
        </p>
        
        {/* 重试按钮 */}
        {onRetry && (
          <button 
            onClick={onRetry}
            className="btn-primary px-6 py-2 text-sm font-medium hover:transform hover:scale-105 transition-all duration-200"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
};

export default StatusMessage;
