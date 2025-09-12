import React from 'react';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

const Overlay = styled('div')(({ multiplier }) => ({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1150,
}));

const Window = styled('div')(({ multiplier, width, height }) => ({
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  textTransform: 'uppercase',
  backgroundColor: '#e2b27e',
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${10 * multiplier}px`,
  width: `${Math.ceil(width * 0.45)}px`,
  maxWidth: `${Math.ceil(width * 0.9)}px`,
  color: '#1b0f0a',
  display: 'flex',
  flexDirection: 'column',
  gap: `${8 * multiplier}px`,
  position: 'relative',
}));

const Title = styled('div')(({ multiplier }) => ({
  fontSize: `${10 * multiplier}px`,
  fontWeight: 'bold',
}));

const Close = styled('button')(({ multiplier }) => ({
  position: 'absolute',
  top: `${6 * multiplier}px`,
  right: `${6 * multiplier}px`,
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  fontSize: `${8 * multiplier}px`,
  backgroundColor: '#e2b27e',
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${4 * multiplier}px ${6 * multiplier}px`,
  color: '#1b0f0a',
  cursor: 'pointer'
}));

const StatRow = styled('div')(({ multiplier }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: `${8 * multiplier}px`,
  fontSize: `${8 * multiplier}px`,
}));

const Actions = styled('div')(({ multiplier }) => ({
  display: 'flex',
  gap: `${8 * multiplier}px`,
  marginTop: `${4 * multiplier}px`,
}));

const Button = styled('button')(({ multiplier }) => ({
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  fontSize: `${8 * multiplier}px`,
  backgroundColor: '#e2b27e',
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${6 * multiplier}px ${10 * multiplier}px`,
  color: '#1b0f0a',
  cursor: 'pointer',
}));

const Progress = styled('div')(({ multiplier }) => ({
  height: `${6 * multiplier}px`,
  background: '#cfa67e',
  border: `${multiplier}px solid #79584f`,
  position: 'relative',
  flex: 1,
}));

const ProgressFill = styled('div')(({ multiplier, value }) => ({
  height: '100%',
  width: `${Math.max(0, Math.min(100, value))}%`,
  background: '#5b9bd5',
}));

const fertileColor = (v) => (v >= 66 ? '#6ac36a' : v >= 33 ? '#d9cf5b' : '#cc7a5a');

const FarmlandInfoModal = ({ info, onClose, onAction, gameSize }) => {
  const { width, height, multiplier } = gameSize;
  const { tileX, tileY, soil, crop, waterInventory, actions } = info || {};

  const cropNameMap = { huluobo: '胡萝卜', bailuobo: '白萝卜' };
  const cropLabel = crop ? `${cropNameMap[crop.key] || crop.key}（阶段${crop.stage}${crop.stage >= 5 ? '·可收获' : ''}${crop.watered ? '·已浇水' : ''}）` : '—';

  return (
    <Overlay multiplier={multiplier} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.15 }} onClick={(e) => e.stopPropagation()}>
        <Window multiplier={multiplier} width={width} height={height}>
          <Close multiplier={multiplier} onClick={onClose}>×</Close>
          <Title multiplier={multiplier}>耕地 ({tileX},{tileY})</Title>
          <StatRow multiplier={multiplier}>
            <span>肥沃度</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * multiplier}px`, minWidth: `${120 * multiplier}px` }}>
              <Progress multiplier={multiplier}><ProgressFill multiplier={multiplier} value={soil?.fertility ?? 0} style={{ background: fertileColor(soil?.fertility ?? 0) }} /></Progress>
              <span>{Math.round(soil?.fertility ?? 0)}%</span>
            </div>
          </StatRow>
          <StatRow multiplier={multiplier}>
            <span>湿度</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * multiplier}px`, minWidth: `${120 * multiplier}px` }}>
              <Progress multiplier={multiplier}><ProgressFill multiplier={multiplier} value={soil?.moisture ?? 0} /></Progress>
              <span>{Math.round(soil?.moisture ?? 0)}%</span>
            </div>
          </StatRow>
          <StatRow multiplier={multiplier}>
            <span>作物</span>
            <span style={{ fontSize: `${8 * multiplier}px` }}>{cropLabel}</span>
          </StatRow>
          <StatRow multiplier={multiplier}>
            <span>背包水量</span>
            <span>{waterInventory ?? 0}</span>
          </StatRow>

          <Actions multiplier={multiplier}>
            {Array.isArray(actions) && actions.includes('plant') && (
              <Button multiplier={multiplier} onClick={() => onAction('plant')}>🌱 种植</Button>
            )}
            {Array.isArray(actions) && actions.includes('water') && (
              <Button multiplier={multiplier} onClick={() => onAction('water')}>💧 浇水</Button>
            )}
            {Array.isArray(actions) && actions.includes('harvest') && (
              <Button multiplier={multiplier} onClick={() => onAction('harvest')}>🧺 收获</Button>
            )}
          </Actions>
        </Window>
      </motion.div>
    </Overlay>
  );
};

export default FarmlandInfoModal;

