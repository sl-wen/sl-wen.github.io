/**
 * 游戏设置模态窗口组件
 * 
 * 提供游戏的基本设置功能，包括保存游戏、退出游戏等选项
 * 
 * 主要功能：
 * - 手动保存游戏进度到云端
 * - 退出游戏返回主菜单或刷新页面
 * - 关闭设置窗口继续游戏
 * - 像素风格UI设计，与游戏整体风格一致
 * 
 * 使用方法：
 * <SettingsModal 
 *   gameSize={gameSize}           // 游戏尺寸对象
 *   onSave={handleSave}           // 保存游戏回调
 *   onExit={handleExit}           // 退出游戏回调
 *   onClose={handleClose}         // 关闭窗口回调
 * />
 * 
 * 设计特点：
 * - 模态窗口设计，半透明遮罩突出设置内容
 * - 像素风格边框和字体，保持游戏风格一致性
 * - 响应式设计，根据游戏缩放倍数调整大小
 * - 简洁直观的按钮布局，便于操作
 */

import React from 'react';
import { styled } from '@mui/material/styles';

/**
 * 模态窗口遮罩层样式组件
 * 
 * 创建全屏半透明遮罩，用于突出设置窗口内容
 * 点击遮罩区域可关闭设置窗口
 */
const Overlay = styled('div')(({ multiplier }) => ({
  position: 'fixed',                   // 固定定位，覆盖整个视窗
  inset: 0,                           // 填满全屏（top:0, right:0, bottom:0, left:0）
  background: 'rgba(0,0,0,0.5)',      // 半透明黑色遮罩
  display: 'flex',                    // 弹性布局
  alignItems: 'center',               // 垂直居中
  justifyContent: 'center',           // 水平居中
  zIndex: 1100,                       // 高层级，覆盖游戏内容
}));

/**
 * 设置窗口主体样式组件
 * 
 * 像素风格的设置窗口容器，包含所有设置选项
 * 使用游戏内对话框边框样式保持风格一致
 */
const Window = styled('div')(({ multiplier, width, height }) => ({
  imageRendering: 'pixelated',
  fontFamily: '"Press Start 2P"',
  textTransform: 'uppercase',
  backgroundColor: '#e2b27e',
  border: 'solid',
  borderImage: `url("/game/assets/images/dialog_borderbox.png") 6 / ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px ${6 * multiplier}px stretch`,
  padding: `${10 * multiplier}px`,
  width: `${Math.ceil(width * 0.5)}px`,
  height: `${Math.ceil(height * 0.5)}px`,
  maxWidth: `${Math.ceil(width * 0.9)}px`,
  maxHeight: `${Math.ceil(height * 0.9)}px`,
  color: '#1b0f0a',
  display: 'flex',
  flexDirection: 'column',
  gap: `${10 * multiplier}px`,
  position: 'relative'
}));

/**
 * 设置按钮样式组件
 * 
 * 像素风格的按钮，用于各种设置操作
 * 包括保存、退出、关闭等功能
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
 * 设置模态窗口主组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.gameSize - 游戏尺寸对象，包含width、height、multiplier
 * @param {Function} props.onSave - 保存游戏时的回调函数
 * @param {Function} props.onExit - 退出游戏时的回调函数  
 * @param {Function} props.onClose - 关闭设置窗口时的回调函数
 * 
 * @returns {JSX.Element} 渲染的设置模态窗口
 * 
 * 功能说明：
 * - 💾 保存：手动保存当前游戏进度到云端
 * - 🚪 退出：退出游戏，返回主菜单或刷新页面
 * - 关闭：关闭设置窗口，继续当前游戏
 * 
 * 使用示例：
 * <SettingsModal 
 *   gameSize={{ width: 480, height: 270, multiplier: 2 }}
 *   onSave={() => saveGameToCloud()}
 *   onExit={() => exitToMainMenu()}
 *   onClose={() => setShowSettings(false)}
 * />
 */
const SettingsModal = ({ gameSize, onSave, onExit, onClose }) => {
  // 从游戏尺寸对象中提取宽度、高度和缩放倍数
  const { width, height, multiplier } = gameSize;
  
  return (
    // 遮罩层：点击遮罩区域关闭设置窗口
    <Overlay multiplier={multiplier} onClick={onClose}>
      {/* 设置窗口：阻止事件冒泡，避免点击窗口内容时关闭 */}
      <Window 
        multiplier={multiplier} 
        width={width} 
        height={height} 
        onClick={(e) => e.stopPropagation()}
      >
        <Close multiplier={multiplier} onClick={onClose}>×</Close>
        <Button multiplier={multiplier} onClick={onSave}>
          💾 保存
        </Button>
        <Button multiplier={multiplier} onClick={onExit}>
          🚪 退出
        </Button>
      </Window>
    </Overlay>
  );
};

export default SettingsModal;

