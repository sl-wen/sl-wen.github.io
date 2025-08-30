'use client';

import React, { useEffect, useState } from 'react';
import { AchievementUI } from './AchievementUI';
import DialogBox from './DialogBox';
import { EnhancedGameUI } from './EnhancedGameUI';
import GameMenu from './GameMenu';
import { HelpUI } from './HelpUI';
import HeroCoin from './HeroCoin';
import HeroHealth from './HeroHealth';
import { SettingsUI } from './SettingsUI';
import { TutorialUI } from './TutorialUI';

interface CompleteGameUIProps {
  width: number;
  height: number;
  multiplier: number;
  playerStats: {
    health: number;
    maxHealth: number;
    level: number;
    experience: number;
    gold: number;
  };
  inventory: any[];
  quests: any[];
  currentMap: string;
  onInventoryChange?: (inventory: any[]) => void;
  onStatsChange?: (stats: any) => void;
}

export const CompleteGameUI: React.FC<CompleteGameUIProps> = ({
  width,
  height,
  multiplier,
  playerStats,
  inventory,
  quests,
  currentMap,
  onInventoryChange,
  onStatsChange
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showEnhancedUI, setShowEnhancedUI] = useState(false);
  const [showAchievementUI, setShowAchievementUI] = useState(false);
  const [showSettingsUI, setShowSettingsUI] = useState(false);
  const [showTutorialUI, setShowTutorialUI] = useState(false);
  const [showHelpUI, setShowHelpUI] = useState(false);
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [menuPosition, setMenuPosition] = useState<'center' | 'left'>('center');
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [dialogMessages, setDialogMessages] = useState<Array<{ message: string; action?: string }>>([]);
  const [characterName, setCharacterName] = useState('');
  const [heroHealthStates, setHeroHealthStates] = useState<string[]>([]);
  const [heroCoins, setHeroCoins] = useState<number>(0);

  const gameSize = { width, height, multiplier };

  // 添加弹窗状态调试信息
  useEffect(() => {
    console.log('🎯 [DEBUG] CompleteGameUI状态:', {
      showMenu,
      showDialog,
      showEnhancedUI,
      showAchievementUI,
      showSettingsUI,
      showTutorialUI,
      showHelpUI,
      gameSize,
      playerStats
    });
  }, [showMenu, showDialog, showEnhancedUI, showAchievementUI, showSettingsUI, showTutorialUI, showHelpUI, gameSize, playerStats]);

  useEffect(() => {
    // 监听菜单事件
    const onMenuItems = (e: Event) => {
      const detail = (e as CustomEvent).detail as { menuItems: string[]; menuPosition?: 'center' | 'left' };
      setMenuItems(detail.menuItems || []);
      setMenuPosition(detail.menuPosition || 'center');
      setSelectedMenuIndex(0);
      setShowMenu(true);
    };

    // 监听对话事件
    const onDialog = (e: Event) => {
      const detail = (e as CustomEvent).detail as { characterName: string; message?: string };
      setCharacterName(detail.characterName);
      setDialogMessages([
        { message: detail.message || '...' },
      ]);
      setShowDialog(true);
    };

    // 监听英雄生命值事件
    const onHeroHealth = (e: Event) => {
      const detail = (e as CustomEvent).detail as { healthStates: string[] };
      setHeroHealthStates(detail.healthStates || []);
    };

    // 监听英雄金币事件
    const onHeroCoin = (e: Event) => {
      const detail = (e as CustomEvent).detail as { heroCoins: number };
      setHeroCoins(detail.heroCoins);
    };

    // 监听键盘事件
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (showMenu) {
          setShowMenu(false);
        } else if (showDialog) {
          setShowDialog(false);
        } else if (showEnhancedUI) {
          setShowEnhancedUI(false);
        } else if (showAchievementUI) {
          setShowAchievementUI(false);
        } else if (showSettingsUI) {
          setShowSettingsUI(false);
        } else if (showTutorialUI) {
          setShowTutorialUI(false);
        } else if (showHelpUI) {
          setShowHelpUI(false);
        } else {
          // 显示主菜单
          setMenuItems(['继续游戏', '设置', '成就', '教程', '帮助', '退出']);
          setMenuPosition('center');
          setSelectedMenuIndex(0);
          setShowMenu(true);
        }
      } else if (e.code === 'KeyI' && !showMenu && !showDialog) {
        // 打开背包
        setShowEnhancedUI(true);
      } else if (e.code === 'KeyJ' && !showMenu && !showDialog) {
        // 打开成就
        setShowAchievementUI(true);
      } else if (e.code === 'KeyT' && !showMenu && !showDialog) {
        // 打开教程
        setShowTutorialUI(true);
      } else if (e.code === 'KeyH' && !showMenu && !showDialog) {
        // 打开帮助
        setShowHelpUI(true);
      }
    };

    window.addEventListener('menu-items', onMenuItems as EventListener);
    window.addEventListener('new-dialog', onDialog as EventListener);
    window.addEventListener('hero-health', onHeroHealth as EventListener);
    window.addEventListener('hero-coin', onHeroCoin as EventListener);
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('menu-items', onMenuItems as EventListener);
      window.removeEventListener('new-dialog', onDialog as EventListener);
      window.removeEventListener('hero-health', onHeroHealth as EventListener);
      window.removeEventListener('hero-coin', onHeroCoin as EventListener);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [showMenu, showDialog, showEnhancedUI]);

  const handleMenuSelect = (index: number) => {
    if (showMenu) {
      const selectedItem = menuItems[index];

      if (selectedItem === '继续游戏') {
        setShowMenu(false);
      } else if (selectedItem === '设置') {
        setShowSettingsUI(true);
        setShowMenu(false);
      } else if (selectedItem === '成就') {
        setShowAchievementUI(true);
        setShowMenu(false);
      } else if (selectedItem === '教程') {
        setShowTutorialUI(true);
        setShowMenu(false);
      } else if (selectedItem === '帮助') {
        setShowHelpUI(true);
        setShowMenu(false);
      } else if (selectedItem === '退出') {
        // 处理退出逻辑
        console.log('退出游戏');
      }
    }
  };

  const handleDialogDone = () => {
    setShowDialog(false);
    // 触发对话完成事件
    const customEvent = new CustomEvent(`${characterName}-dialog-finished`);
    window.dispatchEvent(customEvent);
  };

  return (
    <div className="relative w-full h-full">
      {/* 游戏状态栏 */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center space-x-4">
          {/* 生命值 */}
          <div className="flex items-center space-x-1">
            {heroHealthStates.map((state, index) => (
              <div
                key={index}
                className="w-6 h-6 bg-red-500 border border-white rounded"
                style={{
                  backgroundImage: `url("/assets/topdown/images/heart_container.png")`,
                  backgroundSize: 'cover',
                }}
              >
                {state === 'full' && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url("/assets/topdown/images/health.png")`,
                      backgroundSize: 'cover',
                    }}
                  />
                )}
                {state === 'half' && (
                  <div
                    className="w-1/2 h-full"
                    style={{
                      backgroundImage: `url("/assets/topdown/images/health.png")`,
                      backgroundSize: 'cover',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* 金币 */}
          <div className="flex items-center space-x-1">
            <div
              className="w-6 h-6"
              style={{
                backgroundImage: `url("/assets/topdown/images/coin.png")`,
                backgroundSize: 'cover',
              }}
            />
            <span className="text-white font-bold text-lg">{heroCoins}</span>
          </div>

          {/* 等级 */}
          <div className="text-white font-bold text-lg">
            Lv.{playerStats.level}
          </div>
        </div>
      </div>

      {/* 英雄状态UI */}
      {heroHealthStates.length > 0 && (
        <HeroHealth
          gameSize={gameSize}
          healthStates={heroHealthStates as HealthState[]}
        />
      )}

      {heroCoins !== null && (
        <HeroCoin
          gameSize={gameSize}
          heroCoins={heroCoins}
        />
      )}

      {/* 控制提示 */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
          <div>WASD/方向键: 移动</div>
          <div>空格: 攻击</div>
          <div>回车: 交互</div>
          <div>I: 背包</div>
          <div>J: 成就</div>
          <div>T: 教程</div>
          <div>H: 帮助</div>
          <div>ESC: 菜单</div>
        </div>
      </div>

      {/* 对话框 */}
      {showDialog && (
        <DialogBox
          messages={dialogMessages}
          characterName={characterName}
          onDone={handleDialogDone}
          gameSize={gameSize}
        />
      )}

      {/* 游戏菜单 */}
      {showMenu && (
        <GameMenu
          menuItems={menuItems}
          menuPosition={menuPosition}
          selectedIndex={selectedMenuIndex}
          onSelect={handleMenuSelect}
          gameSize={gameSize}
        />
      )}

      {/* 增强UI */}
      {showEnhancedUI && (
        <div className="absolute inset-0 z-20 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="w-4/5 h-4/5 max-w-4xl max-h-96">
            <EnhancedGameUI
              playerStats={playerStats}
              inventory={inventory}
              quests={quests}
              currentMap={currentMap}
              onInventoryChange={onInventoryChange}
              onStatsChange={onStatsChange}
            />
            <button
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              onClick={() => setShowEnhancedUI(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 成就UI */}
      <AchievementUI
        isVisible={showAchievementUI}
        onClose={() => setShowAchievementUI(false)}
      />

      {/* 设置UI */}
      <SettingsUI
        isVisible={showSettingsUI}
        onClose={() => setShowSettingsUI(false)}
      />

      {/* 教程UI */}
      <TutorialUI
        isVisible={showTutorialUI}
        onClose={() => setShowTutorialUI(false)}
      />

      {/* 帮助UI */}
      <HelpUI
        isVisible={showHelpUI}
        onClose={() => setShowHelpUI(false)}
      />

      {/* 闪烁动画样式 */}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};