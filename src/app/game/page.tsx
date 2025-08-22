'use client';

import React, { useEffect, useRef, useState } from 'react';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

const GamePage: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameInstance, setGameInstance] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const initGame = async () => {
      if (gameRef.current && !gameInstance) {
        try {
          const { RPGGame: GameClass } = await import('@/components/game/RPGGame');
          const game = new GameClass(gameRef.current);
          setGameInstance(game.game);
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to initialize game:', error);
          setIsLoading(false);
        }
      }
    };

    initGame();

    return () => {
      if (gameInstance) {
        try {
          gameInstance.destroy(true);
        } catch (error) {
          console.error('Error destroying game:', error);
        }
        setGameInstance(null);
      }
    };
  }, [isClient, gameInstance]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">正在初始化...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Game Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">🎮 RPG 冒险世界</h1>
          <p className="text-slate-300">
            使用 WASD 键或虚拟摇杆移动，空格键或触摸交互，探索这个充满精美像素艺术的 2D RPG 世界！
          </p>
        </div>
      </div>

      {/* Game Container */}
      <div className="flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-4xl">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-lg z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-white text-lg">正在加载游戏...</p>
              </div>
            </div>
          )}

          {/* Game Canvas Container */}
          <div
            ref={gameRef}
            className="w-full bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-slate-600"
            style={{ aspectRatio: '16/10', minHeight: '600px' }}
          />
        </div>

        {/* Game Controls Info */}
        <div className="mt-6 bg-slate-800 rounded-lg p-4 w-full max-w-4xl">
          <h3 className="text-lg font-semibold text-white mb-3">🎯 游戏控制</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div>
              <h4 className="font-medium text-blue-400 mb-2">移动控制：</h4>
              <ul className="space-y-1">
                <li>• <kbd className="kbd">W</kbd> - 向上移动</li>
                <li>• <kbd className="kbd">S</kbd> - 向下移动</li>
                <li>• <kbd className="kbd">A</kbd> - 向左移动</li>
                <li>• <kbd className="kbd">D</kbd> - 向右移动</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-400 mb-2">交互控制：</h4>
              <ul className="space-y-1">
                <li>• <kbd className="kbd">Space</kbd> - 交互/确认</li>
                <li>• <kbd className="kbd">E</kbd> - 调查物品</li>
                <li>• <kbd className="kbd">ESC</kbd> - 菜单/暂停</li>
              </ul>
            </div>
          </div>

          {/* Mobile Controls Info */}
          <div className="mt-4 md:hidden">
            <h4 className="font-medium text-purple-400 mb-2">移动端控制：</h4>
            <p className="text-slate-300">在移动设备上，使用屏幕左下角的虚拟摇杆移动角色，点击右下角的动作按钮进行交互。也可以直接点击屏幕来移动角色。</p>
          </div>
        </div>

        {/* Mobile Virtual Controls */}
        <div className="md:hidden mt-4 w-full max-w-4xl">
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">虚拟控制器</h4>
            <div className="flex justify-between items-center">
              {/* D-Pad */}
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-1">
                    <div></div>
                    <button className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs flex items-center justify-center">↑</button>
                    <div></div>
                    <button className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs flex items-center justify-center">←</button>
                    <div className="w-8 h-8 bg-slate-600 rounded"></div>
                    <button className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs flex items-center justify-center">→</button>
                    <div></div>
                    <button className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs flex items-center justify-center">↓</button>
                    <div></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full text-white font-bold">A</button>
                <button className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full text-white font-bold">B</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;