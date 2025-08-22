'use client';

import { useEffect, useState } from 'react';

// PWA安装提示事件接口 - 扩展标准Event接口以支持PWA安装功能
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]; // 支持的平台列表
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'; // 用户选择结果：接受或拒绝
    platform: string; // 选择的平台
  }>;
  prompt(): Promise<void>; // 显示安装提示的方法
}

// PWA状态接口 - 定义PWA相关的所有状态信息
interface PWAState {
  isInstallable: boolean; // 是否可以安装为PWA
  isInstalled: boolean; // 是否已经安装为PWA
  isOffline: boolean; // 是否处于离线状态
  isIOS: boolean; // 是否为iOS设备
  isAndroid: boolean; // 是否为Android设备
  deferredPrompt: BeforeInstallPromptEvent | null; // 延迟的安装提示事件
}

// PWA功能Hook - 提供PWA安装、状态检测和离线功能管理
export function usePWA() {
  // 初始化PWA状态
  const [state, setState] = useState<PWAState>({
    isInstallable: false, // 初始不可安装
    isInstalled: false, // 初始未安装
    isOffline: false, // 初始在线状态
    isIOS: false, // 初始非iOS设备
    isAndroid: false, // 初始非Android设备
    deferredPrompt: null // 初始无安装提示
  });

  useEffect(() => {
    // 检测用户设备类型
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent); // 检测iOS设备
    const isAndroid = /Android/.test(userAgent); // 检测Android设备
    
    // 检测应用是否已安装为PWA
    const isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches || // 标准PWA检测
      (window.navigator as any).standalone === true; // iOS Safari检测

    // 检测当前网络连接状态
    const isOffline = !navigator.onLine;

    // 更新设备和安装状态
    setState(prev => ({
      ...prev,
      isIOS,
      isAndroid,
      isInstalled,
      isOffline
    }));

    // PWA安装提示事件处理器 - 拦截浏览器默认的安装提示
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // 阻止浏览器默认的安装提示
      const promptEvent = e as BeforeInstallPromptEvent;
      setState(prev => ({
        ...prev,
        isInstallable: true, // 标记为可安装
        deferredPrompt: promptEvent // 保存安装提示事件
      }));
    };

    // 网络连接恢复事件处理器
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
    };

    // 网络连接断开事件处理器
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    // PWA安装完成事件处理器
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true, // 标记为已安装
        isInstallable: false, // 不再可安装
        deferredPrompt: null // 清除安装提示
      }));
    };

    // 添加事件监听器
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 清理事件监听器
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // PWA安装函数 - 触发PWA安装流程
  const installPWA = async () => {
    if (state.deferredPrompt) {
      state.deferredPrompt.prompt(); // 显示安装提示
      const { outcome } = await state.deferredPrompt.userChoice; // 等待用户选择
      
      // 清理安装提示状态
      setState(prev => ({
        ...prev,
        deferredPrompt: null,
        isInstallable: false
      }));

      return outcome === 'accepted'; // 返回用户是否接受安装
    }
    return false;
  };

  // 获取不同平台的安装指导说明
  const getInstallInstructions = () => {
    if (state.isIOS) {
      // iOS设备安装指导
      return {
        title: '安装到主屏幕',
        steps: [
          '1. 点击底部的分享按钮 📤',
          '2. 向下滚动并选择"添加到主屏幕"',
          '3. 点击"添加"完成安装'
        ]
      };
    } else if (state.isAndroid) {
      // Android设备安装指导
      return {
        title: '安装应用',
        steps: [
          '1. 点击浏览器菜单 ⋮',
          '2. 选择"安装应用"或"添加到主屏幕"',
          '3. 确认安装'
        ]
      };
    }
    // 其他平台的通用指导
    return {
      title: '安装应用',
      steps: ['点击安装按钮将应用添加到您的设备']
    };
  };

  // 返回PWA状态和操作函数
  return {
    ...state,
    installPWA, // PWA安装函数
    getInstallInstructions // 获取安装指导函数
  };
}