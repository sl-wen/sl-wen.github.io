'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false,
    isIOS: false,
    isAndroid: false,
    deferredPrompt: null
  });

  useEffect(() => {
    // 检测设备类型
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    
    // 检测是否已安装为 PWA
    const isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // 检测网络状态
    const isOffline = !navigator.onLine;

    setState(prev => ({
      ...prev,
      isIOS,
      isAndroid,
      isInstalled,
      isOffline
    }));

    // 监听安装提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setState(prev => ({
        ...prev,
        isInstallable: true,
        deferredPrompt: promptEvent
      }));
    };

    // 监听网络状态变化
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    // 监听 PWA 安装完成
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        deferredPrompt: null
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (state.deferredPrompt) {
      state.deferredPrompt.prompt();
      const { outcome } = await state.deferredPrompt.userChoice;
      
      setState(prev => ({
        ...prev,
        deferredPrompt: null,
        isInstallable: false
      }));

      return outcome === 'accepted';
    }
    return false;
  };

  const getInstallInstructions = () => {
    if (state.isIOS) {
      return {
        title: '安装到主屏幕',
        steps: [
          '1. 点击底部的分享按钮 📤',
          '2. 向下滚动并选择"添加到主屏幕"',
          '3. 点击"添加"完成安装'
        ]
      };
    } else if (state.isAndroid) {
      return {
        title: '安装应用',
        steps: [
          '1. 点击浏览器菜单 ⋮',
          '2. 选择"安装应用"或"添加到主屏幕"',
          '3. 确认安装'
        ]
      };
    }
    return {
      title: '安装应用',
      steps: ['点击安装按钮将应用添加到您的设备']
    };
  };

  return {
    ...state,
    installPWA,
    getInstallInstructions
  };
}