'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import GameSettingsMenu from '../../components/game/GameSettingsMenu';

// 强制动态渲染以防止SSR问题 - 游戏需要在客户端环境运行
export const dynamic = 'force-dynamic';

// 游戏页面组件 - 小猫农场游戏的主页面，负责游戏初始化和界面渲染
const GamePage: React.FC = () => {
  // 游戏容器DOM引用 - 用于挂载Phaser游戏实例
  const gameRef = useRef<HTMLDivElement>(null);
  // 游戏加载状态 - 控制加载界面的显示
  const [isLoading, setIsLoading] = useState(false);
  // 游戏实例状态 - 保存RPG游戏对象的引用
  const [gameInstance, setGameInstance] = useState<any>(null);
  // RPG游戏实例引用 - 保存完整的RPGGame实例
  const [rpgGameInstance, setRpgGameInstance] = useState<any>(null);
  // 客户端状态 - 确保组件在客户端环境中运行
  const [isClient, setIsClient] = useState(false);
  // 游戏启动状态 - 控制是否显示启动按钮
  const [gameStarted, setGameStarted] = useState(false);
  // 全屏状态 - 跟踪当前是否处于全屏模式
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 屏幕方向状态
  const [screenOrientation, setScreenOrientation] = useState<'portrait' | 'landscape'>('landscape');
  // 视口尺寸
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  
  // 增强版功能状态
  const [gameStats, setGameStats] = useState({
    level: 1,
    experience: 0,
    health: 100,
    energy: 100,
    happiness: 100,
    currentSeason: 'spring',
    currentWeather: 'sunny',
    gameTime: '06:00'
  });

  // 游戏时间管理
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [currentGameTime, setCurrentGameTime] = useState<string>('06:00');
  
  // 设置菜单状态
  const [showSettings, setShowSettings] = useState(false);
  
  // 游戏设置
  const [gameSettings, setGameSettings] = useState({
    soundEnabled: true,
    musicVolume: 70,
    sfxVolume: 80,
    fullscreen: false,
    autoSave: true,
    difficulty: 'normal'
  });

  // 错误处理
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 客户端环境检测 - 避免SSR和客户端不一致的问题
  useEffect(() => {
    setIsClient(true);
    // 初始化视口尺寸
    try {
      updateViewportSize();
    } catch (error) {
      console.error('Error initializing viewport size:', error);
    }
  }, []);

  // 游戏时间更新系统
  useEffect(() => {
    if (!gameStarted || !gameStartTime) return;

    const updateGameTime = () => {
      const elapsed = Date.now() - gameStartTime;
      // 游戏时间加速：1分钟现实时间 = 1小时游戏时间
      const gameMinutes = Math.floor(elapsed / 60000) * 60; // 每分钟现实时间等于60分钟游戏时间
      const startMinutes = 6 * 60; // 06:00 开始
      const totalMinutes = (startMinutes + gameMinutes) % (24 * 60); // 24小时循环
      
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      setCurrentGameTime(timeString);
      setGameStats(prev => ({ ...prev, gameTime: timeString }));
    };

    updateGameTime(); // 立即更新一次
    const interval = setInterval(updateGameTime, 1000); // 每秒更新

    return () => clearInterval(interval);
  }, [gameStarted, gameStartTime]);

  // 检测平台类型
  const getPlatformInfo = () => {
    if (typeof window === 'undefined') return { isMobile: false, platform: 'unknown', isIOS: false };

    const userAgent = navigator.userAgent;
    const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);

    return { isMobile, platform: userAgent, isIOS };
  };

  const platformInfo = getPlatformInfo();

  // 检测是否支持真正的全屏API
  const supportsFullscreen = () => {
    if (typeof document === 'undefined') return false;
    return !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );
  };

  // 更新视口尺寸和方向
  const updateViewportSize = () => {
    try {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewportSize({ width, height });
      setScreenOrientation(width > height ? 'landscape' : 'portrait');
    } catch (error) {
      console.error('Error updating viewport size:', error);
    }
  };

  // 监听全屏状态变化和屏幕尺寸变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      try {
        // 只有在支持真正全屏API的浏览器上才检查fullscreenElement
        // iOS和不支持的浏览器使用状态管理
        if (supportsFullscreen() && !platformInfo.isIOS) {
          setIsFullscreen(!!document.fullscreenElement);
        }
        // 对于iOS等不支持的设备，fullscreen状态由手动管理
      } catch (error) {
        console.error('Error handling fullscreen change:', error);
      }
    };

    const handleResize = () => {
      try {
        setViewportSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      } catch (error) {
        console.error('Error handling resize:', error);
      }
    };

    const handleOrientationChange = () => {
      try {
        setTimeout(() => {
          const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
          setScreenOrientation(newOrientation);
          setViewportSize({
            width: window.innerWidth,
            height: window.innerHeight
          });
        }, 200);
      } catch (error) {
        console.error('Error handling orientation change:', error);
      }
    };

    try {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleOrientationChange);
    } catch (error) {
      console.error('Error adding event listeners:', error);
    }

    return () => {
      try {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
      } catch (error) {
        console.error('Error removing event listeners:', error);
      }
    };
  }, [platformInfo.isIOS]);

  // 计算游戏容器的最佳尺寸
  const getOptimalGameSize = () => {
    const { width, height } = viewportSize;

    if (isFullscreen) {
      return {
        width: '100vw',
        height: '100vh',
        maxWidth: 'none',
        maxHeight: 'none'
      };
    }

    // 移动端优化
    if (width < 768) {
      if (screenOrientation === 'portrait') {
        return {
          width: '100%',
          height: `${Math.min(height * 0.6, 500)}px`,
          maxWidth: '100%',
          maxHeight: '60vh'
        };
      } else {
        return {
          width: '100%',
          height: `${Math.min(height * 0.8, 600)}px`,
          maxWidth: '100%',
          maxHeight: '80vh'
        };
      }
    }

    // 桌面端优化
    return {
      width: '100%',
      height: 'auto',
      maxWidth: '1200px',
      maxHeight: '80vh',
      aspectRatio: '16/10'
    };
  };

  // 设置游戏事件监听器
  const setupGameEventListeners = useCallback((gameManager: any) => {
    // 时间变化事件
    gameManager.on('time-changed', (timeData: any) => {
      setGameStats(prev => ({
        ...prev,
        gameTime: `${timeData.hour.toString().padStart(2, '0')}:${timeData.minute.toString().padStart(2, '0')}`,
        currentSeason: timeData.season
      }));
    });

    // 天气变化事件
    gameManager.on('weather-changed', (weatherData: any) => {
      setGameStats(prev => ({
        ...prev,
        currentWeather: weatherData.weather
      }));
    });

    // 玩家状态变化事件
    gameManager.on('player-stats-changed', (stats: any) => {
      setGameStats(prev => ({
        ...prev,
        level: stats.level,
        experience: stats.experience,
        health: stats.health,
        energy: stats.energy,
        happiness: stats.happiness
      }));
    });

    // 游戏保存事件
    gameManager.on('game-saved', () => {
      showNotification('游戏已保存', 'success');
    });

    // 错误事件
    gameManager.on('game-error', (errorMsg: string) => {
      setError(errorMsg);
    });

    // 成就解锁事件
    gameManager.on('achievement-unlocked', (achievement: string) => {
      showNotification(`成就解锁: ${achievement}`, 'achievement');
    });

    // 技能升级事件
    gameManager.on('skill-level-up', (skillData: any) => {
      showNotification(`${skillData.skill} 升级到 ${skillData.level} 级!`, 'levelup');
    });
  }, []);

  // 显示通知
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'achievement' | 'levelup' = 'success') => {
    // 这里可以实现更复杂的通知系统
    console.log(`[${type.toUpperCase()}] ${message}`);
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
      alert('游戏容器未找到，请刷新页面重试');
      return;
    }

    setIsLoading(true);
    setGameStarted(true);
    setError(null);

    try {
      console.log('Starting game initialization...');

      // 动态导入游戏类，避免SSR时的模块加载问题
      const { RPGGame: GameClass } = await import('@/components/game/RPGGame');
      console.log('RPGGame class imported successfully');

      // 创建游戏实例并挂载到DOM容器
      const game = new GameClass(gameRef.current);
      console.log('Game instance created:', game);

      setRpgGameInstance(game);        // 保存完整的RPGGame实例
      setGameInstance(game.game);      // 保存Phaser游戏实例
      
      // 动态导入游戏管理器并设置事件监听器
      const { GameManager } = await import('@/components/game/systems/GameManager');
      const gameManager = GameManager.getInstance();
      setupGameEventListeners(gameManager);
      
      setIsLoading(false); // 游戏加载完成
      console.log('Enhanced game started successfully');
      
      // 设置游戏开始时间用于时间计算
      setGameStartTime(Date.now());
      
      // 自动进入全屏模式
      setTimeout(() => {
        enterFullscreen();
      }, 500); // 延迟500ms确保游戏完全加载
    } catch (error) {
      console.error('Failed to initialize game:', error);
      setError(`游戏启动失败: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false); // 即使失败也要停止加载状态
      setGameStarted(false); // 重置启动状态，允许重试
    }
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
    setRpgGameInstance(null);
    setGameInstance(null);
    setGameStarted(false);
    setIsLoading(false);
    setIsFullscreen(false);
    setError(null);
    
    // 重置游戏统计
    setGameStats({
      level: 1,
      experience: 0,
      health: 100,
      energy: 100,
      happiness: 100,
      currentSeason: 'spring',
      currentWeather: 'sunny',
      gameTime: '06:00'
    });
    
    // 重置时间相关状态
    setGameStartTime(0);
    setCurrentGameTime('06:00');

    console.log('Game reset completed');
  };

  // 游戏控制函数
  const pauseGame = useCallback(async () => {
    if (gameInstance) {
      const { GameManager } = await import('@/components/game/systems/GameManager');
      const gameManager = GameManager.getInstance();
      gameManager.pauseGame();
    }
  }, [gameInstance]);

  const resumeGame = useCallback(async () => {
    if (gameInstance) {
      const { GameManager } = await import('@/components/game/systems/GameManager');
      const gameManager = GameManager.getInstance();
      gameManager.resumeGame();
    }
  }, [gameInstance]);

  const saveGame = useCallback(async () => {
    if (gameInstance) {
      const { GameManager } = await import('@/components/game/systems/GameManager');
      const gameManager = GameManager.getInstance();
      gameManager.saveGame();
    }
  }, [gameInstance]);

  // 退出游戏
  const exitGame = () => {
    if (confirm('确定要退出游戏吗？未保存的进度将会丢失。')) {
      resetGame();
      if (isFullscreen) {
        exitFullscreen();
      }
    }
  };

  // 设置变更处理
  const handleSettingChange = useCallback(async (setting: string, value: any) => {
    setGameSettings(prev => ({
      ...prev,
      [setting]: value
    }));

    // 应用设置到游戏
    if (gameInstance) {
      const { GameManager } = await import('@/components/game/systems/GameManager');
      const gameManager = GameManager.getInstance();
      switch (setting) {
        case 'musicVolume':
        case 'sfxVolume':
          gameManager.emit('audio-setting-changed', { [setting]: value });
          break;
        case 'fullscreen':
          if (typeof window !== 'undefined') {
            if (value) {
              enterFullscreen();
            } else {
              exitFullscreen();
            }
          }
          break;
      }
    }
  }, [gameInstance]);

  // 重试初始化
  const retryInitialization = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setGameStarted(false);
    setGameInstance(null);
    setRpgGameInstance(null);
    setTimeout(() => startGame(), 500);
  }, []);

  // 进入全屏模式 - 增强移动端支持
  const enterFullscreen = async () => {
    if (!gameRef.current) {
      console.warn('Game container not available for fullscreen');
      return;
    }

    try {
      // 对于iOS设备，使用模拟全屏
      if (platformInfo.isIOS || !supportsFullscreen()) {
        // iOS Safari 不支持真正的全屏，使用模拟全屏
        setIsFullscreen(true);
        
        // 隐藏地址栏（iOS Safari特殊处理）
        if (platformInfo.isIOS) {
          // 滚动到顶部以隐藏地址栏
          window.scrollTo(0, 1);
          setTimeout(() => window.scrollTo(0, 0), 100);
          
          // 设置viewport meta标签以防止缩放
          let viewportMeta = document.querySelector('meta[name="viewport"]');
          if (viewportMeta) {
            viewportMeta.setAttribute('content', 
              'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
          }
        }
        
        // 添加模拟全屏样式
        document.body.classList.add('fullscreen-active');
        if (gameRef.current) {
          gameRef.current.classList.add('fullscreen-simulated');
        }
        
        console.log('Mobile fullscreen simulation activated');
        return;
      }

      // 标准全屏API（桌面端和支持的移动浏览器）
      if (gameRef.current.requestFullscreen) {
        await gameRef.current.requestFullscreen();
      } else if ((gameRef.current as any).webkitRequestFullscreen) {
        await (gameRef.current as any).webkitRequestFullscreen();
      } else if ((gameRef.current as any).mozRequestFullScreen) {
        await (gameRef.current as any).mozRequestFullScreen();
      } else if ((gameRef.current as any).msRequestFullscreen) {
        await (gameRef.current as any).msRequestFullscreen();
      } else {
        // 如果所有API都不支持，降级到模拟全屏
        console.log('No fullscreen API available, using simulated fullscreen');
        setIsFullscreen(true);
        document.body.classList.add('fullscreen-active');
        if (gameRef.current) {
          gameRef.current.classList.add('fullscreen-simulated');
        }
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      // 降级到模拟全屏
      try {
        setIsFullscreen(true);
        document.body.classList.add('fullscreen-active');
        if (gameRef.current) {
          gameRef.current.classList.add('fullscreen-simulated');
        }
      } catch (fallbackError) {
        console.error('Failed to activate simulated fullscreen:', fallbackError);
      }
    }
  };

  // 退出全屏模式 - 增强移动端支持
  const exitFullscreen = async () => {
    try {
      // 如果是模拟全屏或iOS设备
      if (platformInfo.isIOS || !document.fullscreenElement) {
        setIsFullscreen(false);
        
        // 恢复页面样式
        document.body.classList.remove('fullscreen-active');
        if (gameRef.current) {
          gameRef.current.classList.remove('fullscreen-simulated');
        }
        
        // 恢复viewport设置（iOS）
        if (platformInfo.isIOS) {
          let viewportMeta = document.querySelector('meta[name="viewport"]');
          if (viewportMeta) {
            viewportMeta.setAttribute('content', 
              'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
            );
          }
        }
        
        console.log('Mobile fullscreen simulation deactivated');
        return;
      }

      // 标准全屏API退出
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
      // 强制退出模拟全屏
      try {
        setIsFullscreen(false);
        document.body.classList.remove('fullscreen-active');
        if (gameRef.current) {
          gameRef.current.classList.remove('fullscreen-simulated');
        }
      } catch (fallbackError) {
        console.error('Failed to deactivate simulated fullscreen:', fallbackError);
      }
    }
  };

  // 监听全屏状态变化，通知游戏实例
  useEffect(() => {
    try {
      if (rpgGameInstance && typeof rpgGameInstance.setFullscreenMode === 'function') {
        rpgGameInstance.setFullscreenMode(isFullscreen);
      }
    } catch (error) {
      console.error('Error notifying game instance of fullscreen change:', error);
      // Don't throw the error to prevent application crash
    }
  }, [isFullscreen, rpgGameInstance]);

  // 键盘快捷键
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted) return;

      switch (e.key) {
        case 'F5':
          e.preventDefault();
          saveGame();
          break;
        case 'Escape':
          e.preventDefault();
          pauseGame();
          break;
        case 'F11':
          e.preventDefault();
          handleSettingChange('fullscreen', !gameSettings.fullscreen);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, saveGame, pauseGame, gameSettings.fullscreen, handleSettingChange]);

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
        setRpgGameInstance(null);
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

  const gameSize = getOptimalGameSize();

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 w-screen h-screen overflow-hidden' : 'min-h-screen'} bg-gradient-to-b from-slate-900 to-slate-800`}>
      {/* 游戏标题头部区域 - 全屏时隐藏 */}
      {!isFullscreen && (
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">🐱 小猫农场 - 增强版</h1>
            <p className="text-white/80 text-sm">
              集成了现代农场系统、天气系统和增强UI的治愈系农场游戏
            </p>
          </div>
        </div>
      )}

      {/* 游戏主体容器区域 */}
      <div className={`flex flex-col items-center justify-center ${isFullscreen ? 'w-full h-full' : 'p-0'}`}>
        <div className={`relative ${isFullscreen ? 'w-full h-full' : 'w-full'}`}>
          {/* 改进的游戏容器 - 更好的响应式设计 */}
          <div
            ref={gameRef}
            className={`game-container ${gameStarted ? 'block' : 'hidden'} w-full bg-gradient-to-br from-slate-900 to-black overflow-hidden border-slate-600/50 touch-none select-none ${isFullscreen
              ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
              : 'rounded-xl'
              }`}
            style={{
              width: isFullscreen ? '100vw' : gameSize.width,
              height: isFullscreen ? '100vh' : gameSize.height,
              maxWidth: isFullscreen ? '100vw' : gameSize.maxWidth,
              maxHeight: isFullscreen ? '100vh' : gameSize.maxHeight,
              aspectRatio: isFullscreen ? 'unset' : gameSize.aspectRatio,
              minHeight: isFullscreen ? '100vh' : '400px',
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
            <div className={`flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 border-slate-600/50 ${screenOrientation === 'portrait' ? 'min-h-[50vh]' : 'min-h-[700px]'
              }`}>
              <div className="text-center p-8 max-w-md mx-auto">
                <div className="text-6xl mb-6">🐱</div>
                <h2 className="text-3xl font-bold text-white mb-4">小猫农场</h2>
                <p className="text-slate-300 mb-8">
                  准备好体验温馨治愈的农场生活了吗？种植作物、烹饪美食、照料可爱的小猫！
                </p>

                {/* 设备适配提示 */}
                <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="text-sm text-slate-300">
                    <div className="flex items-center justify-center mb-2">
                      <span className="mr-2">{screenOrientation === 'portrait' ? '📱' : '💻'}</span>
                      <span>当前设备: {screenOrientation === 'portrait' ? '竖屏模式' : '横屏模式'}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      屏幕尺寸: {viewportSize.width} × {viewportSize.height}
                    </div>
                  </div>
                </div>

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

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => window.open('/game/multi-atlas-debug', '_blank')}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-300"
                    >
                      🔧 调试工具
                    </button>

                    <button
                      onClick={resetGame}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all duration-300"
                    >
                      🔄 重置
                    </button>
                  </div>

                  <div className="text-center text-slate-400 text-xs mt-2">
                    游戏将根据您的设备自动优化布局和控制方式
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 增强版UI组件 */}
          {gameStarted && !isLoading && (
            <>
              {/* 游戏状态栏 */}
              <div className={`absolute z-50 bg-black/20 backdrop-blur-md rounded-lg text-white max-w-xs ${
                screenOrientation === 'portrait' ? 'top-2 left-2 p-3' : 'top-4 left-4 p-4'
              }`}>
                <div className={`grid grid-cols-2 gap-4 ${screenOrientation === 'portrait' ? 'text-xs' : 'text-sm'}`}>
                  <div>
                    <div>等级: {gameStats.level}</div>
                    <div>经验: {gameStats.experience}</div>
                    <div>时间: {gameStats.gameTime}</div>
                  </div>
                  <div>
                    <div>季节: {gameStats.currentSeason}</div>
                    <div>天气: {gameStats.currentWeather}</div>
                    <div>健康: {gameStats.health}%</div>
                  </div>
                </div>
              </div>

              {/* 游戏控制面板 - 设置按钮（右上角） */}
              <div className={`absolute z-50 bg-black/20 backdrop-blur-md rounded-lg p-3 ${
                screenOrientation === 'portrait' ? 'top-2 right-2' : 'top-4 right-4'
              }`}>
                <button
                  onClick={() => setShowSettings(true)}
                  className={`bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors flex items-center ${
                    screenOrientation === 'portrait' ? 'px-2 py-1' : 'px-3 py-1'
                  }`}
                  disabled={!gameStarted}
                >
                  <span className="mr-1">⚙️</span>
                  {screenOrientation === 'portrait' ? '' : '设置'}
                </button>
              </div>

            </>
          )}

          {/* 游戏运行时的遮罩和控制 */}
          {gameStarted && (
            <>
              {/* 增强版游戏加载遮罩层 */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-end justify-center z-100 pb-4">
                  <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold mb-2">正在加载农场...</h2>
                    <p className="text-gray-600">
                      正在初始化增强版农场游戏系统
                    </p>
                    <div className="mt-4 text-sm text-gray-500">
                      <p>• 加载游戏引擎</p>
                      <p>• 初始化农业系统</p>
                      <p>• 设置天气系统</p>
                      <p>• 准备音效系统</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 错误界面 */}
              {error && (
                <div className="absolute inset-0 bg-black/50 flex items-end justify-center z-100 pb-4">
                  <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold mb-2 text-red-600">游戏加载失败</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <div className="space-y-2">
                      <button
                        onClick={retryInitialization}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        重试 (尝试 {retryCount + 1})
                      </button>
                      <button
                        onClick={() => typeof window !== 'undefined' && window.location.reload()}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                      >
                        刷新页面
                      </button>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      <p>如果问题持续存在，请检查浏览器控制台获取详细错误信息</p>
                    </div>
                  </div>
                </div>
              )}


            </>
          )}
        </div>

        {/* 游戏控制说明 - 只在非全屏和非移动端显示 */}
        {!isFullscreen && viewportSize.width >= 768 && (
          <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 w-full max-w-7xl border border-slate-600 shadow-2xl">
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
                        <span className="text-blue-400 font-medium">智能虚拟摇杆</span>
                        <p className="text-slate-300 text-xs">自适应定位，防卡死设计</p>
                      </div>
                    </div>

                    <div className="flex items-center bg-slate-800/30 rounded-lg p-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full mr-3 flex items-center justify-center text-sm">🐾</div>
                      <div>
                        <span className="text-green-400 font-medium">智能交互按钮</span>
                        <p className="text-slate-300 text-xs">自动避让，优化布局</p>
                      </div>
                    </div>

                    <div className="flex items-center bg-slate-800/30 rounded-lg p-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full mr-3 flex items-center justify-center text-sm">🎒</div>
                      <div>
                        <span className="text-purple-400 font-medium">响应式UI</span>
                        <p className="text-slate-300 text-xs">自适应屏幕尺寸</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-400/20">
                    <div className="flex items-center mb-2">
                      <span className="text-yellow-400 mr-2">✨</span>
                      <span className="font-medium text-yellow-400">新特性</span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      全新的防卡死摇杆系统，支持多点触控，智能冲突检测
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 平台检测信息 */}
            <div className="mt-6 bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-xl p-4 border border-blue-400/20">
              <h4 className="font-bold text-blue-400 mb-3 flex items-center">
                <span className="mr-2">🔍</span>平台检测
              </h4>
              <div className="text-sm">
                <div className="flex items-center mb-2">
                  <span className="text-green-400 mr-2">📱</span>
                  <span className="text-slate-300">当前平台: <span className="text-blue-400 font-medium">{platformInfo.platform}</span></span>
                </div>
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-2">⚙️</span>
                  <span className="text-slate-300">控制方式: <span className="text-purple-400 font-medium">{platformInfo.isMobile ? '虚拟摇杆' : '键盘控制'}</span></span>
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

      {/* 设置菜单 */}
      <GameSettingsMenu
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={saveGame}
        onExitGame={exitGame}
        gameSettings={gameSettings}
        onSettingsChange={setGameSettings}
        isFullscreen={isFullscreen}
      />
    </div>
  );
};

export default GamePage;