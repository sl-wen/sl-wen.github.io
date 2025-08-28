'use client';

import React, { useState, useEffect } from 'react';
import Footer from './Footer';

/**
 * 条件渲染Footer组件
 * 在全屏模式下隐藏Footer，非全屏模式下显示Footer
 */
const ConditionalFooter: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // 检查全屏状态的函数
    const checkFullscreenStatus = () => {
      // 检查body是否有全屏激活的CSS类
      const hasFullscreenClass = document.body.classList.contains('fullscreen-active');
      // 检查是否有真实的全屏元素
      const hasFullscreenElement = !!document.fullscreenElement;
      
      const newFullscreenState = hasFullscreenClass || hasFullscreenElement;
      setIsFullscreen(newFullscreenState);
    };

    // 立即检查一次
    checkFullscreenStatus();

    // 监听全屏状态变化
    const handleFullscreenChange = () => {
      setTimeout(checkFullscreenStatus, 100); // 延迟一点确保状态已更新
    };

    // 监听CSS类变化（用于模拟全屏）
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkFullscreenStatus();
        }
      });
    });

    // 开始观察body元素的class属性变化
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    // 监听标准全屏API事件
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // 清理函数
    return () => {
      observer.disconnect();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // 全屏模式下不渲染Footer
  if (isFullscreen) {
    return null;
  }

  // 非全屏模式下正常渲染Footer
  return <Footer />;
};

export default ConditionalFooter;