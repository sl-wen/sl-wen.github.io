'use client';

import React, { useEffect, useRef, useState } from 'react';

// 强制动态渲染以防止SSR问题 - 游戏需要在客户端环境运行
export const dynamic = 'force-dynamic';

// 游戏页面组件 - 小猫农场游戏的主页面，负责游戏初始化和界面渲染
const GamePage: React.FC = () => {
  // 游戏容器DOM引用 - 用于挂载Phaser游戏实例
  const gameRef = useRef<HTMLDivElement>(null);
  // 游戏加载状态 - 控制加载界面的显示
  const [isLoading, setIsLoading] = useState(true);
  // 游戏实例状态 - 保存Phaser游戏对象的引用
  const [gameInstance, setGameInstance] = useState<any>(null);
  // 客户端状态 - 确保组件在客户端环境中运行
  const [isClient, setIsClient] = useState(false);

  // 客户端环境检测 - 避免SSR和客户端不一致的问题
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 游戏初始化和清理逻辑
  useEffect(() => {
    if (!isClient) return; // 只在客户端环境执行

    // 异步初始化游戏实例
    const initGame = async () => {
      if (gameRef.current && !gameInstance) {
        try {
          // 动态导入游戏类，避免SSR时的模块加载问题
          const { RPGGame: GameClass } = await import('@/components/game/RPGGame');
          // 创建游戏实例并挂载到DOM容器
          const game = new GameClass(gameRef.current);
          setGameInstance(game.game);
          setIsLoading(false); // 游戏加载完成
        } catch (error) {
          console.error('Failed to initialize game:', error);
          setIsLoading(false); // 即使失败也要停止加载状态
        }
      }
    };

    initGame();

    // 组件卸载时清理游戏实例
    return () => {
      if (gameInstance) {
        try {
          gameInstance.destroy(true); // 销毁Phaser游戏实例
        } catch (error) {
          console.error('Error destroying game:', error);
        }
        setGameInstance(null);
      }
    };
  }, [isClient, gameInstance]);

  // 服务端渲染或客户端初始化时的加载界面
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
      {/* 游戏标题头部区域 */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">🐱 小猫农场</h1>
          <p className="text-slate-300">
            使用 WASD 键或虚拟摇杆移动小猫，空格键交互，体验温馨治愈的农场生活！种植作物、烹饪美食、照料农场。
          </p>
        </div>
      </div>

      {/* 游戏主体容器区域 */}
      <div className="flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-4xl">
          {/* 游戏加载遮罩层 */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg z-10">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400/30 border-t-blue-400 mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl">🎮</div>
                  </div>
                </div>
                <h3 className="text-white text-xl font-bold mb-2">正在加载游戏...</h3>
                <p className="text-slate-300 text-sm">准备进入农场小猫的世界</p>
                <div className="mt-4 flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* 游戏画布容器 - Phaser游戏实例将挂载到这里 */}
          <div
            ref={gameRef}
            className="w-full bg-gradient-to-br from-slate-900 to-black rounded-xl overflow-hidden shadow-2xl border-2 border-slate-600/50 touch-none select-none game-container"
            style={{ 
              aspectRatio: '16/10', // 游戏画面比例
              minHeight: '600px', // 最小高度确保游戏可见
              maxHeight: '80vh', // 最大高度适应屏幕
              touchAction: 'none', // 禁用触摸滚动，专用于游戏操作
              userSelect: 'none', // 禁用文本选择
              WebkitUserSelect: 'none', // Safari兼容
              WebkitTouchCallout: 'none', // iOS Safari兼容
              backdropFilter: 'blur(10px)',
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))'
            }}
          />
        </div>

        {/* 现代化游戏控制说明 */}
        <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 w-full max-w-4xl border border-slate-600 shadow-2xl">
          <div className="flex items-center mb-6">
            <div className="text-3xl mr-3">🎮</div>
            <h3 className="text-2xl font-bold text-white">游戏控制</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 桌面端控制 */}
            <div className="bg-slate-700/50 rounded-xl p-5 border border-slate-600 backdrop-blur-sm">
              <h4 className="font-bold text-blue-400 mb-4 flex items-center text-lg">
                <span className="mr-3">⌨️</span>桌面端控制
              </h4>
              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <h5 className="text-blue-300 font-medium mb-2">移动控制</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">向上</span>
                      <kbd className="kbd">W / ↑</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">向下</span>
                      <kbd className="kbd">S / ↓</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">向左</span>
                      <kbd className="kbd">A / ←</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">向右</span>
                      <kbd className="kbd">D / →</kbd>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <h5 className="text-green-300 font-medium mb-2">农场操作</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">交互/使用工具</span>
                      <kbd className="kbd">Space</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">打开背包</span>
                      <kbd className="kbd">I</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">烹饪界面</span>
                      <kbd className="kbd">C</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">选择工具</span>
                      <kbd className="kbd">1-4</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 移动端控制 */}
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl p-5 border border-purple-400/30 backdrop-blur-sm">
              <h4 className="font-bold text-purple-400 mb-4 flex items-center text-lg">
                <span className="mr-3">📱</span>移动端控制
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center bg-slate-800/30 rounded-lg p-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full mr-3 flex items-center justify-center text-sm">🕹️</div>
                    <div>
                      <span className="text-blue-400 font-medium">虚拟摇杆</span>
                      <p className="text-slate-300 text-xs">左下角精确移动控制</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-slate-800/30 rounded-lg p-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full mr-3 flex items-center justify-center text-sm">🐾</div>
                    <div>
                      <span className="text-green-400 font-medium">交互按钮</span>
                      <p className="text-slate-300 text-xs">右下角主要交互操作</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-slate-800/30 rounded-lg p-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full mr-3 flex items-center justify-center text-sm">🎒</div>
                    <div>
                      <span className="text-purple-400 font-medium">背包系统</span>
                      <p className="text-slate-300 text-xs">管理物品和工具</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-400/20">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-400 mr-2">🔄</span>
                    <span className="font-medium text-yellow-400">控制模式切换</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    点击左上角 🎮 按钮在虚拟摇杆和简单触摸间切换
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 游戏提示 */}
          <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-400/20">
            <h4 className="font-bold text-yellow-400 mb-3 flex items-center">
              <span className="mr-2">✨</span>游戏提示
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-blue-400 mr-2 mt-0.5">🎯</span>
                  <span className="text-slate-300">摇杆支持精确控制，力度决定移动速度</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-400 mr-2 mt-0.5">💫</span>
                  <span className="text-slate-300">靠近互动物品时显示操作提示</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-purple-400 mr-2 mt-0.5">🌱</span>
                  <span className="text-slate-300">收集种子制作食物和工具</span>
                </div>
                <div className="flex items-start">
                  <span className="text-pink-400 mr-2 mt-0.5">❤️</span>
                  <span className="text-slate-300">照料小猫的健康和快乐</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;