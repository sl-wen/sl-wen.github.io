'use client';

import * as Phaser from 'phaser';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { mobileTestHelper } from './MobileTestHelper';
import BootScene from './scenes/BootScene';
import { CompleteGameScene } from './scenes/CompleteGameScene';
import GameOverScene from './scenes/GameOverScene';
import MainMenuScene from './scenes/MainMenuScene';
import { CombatSystem } from './systems/CombatSystem';
import { CraftingSystem } from './systems/CraftingSystem';
import { GameDataManager } from './systems/GameDataManager';
import { InventorySystem } from './systems/InventorySystem';
import { MapManager } from './systems/MapManager';
import { QuestSystem } from './systems/QuestSystem';
import { ShopSystem } from './systems/ShopSystem';
import { SoundManager } from './systems/SoundManager';
import { TopDownGameEngine } from './TopDownGameEngine';
import { CompleteGameUI } from './ui/CompleteGameUI';
import { createWindowManager, WindowManager, DeviceType } from './systems/WindowManager';
import { LoadingProgressUI, MobileLoadingProgress } from './ui/LoadingProgressUI';

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
  const windowManagerRef = useRef<WindowManager | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('游戏初始化中...');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ total: 0, loaded: 0, failed: 0, retrying: 0, percentage: 0 });

  // 游戏状态
  const [playerStats, setPlayerStats] = useState({
    health: 100,
    maxHealth: 100,
    level: 1,
    experience: 0,
    gold: 0
  });

  const [inventory, setInventory] = useState<any[]>([]);
  const [quests, setQuests] = useState<any[]>([]);
  const [currentMap, setCurrentMap] = useState('village');

  // 游戏系统实例
  const [gameSystems] = useState(() => ({
    inventory: InventorySystem.getInstance(),
    questSystem: QuestSystem.getInstance(),
    combatSystem: CombatSystem.getInstance(),
    gameDataManager: GameDataManager.getInstance(),
    soundManager: SoundManager.getInstance(),
    mapManager: MapManager.getInstance(),
    craftingSystem: CraftingSystem.getInstance(),
    shopSystem: ShopSystem.getInstance()
  }));

  // 计算游戏尺寸 - 使用窗口管理器
  const calculateGameSize = () => {
    if (windowManagerRef.current) {
      const config = windowManagerRef.current.getConfig();
      return {
        width: config.width,
        height: config.height,
        multiplier: config.scale
      };
    }

    // 备用计算方式
    const deviceInfo = mobileTestHelper.detectDevice();
    const isMobileDevice = deviceInfo.isMobile || deviceInfo.touchSupport;
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight;

    if (isMobileDevice) {
      const maxWidth = Math.min(availableWidth - 5, 1400);
      const maxHeight = Math.min(availableHeight - 40, 1000);
      const aspectRatio = 16 / 9;
      let gameWidth = maxWidth;
      let gameHeight = gameWidth / aspectRatio;

      if (gameHeight > maxHeight) {
        gameHeight = maxHeight;
        gameWidth = gameHeight * aspectRatio;
      }

      return {
        width: Math.floor(gameWidth),
        height: Math.floor(gameHeight),
        multiplier: 1
      };
    } else {
      const maxWidth = Math.min(availableWidth - 5, 2400);
      const maxHeight = Math.min(availableHeight - 10, 1800);
      const aspectRatio = 16 / 9;
      let gameWidth = maxWidth;
      let gameHeight = gameWidth / aspectRatio;

      if (gameHeight > maxHeight) {
        gameHeight = maxHeight;
        gameWidth = gameHeight * aspectRatio;
      }

      gameWidth = Math.floor(gameWidth / 16) * 16;
      gameHeight = Math.floor(gameHeight / 16) * 16;

      return {
        width: gameWidth,
        height: gameHeight,
        multiplier: 1
      };
    }
  };

  const [gameSize, setGameSize] = useState(calculateGameSize());

  // 响应式调整游戏尺寸 - 使用窗口管理器
  useEffect(() => {
    if (windowManagerRef.current) {
      const handleResize = () => {
        const newGameSize = calculateGameSize();
        setGameSize(newGameSize);
      };

      windowManagerRef.current.on('resize', handleResize);
      return () => windowManagerRef.current?.off('resize', handleResize);
    }
  }, []);

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const deviceInfo = mobileTestHelper.detectDevice();
      setIsMobile(deviceInfo.isMobile || deviceInfo.touchSupport);

      if (process.env.NODE_ENV === 'development') {
        mobileTestHelper.showDeviceInfo();
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 初始化游戏引擎
  useEffect(() => {
    if (!gameContainerRef.current) {
      console.log('❌ 游戏容器未找到');
      return;
    }

    console.log('🎮 开始初始化游戏引擎');
    setDebugInfo('创建游戏引擎...');
    setIsLoading(true);

    try {
      // 创建游戏引擎实例
      gameEngineRef.current = new TopDownGameEngine(gameContainerRef.current, {
        width: gameSize.width,
        height: gameSize.height,
        parent: gameContainerRef.current,
        type: Phaser.AUTO,
        backgroundColor: '#2c3e50',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
          }
        },
        scene: [BootScene, MainMenuScene, CompleteGameScene, GameOverScene]
      });

      console.log('✅ 游戏引擎创建成功');

      // 创建窗口管理器
      const game = gameEngineRef.current.getGame();
      if (game) {
        console.log('🎮 游戏实例获取成功');
        windowManagerRef.current = createWindowManager(game);
        
        // 监听窗口管理器事件
        windowManagerRef.current.on('resize', (event) => {
          console.log('🔄 窗口大小变化:', event);
          setGameSize(calculateGameSize());
        });

        windowManagerRef.current.on('orientation', (event) => {
          console.log('📱 方向变化:', event);
          setGameSize(calculateGameSize());
        });

        // 监听游戏场景事件
        game.events.on('scene-start', (scene: Phaser.Scene) => {
          console.log('🎮 场景启动:', scene.scene.key);
          if (scene.scene.key === 'BootScene') {
            setDebugInfo('资源加载中...');
          } else if (scene.scene.key === 'MainMenuScene') {
            setDebugInfo('主菜单已加载');
            setIsLoading(false);
            setIsGameReady(true);
          }
        });

        // 监听资源加载进度
        game.events.on('load-progress', (progress: any) => {
          console.log('📊 加载进度:', progress);
          setLoadingProgress(progress);
        });

        // 监听资源加载完成
        game.events.on('load-complete', (progress: any) => {
          console.log('✅ 资源加载完成:', progress);
          setLoadingProgress(progress);
          setIsLoading(false);
          setIsGameReady(true);
          setDebugInfo('游戏准备就绪');
        });

        // 监听游戏错误
        game.events.on('error', (error: any) => {
          console.error('❌ 游戏错误:', error);
          setDebugInfo('游戏错误: ' + error.message);
        });

      } else {
        console.error('❌ 无法获取游戏实例');
        setDebugInfo('游戏实例创建失败');
      }

      setDebugInfo('游戏引擎创建完成，等待场景启动...');

    } catch (error) {
      console.error('❌ 游戏引擎初始化失败:', error);
      setDebugInfo('游戏引擎初始化失败: ' + (error as Error).message);
    }

    return () => {
      console.log('🧹 清理游戏引擎');
      if (windowManagerRef.current) {
        windowManagerRef.current.destroy();
        windowManagerRef.current = null;
      }
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
        gameEngineRef.current = null;
      }
    };
  }, [gameSize.width, gameSize.height]);

  // 处理游戏事件
  useEffect(() => {
    const onMenuItems = (e: Event) => {
      const detail = (e as CustomEvent).detail as { menuItems: string[]; menuPosition?: 'center' | 'left' };
      console.log('收到菜单项事件:', detail);
      setDebugInfo('主菜单已加载');
    };

    const onDialog = (e: Event) => {
      const detail = (e as CustomEvent).detail as { characterName: string; message?: string };
      console.log('收到对话事件:', detail);
      setDebugInfo(`与 ${detail.characterName} 对话中...`);
    };

    const onHeroHealth = (e: Event) => {
      const detail = (e as CustomEvent).detail as { healthStates: string[] };

      // 更新玩家状态
      if (detail.healthStates && detail.healthStates[0]) {
        const healthCount = detail.healthStates.filter(state => state === 'full').length;
        const maxHealth = detail.healthStates.length * 20;
        const currentHealth = healthCount * 20;

        setPlayerStats(prev => ({
          ...prev,
          health: currentHealth,
          maxHealth: maxHealth
        }));
      }
    };

    const onHeroCoin = (e: Event) => {
      const detail = (e as CustomEvent).detail as { heroCoins: number };
      setPlayerStats(prev => ({
        ...prev,
        gold: detail.heroCoins
      }));
    };

    // 新增：处理背包更新事件
    const onInventoryChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail as { inventory: any[] };
      console.log('背包更新:', detail.inventory);
      setInventory(detail.inventory || []);
    };

    // 新增：处理任务更新事件
    const onQuestChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail as { quests: any[] };
      console.log('任务更新:', detail.quests);
      setQuests(detail.quests || []);
    };

    // 新增：处理等级更新事件
    const onLevelUp = (e: Event) => {
      const detail = (e as CustomEvent).detail as { level: number; experience: number };
      setPlayerStats(prev => ({
        ...prev,
        level: detail.level,
        experience: detail.experience
      }));
      setDebugInfo(`升级到 ${detail.level} 级！`);
    };

    // 新增：处理地图切换事件
    const onMapChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail as { fromMap: string; toMap: string };
      setCurrentMap(detail.toMap);
      setDebugInfo(`切换到 ${detail.toMap} 地图`);
    };

    window.addEventListener('menu-items', onMenuItems as EventListener);
    window.addEventListener('new-dialog', onDialog as EventListener);
    window.addEventListener('hero-health', onHeroHealth as EventListener);
    window.addEventListener('hero-coin', onHeroCoin as EventListener);
    window.addEventListener('inventory-changed', onInventoryChanged as EventListener);
    window.addEventListener('quest-changed', onQuestChanged as EventListener);
    window.addEventListener('level-up', onLevelUp as EventListener);
    window.addEventListener('map-changed', onMapChanged as EventListener);

    return () => {
      window.removeEventListener('menu-items', onMenuItems as EventListener);
      window.removeEventListener('new-dialog', onDialog as EventListener);
      window.removeEventListener('hero-health', onHeroHealth as EventListener);
      window.removeEventListener('hero-coin', onHeroCoin as EventListener);
      window.removeEventListener('inventory-changed', onInventoryChanged as EventListener);
      window.removeEventListener('quest-changed', onQuestChanged as EventListener);
      window.removeEventListener('level-up', onLevelUp as EventListener);
      window.removeEventListener('map-changed', onMapChanged as EventListener);
    };
  }, []);

  // 处理键盘输入
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' && !gameStarted) {
        e.preventDefault();
        startGame();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameStarted]);

  const startGame = useCallback(() => {
    if (!gameEngineRef.current) return;

    setGameStarted(true);
    setDebugInfo('游戏开始！');

    // 启动游戏场景
    const game = gameEngineRef.current.getGame();
    if (game) {
      game.scene.start('CompleteGameScene', {
        heroStatus: {
          health: playerStats.health,
          maxHealth: playerStats.maxHealth,
          coin: playerStats.gold,
          canPush: false,
          haveSword: false,
          level: playerStats.level,
          experience: playerStats.experience
        }
      });
    }
  }, [playerStats]);

  const handleInventoryChange = (newInventory: any[]) => {
    setInventory(newInventory);
    // 触发背包更新事件
    const customEvent = new CustomEvent('inventory-changed', {
      detail: { inventory: newInventory }
    });
    window.dispatchEvent(customEvent);
  };

  const handleStatsChange = (newStats: any) => {
    setPlayerStats(newStats);
    // 触发状态更新事件
    const customEvent = new CustomEvent('stats-changed', {
      detail: { stats: newStats }
    });
    window.dispatchEvent(customEvent);
  };

  // 添加容器尺寸调试信息
  useEffect(() => {
    if (gameContainerRef.current) {
      const container = gameContainerRef.current;
      const rect = container.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(container);

      console.log('📦 [DEBUG] 游戏容器尺寸信息:', {
        containerElement: container,
        boundingRect: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right
        },
        computedStyle: {
          width: computedStyle.width,
          height: computedStyle.height,
          maxWidth: computedStyle.maxWidth,
          maxHeight: computedStyle.maxHeight,
          margin: computedStyle.margin,
          padding: computedStyle.padding
        },
        gameSize: gameSize,
        windowSize: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          outerWidth: window.outerWidth,
          outerHeight: window.outerHeight
        }
      });
    }
  }, [gameSize]);

  return (
    <div className="relative w-full max-w-full mx-auto">
      {/* 加载进度UI */}
      {isLoading && (
        isMobile ? (
          <MobileLoadingProgress progress={loadingProgress} />
        ) : (
          <LoadingProgressUI 
            progress={loadingProgress}
            onComplete={() => setIsLoading(false)}
            onError={(error) => {
              console.error('加载错误:', error);
              setIsLoading(false);
            }}
          />
        )
      )}

      <div
        ref={gameContainerRef}
        className="border-2 border-gray-600 rounded-lg overflow-hidden mx-auto bg-black"
        style={{
          width: gameSize.width,
          height: gameSize.height,
          maxWidth: '100%',
          maxHeight: '95vh'
        }}
      />

      {/* 调试信息显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 z-50 bg-black bg-opacity-75 text-white text-xs p-2 rounded border border-gray-600 max-w-xs">
          <div className="font-bold mb-1">🔍 调试信息</div>
          <div>窗口: {window.innerWidth} x {window.innerHeight}</div>
          <div>游戏: {gameSize.width} x {gameSize.height}</div>
          <div>设备: {isMobile ? '移动' : '桌面'}</div>
          <div>状态: {isGameReady ? '就绪' : '初始化'}</div>
          <div>开始: {gameStarted ? '是' : '否'}</div>
          <div className="mt-1 text-yellow-300">{debugInfo}</div>
        </div>
      )}

      {!isGameReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-white text-center">
            <div className="text-xl mb-2">{debugInfo}</div>
            <div className="text-sm opacity-75">
              游戏尺寸: {gameSize.width} x {gameSize.height}
            </div>
          </div>
        </div>
      )}

      {gameStarted && (
        <CompleteGameUI
          width={gameSize.width}
          height={gameSize.height}
          multiplier={gameSize.multiplier}
          playerStats={playerStats}
          inventory={inventory}
          quests={quests}
          currentMap={currentMap}
          onInventoryChange={handleInventoryChange}
          onStatsChange={handleStatsChange}
        />
      )}

      {!gameStarted && isGameReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center p-4">
            {/* 添加闪烁动画的提示文字 */}
            <div className="mb-4 animate-pulse">
              <p className="text-white text-lg md:text-xl font-semibold mb-2">
                🎮 游戏准备就绪
              </p>
              <p className="text-yellow-300 text-sm md:text-base">
                点击下方按钮开始游戏
              </p>
            </div>

            <button
              onClick={startGame}
              className={`
                bg-green-600 hover:bg-green-700 active:bg-green-800 
                text-white font-bold transition-all duration-200 
                transform hover:scale-105 active:scale-95
                shadow-lg hover:shadow-xl
                ${isMobile ? 'px-12 py-6 text-2xl rounded-xl' : 'px-10 py-5 text-xl rounded-lg'}
              `}
              style={{
                minWidth: isMobile ? '200px' : '160px',
                minHeight: isMobile ? '80px' : '60px'
              }}
            >
              START
            </button>
            {isMobile && (
              <p className="text-white text-sm mt-3 opacity-80">
                点击开始游戏
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
