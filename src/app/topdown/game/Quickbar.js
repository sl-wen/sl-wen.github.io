import { styled } from '@mui/material/styles';

const Bar = styled('div')(({ multiplier, gameWidth }) => ({
  position: 'fixed',
  bottom: `${10 * multiplier}px`,
  left: '50%',
  transform: 'translateX(-50%)',
  width: `${Math.min(Math.max(360, gameWidth || 360), 1280)}px`,
  maxWidth: '100vw',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: `${6 * multiplier}px`,
  pointerEvents: 'none',
  zIndex: 1001,
}));

const Slot = styled('button')(({ multiplier, active }) => ({
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  fontSize: `${8 * multiplier}px`,
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${4 * multiplier}px ${6 * multiplier}px`,
  backgroundColor: active ? '#c7f0d8' : '#e2b27e',
  cursor: 'pointer',
  pointerEvents: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: `${4 * multiplier}px`,
}));

const Count = styled('span')(({ multiplier }) => ({
  fontSize: `${7 * multiplier}px`,
  color: '#222',
}));

/**
 * Quickbar
 * - 显示常用槽位：种子、浇水
 * - 点击“种子”弹出径向菜单；点击“浇水”仅高亮（不选中种类）
 */
const Quickbar = ({ gameSize, seedSummary, selectedSeedId, onOpenSeedMenu, onSelectWater }) => {
  const { multiplier, width: gameWidth } = gameSize;
  const seedCount = seedSummary?.total ?? 0;
  const seedLabel = selectedSeedId ? selectedSeedId.replace('-0', '') : '种子';
  return (
    <Bar multiplier={multiplier} gameWidth={gameWidth}>
      <Slot multiplier={multiplier} active onClick={onOpenSeedMenu}>
        🌱 {seedLabel} <Count multiplier={multiplier}>×{seedCount}</Count>
      </Slot>
      <Slot multiplier={multiplier} onClick={onSelectWater}>
        💧 水
      </Slot>
    </Bar>
  );
};

export default Quickbar;

