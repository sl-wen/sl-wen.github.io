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

interface JoystickPosition {
  x: number;
  y: number;
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
  const [joystickPosition, setJoystickPosition] = useState<JoystickPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isActionPressed, setIsActionPressed] = useState(false);
  const [selectedToolIndex, setSelectedToolIndex] = useState(0);

  const joystickRef = useRef<HTMLDivElement>(null);
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const JOYSTICK_RADIUS = 40;
  const DEAD_ZONE = 0.2;

  // 虚拟摇杆处理
  const handleJoystickStart = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current) return;

    setIsDragging(true);
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    updateJoystickPosition(clientX, clientY, centerX, centerY);
  }, []);

  const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !joystickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    updateJoystickPosition(clientX, clientY, centerX, centerY);
  }, [isDragging]);

  const updateJoystickPosition = useCallback((clientX: number, clientY: number, centerX: number, centerY: number) => {
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let x = deltaX;
    let y = deltaY;

    // 限制在圆形区域内
    if (distance > JOYSTICK_RADIUS) {
      x = (deltaX / distance) * JOYSTICK_RADIUS;
      y = (deltaY / distance) * JOYSTICK_RADIUS;
    }

    setJoystickPosition({ x, y });

    // 计算移动方向
    const normalizedDistance = distance / JOYSTICK_RADIUS;
    if (normalizedDistance > DEAD_ZONE) {
      const angle = Math.atan2(y, x);
      const direction = getDirectionFromAngle(angle);
      onMove(direction);
    } else {
      onStopMove();
    }
  }, [onMove, onStopMove]);

  const handleJoystickEnd = useCallback(() => {
    setIsDragging(false);
    setJoystickPosition({ x: 0, y: 0 });
    onStopMove();
  }, [onStopMove]);

  const getDirectionFromAngle = (angle: number): 'up' | 'down' | 'left' | 'right' => {
    const degrees = (angle * 180 / Math.PI + 360) % 360;
    if (degrees >= 315 || degrees < 45) return 'right';
    if (degrees >= 45 && degrees < 135) return 'down';
    if (degrees >= 135 && degrees < 225) return 'left';
    return 'up';
  };

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

  // 摇杆鼠标事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleJoystickMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleJoystickEnd();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleJoystickMove, handleJoystickEnd]);

  // 摇杆触摸事件
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleJoystickMove(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      handleJoystickEnd();
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleJoystickMove, handleJoystickEnd]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* 虚拟摇杆 - 向上移动到更合适的位置 */}
      <div className="absolute bottom-24 left-6 pointer-events-auto">
        <div className="relative">
          {/* 摇杆外圈 */}
          <div
            ref={joystickRef}
            className="w-24 h-24 bg-black bg-opacity-30 rounded-full border-2 border-white border-opacity-50 flex items-center justify-center"
            onMouseDown={(e) => handleJoystickStart(e.clientX, e.clientY)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                const touch = e.touches[0];
                handleJoystickStart(touch.clientX, touch.clientY);
              }
            }}
          >
            {/* 摇杆内圈 */}
            <div
              className="w-8 h-8 bg-white bg-opacity-80 rounded-full shadow-lg transition-transform"
              style={{
                transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
              }}
            />
          </div>

          {/* 摇杆标签 */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
              移动
            </span>
          </div>
        </div>
      </div>

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