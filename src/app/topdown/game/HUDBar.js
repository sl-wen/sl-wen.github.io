/**
 * 游戏 HUD 顶部状态栏组件
 * 
 * 这是游戏界面顶部的状态栏，显示游戏时间、天气信息，以及提供快捷操作按钮
 * 
 * 主要功能：
 * - 显示游戏内时间和天气状态
 * - 提供背包/库存访问按钮（左侧背包图标）
 * - 提供设置菜单访问按钮（右侧齿轮图标）
 * - 自适应不同屏幕尺寸和游戏缩放倍数
 * - 像素风格设计，与游戏整体风格保持一致
 * 
 * 使用方法：
 * <HUDBar 
 *   gameSize={gameSize}           // 游戏尺寸对象，包含 multiplier 和 width
 *   avatarUrl={avatarUrl}         // 用户头像 URL（可选）
 *   onAvatarClick={handleAvatar}  // 背包按钮点击回调
 *   onSettingsClick={handleSettings} // 设置按钮点击回调
 *   timeText="08:30"              // 游戏时间文本
 *   weatherIcon="☀"               // 天气图标
 * />
 * 
 * 组件特点：
 * - 固定在屏幕顶部，不随游戏内容滚动
 * - 响应式布局，在不同屏幕尺寸下保持良好显示
 * - 像素化字体和边框，营造复古游戏氛围
 * - 合理的 z-index 确保始终显示在游戏内容之上
 */

import { styled } from '@mui/material/styles';

/**
 * HUD 状态栏容器样式组件
 * 
 * 特点：
 * - 固定定位在屏幕顶部中央
 * - 自适应宽度，避免在超宽屏幕上按钮分散过远
 * - 弹性布局，左右按钮分布，中央显示信息
 * - 高 z-index 确保覆盖在游戏内容之上
 */
const Bar = styled('div')(({ multiplier, gameWidth }) => ({
  position: 'fixed',                    // 固定定位，不随页面滚动
  top: `${8 * multiplier}px`,          // 距离顶部的间距，根据缩放倍数调整
  left: '50%',                         // 水平居中定位
  transform: 'translateX(-50%)',       // 通过变换实现真正的水平居中
  // 限制最大宽度，避免超宽屏下按钮跑到两端不可见
  width: `${Math.min(Math.max(320, gameWidth || 320), 1280)}px`,  // 动态宽度计算
  maxWidth: '100vw',                   // 不超过视窗宽度
  display: 'flex',                     // 弹性布局
  justifyContent: 'space-between',     // 左右分布对齐
  alignItems: 'center',                // 垂直居中对齐
  padding: `0 ${4 * multiplier}px`,    // 左右内边距，根据缩放倍数调整
  pointerEvents: 'none',               // 容器本身不响应鼠标事件，避免阻挡游戏操作
  zIndex: 1001,                        // 高层级，确保显示在游戏内容之上
}));

/**
 * 像素风格按钮样式组件
 * 
 * 特点：
 * - 像素化渲染，保持复古游戏风格
 * - Press Start 2P 字体，经典游戏字体
 * - 使用游戏内对话框边框图片作为按钮边框
 * - 响应缩放倍数，在不同设备上保持一致的视觉效果
 */
const PixelButton = styled('button')(({ multiplier }) => ({
  imageRendering: 'pixelated',         // 像素化渲染，避免图像模糊
  fontFamily: '"Press Start 2P"',      // 经典像素游戏字体
  fontSize: `${8 * multiplier}px`,     // 字体大小根据缩放倍数调整
  border: 'solid',                     // 实心边框
  // 使用九宫格边框图片，实现像素风格边框效果
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${2 * multiplier}px ${2 * multiplier}px`,  // 内边距
  backgroundColor: '#e2b27e',          // 按钮背景色，与游戏 UI 风格一致
  display: 'flex',                     // 弹性布局
  alignItems: 'center',                // 内容垂直居中
  justifyContent: 'center',            // 内容水平居中
  cursor: 'pointer',                   // 鼠标悬停时显示手型光标
  pointerEvents: 'auto',               // 按钮本身响应鼠标事件
}));

/**
 * 信息显示区域样式组件
 * 
 * 用于显示游戏时间和天气信息
 * 特点：
 * - 像素化字体，与游戏风格一致
 * - 白色文字，在深色背景上有良好的对比度
 * - 弹性布局，图标和文字之间有适当间距
 * - 不响应鼠标事件，避免干扰游戏操作
 */
const Info = styled('div')(({ multiplier }) => ({
  imageRendering: 'pixelated',         // 像素化渲染
  fontFamily: '"Press Start 2P"',      // 像素游戏字体
  fontSize: `${8 * multiplier}px`,     // 字体大小根据缩放调整
  color: '#fff',                       // 白色文字
  pointerEvents: 'none',               // 不响应鼠标事件
  display: 'flex',                     // 弹性布局
  gap: `${6 * multiplier}px`,          // 元素间距
  alignItems: 'center',                // 垂直居中对齐
}));

/**
 * HUD 状态栏主组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.gameSize - 游戏尺寸对象
 * @param {number} props.gameSize.multiplier - 游戏缩放倍数
 * @param {number} props.gameSize.width - 游戏宽度
 * @param {string} props.avatarUrl - 用户头像 URL（当前未使用，预留扩展）
 * @param {Function} props.onAvatarClick - 背包按钮点击回调函数
 * @param {Function} props.onSettingsClick - 设置按钮点击回调函数
 * @param {string} props.timeText - 游戏时间文本，格式如 "08:30"
 * @param {string} props.weatherIcon - 天气图标，如 "☀" "🌧" "💨"
 * 
 * @returns {JSX.Element} 渲染的 HUD 状态栏
 * 
 * 使用示例：
 * <HUDBar 
 *   gameSize={{ multiplier: 2, width: 480 }}
 *   onAvatarClick={() => setShowInventory(true)}
 *   onSettingsClick={() => setShowSettings(true)}
 *   timeText="08:30"
 *   weatherIcon="☀"
 * />
 */
const HUDBar = ({ gameSize, avatarUrl, onAvatarClick, onSettingsClick, timeText, weatherIcon }) => {
  // 从游戏尺寸对象中提取缩放倍数和游戏宽度
  const { multiplier, width: gameWidth } = gameSize;
  
  return (
    <Bar multiplier={multiplier} gameWidth={gameWidth}>
      {/* 左侧：背包/库存按钮 */}
      <PixelButton multiplier={multiplier} onClick={onAvatarClick}>
        👜 {/* 背包图标，点击打开库存界面 */}
      </PixelButton>
      
      {/* 中央：游戏信息显示区域 */}
      <Info multiplier={multiplier}>
        <span>{weatherIcon || '☀'}</span>  {/* 天气图标，默认为太阳 */}
        <span>{timeText || '--:--'}</span> {/* 游戏时间，默认为占位符 */}
      </Info>
      
      {/* 右侧：设置按钮 */}
      <PixelButton multiplier={multiplier} onClick={onSettingsClick}>
        ⚙ {/* 设置图标，点击打开设置菜单 */}
      </PixelButton>
    </Bar>
  );
};

export default HUDBar;

