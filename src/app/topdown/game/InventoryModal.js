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
  minWidth: `${Math.ceil(width * 0.6 * multiplier)}px`,
  minHeight: `${Math.ceil(height * 0.5 * multiplier)}px`,
  color: '#1b0f0a',
}));

const Title = styled('div')(({ multiplier }) => ({
  fontSize: `${10 * multiplier}px`,
  marginBottom: `${10 * multiplier}px`,
  fontWeight: 'bold',
}));

const Grid = styled('div')(({ multiplier }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: `${8 * multiplier}px`,
}));

const Cell = styled('div')(({ multiplier }) => ({
  backgroundColor: '#cfa67e',
  border: `${multiplier}px solid #79584f`,
  padding: `${8 * multiplier}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const Close = styled('button')(({ multiplier }) => ({
  marginTop: `${12 * multiplier}px`,
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

const InventoryModal = ({ gameSize, inventory, onClose }) => {
  const { width, height, multiplier } = gameSize;
  return (
    <Overlay multiplier={multiplier} onClick={onClose}>
      <Window multiplier={multiplier} width={width} height={height} onClick={(e) => e.stopPropagation()}>
        <Title multiplier={multiplier}>背包</Title>
        <Grid multiplier={multiplier}>
          <Cell multiplier={multiplier}><span>🌱 种子</span><b>x {inventory?.seeds ?? 0}</b></Cell>
          <Cell multiplier={multiplier}><span>💧 水</span><b>x {inventory?.water ?? 0}</b></Cell>
          <Cell multiplier={multiplier}><span>🧺 果实</span><b>x {inventory?.fruits ?? 0}</b></Cell>
        </Grid>
        <Close multiplier={multiplier} onClick={onClose}>关闭</Close>
      </Window>
    </Overlay>
  );
};

export default InventoryModal;

