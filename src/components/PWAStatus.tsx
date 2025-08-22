'use client';

import { usePWA } from '@/hooks/usePWA';

export default function PWAStatus() {
  const { isInstalled, isOffline, isIOS } = usePWA();

  return (
    <div className="fixed top-4 right-4 z-40">
      {/* Offline Indicator */}
      {isOffline && (
        <div className="mb-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>离线模式</span>
          </div>
        </div>
      )}

      {/* PWA Installed Indicator - 隐藏，因为已安装不需要显示 */}
      {/* 
      {isInstalled && (
        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{isIOS ? 'PWA 已安装' : '应用已安装'}</span>
          </div>
        </div>
      )}
      */}
    </div>
  );
}