'use client';

import React, { useEffect, useRef } from 'react';
import { TopDownGameEngine } from './TopDownGameEngine';

interface TopDownGameProps {
  width?: number;
  height?: number;
}

export const TopDownGame: React.FC<TopDownGameProps> = ({ 
  width = 800, 
  height = 600 
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<TopDownGameEngine | null>(null);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    // 创建游戏引擎实例
    gameEngineRef.current = new TopDownGameEngine(gameContainerRef.current, {
      width,
      height,
      parent: gameContainerRef.current,
      type: Phaser.AUTO,
      backgroundColor: '#2c3e50',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: null // 将在引擎中设置
    });

    // 清理函数
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
        gameEngineRef.current = null;
      }
    };
  }, [width, height]);

  return (
    <div className="relative">
      <div 
        ref={gameContainerRef}
        className="border-2 border-gray-600 rounded-lg overflow-hidden"
        style={{ width, height }}
      />
      
      {/* 游戏UI覆盖层 */}
      <div className="absolute top-4 left-4 text-white">
        <div className="bg-black bg-opacity-50 px-3 py-2 rounded">
          <div className="text-sm">HP: 100/100</div>
          <div className="text-sm">MP: 50/50</div>
        </div>
      </div>
      
      {/* 游戏菜单按钮 */}
      <div className="absolute top-4 right-4">
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          onClick={() => {
            // 打开游戏菜单
            console.log('打开游戏菜单');
          }}
        >
          菜单
        </button>
      </div>
    </div>
  );
};
