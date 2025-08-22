'use client';

import React, { useEffect, useRef, useState } from 'react';

export const dynamic = 'force-dynamic';

const GameTestPage: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameInstance, setGameInstance] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startNewGame = async () => {
    if (!isClient || !gameRef.current) {
      addTestResult('❌ 游戏环境未准备好');
      return;
    }

    if (gameInstance) {
      gameInstance.destroy(true);
      setGameInstance(null);
    }

    setIsLoading(true);
    setGameStarted(true);
    addTestResult('🎮 开始加载新的游戏系统...');

    try {
      const { RPGGame: GameClass } = await import('@/components/game/RPGGame');
      const game = new GameClass(gameRef.current);
      
      setGameInstance(game.game);
      setIsLoading(false);
      addTestResult('✅ 新游戏系统加载成功');
      
      // 测试摇杆功能
      setTimeout(() => {
        testJoystickFunctionality(game.game);
      }, 2000);
      
    } catch (error) {
      addTestResult(`❌ 游戏加载失败: ${error}`);
      setIsLoading(false);
      setGameStarted(false);
    }
  };

  const testJoystickFunctionality = (game: any) => {
    try {
      const gameScene = game.scene.getScene('GameScene');
      if (gameScene && gameScene.virtualJoystick) {
        const debugInfo = gameScene.virtualJoystick.getDebugInfo();
        addTestResult(`✅ 摇杆系统正常: ${JSON.stringify(debugInfo)}`);
      } else {
        addTestResult('⚠️ 摇杆系统未找到或未初始化');
      }
    } catch (error) {
      addTestResult(`❌ 摇杆测试失败: ${error}`);
    }
  };

  const testLayoutManager = async () => {
    try {
      const { UILayoutManager } = await import('@/components/game/UILayoutManager');
      
      // 创建一个临时场景来测试布局管理器
      const mockScene = {
        cameras: { main: { width: window.innerWidth, height: window.innerHeight } },
        scale: { on: () => {} }
      } as any;
      
      const layoutManager = new UILayoutManager(mockScene);
      const screenInfo = layoutManager.getScreenInfo();
      const joystickPos = layoutManager.getJoystickPosition(60);
      const buttonPositions = layoutManager.getActionButtonsPosition(50, 3);
      
      addTestResult(`✅ 布局管理器测试成功:`);
      addTestResult(`   屏幕信息: ${screenInfo.width}x${screenInfo.height}, 移动端: ${screenInfo.isMobile}, 竖屏: ${screenInfo.isPortrait}`);
      addTestResult(`   摇杆位置: (${joystickPos.x}, ${joystickPos.y})`);
      addTestResult(`   按钮位置: ${buttonPositions.length} 个按钮`);
      
      layoutManager.destroy();
    } catch (error) {
      addTestResult(`❌ 布局管理器测试失败: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">正在初始化测试环境...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-4">🧪 游戏系统测试</h1>
          <p className="text-slate-300 mb-6">
            测试新的响应式布局和防卡死摇杆系统
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={startNewGame}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
            >
              {isLoading ? '加载中...' : '🎮 启动新游戏'}
            </button>

            <button
              onClick={testLayoutManager}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
            >
              🧩 测试布局管理器
            </button>

            <button
              onClick={clearResults}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
            >
              🗑️ 清空结果
            </button>
          </div>

          {/* 测试结果面板 */}
          <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
            <h3 className="text-white font-bold mb-3">📊 测试结果</h3>
            <div className="bg-black/30 rounded p-3 max-h-40 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-slate-400 text-sm">暂无测试结果</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm text-slate-300 mb-1 font-mono">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 游戏容器 */}
        <div className="relative">
          <div
            ref={gameRef}
            className={`game-container ${gameStarted ? 'block' : 'hidden'} w-full bg-gradient-to-br from-slate-900 to-black rounded-xl overflow-hidden shadow-2xl border-2 border-slate-600/50 touch-none select-none`}
            style={{ 
              aspectRatio: '16/10',
              minHeight: '400px',
              maxHeight: '70vh',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          />

          {!gameStarted && (
            <div className="flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl min-h-[400px] border-2 border-slate-600/50">
              <div className="text-center p-8">
                <div className="text-6xl mb-6">🧪</div>
                <h2 className="text-2xl font-bold text-white mb-4">游戏系统测试环境</h2>
                <p className="text-slate-300 mb-6">
                  点击上方按钮开始测试新的游戏系统
                </p>
              </div>
            </div>
          )}

          {isLoading && gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400/30 border-t-blue-400 mx-auto mb-4"></div>
                <h3 className="text-white text-xl font-bold mb-2">正在加载测试游戏...</h3>
                <p className="text-slate-300 text-sm">验证新的控制系统</p>
              </div>
            </div>
          )}
        </div>

        {/* 系统信息面板 */}
        <div className="mt-6 bg-slate-800/50 rounded-xl p-6 border border-slate-600">
          <h3 className="text-white font-bold mb-4">📱 当前设备信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-300">屏幕尺寸:</span>
                <span className="text-blue-400">{window.innerWidth} × {window.innerHeight}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">设备类型:</span>
                <span className="text-green-400">{window.innerWidth < 768 ? '移动设备' : '桌面设备'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">屏幕方向:</span>
                <span className="text-purple-400">{window.innerHeight > window.innerWidth ? '竖屏' : '横屏'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-300">触摸支持:</span>
                <span className="text-blue-400">{'ontouchstart' in window ? '支持' : '不支持'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">用户代理:</span>
                <span className="text-slate-400 text-xs truncate">{navigator.userAgent.slice(0, 30)}...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameTestPage;