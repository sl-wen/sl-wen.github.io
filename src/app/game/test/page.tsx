'use client';

import React, { useEffect, useRef, useState } from 'react';

export const dynamic = 'force-dynamic';

const GameTestPage: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameInstance, setGameInstance] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const startGame = async () => {
    if (!isClient || gameInstance || !gameRef.current) {
      return;
    }

    setIsLoading(true);

    try {
      const { RPGGame: GameClass } = await import('@/components/game/RPGGame');
      const game = new GameClass(gameRef.current);
      setGameInstance(game.game);
      setIsLoading(false);
      console.log('Game started successfully');
    } catch (error) {
      console.error('Failed to start game:', error);
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    if (gameInstance) {
      try {
        gameInstance.destroy(true);
      } catch (error) {
        console.error('Error destroying game:', error);
      }
    }
    setGameInstance(null);
    setIsLoading(false);
  };

  useEffect(() => {
    return () => {
      if (gameInstance) {
        try {
          gameInstance.destroy(true);
        } catch (error) {
          console.error('Error destroying game:', error);
        }
      }
    };
  }, [gameInstance]);

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
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">🐱 小猫农场 - 测试版</h1>
          <p className="text-slate-300">
            测试操控和布局修复 - 使用 WASD 键或虚拟摇杆移动小猫，空格键交互
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-7xl">
          <div
            ref={gameRef}
            className={`game-container ${gameInstance ? 'block' : 'hidden'} w-full bg-gradient-to-br from-slate-900 to-black overflow-hidden shadow-2xl border-2 border-slate-600/50 touch-none select-none rounded-xl`}
            style={{ 
              width: '100%',
              height: '600px',
              maxWidth: '1200px',
              aspectRatio: '16/10',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              backdropFilter: 'blur(10px)',
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))'
            }}
          />

          {!gameInstance && (
            <div className="flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-slate-600/50 min-h-[600px]">
              <div className="text-center p-8 max-w-md mx-auto">
                <div className="text-6xl mb-6">🐱</div>
                <h2 className="text-3xl font-bold text-white mb-4">小猫农场测试版</h2>
                <p className="text-slate-300 mb-8">
                  测试修复后的操控系统和新的农场布局
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={startGame}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:cursor-not-allowed w-full"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                        正在加载游戏...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="mr-2">🎮</span>
                        开始测试
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={resetGame}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-300 w-full"
                  >
                    🔄 重置游戏
                  </button>
                </div>
              </div>
            </div>
          )}

          {gameInstance && (
            <div className="absolute z-20 flex top-4 right-4 space-x-2">
              <button
                onClick={resetGame}
                className="bg-red-500/70 hover:bg-red-600/70 text-white rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40 p-3"
                title="重置游戏"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 w-full max-w-7xl border border-slate-600 shadow-2xl">
          <div className="flex items-center mb-6">
            <div className="text-3xl mr-3">🎮</div>
            <h3 className="text-2xl font-bold text-white">测试说明</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-700/50 rounded-xl p-5 border border-slate-600 backdrop-blur-sm">
              <h4 className="font-bold text-blue-400 mb-4 flex items-center text-lg">
                <span className="mr-3">⌨️</span>键盘控制
              </h4>
              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <h5 className="text-blue-300 font-medium mb-2">移动控制</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">WASD</span>
                      <kbd className="kbd">移动小猫</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">空格键</span>
                      <kbd className="kbd">交互</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-5 border border-purple-400/30 backdrop-blur-sm">
              <h4 className="font-bold text-purple-400 mb-4 flex items-center text-lg">
                <span className="mr-3">📱</span>触摸控制
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center bg-slate-800/30 rounded-lg p-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full mr-3 flex items-center justify-center text-sm">🕹️</div>
                    <div>
                      <span className="text-blue-400 font-medium">虚拟摇杆</span>
                      <p className="text-slate-300 text-xs">左下角控制移动</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-slate-800/30 rounded-lg p-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full mr-3 flex items-center justify-center text-sm">🐾</div>
                    <div>
                      <span className="text-green-400 font-medium">交互按钮</span>
                      <p className="text-slate-300 text-xs">右下角进行交互</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-400/20">
            <h4 className="font-bold text-yellow-400 mb-3 flex items-center">
              <span className="mr-2">✨</span>新布局说明
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-blue-400 mr-2 mt-0.5">🏠</span>
                  <span className="text-slate-300">左上角：房子区域 (20%)</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-400 mr-2 mt-0.5">🌊</span>
                  <span className="text-slate-300">右上角：池塘区域 (20%)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-purple-400 mr-2 mt-0.5">🌱</span>
                  <span className="text-slate-300">下方：土地区域 (40%)</span>
                </div>
                <div className="flex items-start">
                  <span className="text-pink-400 mr-2 mt-0.5">🛣️</span>
                  <span className="text-slate-300">中间：道路系统 (20%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameTestPage;