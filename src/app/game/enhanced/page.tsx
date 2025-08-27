'use client';

import dynamicImport from 'next/dynamic';
import React from 'react';

// 强制动态渲染以防止SSR问题
export const dynamic = 'force-dynamic';

// 动态导入游戏组件，禁用SSR
const GameComponent = dynamicImport(() => import('./GameComponent'), {
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
});

const EnhancedGamePage: React.FC = () => {
  return <GameComponent />;
};

export default EnhancedGamePage;