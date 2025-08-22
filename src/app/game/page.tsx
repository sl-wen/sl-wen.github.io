'use client';

import React, { useEffect, useRef, useState } from 'react';

// 强制动态渲染以防止SSR问题 - 游戏需要在客户端环境运行
export const dynamic = 'force-dynamic';

// 游戏页面组件 - 小猫农场游戏的主页面，负责游戏初始化和界面渲染
const GamePage: React.FC = () => {
  // 游戏容器DOM引用 - 用于挂载Phaser游戏实例
  const gameRef = useRef<HTMLDivElement>(null);
  // 游戏加载状态 - 控制加载界面的显示
  const [isLoading, setIsLoading] = useState(false);
  // 游戏实例状态 - 保存Phaser游戏对象的引用
  const [gameInstance, setGameInstance] = useState<any>(null);
  // 客户端状态 - 确保组件在客户端环境中运行
  const [isClient, setIsClient] = useState(false);
  // 游戏启动状态 - 控制是否显示启动按钮
  const [gameStarted, setGameStarted] = useState(false);
  // 全屏状态 - 跟踪当前是否处于全屏模式
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 客户端环境检测 - 避免SSR和客户端不一致的问题
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // 启动游戏函数
  const startGame = async () => {
    console.log('🎮 startGame button clicked!');
    console.log('startGame called', { isClient, gameInstance: !!gameInstance, gameRef: !!gameRef.current });
    
    if (!isClient) {
      console.warn('Game cannot start: not in client environment');
      return;
    }
    
    if (gameInstance) {
      console.warn('Game cannot start: game instance already exists');
      return;
    }

    // 现在容器始终存在于DOM中，直接检查
    if (!gameRef.current) {
      console.error('Game cannot start: game container not found');
      console.log('GameRef current value:', gameRef.current);
      console.log('GameRef object:', gameRef);
      alert('游戏容器未找到，请刷新页面重试');
      return;
    }

    setIsLoading(true);
    setGameStarted(true);

    try {
      console.log('Starting game initialization...');
      console.log('Game container element:', gameRef.current);
      console.log('Container dimensions:', {
        width: gameRef.current.clientWidth,
        height: gameRef.current.clientHeight,
        offsetWidth: gameRef.current.offsetWidth,
        offsetHeight: gameRef.current.offsetHeight
      });
      
      // 动态导入游戏类，避免SSR时的模块加载问题
      const { RPGGame: GameClass } = await import('@/components/game/RPGGame');
      console.log('RPGGame class imported successfully');
      
      // 创建游戏实例并挂载到DOM容器
      const game = new GameClass(gameRef.current);
      console.log('Game instance created:', game);
      
      setGameInstance(game.game);
      setIsLoading(false); // 游戏加载完成
      console.log('Game started successfully');
    } catch (error) {
      console.error('Failed to initialize game:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        gameRef: gameRef.current,
        isClient
      });
      alert(`游戏启动失败: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false); // 即使失败也要停止加载状态
      setGameStarted(false); // 重置启动状态，允许重试
    }
  };

  // 测试按钮点击
  const testClick = () => {
    console.log('🔍 Test button clicked - buttons are working!');
    alert('按钮点击测试成功！如果您看到这个消息，说明按钮是可以点击的。');
  };

  // 容器诊断函数
  const diagnoseContainer = () => {
    console.log('🔍 Container Diagnosis:');
    console.log('gameRef:', gameRef);
    console.log('gameRef.current:', gameRef.current);
    console.log('isClient:', isClient);
    console.log('gameStarted:', gameStarted);
    console.log('gameInstance:', gameInstance);
    
    if (gameRef.current) {
      console.log('Container details:', {
        tagName: gameRef.current.tagName,
        id: gameRef.current.id,
        className: gameRef.current.className,
        clientWidth: gameRef.current.clientWidth,
        clientHeight: gameRef.current.clientHeight,
        offsetWidth: gameRef.current.offsetWidth,
        offsetHeight: gameRef.current.offsetHeight,
        parentElement: gameRef.current.parentElement,
        style: gameRef.current.style.cssText
      });
    }
    
    alert(`容器诊断完成，请查看控制台输出。容器状态: ${gameRef.current ? '已找到' : '未找到'}`);
  };

  // 重置游戏函数
  const resetGame = () => {
    console.log('🔄 Resetting game...');
    
    // 销毁现有游戏实例
    if (gameInstance) {
      try {
        gameInstance.destroy(true);
      } catch (error) {
        console.error('Error destroying game instance:', error);
      }
    }
    
    // 重置所有状态
    setGameInstance(null);
    setGameStarted(false);
    setIsLoading(false);
    setIsFullscreen(false);
    
    console.log('Game reset completed');
  };

  // 简单的Phaser测试
  const startSimpleGame = async () => {
    console.log('🎮 Starting simple game test...');
    
    // 现在容器始终存在于DOM中，直接检查
    if (!gameRef.current) {
      console.error('Simple game cannot start: game container not found');
      alert('游戏容器未找到');
      return;
    }

    setIsLoading(true);
    setGameStarted(true);

    try {
      console.log('Starting simple game with container:', gameRef.current);
      const Phaser = await import('phaser');
      
      const simpleConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: gameRef.current,
        backgroundColor: '#87CEEB',
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 800,
          height: 600
        },
        scene: {
          create: function(this: Phaser.Scene) {
            console.log('Simple game scene create() called');
            // 创建一个简单的文本和图形
            this.add.text(50, 50, '🐱 小猫农场 - 简单模式', { 
              fontSize: '24px', 
              color: '#000000',
              fontFamily: 'Arial'
            });
            
            // 创建一个简单的小猫图形
            const cat = this.add.graphics();
            cat.fillStyle(0xffa500); // 橙色
            cat.fillCircle(200, 200, 20);
            cat.fillStyle(0x000000); // 黑色眼睛
            cat.fillCircle(195, 195, 3);
            cat.fillCircle(205, 195, 3);
            
            this.add.text(50, 100, '如果您看到这个界面，说明Phaser工作正常', { 
              fontSize: '16px', 
              color: '#000000' 
            });
            
            this.add.text(50, 130, `容器尺寸: ${this.cameras.main.width}x${this.cameras.main.height}`, { 
              fontSize: '14px', 
              color: '#333333' 
            });
            
            console.log('Simple game scene created successfully');
          }
        }
      };

      console.log('Creating simple Phaser game...');
      const testGame = new Phaser.Game(simpleConfig);
      setGameInstance(testGame);
      setIsLoading(false);
      console.log('Simple game started successfully');
      
    } catch (error) {
      console.error('Simple game failed:', error);
      alert(`简单游戏也失败了: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
      setGameStarted(false);
    }
  };

  // 进入全屏模式
  const enterFullscreen = async () => {
    if (!gameRef.current) return;

    try {
      if (gameRef.current.requestFullscreen) {
        await gameRef.current.requestFullscreen();
      } else if ((gameRef.current as any).webkitRequestFullscreen) {
        await (gameRef.current as any).webkitRequestFullscreen();
      } else if ((gameRef.current as any).mozRequestFullScreen) {
        await (gameRef.current as any).mozRequestFullScreen();
      } else if ((gameRef.current as any).msRequestFullscreen) {
        await (gameRef.current as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  };

  // 退出全屏模式
  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  };

  // 组件卸载时清理游戏实例
  useEffect(() => {
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
  }, [gameInstance]);

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
          {/* 隐藏的游戏容器 - 始终存在于DOM中，避免ref时序问题 */}
          <div
            ref={gameRef}
            className={`game-container ${gameStarted ? 'block' : 'hidden'} w-full bg-gradient-to-br from-slate-900 to-black rounded-xl overflow-hidden shadow-2xl border-2 border-slate-600/50 touch-none select-none ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
            style={{ 
              aspectRatio: isFullscreen ? 'auto' : '16/10', // 游戏画面比例
              minHeight: isFullscreen ? '100vh' : '600px', // 最小高度确保游戏可见
              maxHeight: isFullscreen ? '100vh' : '80vh', // 最大高度适应屏幕
              touchAction: 'none', // 禁用触摸滚动，专用于游戏操作
              userSelect: 'none', // 禁用文本选择
              WebkitUserSelect: 'none', // Safari兼容
              WebkitTouchCallout: 'none', // iOS Safari兼容
              backdropFilter: 'blur(10px)',
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))'
            }}
          />

          {/* 游戏启动界面 */}
          {!gameStarted && (
            <div className="flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl min-h-[600px] border-2 border-slate-600/50">
              <div className="text-center p-8">
                <div className="text-6xl mb-6">🐱</div>
                <h2 className="text-3xl font-bold text-white mb-4">小猫厨房农场</h2>
                <p className="text-slate-300 mb-8 max-w-md">
                  准备好体验温馨治愈的农场生活了吗？种植作物、烹饪美食、照料可爱的小猫！
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
                        进入游戏
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={() => window.open('/game/debug', '_blank')}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium py-2 px-6 rounded-lg text-sm transition-all duration-300 w-full"
                  >
                    🔧 游戏调试工具
                  </button>
                  
                  <button
                    onClick={testClick}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-6 rounded-lg text-sm transition-all duration-300 w-full"
                  >
                    🔍 测试按钮点击
                  </button>
                  
                  <button
                    onClick={startSimpleGame}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-2 px-6 rounded-lg text-sm transition-all duration-300 w-full"
                  >
                    🚀 简单模式测试
                  </button>
                  
                  <button
                    onClick={diagnoseContainer}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium py-2 px-6 rounded-lg text-sm transition-all duration-300 w-full"
                  >
                    🔬 容器诊断
                  </button>
                  
                  <div className="text-center text-slate-400 text-xs mt-2">
                    如果游戏无法启动，请先尝试"简单模式测试"
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 游戏运行时的遮罩和控制 */}
          {gameStarted && (
            <>
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

              {/* 游戏控制按钮 */}
              {!isLoading && (
                <div className="absolute top-4 right-4 z-20 flex space-x-2">
                  <button
                    onClick={resetGame}
                    className="bg-red-500/70 hover:bg-red-600/70 text-white p-3 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40"
                    title="重置游戏"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                    className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40"
                    title={isFullscreen ? "退出全屏" : "进入全屏"}
                  >
                    {isFullscreen ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* 游戏控制说明 - 只在非全屏模式下显示 */}
        {!isFullscreen && (
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
        )}
      </div>
    </div>
  );
};

export default GamePage;