import React, { useEffect, useRef, useState } from 'react';
import { styled } from '@mui/material/styles';

const JoystickContainer = styled('div')(({ theme, gameSize }) => ({
  position: 'fixed',
  bottom: '20px',
  left: '20px',
  zIndex: 1000,
  width: '120px',
  height: '120px',
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
}));

const JoystickBase = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  border: '2px solid rgba(255, 255, 255, 0.5)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',
}));

const JoystickStick = styled('div')(({ theme, isActive, position }) => ({
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
  border: '2px solid rgba(255, 255, 255, 0.8)',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
  transition: isActive ? 'none' : 'all 0.2s ease-out',
  cursor: 'pointer',
  boxShadow: isActive 
    ? '0 0 20px rgba(255, 255, 255, 0.6)' 
    : '0 2px 10px rgba(0, 0, 0, 0.3)',
}));

const DirectionIndicator = styled('div')(({ theme, direction }) => ({
  position: 'absolute',
  width: '20px',
  height: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.8)',
  fontWeight: 'bold',
  ...(direction === 'up' && { top: '5px', left: '50%', transform: 'translateX(-50%)' }),
  ...(direction === 'right' && { right: '5px', top: '50%', transform: 'translateY(-50%)' }),
  ...(direction === 'down' && { bottom: '5px', left: '50%', transform: 'translateX(-50%)' }),
  ...(direction === 'left' && { left: '5px', top: '50%', transform: 'translateY(-50%)' }),
}));

const VirtualJoystick = ({ onDirectionChange, gameSize }) => {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [currentDirection, setCurrentDirection] = useState(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const centerPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      centerPos.current = {
        x: rect.width / 2,
        y: rect.height / 2
      };
      
      startPos.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
      
      setIsActive(true);
      isDragging.current = true;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (!isDragging.current) return;

      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const currentPos = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };

      // 计算相对于中心的位置
      const deltaX = currentPos.x - centerPos.current.x;
      const deltaY = currentPos.y - centerPos.current.y;
      
      // 限制摇杆移动范围
      const maxDistance = 35;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        const limitedX = Math.cos(angle) * maxDistance;
        const limitedY = Math.sin(angle) * maxDistance;
        setPosition({ x: limitedX, y: limitedY });
      } else {
        setPosition({ x: deltaX, y: deltaY });
      }

      // 确定方向
      const direction = getDirection(deltaX, deltaY);
      if (direction !== currentDirection) {
        setCurrentDirection(direction);
        onDirectionChange(direction);
      }
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      setIsActive(false);
      isDragging.current = false;
      setPosition({ x: 0, y: 0 });
      setCurrentDirection(null);
      onDirectionChange(null);
    };

    const handleMouseDown = (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      centerPos.current = {
        x: rect.width / 2,
        y: rect.height / 2
      };
      
      startPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      setIsActive(true);
      isDragging.current = true;
    };

    const handleMouseMove = (e) => {
      e.preventDefault();
      if (!isDragging.current) return;

      const rect = container.getBoundingClientRect();
      const currentPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      const deltaX = currentPos.x - centerPos.current.x;
      const deltaY = currentPos.y - centerPos.current.y;
      
      const maxDistance = 35;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        const limitedX = Math.cos(angle) * maxDistance;
        const limitedY = Math.sin(angle) * maxDistance;
        setPosition({ x: limitedX, y: limitedY });
      } else {
        setPosition({ x: deltaX, y: deltaY });
      }

      const direction = getDirection(deltaX, deltaY);
      if (direction !== currentDirection) {
        setCurrentDirection(direction);
        onDirectionChange(direction);
      }
    };

    const handleMouseUp = (e) => {
      e.preventDefault();
      setIsActive(false);
      isDragging.current = false;
      setPosition({ x: 0, y: 0 });
      setCurrentDirection(null);
      onDirectionChange(null);
    };

    // 触摸事件
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 鼠标事件（用于开发测试）
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onDirectionChange, currentDirection]);

  const getDirection = (deltaX, deltaY) => {
    const threshold = 10; // 最小移动阈值
    
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      return null;
    }
    
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    
    if (angle >= -45 && angle < 45) return 'right';
    if (angle >= 45 && angle < 135) return 'down';
    if (angle >= 135 || angle < -135) return 'left';
    return 'up';
  };

  return (
    <JoystickContainer ref={containerRef} gameSize={gameSize}>
      <JoystickBase>
        <DirectionIndicator direction="up">↑</DirectionIndicator>
        <DirectionIndicator direction="right">→</DirectionIndicator>
        <DirectionIndicator direction="down">↓</DirectionIndicator>
        <DirectionIndicator direction="left">←</DirectionIndicator>
        <JoystickStick 
          isActive={isActive} 
          position={position}
        />
      </JoystickBase>
    </JoystickContainer>
  );
};

export default VirtualJoystick;