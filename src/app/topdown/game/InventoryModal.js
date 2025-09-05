import React, { useEffect, useMemo, useState } from 'react';
import { styled } from '@mui/material/styles';

const Overlay = styled('div')(({ multiplier }) => ({
  position: 'fixed',
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

const Tabs = styled('div')(({ multiplier }) => ({
  display: 'flex',
  gap: `${8 * multiplier}px`,
  marginBottom: `${8 * multiplier}px`,
}));

const Tab = styled('button')(({ multiplier, active }) => ({
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  fontSize: `${8 * multiplier}px`,
  padding: `${6 * multiplier}px ${8 * multiplier}px`,
  backgroundColor: active ? '#e6c299' : '#e2b27e',
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  color: '#1b0f0a',
  cursor: 'pointer',
}));

const Grid = styled('div')(({ multiplier }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
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

// 用于显示来自 atlas 的小图标（farmplants.png/farmplants.json）
const IconSlot = styled('div')(({ multiplier }) => ({
  width: `${16 * multiplier}px`,
  height: `${16 * multiplier}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  imageRendering: 'pixelated',
}));

const NameText = styled('span')(({ multiplier }) => ({
  flex: 1,
  marginLeft: `${6 * multiplier}px`,
}));

const InventoryModal = ({ gameSize, inventory, onClose }) => {
  const { width, height, multiplier } = gameSize;
  const [activeTab, setActiveTab] = useState('seeds');
  const [frames, setFrames] = useState(null);

  // 载入 atlas 帧信息（仅一次）
  useEffect(() => {
    let mounted = true;
    fetch('/game/assets/sprites/atlas/farmplants.json')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        try {
          const tex = json.textures?.[0];
          const atlasSize = tex?.size || { w: 192, h: 192 };
          const map = {};
          (tex?.frames || []).forEach((f) => {
            const key = f.filename.replace('.png', '');
            map[key] = { x: f.frame.x, y: f.frame.y, w: f.frame.w, h: f.frame.h };
          });
          setFrames({ map, size: atlasSize });
        } catch (_) {
          setFrames(null);
        }
      })
      .catch(() => setFrames(null));
    return () => { mounted = false; };
  }, []);

  const items = useMemo(() => {
    const tags = inventory?.tags || {};
    const current = tags[activeTab]?.items || {};
    return Object.values(current);
  }, [inventory, activeTab]);

  const renderIcon = (itemId) => {
    // water 不在 farmplants 图集中，使用 emoji 退化
    if (itemId === 'water' || !frames) {
      return <span style={{ fontSize: `${12 * multiplier}px`, lineHeight: 1 }}>💧</span>;
    }
    const frame = frames.map[itemId];
    if (!frame) return <span style={{ fontSize: `${12 * multiplier}px`, lineHeight: 1 }}>•</span>;
    const bgSize = `${frames.size.w * multiplier}px ${frames.size.h * multiplier}px`;
    const bgPos = `-${frame.x * multiplier}px -${frame.y * multiplier}px`;
    return (
      <div
        style={{
          width: `${frame.w * multiplier}px`,
          height: `${frame.h * multiplier}px`,
          backgroundImage: 'url(/game/assets/sprites/atlas/farmplants.png)',
          backgroundSize: bgSize,
          backgroundPosition: bgPos,
          imageRendering: 'pixelated',
        }}
      />
    );
  };

  return (
    <Overlay multiplier={multiplier} onClick={onClose}>
      <Window multiplier={multiplier} width={width} height={height} onClick={(e) => e.stopPropagation()}>
        <Title multiplier={multiplier}>背包</Title>
        <Tabs multiplier={multiplier}>
          <Tab multiplier={multiplier} active={activeTab === 'seeds'} onClick={() => setActiveTab('seeds')}>🌱 种子</Tab>
          <Tab multiplier={multiplier} active={activeTab === 'misc'} onClick={() => setActiveTab('misc')}>🧰 杂物</Tab>
          <Tab multiplier={multiplier} active={activeTab === 'fruits'} onClick={() => setActiveTab('fruits')}>🧺 果实</Tab>
        </Tabs>

        <Grid multiplier={multiplier}>
          {items.length === 0 && (
            <Cell multiplier={multiplier}><span>空</span><b>x 0</b></Cell>
          )}
          {items.map((it) => (
            <Cell key={it.id} multiplier={multiplier}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IconSlot multiplier={multiplier}>{renderIcon(it.id)}</IconSlot>
                <NameText multiplier={multiplier}>{it.name || it.id}</NameText>
              </div>
              <b>x {it.count ?? 0}</b>
            </Cell>
          ))}
        </Grid>
        <Close multiplier={multiplier} onClick={onClose}>关闭</Close>
      </Window>
    </Overlay>
  );
};

export default InventoryModal;

