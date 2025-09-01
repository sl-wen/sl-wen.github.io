import React, { useState, useEffect } from 'react';
import { GameMenuProps, GameMenuItem } from '../types/GameTypes';

export const GameMenu: React.FC<GameMenuProps> = ({
  items,
  gameSize,
  position,
  onSelected
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(items.length - 1, prev + 1));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          handleSelectItem(items[selectedIndex]);
          break;
        case 'Escape':
          event.preventDefault();
          // 可以添加取消菜单的逻辑
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, items]);

  const handleSelectItem = (item: GameMenuItem) => {
    onSelected(item);
  };

  const handleMouseEnter = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClick = (item: GameMenuItem) => {
    handleSelectItem(item);
  };

  // 计算菜单位置
  const getMenuPosition = () => {
    const menuWidth = 200;
    const menuHeight = items.length * 40 + 20;
    let menuX = 0;
    let menuY = 0;

    switch (position) {
      case 'center':
        menuX = (gameSize.width - menuWidth) / 2;
        menuY = (gameSize.height - menuHeight) / 2;
        break;
      case 'top-left':
        menuX = 20;
        menuY = 20;
        break;
      case 'top-right':
        menuX = gameSize.width - menuWidth - 20;
        menuY = 20;
        break;
      case 'bottom-left':
        menuX = 20;
        menuY = gameSize.height - menuHeight - 20;
        break;
      case 'bottom-right':
        menuX = gameSize.width - menuWidth - 20;
        menuY = gameSize.height - menuHeight - 20;
        break;
      default:
        menuX = (gameSize.width - menuWidth) / 2;
        menuY = (gameSize.height - menuHeight) / 2;
    }

    return { x: menuX, y: menuY, width: menuWidth, height: menuHeight };
  };

  const menuPosition = getMenuPosition();

  return (
    <div
      className="fixed z-50"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
        width: `${menuPosition.width}px`,
        height: `${menuPosition.height}px`
      }}
    >
      {/* 菜单背景 */}
      <div className="w-full h-full bg-black bg-opacity-90 border-2 border-white rounded-lg p-2 shadow-2xl backdrop-blur-sm">
        {/* 菜单标题 */}
        <div className="text-white text-center font-bold text-sm mb-2 border-b border-gray-600 pb-1 drop-shadow-lg">
          MENU
        </div>

        {/* 菜单项列表 */}
        <div className="space-y-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`
                px-3 py-2 text-sm cursor-pointer transition-all duration-150 rounded
                ${index === selectedIndex 
                  ? 'bg-yellow-500 text-black font-bold shadow-lg' 
                  : 'text-white hover:bg-gray-700 hover:shadow-md'
                }
              `}
              onMouseEnter={() => handleMouseEnter(index)}
              onClick={() => handleClick(item)}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* 操作提示 */}
        <div className="text-gray-400 text-xs text-center mt-2 pt-1 border-t border-gray-600 drop-shadow-md">
          使用方向键选择，回车确认
        </div>
      </div>
    </div>
  );
};