import React from 'react';
import { styled } from '@mui/material/styles';

const Overlay = styled('div')(({ multiplier }) => ({
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1100,
}));

const Window = styled('div')(({ multiplier, width, height }) => ({
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  textTransform: 'uppercase',
  backgroundColor: '#e2b27e',
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${10 * multiplier}px`,
  minWidth: `${Math.ceil(width * 0.4 * multiplier)}px`,
  minHeight: `${Math.ceil(height * 0.3 * multiplier)}px`,
  color: '#1b0f0a',
  display: 'flex',
  flexDirection: 'column',
  gap: `${10 * multiplier}px`,
}));

const Button = styled('button')(({ multiplier }) => ({
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  fontSize: `${8 * multiplier}px`,
  backgroundColor: '#e2b27e',
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${6 * multiplier}px ${8 * multiplier}px`,
  color: '#1b0f0a',
  cursor: 'pointer',
}));

const SettingsModal = ({ gameSize, onSave, onExit, onClose }) => {
  const { width, height, multiplier } = gameSize;
  return (
    <Overlay multiplier={multiplier} onClick={onClose}>
      <Window multiplier={multiplier} width={width} height={height} onClick={(e) => e.stopPropagation()}>
        <Button multiplier={multiplier} onClick={onSave}>💾 保存</Button>
        <Button multiplier={multiplier} onClick={onExit}>🚪 退出</Button>
        <Button multiplier={multiplier} onClick={onClose}>关闭</Button>
      </Window>
    </Overlay>
  );
};

export default SettingsModal;

