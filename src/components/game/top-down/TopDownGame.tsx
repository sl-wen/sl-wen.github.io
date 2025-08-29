'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TopDownGameEngine } from './TopDownGameEngine';
import { mobileTestHelper } from './MobileTestHelper';
import { GameUI } from './ui/GameUI';
import { InventorySystem } from './systems/InventorySystem';
import { QuestSystem } from './systems/QuestSystem';
import { CombatSystem } from './systems/CombatSystem';
import { GameDataManager } from './systems/GameDataManager';

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
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [menuPosition, setMenuPosition] = useState<'center' | 'left'>('center');
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [messages, setMessages] = useState<Array<{ message: string; action?: string }>>([]);
  const [characterName, setCharacterName] = useState('');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [messageEnded, setMessageEnded] = useState(false);
  const [heroHealthStates, setHeroHealthStates] = useState<string[]>([]);
  const [heroCoins, setHeroCoins] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('游戏初始化中...');
  const [showMenu, setShowMenu] = useState(true);
  const [showUI, setShowUI] = useState(false);

  // 游戏系统状态
  const [playerStats, setPlayerStats] = useState({
    health: 100,
    maxHealth: 100,
    level: 1,
    experience: 0,
    gold: 0
  });

  // 游戏系统实例
  const [gameSystems] = useState(() => ({
    inventory: new InventorySystem(),
    questSystem: new QuestSystem(),
    combatSystem: new CombatSystem(),
    gameDataManager: GameDataManager.getInstance()
  }));

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

  useEffect(() => {
    if (!gameContainerRef.current) return;

    setDebugInfo('创建游戏引擎...');

    // 创建游戏引擎实例
    gameEngineRef.current = new TopDownGameEngine(gameContainerRef.current, {
      width,
      height,
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
      scene: null
    });

    setDebugInfo('游戏引擎创建完成，等待场景启动...');

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
        gameEngineRef.current = null;
      }
    };
  }, [width, height]);

  // 处理游戏事件
  useEffect(() => {
    const onMenuItems = (e: Event) => {
      const detail = (e as CustomEvent).detail as { menuItems: string[]; menuPosition?: 'center' | 'left' };
      console.log('收到菜单项事件:', detail);
      setMenuItems(detail.menuItems || []);
      setMenuPosition((detail.menuPosition as any) || 'center');
      setSelectedMenuIndex(0);
      setDebugInfo('主菜单已加载');
      setShowMenu(true);
    };

    const onDialog = (e: Event) => {
      const detail = (e as CustomEvent).detail as { characterName: string; message?: string };
      setCharacterName(detail.characterName);
      setMessages([
        { message: detail.message || '...' },
      ]);
      setCurrentMessageIndex(0);
      setMessageEnded(false);
    };

    const onHeroHealth = (e: Event) => {
      const detail = (e as CustomEvent).detail as { healthStates: string[] };
      setHeroHealthStates(detail.healthStates || []);
      
      // 更新玩家状态
      if (detail.healthStates && detail.healthStates[0]) {
        const [current, max] = detail.healthStates[0].split('/').map(Number);
        setPlayerStats(prev => ({
          ...prev,
          health: current,
          maxHealth: max
        }));
      }
    };

    const onHeroCoin = (e: Event) => {
      const detail = (e as CustomEvent).detail as { heroCoins: number };
      setHeroCoins(detail.heroCoins);
      setPlayerStats(prev => ({
        ...prev,
        gold: detail.heroCoins
      }));
    };

    // 新增：处理背包更新事件
    const onInventoryChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail as { inventory: any[] };
      console.log('背包更新:', detail.inventory);
    };

    // 新增：处理任务更新事件
    const onQuestChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail as { quests: any[] };
      console.log('任务更新:', detail.quests);
    };

    // 新增：处理等级更新事件
    const onLevelUp = (e: Event) => {
      const detail = (e as CustomEvent).detail as { level: number; experience: number };
      setPlayerStats(prev => ({
        ...prev,
        level: detail.level,
        experience: detail.experience
      }));
    };

    window.addEventListener('menu-items', onMenuItems as EventListener);
    window.addEventListener('new-dialog', onDialog as EventListener);
    window.addEventListener('hero-health', onHeroHealth as EventListener);
    window.addEventListener('hero-coin', onHeroCoin as EventListener);
    window.addEventListener('inventory-changed', onInventoryChanged as EventListener);
    window.addEventListener('quest-changed', onQuestChanged as EventListener);
    window.addEventListener('level-up', onLevelUp as EventListener);

    return () => {
      window.removeEventListener('menu-items', onMenuItems as EventListener);
      window.removeEventListener('new-dialog', onDialog as EventListener);
      window.removeEventListener('hero-health', onHeroHealth as EventListener);
      window.removeEventListener('hero-coin', onHeroCoin as EventListener);
      window.removeEventListener('inventory-changed', onInventoryChanged as EventListener);
      window.removeEventListener('quest-changed', onQuestChanged as EventListener);
      window.removeEventListener('level-up', onLevelUp as EventListener);
    };
  }, []);

  // 处理键盘输入
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (menuItems.length > 0) {
        if (e.code === 'ArrowUp') {
          e.preventDefault();
          setSelectedMenuIndex((i) => (i > 0 ? i - 1 : i));
        } else if (e.code === 'ArrowDown') {
          e.preventDefault();
          setSelectedMenuIndex((i) => (i < menuItems.length - 1 ? i + 1 : i));
        } else if (e.code === 'Enter') {
          e.preventDefault();
          const selectedItem = menuItems[selectedMenuIndex];
          const customEvent = new CustomEvent('menu-item-selected', { detail: { selectedItem } });
          window.dispatchEvent(customEvent);
          setMenuItems([]);
          setGameStarted(true);
          setShowMenu(false);
          setShowUI(true);
        }
      } else if (messages.length > 0) {
        if (['Enter', 'Space', 'Escape'].includes(e.code)) {
          e.preventDefault();
          if (messageEnded) {
            if (currentMessageIndex < messages.length - 1) {
              setCurrentMessageIndex((i) => i + 1);
              setMessageEnded(false);
            } else {
              const finishEvent = new CustomEvent(`${characterName}-dialog-finished`, { detail: {} });
              window.dispatchEvent(finishEvent);
              setMessages([]);
              setCharacterName('');
              setCurrentMessageIndex(0);
              setMessageEnded(false);
            }
          } else {
            setMessageEnded(true);
          }
        }
      } else if (gameStarted) {
        // 游戏中的快捷键
        if (e.code === 'KeyI') {
          e.preventDefault();
          setShowUI(true);
        } else if (e.code === 'KeyQ') {
          e.preventDefault();
          setShowUI(true);
        } else if (e.code === 'Escape') {
          e.preventDefault();
          setShowUI(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [menuItems, selectedMenuIndex, messages, currentMessageIndex, messageEnded, characterName, gameStarted]);

  const handleSelectMenu = useCallback((index: number) => {
    setSelectedMenuIndex(index);
    const selectedItem = menuItems[index];
    const customEvent = new CustomEvent('menu-item-selected', { detail: { selectedItem } });
    window.dispatchEvent(customEvent);
    setMenuItems([]);
    setGameStarted(true);
    setShowMenu(false);
    setShowUI(true);
  }, [menuItems]);

  // 移动端触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMenuIndex(index);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelectMenu(index);
  }, [handleSelectMenu]);

  // 手动启动游戏的备用函数
  const handleManualStart = useCallback(() => {
    console.log('手动启动游戏');
    const customEvent = new CustomEvent('menu-item-selected', { detail: { selectedItem: 'start' } });
    window.dispatchEvent(customEvent);
    setGameStarted(true);
    setShowMenu(false);
    setShowUI(true);
    setDebugInfo('游戏已启动');
  }, []);

  // 手动退出游戏的函数
  const handleManualExit = useCallback(() => {
    console.log('手动退出游戏');
    const customEvent = new CustomEvent('menu-item-selected', { detail: { selectedItem: 'exit' } });
    window.dispatchEvent(customEvent);
  }, []);

  return (
    <div className="relative">
      <div 
        ref={gameContainerRef}
        className="border-2 border-gray-600 rounded-lg overflow-hidden game-container"
        style={{ width, height }}
      />
      
      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs p-2 rounded max-w-48 z-50">
          <div>状态: {debugInfo}</div>
          <div>菜单项: {menuItems.length}</div>
          <div>游戏状态: {gameStarted ? '已启动' : '未启动'}</div>
          <div>显示菜单: {showMenu ? '是' : '否'}</div>
          <div>显示UI: {showUI ? '是' : '否'}</div>
          <div>玩家等级: {playerStats.level}</div>
          <div>玩家经验: {playerStats.experience}</div>
        </div>
      )}

      {/* 增强版游戏UI */}
      {gameStarted && showUI && (
        <GameUI
          inventory={gameSystems.inventory}
          questSystem={gameSystems.questSystem}
          combatSystem={gameSystems.combatSystem}
          playerHealth={playerStats.health}
          playerMaxHealth={playerStats.maxHealth}
          playerLevel={playerStats.level}
          playerExperience={playerStats.experience}
          playerGold={playerStats.gold}
          isMobile={isMobile}
        />
      )}

      {/* 主菜单覆盖层 - 始终显示，除非游戏已启动 */}
      {showMenu && !gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-black/80 p-6 rounded-lg text-center">
            <div className="text-white text-lg mb-4">🎮 增强版RPG游戏</div>
            <div className="space-y-3">
              <button
                onClick={handleManualStart}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
                style={{
                  minHeight: isMobile ? '44px' : 'auto',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                🚀 开始冒险
              </button>
              <button
                onClick={handleManualExit}
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
                style={{
                  minHeight: isMobile ? '44px' : 'auto',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                ❌ 退出游戏
              </button>
            </div>
            <div className="text-white text-sm mt-4">
              <div>🎯 新功能：</div>
              <div>• 物品系统与背包管理</div>
              <div>• 任务系统与进度跟踪</div>
              <div>• 战斗系统与敌人AI</div>
              <div>• 等级系统与技能成长</div>
            </div>
            <div className="text-gray-400 text-xs mt-2">
              点击开始游戏
            </div>
          </div>
        </div>
      )}

      {/* Menu Overlay - 来自游戏场景的菜单 */}
      {menuItems.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-50 game-ui-layer">
          <div className="min-w-[200px] bg-neutral-800/90 border border-neutral-700 rounded p-3">
            <ul className="text-white text-sm">
              {menuItems.map((item, idx) => (
                <li
                  key={idx}
                  className={`px-3 py-2 cursor-pointer rounded transition-colors game-menu-item touch-feedback ${
                    idx === selectedMenuIndex ? 'bg-blue-600' : 'hover:bg-neutral-700'
                  }`}
                  onMouseEnter={() => !isMobile && setSelectedMenuIndex(idx)}
                  onClick={() => !isMobile && handleSelectMenu(idx)}
                  onTouchStart={(e) => isMobile && handleTouchStart(e, idx)}
                  onTouchEnd={(e) => isMobile && handleTouchEnd(e, idx)}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Dialog Overlay */}
      {messages.length > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 z-50 game-ui-layer" style={{ bottom: 16 }}>
          <div className="w-[80%] max-w-[720px] bg-amber-200 text-black border-2 border-amber-400 rounded p-3 shadow">
            <div className="text-xs font-bold uppercase mb-2">{characterName}</div>
            <div className="text-sm min-h-[48px]">
              {messages[currentMessageIndex]?.message}
            </div>
            <div className="text-right text-xs mt-2">
              <button
                className="px-2 py-1 bg-neutral-900 text-white rounded game-button touch-feedback"
                onClick={() => {
                  if (messageEnded) {
                    if (currentMessageIndex < messages.length - 1) {
                      setCurrentMessageIndex((i) => i + 1);
                      setMessageEnded(false);
                    } else {
                      const finishEvent = new CustomEvent(`${characterName}-dialog-finished`, { detail: {} });
                      window.dispatchEvent(finishEvent);
                      setMessages([]);
                      setCharacterName('');
                      setCurrentMessageIndex(0);
                      setMessageEnded(false);
                    }
                  } else {
                    setMessageEnded(true);
                  }
                }}
                style={{
                  minHeight: isMobile ? '44px' : 'auto',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                {currentMessageIndex === messages.length - 1 && messageEnded ? '确定' : '继续'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 游戏控制说明 */}
      {gameStarted && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white p-3 rounded text-xs">
          <div className="font-bold mb-1">游戏控制：</div>
          <div>WASD/方向键：移动</div>
          <div>空格键：交互</div>
          <div>回车键：攻击</div>
          <div>I键：背包</div>
          <div>Q键：任务</div>
          <div>ESC键：关闭UI</div>
        </div>
      )}
    </div>
  );
};
