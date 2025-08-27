'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// 动态导入所有可能有SSR问题的组件
const MapLayoutDesigner = dynamic(
  () => import('../../components/game/MapLayoutDesigner'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">正在加载瓦片编辑器...</p>
        </div>
      </div>
    )
  }
);

const SimpleTileEditor = dynamic(
  () => import('../../components/game/SimpleTileEditor'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    )
  }
);

const ErrorBoundary = dynamic(
  () => import('../../components/ErrorBoundary'),
  { 
    ssr: false,
    loading: () => <div>Loading...</div>
  }
);

// 动态导入类型
import type { FlexibleMapData } from '../../components/game/FlexibleTileManager';

/**
 * 瓦片编辑器页面
 */
export default function TileEditorPage() {
  const [notification, setNotification] = useState<string>('');
  const [useSimpleEditor, setUseSimpleEditor] = useState(false);

  const handleMapSave = (mapData: any) => {
    setNotification(`地图 "${mapData.metadata.name}" 已保存成功！`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleMapLoad = () => {
    setNotification('地图加载完成！');
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 页面头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🗺️ 瓦片地图编辑器</h1>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Beta
              </span>
            </div>
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => setUseSimpleEditor(!useSimpleEditor)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  useSimpleEditor 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {useSimpleEditor ? '🔧 简单模式' : '🎨 高级模式'}
              </button>
              <a
                href="/game"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                🎮 返回游戏
              </a>
              <a
                href="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                🏠 首页
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* 通知消息 */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          <div className="flex items-center">
            <span className="mr-2">✅</span>
            {notification}
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <main className="flex-1 p-4">
        <ErrorBoundary>
          {useSimpleEditor ? (
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">简单瓦片编辑器</h2>
                <p className="text-gray-600">
                  这是一个简化版本的瓦片编辑器，用于测试和快速编辑。
                  点击上方按钮切换到高级模式。
                </p>
              </div>
              <SimpleTileEditor width={1000} height={600} />
            </div>
          ) : (
            <MapLayoutDesigner
              onMapSave={handleMapSave}
              onMapLoad={handleMapLoad}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* 页面脚部信息 */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>🎯 支持的瓦片类型：草地、水域、道路、栅栏、土壤、沙地、灌木</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>💾 自动保存到本地存储</span>
              <span>📤 支持导入/导出JSON格式</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}