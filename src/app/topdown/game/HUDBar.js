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
  padding: `0 ${12 * multiplier}px`,
  pointerEvents: 'none',
  zIndex: 1001,
}));

const PixelButton = styled('button')(({ multiplier }) => ({
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  fontSize: `${8 * multiplier}px`,
  backgroundColor: '#e2b27e',
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${2 * multiplier}px ${3 * multiplier}px`,
  color: '#1b0f0a',
  display: 'flex',
  alignItems: 'center',
  gap: `${6 * multiplier}px`,
  cursor: 'pointer',
  pointerEvents: 'auto',
}));

const AvatarImg = styled('div')(({ src, multiplier }) => ({
  width: `${24 * multiplier}px`,
  height: `${24 * multiplier}px`,
  backgroundColor: '#cfa67e',
  border: '1px solid #79584f',
  backgroundImage: src ? `url(${src})` : 'none',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

const HUDBar = ({ gameSize, avatarUrl, onAvatarClick, onSettingsClick }) => {
  const { multiplier } = gameSize;
  return (
    <Bar multiplier={multiplier}>
      <PixelButton multiplier={multiplier} onClick={onAvatarClick}>
        <AvatarImg multiplier={multiplier} src={avatarUrl} />
        👜
      </PixelButton>
      <PixelButton multiplier={multiplier} onClick={onSettingsClick}>
        ⚙ 
      </PixelButton>
    </Bar>
  );
};

export default HUDBar;

