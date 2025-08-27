'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameManager } from '../../../components/game/systems/GameManager';

// 强制动态渲染以防止SSR问题
export const dynamic = 'force-dynamic';

/**
 * 增强版农场游戏页面
 * 集成了所有新的系统和功能，参考top-down-react-phaser-game的最佳实践
 */
const EnhancedGamePage: React.FC = () => {
  // 游戏容器引用
  const gameRef = useRef<HTMLDivElement>(null);
  
  // 状态管理
  const [isLoading, setIsLoading] = useState(true);
  const [gameInstance, setGameInstance] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
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

  // 客户端检测
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 游戏初始化
  const initializeGame = useCallback(async () => {
    if (!isClient || !gameRef.current || gameStarted) return;

    try {
      setIsLoading(true);
      setError(null);

      // 动态导入游戏类（避免SSR问题）
      const { RPGGame } = await import('../../../components/game/RPGGame');
      
      // 创建游戏实例
      const game = new RPGGame(gameRef.current);
      setGameInstance(game);
      
      // 获取游戏管理器实例
      const gameManager = GameManager.getInstance();
      
      // 设置事件监听器
      setupGameEventListeners(gameManager);
      
      setGameStarted(true);
      setIsLoading(false);
      
      console.log('Enhanced game initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize enhanced game:', error);
      setError(`游戏初始化失败: ${error}`);
      setIsLoading(false);
    }
  }, [isClient, gameStarted]);

  // 设置游戏事件监听器
  const setupGameEventListeners = useCallback((gameManager: GameManager) => {
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

  // 游戏控制函数
  const pauseGame = useCallback(() => {
    if (gameInstance) {
      const gameManager = GameManager.getInstance();
      gameManager.pauseGame();
    }
  }, [gameInstance]);

  const resumeGame = useCallback(() => {
    if (gameInstance) {
      const gameManager = GameManager.getInstance();
      gameManager.resumeGame();
    }
  }, [gameInstance]);

  const saveGame = useCallback(() => {
    if (gameInstance) {
      const gameManager = GameManager.getInstance();
      gameManager.saveGame();
    }
  }, [gameInstance]);

  const resetGame = useCallback(() => {
    if (gameInstance && window.confirm('确定要重置游戏吗？这将清除所有进度！')) {
      const gameManager = GameManager.getInstance();
      gameManager.resetGame();
      
      // 重新初始化游戏
      setGameStarted(false);
      setGameInstance(null);
      setTimeout(() => initializeGame(), 100);
    }
  }, [gameInstance, initializeGame]);

  // 设置变更处理
  const handleSettingChange = useCallback((setting: string, value: any) => {
    setGameSettings(prev => ({
      ...prev,
      [setting]: value
    }));

    // 应用设置到游戏
    if (gameInstance) {
      const gameManager = GameManager.getInstance();
      switch (setting) {
        case 'musicVolume':
        case 'sfxVolume':
          gameManager.emit('audio-setting-changed', { [setting]: value });
          break;
        case 'fullscreen':
          if (value) {
            document.documentElement.requestFullscreen?.();
          } else {
            document.exitFullscreen?.();
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
    setTimeout(() => initializeGame(), 500);
  }, [initializeGame]);

  // 键盘快捷键
  useEffect(() => {
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

  // 自动初始化游戏
  useEffect(() => {
    if (isClient && !gameStarted && !isLoading && !error) {
      initializeGame();
    }
  }, [isClient, gameStarted, isLoading, error, initializeGame]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (gameInstance) {
        try {
          gameInstance.destroy?.();
        } catch (e) {
          console.warn('Error destroying game instance:', e);
        }
      }
    };
  }, [gameInstance]);

  if (!isClient) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">正在加载...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-400 relative overflow-hidden">
      {/* 游戏标题 */}
      <div className="absolute top-4 left-4 z-50">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          🐱 小猫农场 - 增强版
        </h1>
        <p className="text-white/80 mt-1">
          参考 top-down-react-phaser-game 的现代农场模拟游戏
        </p>
      </div>

      {/* 游戏状态栏 */}
      <div className="absolute top-4 right-4 z-50 bg-black/20 backdrop-blur-md rounded-lg p-4 text-white">
        <div className="grid grid-cols-2 gap-4 text-sm">
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

      {/* 游戏控制面板 */}
      <div className="absolute bottom-4 left-4 z-50 bg-black/20 backdrop-blur-md rounded-lg p-3">
        <div className="flex gap-2">
          <button
            onClick={saveGame}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
            disabled={!gameStarted}
          >
            💾 保存
          </button>
          <button
            onClick={pauseGame}
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
            disabled={!gameStarted}
          >
            ⏸️ 暂停
          </button>
          <button
            onClick={resetGame}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
            disabled={!gameStarted}
          >
            🔄 重置
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      <div className="absolute bottom-4 right-4 z-50 bg-black/20 backdrop-blur-md rounded-lg p-3">
        <div className="text-white text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span>音乐:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={gameSettings.musicVolume}
              onChange={(e) => handleSettingChange('musicVolume', parseInt(e.target.value))}
              className="w-16"
            />
            <span>{gameSettings.musicVolume}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span>音效:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={gameSettings.sfxVolume}
              onChange={(e) => handleSettingChange('sfxVolume', parseInt(e.target.value))}
              className="w-16"
            />
            <span>{gameSettings.sfxVolume}%</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={gameSettings.autoSave}
              onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
            />
            <span>自动保存</span>
          </div>
        </div>
      </div>

      {/* 加载界面 */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-100">
          <div className="bg-white rounded-lg p-8 text-center max-w-md">
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
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-100">
          <div className="bg-white rounded-lg p-8 text-center max-w-md">
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
                onClick={() => window.location.reload()}
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

      {/* 游戏容器 */}
      <div
        ref={gameRef}
        className="w-full h-screen relative"
        style={{
          imageRendering: 'pixelated',
          imageRendering: '-moz-crisp-edges',
          imageRendering: 'crisp-edges'
        }}
      />

      {/* 帮助信息 */}
      {gameStarted && (
        <div className="absolute top-20 left-4 z-40 bg-black/20 backdrop-blur-md rounded-lg p-3 text-white text-xs max-w-xs">
          <h3 className="font-bold mb-2">🎮 游戏控制</h3>
          <div className="space-y-1">
            <p><kbd>WASD</kbd> 或 <kbd>方向键</kbd> - 移动小猫</p>
            <p><kbd>空格</kbd> 或 <kbd>E</kbd> - 交互</p>
            <p><kbd>I</kbd> - 打开背包</p>
            <p><kbd>C</kbd> - 打开烹饪界面</p>
            <p><kbd>1-4</kbd> - 选择工具</p>
            <p><kbd>F5</kbd> - 保存游戏</p>
            <p><kbd>ESC</kbd> - 暂停游戏</p>
            <p><kbd>F11</kbd> - 全屏切换</p>
          </div>
          <h3 className="font-bold mt-3 mb-2">📱 移动端</h3>
          <p>使用屏幕上的虚拟摇杆和按钮进行游戏</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedGamePage;