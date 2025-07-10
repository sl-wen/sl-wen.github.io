import React from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-md hover:shadow-lg border-blue-600',
  secondary: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 shadow-sm hover:shadow-md',
  ghost: 'bg-transparent hover:bg-blue-50 text-blue-600 hover:text-blue-700 border-transparent',
  danger: 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-md hover:shadow-lg border-red-600',
  success: 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white shadow-md hover:shadow-lg border-green-600',
  warning: 'bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 text-white shadow-md hover:shadow-lg border-yellow-600'
};

const buttonSizes = {
  sm: 'px-3 py-2 text-sm min-h-[2rem]',
  md: 'px-4 py-3 text-base min-h-[2.5rem]',
  lg: 'px-6 py-4 text-lg min-h-[3rem]',
  xl: 'px-8 py-5 text-xl min-h-[3.5rem]'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseClasses = [
    'relative inline-flex items-center justify-center gap-2',
    'font-medium leading-6 text-center no-underline',
    'border-2 border-solid rounded-lg cursor-pointer',
    'transition-all duration-200 ease-out outline-none',
    'select-none whitespace-nowrap overflow-hidden',
    'focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2',
    'disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-[0.98] hover:-translate-y-0.5',
    'touch-manipulation tap-highlight-transparent'
  ];

  const variantClasses = buttonVariants[variant];
  const sizeClasses = buttonSizes[size];
  const widthClasses = fullWidth ? 'w-full' : '';
  const loadingClasses = isLoading ? 'pointer-events-none' : '';

  const combinedClassName = cn(
    baseClasses,
    variantClasses,
    sizeClasses,
    widthClasses,
    loadingClasses,
    className
  );

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* 加载状态图标 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="w-4 h-4 animate-spin" 
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="31.416"
              strokeDashoffset="31.416"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
      
      {/* 左侧图标 */}
      {!isLoading && leftIcon && (
        <span className="flex items-center justify-center flex-shrink-0 -ml-1">
          <div className="w-4 h-4">{leftIcon}</div>
        </span>
      )}
      
      {/* 按钮文本 */}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      
      {/* 右侧图标 */}
      {!isLoading && rightIcon && (
        <span className="flex items-center justify-center flex-shrink-0 -mr-1">
          <div className="w-4 h-4">{rightIcon}</div>
        </span>
      )}
    </button>
  );
};

export default Button; 