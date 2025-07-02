import React from 'react';
import '../styles/Loading.css';

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
  const renderSpinner = () => (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );

  const renderDots = () => (
    <div className={`loading-dots ${size}`}>
      <div className="dot dot-1"></div>
      <div className="dot dot-2"></div>
      <div className="dot dot-3"></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`loading-pulse ${size}`}>
      <div className="pulse-circle pulse-1"></div>
      <div className="pulse-circle pulse-2"></div>
      <div className="pulse-circle pulse-3"></div>
    </div>
  );

  const renderSkeleton = () => (
    <div className={`loading-skeleton ${size}`}>
      <div className="skeleton-line skeleton-title"></div>
      <div className="skeleton-line skeleton-text"></div>
      <div className="skeleton-line skeleton-text short"></div>
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
    <div className={`loading loading-${variant} loading-${size}`}>
      {renderLoadingContent()}
      {variant !== 'skeleton' && (
        <p className="loading-text">
          {text}
          <span className="loading-dots-text">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
      )}

      {/* 装饰性背景 */}
      <div className="loading-decoration">
        <div className="decoration-particle particle-1"></div>
        <div className="decoration-particle particle-2"></div>
        <div className="decoration-particle particle-3"></div>
        <div className="decoration-particle particle-4"></div>
      </div>
    </div>
  );
};

// 简单的加载组件，用于保持向后兼容
export const SimpleLoading: React.FC = () => (
  <div className="loading">
    <div className="octocatContainer">
      <div className="octocatArm"></div>
    </div>
    <p className="loadingText">加载中...</p>
  </div>
);

export default Loading;
