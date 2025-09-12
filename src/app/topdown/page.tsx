'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// 动态导入游戏组件，避免 SSR 问题
// 使用说明：
// - 访问路径 /topdown
// - 地图：运行 npm run tmx:json:default 导出到 public/topdown/game/map.json
// - 移动端 UI：点击“开始”后才显示摇杆与动作按钮
const TopDownGame = dynamic(() => import('./App'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-lg">Loading game...</p>
      </div>
    </div>
  ),
});

export default function TopDownPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // 进入页面时，让 body 进入"全屏占位"模式，隐藏滚动并可用于隐藏 Footer
    document.body.classList.add('fullscreen-active');
    return () => {
      document.body.classList.remove('fullscreen-active');
    };
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      <TopDownGame />
    </div>
  );
}