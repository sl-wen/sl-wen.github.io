import GridEngine from 'grid-engine';
import Phaser from 'phaser';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DIALOG_CONFIG, GAME_CONSTANTS, GAME_EVENTS } from './constants/gameConstants';
import { DialogMessage, GameMenuItem, GameState, TopDownGameProps } from './types/GameTypes';
import { BrowserCompatibility } from './ui/BrowserCompatibility';
import { DialogBox } from './ui/DialogBox';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { GameMenu } from './ui/GameMenu';
import { HeroCoin } from './ui/HeroCoin';
import { HeroHealth } from './ui/HeroHealth';
import { PerformanceMonitor } from './ui/PerformanceMonitor';
import { getGameSizeByDevice, isMobileDevice } from './utils/gameUtils';

// 导入游戏场景
import BootScene from './scenes/BootScene';
import GameOverScene from './scenes/GameOverScene';
import GameScene from './scenes/GameScene';
import MainMenuScene from './scenes/MainMenuScene';

export const TopDownGame: React.FC<TopDownGameProps> = ({
  width: propWidth,
  height: propHeight,
  skipCompatibility = false
}) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  // 游戏状态
  const [gameState, setGameState] = useState<GameState>({
    isGameReady: false,
    isMobile: false,
    messages: [],
    characterName: '',
    gameMenuItems: [],
    gameMenuPosition: 'center',
    heroHealthStates: [],
    heroCoins: null
  });

  // 性能监控状态
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // 浏览器兼容性状态
  const [showCompatibilityCheck, setShowCompatibilityCheck] = useState(!skipCompatibility);
  const [isCompatible, setIsCompatible] = useState(skipCompatibility);

  // 调试信息
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log(`[TopDownGame Debug] ${info}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // 计算游戏尺寸
  const gameSize = propWidth && propHeight
    ? { width: propWidth, height: propHeight, multiplier: 1 }
    : getGameSizeByDevice();

  // 初始化游戏
  const initializeGame = useCallback(() => {
    addDebugInfo('开始初始化游戏');

    if (!gameRef.current) {
      addDebugInfo('错误: gameRef.current 为空');
      return;
    }

    if (gameInstanceRef.current) {
      addDebugInfo('游戏实例已存在，跳过初始化');
      return;
    }

    addDebugInfo('创建Phaser游戏配置');

    // 在函数内部计算游戏尺寸，避免依赖外部变量
    const currentGameSize = propWidth && propHeight
      ? { width: propWidth, height: propHeight, multiplier: 1 }
      : getGameSizeByDevice();

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      title: GAME_CONSTANTS.TITLE,
      parent: gameRef.current,
      // orientation: Phaser.Scale.LANDSCAPE, // 移除不支持的配置
      // localStorageName: GAME_CONSTANTS.TITLE, // 移除不支持的配置
      width: currentGameSize.width,
      height: currentGameSize.height,
      autoRound: true,
      pixelArt: true,
      scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
        mode: Phaser.Scale.ENVELOP,
      },
      scene: [
        BootScene,
        MainMenuScene,
        GameScene,
        GameOverScene,
      ],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      plugins: {
        scene: [
          {
            key: 'gridEngine',
            plugin: GridEngine,
            mapping: 'gridEngine',
          },
        ],
      },
      backgroundColor: GAME_CONSTANTS.COLORS.BLACK,
    };

    try {
      addDebugInfo('创建Phaser游戏实例');
      gameInstanceRef.current = new Phaser.Game(config);
      addDebugInfo('Phaser游戏实例创建成功');
      setGameState(prev => ({ ...prev, isGameReady: true }));
      addDebugInfo('游戏状态设置为就绪');
    } catch (error) {
      addDebugInfo(`游戏初始化失败: ${error}`);
      console.error('Failed to initialize game:', error);
    }
  }, [propWidth, propHeight]); // 只依赖props，不依赖gameSize

  // 检测移动设备
  useEffect(() => {
    addDebugInfo('检测移动设备');
    const checkMobile = () => {
      const isMobile = isMobileDevice();
      setGameState(prev => ({ ...prev, isMobile }));
      addDebugInfo(`移动设备检测结果: ${isMobile}`);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 初始化游戏
  useEffect(() => {
    addDebugInfo('TopDownGame useEffect 触发');
    addDebugInfo(`游戏尺寸计算: ${gameSize.width}x${gameSize.height}`);

    if (typeof window !== 'undefined') {
      addDebugInfo('在客户端环境中，等待DOM元素准备就绪');

      // 使用 requestAnimationFrame 确保在下一帧渲染后执行
      let retryCount = 0;
      const maxRetries = 50; // 最大重试50次（约2.5秒）

      const checkDOMReady = () => {
        if (gameRef.current) {
          addDebugInfo('DOM元素已准备就绪，开始初始化游戏');
          initializeGame();
        } else {
          retryCount++;
          addDebugInfo(`DOM元素仍未准备就绪，重试次数: ${retryCount}/${maxRetries}`);

          if (retryCount >= maxRetries) {
            addDebugInfo('错误: 达到最大重试次数，DOM元素仍未准备就绪');
            return;
          }

          // 如果DOM元素还没有准备好，继续等待
          requestAnimationFrame(checkDOMReady);
        }
      };

      // 延迟一帧开始检查
      requestAnimationFrame(() => {
        requestAnimationFrame(checkDOMReady);
      });

      return () => {
        addDebugInfo('TopDownGame 组件卸载，清理游戏实例');
        if (gameInstanceRef.current) {
          gameInstanceRef.current.destroy(true);
          gameInstanceRef.current = null;
        }
      };
    } else {
      addDebugInfo('不在客户端环境中，跳过游戏初始化');
    }
  }, [propWidth, propHeight]); // 直接依赖props，避免依赖initializeGame

  // 设置事件监听器
  useEffect(() => {
    const handleDialogEvent = (event: CustomEvent) => {
      const { characterName } = event.detail;
      const messages = DIALOG_CONFIG[characterName as keyof typeof DIALOG_CONFIG] || [];

      setGameState(prev => ({
        ...prev,
        characterName,
        messages: [...messages] as DialogMessage[]
      }));
    };

    const handleMenuEvent = (event: CustomEvent) => {
      const { menuItems, menuPosition } = event.detail;

      setGameState(prev => ({
        ...prev,
        gameMenuItems: menuItems,
        gameMenuPosition: menuPosition
      }));
    };

    const handleHealthEvent = (event: CustomEvent) => {
      const { healthStates } = event.detail;

      setGameState(prev => ({
        ...prev,
        heroHealthStates: healthStates
      }));
    };

    const handleCoinEvent = (event: CustomEvent) => {
      const { heroCoins } = event.detail;

      setGameState(prev => ({
        ...prev,
        heroCoins
      }));
    };

    const handleMenuSelection = (event: CustomEvent) => {
      const { selectedItem } = event.detail;

      // 处理菜单选择
      switch (selectedItem.action) {
        case 'resume_game':
          // 恢复游戏逻辑
          break;
        case 'return_to_main':
          // 返回主菜单逻辑
          break;
        default:
          console.warn('Unknown menu action:', selectedItem.action);
      }

      // 清除菜单
      setGameState(prev => ({
        ...prev,
        gameMenuItems: []
      }));
    };

    const handleDialogFinished = () => {
      setGameState(prev => ({
        ...prev,
        messages: [],
        characterName: ''
      }));
    };

    // 添加事件监听器
    window.addEventListener(GAME_EVENTS.NEW_DIALOG, handleDialogEvent as EventListener);
    window.addEventListener(GAME_EVENTS.MENU_ITEMS, handleMenuEvent as EventListener);
    window.addEventListener(GAME_EVENTS.HERO_HEALTH, handleHealthEvent as EventListener);
    window.addEventListener(GAME_EVENTS.HERO_COIN, handleCoinEvent as EventListener);
    window.addEventListener(GAME_EVENTS.MENU_ITEM_SELECTED, handleMenuSelection as EventListener);
    window.addEventListener(GAME_EVENTS.DIALOG_FINISHED, handleDialogFinished as EventListener);

    return () => {
      // 移除事件监听器
      window.removeEventListener(GAME_EVENTS.NEW_DIALOG, handleDialogEvent as EventListener);
      window.removeEventListener(GAME_EVENTS.MENU_ITEMS, handleMenuEvent as EventListener);
      window.removeEventListener(GAME_EVENTS.HERO_HEALTH, handleHealthEvent as EventListener);
      window.removeEventListener(GAME_EVENTS.HERO_COIN, handleCoinEvent as EventListener);
      window.removeEventListener(GAME_EVENTS.MENU_ITEM_SELECTED, handleMenuSelection as EventListener);
      window.removeEventListener(GAME_EVENTS.DIALOG_FINISHED, handleDialogFinished as EventListener);
    };
  }, []);

  // 处理对话框完成
  const handleDialogDone = useCallback(() => {
    const event = new CustomEvent(GAME_EVENTS.DIALOG_FINISHED, {
      detail: {}
    });
    window.dispatchEvent(event);
  }, []);

  // 处理菜单选择
  const handleMenuSelected = useCallback((selectedItem: GameMenuItem) => {
    const event = new CustomEvent(GAME_EVENTS.MENU_ITEM_SELECTED, {
      detail: { selectedItem }
    });
    window.dispatchEvent(event);
  }, []);

  // 处理浏览器兼容性检查结果
  const handleCompatibilityResult = (compatible: boolean) => {
    setIsCompatible(compatible);
    setShowCompatibilityCheck(false);
  };

  if (showCompatibilityCheck) {
    return (
      <div>
        <BrowserCompatibility onCompatibilityResult={handleCompatibilityResult} />
        {/* 隐藏的游戏容器，确保DOM元素存在 */}
        <div
          ref={gameRef}
          className="hidden"
          style={{
            width: `${gameSize.width * gameSize.multiplier}px`,
            height: `${gameSize.height * gameSize.multiplier}px`,
          }}
        />
      </div>
    );
  }

  if (!gameState.isGameReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">加载游戏中...</div>
        {/* 隐藏的游戏容器，确保DOM元素存在 */}
        <div
          ref={gameRef}
          className="hidden"
          style={{
            width: `${gameSize.width * gameSize.multiplier}px`,
            height: `${gameSize.height * gameSize.multiplier}px`,
          }}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full">
        {/* 游戏画布容器 */}
        <div
          ref={gameRef}
          className="w-full h-full"
          style={{
            width: `${gameSize.width * gameSize.multiplier}px`,
            height: `${gameSize.height * gameSize.multiplier}px`,
            margin: 'auto',
            padding: 0,
            overflow: 'hidden',
          }}
        />

        {/* 游戏UI层 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 血量显示 */}
          {gameState.heroHealthStates.length > 0 && (
            <HeroHealth
              gameSize={gameSize}
              healthStates={gameState.heroHealthStates}
            />
          )}

          {/* 金币显示 */}
          {gameState.heroCoins !== null && (
            <HeroCoin
              gameSize={gameSize}
              heroCoins={gameState.heroCoins}
            />
          )}

          {/* 对话框 */}
          {gameState.messages.length > 0 && (
            <div className="pointer-events-auto">
              <DialogBox
                onDone={handleDialogDone}
                characterName={gameState.characterName}
                messages={gameState.messages}
                gameSize={gameSize}
              />
            </div>
          )}

          {/* 游戏菜单 */}
          {gameState.gameMenuItems.length > 0 && (
            <div className="pointer-events-auto">
              <GameMenu
                items={gameState.gameMenuItems}
                gameSize={gameSize}
                position={gameState.gameMenuPosition}
                onSelected={handleMenuSelected}
              />
            </div>
          )}
        </div>

        {/* 性能监控 */}
        <PerformanceMonitor
          gameSize={gameSize}
          isVisible={showPerformanceMonitor}
        />

        {/* 性能监控切换按钮 */}
        <button
          onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
          className="absolute top-2 right-2 z-40 bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded border border-gray-600 hover:bg-opacity-90 transition-all"
        >
          {showPerformanceMonitor ? '隐藏性能' : '显示性能'}
        </button>

        {/* 移动端提示 */}
        {gameState.isMobile && (
          <div className="absolute bottom-4 left-4 right-4 bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-3 pointer-events-none">
            <p className="text-blue-200 text-sm text-center">
              📱 移动端优化：点击"START"按钮开始游戏
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};