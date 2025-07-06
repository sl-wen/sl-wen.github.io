import React from 'react';
import { cn } from '../../utils/cn';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const alertVariants = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800'
};

const alertIconColors = {
  info: 'text-blue-500',
  success: 'text-green-500', 
  warning: 'text-yellow-500',
  error: 'text-red-500'
};

const alertSizes = {
  sm: 'p-3 text-sm',
  md: 'p-4 text-base',
  lg: 'p-6 text-lg'
};

// 默认图标组件
const defaultIcons = {
  info: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  success: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  warning: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  error: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  )
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  size = 'md',
  title,
  children,
  icon,
  onClose,
  className = ''
}) => {
  const baseClasses = [
    'border rounded-lg flex gap-3',
    'transition-all duration-200'
  ];

  const variantClasses = alertVariants[variant];
  const sizeClasses = alertSizes[size];
  const iconColorClasses = alertIconColors[variant];

  const alertClassName = cn(
    baseClasses,
    variantClasses,
    sizeClasses,
    className
  );

  const DefaultIcon = defaultIcons[variant];

  return (
    <div className={alertClassName} role="alert">
      {/* 图标 */}
      <div className={cn('flex-shrink-0 mt-0.5', iconColorClasses)}>
        {icon || <DefaultIcon />}
      </div>
      
      {/* 内容 */}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="font-semibold mb-1 leading-tight">
            {title}
          </h3>
        )}
        <div className="leading-relaxed">
          {children}
        </div>
      </div>
      
      {/* 关闭按钮 */}
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            'flex-shrink-0 p-1 rounded-md transition-colors duration-200',
            'hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-current focus:ring-opacity-20',
            iconColorClasses
          )}
          aria-label="关闭"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert; 