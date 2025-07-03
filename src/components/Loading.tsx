import React from 'react';

interface LoadingProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
}

const Loading: React.FC<LoadingProps> = ({
  text = '加载中...',
  size = 'medium',
  variant = 'spinner'
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

  const renderSpinner = () => (
    <div className={`loading-spinner ${getSizeClasses(size)}`}></div>
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      <div className={`bg-primary-600 rounded-full ${size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'} animate-bounce`}></div>
      <div className={`bg-primary-600 rounded-full ${size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'} animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
      <div className={`bg-primary-600 rounded-full ${size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'} animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
    </div>
  );

  const renderPulse = () => (
    <div className="flex space-x-1">
      <div className={`bg-primary-600 rounded-full ${size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'} animate-pulse`}></div>
      <div className={`bg-primary-600 rounded-full ${size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'} animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
      <div className={`bg-primary-600 rounded-full ${size === 'small' ? 'w-2 h-2' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'} animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-3 w-full max-w-sm">
      <div className="bg-gray-200 rounded-md h-4 animate-pulse"></div>
      <div className="bg-gray-200 rounded-md h-4 animate-pulse w-3/4"></div>
      <div className="bg-gray-200 rounded-md h-4 animate-pulse w-1/2"></div>
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

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${size === 'small' ? 'p-4' : size === 'large' ? 'p-12' : 'p-8'}`}>
      {renderLoadingContent()}
      {variant !== 'skeleton' && (
        <p className={`mt-4 text-gray-600 font-medium ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'}`}>
          {text}
          <span className="inline-flex">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
          </span>
        </p>
      )}

      {/* 装饰性背景 */}
      <div className="absolute inset-0 -z-10 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
      </div>
    </div>
  );
};

// 简单的加载组件，用于保持向后兼容
export const SimpleLoading: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="loading-spinner w-8 h-8 mb-4"></div>
    <p className="text-gray-600 font-medium">加载中...</p>
  </div>
);

export default Loading;
