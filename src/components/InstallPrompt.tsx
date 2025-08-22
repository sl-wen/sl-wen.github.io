'use client';

import { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(true);
  const { isInstallable, isInstalled, isIOS, installPWA, getInstallInstructions } = usePWA();

  const handleInstallClick = async () => {
    if (!isIOS) {
      const success = await installPWA();
      if (success) {
        setShowPrompt(false);
      }
    } else {
      // iOS 设备显示安装说明
      localStorage.setItem('ios-install-prompt-shown', 'true');
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem('ios-install-prompt-shown', 'true');
    }
  };

  // 不显示提示的条件
  if (!showPrompt || isInstalled) {
    return null;
  }

  // 对于 iOS，检查是否已经显示过
  if (isIOS && typeof window !== 'undefined') {
    const hasShownIOSPrompt = localStorage.getItem('ios-install-prompt-shown');
    if (hasShownIOSPrompt) {
      return null;
    }
  }

  // 对于非 iOS 设备，只有在可安装时才显示
  if (!isIOS && !isInstallable) {
    return null;
  }

  const instructions = getInstallInstructions();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {instructions.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              将此博客添加到您的主屏幕，以便快速访问
            </p>
            
            {isIOS && (
              <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 space-y-1">
                {instructions.steps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            {!isIOS && (
              <button
                onClick={handleInstallClick}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-800 dark:hover:text-blue-300"
              >
                安装
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}