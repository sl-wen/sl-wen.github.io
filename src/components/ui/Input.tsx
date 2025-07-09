import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'filled' | 'underlined';
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
}

const inputVariants = {
  default: 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  filled: 'bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-blue-500',
  underlined: 'bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-500 rounded-none focus:ring-0 px-0'
};

const inputSizes = {
  sm: 'px-3 py-2 text-sm min-h-[2rem]',
  md: 'px-4 py-3 text-base min-h-[2.5rem]',
  lg: 'px-6 py-4 text-lg min-h-[3rem]'
};

const iconPositionClasses = {
  sm: { left: 'left-2', right: 'right-2', paddingLeft: 'pl-8', paddingRight: 'pr-8' },
  md: { left: 'left-3', right: 'right-3', paddingLeft: 'pl-10', paddingRight: 'pr-10' },
  lg: { left: 'left-4', right: 'right-4', paddingLeft: 'pl-12', paddingRight: 'pr-12' }
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  inputSize = 'md',
  error = false,
  errorMessage,
  label,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseInputClasses = [
    'w-full font-sans leading-normal text-gray-900 dark:text-white',
    'border border-solid rounded-lg transition-all duration-200',
    'outline-none focus:ring-2 focus:ring-opacity-20',
    'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-70',
    'placeholder:text-gray-500 placeholder:opacity-100',
    // 确保输入框可以接收输入
    'bg-white dark:bg-gray-800',
    // 重要：确保pointer-events正常
    'pointer-events-auto',
    // 确保z-index正确
    'relative z-10'
  ];

  const variantClasses = inputVariants[variant];
  const sizeClasses = inputSizes[inputSize];
  const iconClasses = iconPositionClasses[inputSize];
  
  // 根据图标调整内边距
  let paddingClasses = '';
  if (leftIcon && rightIcon) {
    paddingClasses = `${iconClasses.paddingLeft} ${iconClasses.paddingRight}`;
  } else if (leftIcon) {
    paddingClasses = iconClasses.paddingLeft;
  } else if (rightIcon || isLoading) {
    paddingClasses = iconClasses.paddingRight;
  }

  const errorClasses = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
    : '';

  const inputClassName = cn(
    baseInputClasses,
    variantClasses,
    sizeClasses,
    paddingClasses,
    errorClasses,
    className
  );

  const wrapperClassName = cn(
    'flex flex-col gap-2',
    fullWidth ? 'w-full' : ''
  );

  return (
    <div className={wrapperClassName}>
      {/* 标签 */}
      {label && (
        <label className="text-sm font-medium text-gray-900 leading-tight cursor-pointer">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* 输入框容器 */}
      <div className="relative flex items-center w-full">
        {/* 左侧图标 */}
        {leftIcon && (
          <div className={cn(
            'absolute flex items-center justify-center text-gray-500 pointer-events-none z-20',
            iconClasses.left
          )}>
            <div className={cn(
              inputSize === 'sm' ? 'w-3.5 h-3.5' : 
              inputSize === 'lg' ? 'w-4.5 h-4.5' : 'w-4 h-4'
            )}>
              {leftIcon}
            </div>
          </div>
        )}
        
        {/* 输入框 */}
        <input
          ref={ref}
          className={inputClassName}
          disabled={disabled || isLoading}
          onInput={(e) => {
            // 确保输入事件正常触发
            console.debug('Input event fired:', e.currentTarget.value);
          }}
          {...props}
        />
        
        {/* 加载状态图标 */}
        {isLoading && (
          <div className={cn(
            'absolute flex items-center justify-center text-blue-500 pointer-events-none z-20',
            iconClasses.right
          )}>
            <svg 
              className={cn(
                'animate-spin',
                inputSize === 'sm' ? 'w-3.5 h-3.5' : 
                inputSize === 'lg' ? 'w-4.5 h-4.5' : 'w-4 h-4'
              )}
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
        
        {/* 右侧图标 */}
        {!isLoading && rightIcon && (
          <div className={cn(
            'absolute flex items-center justify-center text-gray-500 pointer-events-none z-20',
            iconClasses.right
          )}>
            <div className={cn(
              inputSize === 'sm' ? 'w-3.5 h-3.5' : 
              inputSize === 'lg' ? 'w-4.5 h-4.5' : 'w-4 h-4'
            )}>
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {/* 帮助文本/错误信息 */}
      {(errorMessage || helperText) && (
        <div className="flex gap-1 -mt-1">
          {error && errorMessage ? (
            <span className="text-xs text-red-600 leading-normal font-medium">
              {errorMessage}
            </span>
          ) : (
            helperText && (
              <span className="text-xs text-gray-500 leading-normal">
                {helperText}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 