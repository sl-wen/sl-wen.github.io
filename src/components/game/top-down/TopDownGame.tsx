'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TopDownGameEngine } from './TopDownGameEngine';
import { CompleteGameUI } from './ui/CompleteGameUI';
import { CompleteGameScene } from './scenes/CompleteGameScene';
import { mobileTestHelper } from './MobileTestHelper';
import { InventorySystem } from './systems/InventorySystem';
import { QuestSystem } from './systems/QuestSystem';
import { CombatSystem } from './systems/CombatSystem';
import { GameDataManager } from './systems/GameDataManager';
import { SoundManager } from './systems/SoundManager';
import { MapManager } from './systems/MapManager';
import { CraftingSystem } from './systems/CraftingSystem';
import { ShopSystem } from './systems/ShopSystem';

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
  const [isGameReady, setIsGameReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('游戏初始化中...');

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

  // 计算游戏尺寸
  const calculateGameSize = () => {
    // 检测是否为移动设备
    const deviceInfo = mobileTestHelper.detectDevice();
    const isMobileDevice = deviceInfo.isMobile || deviceInfo.touchSupport;
    
    if (isMobileDevice) {
      // 移动设备：使用更大的尺寸以确保START按钮可见
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // 为移动设备预留更多空间给START按钮
      const availableWidth = Math.min(screenWidth - 40, 500); // 最大500px，留40px边距
      const availableHeight = Math.min(screenHeight - 200, 400); // 最大400px，留200px给UI
      
      return { 
        width: availableWidth, 
        height: availableHeight, 
        multiplier: 1 
      };
    } else {
      // 桌面设备：使用原有的计算逻辑
      let gameWidth = 400;
      let gameHeight = 224; // 16 * 14 = 224
      const multiplier = Math.min(
        Math.floor(window.innerWidth / 400), 
        Math.floor(window.innerHeight / 224)
      ) || 1;

      if (multiplier > 1) {
        gameWidth += Math.floor((window.innerWidth - gameWidth * multiplier) / (16 * multiplier)) * 16;
        gameHeight += Math.floor((window.innerHeight - gameHeight * multiplier) / (16 * multiplier)) * 16;
      }

      return { width: gameWidth, height: gameHeight, multiplier };
    }
  };

  const gameSize = calculateGameSize();

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
    if (!gameContainerRef.current) return;

    setDebugInfo('创建游戏引擎...');

    // 创建游戏引擎实例
    gameEngineRef.current = new TopDownGameEngine(gameContainerRef.current, {
      // 使用容器的实际渲染尺寸，避免画布内部分辨率过小
      width: gameSize.width * gameSize.multiplier,
      height: gameSize.height * gameSize.multiplier,
      parent: gameContainerRef.current,
      backgroundColor: '#2c3e50',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [CompleteGameScene]
    });

    setDebugInfo('游戏引擎创建完成，等待场景启动...');
    setIsGameReady(true);

    return () => {
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

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div
        ref={gameContainerRef}
        className="border-2 border-gray-600 rounded-lg overflow-hidden mx-auto"
        style={{
          width: gameSize.width * gameSize.multiplier,
          height: gameSize.height * gameSize.multiplier,
          maxWidth: '100%',
          maxHeight: '70vh'
        }}
      />

      {!isGameReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-white text-xl">{debugInfo}</div>
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
