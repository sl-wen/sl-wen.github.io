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
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-lg z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-white text-lg">正在加载游戏...</p>
              </div>
            </div>
          )}

          {/* 游戏画布容器 - Phaser游戏实例将挂载到这里 */}
          <div
            ref={gameRef}
            className="w-full bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-slate-600 touch-none select-none"
            style={{ 
              aspectRatio: '16/10', // 游戏画面比例
              minHeight: '600px', // 最小高度确保游戏可见
              maxHeight: '80vh', // 最大高度适应屏幕
              touchAction: 'none', // 禁用触摸滚动，专用于游戏操作
              userSelect: 'none', // 禁用文本选择
              WebkitUserSelect: 'none', // Safari兼容
              WebkitTouchCallout: 'none' // iOS Safari兼容
            }}
          />
        </div>

        {/* 游戏操作说明区域 */}
        <div className="mt-6 bg-slate-800 rounded-lg p-4 w-full max-w-4xl">
          <h3 className="text-lg font-semibold text-white mb-3">🐾 游戏控制</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            {/* 移动控制说明 */}
            <div>
              <h4 className="font-medium text-blue-400 mb-2">移动控制：</h4>
              <ul className="space-y-1">
                <li>• <kbd className="kbd">W/↑</kbd> - 小猫向上移动</li>
                <li>• <kbd className="kbd">S/↓</kbd> - 小猫向下移动</li>
                <li>• <kbd className="kbd">A/←</kbd> - 小猫向左移动</li>
                <li>• <kbd className="kbd">D/→</kbd> - 小猫向右移动</li>
              </ul>
            </div>
            {/* 农场操作说明 */}
            <div>
              <h4 className="font-medium text-green-400 mb-2">农场操作：</h4>
              <ul className="space-y-1">
                <li>• <kbd className="kbd">Space</kbd> - 交互/使用工具</li>
                <li>• <kbd className="kbd">I</kbd> - 打开背包</li>
                <li>• <kbd className="kbd">C</kbd> - 打开烹饪界面</li>
                <li>• <kbd className="kbd">1-4</kbd> - 选择工具</li>
              </ul>
            </div>
          </div>

          {/* 移动端专用控制说明 */}
          <div className="mt-4 md:hidden">
            <h4 className="font-medium text-purple-400 mb-2">📱 移动端控制：</h4>
            <div className="space-y-2 text-slate-300">
              <p>• <span className="text-blue-400">虚拟摇杆</span> - 左下角，控制小猫移动方向</p>
              <p>• <span className="text-green-400">交互按钮</span> - 右下角，进行农场操作</p>
              <p>• <span className="text-purple-400">背包/烹饪</span> - 右侧辅助按钮</p>
              <p>• <span className="text-orange-400">工具选择</span> - 左侧工具面板</p>
              <p>• <span className="text-cyan-400">直接点击</span> - 点击屏幕任意位置移动</p>
            </div>
          </div>

          {/* 触摸操作技巧提示 */}
          <div className="mt-4 p-3 bg-slate-700 rounded-lg">
            <h5 className="text-sm font-semibold text-yellow-400 mb-2">💡 操作技巧：</h5>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• 摇杆支持死区控制，轻推慢走，大力快跑</li>
              <li>• 长按工具按钮查看工具说明</li>
              <li>• 靠近可交互物体时会显示提示图标</li>
              <li>• 支持触觉反馈（需要设备支持）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;