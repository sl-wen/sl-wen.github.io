'use client';

import React, { useState, useEffect } from 'react';

interface Message {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  content: string;
  duration?: number;
}

const StatusMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // 监听全局消息事件
    const handleMessage = (event: CustomEvent<Message>) => {
      const message = event.detail;
      setMessages(prev => [...prev, message]);
      
      // 自动移除消息
      if (message.duration !== 0) {
        setTimeout(() => {
          removeMessage(message.id);
        }, message.duration || 3000);
      }
    };

    window.addEventListener('showMessage', handleMessage as EventListener);
    
    return () => {
      window.removeEventListener('showMessage', handleMessage as EventListener);
    };
  }, []);

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const getMessageClasses = (type: string) => {
    const baseClasses = 'alert';
    switch (type) {
      case 'success':
        return `${baseClasses} alert-success`;
      case 'warning':
        return `${baseClasses} alert-warning`;
      case 'error':
        return `${baseClasses} alert-error`;
      default:
        return `${baseClasses} alert-info`;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`${getMessageClasses(message.type)} animate-slide-up shadow-lg`}
        >
          <div className="flex items-start">
            <span className="mr-2 text-lg">{getIcon(message.type)}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{message.content}</p>
            </div>
            <button
              onClick={() => removeMessage(message.id)}
              className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <span className="sr-only">关闭</span>
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// 导出工具函数，用于显示消息
export const showMessage = (
  type: 'info' | 'success' | 'warning' | 'error',
  content: string,
  duration?: number
) => {
  const message: Message = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    type,
    content,
    duration,
  };

  const event = new CustomEvent('showMessage', { detail: message });
  window.dispatchEvent(event);
};

export default StatusMessages; 