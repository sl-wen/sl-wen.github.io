'use client';

import { useState, useEffect } from 'react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 检查初始网络状态
      setIsOnline(navigator.onLine);

      // 监听网络状态变化
      const handleOnline = () => {
        setIsOnline(true);
        setShowOfflineMessage(false);
        console.log('Network is online');
      };

      const handleOffline = () => {
        setIsOnline(false);
        setShowOfflineMessage(true);
        console.log('Network is offline');
      };

      // 添加事件监听器
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // 清理事件监听器
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // 如果在线且没有显示离线消息，则不渲染任何内容
  if (isOnline && !showOfflineMessage) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isOnline && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center space-x-2 animate-pulse">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
            />
          </svg>
          <span className="text-sm font-medium">您当前处于离线状态</span>
        </div>
      )}
      
      {isOnline && showOfflineMessage && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center space-x-2">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-medium">网络连接已恢复</span>
        </div>
      )}
    </div>
  );
}