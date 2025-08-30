import * as Phaser from 'phaser';
import { MoveDirection, MoveState } from './PlayerController';

// 触摸控制配置
export interface TouchControllerConfig {
  joystickRadius: number;
  joystickDeadZone: number;
  joystickPosition: { x: number; y: number };
  buttonSize: number;
  buttonSpacing: number;
  enableHapticFeedback: boolean;
  enableVisualFeedback: boolean;
}

// 触摸事件接口
export interface TouchEvent {
  type: 'move' | 'interact' | 'attack' | 'menu';
  direction?: MoveDirection;
  position: { x: number; y: number };
  intensity: number; // 0-1
}

// 虚拟摇杆状态
export interface JoystickState {
  isActive: boolean;
  direction: MoveDirection;
  intensity: number;
  position: { x: number; y: number };
  basePosition: { x: number; y: number };
}

export class TouchController {
  private scene: Phaser.Scene;
  private config: TouchControllerConfig;
  
  // 虚拟摇杆
  private joystickBase: Phaser.GameObjects.Graphics | null = null;
  private joystickHandle: Phaser.GameObjects.Graphics | null = null;
  private joystickState: JoystickState = {
    isActive: false,
    direction: MoveDirection.NONE,
    intensity: 0,
    position: { x: 0, y: 0 },
    basePosition: { x: 0, y: 0 }
  };
  
  // 控制按钮
  private actionButton: Phaser.GameObjects.Graphics | null = null;
  private attackButton: Phaser.GameObjects.Graphics | null = null;
  private menuButton: Phaser.GameObjects.Graphics | null = null;
  
  // 触摸状态
  private activeTouches: Map<number, { x: number; y: number; type: string }> = new Map();
  private isEnabled: boolean = false;
  
  // 事件监听器
  private eventListeners: Map<string, ((event: TouchEvent) => void)[]> = new Map();

  constructor(scene: Phaser.Scene, config: Partial<TouchControllerConfig> = {}) {
    this.scene = scene;
    this.config = {
      joystickRadius: 60,
      joystickDeadZone: 10,
      joystickPosition: { x: 100, y: 500 },
      buttonSize: 50,
      buttonSpacing: 20,
      enableHapticFeedback: true,
      enableVisualFeedback: true,
      ...config
    };

    this.joystickState.basePosition = { ...this.config.joystickPosition };
    this.initializeTouchEvents();
  }

  // 初始化触摸事件
  private initializeTouchEvents(): void {
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
  }

  // 启用触摸控制
  public enable(): void {
    this.isEnabled = true;
    this.createVirtualControls();
    this.showControls();
  }

  // 禁用触摸控制
  public disable(): void {
    this.isEnabled = false;
    this.hideControls();
    this.resetJoystickPosition();
  }

  // 创建虚拟控制
  private createVirtualControls(): void {
    this.createJoystick();
    this.createActionButtons();
  }

  // 创建虚拟摇杆
  private createJoystick(): void {
    const { x, y } = this.config.joystickPosition;
    const radius = this.config.joystickRadius;

    // 摇杆底座
    this.joystickBase = this.scene.add.graphics();
    this.joystickBase.fillStyle(0x000000, 0.3);
    this.joystickBase.fillCircle(x, y, radius);
    this.joystickBase.lineStyle(2, 0xffffff, 0.5);
    this.joystickBase.strokeCircle(x, y, radius);
    this.joystickBase.setScrollFactor(0);
    this.joystickBase.setDepth(1000);

    // 摇杆手柄
    this.joystickHandle = this.scene.add.graphics();
    this.joystickHandle.fillStyle(0xffffff, 0.8);
    this.joystickHandle.fillCircle(x, y, radius * 0.4);
    this.joystickHandle.lineStyle(2, 0x000000, 0.3);
    this.joystickHandle.strokeCircle(x, y, radius * 0.4);
    this.joystickHandle.setScrollFactor(0);
    this.joystickHandle.setDepth(1001);
  }

