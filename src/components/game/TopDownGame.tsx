import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import GridEngine from 'grid-engine';
import { TopDownGameProps, GameState, DialogMessage, GameMenuItem, HealthState } from './types/GameTypes';
import { GAME_CONSTANTS, DIALOG_CONFIG, GAME_EVENTS } from './constants/gameConstants';
import { calculateGameSize, isMobileDevice, getGameSizeByDevice } from './utils/gameUtils';
import { DialogBox } from './ui/DialogBox';
import { GameMenu } from './ui/GameMenu';
import { HeroHealth } from './ui/HeroHealth';
import { HeroCoin } from './ui/HeroCoin';
import { Message } from './ui/Message';

// 导入游戏场景
import BootScene from './scenes/BootScene';
import MainMenuScene from './scenes/MainMenuScene';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';

export const TopDownGame: React.FC<TopDownGameProps> = ({
  width: propWidth,
  height: propHeight
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

  // 计算游戏尺寸
  const gameSize = propWidth && propHeight 
    ? { width: propWidth, height: propHeight, multiplier: 1 }
    : getGameSizeByDevice();

  // 初始化游戏
  const initializeGame = useCallback(() => {
    if (!gameRef.current || gameInstanceRef.current) {
      return;
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      title: GAME_CONSTANTS.TITLE,
      parent: gameRef.current,
      // orientation: Phaser.Scale.LANDSCAPE, // 移除不支持的配置
      // localStorageName: GAME_CONSTANTS.TITLE, // 移除不支持的配置
      width: gameSize.width,
      height: gameSize.height,
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
      gameInstanceRef.current = new Phaser.Game(config);
      setGameState(prev => ({ ...prev, isGameReady: true }));
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
  }, [gameSize]);

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = isMobileDevice();
      setGameState(prev => ({ ...prev, isMobile }));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 初始化游戏
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeGame();
    }

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, [initializeGame]);

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

  if (!gameState.isGameReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">加载游戏中...</div>
      </div>
    );
  }

  return (
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

      {/* 移动端提示 */}
      {gameState.isMobile && (
        <div className="absolute bottom-4 left-4 right-4 bg-blue-900 bg-opacity-50 border border-blue-500 rounded-lg p-3 pointer-events-none">
          <p className="text-blue-200 text-sm text-center">
            📱 移动端优化：点击"START"按钮开始游戏
          </p>
        </div>
      )}
    </div>
  );
};