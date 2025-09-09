import { styled } from '@mui/material/styles';

const Bar = styled('div')(({ multiplier, gameWidth }) => ({
  position: 'fixed',
  top: `${8 * multiplier}px`,
  left: '50%',
  transform: 'translateX(-50%)',
  // 限制最大宽度，避免超宽屏下按钮跑到两端不可见
  width: `${Math.min(Math.max(320, gameWidth || 320), 1280)}px`,
  maxWidth: '100vw',
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

const Info = styled('div')(({ multiplier }) => ({
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  fontSize: `${8 * multiplier}px`,
  color: '#fff',
  pointerEvents: 'none',
  display: 'flex',
  gap: `${6 * multiplier}px`,
  alignItems: 'center',
}));

const HUDBar = ({ gameSize, avatarUrl, onAvatarClick, onSettingsClick, timeText, weatherIcon }) => {
  const { multiplier, width: gameWidth } = gameSize;
  return (
    <Bar multiplier={multiplier} gameWidth={gameWidth}>
      <PixelButton multiplier={multiplier} onClick={onAvatarClick}>
        👜
      </PixelButton>
      <Info multiplier={multiplier}>
        <span>{weatherIcon || '☀'}</span>
        <span>{timeText || '--:--'}</span>
      </Info>
      <PixelButton multiplier={multiplier} onClick={onSettingsClick}>
        ⚙
      </PixelButton>
    </Bar>
  );
};

export default HUDBar;

