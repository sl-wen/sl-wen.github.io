/**
 * 动作按钮组件
 * 
 * 为触摸屏设备提供动作执行功能，模拟传统游戏手柄的按钮操作
 * 支持触摸和鼠标点击，提供视觉反馈和触觉响应
 * 
 * 主要功能：
 * - 触摸屏友好的动作按钮
 * - 支持自定义图标和标签
 * - 按下状态的视觉反馈（颜色变化、缩放效果）
 * - 响应式设计，适应不同屏幕尺寸
 * - 支持触摸和鼠标操作
 * 
 * 使用方法：
 * 1. 在游戏界面中引入组件
 * 2. 传入 onAction 回调函数处理按钮按下事件
 * 3. 传入 gameSize 对象以适配游戏尺寸
 * 4. 可选传入 icon 和 label 自定义按钮外观
 * 5. 组件会自动处理触摸和鼠标事件
 * 
 * 事件输出：
 * - 按钮按下时调用 onAction() 回调函数
 * - 支持触摸和鼠标两种输入方式
 */

import React, { useEffect, useRef, useState } from 'react';
import { styled } from '@mui/material/styles';

/**
 * 动作按钮容器样式组件
 * 固定在屏幕右下角，设置按钮的基础样式和位置
 */
const ActionButtonContainer = styled('div')(({ theme, gameSize }) => ({
  position: 'fixed',
  bottom: '90px',
  right: '20px',
  zIndex: 1000,
  width: '100px',  // 从80px增加到100px，提供更大的触摸区域
  height: '100px', // 从80px增加到100px，提供更大的触摸区域
  touchAction: 'none',        // 禁用默认触摸行为
  userSelect: 'none',         // 禁用文本选择
  WebkitUserSelect: 'none',   // Webkit 浏览器兼容性
  WebkitTouchCallout: 'none', // 禁用触摸长按菜单
}));

/**
 * 动作按钮基础样式组件
 * 按钮的主要外观，根据按下状态改变样式
 */
const ActionButtonBase = styled('div')(({ theme, isPressed }) => ({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: isPressed 
    ? 'rgba(255, 100, 100, 0.8)'    // 按下状态：更深的红色
    : 'rgba(255, 100, 100, 0.6)',   // 正常状态：较浅的红色
  border: '2px solid rgba(255, 255, 255, 0.8)', // 白色边框
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',      // 背景模糊效果
  cursor: 'pointer',
  transition: 'all 0.1s ease-out',   // 平滑的过渡动画
  transform: isPressed ? 'scale(0.95)' : 'scale(1)', // 按下时缩小效果
  boxShadow: isPressed 
    ? '0 0 20px rgba(255, 100, 100, 0.6)'    // 按下状态：发光效果
    : '0 2px 10px rgba(0, 0, 0, 0.3)',       // 正常状态：阴影效果
}));

/**
 * 按钮图标样式组件
 * 显示按钮的功能图标（如剑、盾牌等）
 */
const ButtonIcon = styled('div')(({ theme }) => ({
  fontSize: '32px', // 从24px增加到32px，提供更好的视觉效果
  color: 'rgba(255, 255, 255, 0.9)', // 白色图标，略微透明
  fontWeight: 'bold',
  textAlign: 'center',
  lineHeight: '1',
}));

/**
 * 动作按钮主组件
 * 
 * @param {Function} onAction - 按钮按下时的回调函数
 * @param {Object} gameSize - 游戏尺寸对象，包含 width, height, multiplier
 * @param {string} icon - 按钮图标，默认为剑符号 '⚔️'
 * @param {string} label - 按钮标签，默认为 'Attack'
 */
const ActionButton = ({ onAction, gameSize, icon = '⚔️', label = 'Attack' }) => {
  // 组件状态管理
  const [isPressed, setIsPressed] = useState(false);  // 按钮是否被按下
  
  // 引用和状态管理
  const containerRef = useRef(null);        // 容器 DOM 引用
  const isTouching = useRef(false);         // 是否正在触摸

  /**
   * 设置事件监听器
   * 处理触摸和鼠标事件
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /**
     * 触摸开始事件处理
     * @param {TouchEvent} e - 触摸事件对象
     */
    const handleTouchStart = (e) => {
      e.preventDefault();
      setIsPressed(true);
      isTouching.current = true;
      // 调用动作回调函数
      onAction && onAction();
    };

    /**
     * 触摸结束事件处理
     * @param {TouchEvent} e - 触摸事件对象
     */
    const handleTouchEnd = (e) => {
      e.preventDefault();
      setIsPressed(false);
      isTouching.current = false;
    };

    /**
     * 鼠标按下事件处理
     * @param {MouseEvent} e - 鼠标事件对象
     */
    const handleMouseDown = (e) => {
      e.preventDefault();
      setIsPressed(true);
      // 调用动作回调函数
      onAction && onAction();
    };

    /**
     * 鼠标释放事件处理
     * @param {MouseEvent} e - 鼠标事件对象
     */
    const handleMouseUp = (e) => {
      e.preventDefault();
      setIsPressed(false);
    };

    /**
     * 鼠标离开事件处理
     * @param {MouseEvent} e - 鼠标事件对象
     */
    const handleMouseLeave = (e) => {
      e.preventDefault();
      setIsPressed(false);
    };

    // 添加触摸事件监听器
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 添加鼠标事件监听器（用于开发测试和桌面设备）
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    // 清理事件监听器
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [onAction]);

  return (
    <ActionButtonContainer ref={containerRef} gameSize={gameSize}>
      <ActionButtonBase isPressed={isPressed}>
        <ButtonIcon>{icon}</ButtonIcon>
      </ActionButtonBase>
    </ActionButtonContainer>
  );
};

export default ActionButton;