/**
 * 游戏快捷栏组件
 * 
 * 显示在屏幕底部的快捷操作栏，提供常用工具和物品的快速访问
 * 主要用于农业系统的种植和浇水操作
 * 
 * 主要功能：
 * - 显示种子槽位，包含当前选中的种子类型和总数量
 * - 显示浇水工具槽位，显示水的数量
 * - 点击种子槽位打开径向菜单选择种子
 * - 点击浇水槽位选择浇水工具
 * - 响应式设计，适配不同屏幕尺寸
 * - 像素风格UI，与游戏整体风格一致
 * 
 * 使用方法：
 * <Quickbar 
 *   gameSize={gameSize}                    // 游戏尺寸对象
 *   seedSummary={{ total: 10, ... }}      // 种子汇总信息
 *   selectedSeedId="bailuobo"              // 当前选中的种子ID
 *   onOpenSeedMenu={handleOpenSeedMenu}    // 打开种子选择菜单回调
 *   onSelectWater={handleSelectWater}      // 选择浇水工具回调
 * />
 * 
 * 设计特点：
 * - 固定在屏幕底部，不遮挡游戏内容
 * - 半透明背景，保持游戏视野清晰
 * - 激活状态有视觉反馈，便于识别当前选中工具
 * - 数量显示，帮助玩家了解资源状况
 */

import { styled } from '@mui/material/styles';

/**
 * 快捷栏容器样式组件
 * 
 * 创建固定在屏幕底部的快捷栏容器
 * 提供居中布局和响应式宽度控制
 */
const Bar = styled('div')(({ multiplier, gameWidth }) => ({
  position: 'fixed',                    // 固定定位，不随页面滚动
  bottom: `${10 * multiplier}px`,       // 距离底部的间距
  left: '50%',                          // 水平居中定位
  transform: 'translateX(-50%)',        // 通过变换实现真正的水平居中
  // 动态宽度计算，确保在不同屏幕尺寸下的适配
  width: `${Math.min(Math.max(360, gameWidth || 360), 1280)}px`,
  maxWidth: '100vw',                    // 不超过视窗宽度
  display: 'flex',                      // 弹性布局
  justifyContent: 'center',             // 水平居中对齐
  alignItems: 'center',                 // 垂直居中对齐
  gap: `${6 * multiplier}px`,           // 槽位之间的间距
  pointerEvents: 'none',                // 容器本身不响应鼠标事件
  zIndex: 1001,                         // 高层级，显示在游戏内容之上
}));

/**
 * 快捷槽位按钮样式组件
 * 
 * 单个快捷槽位的样式，支持激活/非激活状态
 * 用于显示工具、种子等可快速访问的物品
 */
const Slot = styled('button')(({ multiplier, active }) => ({
  imageRendering: 'pixelated',          // 像素化渲染，保持复古风格
  fontFamily: '"Press Start 2P"',       // 像素游戏字体
  fontSize: `${8 * multiplier}px`,      // 字体大小
  border: 'solid',                      // 实心边框
  // 使用九宫格边框图片，创建像素风格边框
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${4 * multiplier}px ${6 * multiplier}px`, // 内边距
  // 激活状态使用浅绿色背景，非激活状态使用默认背景
  backgroundColor: active ? '#c7f0d8' : '#e2b27e',
  cursor: 'pointer',                    // 鼠标悬停时显示手型光标
  pointerEvents: 'auto',                // 按钮本身响应鼠标事件
  display: 'flex',                      // 弹性布局
  alignItems: 'center',                 // 垂直居中对齐
  gap: `${4 * multiplier}px`,           // 图标、文字、数量之间的间距
}));

/**
 * 数量显示样式组件
 * 
 * 用于显示物品的数量，字体较小，颜色较深
 * 通常显示在槽位的右侧
 */
const Count = styled('span')(({ multiplier }) => ({
  fontSize: `${7 * multiplier}px`,      // 较小的字体大小
  color: '#222',                        // 深色文字，与背景形成对比
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

