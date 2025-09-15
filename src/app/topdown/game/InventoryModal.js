/**
 * 游戏库存/背包模态窗口组件
 * 
 * 这是游戏中的库存管理界面，允许玩家查看和管理收集的物品
 * 包括种子、工具、收获的作物等各类游戏物品
 * 
 * 主要功能：
 * - 分类显示库存物品（种子、工具、杂物等）
 * - 支持标签页切换不同物品类别
 * - 可选择种子进行种植操作
 * - 显示物品数量和详细信息
 * - 响应式设计，适配不同屏幕尺寸
 * - 像素风格 UI，与游戏整体风格一致
 * 
 * 使用方法：
 * <InventoryModal 
 *   isOpen={showInventory}           // 控制模态窗口显示/隐藏
 *   onClose={() => setShowInventory(false)}  // 关闭回调
 *   gameSize={gameSize}              // 游戏尺寸对象
 *   inventory={inventoryData}        // 库存数据对象
 *   mode="normal"                    // 模式：normal(查看) 或 seed-select(选择种子)
 *   onSeedSelect={handleSeedSelect}  // 种子选择回调（仅在 seed-select 模式下）
 * />
 * 
 * 库存数据格式：
 * {
 *   seeds: { "bailuobo": 5, "bocai": 3 },  // 种子类型和数量
 *   misc: { "water": 10, "fertilizer": 2 },  // 工具和杂物
 *   fruits: { "bailuobo_fruit": 8 }         // 收获的作物
 * }
 */

import React, { useEffect, useMemo, useState } from 'react';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 模态窗口遮罩层样式组件
 * 
 * 创建半透明的全屏遮罩，用于突出模态窗口内容
 * 并提供居中布局容器
 */
const Overlay = styled('div')(({ multiplier }) => ({
  position: 'fixed',                   // 固定定位，覆盖整个视窗
  inset: 0,                           // 填满全屏（top:0, right:0, bottom:0, left:0 的简写）
  background: 'rgba(0,0,0,0.5)',      // 半透明黑色遮罩
  display: 'flex',                    // 弹性布局
  alignItems: 'center',               // 垂直居中
  justifyContent: 'center',           // 水平居中
  zIndex: 1100,                       // 高层级，覆盖游戏内容和 HUD
}));

/**
 * 库存窗口主体样式组件
 * 
 * 像素风格的窗口容器，使用游戏内对话框边框
 * 根据游戏尺寸动态调整大小
 */
const Window = styled('div')(({ multiplier, width, height }) => ({
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  textTransform: 'uppercase',
  backgroundColor: '#e2b27e',
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${10 * multiplier}px`,
  width: `${Math.ceil(width * 0.82)}px`,
  height: `${Math.ceil(height * 0.78)}px`,
  maxWidth: `${Math.ceil(width * 0.9)}px`,
  maxHeight: `${Math.ceil(height * 0.9)}px`,
  color: '#1b0f0a',
  position: 'relative',
  overflow: 'hidden'
}));

/**
 * 窗口标题样式组件
 * 
 * 用于显示库存窗口的主标题
 */
const Title = styled('div')(({ multiplier }) => ({
  fontSize: `${10 * multiplier}px`,    // 标题字体大小，根据缩放调整
  marginBottom: `${10 * multiplier}px`, // 底部间距
  fontWeight: 'bold',                  // 粗体显示，突出标题
}));

/**
 * 标签页容器样式组件
 * 
 * 用于容纳多个标签页按钮的水平布局容器
 */
const Tabs = styled('div')(({ multiplier }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: `${6 * multiplier}px`,
  marginRight: `${8 * multiplier}px`,
  minWidth: `${80 * multiplier}px`
}));

/**
 * 单个标签页按钮样式组件
 * 
 * 支持激活/非激活状态的标签页按钮
 * 用于切换不同的物品类别（种子、工具、杂物等）
 */
const Tab = styled('button')(({ multiplier, active }) => ({
  imageRendering: 'pixelated',         // 像素化渲染
  fontFamily: '"Press Start 2P"',      // 像素游戏字体
  fontSize: `${8 * multiplier}px`,     // 字体大小
  padding: `${6 * multiplier}px ${8 * multiplier}px`, // 内边距
  // 激活状态使用更亮的背景色
  backgroundColor: active ? '#e6c299' : '#e2b27e',
  border: 'solid',                     // 实心边框
  // 使用九宫格边框图片
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  color: '#1b0f0a',                    // 文字颜色
  cursor: 'pointer',                   // 鼠标悬停时显示手型光标
}));

/**
 * 物品网格布局容器样式组件
 * 
 * 使用 CSS Grid 创建两列布局，用于显示库存物品列表
 */
const Grid = styled('div')(({ multiplier }) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(5, ${24 * multiplier}px)`,
  gridAutoRows: `${24 * multiplier}px`,
  gap: `${6 * multiplier}px`,
  alignContent: 'start',
  justifyContent: 'start',
  backgroundColor: '#d8a773',
  padding: `${8 * multiplier}px`,
  border: `${multiplier}px solid #79584f`,
  overflow: 'auto',
  flex: 1
}));

