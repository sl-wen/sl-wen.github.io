'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TopDownGameEngine } from './TopDownGameEngine';
import { mobileTestHelper } from './MobileTestHelper';

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

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const deviceInfo = mobileTestHelper.detectDevice();
      setIsMobile(deviceInfo.isMobile || deviceInfo.touchSupport);
      
      // 在开发模式下显示设备信息
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

    // 创建游戏引擎实例（使用移植的 Boot/Main/Game/GameOver 场景）
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

    // 清理函数
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
        gameEngineRef.current = null;
      }
    };
  }, [width, height]);

  // Handle window events from Phaser scenes (menu, dialogs, HUD)
  useEffect(() => {
    const onMenuItems = (e: Event) => {
      const detail = (e as CustomEvent).detail as { menuItems: string[]; menuPosition?: 'center' | 'left' };
      setMenuItems(detail.menuItems || []);
      setMenuPosition((detail.menuPosition as any) || 'center');
      setSelectedMenuIndex(0);
    };

    const onDialog = (e: Event) => {
      const detail = (e as CustomEvent).detail as { characterName: string };
      setCharacterName(detail.characterName);
      // simple fallback messages when not provided by external store
      setMessages([
        { message: '...' },
      ]);
      setCurrentMessageIndex(0);
      setMessageEnded(false);
    };

    const onHeroHealth = (e: Event) => {
      const detail = (e as CustomEvent).detail as { healthStates: string[] };
      setHeroHealthStates(detail.healthStates || []);
    };

    const onHeroCoin = (e: Event) => {
      const detail = (e as CustomEvent).detail as { heroCoins: number };
      setHeroCoins(detail.heroCoins);
    };

    window.addEventListener('menu-items', onMenuItems as EventListener);
    window.addEventListener('new-dialog', onDialog as EventListener);
    window.addEventListener('hero-health', onHeroHealth as EventListener);
    window.addEventListener('hero-coin', onHeroCoin as EventListener);

    return () => {
      window.removeEventListener('menu-items', onMenuItems as EventListener);
      window.removeEventListener('new-dialog', onDialog as EventListener);
      window.removeEventListener('hero-health', onHeroHealth as EventListener);
      window.removeEventListener('hero-coin', onHeroCoin as EventListener);
    };
  }, []);

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
        }
      } else if (messages.length > 0) {
        if (['Enter', 'Space', 'Escape'].includes(e.code)) {
          e.preventDefault();
          if (messageEnded) {
            if (currentMessageIndex < messages.length - 1) {
              setCurrentMessageIndex((i) => i + 1);
              setMessageEnded(false);
            } else {
              // end of dialog
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
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [menuItems, selectedMenuIndex, messages, currentMessageIndex, messageEnded, characterName]);

  const handleSelectMenu = useCallback((index: number) => {
    setSelectedMenuIndex(index);
    const selectedItem = menuItems[index];
    const customEvent = new CustomEvent('menu-item-selected', { detail: { selectedItem } });
    window.dispatchEvent(customEvent);
    setMenuItems([]);
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

  return (
    <div className="relative">
      <div 
        ref={gameContainerRef}
        className="border-2 border-gray-600 rounded-lg overflow-hidden game-container"
        style={{ width, height }}
      />
      {/* HUD: Health and Coins */}
      {(heroHealthStates.length > 0 || heroCoins !== null) && (
        <div className="absolute top-2 left-2 text-white space-y-1">
          {heroHealthStates.length > 0 && (
            <div className="bg-black/60 px-2 py-1 rounded text-xs">
              HP: {heroHealthStates.join(' | ')}
            </div>
          )}
          {heroCoins !== null && (
            <div className="bg-black/60 px-2 py-1 rounded text-xs">
              Coins: {heroCoins}
            </div>
          )}
        </div>
      )}

      {/* Menu Overlay */}
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
                {currentMessageIndex === messages.length - 1 && messageEnded ? 'Ok' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
