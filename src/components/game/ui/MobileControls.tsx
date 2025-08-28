'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface MobileControlsProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onStopMove: () => void;
  onAction: () => void;
  onToolSelect: (toolIndex: number) => void;
  onMenuToggle: (menu: 'inventory' | 'shop') => void;
  currentTool: string;
  tools: Array<{ id: string; name: string; icon: string }>;
  isVisible: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onStopMove,
  onAction,
  onToolSelect,
  onMenuToggle,
  currentTool,
  tools,
  isVisible
}) => {
  const [isActionPressed, setIsActionPressed] = useState(false);
  const [selectedToolIndex, setSelectedToolIndex] = useState(0);

  const actionButtonRef = useRef<HTMLButtonElement>(null);

  // 移除虚拟摇杆处理逻辑 - 现在由VirtualJoystick.ts统一处理

  // 触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent, action: () => void) => {
    e.preventDefault();
    action();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, action: () => void) => {
    e.preventDefault();
    action();
  }, []);

  // 鼠标事件处理（用于调试）
  const handleMouseDown = useCallback((e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    action();
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    action();
  }, []);

  // 动作按钮处理
  const handleActionStart = useCallback(() => {
    setIsActionPressed(true);
    onAction();
  }, [onAction]);

  const handleActionEnd = useCallback(() => {
    setIsActionPressed(false);
  }, []);

  // 工具选择处理
  const handleToolSelect = useCallback((index: number) => {
    setSelectedToolIndex(index);
    onToolSelect(index);
  }, [onToolSelect]);

  // 摇杆事件处理已移除 - 由VirtualJoystick.ts统一处理

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* 虚拟摇杆已移除 - 现在由VirtualJoystick.ts统一处理 */}

      {/* 动作按钮 */}
      <div className="absolute bottom-8 right-6 pointer-events-auto">
        <div className="relative">
          <button
            ref={actionButtonRef}
            className={`w-16 h-16 rounded-full border-2 border-white border-opacity-50 text-white text-2xl font-bold transition-all ${isActionPressed
                ? 'bg-green-600 bg-opacity-80 scale-95'
                : 'bg-green-500 bg-opacity-60 hover:bg-opacity-80'
              }`}
            onMouseDown={(e) => handleMouseDown(e, handleActionStart)}
            onMouseUp={(e) => handleMouseUp(e, handleActionEnd)}
            onTouchStart={(e) => handleTouchStart(e, handleActionStart)}
            onTouchEnd={(e) => handleTouchEnd(e, handleActionEnd)}
          >
            ⚡
          </button>

          {/* 动作按钮标签 */}
          {/* <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded whitespace-nowrap">
              使用工具
            </span>
          </div> */}
        </div>
      </div>

      {/* 工具选择栏 */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="flex gap-2 bg-black bg-opacity-40 p-2 rounded-lg">
          {tools.slice(0, 4).map((tool, index) => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(index)}
              className={`w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center text-xl ${selectedToolIndex === index
                  ? 'border-yellow-400 bg-yellow-500 bg-opacity-30'
                  : 'border-white border-opacity-30 bg-white bg-opacity-10 hover:bg-opacity-20'
                }`}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* 当前工具显示 */}
        {/* <div className="text-center mt-2">
          <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
            {tools[selectedToolIndex]?.name || '无工具'}
          </span>
        </div> */}
      </div>

      {/* 菜单按钮 */}
      <div className="absolute top-6 right-6 pointer-events-auto flex gap-2">
        <button
          onClick={() => onMenuToggle('inventory')}
          className="w-12 h-12 bg-blue-500 bg-opacity-60 hover:bg-opacity-80 rounded-lg border-2 border-white border-opacity-50 text-white text-xl transition-all"
        >
          🎒
        </button>
        <button
          onClick={() => onMenuToggle('shop')}
          className="w-12 h-12 bg-purple-500 bg-opacity-60 hover:bg-opacity-80 rounded-lg border-2 border-white border-opacity-50 text-white text-xl transition-all"
        >
          🏪
        </button>
      </div>

      {/* 方向键（备用控制） */}
      <div className="absolute bottom-28 right-24 pointer-events-auto">
        <div className="grid grid-cols-3 gap-1 w-32 h-32">
          <div></div>
          <button
            className="bg-gray-700 bg-opacity-60 hover:bg-opacity-80 text-white rounded p-2 border border-white border-opacity-30 transition-all"
            onMouseDown={() => onMove('up')}
            onMouseUp={onStopMove}
            onTouchStart={(e) => handleTouchStart(e, () => onMove('up'))}
            onTouchEnd={(e) => handleTouchEnd(e, onStopMove)}
          >
            ↑
          </button>
          <div></div>

          <button
            className="bg-gray-700 bg-opacity-60 hover:bg-opacity-80 text-white rounded p-2 border border-white border-opacity-30 transition-all"
            onMouseDown={() => onMove('left')}
            onMouseUp={onStopMove}
            onTouchStart={(e) => handleTouchStart(e, () => onMove('left'))}
            onTouchEnd={(e) => handleTouchEnd(e, onStopMove)}
          >
            ←
          </button>
          <div className="bg-gray-600 bg-opacity-40 rounded border border-white border-opacity-20"></div>
          <button
            className="bg-gray-700 bg-opacity-60 hover:bg-opacity-80 text-white rounded p-2 border border-white border-opacity-30 transition-all"
            onMouseDown={() => onMove('right')}
            onMouseUp={onStopMove}
            onTouchStart={(e) => handleTouchStart(e, () => onMove('right'))}
            onTouchEnd={(e) => handleTouchEnd(e, onStopMove)}
          >
            →
          </button>

          <div></div>
          <button
            className="bg-gray-700 bg-opacity-60 hover:bg-opacity-80 text-white rounded p-2 border border-white border-opacity-30 transition-all"
            onMouseDown={() => onMove('down')}
            onMouseUp={onStopMove}
            onTouchStart={(e) => handleTouchStart(e, () => onMove('down'))}
            onTouchEnd={(e) => handleTouchEnd(e, onStopMove)}
          >
            ↓
          </button>
          <div></div>
        </div>
      </div>

      {/* 游戏信息显示 */}
      {/* <div className="absolute top-6 left-6 pointer-events-none">
        <div className="bg-black bg-opacity-50 text-white p-2 rounded-lg text-sm">
          <div>当前工具: {tools[selectedToolIndex]?.name || '无'}</div>
        </div>
      </div> */}
    </div>
  );
};

export default MobileControls;