'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'filled' | 'underlined';
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
  isLoading?: boolean;
  autoResize?: boolean;
}

const textareaVariants = {
  default: 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  filled: 'bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-blue-500',
  underlined:
    'bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-500 rounded-none focus:ring-0 px-0'
};

const textareaSizes = {
  sm: 'px-3 py-2 text-sm min-h-[4rem]',
  md: 'px-4 py-3 text-base min-h-[6rem]',
  lg: 'px-6 py-4 text-lg min-h-[8rem]'
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = 'default',
      inputSize = 'md',
      error = false,
      errorMessage,
      label,
      helperText,
      fullWidth = false,
      isLoading = false,
      autoResize = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseTextareaClasses = [
      'w-full font-sans leading-normal text-gray-900 dark:text-white',
      'border border-solid rounded-lg transition-all duration-200',
      'outline-none focus:ring-2 focus:ring-opacity-20',
      'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-70',
      'placeholder:text-gray-500 placeholder:opacity-100',
      'bg-white dark:bg-gray-800',
      'pointer-events-auto',
      'relative z-10',
      autoResize ? 'resize-none overflow-hidden' : 'resize-y'
    ];

    const variantClasses = textareaVariants[variant];
    const sizeClasses = textareaSizes[inputSize];

    const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

    const textareaClassName = cn(
      baseTextareaClasses,
      variantClasses,
      sizeClasses,
      errorClasses,
      className
    );

    const wrapperClassName = cn('flex flex-col gap-2', fullWidth ? 'w-full' : '');

    return (
      <div className={wrapperClassName}>
        {/* 标签 */}
        {label && (
          <label className="text-sm font-medium text-gray-900 leading-tight cursor-pointer">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* 文本框容器 */}
        <div className="relative flex w-full">
          {/* 文本框 */}
          <textarea
            ref={ref}
            className={textareaClassName}
            disabled={disabled || isLoading}
            {...props}
          />

          {/* 加载状态图标 */}
          {isLoading && (
            <div
              className={cn(
                'absolute flex items-center justify-center text-blue-500 pointer-events-none z-10',
                inputSize === 'sm'
                  ? 'top-2 right-2'
                  : inputSize === 'lg'
                    ? 'top-4 right-4'
                    : 'top-3 right-3'
              )}
            >
              <svg
                className={cn(
                  'animate-spin',
                  inputSize === 'sm'
                    ? 'w-3.5 h-3.5'
                    : inputSize === 'lg'
                      ? 'w-4.5 h-4.5'
                      : 'w-4 h-4'
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
                <span className="text-xs text-gray-500 leading-normal">{helperText}</span>
              )
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
