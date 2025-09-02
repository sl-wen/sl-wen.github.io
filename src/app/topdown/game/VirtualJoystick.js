/**
 * 虚拟摇杆组件
 * 
 * 为触摸屏设备提供方向控制功能，模拟传统游戏手柄的摇杆操作
 * 支持触摸拖拽和鼠标拖拽，自动检测方向并发送事件
 * 
 * 主要功能：
 * - 触摸屏友好的虚拟摇杆控制
 * - 支持 8 个方向（上、下、左、右、左上、右上、左下、右下）
 * - 自动检测触摸/鼠标拖拽操作
 * - 响应式设计，适应不同屏幕尺寸
 * - 视觉反馈，显示当前操作状态
 * 
 * 使用方法：
 * 1. 在游戏界面中引入组件
 * 2. 传入 onDirectionChange 回调函数处理方向变化
 * 3. 传入 gameSize 对象以适配游戏尺寸
 * 4. 组件会自动处理触摸和鼠标事件
 * 
 * 事件输出：
 * - 方向变化时调用 onDirectionChange(direction)
 * - direction 可能的值：'up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right', null
 */

import React, { useEffect, useRef, useState } from 'react';
import { styled } from '@mui/material/styles';

/**
 * 摇杆容器样式组件
 * 固定在屏幕左下角，设置摇杆的基础样式和位置
 */
const JoystickContainer = styled('div')(({ theme, gameSize }) => ({
  position: 'fixed',
  bottom: '120px',
  left: '20px',
  zIndex: 1000,
  width: '160px', // 从120px增加到160px，提供更大的操作区域
  height: '160px', // 从120px增加到160px，提供更大的操作区域
  touchAction: 'none',        // 禁用默认触摸行为
  userSelect: 'none',         // 禁用文本选择
  WebkitUserSelect: 'none',   // Webkit 浏览器兼容性
  WebkitTouchCallout: 'none', // 禁用触摸长按菜单
}));

/**
 * 摇杆底座样式组件
 * 摇杆的背景圆形区域，提供视觉参考
 */
const JoystickBase = styled('div')(({ theme }) => ({
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',      // 半透明黑色背景
  border: '2px solid rgba(255, 255, 255, 0.5)', // 白色半透明边框
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',                 // 背景模糊效果
}));

/**
 * 摇杆手柄样式组件
 * 可拖拽的摇杆手柄，根据操作状态改变样式
 */
const JoystickStick = styled('div')(({ theme, isActive, position }) => ({
  width: '60px',  // 从50px增加到60px，提供更好的触摸体验
  height: '60px', // 从50px增加到60px，提供更好的触摸体验
  borderRadius: '50%',
  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
  border: '2px solid rgba(255, 255, 255, 0.8)',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
  transition: isActive ? 'none' : 'all 0.2s ease-out', // 非激活状态下的平滑过渡
  cursor: 'pointer',
  boxShadow: isActive 
    ? '0 0 20px rgba(255, 255, 255, 0.6)'    // 激活状态下的发光效果
    : '0 2px 10px rgba(0, 0, 0, 0.3)',       // 非激活状态下的阴影
}));

/**
 * 虚拟摇杆主组件
 * 
 * @param {Function} onDirectionChange - 方向变化回调函数
 * @param {Object} gameSize - 游戏尺寸对象，包含 width, height, multiplier
 */
