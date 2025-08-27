'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { FlexibleMapData } from '../../components/game/FlexibleTileManager';

// 动态导入组件以避免SSR问题
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

/**
 * 瓦片编辑器页面
 */
export default function TileEditorPage() {
  const [notification, setNotification] = useState<string>('');

  const handleMapSave = (mapData: FlexibleMapData) => {
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
            <nav className="flex space-x-4">
              <a
                href="/sprout-lands"
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
      <main className="flex-1">
        <MapLayoutDesigner
          onMapSave={handleMapSave}
          onMapLoad={handleMapLoad}
        />
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

// 页面元数据
export const metadata = {
  title: '瓦片地图编辑器 - 自由设计农场布局',
  description: '使用直观的瓦片编辑器创建和编辑游戏地图。支持草地、水域、道路、栅栏等多种地形类型。',
  keywords: ['瓦片编辑器', '地图设计', '游戏开发', '农场布局', 'Tile Editor'],
};