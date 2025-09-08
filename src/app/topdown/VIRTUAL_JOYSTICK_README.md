# 虚拟摇杆使用说明

## 概述

本项目已成功集成了虚拟摇杆控制系统，让玩家可以在手机屏幕上通过触摸控制游戏人物移动。

## 功能特性

### 🎮 虚拟摇杆
- **位置**: 固定在屏幕左下角
- **大小**: 120x120像素
- **功能**: 控制人物上下左右移动
- **支持**: 触摸和鼠标操作（开发测试用）

### ⚔️ 动作按钮
- **位置**: 固定在屏幕右下角
- **大小**: 80x80像素
- **功能**: 执行攻击等动作
- **支持**: 触摸和鼠标操作

## 使用方法

### 移动控制
1. **触摸虚拟摇杆**: 用手指触摸并拖动摇杆
2. **方向指示**: 摇杆周围有方向箭头指示
3. **移动范围**: 摇杆移动范围限制在35像素内
4. **自动回中**: 松开手指后摇杆自动回到中心位置

> 显示条件：`hasGameStarted && gameSize.isMobile` 为真时才渲染虚拟摇杆

### 动作控制
1. **触摸动作按钮**: 点击红色圆形按钮执行动作
2. **视觉反馈**: 按钮按下时会有缩放和颜色变化效果

> 显示条件：`hasGameStarted && gameSize.isMobile` 为真时才渲染动作按钮

## 技术实现

### 组件结构
```
src/app/topdown/game/
├── VirtualJoystick.js    # 虚拟摇杆组件
├── ActionButton.js       # 动作按钮组件
├── InputManager.js       # 输入管理器
└── scenes/
    └── GameScene.js      # 游戏场景（已集成）
```

### 输入系统
- **统一管理**: InputManager统一处理键盘和触摸输入
- **事件驱动**: 通过CustomEvent在组件间通信
- **优先级**: 虚拟摇杆输入优先级高于键盘输入

#### 事件约定（React ↔ Phaser）
- `virtual-joystick-direction`：当方向改变时由 React 派发
  - detail: `{ direction: 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right'|'none', dx?, dy?, angle? }`
- `action-button-pressed`：点击动作按钮时由 React 派发
- `action-context`：由游戏场景告知当前动作语义（talk/interact/plant/water/harvest），用于渲染按钮图标/文案

### 触摸事件处理
- **触摸开始**: 记录触摸位置，激活摇杆
- **触摸移动**: 计算方向，限制移动范围
- **触摸结束**: 重置摇杆状态，停止移动

## 自定义配置

### 摇杆样式
```javascript
// 修改摇杆大小
const JoystickContainer = styled('div')(({ theme, gameSize }) => ({
  width: '120px',    // 修改宽度
  height: '120px',   // 修改高度
  bottom: '20px',    // 修改底部距离
  left: '20px',      // 修改左侧距离
}));

// 修改摇杆移动范围
const maxDistance = 35; // 修改最大移动距离
```

### 按钮样式
```javascript
// 修改按钮大小和位置
const ActionButtonContainer = styled('div')(({ theme, gameSize }) => ({
  width: '80px',     // 修改宽度
  height: '80px',    // 修改高度
  bottom: '20px',    // 修改底部距离
  right: '20px',     // 修改右侧距离
}));
```

## 兼容性

### 设备支持
- ✅ 移动设备（触摸屏）
- ✅ 桌面设备（鼠标）
- ✅ 响应式设计

### 浏览器支持
- ✅ Chrome (移动版/桌面版)
- ✅ Safari (iOS/桌面版)
- ✅ Firefox (移动版/桌面版)
- ✅ Edge (移动版/桌面版)

## 故障排除

### 常见问题

1. **摇杆无响应**
   - 检查触摸事件是否被阻止
   - 确认组件是否正确挂载
   - 查看浏览器控制台错误

2. **移动不流畅**
   - 检查触摸事件频率
   - 确认游戏帧率设置
   - 优化触摸事件处理

3. **按钮不工作**
   - 检查事件监听器是否正确设置
   - 确认CustomEvent是否正确发送
   - 验证InputManager是否正确集成

### 调试技巧

1. **启用触摸调试**
   ```javascript
   // 在虚拟摇杆组件中添加调试信息
   console.log('Touch event:', event);
   console.log('Direction:', direction);
   ```

2. **检查事件流**
   ```javascript
   // 在InputManager中添加日志
   console.log('Input direction:', this.currentDirection);
   console.log('Action button:', this.actionButtonPressed);
   ```

3. **验证游戏集成**
   ```javascript
   // 在GameScene中添加日志
   console.log('Grid engine move:', direction);
   ```

## 性能优化

### 触摸事件优化
- 使用 `passive: false` 防止默认行为
- 限制触摸事件频率
- 优化触摸位置计算

### 渲染优化
- 使用CSS transform进行动画
- 避免频繁的DOM操作
- 使用requestAnimationFrame优化动画

## 扩展功能

### 可添加的功能
1. **多指触摸支持**: 支持同时触摸多个按钮
2. **手势识别**: 添加滑动、长按等手势
3. **自定义布局**: 允许用户自定义按钮位置
4. **触觉反馈**: 在支持的设备上添加震动反馈

### 实现示例
```javascript
// 多指触摸支持
const handleMultiTouch = (event) => {
  if (event.touches.length > 1) {
    // 处理多指触摸逻辑
  }
};

// 手势识别
const handleGesture = (event) => {
  // 实现滑动、长按等手势
};
```

## 许可证

本虚拟摇杆系统遵循项目主许可证。