const VirtualJoystick = ({ onDirectionChange, gameSize }) => {
  // 组件状态管理
  const [isActive, setIsActive] = useState(false);           // 摇杆是否处于激活状态
  const [position, setPosition] = useState({ x: 0, y: 0 }); // 摇杆手柄的当前位置
  const [currentDirection, setCurrentDirection] = useState(null); // 当前检测到的方向
  
  // 引用和状态管理
  const containerRef = useRef(null);        // 容器 DOM 引用
  const isDragging = useRef(false);         // 是否正在拖拽
  const startPos = useRef({ x: 0, y: 0 }); // 拖拽开始位置
  const centerPos = useRef({ x: 0, y: 0 }); // 摇杆中心位置
  const currentDirectionRef = useRef(null); // 使用 ref 保存最新方向，避免闭包陈旧值

  /**
   * 设置触摸事件监听器
   * 处理触摸屏设备的操作
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
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      
      // 计算摇杆中心位置
      centerPos.current = {
        x: rect.width / 2,
        y: rect.height / 2
      };
      
      // 记录触摸开始位置
      startPos.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
      
      setIsActive(true);
      isDragging.current = true;
    };

    /**
     * 触摸移动事件处理
     * @param {TouchEvent} e - 触摸事件对象
     */
    const handleTouchMove = (e) => {
      e.preventDefault();
      if (!isDragging.current) return;

      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      
      // 计算触摸位置相对于摇杆中心的偏移
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;
      
      // 计算偏移量
      const deltaX = touchX - centerPos.current.x;
      const deltaY = touchY - centerPos.current.y;
      
      // 限制摇杆移动范围（最大半径）
      const maxRadius = 40;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > maxRadius) {
        const angle = Math.atan2(deltaY, deltaX);
        const limitedX = Math.cos(angle) * maxRadius;
        const limitedY = Math.sin(angle) * maxRadius;
        
        setPosition({ x: limitedX, y: limitedY });
      } else {
        setPosition({ x: deltaX, y: deltaY });
      }
      
      // 检测方向并更新
      updateDirection(deltaX, deltaY);
    };

    /**
     * 触摸结束事件处理
     */
    const handleTouchEnd = () => {
      setIsActive(false);
      isDragging.current = false;
      setPosition({ x: 0, y: 0 });
      // 无条件重置方向并派发事件，避免闭包导致的未清空
      currentDirectionRef.current = null;
      setCurrentDirection(null);
      onDirectionChange(null);
    };

    // 添加触摸事件监听器（包含全局兜底，防止手指移出容器后不触发）
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // 清理事件监听器
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  /**
   * 设置鼠标事件监听器
   * 处理桌面设备的鼠标操作
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /**
     * 鼠标按下事件处理
     * @param {MouseEvent} e - 鼠标事件对象
     */
    const handleMouseDown = (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      
      // 计算摇杆中心位置
      centerPos.current = {
        x: rect.width / 2,
        y: rect.height / 2
      };
      
      // 记录鼠标按下位置
      startPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      setIsActive(true);
      isDragging.current = true;
    };

    /**
     * 鼠标移动事件处理
     * @param {MouseEvent} e - 鼠标事件对象
     */
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;

      const rect = container.getBoundingClientRect();
      
      // 计算鼠标位置相对于摇杆中心的偏移
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 计算偏移量
      const deltaX = mouseX - centerPos.current.x;
      const deltaY = mouseY - centerPos.current.y;
      
      // 限制摇杆移动范围（最大半径）
      const maxRadius = 40;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > maxRadius) {
        const angle = Math.atan2(deltaY, deltaX);
        const limitedX = Math.cos(angle) * maxRadius;
        const limitedY = Math.sin(angle) * maxRadius;
        
        setPosition({ x: limitedX, y: limitedY });
      } else {
        setPosition({ x: deltaX, y: deltaY });
      }
      
      // 检测方向并更新
      updateDirection(deltaX, deltaY);
    };

    /**
     * 鼠标释放事件处理
     */
    const handleMouseUp = () => {
      setIsActive(false);
      isDragging.current = false;
      setPosition({ x: 0, y: 0 });
      // 无条件重置方向并派发事件，避免闭包导致的未清空
      currentDirectionRef.current = null;
      setCurrentDirection(null);
      onDirectionChange(null);
    };

    // 添加鼠标事件监听器
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // 清理事件监听器
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  /**
   * 更新方向状态
   * 根据摇杆位置计算当前方向并通知父组件
   * 
   * @param {number} deltaX - X 轴偏移量
   * @param {number} deltaY - Y 轴偏移量
   */
  const updateDirection = (deltaX, deltaY) => {
    // 设置方向检测的阈值
    const threshold = 10;
    let direction = null;

    // 检测 8 个方向
    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      if (deltaY < -threshold && Math.abs(deltaX) < threshold) {
        direction = 'up';
      } else if (deltaY > threshold && Math.abs(deltaX) < threshold) {
        direction = 'down';
      } else if (deltaX < -threshold && Math.abs(deltaY) < threshold) {
        direction = 'left';
      } else if (deltaX > threshold && Math.abs(deltaY) < threshold) {
        direction = 'right';
      } else if (deltaY < -threshold && deltaX < -threshold) {
        direction = 'up-left';
      } else if (deltaY < -threshold && deltaX > threshold) {
        direction = 'up-right';
      } else if (deltaY > threshold && deltaX < -threshold) {
        direction = 'down-left';
      } else if (deltaY > threshold && deltaX > threshold) {
        direction = 'down-right';
      }
    }

    // 如果方向发生变化，通知父组件
    if (direction !== currentDirection) {
      setCurrentDirection(direction);
      currentDirectionRef.current = direction;
      onDirectionChange(direction);
    }
  };

  return (
    <JoystickContainer ref={containerRef} gameSize={gameSize}>
      <JoystickBase>
        
        {/* 摇杆手柄 */}
        <JoystickStick 
          isActive={isActive} 
          position={position}
        />
      </JoystickBase>
    </JoystickContainer>
  );
};

export default VirtualJoystick;