import React, { memo } from 'react';

interface LoadingProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  className?: string;
  showBackground?: boolean;
}

const Loading: React.FC<LoadingProps> = memo(({
  text = '加载中…',
  size = 'medium',
  variant = 'spinner',
  className = '',
  showBackground = false
}) => {
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'w-4 h-4';
      case 'large':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  const dotSize = size === 'small' ? 'w-1.5 h-1.5' : size === 'large' ? 'w-3 h-3' : 'w-2 h-2';

  const renderSpinner = () => (
    <div
      className={`${getSizeClasses(size)} border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label={text}
    ></div>
  );

  const renderDots = () => (
    <div className="flex space-x-1.5" role="status" aria-label={text}>
      <div className={`bg-blue-600 dark:bg-blue-400 rounded-full ${dotSize} animate-pulse`}></div>
      <div
        className={`bg-blue-600 dark:bg-blue-400 rounded-full ${dotSize} animate-pulse`}
        style={{ animationDelay: '0.2s' }}
      ></div>
      <div
        className={`bg-blue-600 dark:bg-blue-400 rounded-full ${dotSize} animate-pulse`}
        style={{ animationDelay: '0.4s' }}
      ></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`${getSizeClasses(size)} relative`} role="status" aria-label={text}>
      <div className="absolute inset-0 bg-blue-600/20 dark:bg-blue-400/20 rounded-full animate-ping"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1/2 h-1/2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-3 w-full max-w-sm" role="status" aria-label={text}>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-md h-4 animate-pulse"></div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-md h-4 animate-pulse w-3/4"></div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-md h-4 animate-pulse w-1/2"></div>
    </div>
  );

  const renderLoadingContent = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  const containerClasses = [
    'flex flex-col items-center justify-center',
    size === 'small' ? 'p-4' : size === 'large' ? 'p-12' : 'p-8',
    'relative',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {renderLoadingContent()}
      {variant !== 'skeleton' && text && (
        <p
          className={`mt-3 text-gray-500 dark:text-gray-400 ${size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'}`}
        >
          {text}
        </p>
      )}
    </div>
  );
});

// 简单的加载组件，用于保持向后兼容
export const SimpleLoading: React.FC = memo(() => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-gray-500 dark:text-gray-400 text-sm">加载中…</p>
  </div>
));

SimpleLoading.displayName = 'SimpleLoading';
Loading.displayName = 'Loading';

export default Loading;
