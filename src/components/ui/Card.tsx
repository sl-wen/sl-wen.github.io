'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

const cardVariants = {
  default: 'bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm',
  outlined:
    'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-none',
  elevated:
    'bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-md',
  filled: 'bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-800 shadow-sm'
};

const cardSizes = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6 md:p-8'
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'md',
  children,
  header,
  footer,
  hoverable = false,
  interactive = false,
  className = '',
  onClick
}) => {
  const baseClasses = ['rounded-xl transition-all duration-200', 'overflow-hidden'];

  const variantClasses = cardVariants[variant];
  const sizeClasses = cardSizes[size];

  const interactiveClasses =
    interactive || hoverable
      ? 'cursor-pointer hover:shadow-md hover:border-gray-300/80 dark:hover:border-gray-700 hover:-translate-y-0.5'
      : '';

  const focusClasses = interactive
    ? 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
    : '';

  const cardClassName = cn(
    baseClasses,
    variantClasses,
    sizeClasses,
    interactiveClasses,
    focusClasses,
    className
  );

  const Component = interactive ? 'button' : 'div';

  return (
    <Component className={cardClassName} tabIndex={interactive ? 0 : undefined} onClick={onClick}>
      {header && (
        <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">{header}</div>
      )}

      <div className={size === 'sm' ? '' : undefined}>{children}</div>

      {footer && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4">{footer}</div>
      )}
    </Component>
  );
};

export default Card;
