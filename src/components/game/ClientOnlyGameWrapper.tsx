'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// 动态导入游戏页面，确保只在客户端渲染
const GamePageComponent = dynamic(
  () => import('../../app/game/page').then(mod => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-400 to-green-400">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">正在加载农场游戏...</h2>
          <p className="text-gray-600">
            初始化游戏引擎，请稍候...
          </p>
        </div>
      </div>
    )
  }
);

const ClientOnlyGameWrapper: React.FC = () => {
  return <GamePageComponent />;
};

export default ClientOnlyGameWrapper;