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
  default: 'bg-white border border-gray-200 shadow-sm',
  outlined: 'bg-white border-2 border-gray-300 shadow-none',
  elevated: 'bg-white border border-gray-100 shadow-lg',
  filled: 'bg-gray-50 border border-gray-200 shadow-sm'
};

const cardSizes = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
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
  const baseClasses = [
    'rounded-lg transition-all duration-200',
    'overflow-hidden'
  ];

  const variantClasses = cardVariants[variant];
  const sizeClasses = cardSizes[size];
  
  const interactiveClasses = interactive || hoverable 
    ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' 
    : '';
  
  const focusClasses = interactive 
    ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20' 
    : '';

  const cardClassName = cn(
    baseClasses,
    variantClasses,
    interactiveClasses,
    focusClasses,
    className
  );

  const contentClassName = cn(sizeClasses);

  const Component = interactive ? 'button' : 'div';

  return (
    <Component
      className={cardClassName}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
    >
      {header && (
        <div className={cn(
          'border-b border-gray-200 -m-6 mb-6 p-6',
          variant === 'filled' ? 'bg-white border-gray-300' : ''
        )}>
          {header}
        </div>
      )}
      
      <div className={contentClassName}>
        {children}
      </div>
      
      {footer && (
        <div className={cn(
          'border-t border-gray-200 -m-6 mt-6 p-6',
          variant === 'filled' ? 'bg-white border-gray-300' : ''
        )}>
          {footer}
        </div>
      )}
    </Component>
  );
};

export default Card; 