/**
 * 单个物品单元格样式组件
 * 
 * 显示单个物品的信息，包括图标、名称和数量
 * 支持点击选择功能（在种子选择模式下）
 */
const Cell = styled('div')(({ multiplier }) => ({
  backgroundColor: '#cfa67e',
  border: `${multiplier}px solid #79584f`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative'
}));

/**
 * 关闭按钮样式组件
 * 
 * 用于关闭库存模态窗口的按钮
 */
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

/**
 * 物品图标槽位样式组件
 * 
 * 用于显示来自 atlas 图集的小图标（farmplants.png/farmplants.json）
 * 为物品图标提供统一的显示区域
 */
const IconSlot = styled('div')(({ multiplier }) => ({
  width: `${16 * multiplier}px`,
  height: `${16 * multiplier}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  imageRendering: 'pixelated'
}));

/** 右下角数量徽标 */
const CountBadge = styled('div')(({ multiplier }) => ({
  position: 'absolute',
  right: `${1 * multiplier}px`,
  bottom: `${1 * multiplier}px`,
  padding: `${1 * multiplier}px ${2 * multiplier}px`,
  background: '#5b3b33',
  color: '#ffe6c9',
  fontFamily: 'inherit',
  fontSize: `${6 * multiplier}px`,
  borderRadius: `${2 * multiplier}px`,
  lineHeight: 1
}));

/**
 * 物品名称文本样式组件
 * 
 * 用于显示物品名称，占据剩余空间
 */
const NameText = styled('span')(({ multiplier }) => ({
  display: 'none'
}));

/**
 * 库存模态窗口主组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.gameSize - 游戏尺寸对象，包含 width, height, multiplier
 * @param {Object} props.inventory - 库存数据对象，包含分类的物品信息
 * @param {Function} props.onClose - 关闭窗口的回调函数
 * @param {boolean} props.selectMode - 是否为选择模式（用于种子选择）
 * @param {string} props.selectTag - 选择模式下的默认标签页
 * @param {Function} props.onSelect - 选择物品时的回调函数
 * 
 * @returns {JSX.Element} 渲染的库存模态窗口
 */
const InventoryModal = ({ gameSize, inventory, onClose, selectMode = false, selectTag = 'seeds', onSelect }) => {
  // 从游戏尺寸对象中提取宽度、高度和缩放倍数
  const { width, height, multiplier } = gameSize;
  
  // 当前激活的标签页状态（种子、杂物、果实等）
  const [activeTab, setActiveTab] = useState(selectTag || 'seeds');
  
  // Atlas 图集帧信息状态，用于渲染物品图标
  const [frames, setFrames] = useState(null);

  /**
   * 加载 Atlas 图集帧信息
   * 
   * 从 farmplants.json 文件中读取图集的帧定义信息
   * 用于正确显示物品图标的位置和尺寸
   */
  useEffect(() => {
    let mounted = true; // 组件挂载状态标记，防止内存泄漏
    
    fetch('/game/assets/sprites/atlas/farmplants.json')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return; // 组件已卸载，忽略响应
        
        try {
          // 提取纹理信息
          const tex = json.textures?.[0];
          const atlasSize = tex?.size || { w: 192, h: 192 }; // 图集总尺寸
          
          // 构建帧映射表：物品ID -> 帧坐标信息
          const map = {};
          (tex?.frames || []).forEach((f) => {
            const key = f.filename.replace('.png', ''); // 去除文件扩展名作为物品ID
            map[key] = { 
              x: f.frame.x,    // 在图集中的 X 坐标
              y: f.frame.y,    // 在图集中的 Y 坐标
              w: f.frame.w,    // 帧宽度
              h: f.frame.h     // 帧高度
            };
          });
          
          setFrames({ map, size: atlasSize });
        } catch (_) {
          // JSON 解析失败，设置为 null
          setFrames(null);
        }
      })
      .catch(() => setFrames(null)); // 网络请求失败
    
    // 清理函数：组件卸载时设置 mounted 为 false
    return () => { mounted = false; };
  }, []); // 空依赖数组，仅在组件挂载时执行一次

  /**
   * 当前标签页的物品列表
   * 
   * 根据当前激活的标签页从库存数据中提取对应的物品列表
   * 使用 useMemo 进行性能优化，避免不必要的重新计算
   */
  const items = useMemo(() => {
    const tags = inventory?.tags || {};           // 获取分类标签数据
    const current = tags[activeTab]?.items || {}; // 获取当前标签下的物品
    return Object.values(current);                // 转换为数组格式
  }, [inventory, activeTab]); // 依赖库存数据和激活标签

  /**
   * 处理物品单元格点击事件
   * 
   * 在选择模式下，允许玩家点击种子进行选择
   * 
   * @param {Object} it - 被点击的物品对象
   */
  const handleCellClick = (it) => {
    if (!selectMode) return;                    // 非选择模式，忽略点击
    if (activeTab !== 'seeds') return;          // 仅允许在种子标签页选择
    if (!it || (it.count ?? 0) <= 0) return;   // 物品不存在或数量为0，忽略点击
    
    // 调用选择回调函数，传递物品ID
    if (typeof onSelect === 'function') onSelect(it.id);
  };

  /**
   * 渲染物品图标
   * 
   * 根据物品ID从图集中提取对应的图标进行显示
   * 对于特殊物品（如water）使用emoji作为后备显示
   * 
   * @param {string} itemId - 物品ID
   * @returns {JSX.Element} 渲染的图标元素
   */
  const renderIcon = (itemId) => {
    // 特殊处理：water 不在 farmplants 图集中，使用 emoji 显示
    if (itemId === 'water' || !frames) {
      return <span style={{ fontSize: `${12 * multiplier}px`, lineHeight: 1 }}>💧</span>;
    }
    
    // 从帧映射表中查找物品对应的帧信息
    const frame = frames.map[itemId];
    if (!frame) {
      // 找不到对应帧，使用默认点符号
      return <span style={{ fontSize: `${12 * multiplier}px`, lineHeight: 1 }}>•</span>;
    }
    
    // 计算背景图片的尺寸和位置（根据缩放倍数调整）
    const bgSize = `${frames.size.w * multiplier}px ${frames.size.h * multiplier}px`;
    const bgPos = `-${frame.x * multiplier}px -${frame.y * multiplier}px`;
    
    // 使用 CSS 背景图片显示图集中的特定帧
    return (
      <div
        style={{
          width: `${frame.w * multiplier}px`,           // 帧宽度
          height: `${frame.h * multiplier}px`,          // 帧高度
          backgroundImage: 'url(/game/assets/sprites/atlas/farmplants.png)', // 图集图片
          backgroundSize: bgSize,                       // 背景尺寸
          backgroundPosition: bgPos,                    // 背景位置（负值实现裁切效果）
          imageRendering: 'pixelated',                  // 像素化渲染
        }}
      />
    );
  };

  return (
    // 遮罩层：点击遮罩区域关闭模态窗口
    <Overlay multiplier={multiplier} onClick={onClose}>
      {/* 主窗口：阻止事件冒泡，避免点击窗口内容时关闭 */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
        style={{ display: 'flex' }}
        onClick={(e) => e.stopPropagation()}
      >
      <Window 
        multiplier={multiplier} 
        width={width} 
        height={height} 
        style={{ display: 'flex' }}
      >
        <Close multiplier={multiplier} onClick={onClose}>
          ×
        </Close>
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Title multiplier={multiplier}>背包</Title>
            <Tabs multiplier={multiplier}>
              <Tab 
                multiplier={multiplier} 
                active={activeTab === 'seeds'} 
                onClick={() => setActiveTab('seeds')}
              >
                🌱 种子
              </Tab>
              <Tab 
                multiplier={multiplier} 
                active={activeTab === 'misc'} 
                onClick={() => setActiveTab('misc')}
              >
                🧰 杂物
              </Tab>
              <Tab 
                multiplier={multiplier} 
                active={activeTab === 'fruits'} 
                onClick={() => setActiveTab('fruits')}
              >
                🧺 果实
              </Tab>
            </Tabs>
          </div>
          <Grid multiplier={multiplier}>
            {items.length === 0 && (
              <Cell multiplier={multiplier}>
                <IconSlot multiplier={multiplier}>•</IconSlot>
              </Cell>
            )}
            {items.map((it) => (
              <Cell 
                key={it.id} 
                multiplier={multiplier} 
                onClick={() => handleCellClick(it)}
                style={{ 
                  cursor: selectMode && activeTab === 'seeds' && (it.count ?? 0) > 0 ? 'pointer' : 'default',
                  opacity: selectMode && activeTab === 'seeds' && (it.count ?? 0) <= 0 ? 0.6 : 1 
                }}
              >
                <IconSlot multiplier={multiplier}>
                  {renderIcon(it.id)}
                </IconSlot>
                {(it.count ?? 0) > 0 && (
                  <CountBadge multiplier={multiplier}>{it.count}</CountBadge>
                )}
              </Cell>
            ))}
          </Grid>
        </div>
      </Window>
      </motion.div>
    </Overlay>
  );
};

export default InventoryModal;

