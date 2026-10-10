'use client';

import React, { useState, useEffect } from 'react';

/**
 * StatusMessages v3：emoji 改 SVG stroke 图标，容器加 dark mode
 */
interface StatusMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  content: string;
}

interface StatusMessagesProps {
  className?: string;
}

// 兼容旧调用：从 window 派发的事件读取消息
const StatusMessages: React.FC<StatusMessagesProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<StatusMessage[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as StatusMessage;
      if (!detail?.id) return;
      setMessages((prev) => [...prev, detail]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== detail.id));
      }, 4000);
    };
    window.addEventListener('status-message', handler);
    return () => window.removeEventListener('status-message', handler);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        );
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-500 dark:text-green-400';
      case 'warning':
        return 'text-amber-500 dark:text-amber-400';
      case 'error':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-blue-500 dark:text-blue-400';
    }
  };

  const getContainerClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-white dark:bg-gray-900 border-green-200 dark:border-green-900';
      case 'warning':
        return 'bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-900';
      case 'error':
        return 'bg-white dark:bg-gray-900 border-red-200 dark:border-red-900';
      default:
        return 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-900';
    }
  };

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {messages.map((message) => (
        <div
          key={message.id}
          role="status"
          className={`flex items-start gap-2.5 border rounded-xl px-4 py-3 shadow-lg ${getContainerClasses(message.type)} ${className}`}
        >
          <span className={`shrink-0 ${getIconColor(message.type)}`}>
            {getIcon(message.type)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message.content}</p>
          </div>
          <button
            onClick={() => setMessages((prev) => prev.filter((m) => m.id !== message.id))}
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="关闭"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default StatusMessages;
