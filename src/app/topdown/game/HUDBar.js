import React from 'react';
import { styled } from '@mui/material/styles';

const Bar = styled('div')(({ multiplier }) => ({
  position: 'absolute',
  top: `${8 * multiplier}px`,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `0 ${4 * multiplier}px`,
  pointerEvents: 'none',
  zIndex: 1001,
}));

const PixelButton = styled('button')(({ multiplier }) => ({
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  fontSize: `${8 * multiplier}px`,
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${2 * multiplier}px ${2 * multiplier}px`,
  backgroundColor: '#e2b27e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  pointerEvents: 'auto',
}));

const HUDBar = ({ gameSize, avatarUrl, onAvatarClick, onSettingsClick }) => {
  const { multiplier } = gameSize;
  return (
    <Bar multiplier={multiplier}>
      <PixelButton multiplier={multiplier} onClick={onAvatarClick}>
        👜
      </PixelButton>
      <PixelButton multiplier={multiplier} onClick={onSettingsClick}>
        ⚙ 
      </PixelButton>
    </Bar>
  );
};

export default HUDBar;