  // 创建动作按钮
  private createActionButtons(): void {
    const buttonSize = this.config.buttonSize;
    const spacing = this.config.buttonSpacing;
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;

    // 交互按钮 (右下角)
    const actionX = screenWidth - buttonSize - spacing;
    const actionY = screenHeight - buttonSize - spacing;
    this.actionButton = this.createButton(actionX, actionY, buttonSize, 'E', 0x4CAF50);

    // 攻击按钮 (右下角，交互按钮左边)
    const attackX = actionX - buttonSize - spacing;
    const attackY = actionY;
    this.attackButton = this.createButton(attackX, attackY, buttonSize, '⚔', 0xF44336);

    // 菜单按钮 (右上角)
    const menuX = screenWidth - buttonSize - spacing;
    const menuY = spacing;
    this.menuButton = this.createButton(menuX, menuY, buttonSize, '☰', 0x2196F3);
  }

  // 创建按钮
  private createButton(x: number, y: number, size: number, text: string, color: number): Phaser.GameObjects.Graphics {
    const button = this.scene.add.graphics();
    
    // 按钮背景
    button.fillStyle(color, 0.8);
    button.fillRoundedRect(x - size/2, y - size/2, size, size, size * 0.2);
    button.lineStyle(2, 0xffffff, 0.5);
    button.strokeRoundedRect(x - size/2, y - size/2, size, size, size * 0.2);
    
    // 按钮文字
    const textObj = this.scene.add.text(x, y, text, {
      fontSize: `${size * 0.4}px`,
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    textObj.setOrigin(0.5);
    textObj.setScrollFactor(0);
    textObj.setDepth(1002);
    
    button.setScrollFactor(0);
    button.setDepth(1001);
    
    // 添加交互数据
    button.setData('buttonType', text);
    button.setData('buttonBounds', { x: x - size/2, y: y - size/2, width: size, height: size });
    
    return button;
  }

  // 显示控制
  private showControls(): void {
    if (this.joystickBase) this.joystickBase.setVisible(true);
    if (this.joystickHandle) this.joystickHandle.setVisible(true);
    if (this.actionButton) this.actionButton.setVisible(true);
    if (this.attackButton) this.attackButton.setVisible(true);
    if (this.menuButton) this.menuButton.setVisible(true);
  }

  // 隐藏控制
  private hideControls(): void {
    if (this.joystickBase) this.joystickBase.setVisible(false);
    if (this.joystickHandle) this.joystickHandle.setVisible(false);
    if (this.actionButton) this.actionButton.setVisible(false);
    if (this.attackButton) this.attackButton.setVisible(false);
    if (this.menuButton) this.menuButton.setVisible(false);
  }

  // 指针按下事件
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.isEnabled) return;

    const { x, y } = pointer;
    const touchId = pointer.id;

    // 检查是否点击了摇杆区域
    if (this.isInJoystickArea(x, y)) {
      this.startJoystick(x, y, touchId);
      return;
    }

    // 检查是否点击了按钮
    const buttonType = this.getButtonAtPosition(x, y);
    if (buttonType) {
      this.handleButtonPress(buttonType, x, y, touchId);
      return;
    }

    // 其他区域作为移动控制
    this.handleTouchMove(x, y, touchId);
  }

