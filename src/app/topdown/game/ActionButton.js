import React, { useEffect, useRef, useState } from 'react';
import { styled } from '@mui/material/styles';

const ActionButtonContainer = styled('div')(({ theme, gameSize }) => ({
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 1000,
  width: '100px', // 从80px增加到100px
  height: '100px', // 从80px增加到100px
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
}));

const ActionButtonBase = styled('div')(({ theme, isPressed }) => ({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: isPressed 
    ? 'rgba(255, 100, 100, 0.8)' 
    : 'rgba(255, 100, 100, 0.6)',
  border: '2px solid rgba(255, 255, 255, 0.8)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',
  cursor: 'pointer',
  transition: 'all 0.1s ease-out',
  transform: isPressed ? 'scale(0.95)' : 'scale(1)',
  boxShadow: isPressed 
    ? '0 0 20px rgba(255, 100, 100, 0.6)' 
    : '0 2px 10px rgba(0, 0, 0, 0.3)',
}));

const ButtonIcon = styled('div')(({ theme }) => ({
  fontSize: '32px', // 从24px增加到32px
  color: 'rgba(255, 255, 255, 0.9)',
  fontWeight: 'bold',
  textAlign: 'center',
  lineHeight: '1',
}));

const ActionButton = ({ onAction, gameSize, icon = '⚔️', label = 'Attack' }) => {
  const [isPressed, setIsPressed] = useState(false);
  const containerRef = useRef(null);
  const isTouching = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      setIsPressed(true);
      isTouching.current = true;
      onAction && onAction();
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      setIsPressed(false);
      isTouching.current = false;
    };

    const handleMouseDown = (e) => {
      e.preventDefault();
      setIsPressed(true);
      onAction && onAction();
    };

    const handleMouseUp = (e) => {
      e.preventDefault();
      setIsPressed(false);
    };

    const handleMouseLeave = (e) => {
      e.preventDefault();
      setIsPressed(false);
    };

    // 触摸事件
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 鼠标事件（用于开发测试）
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [onAction]);

  return (
    <ActionButtonContainer ref={containerRef} gameSize={gameSize}>
      <ActionButtonBase isPressed={isPressed}>
        <ButtonIcon>{icon}</ButtonIcon>
      </ActionButtonBase>
    </ActionButtonContainer>
  );
};

export default ActionButton;