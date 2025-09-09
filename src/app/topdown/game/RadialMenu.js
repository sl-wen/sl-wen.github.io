import { styled } from '@mui/material/styles';
import { useMemo } from 'react';

const Overlay = styled('div')(({ multiplier }) => ({
  position: 'fixed',
  inset: 0,
  zIndex: 1002,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'auto',
  background: 'rgba(0,0,0,0.15)',
}));

const Ring = styled('div')(({ size }) => ({
  position: 'relative',
  width: `${size}px`,
  height: `${size}px`,
  borderRadius: '50%',
}));

const Item = styled('button')(({ x, y, r, multiplier, active }) => ({
  position: 'absolute',
  left: `${x - r}px`,
  top: `${y - r}px`,
  width: `${2 * r}px`,
  height: `${2 * r}px`,
  borderRadius: '50%',
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  fontSize: `${8 * multiplier}px`,
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  backgroundColor: active ? '#c7f0d8' : '#e2b27e',
  cursor: 'pointer',
}));

/**
 * RadialMenu
 * - 用于选择种子种类；传入 items: [{id, label, count}]
 */
const RadialMenu = ({ gameSize, items, onSelect, onClose, selectedId }) => {
  const { multiplier } = gameSize;
  const ringSize = Math.min(280 * multiplier, 360);
  const itemRadius = 18 * multiplier;
  const positions = useMemo(() => {
    const angleStep = (Math.PI * 2) / Math.max(1, items.length);
    const radius = ringSize / 2 - itemRadius - 6 * multiplier;
    return items.map((_, i) => {
      const a = -Math.PI / 2 + i * angleStep;
      return {
        x: ringSize / 2 + radius * Math.cos(a),
        y: ringSize / 2 + radius * Math.sin(a),
      };
    });
  }, [items, ringSize, itemRadius, multiplier]);

  return (
    <Overlay multiplier={multiplier} onClick={onClose}>
      <Ring size={ringSize} onClick={(e) => e.stopPropagation()}>
        {items.map((it, i) => (
          <Item
            key={it.id}
            x={positions[i].x}
            y={positions[i].y}
            r={itemRadius}
            multiplier={multiplier}
            active={it.id === selectedId}
            onClick={() => onSelect(it.id)}
          >
            🌱{it.label}
          </Item>
        ))}
      </Ring>
    </Overlay>
  );
};

export default RadialMenu;