  // 指针移动事件
  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isEnabled) return;

    const { x, y } = pointer;
    const touchId = pointer.id;

    // 更新摇杆
    if (this.joystickState.isActive && this.activeTouches.has(touchId)) {
      this.updateJoystick(x, y);
    }

    // 更新触摸移动
    if (this.activeTouches.has(touchId)) {
      this.handleTouchMove(x, y, touchId);
    }
  }

  // 指针抬起事件
  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isEnabled) return;

    const touchId = pointer.id;

    // 停止摇杆
    if (this.joystickState.isActive && this.activeTouches.has(touchId)) {
      this.stopJoystick();
    }

    // 移除触摸
    this.activeTouches.delete(touchId);
  }

  // 检查是否在摇杆区域内
  private isInJoystickArea(x: number, y: number): boolean {
    const { basePosition } = this.joystickState;
    const distance = Phaser.Math.Distance.Between(x, y, basePosition.x, basePosition.y);
    return distance <= this.config.joystickRadius;
  }

  // 开始摇杆
  private startJoystick(x: number, y: number, touchId: number): void {
    this.joystickState.isActive = true;
    this.joystickState.position = { x, y };
    this.activeTouches.set(touchId, { x, y, type: 'joystick' });
    
    this.updateJoystick(x, y);
    
    if (this.config.enableHapticFeedback) {
      this.vibrate(50);
    }
  }

  // 更新摇杆
  private updateJoystick(x: number, y: number): void {
    const { basePosition } = this.joystickState;
    const radius = this.config.joystickRadius;
    
    // 计算距离和方向
    const distance = Phaser.Math.Distance.Between(x, y, basePosition.x, basePosition.y);
    const angle = Phaser.Math.Angle.Between(basePosition.x, basePosition.y, x, y);
    
    // 限制摇杆范围
    const clampedDistance = Math.min(distance, radius);
    const intensity = clampedDistance / radius;
    
    // 死区检查
    if (intensity < this.config.joystickDeadZone / radius) {
      this.joystickState.direction = MoveDirection.NONE;
      this.joystickState.intensity = 0;
      this.resetJoystickVisual();
      return;
    }
    
    // 计算方向
    const direction = this.angleToDirection(angle);
    
    // 更新状态
    this.joystickState.direction = direction;
    this.joystickState.intensity = intensity;
    
    // 更新视觉
    this.updateJoystickVisual(clampedDistance, angle);
    
    // 发送移动事件
    this.emitEvent('move', {
      type: 'move',
      direction,
      position: { x, y },
      intensity
    });
  }

  // 停止摇杆
  private stopJoystick(): void {
    this.joystickState.isActive = false;
    this.joystickState.direction = MoveDirection.NONE;
    this.joystickState.intensity = 0;
    
    this.resetJoystickVisual();
    
    // 发送停止事件
    this.emitEvent('move', {
      type: 'move',
      direction: MoveDirection.NONE,
      position: { x: 0, y: 0 },
      intensity: 0
    });
  }

  // 重置摇杆视觉
  private resetJoystickVisual(): void {
    if (!this.joystickHandle) return;
    
    const { basePosition } = this.joystickState;
    this.joystickHandle.clear();
    this.joystickHandle.fillStyle(0xffffff, 0.8);
    this.joystickHandle.fillCircle(basePosition.x, basePosition.y, this.config.joystickRadius * 0.4);
    this.joystickHandle.lineStyle(2, 0x000000, 0.3);
    this.joystickHandle.strokeCircle(basePosition.x, basePosition.y, this.config.joystickRadius * 0.4);
  }

  // 重置摇杆位置
  private resetJoystickPosition(): void {
    this.joystickState.isActive = false;
    this.joystickState.direction = MoveDirection.NONE;
    this.joystickState.intensity = 0;
    this.resetJoystickVisual();
  }

  // 更新摇杆视觉
  private updateJoystickVisual(distance: number, angle: number): void {
    if (!this.joystickHandle) return;
    
    const { basePosition } = this.joystickState;
    const handleRadius = this.config.joystickRadius * 0.4;
    
    // 计算手柄位置
    const handleX = basePosition.x + Math.cos(angle) * distance;
    const handleY = basePosition.y + Math.sin(angle) * distance;
    
    this.joystickHandle.clear();
    this.joystickHandle.fillStyle(0xffffff, 0.8);
    this.joystickHandle.fillCircle(handleX, handleY, handleRadius);
    this.joystickHandle.lineStyle(2, 0x000000, 0.3);
    this.joystickHandle.strokeCircle(handleX, handleY, handleRadius);
  }

  // 角度转方向
  private angleToDirection(angle: number): MoveDirection {
    // 将角度转换为度数
    const degrees = Phaser.Math.RadToDeg(angle);
    
    // 8方向映射
    if (degrees >= -22.5 && degrees < 22.5) return MoveDirection.RIGHT;
    if (degrees >= 22.5 && degrees < 67.5) return MoveDirection.DOWN_RIGHT;
    if (degrees >= 67.5 && degrees < 112.5) return MoveDirection.DOWN;
    if (degrees >= 112.5 && degrees < 157.5) return MoveDirection.DOWN_LEFT;
    if (degrees >= 157.5 && degrees < 202.5) return MoveDirection.LEFT;
    if (degrees >= 202.5 && degrees < 247.5) return MoveDirection.UP_LEFT;
    if (degrees >= 247.5 && degrees < 292.5) return MoveDirection.UP;
    if (degrees >= 292.5 && degrees < 337.5) return MoveDirection.UP_RIGHT;
    return MoveDirection.RIGHT;
  }

  // 获取指定位置的按钮
  private getButtonAtPosition(x: number, y: number): string | null {
    const buttons = [this.actionButton, this.attackButton, this.menuButton];
    
    for (const button of buttons) {
      if (button) {
        const bounds = button.getData('buttonBounds');
        if (bounds && this.isPointInRect(x, y, bounds)) {
          return button.getData('buttonType');
        }
      }
    }
    
    return null;
  }

  // 检查点是否在矩形内
  private isPointInRect(x: number, y: number, rect: { x: number; y: number; width: number; height: number }): boolean {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  // 处理按钮按下
  private handleButtonPress(buttonType: string, x: number, y: number, touchId: number): void {
    this.activeTouches.set(touchId, { x, y, type: 'button' });
    
    let eventType: string;
    switch (buttonType) {
      case 'E':
        eventType = 'interact';
        break;
      case '⚔':
        eventType = 'attack';
        break;
      case '☰':
        eventType = 'menu';
        break;
      default:
        eventType = 'unknown';
    }
    
    // 发送按钮事件
    this.emitEvent(eventType, {
      type: eventType as 'move' | 'interact' | 'attack' | 'menu',
      position: { x, y },
      intensity: 1
    });
    
    // 触觉反馈
    if (this.config.enableHapticFeedback) {
      this.vibrate(100);
    }
    
    // 视觉反馈
    if (this.config.enableVisualFeedback) {
      this.showButtonFeedback(buttonType);
    }
  }

  // 处理触摸移动
  private handleTouchMove(x: number, y: number, touchId: number): void {
    const touch = this.activeTouches.get(touchId);
    if (!touch || touch.type !== 'move') {
      this.activeTouches.set(touchId, { x, y, type: 'move' });
      return;
    }
    
    // 计算移动方向和强度
    const deltaX = x - touch.x;
    const deltaY = y - touch.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > 10) { // 最小移动阈值
      const angle = Math.atan2(deltaY, deltaX);
      const direction = this.angleToDirection(angle);
      const intensity = Math.min(distance / 100, 1);
      
      // 发送移动事件
      this.emitEvent('move', {
        type: 'move',
        direction,
        position: { x, y },
        intensity
      });
      
      // 更新触摸位置
      this.activeTouches.set(touchId, { x, y, type: 'move' });
    }
  }

  // 显示按钮反馈
  private showButtonFeedback(buttonType: string): void {
    // 这里可以添加按钮按下时的视觉反馈
    // 比如缩放、颜色变化等
  }

  // 触觉反馈
  private vibrate(duration: number): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }

  // 更新方法
  public update(time: number, delta: number): void {
    // 可以在这里添加持续的更新逻辑
  }

  // 事件监听
  public on(event: string, callback: (event: TouchEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (event: TouchEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 发送事件
  private emitEvent(type: string, data: TouchEvent): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in touch controller event listener:', error);
        }
      });
    }
  }

  // 获取摇杆状态
  public getJoystickState(): JoystickState {
    return { ...this.joystickState };
  }

  // 设置配置
  public setConfig(config: Partial<TouchControllerConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 重新创建控制
    if (this.isEnabled) {
      this.destroy();
      this.createVirtualControls();
    }
  }

  // 销毁
  public destroy(): void {
    this.disable();
    
    // 清理事件监听器
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    
    // 清理图形对象
    if (this.joystickBase) this.joystickBase.destroy();
    if (this.joystickHandle) this.joystickHandle.destroy();
    if (this.actionButton) this.actionButton.destroy();
    if (this.attackButton) this.attackButton.destroy();
    if (this.menuButton) this.menuButton.destroy();
    
    // 清理状态
    this.activeTouches.clear();
    this.eventListeners.clear();
  }
}