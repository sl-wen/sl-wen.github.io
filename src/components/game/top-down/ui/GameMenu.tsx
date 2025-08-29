'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface GameMenuProps {
  menuItems: string[];
  menuPosition: 'center' | 'left';
  selectedIndex: number;
  onSelect: (index: number) => void;
  gameSize: { width: number; height: number; multiplier: number };
}

const GameMenu: React.FC<GameMenuProps> = ({
  menuItems,
  menuPosition,
  selectedIndex,
  onSelect,
  gameSize,
}) => {
  const { width, height, multiplier } = gameSize;

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      onSelect(Math.max(0, selectedIndex - 1));
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      onSelect(Math.min(menuItems.length - 1, selectedIndex + 1));
    } else if (e.code === 'Enter') {
      e.preventDefault();
      onSelect(selectedIndex);
    }
  }, [selectedIndex, menuItems.length, onSelect]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const menuStyle = {
    position: 'absolute' as const,
    top: menuPosition === 'center' ? '50%' : '20%',
    left: menuPosition === 'center' ? '50%' : '10%',
    transform: menuPosition === 'center' ? 'translate(-50%, -50%)' : 'none',
    backgroundColor: '#e2b27e',
    border: 'solid',
    borderImage: `url("/assets/topdown/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
    padding: `${8 * multiplier}px`,
    minWidth: `${120 * multiplier}px`,
    zIndex: 1000,
  };

  const menuItemStyle = (isSelected: boolean) => ({
    fontSize: `${8 * multiplier}px`,
    fontFamily: '"Press Start 2P", monospace',
    textTransform: 'uppercase' as const,
    color: isSelected ? '#741B47' : '#000',
    backgroundColor: isSelected ? '#f0d8a8' : 'transparent',
    padding: `${4 * multiplier}px ${8 * multiplier}px`,
    margin: `${2 * multiplier}px 0`,
    cursor: 'pointer',
    textAlign: 'center' as const,
    border: isSelected ? '2px solid #741B47' : '2px solid transparent',
  };

  return (
    <div style={menuStyle}>
      {menuItems.map((item, index) => (
        <div
          key={index}
          style={menuItemStyle(index === selectedIndex)}
          onClick={() => onSelect(index)}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default GameMenu;